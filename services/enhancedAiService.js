// services/enhancedAiService.js
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { logger } from '../utils/logger.js';

class EnhancedAIService {
  constructor() {
    this.models = this.initializeModels();
    this.prompts = this.loadPrompts();
  }

  initializeModels() {
    const models = {};
    
    if (process.env.GOOGLE_API_KEY) {
      models.gemini = new ChatGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_API_KEY,
        modelName: 'gemini-1.5-flash',
        temperature: 0.3,
      });
      logger.info('✅ Enhanced Gemini model initialized');
    }

    return models;
  }

  loadPrompts() {
    return {
      reactComponent: {
        system: `You are an expert React developer. Create modern, functional components using React 18+ with hooks, Tailwind CSS, and accessibility best practices.`,
        
        template: (description, requirements) => `Create a React component: ${description}

Requirements: ${requirements}

TECHNICAL SPECS:
- React 18+ functional components with hooks
- Tailwind CSS for styling
- Responsive design (mobile-first)
- Accessibility (ARIA labels, semantic HTML)
- TypeScript-ready patterns
- Error handling

OUTPUT FORMAT: Complete, runnable React component code only.`,

        constraints: {
          temperature: 0.3,
          maxTokens: 2048
        }
      },

      fullReactApp: {
        system: `You are an expert React developer. Create complete, production-ready React applications with multiple components, routing, and modern features.`,
        
        template: (description, features) => `Create a complete React application: ${description}

Features needed: ${Array.isArray(features) ? features.join(', ') : features}

APP REQUIREMENTS:
- Complete project structure with multiple files
- React 18+ with hooks and modern patterns
- React Router v6 for navigation
- Tailwind CSS with responsive design
- Context API for state management
- Reusable components
- Error boundaries and loading states
- Accessibility features
- SEO-friendly structure

OUTPUT FORMAT: 
Return JSON with complete file structure:
{
  "files": [
    {
      "name": "package.json",
      "path": "package.json",
      "content": "complete package.json content"
    },
    {
      "name": "App.jsx",
      "path": "src/App.jsx",
      "content": "complete App component"
    }
    // ... more files
  ],
  "dependencies": ["react", "react-dom", "react-router-dom"],
  "instructions": "Setup and build instructions"
}

Generate the complete application now.`,

        constraints: {
          temperature: 0.2,
          maxTokens: 4096
        }
      }
    };
  }

  // Enhanced component generation with structured prompts
  async generateReactComponent(description, requirements = '', model = 'gemini') {
    try {
      const prompt = this.prompts.reactComponent;
      
      const messages = [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.template(description, requirements) }
      ];

      const result = await this.models.gemini.invoke(messages);

      return {
        success: true,
        component: {
          code: this.extractCode(result.content),
          rawResponse: result.content,
          prompt: 'structured',
          model
        }
      };

    } catch (error) {
      logger.error('Enhanced component generation error:', error);
      throw error;
    }
  }

  // Enhanced app generation with structured prompts
  async generateReactApp(description, features = [], model = 'gemini') {
    try {
      const prompt = this.prompts.fullReactApp;
      
      const messages = [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.template(description, features) }
      ];

      const result = await this.models.gemini.invoke(messages);
      const parsedApp = this.parseAppResponse(result.content);

      return {
        success: true,
        app: parsedApp,
        prompt: 'structured',
        model
      };

    } catch (error) {
      logger.error('Enhanced app generation error:', error);
      throw error;
    }
  }

  // Parse JSON app response
  parseAppResponse(response) {
    try {
      const jsonMatch = response.match(/``````/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      return JSON.parse(response);
    } catch (error) {
      logger.warn('Failed to parse JSON response');
      return {
        files: [{
          name: 'App.jsx',
          path: 'src/App.jsx',
          content: this.extractCode(response)
        }]
      };
    }
  }

  // Extract code from AI response
  extractCode(response) {
    const codeMatch = response.match(/``````/);
    if (codeMatch) {
      return codeMatch[1].trim();
    }
    return response.trim();
  }
}

export default new EnhancedAIService();
