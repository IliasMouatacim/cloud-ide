import React from 'react';

const LANGUAGE_NAMES = {
  html: 'HTML', htm: 'HTML', css: 'CSS', scss: 'SCSS',
  js: 'JavaScript', jsx: 'JavaScript (JSX)', ts: 'TypeScript', tsx: 'TypeScript (TSX)',
  json: 'JSON', md: 'Markdown', py: 'Python', java: 'Java',
  cpp: 'C++', c: 'C', go: 'Go', rs: 'Rust', rb: 'Ruby', php: 'PHP',
  yml: 'YAML', yaml: 'YAML', xml: 'XML', sql: 'SQL', sh: 'Shell',
  txt: 'Plain Text', gitkeep: 'Git Keep',
};

export default function StatusBar({ activeFile, cursorPosition, fileCount, user }) {
  const ext = activeFile ? activeFile.split('.').pop().toLowerCase() : '';
  const language = LANGUAGE_NAMES[ext] || 'Plain Text';

  return (
    <div className="h-6 bg-ide-accent flex items-center px-3 text-[11px] font-medium text-ide-bg shrink-0 select-none">
      {/* Left side */}
      <div className="flex items-center gap-3">
        {/* Branch */}
        <span className="flex items-center gap-1">
          <span>⑂</span> main
        </span>

        {/* Errors/Warnings */}
        <span className="flex items-center gap-1">
          <span>⊘</span> 0
          <span>⚠</span> 0
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side */}
      <div className="flex items-center gap-3">
        {activeFile && cursorPosition && (
          <span>Ln {cursorPosition.line}, Col {cursorPosition.col}</span>
        )}
        <span>Spaces: 2</span>
        <span>UTF-8</span>
        {activeFile && <span>{language}</span>}
        <span>{fileCount} file{fileCount !== 1 ? 's' : ''}</span>
        {user && <span>☁ {user.username}</span>}
      </div>
    </div>
  );
}
