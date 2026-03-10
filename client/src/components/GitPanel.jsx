import React, { useState, useMemo } from 'react';

export default function GitPanel({ files, onClose }) {
  const [commitMsg, setCommitMsg] = useState('');
  const [branch, setBranch] = useState('main');
  const [showBranches, setShowBranches] = useState(false);
  const [log, setLog] = useState([
    { hash: 'a1b2c3d', message: 'Initial commit', date: '2 hours ago', author: 'you' },
  ]);

  const branches = ['main', 'develop', 'feature/editor', 'feature/terminal'];

  const changedFiles = useMemo(() => {
    return Object.keys(files).map(path => ({
      path,
      status: 'M', // Modified
    }));
  }, [files]);

  const handleCommit = () => {
    if (!commitMsg.trim()) return;
    const hash = Math.random().toString(36).substring(2, 9);
    setLog(prev => [{
      hash,
      message: commitMsg,
      date: 'just now',
      author: 'you',
    }, ...prev]);
    setCommitMsg('');
  };

  return (
    <div className="absolute right-0 top-0 bottom-0 w-80 bg-ide-sidebar border-l border-ide-border
                    flex flex-col z-30 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-ide-border">
        <div className="flex items-center gap-2">
          <span className="text-sm">⑂</span>
          <span className="text-xs font-semibold text-ide-text uppercase tracking-wider">Source Control</span>
        </div>
        <button onClick={onClose} className="text-ide-textMuted hover:text-ide-error text-xs">✕</button>
      </div>

      {/* Branch selector */}
      <div className="px-3 py-2 border-b border-ide-border">
        <div className="relative">
          <button
            onClick={() => setShowBranches(!showBranches)}
            className="flex items-center gap-1 text-xs text-ide-accent hover:text-ide-accentHover"
          >
            <span>⑂</span>
            <span>{branch}</span>
            <span className="text-[10px]">▼</span>
          </button>

          {showBranches && (
            <div className="absolute top-6 left-0 bg-ide-panel border border-ide-border rounded shadow-lg z-10 min-w-[150px]">
              {branches.map(b => (
                <button
                  key={b}
                  onClick={() => { setBranch(b); setShowBranches(false); }}
                  className={`w-full text-left text-xs px-3 py-1.5 hover:bg-ide-bg/50 transition-colors
                    ${b === branch ? 'text-ide-accent' : 'text-ide-text'}`}
                >
                  {b === branch && '✓ '}{b}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Changes */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-2">
          <div className="text-xs font-semibold text-ide-textMuted mb-2">
            Changes ({changedFiles.length})
          </div>
          <div className="space-y-0.5">
            {changedFiles.map(f => (
              <div key={f.path} className="flex items-center gap-1 text-xs py-0.5 px-1 rounded hover:bg-ide-bg/50">
                <span className={`font-mono text-[10px] w-3 ${
                  f.status === 'M' ? 'text-ide-warning' :
                  f.status === 'A' ? 'text-ide-success' :
                  f.status === 'D' ? 'text-ide-error' : 'text-ide-textMuted'
                }`}>
                  {f.status}
                </span>
                <span className="text-ide-text truncate">{f.path}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Commit section */}
        <div className="px-3 py-2 border-t border-ide-border">
          <textarea
            value={commitMsg}
            onChange={e => setCommitMsg(e.target.value)}
            placeholder="Commit message..."
            className="w-full px-2 py-1.5 bg-ide-bg border border-ide-border rounded text-xs
                       text-ide-text placeholder-ide-textMuted resize-none h-16
                       focus:outline-none focus:border-ide-accent"
          />
          <button
            onClick={handleCommit}
            disabled={!commitMsg.trim()}
            className="w-full mt-2 py-1.5 bg-ide-accent text-ide-bg text-xs font-medium rounded
                       hover:bg-ide-accentHover transition-colors disabled:opacity-30"
          >
            ✓ Commit
          </button>
          <div className="flex gap-1 mt-2">
            <button className="flex-1 py-1 text-[10px] text-ide-textMuted border border-ide-border rounded hover:bg-ide-bg/50">
              ↑ Push
            </button>
            <button className="flex-1 py-1 text-[10px] text-ide-textMuted border border-ide-border rounded hover:bg-ide-bg/50">
              ↓ Pull
            </button>
          </div>
        </div>

        {/* Commit log */}
        <div className="px-3 py-2 border-t border-ide-border">
          <div className="text-xs font-semibold text-ide-textMuted mb-2">Commit Log</div>
          <div className="space-y-2">
            {log.map((entry) => (
              <div key={entry.hash} className="text-xs">
                <div className="flex items-center gap-1">
                  <span className="font-mono text-ide-accent text-[10px]">{entry.hash}</span>
                  <span className="text-ide-textMuted text-[10px]">{entry.date}</span>
                </div>
                <div className="text-ide-text truncate">{entry.message}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
