const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const store = require('../services/store');

const router = express.Router();

// Get all files in a project
router.get('/:projectId', authenticateToken, (req, res) => {
  const project = store.getProject(req.params.projectId);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  if (project.userId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  const files = store.getFilesByProject(req.params.projectId);
  res.json(files);
});

// Create or update a file
router.put('/:projectId/*', authenticateToken, (req, res) => {
  const project = store.getProject(req.params.projectId);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  if (project.userId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const filePath = req.params[0];
  if (!filePath) {
    return res.status(400).json({ error: 'File path is required' });
  }

  const { content } = req.body;
  const file = store.upsertFile(req.params.projectId, filePath, content || '');
  res.json(file);
});

// Delete a file
router.delete('/:projectId/*', authenticateToken, (req, res) => {
  const project = store.getProject(req.params.projectId);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  if (project.userId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const filePath = req.params[0];
  store.deleteFile(req.params.projectId, filePath);
  res.json({ message: 'File deleted' });
});

module.exports = router;
