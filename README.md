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
- **Project Templates** — HTML, React, Next.js, Node.js, Python starter templates

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

### Runtime Note (Terminal + Next.js/Python)

If you deploy only the client (or deploy on serverless platforms without persistent WebSocket + PTY process support), the integrated terminal falls back to simulation and cannot run real `npm`/`python` commands.

For real execution in hosted environments:

- Deploy the Node server (`server/src/index.js`) on a host that supports long-lived WebSockets and processes (Docker VM, Railway, Fly.io, Render, etc.).
- Point the client to that runtime host with environment variables:

```bash
VITE_API_URL=https://your-runtime-host
VITE_TERMINAL_WS_URL=wss://your-runtime-host/ws?type=terminal
VITE_PREVIEW_URL=https://your-preview-host
# or: VITE_PREVIEW_BASE_URL=https://your-preview-host
```

`VITE_PREVIEW_URL` is the full URL used by preview iframe when a dev server port is set. If not provided, preview defaults to `http://localhost:<port>`.

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

## Verified implementation and Docker development

The Express API supports project creation, listing, lookup and deletion, with JWT authentication and ownership checks on project and file routes. Registration hashes passwords using bcrypt; email addresses are normalized and inputs are checked for type and size. Invalid JSON, oversized requests and unknown API paths return JSON errors with HTTP status codes.

Docker Compose connects the API to **PostgreSQL** for persistent users, projects and files. Local development without `DATABASE_URL` uses an in-memory store. Redis remains an optional infrastructure example, not connected caching. MySQL and SQL Server are not implemented integrations; familiarity with those technologies should be described as separate skills.

Create a root `.env` with a locally generated `JWT_SECRET`, then run `docker compose up --build -d app`. The application serves the built frontend and API on port 3001 and runs as a non-root user with a health check. The Docker build uses the root workspace lockfile. PostgreSQL starts automatically with the app; Compose waits for its health check. Its named volume retains data across container restarts. Use `docker compose --profile infrastructure up -d redis` for the optional Redis service. The sandbox is a separate optional profile and is not wired into terminal execution. The terminal executes on the application host/container, so this project is for trusted local development, not untrusted multi-user hosting.

In managed environments with an HTTPS inspection certificate, build using `docker build --secret id=proxy_ca,src="$CODEX_PROXY_CERT" -t cloud-ide:dev .`. Never disable TLS verification.

### PostgreSQL backend

Set `DATABASE_URL` for direct backend development, for example `postgresql://ide:<password>@localhost:5432/cloud_ide`. Compose configures its database host, user, password and database automatically; change `POSTGRES_PASSWORD` in the root `.env` before the first start. Changing the variable does not rotate a password in an existing database volume. Keep that volume to preserve data; `docker compose down -v` deletes it.

The API initializes the schema idempotently before listening and fails startup if PostgreSQL is unavailable. Production requires `DATABASE_URL`. Health checks query the database and return HTTP 503 on failure. SQL queries use parameters; creating template projects and updating files use transactions. Foreign keys cascade project deletion to files. Existing in-memory data is not migrated automatically.

Run `npm test --workspace=server` for API regression tests. To execute the real PostgreSQL persistence test as well, set `TEST_DATABASE_URL` to a dedicated test database and run the same command. It verifies account login, projects and file content after API restart, template creation, duplicate registration and cascading deletion.

### Cloud project library

Sign in and use **Save cloud copy** to save the current editor workspace as a new project. Each click creates a separate copy and enables autosave for that copy. Opening a cloud project also enables autosave. **My projects** lists your saved work, supports search, and lets you reopen or delete a project. Opening replaces the current editor workspace after confirmation. Names, file edits, renames and deletions sync after a short pause. The status badge shows saving, saved, or unsynced changes. Failed saves can be retried; revision conflicts pause syncing so you can preserve your local edits as a new copy or reopen the remote version.

`POST /api/projects/snapshot` accepts `{name, files}` with up to 200 relative file paths and 1 MB per file (within the API's 10 MB request limit). PostgreSQL commits the project and all files in one transaction. Ownership checks also apply to these saved projects. Use the PostgreSQL configuration for durable storage; development without `DATABASE_URL` remains temporary.

Autosave uses `GET/PUT /api/projects/:id/snapshot` with an integer `revision`. Reads return a consistent project/file snapshot; updates atomically replace the files only if the revision still matches. Competing writes return HTTP 409. Individual file updates also increment the revision. New templates and sign-out detach the cloud project. After a page reload, the local recovery workspace remains available; reopen a cloud project or save a new copy to enable sync again. The browser warns before leaving with pending cloud changes.

### Backend operational boundaries

The persistent server and serverless HTTP adapters share the same Express routes, validation, authentication and PostgreSQL store. Serverless HTTP requires `DATABASE_URL` and a `JWT_SECRET` of at least 32 characters; persistent WebSockets require the Node runtime. Set `CLIENT_URL` to the exact browser origin (comma-separated for multiple origins). Production startup rejects missing database configuration or a short signing secret.

REST responses include `X-Request-ID`; JSON errors include `requestId`. Structured logs record request IDs, methods, statuses and durations without request bodies, credentials or query strings. `/api/live` checks the process; `/api/health` also checks PostgreSQL. SIGTERM drains HTTP requests, closes sockets and releases database connections, with a 10-second shutdown deadline. Pools and SQL queries have bounded timeouts. Schema initialization uses an advisory lock and a version ledger; future schema changes require a new migration version rather than editing an already-applied migration.

HTTP limits are 300 requests/minute/IP, 30 unsuccessful authentication attempts/15 minutes/IP, and 15 AI requests/minute/IP. These limits and single-use socket tickets are process-local. Multi-instance deployment needs a shared limiter/ticket store or sticky routing and coordinated limits. Reverse-proxy trust is intentionally not enabled automatically.

AI requests require authentication. WebSocket upgrades require a 30-second, single-use ticket from authenticated `POST /api/socket-ticket` with `{type, projectId}`; collaboration checks ownership. Sockets have payload, connection, expiry and heartbeat limits. Host terminal access defaults to disabled; `ENABLE_HOST_TERMINAL=true` enables it only for trusted development. It is not a multi-tenant sandbox: an authenticated host shell can still access the container filesystem. Use a separately isolated execution service before hosting untrusted users. Terminal subprocesses no longer inherit the full server environment.

Run `npm test --workspace=server`; set `DATABASE_URL` and `TEST_DATABASE_URL` to a disposable PostgreSQL database for the complete integration suite. GitHub Actions now runs these tests against PostgreSQL and builds the frontend. Gemini provider calls and hosted serverless deployment still require validation with configured external services.
