require('dotenv').config();
const path = require('path');
const express = require('express');
const http = require('http');
const cors = require('cors');
const {installPlatform,authLimit,aiLimit}=require('./middleware/platform');
const {authenticateToken}=require('./middleware/auth');
const {installSockets}=require('./services/socket-access');
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const fileRoutes = require('./routes/files');
const aiRoutes = require('./routes/ai');

const store = require('./services/store');
const app = express();
const server = http.createServer(app);
server.requestTimeout = 30000;
server.headersTimeout = 10000;
server.keepAliveTimeout = 5000;

installPlatform(app);
let draining=false;
app.use((_req,res,next)=>draining ? res.status(503).json({error:'Server is restarting'}) : next());
// Middleware
app.use(cors({ origin: (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(s=>s.trim()) }));
app.use(express.json({ limit: '10mb' }));

app.use('/api', (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && (!req.body || typeof req.body !== 'object' || Array.isArray(req.body))) {
    return res.status(400).json({ error: 'A JSON object is required' });
  }
  next();
});

// REST API Routes
app.use('/api/auth', authLimit, authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/ai', authenticateToken, aiLimit, aiRoutes);

const sockets=installSockets(app,server);
app.get('/api/live', (_req,res)=>res.json({status:'ok'}));
// Health check
app.get('/api/health', async (_req, res) => {
  try {
    if (store.health) await store.health();
    res.json({ status: 'ok', storage: process.env.DATABASE_URL ? 'postgres' : 'memory', timestamp: new Date().toISOString() });
  } catch { res.status(503).json({ status: 'unavailable' }); }
});

app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found' }));
app.use((err, _req, res, _next) => {
  console.error(JSON.stringify({event:'request_error',requestId:_req.id,code:err.code || err.name}));
  const status = err.type === 'entity.too.large' ? 413 : err instanceof SyntaxError || err.code === '22P02' ? 400 : 500;
  res.status(status).json({ error: status === 413 ? 'Request too large' : status === 400 ? 'Invalid request' : 'Internal server error' });
});

// Serve static client build in production
if (process.env.NODE_ENV === 'production') {
  const publicDir = path.join(__dirname, '..', 'public');
  app.use(express.static(publicDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;
async function initialize() {
  if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) throw new Error('A strong JWT_SECRET is required');
  if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) throw new Error('DATABASE_URL is required in production');
  if (store.initialize) await store.initialize();
}
async function start() {
  await initialize();
  server.listen(PORT, () => console.log(`Cloud IDE Server running on port ${PORT}`));
}
if (require.main === module) start().catch(async (error) => {
  console.error(JSON.stringify({event:'startup_failed',code:error.code || error.name,message:'Check database and production configuration'}));
  if (store.close) await store.close();
  process.exitCode = 1;
});

async function shutdown() {
  if(draining) return;
  draining=true;sockets.close();
  const deadline=setTimeout(()=>process.exit(1),10000);deadline.unref();
  server.close(async()=>{try {if(store.close)await store.close();clearTimeout(deadline);process.exit(0);}catch{process.exit(1);}});
  server.closeIdleConnections();
}
if(require.main === module) {process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);}
module.exports={app,initialize};
