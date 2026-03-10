require('dotenv').config();
const path = require('path');
const express = require('express');
const http = require('http');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const fileRoutes = require('./routes/files');
const terminalManager = require('./services/terminal');
const collaborationManager = require('./services/collaboration');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '10mb' }));

// REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/files', fileRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static client build in production
if (process.env.NODE_ENV === 'production') {
  const publicDir = path.join(__dirname, '..', 'public');
  app.use(express.static(publicDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

// WebSocket Server
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const type = url.searchParams.get('type');

  if (type === 'terminal') {
    terminalManager.handleConnection(ws);
  } else if (type === 'collaboration') {
    collaborationManager.handleConnection(ws, url.searchParams.get('projectId'));
  } else {
    ws.send(JSON.stringify({ type: 'error', message: 'Unknown connection type' }));
    ws.close();
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Cloud IDE Server running on port ${PORT}`);
});
