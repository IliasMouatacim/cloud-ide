import React from 'react';

/* ── SVG file-type icons (small, colored) ──────────────────────────── */
const FileIcon = ({ ext }) => {
  const config = FILE_ICON_CONFIG[ext] || FILE_ICON_CONFIG.default;
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={config.color}
         strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d={config.path} />
    </svg>
  );
};

const FILE_ICON_CONFIG = {
  html:    { color: '#e34c26', path: 'M4 4h16v16H4zM8 8h8M8 12h8M8 16h4' },
  htm:     { color: '#e34c26', path: 'M4 4h16v16H4zM8 8h8M8 12h8M8 16h4' },
  css:     { color: '#42a5f5', path: 'M4 4h16v16H4zM8 8h8M8 12h5M8 16h8' },
  scss:    { color: '#c76494', path: 'M4 4h16v16H4zM8 8h8M8 12h5M8 16h8' },
  js:      { color: '#f7df1e', path: 'M4 4h16v16H4zM10 8v8M14 8v4c0 2-4 2-4 0' },
  jsx:     { color: '#61dafb', path: 'M12 12m-2 0a2 2 0 104 0 2 2 0 10-4 0M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2' },
  ts:      { color: '#3178c6', path: 'M4 4h16v16H4zM9 8h6M12 8v8' },
  tsx:     { color: '#61dafb', path: 'M12 12m-2 0a2 2 0 104 0 2 2 0 10-4 0M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2' },
  json:    { color: '#f9e2af', path: 'M8 3H5a2 2 0 00-2 2v3M16 3h3a2 2 0 012 2v3M21 16v3a2 2 0 01-2 2h-3M8 21H5a2 2 0 01-2-2v-3' },
  md:      { color: '#6c7086', path: 'M4 4h16v16H4zM7 15V9l3 3 3-3v6M17 9v6' },
  py:      { color: '#3776ab', path: 'M12 2C6.5 2 6 4.5 6 4.5V8h6v1H5s-3-.5-3 4 2.5 4 2.5 4H7v-3s-.2-2.5 2.5-2.5h5s2.3.1 2.3-2.3V4.5S17.5 2 12 2zM9.5 4a1 1 0 110 2 1 1 0 010-2z' },
  default: { color: '#6c7086', path: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6' },
};

function getExt(path) {
  return path.split('.').pop().toLowerCase();
}

export default function EditorTabs({ openFiles, activeFile, onTabSelect, onTabClose, modifiedFiles }) {
  if (!openFiles || openFiles.length === 0) return null;

  return (
    <div className="flex bg-ide-panel border-b border-ide-border overflow-x-auto shrink-0 scrollbar-thin">
      {openFiles.map(file => {
        const name = file.split('/').pop();
        const isActive = file === activeFile;
        const isModified = modifiedFiles?.has(file);

        return (
          <div
            key={file}
            className={`group flex items-center gap-1.5 px-3 py-[7px] text-[12px] cursor-pointer
              border-r border-ide-border/60 select-none shrink-0 transition-all
              ${isActive
                ? 'bg-ide-bg text-ide-text border-t-[2px] border-t-ide-accent'
                : 'bg-ide-panel text-ide-textMuted hover:bg-ide-bg/40 border-t-[2px] border-t-transparent'}`}
            onClick={() => onTabSelect(file)}
          >
            <FileIcon ext={getExt(file)} />
            <span className="whitespace-nowrap font-medium">{name}</span>
            {isModified && (
              <span className="w-[6px] h-[6px] rounded-full bg-ide-accent ml-0.5" />
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isModified) {
                  if (!window.confirm(`"${name}" has unsaved changes. Close anyway?`)) return;
                }
                onTabClose(file);
              }}
              className="ml-1 opacity-0 group-hover:opacity-100 text-ide-textMuted hover:text-ide-error
                         w-4 h-4 flex items-center justify-center rounded hover:bg-ide-error/10 transition-all"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
