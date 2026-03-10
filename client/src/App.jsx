import React, { useState, useCallback } from 'react';
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
import { useFileSystem } from './hooks/useFileSystem';
import { useAuth } from './hooks/useAuth';

export default function App() {
  const { user, token, login, register, logout, showAuth, setShowAuth } = useAuth();
  const fs = useFileSystem();
  const [showPreview, setShowPreview] = useState(true);
  const [showTerminal, setShowTerminal] = useState(true);
  const [showGit, setShowGit] = useState(false);
  const [sidebarSection, setSidebarSection] = useState('files'); // files | search | git | extensions

  const handleRunCode = useCallback(() => {
    setShowPreview(true);
  }, []);

  return (
    <div className="h-full flex flex-col bg-ide-bg">
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
      />

      {/* Main content */}
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
    { id: 'files', icon: '📁', label: 'Explorer' },
    { id: 'search', icon: '🔍', label: 'Search' },
    { id: 'git', icon: '⑂', label: 'Source Control', onClick: onToggleGit },
    { id: 'extensions', icon: '⧉', label: 'Extensions' },
  ];

  return (
    <div className="w-12 bg-ide-sidebar flex flex-col items-center py-2 border-r border-ide-border">
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => {
            if (item.onClick) item.onClick();
            onSectionChange(item.id);
          }}
          className={`w-10 h-10 flex items-center justify-center text-lg mb-1 rounded transition-colors
            ${section === item.id
              ? 'text-ide-accent bg-ide-bg/50 border-l-2 border-ide-accent'
              : 'text-ide-textMuted hover:text-ide-text'}`}
          title={item.label}
        >
          {item.icon}
        </button>
      ))}
    </div>
  );
}
