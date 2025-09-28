const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler');

const router = express.Router();

// In-memory storage (same as projects - should be consistent)
const projects = require('../controllers/projectController').projects || new Map();

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }
  next();
};

// GET /api/files/:projectId - Get all files in project
router.get('/:projectId',
  [
    param('projectId')
      .isUUID()
      .withMessage('Invalid project ID')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const project = projects.get(projectId);

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const files = Array.from(project.files.entries()).map(([path, file]) => ({
      path,
      content: file.content,
      language: file.language,
      size: Buffer.byteLength(file.content, 'utf8'),
      createdAt: file.createdAt,
      updatedAt: file.updatedAt || file.createdAt
    }));

    res.json({
      success: true,
      data: {
        projectId,
        files,
        totalFiles: files.length,
        totalSize: files.reduce((acc, file) => acc + file.size, 0)
      }
    });
  })
);

// GET /api/files/:projectId/file - Get specific file
router.get('/:projectId/file',
  [
    param('projectId')
      .isUUID()
      .withMessage('Invalid project ID'),
    
    body('path')
      .notEmpty()
      .withMessage('File path is required')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { path: filePath } = req.query;

    const project = projects.get(projectId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const file = project.files.get(filePath);
    if (!file) {
      throw new NotFoundError('File not found');
    }

    res.json({
      success: true,
      data: {
        path: filePath,
        content: file.content,
        language: file.language,
        size: Buffer.byteLength(file.content, 'utf8'),
        createdAt: file.createdAt,
        updatedAt: file.updatedAt || file.createdAt
      }
    });
  })
);

// POST /api/files/:projectId - Create new file
router.post('/:projectId',
  [
    param('projectId')
      .isUUID()
      .withMessage('Invalid project ID'),
    
    body('path')
      .notEmpty()
      .withMessage('File path is required')
      .matches(/^[a-zA-Z0-9._/-]+$/)
      .withMessage('Invalid file path format'),
    
    body('content')
      .isString()
      .withMessage('File content must be a string'),
    
    body('language')
      .optional()
      .isString()
      .withMessage('Language must be a string')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { path: filePath, content, language } = req.body;

    const project = projects.get(projectId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Check if file already exists
    if (project.files.has(filePath)) {
      return res.status(409).json({
        error: 'File already exists',
        message: `File ${filePath} already exists in this project`
      });
    }

    // Determine language from file extension if not provided
    const detectedLanguage = language || detectLanguageFromPath(filePath);

    const file = {
      content,
      language: detectedLanguage,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    project.files.set(filePath, file);
    project.updatedAt = new Date().toISOString();

    // Update project structure
    project.structure = generateProjectStructure(project.files);

    res.status(201).json({
      success: true,
      data: {
        path: filePath,
        ...file,
        size: Buffer.byteLength(content, 'utf8')
      },
      message: 'File created successfully'
    });
  })
);

// PUT /api/files/:projectId - Update existing file
router.put('/:projectId',
  [
    param('projectId')
      .isUUID()
      .withMessage('Invalid project ID'),
    
    body('path')
      .notEmpty()
      .withMessage('File path is required'),
    
    body('content')
      .isString()
      .withMessage('File content must be a string')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { path: filePath, content } = req.body;

    const project = projects.get(projectId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const existingFile = project.files.get(filePath);
    if (!existingFile) {
      throw new NotFoundError('File not found');
    }

    const updatedFile = {
      ...existingFile,
      content,
      updatedAt: new Date().toISOString()
    };

    project.files.set(filePath, updatedFile);
    project.updatedAt = new Date().toISOString();

    res.json({
      success: true,
      data: {
        path: filePath,
        ...updatedFile,
        size: Buffer.byteLength(content, 'utf8')
      },
      message: 'File updated successfully'
    });
  })
);

// DELETE /api/files/:projectId - Delete file
router.delete('/:projectId',
  [
    param('projectId')
      .isUUID()
      .withMessage('Invalid project ID'),
    
    body('path')
      .notEmpty()
      .withMessage('File path is required')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { path: filePath } = req.body;

    const project = projects.get(projectId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    if (!project.files.has(filePath)) {
      throw new NotFoundError('File not found');
    }

    project.files.delete(filePath);
    project.updatedAt = new Date().toISOString();

    // Update project structure
    project.structure = generateProjectStructure(project.files);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  })
);

// POST /api/files/:projectId/rename - Rename file
router.post('/:projectId/rename',
  [
    param('projectId')
      .isUUID()
      .withMessage('Invalid project ID'),
    
    body('oldPath')
      .notEmpty()
      .withMessage('Old file path is required'),
    
    body('newPath')
      .notEmpty()
      .withMessage('New file path is required')
      .matches(/^[a-zA-Z0-9._/-]+$/)
      .withMessage('Invalid new file path format')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { oldPath, newPath } = req.body;

    const project = projects.get(projectId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const file = project.files.get(oldPath);
    if (!file) {
      throw new NotFoundError('File not found');
    }

    if (project.files.has(newPath)) {
      return res.status(409).json({
        error: 'File already exists',
        message: `File ${newPath} already exists`
      });
    }

    // Update file with new path
    const updatedFile = {
      ...file,
      updatedAt: new Date().toISOString(),
      language: detectLanguageFromPath(newPath)
    };

    project.files.delete(oldPath);
    project.files.set(newPath, updatedFile);
    project.updatedAt = new Date().toISOString();

    // Update project structure
    project.structure = generateProjectStructure(project.files);

    res.json({
      success: true,
      data: {
        oldPath,
        newPath,
        ...updatedFile
      },
      message: 'File renamed successfully'
    });
  })
);

// Helper functions
function detectLanguageFromPath(filePath) {
  const extension = filePath.split('.').pop()?.toLowerCase();
  const languageMap = {
    'js': 'javascript',
    'jsx': 'jsx',
    'ts': 'typescript',
    'tsx': 'tsx',
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'sass',
    'json': 'json',
    'md': 'markdown',
    'py': 'python',
    'sql': 'sql',
    'sh': 'bash',
    'yml': 'yaml',
    'yaml': 'yaml',
    'xml': 'xml',
    'php': 'php',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'h': 'c',
    'hpp': 'cpp'
  };

  return languageMap[extension] || 'text';
}

function generateProjectStructure(filesMap) {
  const structure = {};
  
  filesMap.forEach((file, filePath) => {
    const parts = filePath.split('/');
    let current = structure;
    
    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        // It's a file
        current[part] = {
          type: 'file',
          language: file.language,
          size: Buffer.byteLength(file.content, 'utf8')
        };
      } else {
        // It's a directory
        if (!current[part]) {
          current[part] = {
            type: 'directory',
            children: {}
          };
        }
        current = current[part].children || current[part];
      }
    });
  });
  
  return structure;
}

module.exports = router;