import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HuggingFaceInference } from '@huggingface/inference';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import Groq from 'groq-sdk';
import { Together } from 'together-ai';
import { logger } from '../utils/logger.js';

class FreeAIService {
  constructor() {
    this.models = this.initializeModels();
    this.templates = this.initializeTemplates();
  }

  initializeModels() {
    const models = {};
    
    try {
      // Google Gemini (Best FREE option)
      if (process.env.GOOGLE_API_KEY) {
        models.gemini = new ChatGoogleGenerativeAI({
          apiKey: process.env.GOOGLE_API_KEY,
          modelName: 'gemini-1.5-flash',
          temperature: 0.3,
          maxOutputTokens: 2048,
        });
        
        models.geminiPro = new ChatGoogleGenerativeAI({
          apiKey: process.env.GOOGLE_API_KEY,
          modelName: 'gemini-1.5-pro',
          temperature: 0.3,
          maxOutputTokens: 2048,
        });
        
        logger.info('✅ Google Gemini models initialized');
      }

      // Groq (Fastest FREE inference)
      if (process.env.GROQ_API_KEY) {
        models.groq = new Groq({
          apiKey: process.env.GROQ_API_KEY,
        });
        logger.info('✅ Groq model initialized');
      }

      // Hugging Face (FREE with limits)
      if (process.env.HUGGINGFACE_API_TOKEN) {
        models.huggingface = new HuggingFaceInference({
          apiKey: process.env.HUGGINGFACE_API_TOKEN,
        });
        logger.info('✅ Hugging Face model initialized');
      }

      // Together AI (FREE credits)
      if (process.env.TOGETHER_API_KEY) {
        models.together = new Together({
          apiKey: process.env.TOGETHER_API_KEY,
        });
        logger.info('✅ Together AI model initialized');
      }

    } catch (error) {
      logger.error('Error initializing AI models:', error);
    }

    return models;
  }

  initializeTemplates() {
    return {
      // React Component Generation
      reactComponent: ChatPromptTemplate.fromMessages([
        ["system", `You are an expert React developer creating modern, functional components using the latest best practices.

CORE REQUIREMENTS:
- Use functional components with React Hooks (useState, useEffect, etc.)
- Follow React 18+ patterns and best practices
- Write clean, readable, and maintainable code
- Include proper TypeScript-ready code structure
- Use Tailwind CSS for styling with modern design patterns
- Include error boundaries and proper error handling
- Add accessibility features (ARIA labels, semantic HTML)
- Follow responsive design principles (mobile-first)

STYLING APPROACH:
- Use Tailwind CSS utility classes for styling
- Include hover effects and smooth transitions
- Use modern CSS features (flexbox, grid)
- Ensure mobile-first responsive design
- Apply consistent spacing and typography

OUTPUT FORMAT:
- Return ONLY the React component code
- Include necessary imports at the top
- Add brief JSDoc comments for complex functions
- No explanations outside the code
- Ensure code is complete and runnable

COMPONENT STRUCTURE:
\`\`\`javascript
import React, { useState, useEffect } from 'react';

/**
 * ComponentName - Brief description
 * @param {Object} props - Component props
 */
const ComponentName = ({ prop1, prop2 }) => {
  // Component logic here
  
  return (
    <div className="tailwind-classes">
      {/* JSX here */}
    </div>
  );
};

export default ComponentName;
\`\`\``],
        ["human", "Create a React component: {componentDescription}\n\nAdditional requirements: {requirements}\n\nStyle with Tailwind CSS and ensure it's fully responsive."]
      ]),

      // Full React App Generation
      reactApp: ChatPromptTemplate.fromMessages([
        ["system", `You are an expert React developer creating complete, production-ready React applications.

BASE TEMPLATE STRUCTURE:
- App.js (main component with routing)
- components/ folder with reusable components
- pages/ folder with page components
- hooks/ folder with custom hooks
- utils/ folder with helper functions
- Context API for state management

TECHNICAL REQUIREMENTS:
- React 18+ with functional components and hooks
- React Router v6 for navigation
- Context API for state management
- Tailwind CSS for styling
- Responsive design (mobile-first)
- Accessibility best practices
- Error boundaries and loading states
- Clean code architecture

INCLUDED FEATURES:
- Navigation header with responsive menu
- Multiple pages/routes
- State management with Context
- Reusable UI components
- Form handling with validation
- Loading and error states
- Responsive grid layouts
- Modern animations and transitions

OUTPUT FORMAT:
Return a JSON object with complete file structure:
\`\`\`json
{
  "files": [
    {
      "name": "App.js",
      "path": "src/App.js",
      "content": "// React App code here"
    },
    {
      "name": "Header.js", 
      "path": "src/components/Header.js",
      "content": "// Header component code"
    }
    // ... more files
  ],
  "dependencies": [
    "react-router-dom",
    "axios"
    // ... other npm packages needed
  ],
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build"
  }
}
\`\`\``],
        ["human", "Create a complete React application: {appDescription}\n\nFeatures needed: {features}\nStyling: Tailwind CSS with modern design\nEnsure responsive design and accessibility."]
      ]),

      // Code Improvement Template
      codeImprovement: ChatPromptTemplate.fromMessages([
        ["system", `You are a senior React developer and code reviewer. Improve React code following these principles:

IMPROVEMENT AREAS:
1. **Performance**: Add React.memo, useMemo, useCallback where beneficial
2. **Best Practices**: Follow React 18+ patterns and hooks best practices  
3. **Code Quality**: Improve readability, maintainability, and structure
4. **Accessibility**: Add ARIA labels, semantic HTML, keyboard navigation
5. **Error Handling**: Add proper error boundaries and validation
6. **TypeScript Ready**: Structure code to be easily convertible to TypeScript
7. **Modern Features**: Use latest React features and patterns
8. **Security**: Fix any potential XSS or security issues

SPECIFIC IMPROVEMENTS:
- Replace class components with functional components
- Optimize re-renders with proper memoization
- Add proper prop validation with PropTypes
- Implement proper error boundaries
- Add loading and empty states
- Improve CSS with Tailwind classes
- Add responsive design if missing
- Include proper cleanup in useEffect
- Add accessibility attributes

OUTPUT FORMAT:
Return only the improved code with:
- Clear comments explaining major improvements
- Proper imports and exports
- Clean formatting and structure
- No explanations outside the code`],
        ["human", "Improve this React code:\n\n{code}\n\nFocus on: {improvementAreas}"]
      ])
    };
  }

