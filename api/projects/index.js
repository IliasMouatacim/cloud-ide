const store = require('../_lib/store');
const { verifyToken, setCors } = require('../_lib/auth');

module.exports = (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });

  if (req.method === 'GET') {
    const projects = store.getProjectsByUser(user.id);
    return res.json(projects);
  }

  if (req.method === 'POST') {
    const { name, template } = req.body || {};
    if (!name) return res.status(400).json({ error: 'Project name is required' });
    const project = store.createProject({ name, userId: user.id, template: template || 'blank' });
    return res.status(201).json(project);
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
