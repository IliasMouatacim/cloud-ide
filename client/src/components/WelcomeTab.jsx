import React from 'react';

const TEMPLATES = [
  { id: 'html', name: 'HTML / CSS / JS', icon: '🌐', desc: 'Classic web project with HTML, CSS, and JavaScript' },
  { id: 'react', name: 'React', icon: '⚛️', desc: 'React app with JSX and components' },
  { id: 'node', name: 'Node.js', icon: '🟢', desc: 'Node.js server with HTTP module' },
  { id: 'python', name: 'Python', icon: '🐍', desc: 'Python project with a main script' },
  { id: 'blank', name: 'Blank', icon: '📄', desc: 'Empty project with no files' },
];

const SHORTCUTS = [
  { keys: 'Ctrl+S', desc: 'Save file' },
  { keys: 'Ctrl+P', desc: 'Quick open' },
  { keys: 'Ctrl+`', desc: 'Toggle terminal' },
  { keys: 'Ctrl+Enter', desc: 'Run code' },
  { keys: 'Ctrl+/', desc: 'Toggle comment' },
  { keys: 'Ctrl+Shift+F', desc: 'Search files' },
];

export default function WelcomeTab({ onNewProject }) {
  return (
    <div className="flex-1 flex items-center justify-center bg-ide-bg overflow-auto">
      <div className="max-w-xl w-full p-8">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-ide-text mb-2">
            <span className="text-ide-accent">☁</span> Cloud IDE
          </h1>
          <p className="text-sm text-ide-textMuted">
            Write, run, and preview code — all in your browser.
          </p>
        </div>

        {/* New Project Templates */}
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-ide-textMuted uppercase tracking-wider mb-3">
            Start a New Project
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => onNewProject(t.id)}
                className="flex items-center gap-3 p-3 bg-ide-sidebar border border-ide-border rounded-lg
                           hover:border-ide-accent hover:bg-ide-accent/5 transition-all text-left group"
              >
                <span className="text-xl">{t.icon}</span>
                <div>
                  <div className="text-sm font-medium text-ide-text group-hover:text-ide-accent transition-colors">
                    {t.name}
                  </div>
                  <div className="text-[10px] text-ide-textMuted">{t.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div>
          <h2 className="text-xs font-semibold text-ide-textMuted uppercase tracking-wider mb-3">
            Keyboard Shortcuts
          </h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            {SHORTCUTS.map(s => (
              <div key={s.keys} className="flex items-center justify-between py-1">
                <span className="text-xs text-ide-textMuted">{s.desc}</span>
                <kbd className="text-[10px] px-1.5 py-0.5 bg-ide-sidebar border border-ide-border rounded font-mono text-ide-text">
                  {s.keys}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-[10px] text-ide-textMuted">
          Powered by Monaco Editor • xterm.js • React
        </div>
      </div>
    </div>
  );
}