  // Helper method for Groq API calls
  async callGroq(messages, model = 'llama-3.3-70b-versatile') {
    try {
      const completion = await this.models.groq.chat.completions.create({
        messages: messages,
        model: model,
        temperature: 0.3,
        max_tokens: 2048,
      });
      
      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      logger.error('Groq API error:', error);
      throw new Error(`Groq API failed: ${error.message}`);
    }
  }

  // Helper method for Together AI calls
  async callTogether(messages, model = 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo') {
    try {
      const response = await this.models.together.chat.completions.create({
        model: model,
        messages: messages,
        temperature: 0.3,
        max_tokens: 2048,
      });
      
      return response.choices[0]?.message?.content || '';
    } catch (error) {
      logger.error('Together AI API error:', error);
      throw new Error(`Together AI API failed: ${error.message}`);
    }
  }

  // Generate React Component
  async generateReactComponent(description, requirements = '', preferredModel = 'gemini') {
    try {
      let result;
      
      if (preferredModel === 'gemini' && this.models.gemini) {
        const template = this.templates.reactComponent;
        const chain = RunnableSequence.from([
          template,
          this.models.gemini,
          new StringOutputParser()
        ]);
        
        result = await chain.invoke({
          componentDescription: description,
          requirements: requirements
        });
        
      } else if (preferredModel === 'groq' && this.models.groq) {
        const messages = [
          {
            role: "system",
            content: this.templates.reactComponent.messages[0][1]
          },
          {
            role: "user", 
            content: `Create a React component: ${description}\n\nAdditional requirements: ${requirements}\n\nStyle with Tailwind CSS and ensure it's fully responsive.`
          }
        ];
        
        result = await this.callGroq(messages);
        
      } else if (preferredModel === 'together' && this.models.together) {
        const messages = [
          {
            role: "system",
            content: this.templates.reactComponent.messages[0][1]
          },
          {
            role: "user",
            content: `Create a React component: ${description}\n\nAdditional requirements: ${requirements}`
          }
        ];
        
        result = await this.callTogether(messages);
      }

      return {
        success: true,
        code: this.extractCode(result),
        rawResponse: result,
        model: preferredModel
      };

    } catch (error) {
      logger.error('Component generation error:', error);
      
      // Fallback to different model if primary fails
      if (preferredModel !== 'gemini' && this.models.gemini) {
        logger.info(`Falling back to Gemini from ${preferredModel}`);
        return this.generateReactComponent(description, requirements, 'gemini');
      }
      
      throw error;
    }
  }

