// routes/templates.js
import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Get template types
router.get('/types', (req, res) => {
  try {
    const templateTypes = [
      {
        id: 'fullReactApp',
        name: 'Full React Application',
        description: 'Complete React app with routing, state management, and components',
        features: ['React Router', 'Context API', 'Multiple Components', 'Responsive Design']
      },
      {
        id: 'componentLibrary',
        name: 'Component Library',
        description: 'Collection of reusable UI components',
        features: ['Multiple Components', 'Storybook Ready', 'Props Documentation']
      },
      {
        id: 'landingPage',
        name: 'Landing Page',
        description: 'Modern marketing/portfolio landing page',
        features: ['Hero Section', 'Features', 'Contact Form', 'SEO Ready']
      },
      {
        id: 'dashboard',
        name: 'Dashboard Template',
        description: 'Admin/analytics dashboard with charts and tables',
        features: ['Charts', 'Data Tables', 'Sidebar Navigation', 'Cards']
      }
    ];

    res.json({
      success: true,
      templates: templateTypes,
      supportedPlatforms: ['codesandbox', 'stackblitz', 'webcontainer']
    });
  } catch (error) {
    logger.error('Get template types error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get template types'
    });
  }
});

// Generate template (placeholder for now)
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const {
      templateType = 'fullReactApp',
      description,
      customRequirements = '',
      model = 'gemini',
      previewPlatform = 'codesandbox'
    } = req.body;

    if (!description) {
      return res.status(400).json({ 
        success: false,
        error: 'Description is required' 
      });
    }

    // For now, return a simple success response
    // Later we'll integrate with the AI service
    res.json({
      success: true,
      message: 'Template generation endpoint working',
      template: {
        type: templateType,
        description,
        requirements: customRequirements,
        model,
        platform: previewPlatform
      },
      // Placeholder response
      project: {
        _id: 'temp-project-id',
        name: description.substring(0, 50),
        description: `AI Template: ${description}`,
        files: [
          {
            name: 'App.js',
            path: 'src/App.js',
            content: `import React from 'react';\n\nfunction App() {\n  return (\n    <div className="min-h-screen bg-gray-100 p-8">\n      <h1 className="text-3xl font-bold text-center">\n        ${description}\n      </h1>\n      <p className="text-center mt-4 text-gray-600">\n        Generated with AI Code Builder\n      </p>\n    </div>\n  );\n}\n\nexport default App;`
          }
        ]
      }
    });

  } catch (error) {
    logger.error('Template generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate template',
      details: error.message
    });
  }
});

// Create preview for existing project (placeholder)
router.post('/preview/:projectId', authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { platform = 'codesandbox' } = req.body;

    res.json({
      success: true,
      message: 'Preview endpoint working',
      projectId,
      platform,
      preview: {
        embedUrl: `https://codesandbox.io/embed/new?codemirror=1`,
        previewUrl: `https://codesandbox.io/s/new`,
        type: platform
      }
    });

  } catch (error) {
    logger.error('Preview creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create preview',
      details: error.message
    });
  }
});

export default router;
