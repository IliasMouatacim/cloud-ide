import React from 'react';

/* ── SVG icons for templates ──────────────────────────────────────── */
const TplIcon = ({ d, color }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color}
       strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const TEMPLATES = [
  {
    id: 'html', name: 'HTML / CSS / JS', desc: 'Classic web project',
    color: '#e34c26',
    icon: 'M4 4h16v16H4zM8 8h8M8 12h8M8 16h4',
  },
  {
    id: 'nextjs', name: 'Next.js', desc: 'App Router starter project',
    color: '#111827',
    icon: 'M12 2a10 10 0 100 20 10 10 0 000-20M8 16V8l8 8V8',
  },
  {
    id: 'react', name: 'React', desc: 'React app with JSX components',
    color: '#61dafb',
    icon: 'M12 12m-2 0a2 2 0 104 0 2 2 0 10-4 0M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2',
  },
  {
    id: 'node', name: 'Node.js', desc: 'Server with HTTP module',
    color: '#a6e3a1',
    icon: 'M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10zM12 12v4M15 14h-6',
  },
  {
    id: 'python', name: 'Python', desc: 'Python main script',
    color: '#3776ab',
    icon: 'M12 2C6.5 2 6 4.5 6 4.5V8h6v1H5s-3-.5-3 4 2.5 4 2.5 4H7v-3s-.2-2.5 2.5-2.5h5s2.3.1 2.3-2.3V4.5S17.5 2 12 2z',
  },
  {
    id: 'blank', name: 'Blank', desc: 'Empty project',
    color: '#6c7086',
    icon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6',
  },
];

const SHORTCUTS = [
  { keys: ['Ctrl', 'S'], desc: 'Save file' },
  { keys: ['Ctrl', 'P'], desc: 'Quick open' },
  { keys: ['Ctrl', '`'], desc: 'Toggle terminal' },
  { keys: ['Ctrl', 'Enter'], desc: 'Run code' },
  { keys: ['Ctrl', '/'], desc: 'Toggle comment' },
  { keys: ['Ctrl', 'Shift', 'F'], desc: 'Search files' },
];

export default function WelcomeTab({ onNewProject }) {
  return (
    <div className="flex-1 flex items-center justify-center bg-ide-bg overflow-auto animate-fadeIn">
      <div className="max-w-xl w-full p-8">
        {/* Logo / Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-accent mb-4 shadow-glow">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#11111b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-ide-text tracking-tight mb-2">
            Welcome to <span className="bg-gradient-to-r from-ide-accent to-ide-accentHover bg-clip-text text-transparent">Cloud IDE</span>
          </h1>
          <p className="text-sm text-ide-textMuted">
            Write, run, and preview code — right in your browser.
          </p>
        </div>

        {/* New Project Templates */}
        <div className="mb-10">
          <h2 className="text-[11px] font-semibold text-ide-textMuted uppercase tracking-widest mb-3 px-1">
            Start a New Project
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => onNewProject(t.id)}
                className="flex items-center gap-3 p-3.5 bg-ide-sidebar/70 border border-ide-border/60 rounded-lg
                           hover:border-ide-accent/40 hover:bg-ide-accent/5 transition-all text-left group
                           hover:shadow-glow active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                     style={{ backgroundColor: t.color + '15' }}>
                  <TplIcon d={t.icon} color={t.color} />
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-ide-text group-hover:text-ide-accent transition-colors truncate">
                    {t.name}
                  </div>
                  <div className="text-[11px] text-ide-textMuted truncate">{t.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div>
          <h2 className="text-[11px] font-semibold text-ide-textMuted uppercase tracking-widest mb-3 px-1">
            Keyboard Shortcuts
          </h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
            {SHORTCUTS.map(s => (
              <div key={s.keys.join('+')} className="flex items-center justify-between py-1">
                <span className="text-xs text-ide-textMuted">{s.desc}</span>
                <div className="flex items-center gap-0.5">
                  {s.keys.map((k, i) => (
                    <span key={i}>
                      <kbd className="text-[10px] px-1.5 py-[2px] bg-ide-sidebar border border-ide-border/80 rounded
                                      font-mono text-ide-text shadow-[0_1px_0_rgba(0,0,0,0.4)]">
                        {k}
                      </kbd>
                      {i < s.keys.length - 1 && <span className="text-ide-textSubtle text-[9px] mx-0.5">+</span>}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 text-center text-[10px] text-ide-textSubtle">
          Powered by Monaco Editor &middot; xterm.js &middot; React
        </div>
      </div>
    </div>
  );
}
