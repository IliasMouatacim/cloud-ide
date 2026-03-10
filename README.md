# ☁ Cloud IDE

A full-featured, browser-based cloud IDE inspired by VS Code, CodeSandbox, and Replit. Write, run, and preview code directly in the browser with real-time collaboration, integrated terminal, and live preview.

![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-%3E%3D20-green)
![React](https://img.shields.io/badge/react-18-61dafb)

---

## Features

### Core
- **Monaco Editor** — VS Code's editor engine with syntax highlighting, autocomplete, multi-file editing, keyboard shortcuts, formatting
- **File Explorer** — Tree-based file browser with create, rename, delete, search
- **Live Preview** — Instant HTML/CSS/JS output in a sandboxed iframe (like CodePen)
- **Integrated Terminal** — xterm.js-based terminal with WebSocket connection to server PTY
- **Multi-tab Editing** — Open multiple files simultaneously with tab management

### Advanced
- **Real-Time Collaboration** — Multiple users editing the same project via WebSockets (OT-based)
- **Git Integration** — Branch switching, commit, push/pull UI
- **Authentication** — Email/password with JWT tokens; GitHub OAuth ready
- **Code Execution Sandbox** — Isolated Docker containers for Python, Node.js, Bash with CPU/memory limits
- **Project Templates** — HTML, React, Node.js, Python starter templates

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        BROWSER (Client)                       │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ Monaco   │ │ Terminal  │ │  Live    │ │  Git / Collab    │ │
│  │ Editor   │ │ (xterm)  │ │ Preview  │ │  Panel           │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬─────────┘ │
│       │             │           │                 │            │
│  ┌────┴─────────────┴───────────┴─────────────────┴─────────┐ │
│  │              React + Tailwind + Vite                       │ │
│  └──────────────────────┬────────────────────────────────────┘ │
└─────────────────────────┼────────────────────────────────────┘
                          │ HTTP / WebSocket
┌─────────────────────────┼────────────────────────────────────┐
│                    SERVER (Node.js + Express)                  │
│  ┌──────────┐ ┌────────┐ ┌───────────┐ ┌──────────────────┐  │
│  │ REST API │ │  Auth  │ │ Terminal  │ │  Collaboration   │  │
│  │ Routes   │ │  JWT   │ │ Manager   │ │  (WebSocket)     │  │
│  └────┬─────┘ └────┬───┘ └─────┬─────┘ └────────┬─────────┘  │
│       │            │           │                 │             │
│  ┌────┴────────────┴───────────┴─────────────────┴──────────┐  │
│  │                    Service Layer                            │  │
│  └───────────┬──────────────┬───────────────┬───────────────┘  │
└──────────────┼──────────────┼───────────────┼─────────────────┘
               │              │               │
        ┌──────┴──────┐ ┌────┴─────┐  ┌──────┴──────┐
        │ PostgreSQL  │ │  Redis   │  │  Sandbox    │
        │ (data)      │ │  (queue) │  │  (Docker)   │
        └─────────────┘ └──────────┘  └─────────────┘
```

### Microservices Structure

| Service | Technology | Purpose |
|---------|-----------|---------|
| **Client** | React 18, Vite, Tailwind, Monaco Editor | IDE frontend |
| **API Server** | Express.js, WebSocket (ws) | REST API + real-time communication |
| **Terminal** | node-pty, xterm.js | Full PTY terminal sessions |
| **Collaboration** | WebSocket rooms, OT | Real-time multi-user editing |
| **Sandbox** | Docker, Node.js runner | Isolated code execution |
| **Database** | PostgreSQL 16 | User accounts, projects, files |
| **Cache/Queue** | Redis 7 | Job queue, session cache |

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 18, Vite, Tailwind CSS, Monaco Editor, xterm.js, react-resizable-panels |
| Backend | Node.js, Express, WebSocket (ws), node-pty, JWT, bcrypt |
| Database | PostgreSQL 16 (production) / In-memory Map (development) |
| Infrastructure | Docker, Docker Compose, Redis |
| Code Execution | Isolated Docker containers with CPU/memory limits |

---

## Getting Started

### Prerequisites

- Node.js >= 20
- npm >= 9
- Docker & Docker Compose (for production / sandbox)

### Development

```bash
# Clone the repository
git clone <repo-url>
cd cloud-ide

# Install all dependencies
npm run install:all

# Start development servers (client + server concurrently)
npm run dev
```

The client runs on `http://localhost:5173` and proxies API requests to the server on port `3001`.

### Production (Docker)

```bash
# Copy environment config
cp server/.env.example server/.env
# Edit server/.env with secure values

# Build and run all services
docker compose up --build -d

# View logs
docker compose logs -f app
```

The app will be available at `http://localhost:3001`.

---

## Project Structure

```
cloud-ide/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthModal.jsx      # Login/register modal
│   │   │   ├── CodeEditor.jsx     # Monaco editor wrapper
│   │   │   ├── EditorTabs.jsx     # File tab bar
│   │   │   ├── GitPanel.jsx       # Source control panel
│   │   │   ├── LivePreview.jsx    # iframe-based HTML preview
│   │   │   ├── Sidebar.jsx        # File tree explorer
│   │   │   ├── StatusBar.jsx      # Bottom status bar
│   │   │   ├── Terminal.jsx       # xterm.js terminal
│   │   │   ├── Titlebar.jsx       # Top menu bar
│   │   │   └── WelcomeTab.jsx     # Landing / template picker
│   │   ├── hooks/
│   │   │   ├── useAuth.js         # Authentication state
│   │   │   └── useFileSystem.js   # Virtual file system
│   │   ├── App.jsx                # Main layout
│   │   ├── main.jsx               # Entry point
│   │   └── index.css              # Global styles
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── server/                    # Node.js backend
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.js            # Auth endpoints
│   │   │   ├── files.js           # File CRUD endpoints
│   │   │   └── projects.js        # Project endpoints
│   │   ├── services/
│   │   │   ├── collaboration.js   # WebSocket collab rooms
│   │   │   ├── store.js           # In-memory data store
│   │   │   └── terminal.js        # PTY terminal manager
│   │   ├── middleware/
│   │   │   └── auth.js            # JWT middleware
│   │   └── index.js               # Server entry point
│   ├── .env.example
│   └── package.json
├── infrastructure/            # DevOps & infrastructure
│   ├── init.sql                   # PostgreSQL schema
│   └── sandbox/
│       ├── Dockerfile             # Sandbox container image
│       └── runner.js              # Code execution service
├── Dockerfile                 # Production multi-stage build
├── docker-compose.yml         # Full stack orchestration
├── .dockerignore
├── .gitignore
├── package.json               # Root workspace config
└── README.md
```

---

## API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Login with email/password |
| GET | `/api/auth/github` | GitHub OAuth (placeholder) |

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List user's projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project details |
| DELETE | `/api/projects/:id` | Delete project |

### Files

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/files/:projectId` | Get all project files |
| PUT | `/api/files/:projectId/*` | Create/update file |
| DELETE | `/api/files/:projectId/*` | Delete file |

### WebSocket

Connect to `/ws?type=terminal` for terminal sessions or `/ws?type=collaboration&projectId=<id>` for real-time collaboration.

---

## Container Orchestration

The `docker-compose.yml` defines four services:

1. **app** — Main IDE (frontend build + backend API server)
2. **redis** — Job queue and session caching
3. **postgres** — Persistent data storage with init script
4. **sandbox** — Isolated code execution with resource limits (1 CPU, 512MB RAM)

All services communicate over a private bridge network (`ide-network`). Data is persisted via named volumes (`redis-data`, `postgres-data`).

---

## Performance Considerations

- **Monaco Editor** loads on-demand with code splitting via Vite
- **Live preview** uses `Blob` URLs instead of `srcdoc` for better isolation and performance
- **WebSocket** connections are multiplexed (terminal + collaboration on one endpoint)
- **Terminal PTY** uses `node-pty` for native performance; falls back to simulated mode
- **Sandbox** has strict timeout (30s) and memory limits (256MB) to prevent abuse
- **Static assets** are gzipped and cached in production via Express.static

---

## Security

- JWT tokens (24h expiry) for API authentication
- Passwords hashed with bcrypt (12 rounds)
- Sandbox execution in isolated containers with non-root user
- iframe preview uses `sandbox="allow-scripts allow-modals"` (no same-origin)
- CORS configured to specific origin
- SQL injection prevented via parameterized queries (when using PostgreSQL)
- Resource limits on sandbox containers (CPU, memory, execution time)

---

## License

MIT
