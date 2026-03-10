/**
 * Terminal service - manages WebSocket-based terminal sessions.
 * Uses node-pty when available, falls back to a simple shell emulator.
 */
const { v4: uuidv4 } = require('uuid');

let pty;
try {
  pty = require('node-pty');
} catch {
  pty = null;
}

const terminals = new Map();

function handleConnection(ws) {
  const termId = uuidv4();

  if (pty) {
    // Use real PTY
    const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols: 120,
      rows: 30,
      cwd: process.env.HOME || process.env.USERPROFILE || '/',
      env: process.env
    });

    terminals.set(termId, ptyProcess);

    ptyProcess.onData((data) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: 'terminal:data', data }));
      }
    });

    ptyProcess.onExit(() => {
      terminals.delete(termId);
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: 'terminal:exit' }));
      }
    });

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw);
        if (msg.type === 'terminal:input') {
          ptyProcess.write(msg.data);
        } else if (msg.type === 'terminal:resize') {
          ptyProcess.resize(msg.cols || 120, msg.rows || 30);
        }
      } catch {
        // ignore malformed messages
      }
    });

    ws.on('close', () => {
      ptyProcess.kill();
      terminals.delete(termId);
    });
  } else {
    // Fallback: simple echo terminal
    ws.send(JSON.stringify({
      type: 'terminal:data',
      data: '\r\nCloud IDE Terminal (simulated mode)\r\n$ '
    }));

    let buffer = '';
    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw);
        if (msg.type === 'terminal:input') {
          const input = msg.data;
          if (input === '\r' || input === '\n') {
            const cmd = buffer.trim();
            buffer = '';
            const output = executeSimpleCommand(cmd);
            ws.send(JSON.stringify({
              type: 'terminal:data',
              data: '\r\n' + output + '\r\n$ '
            }));
          } else if (input === '\x7f') {
            // Backspace
            if (buffer.length > 0) {
              buffer = buffer.slice(0, -1);
              ws.send(JSON.stringify({ type: 'terminal:data', data: '\b \b' }));
            }
          } else {
            buffer += input;
            ws.send(JSON.stringify({ type: 'terminal:data', data: input }));
          }
        }
      } catch {
        // ignore
      }
    });
  }

  ws.send(JSON.stringify({ type: 'terminal:ready', termId }));
}

function executeSimpleCommand(cmd) {
  if (!cmd) return '';
  const parts = cmd.split(/\s+/);
  const command = parts[0];

  const commands = {
    help: () => 'Available commands: help, echo, date, clear, whoami, pwd, ls',
    echo: () => parts.slice(1).join(' '),
    date: () => new Date().toISOString(),
    whoami: () => 'cloud-ide-user',
    pwd: () => '/home/user/project',
    ls: () => 'index.html  script.js  style.css  package.json',
    clear: () => '\x1b[2J\x1b[H',
    node: () => `Node.js simulation - would run: ${parts.slice(1).join(' ')}`,
    npm: () => `npm simulation - would run: npm ${parts.slice(1).join(' ')}`,
    python: () => `Python simulation - would run: python ${parts.slice(1).join(' ')}`,
    git: () => `Git simulation - would run: git ${parts.slice(1).join(' ')}`,
  };

  const handler = commands[command];
  if (handler) return handler();
  return `command not found: ${command}. Type 'help' for available commands.`;
}

module.exports = { handleConnection };
