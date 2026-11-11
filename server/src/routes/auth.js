const express = require('express');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../middleware/auth');
const store = require('../services/store');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (typeof username !== 'string' || !username.trim() || username.length > 80 || /[\x00-\x1f]/.test(username + email) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || typeof password !== 'string' || Buffer.byteLength(password) > 72) {
      return res.status(400).json({ error: 'Provide a valid username, email and password (maximum 72 bytes)' });
    }

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existing = await store.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await store.createUser({ username, email, password: hashedPassword });

    const token = generateToken({ id: user.id, email: user.email, username: user.username });
    res.status(201).json({
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (err) {
    res.status(err.code === '23505' ? 409 : 500).json({ error: err.code === '23505' ? 'Email already registered' : 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (typeof password !== 'string' || Buffer.byteLength(password) > 72 || email.length > 254) return res.status(400).json({ error: 'Password must be a string' });

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await store.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({ id: user.id, email: user.email, username: user.username });
    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// GitHub OAuth placeholder
router.get('/github', (_req, res) => {
  res.json({ message: 'GitHub OAuth endpoint - configure GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET' });
});

module.exports = router;
