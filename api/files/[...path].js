const store = require('../_lib/store');
const { verifyToken, setCors } = require('../_lib/auth');

module.exports = (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });

  // URL: /api/files/[...path]  → path[0] = projectId, rest = file path
  const segments = req.query.path || [];
  const projectId = segments[0];
  const filePath = segments.slice(1).join('/');

  if (!projectId) return res.status(400).json({ error: 'Project ID required' });

  const project = store.getProject(projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  if (project.userId !== user.id) return res.status(403).json({ error: 'Access denied' });

  if (req.method === 'GET' && !filePath) {
    const files = store.getFilesByProject(projectId);
    return res.json(files);
  }

  if (req.method === 'PUT' && filePath) {
    const { content } = req.body || {};
    const file = store.upsertFile(projectId, filePath, content || '');
    return res.json(file);
  }

  if (req.method === 'DELETE' && filePath) {
    store.deleteFile(projectId, filePath);
    return res.json({ message: 'File deleted' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
