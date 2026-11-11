const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    if (!user.id || !await require('../services/store').getUser(user.id)) return res.status(401).json({error: 'Session is no longer valid'});
    req.user = user;
    next();
  } catch (error) {
    if (!['JsonWebTokenError','TokenExpiredError','NotBeforeError'].includes(error.name)) return next(error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

module.exports = { authenticateToken, generateToken };
