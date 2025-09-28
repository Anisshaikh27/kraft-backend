const express = require('express');
const { body, param, validationResult } = require('express-validator');
const ProjectController = require('../controllers/projectController');
const { asyncHandler, ValidationError } = require('../middleware/errorHandler');

const router = express.Router();
const projectController = new ProjectController();

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }
  next();
};

// POST /api/projects - Create new project
router.post('/',
  [
    body('name')
      .optional()
      .isString()
      .isLength({ min: 1, max: 100 })
      .withMessage('Project name must be between 1 and 100 characters'),
    
    body('type')
      .optional()
      .isIn(['react-app', 'next-app', 'express-api', 'static-site', 'fullstack-app'])
      .withMessage('Invalid project type'),
    
    body('template')
      .optional()
      .isString()
      .withMessage('Template must be a string'),
    
    body('description')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    await projectController.createProject(req, res);
  })
);

// GET /api/projects - List user projects
router.get('/',
  asyncHandler(async (req, res) => {
    await projectController.listProjects(req, res);
  })
);

// GET /api/projects/:id - Get specific project
router.get('/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid project ID')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    await projectController.getProject(req, res);
  })
);

// PUT /api/projects/:id - Update project
router.put('/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid project ID'),
    
    body('name')
      .optional()
      .isString()
      .isLength({ min: 1, max: 100 })
      .withMessage('Project name must be between 1 and 100 characters'),
    
    body('description')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
    
    body('settings')
      .optional()
      .isObject()
      .withMessage('Settings must be an object')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    await projectController.updateProject(req, res);
  })
);

// DELETE /api/projects/:id - Delete project
router.delete('/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid project ID')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    await projectController.deleteProject(req, res);
  })
);

// POST /api/projects/:id/clone - Clone project
router.post('/:id/clone',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid project ID'),
    
    body('name')
      .optional()
      .isString()
      .isLength({ min: 1, max: 100 })
      .withMessage('Project name must be between 1 and 100 characters')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    await projectController.cloneProject(req, res);
  })
);

// GET /api/projects/:id/export - Export project
router.get('/:id/export',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid project ID')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    await projectController.exportProject(req, res);
  })
);

module.exports = router;