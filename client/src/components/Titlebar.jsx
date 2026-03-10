import React from 'react';

export default function Titlebar({
  user, onLogin, onLogout, onTogglePreview, onToggleTerminal, onRun,
  showPreview, showTerminal, projectName, onProjectNameChange
}) {
  return (
    <div className="h-10 bg-ide-sidebar flex items-center px-3 border-b border-ide-border select-none shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-4">
        <span className="text-ide-accent font-bold text-sm">☁ Cloud IDE</span>
      </div>

      {/* Menu items */}
      <div className="flex items-center gap-1 text-xs text-ide-textMuted">
        <MenuButton label="File" />
        <MenuButton label="Edit" />
        <MenuButton label="View" />
        <MenuButton label="Run" />
        <MenuButton label="Help" />
      </div>

      {/* Project name */}
      <div className="flex-1 flex justify-center">
        <input
          type="text"
          value={projectName}
          onChange={e => onProjectNameChange(e.target.value)}
          className="bg-transparent text-center text-xs text-ide-textMuted hover:text-ide-text
                     focus:text-ide-text focus:outline-none focus:border-b focus:border-ide-accent
                     px-2 py-0.5 max-w-[200px]"
          spellCheck={false}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
        <ToolButton
          label={showPreview ? 'Hide Preview' : 'Show Preview'}
          icon="👁"
          active={showPreview}
          onClick={onTogglePreview}
        />
        <ToolButton
          label={showTerminal ? 'Hide Terminal' : 'Show Terminal'}
          icon="⌨"
          active={showTerminal}
          onClick={onToggleTerminal}
        />
        <button
          onClick={onRun}
          className="flex items-center gap-1 px-3 py-1 ml-2 text-xs font-medium rounded
                     bg-ide-success/20 text-ide-success hover:bg-ide-success/30 transition-colors"
          title="Run code (Ctrl+Enter)"
        >
          ▶ Run
        </button>
        <div className="w-px h-5 bg-ide-border mx-2" />
        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-ide-textMuted">{user.username}</span>
            <button onClick={onLogout} className="text-xs text-ide-textMuted hover:text-ide-error transition-colors">
              Sign out
            </button>
          </div>
        ) : (
          <button
            onClick={onLogin}
            className="text-xs px-3 py-1 rounded bg-ide-accent/20 text-ide-accent hover:bg-ide-accent/30 transition-colors"
          >
            Sign in
          </button>
        )}
      </div>
    </div>
  );
}

function MenuButton({ label }) {
  return (
    <button className="px-2 py-1 hover:bg-ide-bg/50 rounded text-xs transition-colors">
      {label}
    </button>
  );
}

function ToolButton({ label, icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`p-1.5 rounded text-sm transition-colors ${
        active ? 'text-ide-accent bg-ide-accent/10' : 'text-ide-textMuted hover:text-ide-text'
      }`}
      title={label}
    >
      {icon}
    </button>
  );
}
