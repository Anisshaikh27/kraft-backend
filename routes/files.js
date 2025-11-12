/**
 * File Routes
 * CRUD operations for files within projects
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  createFile,
  listFiles,
  getFile,
  updateFile,
  deleteFile,
} = require('../controllers/fileController');

// All routes require authentication
router.use(authMiddleware);

// POST /api/files/:projectId - Create file
router.post('/:projectId', createFile);

// GET /api/files/:projectId - List files in project
router.get('/:projectId', listFiles);

// GET /api/files/:projectId/:fileId - Get specific file
router.get('/:projectId/:fileId', getFile);

// PUT /api/files/:projectId - Update file
router.put('/:projectId', updateFile);

// DELETE /api/files/:projectId - Delete file
router.delete('/:projectId', deleteFile);

module.exports = router;