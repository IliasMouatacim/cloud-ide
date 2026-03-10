const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const store = require('../services/store');

const router = express.Router();

// List user projects
router.get('/', authenticateToken, (req, res) => {
  const projects = store.getProjectsByUser(req.user.id);
  res.json(projects);
});

// Create project
router.post('/', authenticateToken, (req, res) => {
  const { name, template } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  const project = store.createProject({
    name,
    userId: req.user.id,
    template: template || 'blank'
  });

  res.status(201).json(project);
});

// Get project
router.get('/:id', authenticateToken, (req, res) => {
  const project = store.getProject(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  if (project.userId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  res.json(project);
});

// Delete project
router.delete('/:id', authenticateToken, (req, res) => {
  const project = store.getProject(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  if (project.userId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  store.deleteProject(req.params.id);
  res.json({ message: 'Project deleted' });
});

module.exports = router;
