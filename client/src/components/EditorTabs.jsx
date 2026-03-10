import React from 'react';

const FILE_ICONS = {
  html: '🌐', htm: '🌐',
  css: '🎨', scss: '🎨',
  js: '📜', jsx: '⚛️', ts: '📘', tsx: '⚛️',
  json: '📋', md: '📝', py: '🐍',
  java: '☕', cpp: '⚙️', c: '⚙️',
  default: '📄'
};

function getIcon(path) {
  const ext = path.split('.').pop().toLowerCase();
  return FILE_ICONS[ext] || FILE_ICONS.default;
}

export default function EditorTabs({ openFiles, activeFile, onTabSelect, onTabClose, modifiedFiles }) {
  if (!openFiles || openFiles.length === 0) return null;

  return (
    <div className="flex bg-ide-panel border-b border-ide-border overflow-x-auto shrink-0">
      {openFiles.map(file => {
        const name = file.split('/').pop();
        const isActive = file === activeFile;
        const isModified = modifiedFiles?.has(file);

        return (
          <div
            key={file}
            className={`group flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer border-r border-ide-border
              select-none shrink-0 transition-colors
              ${isActive
                ? 'bg-ide-bg text-ide-text border-t-2 border-t-ide-accent'
                : 'bg-ide-panel text-ide-textMuted hover:bg-ide-bg/50 border-t-2 border-t-transparent'}`}
            onClick={() => onTabSelect(file)}
          >
            <span className="text-[11px]">{getIcon(file)}</span>
            <span className="whitespace-nowrap">{name}</span>
            {isModified && <span className="w-2 h-2 rounded-full bg-ide-accent" />}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(file);
              }}
              className="ml-1 opacity-0 group-hover:opacity-100 text-ide-textMuted hover:text-ide-error
                         text-[10px] w-4 h-4 flex items-center justify-center rounded hover:bg-ide-error/10 transition-all"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
