import React, { useState, useCallback, useEffect } from 'react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import Sidebar from './components/Sidebar';
import EditorTabs from './components/EditorTabs';
import CodeEditor from './components/CodeEditor';
import Terminal from './components/Terminal';
import LivePreview from './components/LivePreview';
import Titlebar from './components/Titlebar';
import AuthModal from './components/AuthModal';
import GitPanel from './components/GitPanel';
import StatusBar from './components/StatusBar';
import WelcomeTab from './components/WelcomeTab';
import QuickOpen from './components/QuickOpen';
import ErrorBoundary from './components/ErrorBoundary';
import { useFileSystem } from './hooks/useFileSystem';
import { useAuth } from './hooks/useAuth';

export default function App() {
  const { user, token, login, register, logout, showAuth, setShowAuth } = useAuth();
  const fs = useFileSystem();
  const [showPreview, setShowPreview] = useState(true);
  const [showTerminal, setShowTerminal] = useState(true);
  const [showGit, setShowGit] = useState(false);
  const [sidebarSection, setSidebarSection] = useState('files'); // files | search | git | extensions
  const [showQuickOpen, setShowQuickOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleRunCode = useCallback(() => {
    setShowPreview(true);
  }, []);

  /* ── Read a single file handle into text ────────────────────────── */
  const readFileHandle = async (handle, basePath = '') => {
    const file = await handle.getFile();
    const text = await file.text();
    const path = basePath ? `${basePath}/${file.name}` : file.name;
    return { path, text };
  };

  /* ── Recursively read a directory handle ────────────────────────── */
  const readDirHandle = async (dirHandle, basePath = '') => {
    const result = {};
    for await (const [name, handle] of dirHandle.entries()) {
      // skip hidden / system folders
      if (name.startsWith('.') || name === 'node_modules') continue;
      const entryPath = basePath ? `${basePath}/${name}` : name;
      if (handle.kind === 'file') {
        try {
          const file = await handle.getFile();
          // skip files > 1 MB to avoid locking the browser
          if (file.size > 1_048_576) continue;
          result[entryPath] = await file.text();
        } catch { /* skip unreadable */ }
      } else {
        const sub = await readDirHandle(handle, entryPath);
        Object.assign(result, sub);
      }
    }
    return result;
  };

  /* ── Open File (modern API → fallback to <input>) ───────────────── */
  const handleOpenFile = useCallback(async () => {
    try {
      if (window.showOpenFilePicker) {
        const [handle] = await window.showOpenFilePicker({
          multiple: false,
        });
        const { path, text } = await readFileHandle(handle);
        fs.loadFiles({ [path]: text });
      } else {
        // fallback for browsers without File System Access API
        const input = document.createElement('input');
        input.type = 'file';
        input.onchange = async () => {
          const file = input.files[0];
          if (!file) return;
          const text = await file.text();
          fs.loadFiles({ [file.name]: text });
        };
        input.click();
      }
    } catch (e) {
      // user cancelled the picker — ignore
      if (e.name !== 'AbortError') console.error(e);
    }
  }, [fs]);

  /* ── Open Folder ────────────────────────────────────────────────── */
  const handleOpenFolder = useCallback(async () => {
    try {
      if (window.showDirectoryPicker) {
        const dirHandle = await window.showDirectoryPicker();
        const files = await readDirHandle(dirHandle);
        if (Object.keys(files).length > 0) {
          fs.loadFiles(files, dirHandle.name);
        }
      } else {
        // fallback: use <input webkitdirectory>
        const input = document.createElement('input');
        input.type = 'file';
        input.webkitdirectory = true;
        input.onchange = async () => {
          const result = {};
          for (const file of input.files) {
            // webkitRelativePath gives "folder/subfolder/file.txt"
            const path = file.webkitRelativePath || file.name;
            // strip the top-level folder prefix
            const parts = path.split('/');
            const folderName = parts[0];
            const relative = parts.slice(1).join('/') || file.name;
            if (file.size <= 1_048_576) {
              result[relative] = await file.text();
            }
            // use the root folder name as project name
            if (!input._folderName) input._folderName = folderName;
          }
          if (Object.keys(result).length > 0) {
            fs.loadFiles(result, input._folderName);
          }
        };
        input.click();
      }
    } catch (e) {
      if (e.name !== 'AbortError') console.error(e);
    }
  }, [fs]);

  /* ── Save current file ──────────────────────────────────────────── */
  const handleSave = useCallback(() => {
    if (fs.activeFile) fs.saveFile(fs.activeFile);
  }, [fs]);

  /* ── Download project as ZIP ────────────────────────────────────── */
  const handleDownloadProject = useCallback(async () => {
    // Build a simple ZIP manually (no library needed for basic files)
    // Use a lightweight approach: create a blob of all files as a self-extracting bundle
    const entries = Object.entries(fs.files);
    if (entries.length === 0) return;

    // Create a simple tar-like bundle approach, or just download files individually
    // For best UX, create a zip-like structure using compression streams if available
    try {
      // Try using JSZip-like approach with Blob
      const { default: JSZip } = await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm').catch(() => ({ default: null }));
      
      if (JSZip) {
        const zip = new JSZip();
        for (const [path, content] of entries) {
          zip.file(path, content);
        }
        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fs.projectName || 'project'}.zip`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        throw new Error('fallback');
      }
    } catch {
      // Fallback: download as a single HTML file with all content embedded
      let content = '';
      for (const [path, text] of entries) {
        content += `===== ${path} =====\n${text}\n\n`;
      }
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fs.projectName || 'project'}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [fs.files, fs.projectName]);

  /* ── Global keyboard shortcuts ──────────────────────────────────── */
  useEffect(() => {
    const handler = (e) => {
      const ctrl = e.ctrlKey || e.metaKey;

      // Ctrl+P — Quick Open
      if (ctrl && e.key === 'p') {
        e.preventDefault();
        setShowQuickOpen(prev => !prev);
      }
      // Ctrl+` — Toggle Terminal
      if (ctrl && e.key === '`') {
        e.preventDefault();
        setShowTerminal(prev => !prev);
      }
      // Ctrl+Enter — Run Code
      if (ctrl && e.key === 'Enter') {
        e.preventDefault();
        handleRunCode();
      }
      // Ctrl+Shift+F — Focus Search
      if (ctrl && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        setSidebarSection('search');
      }
      // Ctrl+O — Open File
      if (ctrl && !e.shiftKey && e.key === 'o') {
        e.preventDefault();
        handleOpenFile();
      }
      // Ctrl+Shift+O — Open Folder
      if (ctrl && e.shiftKey && e.key === 'O') {
        e.preventDefault();
        handleOpenFolder();
      }
      // Ctrl+B — Toggle Sidebar (bonus)
      if (ctrl && e.key === 'b') {
        e.preventDefault();
        setSidebarSection(prev => prev ? prev : 'files');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleOpenFile, handleOpenFolder, handleRunCode]);

  /* ── Drag & drop files ──────────────────────────────────────────── */
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const items = e.dataTransfer.items;
    const newFiles = {};

    for (const item of items) {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file && file.size <= 1_048_576) {
          const text = await file.text();
          newFiles[file.name] = text;
        }
      }
    }

    if (Object.keys(newFiles).length > 0) {
      fs.loadFiles(newFiles);
    }
  }, [fs]);

  return (
    <div
      className={`h-full flex flex-col bg-ide-bg ${isDragOver ? 'ring-2 ring-inset ring-ide-accent/50' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragOver && (
        <div className="fixed inset-0 z-50 bg-ide-accent/10 flex items-center justify-center pointer-events-none">
          <div className="bg-ide-panel border-2 border-dashed border-ide-accent rounded-2xl p-8 shadow-float animate-fadeIn">
            <p className="text-ide-accent text-sm font-medium">Drop files to open</p>
          </div>
        </div>
      )}

      {/* Quick Open dialog */}
      {showQuickOpen && (
        <QuickOpen
          files={fs.files}
          onSelect={(path) => { fs.openFile(path); setShowQuickOpen(false); }}
          onClose={() => setShowQuickOpen(false)}
        />
      )}

      {/* Titlebar */}
      <Titlebar
        user={user}
        onLogin={() => setShowAuth(true)}
        onLogout={logout}
        onTogglePreview={() => setShowPreview(p => !p)}
        onToggleTerminal={() => setShowTerminal(p => !p)}
        onRun={handleRunCode}
        showPreview={showPreview}
        showTerminal={showTerminal}
        projectName={fs.projectName}
        onProjectNameChange={fs.setProjectName}
        onOpenFile={handleOpenFile}
        onOpenFolder={handleOpenFolder}
        onSave={handleSave}
        onDownload={handleDownloadProject}
        onToggleSearch={() => setSidebarSection('search')}
      />

      {/* Main content */}
      <ErrorBoundary>
      <div className="flex-1 flex overflow-hidden">
        {/* Activity Bar */}
        <ActivityBar
          section={sidebarSection}
          onSectionChange={setSidebarSection}
          onToggleGit={() => setShowGit(g => !g)}
        />

        <PanelGroup direction="horizontal">
          {/* Sidebar */}
          <Panel defaultSize={18} minSize={12} maxSize={35}>
            <Sidebar
              files={fs.files}
              activeFile={fs.activeFile}
              onFileSelect={fs.openFile}
              onFileCreate={fs.createFile}
              onFileDelete={fs.deleteFile}
              onFileRename={fs.renameFile}
              onFolderCreate={fs.createFolder}
              section={sidebarSection}
            />
          </Panel>
          <PanelResizeHandle />

          {/* Editor + Terminal */}
          <Panel defaultSize={showPreview ? 50 : 82} minSize={30}>
            <PanelGroup direction="vertical">
              <Panel defaultSize={showTerminal ? 70 : 100} minSize={30}>
                <div className="h-full flex flex-col">
                  <EditorTabs
                    openFiles={fs.openFiles}
                    activeFile={fs.activeFile}
                    onTabSelect={fs.openFile}
                    onTabClose={fs.closeFile}
                    modifiedFiles={fs.modifiedFiles}
                  />
                  {fs.activeFile ? (
                    <CodeEditor
                      file={fs.activeFile}
                      content={fs.getFileContent(fs.activeFile)}
                      onChange={(content) => fs.updateFile(fs.activeFile, content)}
                      onSave={() => fs.saveFile(fs.activeFile)}
                      onCursorChange={fs.setCursorPosition}
                    />
                  ) : (
                    <WelcomeTab onNewProject={fs.loadTemplate} />
                  )}
                </div>
              </Panel>
              {showTerminal && (
                <>
                  <PanelResizeHandle />
                  <Panel defaultSize={30} minSize={10} maxSize={60}>
                    <Terminal />
                  </Panel>
                </>
              )}
            </PanelGroup>
          </Panel>

          {/* Live Preview */}
          {showPreview && (
            <>
              <PanelResizeHandle />
              <Panel defaultSize={32} minSize={15}>
                <LivePreview files={fs.files} />
              </Panel>
            </>
          )}
        </PanelGroup>

        {/* Git panel overlay */}
        {showGit && (
          <GitPanel
            files={fs.files}
            onClose={() => setShowGit(false)}
          />
        )}
      </div>
      </ErrorBoundary>

      {/* Status Bar */}
      <StatusBar
        activeFile={fs.activeFile}
        cursorPosition={fs.cursorPosition}
        fileCount={Object.keys(fs.files).length}
        user={user}
      />

      {/* Auth Modal */}
      {showAuth && (
        <AuthModal
          onLogin={login}
          onRegister={register}
          onClose={() => setShowAuth(false)}
        />
      )}
    </div>
  );
}

function ActivityBar({ section, onSectionChange, onToggleGit }) {
  const items = [
    {
      id: 'files',
      label: 'Explorer',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
        </svg>
      ),
    },
    {
      id: 'search',
      label: 'Search',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      ),
    },
    {
      id: 'git',
      label: 'Source Control',
      onClick: onToggleGit,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 012 2v7M6 9v12"/>
        </svg>
      ),
    },
    {
      id: 'extensions',
      label: 'Extensions',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="w-12 bg-ide-sidebar flex flex-col items-center pt-2 border-r border-ide-border shrink-0">
      {items.map(item => {
        const isActive = section === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              if (item.onClick) item.onClick();
              onSectionChange(item.id);
            }}
            className={`relative w-10 h-10 flex items-center justify-center mb-0.5 rounded-md transition-all
              ${isActive
                ? 'text-ide-accent'
                : 'text-ide-textSubtle hover:text-ide-textMuted'}`}
            title={item.label}
          >
            {isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 bg-ide-accent rounded-r" />
            )}
            {item.icon}
          </button>
        );
      })}
    </div>
  );
}
