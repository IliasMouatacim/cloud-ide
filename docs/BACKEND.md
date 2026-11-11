# Backend contract

The Express runtime is the source of truth. Serverless HTTP adapters import the same application; WebSockets require the persistent runtime. PostgreSQL is required in production. Development without a database uses temporary memory storage.

## HTTP routes

| Route | Authentication | Purpose |
| --- | --- | --- |
| POST /api/auth/register | Public, throttled | Validate identity fields, hash password, issue JWT |
| POST /api/auth/login | Public, throttled | Verify credentials and issue JWT |
| GET /api/projects | Bearer JWT | List the current user's projects |
| POST /api/projects | Bearer JWT | Create a template project |
| POST /api/projects/snapshot | Bearer JWT | Atomically create a workspace copy |
| GET /api/projects/:id | Owner | Read project metadata |
| GET /api/projects/:id/snapshot | Owner | Read consistent metadata and file content |
| PUT /api/projects/:id/snapshot | Owner | Replace files and name if revision matches |
| DELETE /api/projects/:id | Owner | Delete the project and cascade its files |
| GET /api/files/:projectId | Owner | Read files |
| PUT, DELETE /api/files/:projectId/* | Owner | Update/delete a relative file path |
| POST /api/ai/chat | Bearer JWT, throttled | Request a bounded Gemini response |
| POST /api/socket-ticket | Bearer JWT | Obtain a single-use, 30-second WebSocket grant |
| GET /api/live | Public | Process liveness |
| GET /api/health | Public | Storage readiness |

Errors use `{error, requestId}`. The `X-Request-ID` response header matches structured request logs. 400 means invalid input, 401 means missing/invalid session, 403 means insufficient access, 404 means missing resource, 409 means duplicate identity or conflicting revision, 413 means oversized JSON, 429 means throttled, and 503 means unavailable configuration/storage. AI provider failures return 502.

## Writes and conflicts

Snapshot payload: `{name, files: {"relative/path": "text"}, revision}`; omit revision for creation. Maximum 200 files, 1 MB/file, and 10 MB JSON request. Paths must be relative and exclude empty segments, traversal, backslashes and control characters. PostgreSQL text cannot contain NUL. Snapshot replacement is transactional and checks a monotonically increasing revision. Individual file changes also advance the project revision. A conflict never silently replaces remote work.

## Deployment limits

Configure a strong JWT_SECRET (at least 32 characters), DATABASE_URL, and CLIENT_URL origins. Never enable proxy trust without reviewing the actual reverse-proxy chain. Limits and WebSocket grants currently live in one process; distribute them before horizontal scaling. JWTs expire after 24 hours and account existence is checked on HTTP requests. Logout clears the browser session but does not revoke an already-issued token; centralized session revocation remains future work.

Host terminal is disabled by default. It is not an isolation boundary even when enabled behind authentication. Untrusted code execution requires a separate sandbox service. Collaboration currently allows only the owning user's sessions, not shared project memberships.

Migrations run once under a PostgreSQL advisory lock and are recorded in schema_migrations. For later changes, add a new migration version; do not rely on rerunning the initial schema file. Back up the database volume before schema changes. Do not use `docker compose down -v` unless data deletion is intended.

Run all tests with DATABASE_URL and TEST_DATABASE_URL pointing to a disposable database. The AI contract is tested with a mocked provider; a live Gemini call and hosted serverless routing need external credentials/deployment validation.
