import React, { useState, useMemo } from 'react';

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
    return (
      <div className="h-full bg-ide-sidebar flex flex-col">
        <div className="p-3 text-xs font-semibold text-ide-textMuted uppercase tracking-wider">Search</div>
        <div className="px-3 pb-2">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search in files..."
            className="w-full px-2 py-1.5 text-xs bg-ide-bg border border-ide-border rounded
                       text-ide-text placeholder-ide-textMuted focus:outline-none focus:border-ide-accent"
          />
        </div>
        <div className="flex-1 overflow-y-auto px-3">
          {searchQuery && Object.entries(files)
            .filter(([path, content]) =>
              path.toLowerCase().includes(searchQuery.toLowerCase()) ||
              content.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map(([path]) => (
              <button
                key={path}
                onClick={() => onFileSelect(path)}
                className="w-full text-left text-xs py-1 px-2 rounded hover:bg-ide-bg/50 text-ide-text truncate"
              >
                {getFileIcon(path)} {path}
              </button>
            ))
          }
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-ide-sidebar flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <span className="text-xs font-semibold text-ide-textMuted uppercase tracking-wider">Explorer</span>
        <div className="flex gap-1">
          <button
            onClick={() => setShowNewFile(true)}
            className="text-ide-textMuted hover:text-ide-text text-sm p-0.5 rounded hover:bg-ide-bg/50"
            title="New File"
          >
            +
          </button>
          <button
            onClick={() => {
              const name = 'new-folder';
              onFolderCreate(name);
            }}
            className="text-ide-textMuted hover:text-ide-text text-sm p-0.5 rounded hover:bg-ide-bg/50"
            title="New Folder"
          >
            📂
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
            className="w-full px-2 py-1 text-xs bg-ide-bg border border-ide-accent rounded
                       text-ide-text placeholder-ide-textMuted focus:outline-none"
            autoFocus
            onBlur={() => {
              if (!newFileName.trim()) setShowNewFile(false);
            }}
          />
        </form>
      )}

      {/* File tree */}
      <div className="flex-1 overflow-y-auto">
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
                className={`w-full flex items-center gap-1 py-0.5 text-xs hover:bg-ide-bg/50 transition-colors
                  text-ide-text`}
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
              >
                <span className="text-[10px]">{isExpanded ? '▼' : '▶'}</span>
                <span>{isExpanded ? '📂' : '📁'}</span>
                <span className="truncate">{name}</span>
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
            className={`group flex items-center gap-1 py-0.5 pr-2 text-xs cursor-pointer transition-colors
              ${isActive ? 'bg-ide-accent/10 text-ide-accent' : 'text-ide-text hover:bg-ide-bg/50'}`}
            style={{ paddingLeft: `${depth * 12 + 20}px` }}
            onClick={() => onFileSelect(fullPath)}
            onDoubleClick={() => {
              setRenamingFile(fullPath);
              setRenameValue(fullPath);
            }}
          >
            <span>{getFileIcon(name)}</span>
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
                className="flex-1 bg-ide-bg border border-ide-accent rounded px-1 text-xs text-ide-text focus:outline-none"
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
              className="opacity-0 group-hover:opacity-100 text-ide-textMuted hover:text-ide-error text-[10px] ml-auto transition-opacity"
              title="Delete"
            >
              ✕
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

function getFileIcon(name) {
  const ext = name.split('.').pop().toLowerCase();
  const icons = {
    html: '🌐', htm: '🌐',
    css: '🎨', scss: '🎨', less: '🎨',
    js: '📜', jsx: '⚛️', ts: '📘', tsx: '⚛️',
    json: '📋',
    md: '📝', txt: '📄',
    py: '🐍',
    java: '☕',
    cpp: '⚙️', c: '⚙️', h: '⚙️',
    go: '🔷',
    rs: '🦀',
    rb: '💎',
    php: '🐘',
    svg: '🖼️', png: '🖼️', jpg: '🖼️',
    gitkeep: '📎',
    yml: '⚙️', yaml: '⚙️', toml: '⚙️',
    sh: '🔧', bash: '🔧',
    sql: '🗃️',
    env: '🔒',
  };
  return icons[ext] || '📄';
}
