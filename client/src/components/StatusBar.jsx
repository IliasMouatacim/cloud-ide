import React from 'react';

const LANGUAGE_NAMES = {
  html: 'HTML', htm: 'HTML', css: 'CSS', scss: 'SCSS',
  js: 'JavaScript', jsx: 'JavaScript (JSX)', ts: 'TypeScript', tsx: 'TypeScript (TSX)',
  json: 'JSON', md: 'Markdown', py: 'Python', java: 'Java',
  cpp: 'C++', c: 'C', go: 'Go', rs: 'Rust', rb: 'Ruby', php: 'PHP',
  yml: 'YAML', yaml: 'YAML', xml: 'XML', sql: 'SQL', sh: 'Shell',
  txt: 'Plain Text', gitkeep: 'Git Keep',
};

const Ico = ({ d, size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

export default function StatusBar({ activeFile, cursorPosition, fileCount, user }) {
  const ext = activeFile ? activeFile.split('.').pop().toLowerCase() : '';
  const language = LANGUAGE_NAMES[ext] || 'Plain Text';

  return (
    <div className="studio-status h-[22px] bg-ide-panel border-t border-ide-border flex items-center px-3 text-[11px]
                    text-ide-textMuted shrink-0 select-none font-medium">
      {/* Left side */}
      <div className="flex items-center gap-3">
        {/* Remote indicator */}
        <span className="flex items-center gap-1 text-ide-accent">
          <Ico d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" size={11} />
          <span>Cloud IDE</span>
        </span>

        {/* Branch */}
        <span className="flex items-center gap-1">
          <Ico d="M6 3v12M18 9a3 3 0 100 6 3 3 0 000-6zM6 21a3 3 0 100-6 3 3 0 000 6zM18 15l-6 6" size={11} />
          <span>main</span>
        </span>

        {/* Errors/Warnings */}
        <span className="flex items-center gap-2">
          <span className="flex items-center gap-0.5">
            <Ico d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM13 17h-2v-2h2v2zm0-4h-2V7h2v6z" size={11} />
            0
          </span>
          <span className="flex items-center gap-0.5 text-ide-warning">
            <Ico d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" size={11} />
            0
          </span>
        </span>
      </div>

      <div className="flex-1" />

      {/* Right side */}
      <div className="flex items-center gap-3">
        {activeFile && cursorPosition && (
          <span>Ln {cursorPosition.line}, Col {cursorPosition.col}</span>
        )}
        <span>Spaces: 2</span>
        <span>UTF-8</span>
        {activeFile && (
          <span className="px-1.5 py-0.5 rounded bg-ide-bg/50">{language}</span>
        )}
        <span>{fileCount} file{fileCount !== 1 ? 's' : ''}</span>
        {user && (
          <span className="flex items-center gap-1 text-ide-accent">
            <Ico d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z" size={11} />
            {user.username}
          </span>
        )}
      </div>
    </div>
  );
}
