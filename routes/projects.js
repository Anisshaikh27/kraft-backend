const express = require('express');
const { body, param, validationResult } = require('express-validator');
const ProjectController = require('../controllers/projectController');
const { asyncHandler, ValidationError } = require('../middleware/errorHandler');

const router = express.Router();
const projectController = new ProjectController();

// Enhanced validation middleware with better error messages
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));
    
    console.error('Validation errors:', errorMessages);
    return res.status(400).json({
      error: 'Validation failed',
      details: errorMessages,
      message: `Invalid ${errorMessages[0].field}: ${errorMessages[0].message}`
    });
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

// GET /api/projects/:id - Get specific project (FIXED VALIDATION)
router.get('/:id',
  [
    param('id')
      .notEmpty()
      .withMessage('Project ID is required')
      .custom((value) => {
        // Check if it's a valid UUID format or at least not 'undefined'
        if (value === 'undefined' || value === 'null') {
          throw new Error('Project ID cannot be undefined or null');
        }
        // Basic UUID format check (loose - allows other ID formats too)
        if (typeof value !== 'string' || value.length < 10) {
          throw new Error('Project ID must be a valid identifier');
        }
        return true;
      })
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
      .notEmpty()
      .withMessage('Project ID is required')
      .custom((value) => {
        if (value === 'undefined' || value === 'null') {
          throw new Error('Project ID cannot be undefined or null');
        }
        if (typeof value !== 'string' || value.length < 10) {
          throw new Error('Project ID must be a valid identifier');
        }
        return true;
      }),
    
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
      .notEmpty()
      .withMessage('Project ID is required')
      .custom((value) => {
        if (value === 'undefined' || value === 'null') {
          throw new Error('Project ID cannot be undefined or null');
        }
        if (typeof value !== 'string' || value.length < 10) {
          throw new Error('Project ID must be a valid identifier');
        }
        return true;
      })
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
      .notEmpty()
      .withMessage('Project ID is required')
      .custom((value) => {
        if (value === 'undefined' || value === 'null') {
          throw new Error('Project ID cannot be undefined or null');
        }
        return true;
      }),
    
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
      .notEmpty()
      .withMessage('Project ID is required')
      .custom((value) => {
        if (value === 'undefined' || value === 'null') {
          throw new Error('Project ID cannot be undefined or null');
        }
        return true;
      })
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    await projectController.exportProject(req, res);
  })
);

module.exports = router;