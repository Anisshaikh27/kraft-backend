// routes/projects.js
import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Get user projects with pagination
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, type, search } = req.query;

    // Placeholder projects data
    const sampleProjects = [
      {
        _id: 'project-1',
        name: 'Sample React App',
        description: 'A sample React application with modern features',
        projectType: 'react-app',
        stackType: 'react-node',
        buildStatus: 'success',
        fileCount: 5,
        totalSize: 1024000,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'project-2', 
        name: 'Component Library',
        description: 'Reusable UI components for React',
        projectType: 'component-library',
        stackType: 'react-node',
        buildStatus: 'success',
        fileCount: 12,
        totalSize: 2048000,
        createdAt: new Date(Date.now() - 86400000), // 1 day ago
        updatedAt: new Date(Date.now() - 86400000)
      }
    ];

    res.json({
      success: true,
      projects: sampleProjects,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: sampleProjects.length,
        pages: Math.ceil(sampleProjects.length / limit)
      },
      filters: {
        type,
        search
      }
    });

  } catch (error) {
    logger.error('Get projects error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch projects' 
    });
  }
});

// Create new project
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, projectType = 'react-app', stackType = 'react-node' } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Project name is required'
      });
    }

    // Placeholder project creation
    const newProject = {
      _id: 'project-' + Date.now(),
      name: name.trim(),
      description: description?.trim() || '',
      owner: req.userId,
      projectType,
      stackType,
      files: [],
      buildStatus: 'pending',
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    logger.info(`New project created: ${name} by user ${req.userId}`);

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project: newProject
    });

  } catch (error) {
    logger.error('Create project error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create project'
    });
  }
});

// Get specific project with files
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Placeholder project data
    const project = {
      _id: id,
      name: 'Sample Project',
      description: 'A sample project with files',
      owner: req.userId,
      projectType: 'react-app',
      stackType: 'react-node',
      files: [
        {
          name: 'App.js',
          path: 'src/App.js',
          type: 'javascript',
          content: `import React from 'react';\n\nfunction App() {\n  return (\n    <div className="App">\n      <h1>Hello World</h1>\n    </div>\n  );\n}\n\nexport default App;`,
          size: 150,
          lastModified: new Date()
        },
        {
          name: 'index.js',
          path: 'src/index.js',
          type: 'javascript',
          content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\n\nconst root = ReactDOM.createRoot(document.getElementById('root'));\nroot.render(<App />);`,
          size: 120,
          lastModified: new Date()
        }
      ],
      buildStatus: 'success',
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    res.json({
      success: true,
      project
    });

  } catch (error) {
    logger.error('Get project error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get project'
    });
  }
});

// Update project metadata
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isPublic } = req.body;

    // Placeholder update
    const updatedProject = {
      _id: id,
      name: name || 'Updated Project',
      description: description || 'Updated description',
      isPublic: isPublic || false,
      updatedAt: new Date()
    };

    logger.info(`Project updated: ${id} by user ${req.userId}`);

    res.json({
      success: true,
      message: 'Project updated successfully',
      project: updatedProject
    });

  } catch (error) {
    logger.error('Update project error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update project'
    });
  }
});

// Delete project
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    logger.info(`Project deleted: ${id} by user ${req.userId}`);

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });

  } catch (error) {
    logger.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete project'
    });
  }
});

// Update specific file in project
router.put('/:id/files/:fileName', authMiddleware, async (req, res) => {
  try {
    const { id, fileName } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'File content is required'
      });
    }

    logger.info(`File updated: ${fileName} in project ${id} by user ${req.userId}`);

    res.json({
      success: true,
      message: 'File updated successfully',
      file: {
        name: fileName,
        content,
        lastModified: new Date()
      }
    });

  } catch (error) {
    logger.error('Update file error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update file'
    });
  }
});

export default router;
