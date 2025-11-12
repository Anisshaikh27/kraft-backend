/**
 * Project Routes
 * CRUD operations for projects
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  createProject,
  listProjects,
  getProject,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');

// All routes require authentication
router.use(authMiddleware);

// POST /api/projects - Create project
router.post('/', createProject);

// GET /api/projects - List user's projects
router.get('/', listProjects);

// GET /api/projects/:id - Get specific project
router.get('/:id', getProject);

// PUT /api/projects/:id - Update project
router.put('/:id', updateProject);

// DELETE /api/projects/:id - Delete project
router.delete('/:id', deleteProject);

module.exports = router;

module.exports = router;