const GroqService = require('../services/groqService');
const GeminiService = require('../services/geminiService');

class AIController {
  constructor() {
    this.groqService = new GroqService();
    this.geminiService = new GeminiService();
    this.primaryProvider = process.env.PRIMARY_AI_PROVIDER || 'groq';
    this.fallbackProvider = process.env.FALLBACK_AI_PROVIDER || 'gemini';
  }

  async generateCode(req, res) {
    try {
      const { prompt, type = 'react', context = {} } = req.body;

      let response, usedProvider;

      try {
        if (this.primaryProvider === 'groq') {
          response = await this.groqService.generateCode(prompt, type, context);
          usedProvider = 'groq';
        } else {
          response = await this.geminiService.generateCode(prompt, type, context);
          usedProvider = 'gemini';
        }
      } catch (primaryError) {
        try {
          if (this.fallbackProvider === 'gemini') {
            response = await this.geminiService.generateCode(prompt, type, context);
            usedProvider = 'gemini';
          } else {
            response = await this.groqService.generateCode(prompt, type, context);
            usedProvider = 'groq';
          }
        } catch (fallbackError) {
          throw new Error('All AI providers failed');
        }
      }

      const processedResponse = this.processAIResponse(response, usedProvider);

      res.json({
        success: true,
        data: {
          ...processedResponse,
          model: response.model || 'unknown',
          provider: usedProvider
        }
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  processAIResponse(response, provider) {
    let content = '';

    if (provider === 'groq') {
      content = response.content || '';
    } else if (provider === 'gemini') {
      if (response.candidates && response.candidates[0]) {
        content = response.candidates[0].content?.parts?.[0]?.text || '';
      }
    }

    const files = this.extractFilesFromContentAdvanced(content);

    if (files.length === 0 && content.trim()) {
      return {
        content,
        files: this.createCompleteReactProject(content),
        explanation: content
      };
    }

    return { content, files, explanation: content };
  }

  extractFilesFromContentAdvanced(content) {
    const files = [];
    const pattern1 = /\/\/\s*(src\/[^\n]+\.(jsx?|tsx?|css|html|json|md))\s*\n```[\w]*\n([\s\S]*?)```/gi;
    let match;

    while ((match = pattern1.exec(content)) !== null) {
      const filePath = match[1].trim();
      const fileContent = match[3].trim();

      if (fileContent && filePath && fileContent.length > 10) {
        files.push({
          path: filePath,
          content: fileContent,
          language: this.getLanguageFromPath(filePath),
          operation: 'create'
        });
      }
    }

    if (files.length === 0) {
      const pattern2 = /\*\*(src\/[^\*]+\.(jsx?|tsx?|css|html|json|md))\*\*\s*\n```[\w]*\n([\s\S]*?)```/gi;

      while ((match = pattern2.exec(content)) !== null) {
        const filePath = match[1].trim();
        const fileContent = match[3].trim();

        if (fileContent && filePath && fileContent.length > 10) {
          files.push({
            path: filePath,
            content: fileContent,
            language: this.getLanguageFromPath(filePath),
            operation: 'create'
          });
        }
      }
    }

    if (files.length === 0) {
      const pattern3 = /```(jsx?|tsx?|css|html|json)\n([\s\S]*?)```/gi;
      let fileIndex = 1;

      while ((match = pattern3.exec(content)) !== null) {
        const language = match[1];
        const fileContent = match[2].trim();

        if (fileContent && fileContent.length > 10) {
          files.push({
            path: this.generateSmartFilePath(fileContent, language, fileIndex),
            content: fileContent,
            language: language === 'jsx' || language === 'js' ? 'javascript' : language,
            operation: 'create'
          });
          fileIndex++;
        }
      }
    }

    return files;
  }

  generateSmartFilePath(content, language, index) {
    if (content.includes('App')) return 'src/App.jsx';
    if (content.includes('Header')) return 'src/components/Header.jsx';
    if (content.includes('Footer')) return 'src/components/Footer.jsx';
    if (language === 'css') return 'src/index.css';
    if (content.includes('tailwind')) return 'tailwind.config.js';
    return `src/file${index}.${language}`;
  }

  createCompleteReactProject(content) {
    const files = [];

    files.push({
      path: 'package.json',
      content: JSON.stringify({
        "name": "weblify-react-app",
        "version": "0.1.0",
        "private": true,
        "dependencies": {
          "react": "^18.2.0",
          "react-dom": "^18.2.0",
          "react-router-dom": "^6.8.0"
        },
        "scripts": {
          "start": "react-scripts start",
          "build": "react-scripts build",
          "test": "react-scripts test"
        },
        "devDependencies": {
          "react-scripts": "5.0.1",
          "tailwindcss": "^3.2.0"
        }
      }, null, 2),
      language: 'json',
      operation: 'create'
    });

    files.push({
      path: 'public/index.html',
      content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Weblify React App</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`,
      language: 'html',
      operation: 'create'
    });

    files.push({
      path: 'src/index.js',
      content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
      language: 'javascript',
      operation: 'create'
    });

    files.push({
      path: 'src/App.js',
      content: this.generateAppComponent(content),
      language: 'javascript',
      operation: 'create'
    });

    files.push({
      path: 'src/index.css',
      content: `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', sans-serif;
}`,
      language: 'css',
      operation: 'create'
    });

    return files;
  }

  generateAppComponent(content) {
    const hasRouting = content.toLowerCase().includes('router');

    if (hasRouting) {
      return `import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App min-h-screen bg-gray-100">
        <header className="bg-blue-600 text-white p-4">
          <h1 className="text-2xl font-bold">AI Generated App</h1>
        </header>
        <main className="container mx-auto p-4">
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function Home() {
  return (
    <div className="text-center">
      <h2 className="text-xl font-semibold mb-4">Welcome!</h2>
      <p className="text-gray-600">AI-generated app</p>
    </div>
  );
}

export default App;`;
    } else {
      return `import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">AI Generated App</h1>
        </div>
      </header>
      <main className="container mx-auto p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Welcome to your React App!
          </h2>
          <p className="text-gray-600">
            This application was generated using AI.
          </p>
        </div>
      </main>
    </div>
  );
}

export default App;`;
    }
  }

  getLanguageFromPath(filePath) {
    const extension = filePath.split('.').pop()?.toLowerCase();
    const languageMap = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'css': 'css',
      'html': 'html',
      'json': 'json',
      'md': 'markdown'
    };
    return languageMap[extension] || 'javascript';
  }

  async healthCheck(req, res) {
    const health = { status: 'ok', providers: {} };

    try {
      await this.groqService.healthCheck();
      health.providers.groq = 'ok';
    } catch (error) {
      health.providers.groq = 'error';
    }

    try {
      await this.geminiService.healthCheck();
      health.providers.gemini = 'ok';
    } catch (error) {
      health.providers.gemini = 'error';
    }

    res.json(health);
  }
}

module.exports = AIController;
