import React, { useRef, useEffect, useCallback } from 'react';

export default function Terminal() {
  const termRef = useRef(null);
  const xtermRef = useRef(null);
  const wsRef = useRef(null);
  const fitAddonRef = useRef(null);
  const localRunnerRef = useRef(null);

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
      localRunnerRef.current = enableLocalMode(term);
      return;
    }

    // Connect to WebSocket (local dev / self-hosted server)
    let wsUrl = '';
    if (import.meta.env.VITE_API_URL) {
      // Convert http:// to ws:// and https:// to wss://
      wsUrl = import.meta.env.VITE_API_URL.replace(/^http/, 'ws') + '/ws?type=terminal';
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${protocol}//${window.location.host}/ws?type=terminal`;
    }

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
          localRunnerRef.current = enableLocalMode(term);
        }
      };

      ws.onclose = () => {
        if (connected) {
          term.writeln('\r\n\x1b[90mSession ended. Switching to local mode.\x1b[0m');
          term.writeln('');
          localRunnerRef.current = enableLocalMode(term);
        }
      };

      localRunnerRef.current = null;

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
      localRunnerRef.current = enableLocalMode(term);
    }
  }, []);

  useEffect(() => {
    connect();

    const handleResize = () => {
      if (fitAddonRef.current) {
        try { fitAddonRef.current.fit(); } catch { }
      }
    };

    window.addEventListener('resize', handleResize);

    const handleRunCommand = (event) => {
      const command = event?.detail?.command?.trim();
      if (!command) return;

      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'terminal:input', data: `${command}\r` }));
        return;
      }

      if (localRunnerRef.current) {
        localRunnerRef.current(command);
      }
    };

    window.addEventListener('cloud-ide:run-command', handleRunCommand);

    // Watch the container for size changes
    const observer = new ResizeObserver(handleResize);
    if (termRef.current) observer.observe(termRef.current);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('cloud-ide:run-command', handleRunCommand);
      observer.disconnect();
      if (wsRef.current) wsRef.current.close();
      if (xtermRef.current) xtermRef.current.dispose();
      localRunnerRef.current = null;
    };
  }, [connect]);

  return (
    <div className="h-full flex flex-col bg-ide-panel">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-ide-border shrink-0">
        <div className="flex items-center gap-2">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ide-textMuted">
            <path d="M4 17l6-5-6-5M12 19h8" />
          </svg>
          <span className="text-[11px] font-semibold text-ide-textMuted uppercase tracking-widest">Terminal</span>
          <span className="text-[10px] px-1.5 py-[1px] bg-ide-bg/80 rounded-md text-ide-textSubtle font-medium">bash</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={connect}
            className="text-ide-textMuted hover:text-ide-text p-1 rounded-md hover:bg-ide-bg/50 transition-colors"
            title="New Terminal"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      </div>
      <div ref={termRef} className="flex-1 overflow-hidden" />
    </div>
  );
}

function enableLocalMode(term) {
  let buffer = '';
  const fakeFiles = {
    'package.json': '{"name":"next-app","scripts":{"dev":"next dev"}}',
    'app/page.jsx': 'export default function HomePage() { return <main>Hello</main>; }',
    'main.py': 'print("Hello from Python")',
  };
  const commands = {
    help: 'Available: help, echo, date, clear, whoami, pwd, ls, cat, node, npm, npx, next, python, python3, pip, pip3',
    date: new Date().toISOString(),
    whoami: 'cloud-ide-user',
    pwd: '/home/user/project',
    ls: 'app/  main.py  package.json  requirements.txt',
    clear: '\x1b[2J\x1b[H',
  };

  term.writeln('');
  term.write('$ ');

  const executeCommand = (cmd) => {
    const trimmed = (cmd || '').trim();
    if (!trimmed) {
      term.write('$ ');
      return;
    }

    const parts = trimmed.split(/\s+/);
    const base = parts[0];

    if (base === 'echo') {
      term.writeln(parts.slice(1).join(' '));
    } else if (base === 'cat') {
      const target = parts[1];
      if (!target) {
        term.writeln('usage: cat <file>');
      } else {
        term.writeln(fakeFiles[target] || `cat: ${target}: No such file or directory`);
      }
    } else if (base === 'clear') {
      term.write('\x1b[2J\x1b[H');
    } else if (base === 'python' || base === 'python3') {
      term.writeln(`Python simulation - would run: ${trimmed}`);
    } else if (base === 'pip' || base === 'pip3') {
      term.writeln(`pip simulation - would run: ${trimmed}`);
    } else if (base === 'node' || base === 'npm' || base === 'npx' || base === 'next') {
      term.writeln(`Node.js simulation - would run: ${trimmed}`);
    } else if (commands[base]) {
      term.writeln(commands[base]);
    } else {
      term.writeln(`\x1b[31mcommand not found: ${base}\x1b[0m`);
    }
    term.write('$ ');
  };

  term.onData((data) => {
    if (data === '\r') {
      const cmd = buffer.trim();
      buffer = '';
      term.write('\r\n');
      executeCommand(cmd);
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

  return (command) => {
    term.write(`${command}\r\n`);
    executeCommand(command);
  };
}
