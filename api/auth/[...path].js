const bcrypt = require('bcryptjs');
const store = require('./_lib/store');
const { generateToken, setCors } = require('./_lib/auth');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const path = req.url.replace(/^\/api\/auth\/?/, '').split('?')[0];

  if (req.method === 'POST' && path === 'register') {
    const { username, email, password } = req.body || {};
    if (!username || !email || !password) return res.status(400).json({ error: 'All fields are required' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const existing = store.getUserByEmail(email);
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = store.createUser({ username, email, password: hashedPassword });
    const token = generateToken({ id: user.id, email: user.email, username: user.username });
    return res.status(201).json({ token, user: { id: user.id, username: user.username, email: user.email } });
  }

  if (req.method === 'POST' && path === 'login') {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = store.getUserByEmail(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken({ id: user.id, email: user.email, username: user.username });
    return res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  }

  if (req.method === 'GET' && path === 'github') {
    return res.json({ message: 'GitHub OAuth endpoint — configure GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET' });
  }

  return res.status(404).json({ error: 'Not found' });
};
