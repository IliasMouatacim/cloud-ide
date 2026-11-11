const { app, initialize } = require('../../server/src/index');
let ready;
module.exports = async (req, res) => {
  // Serverless deployments must never use process-local data as persistence.
  if (!process.env.DATABASE_URL || !process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    return res.status(503).json({error:'Persistent backend configuration is required'});
  }
  try {
    if (!ready) ready = initialize().catch(error=>{ready=null;throw error;});
    await ready;
    return app(req,res);
  } catch {return res.status(503).json({error:'Database unavailable'});}
};
