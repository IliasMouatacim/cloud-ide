/**
 * In-memory store for development. Replace with PostgreSQL for production.
 */
const { v4: uuidv4 } = require('uuid');

const users = new Map();
const projects = new Map();
const files = new Map(); // key: `${projectId}:${filePath}`

// ── Users ──
function createUser({ username, email, password }) {
  const id = uuidv4();
  const user = { id, username, email, password, createdAt: new Date().toISOString() };
  users.set(id, user);
  return user;
}

function getUserByEmail(email) {
  for (const user of users.values()) {
    if (user.email === email) return user;
  }
  return null;
}

function getUser(id) {
  return users.get(id) || null;
}

// ── Projects ──
const TEMPLATES = {
  blank: {},
  html: {
    'index.html': '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>My Project</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <h1>Hello World</h1>\n  <script src="script.js"></script>\n</body>\n</html>',
    'style.css': 'body {\n  font-family: system-ui, sans-serif;\n  margin: 0;\n  padding: 2rem;\n  background: #1e1e2e;\n  color: #cdd6f4;\n}\n\nh1 {\n  color: #89b4fa;\n}',
    'script.js': 'console.log("Hello from Cloud IDE!");\n'
  },
  nextjs: {
    'package.json': '{\n  "name": "next-app",\n  "private": true,\n  "version": "0.1.0",\n  "scripts": {\n    "dev": "next dev",\n    "build": "next build",\n    "start": "next start",\n    "lint": "next lint"\n  },\n  "dependencies": {\n    "next": "14.2.5",\n    "react": "18.3.1",\n    "react-dom": "18.3.1"\n  }\n}\n',
    'next.config.mjs': '/** @type {import("next").NextConfig} */\nconst nextConfig = {};\n\nexport default nextConfig;\n',
    'app/layout.jsx': 'import "./globals.css";\n\nexport const metadata = {\n  title: "Cloud IDE Next App",\n  description: "Generated in Cloud IDE"\n};\n\nexport default function RootLayout({ children }) {\n  return (\n    <html lang="en">\n      <body>{children}</body>\n    </html>\n  );\n}\n',
    'app/page.jsx': 'export default function HomePage() {\n  return (\n    <main style={{ fontFamily: "Inter, sans-serif", padding: "3rem", maxWidth: "720px", margin: "0 auto" }}>\n      <h1 style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>Next.js in Cloud IDE</h1>\n      <p style={{ lineHeight: 1.6, marginBottom: "1rem" }}>\n        Edit app/page.jsx and app/layout.jsx to start building your app.\n      </p>\n      <code style={{ background: "#111827", color: "#e5e7eb", padding: "0.45rem 0.6rem", borderRadius: "8px", display: "inline-block" }}>\n        npm install && npm run dev\n      </code>\n    </main>\n  );\n}\n',
    'app/globals.css': '* { box-sizing: border-box; }\nhtml, body { margin: 0; padding: 0; }\nbody { background: #f8fafc; color: #0f172a; }\n',
    'README.md': '# Next.js Project\n\n1. Install dependencies: `npm install`\n2. Start dev server: `npm run dev`\n3. Set Preview Port to `3000` in the top bar\n'
  },
  react: {
    'index.html': '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>React App</title>\n</head>\n<body>\n  <div id="root"></div>\n  <script type="module" src="index.jsx"></script>\n</body>\n</html>',
    'index.jsx': 'import React from "react";\nimport ReactDOM from "react-dom/client";\nimport App from "./App";\n\nReactDOM.createRoot(document.getElementById("root")).render(<App />);\n',
    'App.jsx': 'import React, { useState } from "react";\n\nexport default function App() {\n  const [count, setCount] = useState(0);\n  return (\n    <div style={{ padding: "2rem", fontFamily: "system-ui" }}>\n      <h1>React App</h1>\n      <p>Count: {count}</p>\n      <button onClick={() => setCount(c => c + 1)}>Increment</button>\n    </div>\n  );\n}\n',
    'style.css': 'body {\n  margin: 0;\n  font-family: system-ui, sans-serif;\n}'
  },
  node: {
    'index.js': 'const http = require("http");\n\nconst server = http.createServer((req, res) => {\n  res.writeHead(200, { "Content-Type": "text/plain" });\n  res.end("Hello from Node.js!");\n});\n\nserver.listen(3000, () => {\n  console.log("Server running on http://localhost:3000");\n});\n',
    'package.json': '{\n  "name": "my-node-app",\n  "version": "1.0.0",\n  "main": "index.js",\n  "scripts": {\n    "start": "node index.js"\n  }\n}'
  },
  python: {
    'main.py': 'def greet(name: str) -> str:\n    return f"Hello, {name}!"\n\nif __name__ == "__main__":\n    print(greet("World"))\n',
    'requirements.txt': '# Add your dependencies here\n'
  }
};

function createProject({ name, userId, template }) {
  const id = uuidv4();
  const project = {
    id,
    name,
    userId,
    template,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  projects.set(id, project);

  // Populate template files
  const templateFiles = TEMPLATES[template] || {};
  for (const [path, content] of Object.entries(templateFiles)) {
    upsertFile(id, path, content);
  }

  return project;
}

function getProject(id) {
  return projects.get(id) || null;
}

function getProjectsByUser(userId) {
  const result = [];
  for (const project of projects.values()) {
    if (project.userId === userId) result.push(project);
  }
  return result;
}

function deleteProject(id) {
  projects.delete(id);
  // Delete all files for this project
  for (const key of files.keys()) {
    if (key.startsWith(id + ':')) {
      files.delete(key);
    }
  }
}

// ── Files ──
function upsertFile(projectId, filePath, content) {
  const key = `${projectId}:${filePath}`;
  const file = {
    projectId,
    path: filePath,
    content,
    updatedAt: new Date().toISOString()
  };
  files.set(key, file);

  // Update project timestamp
  const project = projects.get(projectId);
  if (project) {
    project.updatedAt = new Date().toISOString();
  }

  return file;
}

function getFilesByProject(projectId) {
  const result = [];
  for (const [key, file] of files.entries()) {
    if (key.startsWith(projectId + ':')) {
      result.push(file);
    }
  }
  return result;
}

function getFile(projectId, filePath) {
  return files.get(`${projectId}:${filePath}`) || null;
}

function deleteFile(projectId, filePath) {
  files.delete(`${projectId}:${filePath}`);
}

module.exports = {
  createUser, getUserByEmail, getUser,
  createProject, getProject, getProjectsByUser, deleteProject,
  upsertFile, getFilesByProject, getFile, deleteFile,
  TEMPLATES
};
