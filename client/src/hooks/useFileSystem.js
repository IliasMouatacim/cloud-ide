import { useState, useCallback, useRef } from 'react';

const DEFAULT_FILES = {
  'index.html': '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>My Project</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <div class="container">\n    <h1>Welcome to Cloud IDE</h1>\n    <p>Start editing to see changes in the live preview!</p>\n    <button id="counter-btn">Click me: 0</button>\n  </div>\n  <script src="script.js"></script>\n</body>\n</html>',
  'style.css': '* {\n  margin: 0;\n  padding: 0;\n  box-sizing: border-box;\n}\n\nbody {\n  font-family: system-ui, -apple-system, sans-serif;\n  background: linear-gradient(135deg, #1e1e2e 0%, #181825 100%);\n  color: #cdd6f4;\n  min-height: 100vh;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n\n.container {\n  text-align: center;\n  padding: 3rem;\n  background: rgba(49, 50, 68, 0.5);\n  border-radius: 16px;\n  backdrop-filter: blur(10px);\n  border: 1px solid rgba(137, 180, 250, 0.2);\n}\n\nh1 {\n  color: #89b4fa;\n  font-size: 2.5rem;\n  margin-bottom: 1rem;\n}\n\np {\n  color: #a6adc8;\n  font-size: 1.1rem;\n  margin-bottom: 2rem;\n}\n\nbutton {\n  background: #89b4fa;\n  color: #1e1e2e;\n  border: none;\n  padding: 0.75rem 2rem;\n  font-size: 1rem;\n  border-radius: 8px;\n  cursor: pointer;\n  font-weight: 600;\n  transition: all 0.2s;\n}\n\nbutton:hover {\n  background: #74c7ec;\n  transform: translateY(-2px);\n  box-shadow: 0 4px 12px rgba(137, 180, 250, 0.3);\n}\n\nbutton:active {\n  transform: translateY(0);\n}',
  'script.js': '// Counter example\nlet count = 0;\nconst btn = document.getElementById("counter-btn");\n\nbtn.addEventListener("click", () => {\n  count++;\n  btn.textContent = `Click me: ${count}`;\n});\n\nconsole.log("Application loaded successfully!");\n'
};

const TEMPLATES = {
  blank: { 'index.html': '', 'style.css': '', 'script.js': '' },
  html: DEFAULT_FILES,
  react: {
    'index.html': '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>React App</title>\n</head>\n<body>\n  <div id="root"></div>\n  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>\n  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>\n  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>\n  <script type="text/babel" src="App.jsx"></script>\n</body>\n</html>',
    'App.jsx': 'function App() {\n  const [count, setCount] = React.useState(0);\n  return (\n    <div style={{ padding: "2rem", fontFamily: "system-ui", background: "#1e1e2e", color: "#cdd6f4", minHeight: "100vh" }}>\n      <h1 style={{ color: "#89b4fa" }}>React App</h1>\n      <p>Count: {count}</p>\n      <button onClick={() => setCount(c => c + 1)} style={{ background: "#89b4fa", color: "#1e1e2e", border: "none", padding: "0.5rem 1.5rem", borderRadius: "6px", cursor: "pointer", fontSize: "1rem" }}>\n        Increment\n      </button>\n    </div>\n  );\n}\n\nReactDOM.createRoot(document.getElementById("root")).render(<App />);\n',
    'style.css': '* { margin: 0; box-sizing: border-box; }'
  },
  python: {
    'main.py': 'def greet(name: str) -> str:\n    """Return a greeting message."""\n    return f"Hello, {name}!"\n\ndef fibonacci(n: int) -> list:\n    """Generate fibonacci sequence."""\n    if n <= 0:\n        return []\n    if n == 1:\n        return [0]\n    seq = [0, 1]\n    for _ in range(2, n):\n        seq.append(seq[-1] + seq[-2])\n    return seq\n\nif __name__ == "__main__":\n    print(greet("World"))\n    print(f"Fibonacci(10): {fibonacci(10)}")\n',
    'requirements.txt': '# Add your dependencies here\n',
    'README.md': '# Python Project\n\nRun with: `python main.py`\n'
  },
  node: {
    'index.js': 'const http = require("http");\n\nconst PORT = 3000;\n\nconst server = http.createServer((req, res) => {\n  res.writeHead(200, { "Content-Type": "application/json" });\n  res.end(JSON.stringify({ message: "Hello from Node.js!", time: new Date().toISOString() }));\n});\n\nserver.listen(PORT, () => {\n  console.log(`Server running on http://localhost:${PORT}`);\n});\n',
    'package.json': '{\n  "name": "my-node-app",\n  "version": "1.0.0",\n  "main": "index.js",\n  "scripts": {\n    "start": "node index.js"\n  }\n}',
    'README.md': '# Node.js Project\n\nRun with: `npm start`\n'
  }
};

