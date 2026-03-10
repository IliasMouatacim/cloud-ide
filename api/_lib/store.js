const { v4: uuidv4 } = require('uuid');

// In-memory store (resets per cold start — fine for demo)
const users = new Map();
const projects = new Map();
const files = new Map();

const TEMPLATES = {
  blank: {},
  html: {
    'index.html': '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>My Project</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <h1>Hello World</h1>\n  <script src="script.js"></script>\n</body>\n</html>',
    'style.css': 'body {\n  font-family: system-ui, sans-serif;\n  margin: 0;\n  padding: 2rem;\n  background: #1e1e2e;\n  color: #cdd6f4;\n}\n\nh1 {\n  color: #89b4fa;\n}',
    'script.js': 'console.log("Hello from Cloud IDE!");\n'
  },
  react: {
    'index.html': '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>React App</title>\n</head>\n<body>\n  <div id="root"></div>\n  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>\n  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>\n  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>\n  <script type="text/babel" src="App.jsx"></script>\n</body>\n</html>',
    'App.jsx': 'function App() {\n  const [count, setCount] = React.useState(0);\n  return (\n    <div style={{ padding: "2rem", fontFamily: "system-ui" }}>\n      <h1>React App</h1>\n      <p>Count: {count}</p>\n      <button onClick={() => setCount(c => c + 1)}>Increment</button>\n    </div>\n  );\n}\nReactDOM.createRoot(document.getElementById("root")).render(<App />);\n',
    'style.css': 'body { margin: 0; font-family: system-ui, sans-serif; }'
  },
  node: {
    'index.js': 'const http = require("http");\n\nconst server = http.createServer((req, res) => {\n  res.writeHead(200, { "Content-Type": "text/plain" });\n  res.end("Hello from Node.js!");\n});\n\nserver.listen(3000, () => {\n  console.log("Server running on http://localhost:3000");\n});\n',
    'package.json': '{\n  "name": "my-node-app",\n  "version": "1.0.0",\n  "main": "index.js",\n  "scripts": { "start": "node index.js" }\n}'
  },
  python: {
    'main.py': 'def greet(name: str) -> str:\n    return f"Hello, {name}!"\n\nif __name__ == "__main__":\n    print(greet("World"))\n',
    'requirements.txt': '# Add your dependencies here\n'
  }
};

module.exports = {
  users, projects, files, TEMPLATES,

  createUser({ username, email, password }) {
    const id = uuidv4();
    const user = { id, username, email, password, createdAt: new Date().toISOString() };
    users.set(id, user);
    return user;
  },

  getUserByEmail(email) {
    for (const user of users.values()) {
      if (user.email === email) return user;
    }
    return null;
  },

  getUser(id) {
    return users.get(id) || null;
  },

  createProject({ name, userId, template }) {
    const id = uuidv4();
    const project = { id, name, userId, template, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    projects.set(id, project);
    const templateFiles = TEMPLATES[template] || {};
    for (const [path, content] of Object.entries(templateFiles)) {
      const key = `${id}:${path}`;
      files.set(key, { projectId: id, path, content, updatedAt: new Date().toISOString() });
    }
    return project;
  },

  getProject(id) { return projects.get(id) || null; },

  getProjectsByUser(userId) {
    const result = [];
    for (const p of projects.values()) { if (p.userId === userId) result.push(p); }
    return result;
  },

  deleteProject(id) {
    projects.delete(id);
    for (const key of files.keys()) { if (key.startsWith(id + ':')) files.delete(key); }
  },

  upsertFile(projectId, filePath, content) {
    const key = `${projectId}:${filePath}`;
    const file = { projectId, path: filePath, content, updatedAt: new Date().toISOString() };
    files.set(key, file);
    const project = projects.get(projectId);
    if (project) project.updatedAt = new Date().toISOString();
    return file;
  },

  getFilesByProject(projectId) {
    const result = [];
    for (const [key, file] of files.entries()) { if (key.startsWith(projectId + ':')) result.push(file); }
    return result;
  },

  getFile(projectId, filePath) { return files.get(`${projectId}:${filePath}`) || null; },

  deleteFile(projectId, filePath) { files.delete(`${projectId}:${filePath}`); },
};