  // Generate Complete React App
  async generateReactApp(appDescription, features = [], preferredModel = 'gemini') {
    try {
      let result;
      
      if (preferredModel === 'gemini' && this.models.geminiPro) {
        const template = this.templates.reactApp;
        const chain = RunnableSequence.from([
          template,
          this.models.geminiPro,
          new StringOutputParser()
        ]);
        
        result = await chain.invoke({
          appDescription: appDescription,
          features: Array.isArray(features) ? features.join(', ') : features
        });
        
      } else if (preferredModel === 'groq' && this.models.groq) {
        const messages = [
          {
            role: "system",
            content: this.templates.reactApp.messages[0][1]
          },
          {
            role: "user",
            content: `Create a React application: ${appDescription}\n\nFeatures: ${Array.isArray(features) ? features.join(', ') : features}\nStyling: Tailwind CSS with modern design`
          }
        ];
        
        result = await this.callGroq(messages, 'llama-3.3-70b-versatile');
      }

      // Try to parse JSON response
      let parsedResult;
      try {
        const jsonMatch = result.match(/``````/);
        if (jsonMatch) {
          parsedResult = JSON.parse(jsonMatch[1]);
        } else {
          // Try to extract JSON from response
          const jsonStart = result.indexOf('{');
          const jsonEnd = result.lastIndexOf('}') + 1;
          if (jsonStart !== -1 && jsonEnd > jsonStart) {
            parsedResult = JSON.parse(result.substring(jsonStart, jsonEnd));
          }
        }
      } catch (parseError) {
        logger.warn('Failed to parse JSON response, creating fallback structure');
        parsedResult = {
          files: [
            {
              name: 'App.js',
              path: 'src/App.js',
              content: this.extractCode(result)
            }
          ],
          dependencies: ['react', 'react-dom', 'react-router-dom'],
          scripts: {
            start: 'react-scripts start',
            build: 'react-scripts build'
          }
        };
      }

      return {
        success: true,
        app: parsedResult,
        rawResponse: result,
        model: preferredModel
      };

    } catch (error) {
      logger.error('App generation error:', error);
      
      // Fallback to different model
      if (preferredModel !== 'gemini' && this.models.gemini) {
        logger.info(`Falling back to Gemini from ${preferredModel}`);
        return this.generateReactApp(appDescription, features, 'gemini');
      }
      
      throw error;
    }
  }

  // Improve Code
  async improveCode(code, improvements = 'general improvements', preferredModel = 'gemini') {
    try {
      let result;
      
      if (preferredModel === 'gemini' && this.models.gemini) {
        const template = this.templates.codeImprovement;
        const chain = RunnableSequence.from([
          template,
          this.models.gemini,
          new StringOutputParser()
        ]);
        
        result = await chain.invoke({
          code: code,
          improvementAreas: improvements
        });
        
      } else if (preferredModel === 'groq' && this.models.groq) {
        const messages = [
          {
            role: "system",
            content: this.templates.codeImprovement.messages[0][1]
          },
          {
            role: "user",
            content: `Improve this React code:\n\n${code}\n\nFocus on: ${improvements}`
          }
        ];
        
        result = await this.callGroq(messages);
      }

      return {
        success: true,
        improvedCode: this.extractCode(result),
        rawResponse: result,
        model: preferredModel
      };

    } catch (error) {
      logger.error('Code improvement error:', error);
      throw error;
    }
  }

  // Get available models
  getAvailableModels() {
    const available = [];
    
    if (this.models.gemini) {
      available.push({
        name: 'gemini',
        displayName: 'Google Gemini 1.5 Flash',
        description: 'Fast, free, excellent for code generation',
        cost: 'FREE (1M tokens/month)',
        speed: 'Fast',
        status: 'active'
      });
    }
    
    if (this.models.groq) {
      available.push({
        name: 'groq',
        displayName: 'Groq Llama 3.3 70B',
        description: 'Fastest inference, great for real-time generation',
        cost: 'FREE',
        speed: 'Ultra Fast (300+ tokens/sec)',
        status: 'active'
      });
    }
    
    if (this.models.together) {
      available.push({
        name: 'together',
        displayName: 'Together AI Llama',
        description: '$25 free credits included',
        cost: 'FREE Credits ($25)',
        speed: 'Fast',
        status: 'active'
      });
    }
    
    if (this.models.huggingface) {
      available.push({
        name: 'huggingface',
        displayName: 'Hugging Face Models',
        description: '300 requests/hour free tier',
        cost: 'FREE (300 req/hr)',
        speed: 'Medium',
        status: 'active'
      });
    }

    return available;
  }

  // Extract code from response
  extractCode(response, language = 'javascript') {
    if (!response) return '';
    
    const patterns = [
      new RegExp(`\`\`\`${language}\\n([\\s\\S]*?)\`\`\``, 'g'),
      new RegExp(`\`\`\`([\\s\\S]*?)\`\`\``, 'g'),
    ];

    for (const pattern of patterns) {
      const match = response.match(pattern);
      if (match) {
        return match[0]
          .replace(new RegExp(`\`\`\`${language}\\n?`, 'g'), '')
          .replace(/```/g, '')
          .trim();
      }
    }

    return response.trim();
  }

  // Health check for all models
  async healthCheck() {
    const health = {
      gemini: !!this.models.gemini,
      groq: !!this.models.groq, 
      together: !!this.models.together,
      huggingface: !!this.models.huggingface,
      totalAvailable: 0,
      timestamp: new Date().toISOString()
    };
    
    health.totalAvailable = Object.entries(health)
      .filter(([key, value]) => key !== 'totalAvailable' && key !== 'timestamp' && value === true)
      .length;
    
    return health;
  }
}

export default new FreeAIService();
