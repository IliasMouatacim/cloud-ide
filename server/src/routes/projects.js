const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const store = require('../services/store');
const {validName,validSnapshot}=require('../middleware/validation');

const router = express.Router();
const handle = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// List user projects
router.get('/', authenticateToken, handle(async (req, res) => {
  const projects = await store.getProjectsByUser(req.user.id);
  res.json(projects);
}));

// Create project
router.post('/', authenticateToken, handle(async (req, res) => {
  const { name, template } = req.body;
  if (!validName(name) || (template !== undefined && !Object.hasOwn(store.TEMPLATES, template))) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  const project = await store.createProject({
    name,
    userId: req.user.id,
    template: template || 'blank'
  });

  res.status(201).json(project);
}));

// Save a complete workspace as one project; PostgreSQL commits all files atomically.
router.post('/snapshot', authenticateToken, handle(async (req, res) => {
  const { name, files } = req.body;
  if (!validName(name) || !files || typeof files !== 'object' || Array.isArray(files)) {
    return res.status(400).json({ error: 'A project name and files object are required' });
  }
  if (!validSnapshot(files)) return res.status(400).json({error:'Use up to 200 text files with valid relative paths, each under 1 MB'});
  const project = await store.createProject({ name: name.trim(), userId: req.user.id, template: 'blank', files });
  res.status(201).json(project);
}));

router.get('/:id/snapshot', authenticateToken, handle(async (req, res) => {
  const snapshot = await store.readSnapshot(req.params.id);
  if (!snapshot) return res.status(404).json({ error: 'Project not found' });
  if (snapshot.project.userId !== req.user.id) return res.status(403).json({ error: 'Access denied' });
  res.json(snapshot);
}));

router.put('/:id/snapshot', authenticateToken, handle(async (req, res) => {
  const { name, files } = req.body;
  if (!validName(name) || !files || typeof files !== 'object' || Array.isArray(files)) {
    return res.status(400).json({ error: 'A project name and files object are required' });
  }
  if (!validSnapshot(files)) return res.status(400).json({error:'Use up to 200 text files with valid relative paths, each under 1 MB'});
  if (!Number.isSafeInteger(req.body.revision) || req.body.revision < 0) return res.status(400).json({error:'A valid revision is required'});
  const existing = await store.getProject(req.params.id);
  if (!existing) return res.status(404).json({error:'Project not found'});
  if (existing.userId !== req.user.id) return res.status(403).json({error:'Access denied'});
  const project = await store.replaceSnapshot(req.params.id, req.user.id, req.body.revision, name.trim(), files);
  if (!project) return res.status(409).json({error:'This project changed elsewhere. Save a cloud copy to preserve your edits, or reopen the latest version.'});
  res.json(project);
}));

// Get project
router.get('/:id', authenticateToken, handle(async (req, res) => {
  const project = await store.getProject(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  if (project.userId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  res.json(project);
}));

// Delete project
router.delete('/:id', authenticateToken, handle(async (req, res) => {
  const project = await store.getProject(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  if (project.userId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  await store.deleteProject(req.params.id);
  res.json({ message: 'Project deleted' });
}));

module.exports = router;
