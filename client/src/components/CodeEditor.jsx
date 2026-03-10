import React, { useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';

const LANGUAGE_MAP = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  rb: 'ruby',
  java: 'java',
  cpp: 'cpp',
  c: 'c',
  cs: 'csharp',
  go: 'go',
  rs: 'rust',
  php: 'php',
  html: 'html',
  htm: 'html',
  css: 'css',
  scss: 'scss',
  less: 'less',
  json: 'json',
  md: 'markdown',
  yml: 'yaml',
  yaml: 'yaml',
  xml: 'xml',
  sql: 'sql',
  sh: 'shell',
  bash: 'shell',
  toml: 'ini',
  env: 'ini',
  txt: 'plaintext',
  gitkeep: 'plaintext',
};

function getLanguage(filePath) {
  const ext = filePath.split('.').pop().toLowerCase();
  return LANGUAGE_MAP[ext] || 'plaintext';
}

export default function CodeEditor({ file, content, onChange, onSave }) {
  const editorRef = useRef(null);

  const handleMount = useCallback((editor, monaco) => {
    editorRef.current = editor;

    // Define the Catppuccin Mocha inspired theme
    monaco.editor.defineTheme('cloud-ide-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6c7086', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'cba6f7' },
        { token: 'string', foreground: 'a6e3a1' },
        { token: 'number', foreground: 'fab387' },
        { token: 'type', foreground: 'f9e2af' },
        { token: 'variable', foreground: 'cdd6f4' },
        { token: 'function', foreground: '89b4fa' },
        { token: 'operator', foreground: '89dceb' },
        { token: 'tag', foreground: 'f38ba8' },
        { token: 'attribute.name', foreground: 'f9e2af' },
        { token: 'attribute.value', foreground: 'a6e3a1' },
        { token: 'delimiter', foreground: '9399b2' },
      ],
      colors: {
        'editor.background': '#1e1e2e',
        'editor.foreground': '#cdd6f4',
        'editor.lineHighlightBackground': '#313244',
        'editor.selectionBackground': '#45475a',
        'editor.inactiveSelectionBackground': '#31324480',
        'editorCursor.foreground': '#f5e0dc',
        'editorWhitespace.foreground': '#31324450',
        'editorIndentGuide.background': '#31324480',
        'editorIndentGuide.activeBackground': '#45475a',
        'editorLineNumber.foreground': '#6c7086',
        'editorLineNumber.activeForeground': '#cdd6f4',
        'editor.selectionHighlightBackground': '#45475a40',
        'editorBracketMatch.background': '#45475a50',
        'editorBracketMatch.border': '#89b4fa50',
        'editorWidget.background': '#181825',
        'editorSuggestWidget.background': '#181825',
        'editorSuggestWidget.border': '#313244',
        'editorSuggestWidget.selectedBackground': '#313244',
        'list.hoverBackground': '#313244',
        'minimap.background': '#181825',
      }
    });

    monaco.editor.setTheme('cloud-ide-dark');

    // Ctrl+S / Cmd+S to save
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave?.();
    });

    editor.focus();
  }, [onSave]);

  const handleChange = useCallback((value) => {
    onChange?.(value || '');
  }, [onChange]);

  return (
    <div className="flex-1 overflow-hidden">
      <Editor
        height="100%"
        path={file}
        language={getLanguage(file)}
        value={content}
        onChange={handleChange}
        onMount={handleMount}
        theme="cloud-ide-dark"
        options={{
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontLigatures: true,
          minimap: { enabled: true, maxColumn: 80 },
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          renderWhitespace: 'selection',
          bracketPairColorization: { enabled: true },
          guides: { bracketPairs: true, indentation: true },
          autoClosingBrackets: 'always',
          autoClosingQuotes: 'always',
          formatOnPaste: true,
          suggestOnTriggerCharacters: true,
          tabSize: 2,
          wordWrap: 'off',
          padding: { top: 8 },
          lineNumbers: 'on',
          glyphMargin: false,
          folding: true,
          links: true,
        }}
      />
    </div>
  );
}
