const Groq = require('groq-sdk');

class GroqService {
  constructor() {
    if (!process.env.GROQ_API_KEY) {
      console.log('⚠️  GROQ_API_KEY not set. Groq service will not be available.');
      this.available = false;
      return;
    }

    this.client = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
    this.model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    this.available = true;
    
    console.log('✅ Groq service initialized');
    console.log('   Model:', this.model);
  }

  async generateCode(prompt, type = 'react', context = {}) {
    if (!this.available) {
      throw new Error('Groq service not available. API key not configured.');
    }

    try {
      console.log('🚀 Making Groq API call...');
      console.log('   Type:', type);
      console.log('   Prompt length:', prompt.length);

      // For react/sandpack, enhance the prompt
      let enhancedPrompt = prompt;
      if (type === 'react' || type === 'sandpack') {
        const SandpackPromptBuilder = require('../utils/sandpackPromptBuilder');
        enhancedPrompt = SandpackPromptBuilder.buildValidatedPrompt(prompt);
      }

      const response = await this.client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: this.getEnhancedSystemPrompt(type)
          },
          {
            role: 'user',
            content: enhancedPrompt
          }
        ],
        model: this.model,
        temperature: 0.1,
        max_tokens: 7000,
        stream: false
      });

      console.log('✅ Groq API responded');

      // Extract content from the response
      let content = '';
      if (response.choices && response.choices[0]) {
        content = response.choices[0].message?.content || '';
      }

      console.log('📝 Response length:', content.length);

      // Return in expected format
      return {
        success: true,
        content: content,
        model: this.model,
        provider: 'groq',
        usage: response.usage || null
      };

    } catch (error) {
      console.error('❌ Groq API error:', error.message);
      throw new Error(`Groq API error: ${error.message}`);
    }
  }

  // ENHANCED: Better system prompts with clear file structure requirements
  getEnhancedSystemPrompt(type) {
    const sandpackPrompts = require('../prompts/sandpackPrompts');
    
    if (type === 'react' || type === 'sandpack') {
      return sandpackPrompts.getSandpackReactPrompt();
    }
    
    const baseInstructions = `You are an expert full-stack developer. Follow these CRITICAL formatting rules:

🚨 CRITICAL FILE FORMAT RULES:
1. Always start each file with: // src/path/filename.ext
2. Follow immediately with: \`\`\`language
3. Then put the complete file content
4. End with: \`\`\`

Example format:
// src/components/Header.jsx
\`\`\`jsx
import React from 'react';

const Header = () => {
  return (
    <header className="bg-blue-600 text-white p-4">
      <h1>My App</h1>
    </header>
  );
};

export default Header;
\`\`\`

// src/App.js
\`\`\`jsx
import React from 'react';
import Header from './components/Header';

function App() {
  return (
    <div className="App">
      <Header />
    </div>
  );
}

export default App;
\`\`\`

NEVER use **filename** format or any other format. ALWAYS use // filepath format.`;

    const prompts = {
      react: `${baseInstructions}

🎯 REACT PROJECT REQUIREMENTS:
- Create a complete, functional React application
- Include package.json, public/index.html, src/index.js, src/App.js
- Use modern React (functional components, hooks)
- Add proper imports and exports
- Use Tailwind CSS for styling
- Make it production-ready with proper file structure
- Always include at least 5-8 files for a complete project

📁 REQUIRED FILES STRUCTURE:
1. package.json (with all dependencies)
2. public/index.html 
3. src/index.js (React 18 createRoot)
4. src/App.js (main app component)
5. src/index.css (with Tailwind imports)
6. tailwind.config.js
7. Components as requested

Generate complete, working code that can be immediately used in production.`,

      component: `${baseInstructions}

🎯 COMPONENT REQUIREMENTS:
- Create focused, reusable React components
- Use TypeScript if beneficial
- Include proper prop validation
- Use Tailwind CSS for responsive design
- Add accessibility features
- Include error handling
- Provide usage examples

Generate production-ready components with comprehensive functionality.`,

      fullstack: `${baseInstructions}

🎯 FULLSTACK REQUIREMENTS:
- Frontend: React with Tailwind CSS
- Backend: Node.js/Express with proper structure
- Database: Include models/schemas
- API: RESTful endpoints with validation
- Authentication: Basic auth implementation
- File structure: Separate frontend/backend folders
- Documentation: README and API docs

Create a complete, deployable full-stack application.`,

      general: `${baseInstructions}

🎯 GENERAL REQUIREMENTS:
- Write clean, efficient, modern code
- Include proper error handling
- Add comprehensive comments
- Use current best practices
- Ensure security considerations
- Optimize for performance
- Make it production-ready

Generate complete, working code following industry standards.`
    };

    return prompts[type] || prompts.general;
  }

  async healthCheck() {
    if (!this.available) {
      throw new Error('Groq service not available');
    }

    try {
      const response = await this.client.chat.completions.create({
        messages: [{ role: 'user', content: 'Hello' }],
        model: this.model,
        max_tokens: 10
      });
      
      return { status: 'healthy', model: this.model };
    } catch (error) {
      throw new Error(`Groq health check failed: ${error.message}`);
    }
  }
}

module.exports = GroqService;