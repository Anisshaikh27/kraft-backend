const express = require('express');
const ProjectController = require('../controllers/projectController');

const router = express.Router();
const projectController = new ProjectController();

// POST /api/projects
router.post('/', async (req, res) => {
  try {
    await projectController.createProject(req, res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/projects
router.get('/', async (req, res) => {
  try {
    await projectController.listProjects(req, res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/projects/:id
router.get('/:id', async (req, res) => {
  try {
    await projectController.getProject(req, res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/projects/:id
router.put('/:id', async (req, res) => {
  try {
    await projectController.updateProject(req, res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', async (req, res) => {
  try {
    await projectController.deleteProject(req, res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;