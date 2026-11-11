const { randomBytes } = require('node:crypto');
const { WebSocketServer } = require('ws');
const { authenticateToken } = require('../middleware/auth');
const store = require('./store');
const terminal = require('./terminal');
const collaboration = require('./collaboration');

function installSockets(app, server) {
  const tickets = new Map();
  const allowed = new Set((process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(s=>s.trim()));
  const wss = new WebSocketServer({noServer:true,maxPayload:64*1024,perMessageDeflate:false});
  app.post('/api/socket-ticket', authenticateToken, async (req,res,next) => {
    try {
      const {type,projectId}=req.body;
      if (!['terminal','collaboration'].includes(type)) return res.status(400).json({error:'Invalid socket type'});
      if (type==='terminal' && process.env.ENABLE_HOST_TERMINAL!=='true') return res.status(403).json({error:'Host terminal is disabled. It is only supported for trusted development.'});
      if (type==='collaboration') {
        if (typeof projectId!=='string') return res.status(400).json({error:'Project ID required'});
        const project=await store.getProject(projectId);
        if (!project || project.userId!==req.user.id) return res.status(403).json({error:'Project access denied'});
      }
      for(const [key,value] of tickets) if(value.expires<Date.now()) tickets.delete(key);
      if (tickets.size>=1000) return res.status(503).json({error:'Socket capacity reached'});
      const ticket=randomBytes(32).toString('hex');
      tickets.set(ticket,{type,projectId,user:req.user,expires:Date.now()+30000});
      res.json({ticket});
    } catch(error) {next(error);}
  });
  server.on('upgrade', (req,socket,head) => {
    const deny=code=>{socket.write(`HTTP/1.1 ${code} Rejected\r\nConnection: close\r\n\r\n`);socket.destroy();};
    try {
      const url=new URL(req.url,'http://localhost');
      if(url.pathname!=='/ws') return deny(404);
      if(req.headers.origin && !allowed.has(req.headers.origin)) return deny(403);
      const ticket=url.searchParams.get('ticket');
      const grant=tickets.get(ticket);tickets.delete(ticket);
      if(!grant || grant.expires<Date.now() || grant.user.exp*1000<Date.now()) return deny(401);
      if(wss.clients.size>=100 || [...wss.clients].filter(ws=>ws.userId===grant.user.id).length>=5) return deny(429);
      wss.handleUpgrade(req,socket,head,ws=>{
        ws.userId=grant.user.id;ws.alive=true;
        ws.on('pong',()=>{ws.alive=true;});
        let windowStart=Date.now(), messages=0;
        ws.on('message',()=>{
          if(Date.now()-windowStart>1000){windowStart=Date.now();messages=0;}
          if(++messages>100) ws.close(1008,'Message rate exceeded');
        });
        ws.on('error',()=>ws.terminate());
        const expiry=setTimeout(()=>ws.close(1008,'Session expired'),Math.max(1,grant.user.exp*1000-Date.now()));
        ws.on('close',()=>clearTimeout(expiry));
        try {
          if(grant.type==='terminal') terminal.handleConnection(ws);
          else collaboration.handleConnection(ws,grant.projectId);
        } catch {ws.close(1011,'Session could not start');}
      });
    } catch {deny(400);}
  });
  const heartbeat=setInterval(()=>{for(const ws of wss.clients){if(!ws.alive){ws.terminate();continue;}ws.alive=false;ws.ping();}},30000);
  heartbeat.unref();
  return {close(){clearInterval(heartbeat);tickets.clear();for(const ws of wss.clients)ws.terminate();wss.close();}};
}
module.exports={installSockets};
