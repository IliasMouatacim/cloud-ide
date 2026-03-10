const store = require('../_lib/store');
const { verifyToken, setCors } = require('../_lib/auth');

module.exports = (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });

  // Extract project ID from the URL: /api/projects/[id]
  const id = req.query.id;
  if (!id) return res.status(400).json({ error: 'Project ID required' });

  const project = store.getProject(id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  if (project.userId !== user.id) return res.status(403).json({ error: 'Access denied' });

  if (req.method === 'GET') {
    return res.json(project);
  }

  if (req.method === 'DELETE') {
    store.deleteProject(id);
    return res.json({ message: 'Project deleted' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
