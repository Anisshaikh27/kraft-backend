const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    if (!process.env.GOOGLE_API_KEY) {
      console.warn('⚠️  GOOGLE_API_KEY not set. Gemini service will not be available.');
      this.client = null;
      return;
    }

    this.client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    this.model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    this.maxTokens = parseInt(process.env.GEMINI_MAX_TOKENS) || 4096;
    this.temperature = parseFloat(process.env.GEMINI_TEMPERATURE) || 0.1;

    // Rate limiting for free tier
    this.requestCount = 0;
    this.lastReset = Date.now();
    this.rateLimitWindow = 60000; // 1 minute
    this.maxRequestsPerWindow = 15; // Conservative for free tier (60 req/min limit)
  }

  async isAvailable() {
    return this.client !== null;
  }

  checkRateLimit() {
    const now = Date.now();
    
    if (now - this.lastReset > this.rateLimitWindow) {
      this.requestCount = 0;
      this.lastReset = now;
    }

    if (this.requestCount >= this.maxRequestsPerWindow) {
      throw new Error('Gemini rate limit exceeded. Please try again later.');
    }

    this.requestCount++;
  }

  async generateCode(prompt, type = 'react', context = {}) {
    if (!this.client) {
      throw new Error('Gemini service not available. API key not configured.');
    }

    this.checkRateLimit();

    try {
      // For react/sandpack, use master prompt
      let enhancedPrompt = prompt;
      if (type === 'react' || type === 'sandpack') {
        const masterPrompt = require('../prompts/masterPrompt');
        const systemPromptTemplate = masterPrompt.getMasterSandpackPrompt();
        enhancedPrompt = `${systemPromptTemplate}\n\nUser Request: ${prompt}`;
      }

      const model = this.client.getGenerativeModel({ 
        model: this.model,
        generationConfig: {
          temperature: this.temperature,
          maxOutputTokens: this.maxTokens,
          topP: 0.8,
          topK: 10
        }
      });

      const result = await model.generateContent(enhancedPrompt);
      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error('Empty response from Gemini');
      }

      return {
        success: true,
        content: text,
        model: this.model,
        provider: 'gemini',
        usage: {
          promptTokens: response.usageMetadata?.promptTokenCount || 0,
          completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: response.usageMetadata?.totalTokenCount || 0
        }
      };

    } catch (error) {
      console.error('Gemini API error:', error.message);

      // Handle specific Gemini errors
      if (error.message?.includes('quota') || error.message?.includes('limit')) {
        throw new Error('Gemini rate limit exceeded. Please try again later.');
      }
      
      if (error.message?.includes('API key') || error.status === 403) {
        throw new Error('Gemini API authentication failed. Please check your API key.');
      }

      if (error.status >= 500) {
        throw new Error('Gemini service temporarily unavailable.');
      }

      throw new Error(`Gemini API error: ${error.message}`);
    }
  }

  async generateCodeOld(systemPrompt, userPrompt, context = {}) {
    if (!this.client) {
      throw new Error('Gemini service not available. API key not configured.');
    }

    this.checkRateLimit();

    try {
      const model = this.client.getGenerativeModel({ 
        model: this.model,
        generationConfig: {
          temperature: this.temperature,
          maxOutputTokens: this.maxTokens,
          topP: 0.8,
          topK: 10
        }
      });

      // Construct the full prompt
      let fullPrompt = systemPrompt + '\n\n';

      // Add context if provided
      if (context.projectStructure) {
        fullPrompt += `Current project structure:\n${JSON.stringify(context.projectStructure, null, 2)}\n\n`;
      }

      if (context.currentFiles && context.currentFiles.length > 0) {
        fullPrompt += `Current files in project:\n${context.currentFiles.map(file => 
          `File: ${file.path}\n\`\`\`${file.language || ''}\n${file.content}\n\`\`\``
        ).join('\n\n')}\n\n`;
      }

      fullPrompt += `User Request: ${userPrompt}`;

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error('Empty response from Gemini');
      }

      return {
        success: true,
        content: text,
        model: this.model,
        provider: 'gemini',
        usage: {
          promptTokens: response.usageMetadata?.promptTokenCount || 0,
          completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: response.usageMetadata?.totalTokenCount || 0
        }
      };

    } catch (error) {
      console.error('Gemini API error:', error.message);

      // Handle specific Gemini errors
      if (error.message?.includes('quota') || error.message?.includes('limit')) {
        throw new Error('Gemini rate limit exceeded. Please try again later.');
      }
      
      if (error.message?.includes('API key') || error.status === 403) {
        throw new Error('Gemini API authentication failed. Please check your API key.');
      }

      if (error.status >= 500) {
        throw new Error('Gemini service temporarily unavailable.');
      }

      throw new Error(`Gemini API error: ${error.message}`);
    }
  }

  async generateChat(messages, options = {}) {
    if (!this.client) {
      throw new Error('Gemini service not available. API key not configured.');
    }

    this.checkRateLimit();

    try {
      const model = this.client.getGenerativeModel({ 
        model: options.model || this.model,
        generationConfig: {
          temperature: options.temperature || this.temperature,
          maxOutputTokens: options.maxTokens || this.maxTokens,
          topP: options.topP || 0.8,
        }
      });

      // Convert messages to Gemini format
      const geminiMessages = this.convertMessagesToGeminiFormat(messages);
      
      const chat = model.startChat({
        history: geminiMessages.slice(0, -1), // All but the last message
      });

      const lastMessage = geminiMessages[geminiMessages.length - 1];
      const result = await chat.sendMessage(lastMessage.parts[0].text);
      const response = await result.response;

      return {
        success: true,
        content: response.text(),
        model: this.model,
        provider: 'gemini',
        usage: response.usageMetadata
      };

    } catch (error) {
      console.error('Gemini chat error:', error.message);
      throw error;
    }
  }

  convertMessagesToGeminiFormat(messages) {
    return messages.map(msg => {
      if (msg.role === 'system') {
        // Gemini doesn't have a system role, so we combine it with user messages
        return {
          role: 'user',
          parts: [{ text: `[System]: ${msg.content}` }]
        };
      } else if (msg.role === 'user') {
        return {
          role: 'user',
          parts: [{ text: msg.content }]
        };
      } else if (msg.role === 'assistant') {
        return {
          role: 'model',
          parts: [{ text: msg.content }]
        };
      }
      return msg;
    });
  }

  async getModels() {
    if (!this.client) {
      return [];
    }

    try {
      // Return available Gemini models for code generation
      return [
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', context: 128000 },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', context: 128000 },
        { id: 'gemini-1.0-pro', name: 'Gemini 1.0 Pro', context: 32768 }
      ];
    } catch (error) {
      console.error('Error fetching Gemini models:', error.message);
      return [];
    }
  }

  async healthCheck() {
    if (!this.client) {
      return { status: 'unavailable', error: 'API key not configured' };
    }

    try {
      const model = this.client.getGenerativeModel({ model: this.model });
      const result = await model.generateContent('Hello');
      const response = await result.response;
      
      if (response.text()) {
        return { 
          status: 'healthy', 
          model: this.model,
          rateLimit: {
            requests: this.requestCount,
            window: this.rateLimitWindow,
            max: this.maxRequestsPerWindow
          }
        };
      } else {
        throw new Error('Empty response');
      }
    } catch (error) {
      return { 
        status: 'unhealthy', 
        error: error.message 
      };
    }
  }

  // Specific method for code completion/suggestions
  async generateCodeCompletion(codeContext, cursorPosition, language = 'javascript') {
    const systemPrompt = `You are an expert code completion assistant. Given the code context and cursor position, provide intelligent code suggestions. Return only the completion, no explanations.

Language: ${language}
Context: Code completion at cursor position`;

    const userPrompt = `Complete this code:
\`\`\`${language}
${codeContext}
\`\`\`
Cursor position: ${cursorPosition}`;

    return this.generateCode(systemPrompt, userPrompt);
  }

  // Method for explaining code
  async explainCode(code, language = 'javascript') {
    const systemPrompt = 'You are an expert code explainer. Analyze the provided code and explain what it does, how it works, and any notable patterns or techniques used.';
    
    const userPrompt = `Explain this ${language} code:
\`\`\`${language}
${code}
\`\`\``;

    return this.generateCode(systemPrompt, userPrompt);
  }

  // Method for code review
  async reviewCode(code, language = 'javascript') {
    const systemPrompt = `You are an expert code reviewer. Review the provided code and provide feedback on:
- Code quality and best practices
- Potential bugs or issues
- Performance considerations
- Security concerns
- Suggestions for improvement`;
    
    const userPrompt = `Review this ${language} code:
\`\`\`${language}
${code}
\`\`\``;

    return this.generateCode(systemPrompt, userPrompt);
  }
}

module.exports = GeminiService;