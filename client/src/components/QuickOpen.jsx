import React, { useState, useRef, useEffect, useMemo } from 'react';

export default function QuickOpen({ files, onSelect, onClose }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const filePaths = useMemo(() => Object.keys(files), [files]);

  const filtered = useMemo(() => {
    if (!query) return filePaths.slice(0, 20);
    const q = query.toLowerCase();
    return filePaths
      .filter(p => p.toLowerCase().includes(q))
      .sort((a, b) => {
        // Prioritize filename matches over path matches
        const aName = a.split('/').pop().toLowerCase();
        const bName = b.split('/').pop().toLowerCase();
        const aStarts = aName.startsWith(q);
        const bStarts = bName.startsWith(q);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.length - b.length;
      })
      .slice(0, 20);
  }, [query, filePaths]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) onSelect(filtered[selectedIndex]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center pt-[15%] bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-md h-fit bg-ide-panel border border-ide-border rounded-xl shadow-float animate-slideUp"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-ide-border">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ide-textMuted shrink-0">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type to search files..."
            className="flex-1 bg-transparent text-sm text-ide-text placeholder-ide-textSubtle focus:outline-none"
            spellCheck={false}
          />
          <kbd className="text-[10px] px-1.5 py-[1px] bg-ide-sidebar border border-ide-border/80 rounded
                          font-mono text-ide-textMuted">Esc</kbd>
        </div>

        {/* Results */}
        <div className="max-h-64 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <div className="px-3 py-4 text-xs text-ide-textMuted text-center">No files found</div>
          ) : (
            filtered.map((path, i) => {
              const name = path.split('/').pop();
              const dir = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '';
              return (
                <button
                  key={path}
                  onClick={() => onSelect(path)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors
                    ${i === selectedIndex ? 'bg-ide-accent/15 text-ide-accent' : 'text-ide-text hover:bg-ide-bg/40'}`}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                       strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-ide-textMuted">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6"/>
                  </svg>
                  <span className="font-medium truncate">{name}</span>
                  {dir && <span className="text-ide-textSubtle truncate ml-auto">{dir}</span>}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
