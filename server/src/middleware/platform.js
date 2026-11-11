const { randomUUID } = require('node:crypto');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');

function installPlatform(app) {
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    req.id = randomUUID();
    res.setHeader('X-Request-ID', req.id);
    const started = Date.now();
    res.on('finish', () => console.log(JSON.stringify({event:'http',requestId:req.id,method:req.method,status:res.statusCode,durationMs:Date.now()-started})));
    const original = res.json.bind(res);
    res.json = body => original(body && body.error ? {...body, requestId:req.id} : body);
    next();
  });
  // The IDE intentionally renders user-authored previews and local Monaco workers.
  app.use(helmet({contentSecurityPolicy:false, crossOriginEmbedderPolicy:false}));
  app.use('/api', (_req,res,next) => {res.setHeader('Cache-Control','no-store');next();});
  app.use('/api', rateLimit({windowMs:60000,limit:300,standardHeaders:'draft-7',legacyHeaders:false,message:{error:'Too many requests. Try again shortly.'}}));
}
const authLimit = rateLimit({windowMs:15*60000,limit:30,skipSuccessfulRequests:true,standardHeaders:'draft-7',legacyHeaders:false,message:{error:'Too many authentication attempts. Try again later.'}});
const aiLimit = rateLimit({windowMs:60000,limit:15,standardHeaders:'draft-7',legacyHeaders:false,message:{error:'AI request limit reached. Try again shortly.'}});
module.exports = {installPlatform, authLimit, aiLimit};
