const GroqService = require('../services/groqService');
const GeminiService = require('../services/geminiService');

class AIController {
  constructor() {
    this.groqService = new GroqService();
    this.geminiService = new GeminiService();
    
    // Configuration
    this.primaryProvider = process.env.PRIMARY_AI_PROVIDER || 'groq';
    this.fallbackProvider = process.env.FALLBACK_AI_PROVIDER || 'gemini';
  }

  async generateCode(req, res) {
    const startTime = Date.now();
    
    try {
      const { prompt, type = 'react', context = {} } = req.body;

      if (!prompt || prompt.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Prompt is required',
          message: 'Please provide a prompt for code generation'
        });
      }

      console.log('\n=== AI GENERATION REQUEST ===');
      console.log('Prompt:', prompt);
      console.log('Type:', type);
      console.log('Context:', JSON.stringify(context, null, 2));
      console.log('Primary Provider:', this.primaryProvider);
      console.log('Fallback Provider:', this.fallbackProvider);
      console.log('===============================\n');

      let response;
      let usedProvider;
      let error;

      // Try primary provider first
      try {
        console.log(`🚀 Trying primary provider: ${this.primaryProvider}`);
        
        if (this.primaryProvider === 'groq') {
          console.log('🔄 Calling Groq service...');
          response = await this.groqService.generateCode(prompt, type, context);
          usedProvider = 'groq';
          console.log('✅ Groq service responded successfully');
        } else if (this.primaryProvider === 'gemini') {
          console.log('🔄 Calling Gemini service...');
          response = await this.geminiService.generateCode(prompt, type, context);
          usedProvider = 'gemini';
          console.log('✅ Gemini service responded successfully');
        }
      } catch (primaryError) {
        console.log(`❌ Primary provider (${this.primaryProvider}) failed:`, primaryError.message);
        error = primaryError;

        // Try fallback provider
        try {
          console.log(`🔄 Trying fallback provider: ${this.fallbackProvider}`);
          
          if (this.fallbackProvider === 'gemini' && this.primaryProvider !== 'gemini') {
            console.log('🔄 Calling Gemini service (fallback)...');
            response = await this.geminiService.generateCode(prompt, type, context);
            usedProvider = 'gemini';
            console.log('✅ Gemini fallback succeeded');
          } else if (this.fallbackProvider === 'groq' && this.primaryProvider !== 'groq') {
            console.log('🔄 Calling Groq service (fallback)...');
            response = await this.groqService.generateCode(prompt, type, context);
            usedProvider = 'groq';
            console.log('✅ Groq fallback succeeded');
          }
        } catch (fallbackError) {
          console.log(`❌ Fallback provider (${this.fallbackProvider}) also failed:`, fallbackError.message);
          throw new Error(`All AI providers failed. Primary: ${error.message}, Fallback: ${fallbackError.message}`);
        }
      }

      if (!response) {
        throw new Error('No response received from any AI provider');
      }

      // Log the raw AI response for debugging
      console.log('\n=== RAW AI RESPONSE ===');
      console.log('Provider used:', usedProvider);
      console.log('Response type:', typeof response);
      console.log('Response keys:', Object.keys(response || {}));
      console.log('Content preview:', response.content?.substring(0, 200) + '...');
      console.log('=======================\n');

      // FIXED: Process and structure the response correctly
      const processedResponse = this.processAIResponse(response, usedProvider);
      
      console.log('\n=== PROCESSED RESPONSE ===');
      console.log('Content length:', processedResponse.content?.length || 0);
      console.log('Number of files:', processedResponse.files?.length || 0);
      console.log('Files:', processedResponse.files?.map(f => `${f.path} (${f.content?.length || 0} chars)`) || []);
      console.log('===========================\n');

      const processingTime = Date.now() - startTime;

      const finalResponse = {
        success: true,
        data: {
          ...processedResponse,
          model: response.model || 'unknown',
          provider: usedProvider,
          usage: response.usage || null
        },
        metadata: {
          type,
          timestamp: new Date().toISOString(),
          processingTime
        }
      };

      console.log('✅ Final response files count:', finalResponse.data.files?.length || 0);

      res.json(finalResponse);

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      console.log('\n❌ AI GENERATION ERROR ===');
      console.log('Error message:', error.message);
      console.log('Processing time:', processingTime, 'ms');
      console.log('==========================\n');

