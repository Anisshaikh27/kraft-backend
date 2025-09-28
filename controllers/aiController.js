const GroqService = require('../services/groqService');
const GeminiService = require('../services/geminiService');
const { 
  getSystemPrompt, 
  getReactPrompt, 
  getFullStackPrompt,
  getDebuggingPrompt,
  getOptimizationPrompt 
} = require('../prompts/systemPrompts');
const { 
  getReactComponentPrompt,
  getReactHooksPrompt,
  getReactContextPrompt,
  getReactTailwindPrompt 
} = require('../prompts/reactPrompts');
const { 
  getBaseCodePrompt,
  getProjectInitPrompt 
} = require('../prompts/basePrompts');

class AIController {
  constructor() {
    this.groqService = new GroqService();
    this.geminiService = new GeminiService();
    this.primaryProvider = process.env.PRIMARY_AI_PROVIDER || 'groq';
    this.fallbackProvider = process.env.FALLBACK_AI_PROVIDER || 'gemini';
  }

  async generateCode(req, res) {
    try {
      const {
        prompt,
        type = 'general', // general, react, component, hook, fullstack, debug, optimize
        context = {},
        provider = null // Allow override
      } = req.body;

      if (!prompt) {
        return res.status(400).json({
          error: 'Prompt is required',
          message: 'Please provide a prompt for code generation'
        });
      }

      // Get appropriate system prompt based on type
      const systemPrompt = this.getSystemPromptByType(type, context);

      // Enhanced user prompt with context
      const enhancedPrompt = this.enhanceUserPrompt(prompt, type, context);

      // Try primary provider first, then fallback
      const useProvider = provider || this.primaryProvider;
      let result;

      try {
        result = await this.callAIProvider(useProvider, systemPrompt, enhancedPrompt, context);
      } catch (error) {
        console.log(`Primary provider (${useProvider}) failed:`, error.message);
        
        // Try fallback provider
        const fallbackProvider = useProvider === 'groq' ? 'gemini' : 'groq';
        console.log(`Trying fallback provider: ${fallbackProvider}`);
        
        try {
          result = await this.callAIProvider(fallbackProvider, systemPrompt, enhancedPrompt, context);
        } catch (fallbackError) {
          console.error('Both providers failed:', fallbackError.message);
          throw new Error('All AI providers are currently unavailable. Please try again later.');
        }
      }

      // Parse and enhance the response
      const parsedResult = this.parseAIResponse(result.content, type);

      res.json({
        success: true,
        data: {
          ...parsedResult,
          model: result.model,
          provider: result.provider,
          usage: result.usage
        },
        metadata: {
          type,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - req.startTime
        }
      });

    } catch (error) {
      console.error('Code generation error:', error);
      res.status(500).json({
        error: 'Code generation failed',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  async chatWithAI(req, res) {
    try {
      const {
        messages,
        context = {},
        provider = null
      } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({
          error: 'Messages array is required'
        });
      }

      const useProvider = provider || this.primaryProvider;
      let result;

      try {
        if (useProvider === 'groq') {
          result = await this.groqService.generateChat(messages);
        } else {
          result = await this.geminiService.generateChat(messages);
        }
      } catch (error) {
        // Try fallback
        const fallbackProvider = useProvider === 'groq' ? 'gemini' : 'groq';
        if (fallbackProvider === 'groq') {
          result = await this.groqService.generateChat(messages);
        } else {
          result = await this.geminiService.generateChat(messages);
        }
      }

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({
        error: 'Chat failed',
        message: error.message
      });
    }
  }

  async getAvailableModels(req, res) {
    try {
      const groqModels = await this.groqService.getModels();
      const geminiModels = await this.geminiService.getModels();

      res.json({
        success: true,
        data: {
          groq: {
            available: await this.groqService.isAvailable(),
            models: groqModels
          },
          gemini: {
            available: await this.geminiService.isAvailable(),
            models: geminiModels
          }
        }
      });
    } catch (error) {
      console.error('Error fetching models:', error);
      res.status(500).json({
        error: 'Failed to fetch models',
        message: error.message
      });
    }
  }

  async healthCheck(req, res) {
    try {
      const groqHealth = await this.groqService.healthCheck();
      const geminiHealth = await this.geminiService.healthCheck();

      const isHealthy = groqHealth.status === 'healthy' || geminiHealth.status === 'healthy';

      res.status(isHealthy ? 200 : 503).json({
        success: isHealthy,
        data: {
          groq: groqHealth,
          gemini: geminiHealth,
          primary: this.primaryProvider,
          fallback: this.fallbackProvider
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        error: 'Health check failed',
        message: error.message
      });
    }
  }

  // Helper methods

  getSystemPromptByType(type, context) {
    const basePrompt = getSystemPrompt(context.workingDirectory);
    
    switch (type) {
      case 'react':
        return basePrompt + '\n\n' + getReactPrompt();
      
      case 'component':
        return basePrompt + '\n\n' + getReactComponentPrompt();
      
      case 'hook':
        return basePrompt + '\n\n' + getReactHooksPrompt();
      
      case 'context':
        return basePrompt + '\n\n' + getReactContextPrompt();
      
      case 'tailwind':
        return basePrompt + '\n\n' + getReactTailwindPrompt();
      
      case 'fullstack':
        return basePrompt + '\n\n' + getFullStackPrompt();
      
      case 'debug':
        return basePrompt + '\n\n' + getDebuggingPrompt();
      
      case 'optimize':
        return basePrompt + '\n\n' + getOptimizationPrompt();
      
      case 'init':
        return basePrompt + '\n\n' + getProjectInitPrompt();
      
      default:
        return basePrompt + '\n\n' + getBaseCodePrompt();
    }
  }

  enhanceUserPrompt(prompt, type, context) {
    let enhancedPrompt = prompt;

    // Add context information
    if (context.projectType) {
      enhancedPrompt += `\n\nProject Type: ${context.projectType}`;
    }

    if (context.targetFramework) {
      enhancedPrompt += `\nTarget Framework: ${context.targetFramework}`;
    }

    if (context.requirements && context.requirements.length > 0) {
      enhancedPrompt += `\nRequirements: ${context.requirements.join(', ')}`;
    }

    // Add type-specific enhancements
    switch (type) {
      case 'component':
        enhancedPrompt += '\n\nPlease create a React functional component with proper TypeScript types (if applicable), styling with Tailwind CSS, and include proper accessibility attributes.';
        break;
      
      case 'hook':
        enhancedPrompt += '\n\nPlease create a custom React hook with proper TypeScript types, error handling, and comprehensive JSDoc documentation.';
        break;
      
      case 'fullstack':
        enhancedPrompt += '\n\nPlease create both frontend and backend code with proper API endpoints, error handling, and security considerations.';
        break;
      
      case 'debug':
        enhancedPrompt += '\n\nPlease identify the issue, explain the problem, and provide a corrected version with explanation of the changes.';
        break;
      
      case 'optimize':
        enhancedPrompt += '\n\nPlease analyze the code for performance issues and provide optimized version with explanations of improvements.';
        break;
    }

    return enhancedPrompt;
  }

  async callAIProvider(provider, systemPrompt, userPrompt, context) {
    if (provider === 'groq') {
      if (!await this.groqService.isAvailable()) {
        throw new Error('Groq service not available');
      }
      return await this.groqService.generateCode(systemPrompt, userPrompt, context);
    } else if (provider === 'gemini') {
      if (!await this.geminiService.isAvailable()) {
        throw new Error('Gemini service not available');
      }
      return await this.geminiService.generateCode(systemPrompt, userPrompt, context);
    } else {
      throw new Error(`Unknown provider: ${provider}`);
    }
  }

  parseAIResponse(content, type) {
    const result = {
      content: content,
      files: [],
      suggestions: [],
      explanation: ''
    };

    // Extract file operations from bolt format
    const fileOperationRegex = /<bolt_file_operations>([\s\S]*?)<\/bolt_file_operations>/g;
    const createFileRegex = /<bolt_create_file path="([^"]+)">([\s\S]*?)<\/bolt_create_file>/g;
    const editFileRegex = /<bolt_edit_file path="([^"]+)">([\s\S]*?)<\/bolt_edit_file>/g;

    let match;

    // Extract file operations
    while ((match = fileOperationRegex.exec(content)) !== null) {
      const operations = match[1];
      
      // Extract create file operations
      let createMatch;
      while ((createMatch = createFileRegex.exec(operations)) !== null) {
        result.files.push({
          path: createMatch[1],
          content: createMatch[2].trim(),
          operation: 'create'
        });
      }

      // Extract edit file operations
      let editMatch;
      while ((editMatch = editFileRegex.exec(operations)) !== null) {
        result.files.push({
          path: editMatch[1],
          content: editMatch[2].trim(),
          operation: 'edit'
        });
      }
    }

    // Extract code blocks for non-file operations
    if (result.files.length === 0) {
      const codeBlockRegex = /```(\w+)?\n([\s\S]*?)\n```/g;
      while ((match = codeBlockRegex.exec(content)) !== null) {
        const language = match[1] || 'text';
        const code = match[2].trim();
        
        result.files.push({
          path: `generated.${this.getExtensionForLanguage(language)}`,
          content: code,
          language: language,
          operation: 'create'
        });
      }
    }

    // Clean content of file operations for explanation
    result.explanation = content.replace(fileOperationRegex, '').trim();

    return result;
  }

  getExtensionForLanguage(language) {
    const extensions = {
      javascript: 'js',
      js: 'js',
      typescript: 'ts',
      ts: 'ts',
      jsx: 'jsx',
      tsx: 'tsx',
      html: 'html',
      css: 'css',
      json: 'json',
      python: 'py',
      sql: 'sql',
      bash: 'sh',
      shell: 'sh'
    };

    return extensions[language.toLowerCase()] || 'txt';
  }
}

module.exports = AIController;