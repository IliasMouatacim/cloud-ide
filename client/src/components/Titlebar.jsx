import React, { useState, useRef, useEffect } from 'react';

/* ── SVG micro-icons (16 × 16, stroke-based) ─────────────────────── */
const Icon = ({ d, size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={d} />
  </svg>
);

const icons = {
  eye:      'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z',
  eyeOff:   'M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22M10.59 10.59a3 3 0 004.24 4.24',
  terminal: 'M4 17l6-5-6-5M12 19h8',
  play:     'M5 3l14 9-14 9V3z',
  user:     'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z',
  logOut:   'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
  cloud:    'M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z',
  file:     'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6',
  folder:   'M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z',
  save:     'M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zM17 21v-8H7v8M7 3v5h8',
  download: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3',
};

export default function Titlebar({
  user, onLogin, onLogout, onTogglePreview, onToggleTerminal, onRun,
  showPreview, showTerminal, projectName, onProjectNameChange,
  onOpenFile, onOpenFolder, onSave, onDownload, onToggleSearch
}) {
  return (
    <div className="h-11 bg-ide-sidebar flex items-center px-3 border-b border-ide-border select-none shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-4">
        <div className="w-5 h-5 rounded-md bg-gradient-accent flex items-center justify-center">
          <Icon d={icons.cloud} size={12} className="text-ide-panel" />
        </div>
        <span className="text-[13px] font-semibold tracking-tight text-ide-text">
          Cloud <span className="text-ide-accent">IDE</span>
        </span>
      </div>

      {/* Menu items */}
      <div className="flex items-center gap-0.5 text-xs text-ide-textMuted">
        <FileMenu onOpenFile={onOpenFile} onOpenFolder={onOpenFolder} onSave={onSave} onDownload={onDownload} />
        <DropdownMenu label="Edit" items={[
          { label: 'Undo', shortcut: 'Ctrl+Z', action: () => document.execCommand('undo') },
          { label: 'Redo', shortcut: 'Ctrl+Y', action: () => document.execCommand('redo') },
          { type: 'separator' },
          { label: 'Find', shortcut: 'Ctrl+F', action: () => document.querySelector('.monaco-editor textarea')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', ctrlKey: true })) },
          { label: 'Search in Files', shortcut: 'Ctrl+Shift+F', action: onToggleSearch },
        ]} />
        <DropdownMenu label="View" items={[
          { label: showPreview ? 'Hide Preview' : 'Show Preview', action: onTogglePreview },
          { label: showTerminal ? 'Hide Terminal' : 'Show Terminal', shortcut: 'Ctrl+`', action: onToggleTerminal },
          { type: 'separator' },
          { label: 'Quick Open', shortcut: 'Ctrl+P', action: () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p', ctrlKey: true })) },
        ]} />
        <DropdownMenu label="Run" items={[
          { label: 'Run Code', shortcut: 'Ctrl+Enter', action: onRun },
        ]} />
        <DropdownMenu label="Help" items={[
          { label: 'Keyboard Shortcuts', action: () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p', ctrlKey: true })) },
          { type: 'separator' },
          { label: 'About Cloud IDE', action: () => {} },
        ]} />
      </div>

      {/* Project name — centered */}
      <div className="flex-1 flex justify-center">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-ide-bg/40 transition-colors group">
          <input
            type="text"
            value={projectName}
            onChange={e => onProjectNameChange(e.target.value)}
            className="bg-transparent text-center text-xs text-ide-textMuted hover:text-ide-text
                       focus:text-ide-text focus:outline-none max-w-[200px] font-medium"
            spellCheck={false}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-0.5">
        <ToolButton
          label={showPreview ? 'Hide Preview' : 'Show Preview'}
          iconPath={showPreview ? icons.eye : icons.eyeOff}
          active={showPreview}
          onClick={onTogglePreview}
        />
        <ToolButton
          label={showTerminal ? 'Hide Terminal' : 'Show Terminal'}
          iconPath={icons.terminal}
          active={showTerminal}
          onClick={onToggleTerminal}
        />
        <button
          onClick={onRun}
          className="flex items-center gap-1.5 px-3 py-1.5 ml-1.5 text-xs font-medium rounded-md
                     bg-ide-success/15 text-ide-success hover:bg-ide-success/25 transition-all
                     active:scale-95"
          title="Run code (Ctrl+Enter)"
        >
          <Icon d={icons.play} size={12} />
          <span>Run</span>
        </button>

        <div className="w-px h-5 bg-ide-border mx-2" />

        {user ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-ide-textMuted">
              <div className="w-5 h-5 rounded-full bg-ide-accent/20 flex items-center justify-center">
                <Icon d={icons.user} size={11} className="text-ide-accent" />
              </div>
              <span className="font-medium">{user.username}</span>
            </div>
            <button onClick={onLogout}
              className="p-1.5 text-ide-textMuted hover:text-ide-error rounded-md hover:bg-ide-error/10 transition-colors"
              title="Sign out"
            >
              <Icon d={icons.logOut} size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={onLogin}
            className="text-xs px-3 py-1.5 rounded-md font-medium
                       bg-ide-accent/15 text-ide-accent hover:bg-ide-accent/25 transition-all active:scale-95"
          >
            Sign in
          </button>
        )}
      </div>
    </div>
  );
}

/* ── File menu with dropdown ──────────────────────────────────────── */
function FileMenu({ onOpenFile, onOpenFolder, onSave, onDownload }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const items = [
    { label: 'Open File…', icon: icons.file, shortcut: 'Ctrl+O', action: onOpenFile },
    { label: 'Open Folder…', icon: icons.folder, shortcut: 'Ctrl+Shift+O', action: onOpenFolder },
    { type: 'separator' },
    { label: 'Save', icon: icons.save, shortcut: 'Ctrl+S', action: onSave },
    { label: 'Download Project', icon: icons.download, shortcut: '', action: onDownload },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors
          ${open ? 'bg-ide-bg/60 text-ide-text' : 'hover:bg-ide-bg/40 hover:text-ide-text'}`}
      >
        File
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-0.5 w-56 bg-ide-panel border border-ide-border rounded-lg
                        shadow-float z-50 py-1 animate-fadeIn">
          {items.map((item, i) =>
            item.type === 'separator' ? (
              <div key={i} className="h-px bg-ide-border my-1 mx-2" />
            ) : (
              <button
                key={item.label}
                onClick={() => {
                  setOpen(false);
                  item.action?.();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-ide-text
                           hover:bg-ide-accent/10 hover:text-ide-accent transition-colors"
              >
                <Icon d={item.icon} size={14} className="text-ide-textMuted" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.shortcut && (
                  <span className="text-[10px] text-ide-textSubtle font-mono">{item.shortcut}</span>
                )}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

function DropdownMenu({ label, items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors
          ${open ? 'bg-ide-bg/60 text-ide-text' : 'hover:bg-ide-bg/40 hover:text-ide-text'}`}
      >
        {label}
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-0.5 w-52 bg-ide-panel border border-ide-border rounded-lg
                        shadow-float z-50 py-1 animate-fadeIn">
          {items.map((item, i) =>
            item.type === 'separator' ? (
              <div key={i} className="h-px bg-ide-border my-1 mx-2" />
            ) : (
              <button
                key={item.label}
                onClick={() => {
                  setOpen(false);
                  item.action?.();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-ide-text
                           hover:bg-ide-accent/10 hover:text-ide-accent transition-colors"
              >
                <span className="flex-1 text-left">{item.label}</span>
                {item.shortcut && (
                  <span className="text-[10px] text-ide-textSubtle font-mono">{item.shortcut}</span>
                )}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

function ToolButton({ label, iconPath, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`p-1.5 rounded-md transition-all ${
        active
          ? 'text-ide-accent bg-ide-accent/10 shadow-[inset_0_0_0_1px_rgba(137,180,250,0.15)]'
          : 'text-ide-textMuted hover:text-ide-text hover:bg-ide-bg/40'
      }`}
      title={label}
    >
      <Icon d={iconPath} size={15} />
    </button>
  );
}