export function useFileSystem() {
  const [files, setFiles] = useState(DEFAULT_FILES);
  const [openFiles, setOpenFiles] = useState(['index.html']);
  const [activeFile, setActiveFile] = useState('index.html');
  const [modifiedFiles, setModifiedFiles] = useState(new Set());
  const [projectName, setProjectName] = useState('my-project');
  const [cursorPosition, setCursorPosition] = useState({ line: 1, col: 1 });
  const savedContents = useRef({ ...DEFAULT_FILES });

  const openFile = useCallback((path) => {
    if (!files[path] && files[path] !== '') return;
    setActiveFile(path);
    setOpenFiles(prev => prev.includes(path) ? prev : [...prev, path]);
  }, [files]);

  const closeFile = useCallback((path) => {
    setOpenFiles(prev => {
      const next = prev.filter(f => f !== path);
      if (activeFile === path) {
        setActiveFile(next.length > 0 ? next[next.length - 1] : null);
      }
      return next;
    });
    setModifiedFiles(prev => {
      const next = new Set(prev);
      next.delete(path);
      return next;
    });
  }, [activeFile]);

  const createFile = useCallback((path) => {
    if (files[path] !== undefined) return;
    const content = getDefaultContent(path);
    setFiles(prev => ({ ...prev, [path]: content }));
    savedContents.current[path] = content;
    openFile(path);
  }, [files, openFile]);

  const createFolder = useCallback((folderPath) => {
    // Folders are implicit — just add a placeholder
    const placeholderPath = folderPath.endsWith('/')
      ? folderPath + '.gitkeep'
      : folderPath + '/.gitkeep';
    setFiles(prev => ({ ...prev, [placeholderPath]: '' }));
    savedContents.current[placeholderPath] = '';
  }, []);

  const deleteFile = useCallback((path) => {
    setFiles(prev => {
      const next = { ...prev };
      // Delete file and any children (for folders)
      for (const key of Object.keys(next)) {
        if (key === path || key.startsWith(path + '/')) {
          delete next[key];
          delete savedContents.current[key];
        }
      }
      return next;
    });
    closeFile(path);
  }, [closeFile]);

  const renameFile = useCallback((oldPath, newPath) => {
    if (oldPath === newPath) return;
    setFiles(prev => {
      const next = { ...prev };
      // Handle file and any children
      for (const key of Object.keys(next)) {
        if (key === oldPath || key.startsWith(oldPath + '/')) {
          const newKey = key === oldPath ? newPath : newPath + key.slice(oldPath.length);
          next[newKey] = next[key];
          savedContents.current[newKey] = savedContents.current[key];
          delete next[key];
          delete savedContents.current[key];
        }
      }
      return next;
    });
    setOpenFiles(prev => prev.map(f => f === oldPath ? newPath : f));
    if (activeFile === oldPath) setActiveFile(newPath);
  }, [activeFile]);

  const updateFile = useCallback((path, content) => {
    setFiles(prev => ({ ...prev, [path]: content }));
    setModifiedFiles(prev => {
      const next = new Set(prev);
      if (content !== savedContents.current[path]) {
        next.add(path);
      } else {
        next.delete(path);
      }
      return next;
    });
  }, []);

  const saveFile = useCallback((path) => {
    savedContents.current[path] = files[path];
    setModifiedFiles(prev => {
      const next = new Set(prev);
      next.delete(path);
      return next;
    });
  }, [files]);

  const getFileContent = useCallback((path) => {
    return files[path] ?? '';
  }, [files]);

  const loadTemplate = useCallback((templateName) => {
    const template = TEMPLATES[templateName];
    if (!template) return;
    setFiles(template);
    savedContents.current = { ...template };
    const firstFile = Object.keys(template)[0];
    setOpenFiles(firstFile ? [firstFile] : []);
    setActiveFile(firstFile || null);
    setModifiedFiles(new Set());
  }, []);

  return {
    files, openFiles, activeFile, modifiedFiles, projectName, cursorPosition,
    setProjectName, setCursorPosition,
    openFile, closeFile, createFile, createFolder, deleteFile, renameFile,
    updateFile, saveFile, getFileContent, loadTemplate
  };
}

function getDefaultContent(path) {
  const ext = path.split('.').pop().toLowerCase();
  const defaults = {
    html: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>New Page</title>\n</head>\n<body>\n  \n</body>\n</html>',
    css: '/* New stylesheet */\n',
    js: '// New script\n',
    jsx: 'export default function Component() {\n  return <div>New Component</div>;\n}\n',
    json: '{\n  \n}\n',
    md: '# Title\n',
    py: '# New Python file\n',
    ts: '// New TypeScript file\n',
    tsx: 'export default function Component() {\n  return <div>New Component</div>;\n}\n',
  };
  return defaults[ext] || '';
}
