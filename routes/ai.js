// routes/ai.js
import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import freeAiService from '../services/freeAiService.js'; // This should now work

const router = express.Router();

// Get available FREE models
router.get('/free-models', (req, res) => {
  try {
    const models = freeAiService.getAvailableModels();

    res.json({
      success: true,
      models,
      healthCheck: {
        gemini: !!process.env.GOOGLE_API_KEY,
        groq: !!process.env.GROQ_API_KEY,
        totalAvailable: models.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Get models error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get models'
    });
  }
});

// Generate React Component 
router.post('/generate-component-free', authMiddleware, async (req, res) => {
  try {
    const { description, requirements = '', model = 'gemini' } = req.body;

    if (!description) {
      return res.status(400).json({ 
        success: false,
        error: 'Component description is required' 
      });
    }

    const result = await freeAiService.generateReactComponent(
      description, 
      requirements, 
      model
    );

    res.json({
      success: true,
      component: result,
      availableModels: ['gemini', 'groq']
    });

  } catch (error) {
    logger.error('Component generation error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate component',
      details: error.message
    });
  }
});

// Generate Complete React App - WORKING VERSION
router.post('/generate-app-free', authMiddleware, async (req, res) => {
  try {
    const { description, features = [], model = 'gemini' } = req.body;

    if (!description) {
      return res.status(400).json({ 
        success: false,
        error: 'App description is required' 
      });
    }

    logger.info(`Generating app: ${description} with model: ${model}`);

    try {
      // Use the freeAiService to generate the app
      const result = await freeAiService.generateReactApp(description, features, model);

      if (result.success) {
        // Ensure we return the proper structure
        const appData = result.app || {};
        
        // If the AI didn't return proper files, create default ones
        const files = appData.files || [
          {
            name: 'App.js',
            path: 'src/App.js',
            content: generateEnhancedApp(description, features)
          },
          {
            name: 'package.json',
            path: 'package.json',
            content: JSON.stringify({
              "name": description.toLowerCase().replace(/\s+/g, '-'),
              "version": "1.0.0",
              "private": true,
              "dependencies": {
                "react": "^18.2.0",
                "react-dom": "^18.2.0",
                "react-scripts": "5.0.1"
              },
              "scripts": {
                "start": "react-scripts start",
                "build": "react-scripts build"
              }
            }, null, 2)
          },
          {
            name: 'index.html',
            path: 'public/index.html',
            content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${description}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="root"></div>
</body>
</html>`
          }
        ];

        res.json({
          success: true,
          project: {
            _id: 'generated-' + Date.now(),
            name: description,
            description: description,
            files: files,
            buildStatus: 'success',
            generatedWith: model
          },
          app: {
            success: true,
            files: files,
            model: model
          },
          preview: {
            success: true,
            ready: true
          }
        });
      } else {
        throw new Error(result.error || 'AI generation failed');
      }
    } catch (aiError) {
      logger.warn('AI generation failed, using fallback:', aiError.message);
      
      // Fallback with static content
      const fallbackFiles = [
        {
          name: 'App.js',
          path: 'src/App.js',
          content: generateEnhancedApp(description, features)
        },
        {
          name: 'package.json',
          path: 'package.json',
          content: JSON.stringify({
            "name": description.toLowerCase().replace(/\s+/g, '-'),
            "version": "1.0.0",
            "private": true,
            "dependencies": {
              "react": "^18.2.0",
              "react-dom": "^18.2.0",
              "react-scripts": "5.0.1"
            },
            "scripts": {
              "start": "react-scripts start",
              "build": "react-scripts build"
            }
          }, null, 2)
        }
      ];

      res.json({
        success: true,
        project: {
          _id: 'fallback-' + Date.now(),
          name: description,
          description: description + ' (Fallback)',
          files: fallbackFiles,
          buildStatus: 'success',
          generatedWith: 'fallback'
        },
        app: {
          success: true,
          files: fallbackFiles,
          model: 'fallback'
        },
        note: 'Generated with fallback template due to AI service issue'
      });
    }

  } catch (error) {
    logger.error('App generation error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate app',
      details: error.message
    });
  }
});

// Helper function to generate enhanced React app
function generateEnhancedApp(description, features) {
  return `import React, { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
            ${description}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Generated with Kraft AI Code Builder
          </p>
        </header>

        {isVisible && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-8">
            <span className="block sm:inline">🎉 Your AI-generated app is ready! You can modify this via chat.</span>
            <button 
              onClick={() => setIsVisible(false)}
              className="float-right text-green-500 hover:text-green-700"
            >
              ×
            </button>
          </div>
        )}

        <main className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-shadow">
            <div className="text-3xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Modern React</h3>
            <p className="text-gray-600">Built with React 18+ and modern patterns</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-shadow">
            <div className="text-3xl mb-4">🎨</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Beautiful UI</h3>
            <p className="text-gray-600">Styled with Tailwind CSS and responsive design</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-shadow">
            <div className="text-3xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Interactive</h3>
            <p className="text-gray-600">Working components with state management</p>
          </div>
        </main>

        <section className="bg-white rounded-2xl shadow-xl p-8 mb-12">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Interactive Demo</h2>
          <div className="flex flex-col items-center space-y-6">
            <div className="text-6xl font-bold text-blue-600">
              {count}
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setCount(count - 1)}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                ➖ Decrease
              </button>
              <button
                onClick={() => setCount(0)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                🔄 Reset
              </button>
              <button
                onClick={() => setCount(count + 1)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                ➕ Increase
              </button>
            </div>
          </div>
        </section>

        <section className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Features</h2>
          <div className="flex flex-wrap justify-center gap-3">
            ${features.map(feature => `
              <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
                ${feature}
              </span>
            `).join('')}
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;`;
}

export default router;
