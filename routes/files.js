const express = require('express');
const router = express.Router();

// Shared storage with projectController
const ProjectController = require('../controllers/projectController');
const pc = new ProjectController();
const projects = pc.projects;
const files = pc.files;

// GET /api/files/:projectId
router.get('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = projects.get(projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const projectFiles = files.get(projectId) || new Map();
    const filesArray = Array.from(projectFiles.entries()).map(([path, file]) => ({
      path,
      content: file.content,
      language: file.language
    }));

    res.json({ files: filesArray });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/files/:projectId
router.post('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { path, content, language } = req.body;

    const project = projects.get(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const projectFiles = files.get(projectId) || new Map();
    projectFiles.set(path, { content, language: language || 'javascript' });
    files.set(projectId, projectFiles);

    res.json({ success: true, path });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/files/:projectId
router.put('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { path, content } = req.body;

    const project = projects.get(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const projectFiles = files.get(projectId);
    if (!projectFiles || !projectFiles.has(path)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const file = projectFiles.get(path);
    file.content = content;
    projectFiles.set(path, file);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/files/:projectId
router.delete('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { path } = req.body;

    const projectFiles = files.get(projectId);
    if (projectFiles) {
      projectFiles.delete(path);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;