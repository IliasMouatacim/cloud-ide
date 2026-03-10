import React, { useRef, useEffect, useCallback } from 'react';

export default function Terminal() {
  const termRef = useRef(null);
  const xtermRef = useRef(null);
  const wsRef = useRef(null);
  const fitAddonRef = useRef(null);

  const connect = useCallback(async () => {
    // Dynamically import xterm to avoid SSR issues
    const { Terminal: XTerm } = await import('@xterm/xterm');
    const { FitAddon } = await import('@xterm/addon-fit');

    // Load xterm CSS
    if (!document.querySelector('link[href*="xterm"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/css/xterm.min.css';
      document.head.appendChild(link);
    }

    if (xtermRef.current) {
      xtermRef.current.dispose();
    }

    const term = new XTerm({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      theme: {
        background: '#11111b',
        foreground: '#cdd6f4',
        cursor: '#f5e0dc',
        selectionBackground: '#45475a',
        black: '#45475a',
        red: '#f38ba8',
        green: '#a6e3a1',
        yellow: '#f9e2af',
        blue: '#89b4fa',
        magenta: '#cba6f7',
        cyan: '#89dceb',
        white: '#bac2de',
        brightBlack: '#585b70',
        brightRed: '#f38ba8',
        brightGreen: '#a6e3a1',
        brightYellow: '#f9e2af',
        brightBlue: '#89b4fa',
        brightMagenta: '#cba6f7',
        brightCyan: '#89dceb',
        brightWhite: '#a6adc8',
      },
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    fitAddonRef.current = fitAddon;

    if (termRef.current) {
      term.open(termRef.current);
      setTimeout(() => fitAddon.fit(), 0);
    }

    xtermRef.current = term;

    // On serverless hosts (Vercel, Netlify) there's no WebSocket server,
    // so skip the connection attempt and go straight to local mode.
    const isServerless = window.location.hostname.includes('vercel.app')
      || window.location.hostname.includes('netlify.app')
      || !window.location.hostname.includes('localhost');

    if (isServerless) {
      term.writeln('\x1b[1;34m☁ Cloud IDE Terminal\x1b[0m');
      term.writeln('\x1b[90mBrowser-based shell • Type "help" for commands\x1b[0m');
      term.writeln('');
      enableLocalMode(term);
      return;
    }

    // Connect to WebSocket (local dev / self-hosted server)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?type=terminal`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      let connected = false;

      ws.onopen = () => {
        connected = true;
        term.writeln('\x1b[1;34m☁ Cloud IDE Terminal\x1b[0m');
        term.writeln('\x1b[90mConnected to server.\x1b[0m');
        term.writeln('');
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'terminal:data') {
            term.write(msg.data);
          } else if (msg.type === 'terminal:exit') {
            term.writeln('\r\n\x1b[90mTerminal session ended.\x1b[0m');
          }
        } catch {
          term.write(event.data);
        }
      };

      ws.onerror = () => {
        if (!connected) {
          term.writeln('\x1b[1;34m☁ Cloud IDE Terminal\x1b[0m');
          term.writeln('\x1b[90mBrowser-based shell • Type "help" for commands\x1b[0m');
          term.writeln('');
          enableLocalMode(term);
        }
      };

      ws.onclose = () => {
        if (connected) {
          term.writeln('\r\n\x1b[90mSession ended. Switching to local mode.\x1b[0m');
          term.writeln('');
          enableLocalMode(term);
        }
      };

      term.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'terminal:input', data }));
        }
      });

      term.onResize(({ cols, rows }) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'terminal:resize', cols, rows }));
        }
      });
    } catch {
      term.writeln('\x1b[1;34m☁ Cloud IDE Terminal\x1b[0m');
      term.writeln('\x1b[90mBrowser-based shell • Type "help" for commands\x1b[0m');
      term.writeln('');
      enableLocalMode(term);
    }
  }, []);

  useEffect(() => {
    connect();

    const handleResize = () => {
      if (fitAddonRef.current) {
        try { fitAddonRef.current.fit(); } catch {}
      }
    };

    window.addEventListener('resize', handleResize);

    // Watch the container for size changes
    const observer = new ResizeObserver(handleResize);
    if (termRef.current) observer.observe(termRef.current);

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
      if (wsRef.current) wsRef.current.close();
      if (xtermRef.current) xtermRef.current.dispose();
    };
  }, [connect]);

  return (
    <div className="h-full flex flex-col bg-ide-panel">
      <div className="flex items-center justify-between px-3 py-1 border-b border-ide-border shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-ide-textMuted uppercase tracking-wider">Terminal</span>
          <span className="text-[10px] px-1.5 py-0.5 bg-ide-bg rounded text-ide-textMuted">bash</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={connect}
            className="text-ide-textMuted hover:text-ide-text text-xs p-1 rounded hover:bg-ide-bg/50"
            title="New Terminal"
          >
            +
          </button>
        </div>
      </div>
      <div ref={termRef} className="flex-1 overflow-hidden" />
    </div>
  );
}

function enableLocalMode(term) {
  let buffer = '';
  const commands = {
    help: 'Available: help, echo, date, clear, whoami, pwd, ls, cat',
    date: new Date().toISOString(),
    whoami: 'cloud-ide-user',
    pwd: '/home/user/project',
    ls: 'index.html  script.js  style.css',
    clear: '\x1b[2J\x1b[H',
  };

  term.writeln('');
  term.write('$ ');

  term.onData((data) => {
    if (data === '\r') {
      const cmd = buffer.trim();
      buffer = '';
      term.write('\r\n');

      if (!cmd) {
        term.write('$ ');
        return;
      }

      const parts = cmd.split(/\s+/);
      const base = parts[0];

      if (base === 'echo') {
        term.writeln(parts.slice(1).join(' '));
      } else if (base === 'clear') {
        term.write('\x1b[2J\x1b[H');
      } else if (commands[base]) {
        term.writeln(commands[base]);
      } else {
        term.writeln(`\x1b[31mcommand not found: ${base}\x1b[0m`);
      }
      term.write('$ ');
    } else if (data === '\x7f') {
      if (buffer.length > 0) {
        buffer = buffer.slice(0, -1);
        term.write('\b \b');
      }
    } else if (data >= ' ') {
      buffer += data;
      term.write(data);
    }
  });
}
