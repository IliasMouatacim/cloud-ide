const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const store = require('../services/store');
const {validPath,validContent}=require('../middleware/validation');

const router = express.Router();
const handle = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Get all files in a project
router.get('/:projectId', authenticateToken, handle(async (req, res) => {
  const project = await store.getProject(req.params.projectId);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  if (project.userId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  const files = await store.getFilesByProject(req.params.projectId);
  res.json(files);
}));

// Create or update a file
router.put('/:projectId/*', authenticateToken, handle(async (req, res) => {
  const project = await store.getProject(req.params.projectId);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  if (project.userId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const filePath = req.params[0];
  if (!validPath(filePath)) return res.status(400).json({error:'Invalid file path'});

  const { content } = req.body;
  if (!validContent(content)) return res.status(400).json({ error: 'Content must be a string' });
  const file = await store.upsertFile(req.params.projectId, filePath, content || '');
  res.json(file);
}));

// Delete a file
router.delete('/:projectId/*', authenticateToken, handle(async (req, res) => {
  const project = await store.getProject(req.params.projectId);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  if (project.userId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const filePath = req.params[0];
  if (!validPath(filePath)) return res.status(400).json({error:'Invalid file path'});
  await store.deleteFile(req.params.projectId, filePath);
  res.json({ message: 'File deleted' });
}));

module.exports = router;
