import React, { useState, useMemo } from 'react';

/* ── SVG micro-icons ─────────────────────────────────────────────── */
const Ico = ({ d, size = 14, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
       strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`}>
    <path d={d} />
  </svg>
);

const FILE_ICON_MAP = {
  html: { c: '#e34c26', d: 'M4 4h16v16H4zM8 8h8M8 12h8M8 16h4' },
  htm:  { c: '#e34c26', d: 'M4 4h16v16H4zM8 8h8M8 12h8M8 16h4' },
  css:  { c: '#42a5f5', d: 'M4 4h16v16H4zM8 8h8M8 12h5M8 16h8' },
  scss: { c: '#c76494', d: 'M4 4h16v16H4zM8 8h8M8 12h5M8 16h8' },
  js:   { c: '#f7df1e', d: 'M4 4h16v16H4zM10 8v8M14 8v4c0 2-4 2-4 0' },
  jsx:  { c: '#61dafb', d: 'M12 12m-2 0a2 2 0 104 0 2 2 0 10-4 0M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10' },
  ts:   { c: '#3178c6', d: 'M4 4h16v16H4zM9 8h6M12 8v8' },
  tsx:  { c: '#61dafb', d: 'M12 12m-2 0a2 2 0 104 0 2 2 0 10-4 0M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10' },
  json: { c: '#f9e2af', d: 'M8 3H5a2 2 0 00-2 2v3M16 3h3a2 2 0 012 2v3M21 16v3a2 2 0 01-2 2h-3M8 21H5a2 2 0 01-2-2v-3' },
  md:   { c: '#6c7086', d: 'M4 4h16v16H4zM7 15V9l3 3 3-3v6M17 9v6' },
  py:   { c: '#3776ab', d: 'M12 2C6.5 2 6 4.5 6 4.5V8h6v1H5s-3-.5-3 4 2.5 4 2.5 4H7v-3s-.2-2.5 2.5-2.5h5s2.3.1 2.3-2.3V4.5S17.5 2 12 2z' },
  java: { c: '#f89820', d: 'M4 4h16v16H4zM9 8h6M12 8v8' },
  svg:  { c: '#cba6f7', d: 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2' },
  png:  { c: '#cba6f7', d: 'M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zM8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21' },
  env:  { c: '#a6e3a1', d: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
  yml:  { c: '#f38ba8', d: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6' },
  yaml: { c: '#f38ba8', d: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6' },
};

const DEFAULT_FILE_ICON = { c: '#6c7086', d: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6' };

const MOCK_EXTENSIONS = [
  { name: 'Prettier', desc: 'Code formatter', author: 'Prettier', color: '#56b6c2', icon: 'M4 4h16v16H4zM8 8h8M8 12h5M8 16h8', installed: true },
  { name: 'ESLint', desc: 'JavaScript linter', author: 'Microsoft', color: '#8080f2', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', installed: true },
  { name: 'GitLens', desc: 'Git supercharged', author: 'GitKraken', color: '#a6e3a1', icon: 'M18 18a3 3 0 100-6 3 3 0 006 0zM6 6a3 3 0 100 6 3 3 0 000-6zM13 6h3a2 2 0 012 2v7M6 9v12', installed: false },
  { name: 'Tailwind CSS IntelliSense', desc: 'Tailwind autocomplete', author: 'Tailwind Labs', color: '#38bdf8', icon: 'M12 2C6.5 2 6 4.5 6 4.5V8h6v1H5s-3-.5-3 4 2.5 4 2.5 4H7v-3s-.2-2.5 2.5-2.5h5s2.3.1 2.3-2.3V4.5S17.5 2 12 2z', installed: false },
  { name: 'Material Icon Theme', desc: 'File icons', author: 'Philipp Kief', color: '#f9e2af', icon: 'M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zM8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21', installed: false },
];

function FileIcon({ name }) {
  const ext = name.split('.').pop().toLowerCase();
  const icon = FILE_ICON_MAP[ext] || DEFAULT_FILE_ICON;
  return <Ico d={icon.d} color={icon.c} size={14} />;
}

export default function Sidebar({
  files, activeFile, onFileSelect, onFileCreate, onFileDelete, onFileRename, onFolderCreate, section
}) {
  const [newFileName, setNewFileName] = useState('');
  const [showNewFile, setShowNewFile] = useState(false);
  const [renamingFile, setRenamingFile] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState(new Set());

  const fileTree = useMemo(() => buildFileTree(files), [files]);

  const handleCreateFile = (e) => {
    e.preventDefault();
    if (newFileName.trim()) {
      onFileCreate(newFileName.trim());
      setNewFileName('');
      setShowNewFile(false);
    }
  };

  const handleRename = (oldPath) => {
    if (renameValue.trim() && renameValue !== oldPath) {
      onFileRename(oldPath, renameValue.trim());
    }
    setRenamingFile(null);
  };

  const toggleFolder = (path) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  if (section === 'search') {
    const searchResults = searchQuery ? Object.entries(files)
      .filter(([path, content]) =>
        path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        content.toLowerCase().includes(searchQuery.toLowerCase())
      ) : [];

    return (
      <div className="h-full bg-ide-sidebar flex flex-col">
        <div className="p-3 text-[11px] font-semibold text-ide-textMuted uppercase tracking-widest">Search</div>
        <div className="px-3 pb-2">
          <div className="relative">
            <Ico d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" size={13}
                 className="absolute left-2 top-1/2 -translate-y-1/2 text-ide-textMuted" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search in files..."
              className="w-full pl-7 pr-2 py-1.5 text-xs bg-ide-bg border border-ide-border rounded-md
                         text-ide-text placeholder-ide-textSubtle focus:outline-none focus:border-ide-accent transition-colors"
              autoFocus
            />
          </div>
          {searchQuery && (
            <div className="text-[10px] text-ide-textSubtle mt-1.5 px-0.5">
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-2">
          {searchQuery && searchResults.length === 0 && (
            <div className="text-xs text-ide-textMuted text-center py-6">
              No results for "{searchQuery}"
            </div>
          )}
          {searchResults.map(([path]) => (
              <button
                key={path}
                onClick={() => onFileSelect(path)}
                className="w-full flex items-center gap-1.5 text-xs py-1 px-2 rounded-md hover:bg-ide-bg/50 text-ide-text truncate transition-colors"
              >
                <FileIcon name={path} />
                <span className="truncate">{path}</span>
              </button>
            ))
          }
        </div>
      </div>
    );
  }

  if (section === 'extensions') {
    return (
      <div className="h-full bg-ide-sidebar flex flex-col">
        <div className="p-3 text-[11px] font-semibold text-ide-textMuted uppercase tracking-widest">Extensions</div>
        <div className="px-3 pb-2">
          <div className="relative">
            <Ico d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" size={13}
                 className="absolute left-2 top-1/2 -translate-y-1/2 text-ide-textMuted" />
            <input
              type="text"
              placeholder="Search extensions..."
              className="w-full pl-7 pr-2 py-1.5 text-xs bg-ide-bg border border-ide-border rounded-md
                         text-ide-text placeholder-ide-textSubtle focus:outline-none focus:border-ide-accent transition-colors"
              disabled
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {MOCK_EXTENSIONS.map(ext => (
            <div key={ext.name} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-ide-bg/40 transition-colors">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                   style={{ backgroundColor: ext.color + '20' }}>
                <Ico d={ext.icon} size={16} color={ext.color} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-ide-text truncate">{ext.name}</div>
                <div className="text-[10px] text-ide-textMuted truncate">{ext.desc}</div>
                <div className="text-[10px] text-ide-textSubtle mt-0.5">{ext.author}</div>
              </div>
              <span className="text-[9px] px-1.5 py-[1px] bg-ide-accent/15 text-ide-accent rounded font-medium shrink-0">
                {ext.installed ? 'Installed' : 'Install'}
              </span>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-ide-border">
          <p className="text-[10px] text-ide-textSubtle text-center">
            Extension marketplace coming soon
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-ide-sidebar flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <span className="text-[11px] font-semibold text-ide-textMuted uppercase tracking-widest">Explorer</span>
        <div className="flex gap-0.5">
          <button
            onClick={() => setShowNewFile(true)}
            className="text-ide-textMuted hover:text-ide-text p-1 rounded-md hover:bg-ide-bg/50 transition-colors"
            title="New File"
          >
            <Ico d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M12 18v-6M9 15h6" size={14} />
          </button>
          <button
            onClick={() => { onFolderCreate('new-folder'); }}
            className="text-ide-textMuted hover:text-ide-text p-1 rounded-md hover:bg-ide-bg/50 transition-colors"
            title="New Folder"
          >
            <Ico d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2zM12 11v6M9 14h6" size={14} />
          </button>
        </div>
      </div>

      {/* New file input */}
      {showNewFile && (
        <form onSubmit={handleCreateFile} className="px-3 pb-2">
          <input
            type="text"
            value={newFileName}
            onChange={e => setNewFileName(e.target.value)}
            placeholder="filename.ext"
            className="w-full px-2 py-1 text-xs bg-ide-bg border border-ide-accent rounded-md
                       text-ide-text placeholder-ide-textSubtle focus:outline-none"
            autoFocus
            onBlur={() => {
              if (!newFileName.trim()) setShowNewFile(false);
            }}
          />
        </form>
      )}

      {/* File tree */}
      <div className="flex-1 overflow-y-auto px-1">
        <FileTreeNode
          node={fileTree}
          path=""
          activeFile={activeFile}
          onFileSelect={onFileSelect}
          onFileDelete={onFileDelete}
          expandedFolders={expandedFolders}
          toggleFolder={toggleFolder}
          renamingFile={renamingFile}
          setRenamingFile={setRenamingFile}
          renameValue={renameValue}
          setRenameValue={setRenameValue}
          handleRename={handleRename}
        />
      </div>
    </div>
  );
}

function FileTreeNode({
  node, path, activeFile, onFileSelect, onFileDelete,
  expandedFolders, toggleFolder, renamingFile, setRenamingFile,
  renameValue, setRenameValue, handleRename, depth = 0
}) {
  if (!node) return null;

  const entries = Object.entries(node).sort(([aKey, aVal], [bKey, bVal]) => {
    const aIsFolder = typeof aVal === 'object' && aVal !== null && !aVal.__isFile;
    const bIsFolder = typeof bVal === 'object' && bVal !== null && !bVal.__isFile;
    if (aIsFolder && !bIsFolder) return -1;
    if (!aIsFolder && bIsFolder) return 1;
    return aKey.localeCompare(bKey);
  });

  return (
    <>
      {entries.map(([name, value]) => {
        const fullPath = path ? `${path}/${name}` : name;
        const isFolder = typeof value === 'object' && value !== null && !value.__isFile;
        const isExpanded = expandedFolders.has(fullPath);
        const isActive = activeFile === fullPath;
        const isRenaming = renamingFile === fullPath;

        if (isFolder) {
          return (
            <div key={fullPath}>
              <button
                onClick={() => toggleFolder(fullPath)}
                className="w-full flex items-center gap-1.5 py-[3px] text-xs rounded-md hover:bg-ide-bg/40
                           transition-colors text-ide-text"
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                     className={`transition-transform shrink-0 text-ide-textMuted ${isExpanded ? 'rotate-90' : ''}`}>
                  <path d="M9 18l6-6-6-6"/>
                </svg>
                <Ico d={isExpanded
                  ? 'M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z'
                  : 'M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z'}
                  color={isExpanded ? '#89b4fa' : '#6c7086'} size={14} />
                <span className="truncate font-medium">{name}</span>
              </button>
              {isExpanded && (
                <FileTreeNode
                  node={value}
                  path={fullPath}
                  activeFile={activeFile}
                  onFileSelect={onFileSelect}
                  onFileDelete={onFileDelete}
                  expandedFolders={expandedFolders}
                  toggleFolder={toggleFolder}
                  renamingFile={renamingFile}
                  setRenamingFile={setRenamingFile}
                  renameValue={renameValue}
                  setRenameValue={setRenameValue}
                  handleRename={handleRename}
                  depth={depth + 1}
                />
              )}
            </div>
          );
        }

        return (
          <div
            key={fullPath}
            className={`group flex items-center gap-1.5 py-[3px] pr-2 text-xs cursor-pointer rounded-md transition-all
              ${isActive
                ? 'bg-ide-accent/10 text-ide-accent'
                : 'text-ide-text hover:bg-ide-bg/40'}`}
            style={{ paddingLeft: `${depth * 12 + 22}px` }}
            onClick={() => onFileSelect(fullPath)}
            onDoubleClick={() => {
              setRenamingFile(fullPath);
              setRenameValue(fullPath);
            }}
          >
            <FileIcon name={name} />
            {isRenaming ? (
              <input
                type="text"
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                onBlur={() => handleRename(fullPath)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleRename(fullPath);
                  if (e.key === 'Escape') setRenamingFile(null);
                }}
                className="flex-1 bg-ide-bg border border-ide-accent rounded-md px-1 text-xs text-ide-text focus:outline-none"
                autoFocus
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <span className="truncate flex-1">{name}</span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFileDelete(fullPath);
              }}
              className="opacity-0 group-hover:opacity-100 text-ide-textMuted hover:text-ide-error ml-auto
                         p-0.5 rounded hover:bg-ide-error/10 transition-all"
              title="Delete"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        );
      })}
    </>
  );
}

function buildFileTree(files) {
  const tree = {};
  for (const path of Object.keys(files)) {
    const parts = path.split('/');
    let current = tree;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        current[part] = { __isFile: true };
      } else {
        if (!current[part] || current[part].__isFile) {
          current[part] = {};
        }
        current = current[part];
      }
    }
  }
  return tree;
}