      res.status(500).json({
        success: false,
        error: 'Code generation failed',
        message: error.message,
        timestamp: new Date().toISOString(),
        processingTime
      });
    }
  }

  // COMPLETELY REWRITTEN: Better file extraction with multiple patterns
  processAIResponse(response, provider) {
    console.log(`🔄 Processing ${provider} response...`);

    // Initialize default structure
    let processedResponse = {
      content: '',
      files: [],
      explanation: '',
      suggestions: []
    };

    try {
      let content = '';

      // Extract content based on provider
      if (provider === 'groq') {
        content = response.content || '';
        console.log(`📝 Groq content extracted: ${content.length} characters`);
      } else if (provider === 'gemini') {
        if (response.candidates && response.candidates[0]) {
          content = response.candidates[0].content?.parts?.[0]?.text || '';
        }
        console.log(`📝 Gemini content extracted: ${content.length} characters`);
      }

      // Set the content
      processedResponse.content = content;
      processedResponse.explanation = content;

      // COMPLETELY REWRITTEN: Multi-pattern file extraction
      if (content) {
        const extractedFiles = this.extractFilesFromContentAdvanced(content);
        processedResponse.files = extractedFiles;
        console.log(`📁 Extracted ${extractedFiles.length} files from content`);
      } else {
        console.log('⚠️ No content to extract files from');
      }

      // If still no files and we have content, create a comprehensive React project
      if (processedResponse.files.length === 0 && content.trim()) {
        console.log('⚠️ No files extracted, creating comprehensive React project...');
        processedResponse.files = this.createCompleteReactProject(content);
      }

    } catch (error) {
      console.error('Error processing AI response:', error);
      processedResponse.content = 'Error processing AI response: ' + error.message;
    }

    console.log(`✅ Processing complete: ${processedResponse.content.length} chars, ${processedResponse.files.length} files`);
    return processedResponse;
  }

  // NEW: Advanced file extraction with multiple regex patterns
  extractFilesFromContentAdvanced(content) {
    console.log('🔍 Advanced file extraction started...');
    
    const files = [];
    
    // Pattern 1: Look for files with path comments followed by code blocks
    // // src/components/Header.jsx
    // ```jsx
    // code here
    // ```
    const pattern1 = /\/\/\s*(src\/[^\n]+\.(jsx?|tsx?|css|html|json|md))\s*\n```[\w]*\n([\s\S]*?)```/gi;
    let match;
    
    while ((match = pattern1.exec(content)) !== null) {
      const filePath = match[1].trim();
      const fileContent = match[3].trim();
      
      if (fileContent && filePath && fileContent.length > 10) { // Ensure meaningful content
        files.push({
          path: filePath,
          content: fileContent,
          language: this.getLanguageFromPath(filePath),
          operation: 'create'
        });
        console.log(`📄 Pattern 1 - Extracted file: ${filePath} (${fileContent.length} chars)`);
      }
    }

    // Pattern 2: Look for **filename** followed by code blocks  
    // **src/components/Header.jsx**
    // ```jsx
    // code here
    // ```
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
          console.log(`📄 Pattern 2 - Extracted file: ${filePath} (${fileContent.length} chars)`);
        }
      }
    }

    // Pattern 3: Look for standalone code blocks and assign smart paths
    if (files.length === 0) {
      const pattern3 = /```(jsx?|tsx?|css|html|json)\n([\s\S]*?)```/gi;
      let fileIndex = 1;
      
      while ((match = pattern3.exec(content)) !== null) {
        const language = match[1];
        const fileContent = match[2].trim();
        
        if (fileContent && fileContent.length > 10) {
          let filePath = this.generateSmartFilePath(fileContent, language, fileIndex);
          
          files.push({
            path: filePath,
            content: fileContent,
            language: language === 'jsx' || language === 'js' ? 'javascript' : language,
            operation: 'create'
          });
          console.log(`📄 Pattern 3 - Extracted file: ${filePath} (${fileContent.length} chars)`);
          fileIndex++;
        }
      }
    }

    console.log(`📁 Advanced extraction complete: ${files.length} files`);
    return files;
  }

  // NEW: Generate smart file paths based on content
  generateSmartFilePath(content, language, index) {
    // Check if it's a component
    if (content.includes('export default') || content.includes('function ') || content.includes('const ')) {
      if (content.includes('App')) return 'src/App.jsx';
      if (content.includes('Header')) return 'src/components/Header.jsx';
      if (content.includes('Footer')) return 'src/components/Footer.jsx';
      if (content.includes('Navigation') || content.includes('Nav')) return 'src/components/Navigation.jsx';
      if (content.includes('Product')) return 'src/components/ProductCard.jsx';
      if (content.includes('Card')) return 'src/components/Card.jsx';
      if (content.includes('Button')) return 'src/components/Button.jsx';
      if (content.includes('Form')) return 'src/components/Form.jsx';
      if (content.includes('Login')) return 'src/components/LoginForm.jsx';
      return `src/components/Component${index}.jsx`;
    }
    
    // Check if it's styles
    if (language === 'css' || content.includes('@apply') || content.includes('tailwind')) {
      return 'src/index.css';
    }
    
    // Check if it's config
    if (content.includes('module.exports') || content.includes('export default')) {
      if (content.includes('tailwind')) return 'tailwind.config.js';
      if (content.includes('webpack')) return 'webpack.config.js';
      return 'config.js';
    }
    
    // Default
    return `src/file${index}.${language}`;
  }

  // NEW: Create complete React project structure when no files are extracted
  createCompleteReactProject(content) {
    console.log('🏗️ Creating complete React project structure...');
    
    const files = [];
    
    // Create package.json
    files.push({
      path: 'package.json',
      content: JSON.stringify({
        "name": "weblify-react-app",
        "version": "0.1.0",
        "private": true,
        "dependencies": {
          "react": "^18.2.0",
          "react-dom": "^18.2.0",
          "react-router-dom": "^6.8.0",
          "@testing-library/jest-dom": "^5.16.4",
          "@testing-library/react": "^13.4.0",
          "@testing-library/user-event": "^13.5.0",
          "web-vitals": "^2.1.4"
        },
        "scripts": {
          "start": "react-scripts start",
          "build": "react-scripts build",
          "test": "react-scripts test",
          "eject": "react-scripts eject"
        },
        "eslintConfig": {
          "extends": ["react-app", "react-app/jest"]
        },
        "browserslist": {
          "production": [">0.2%", "not dead", "not op_mini all"],
          "development": ["last 1 chrome version", "last 1 firefox version", "last 1 safari version"]
        },
        "devDependencies": {
          "react-scripts": "5.0.1",
          "tailwindcss": "^3.2.0",
          "autoprefixer": "^10.4.13",
          "postcss": "^8.4.21"
        }
      }, null, 2),
      language: 'json',
      operation: 'create'
    });

    // Create public/index.html
    files.push({
      path: 'public/index.html',
      content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="AI-generated React application" />
    <title>Weblify React App</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>`,
      language: 'html',
      operation: 'create'
    });

    // Create src/index.js
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

    // Create src/App.js with generated content
    const appContent = this.generateAppComponent(content);
    files.push({
      path: 'src/App.js',
      content: appContent,
      language: 'javascript',
      operation: 'create'
    });

    // Create src/index.css with Tailwind
    files.push({
      path: 'src/index.css',
      content: `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}`,
      language: 'css',
      operation: 'create'
    });

    // Create tailwind.config.js
    files.push({
      path: 'tailwind.config.js',
      content: `module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`,
      language: 'javascript',
      operation: 'create'
    });

    console.log(`🏗️ Created complete React project: ${files.length} files`);
    return files;
  }

  // NEW: Generate App component based on AI content
  generateAppComponent(content) {
    // Try to extract meaningful React code from the content
    const hasRouting = content.toLowerCase().includes('router') || content.toLowerCase().includes('route');
    
    if (hasRouting) {
      return `import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Generated based on your request
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
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function Home() {
  return (
    <div className="text-center">
      <h2 className="text-xl font-semibold mb-4">Welcome to your AI-generated app!</h2>
      <p className="text-gray-600">This was created based on your description.</p>
    </div>
  );
}

function About() {
  return (
    <div className="text-center">
      <h2 className="text-xl font-semibold mb-4">About</h2>
      <p className="text-gray-600">Generated with Weblify.AI</p>
    </div>
  );
}

export default App;`;
    } else {
      return `import React from 'react';
import './App.css';

// Generated based on your request
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
          <p className="text-gray-600 mb-8">
            This application was generated based on your description using AI.
          </p>
          
          <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-2">Ready to customize?</h3>
            <p className="text-gray-500 text-sm">
              Start editing the components to match your vision!
            </p>
          </div>
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

  // Health check for AI services
  async healthCheck(req, res) {
    try {
      console.log('🏥 Checking AI services health...');
      
      const health = {
        status: 'healthy',
        providers: {},
        timestamp: new Date().toISOString()
      };

      // Check Groq
      try {
        await this.groqService.healthCheck();
        health.providers.groq = { status: 'available', error: null };
        console.log('✅ Groq service is healthy');
      } catch (error) {
        health.providers.groq = { status: 'unavailable', error: error.message };
        console.log('❌ Groq service is unhealthy:', error.message);
      }

      // Check Gemini
      try {
        await this.geminiService.healthCheck();
        health.providers.gemini = { status: 'available', error: null };
        console.log('✅ Gemini service is healthy');
      } catch (error) {
        health.providers.gemini = { status: 'unavailable', error: error.message };
        console.log('❌ Gemini service is unhealthy:', error.message);
      }

      // Determine overall status
      const availableProviders = Object.values(health.providers).filter(p => p.status === 'available').length;
      if (availableProviders === 0) {
        health.status = 'unhealthy';
      } else if (availableProviders === 1) {
        health.status = 'degraded';
      }

      res.json(health);
    } catch (error) {
      console.error('Health check error:', error);
      res.status(500).json({
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = AIController;