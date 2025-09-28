const Groq = require('groq-sdk');

class GroqService {
  constructor() {
    if (!process.env.GROQ_API_KEY) {
      console.warn('⚠️  GROQ_API_KEY not set. Groq service will not be available.');
      this.client = null;
      return;
    }

    this.client = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    this.model = process.env.GROQ_MODEL || 'llama-3.1-70b-versatile';
    this.maxTokens = parseInt(process.env.GROQ_MAX_TOKENS) || 4096;
    this.temperature = parseFloat(process.env.GROQ_TEMPERATURE) || 0.1;

    // Rate limiting properties
    this.requestCount = 0;
    this.lastReset = Date.now();
    this.rateLimitWindow = 60000; // 1 minute
    this.maxRequestsPerWindow = 30; // Conservative limit for free tier
  }

  async isAvailable() {
    return this.client !== null;
  }

  checkRateLimit() {
    const now = Date.now();
    
    // Reset counter if window has passed
    if (now - this.lastReset > this.rateLimitWindow) {
      this.requestCount = 0;
      this.lastReset = now;
    }

    // Check if we're within limits
    if (this.requestCount >= this.maxRequestsPerWindow) {
      throw new Error('Groq rate limit exceeded. Please try again later.');
    }

    this.requestCount++;
  }

  async generateCode(systemPrompt, userPrompt, context = {}) {
    if (!this.client) {
      throw new Error('Groq service not available. API key not configured.');
    }

    this.checkRateLimit();

    try {
      const messages = [
        {
          role: "system",
          content: systemPrompt
        }
      ];

      // Add context if provided
      if (context.projectStructure) {
        messages.push({
          role: "system",
          content: `Current project structure:\n${JSON.stringify(context.projectStructure, null, 2)}`
        });
      }

      if (context.currentFiles && context.currentFiles.length > 0) {
        messages.push({
          role: "system", 
          content: `Current files in project:\n${context.currentFiles.map(file => 
            `File: ${file.path}\n\`\`\`${file.language || ''}\n${file.content}\n\`\`\``
          ).join('\n\n')}`
        });
      }

      messages.push({
        role: "user",
        content: userPrompt
      });

      const completion = await this.client.chat.completions.create({
        messages,
        model: this.model,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        top_p: 1,
        stream: false,
      });

      if (!completion.choices || completion.choices.length === 0) {
        throw new Error('No completion choices returned from Groq');
      }

      const response = completion.choices[0].message.content;
      
      return {
        success: true,
        content: response,
        model: this.model,
        provider: 'groq',
        usage: {
          promptTokens: completion.usage?.prompt_tokens || 0,
          completionTokens: completion.usage?.completion_tokens || 0,
          totalTokens: completion.usage?.total_tokens || 0
        }
      };

    } catch (error) {
      console.error('Groq API error:', error.message);

      // Handle specific Groq errors
      if (error.status === 429) {
        throw new Error('Groq rate limit exceeded. Please try again later.');
      }
      
      if (error.status === 401) {
        throw new Error('Groq API authentication failed. Please check your API key.');
      }

      if (error.status >= 500) {
        throw new Error('Groq service temporarily unavailable. Trying fallback...');
      }

      throw new Error(`Groq API error: ${error.message}`);
    }
  }

  async generateChat(messages, options = {}) {
    if (!this.client) {
      throw new Error('Groq service not available. API key not configured.');
    }

    this.checkRateLimit();

    try {
      const completion = await this.client.chat.completions.create({
        messages,
        model: options.model || this.model,
        temperature: options.temperature || this.temperature,
        max_tokens: options.maxTokens || this.maxTokens,
        top_p: options.topP || 1,
        stream: options.stream || false,
      });

      return {
        success: true,
        content: completion.choices[0].message.content,
        model: completion.model,
        provider: 'groq',
        usage: completion.usage
      };

    } catch (error) {
      console.error('Groq chat error:', error.message);
      throw error;
    }
  }

  // Get available models
  async getModels() {
    if (!this.client) {
      return [];
    }

    try {
      // Groq supported models for code generation
      return [
        { id: 'llama-3.1-405b-reasoning', name: 'Llama 3.1 405B (Reasoning)', context: 131072 },
        { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B (Versatile)', context: 131072 },
        { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Instant)', context: 131072 },
        { id: 'llama3-70b-8192', name: 'Llama 3 70B', context: 8192 },
        { id: 'llama3-8b-8192', name: 'Llama 3 8B', context: 8192 },
        { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', context: 32768 },
        { id: 'gemma-7b-it', name: 'Gemma 7B', context: 8192 }
      ];
    } catch (error) {
      console.error('Error fetching Groq models:', error.message);
      return [];
    }
  }

  // Health check
  async healthCheck() {
    if (!this.client) {
      return { status: 'unavailable', error: 'API key not configured' };
    }

    try {
      // Try a simple request to verify the service is working
      const testResponse = await this.client.chat.completions.create({
        messages: [{ role: 'user', content: 'Hello' }],
        model: this.model,
        max_tokens: 10,
        temperature: 0,
      });

      return { 
        status: 'healthy', 
        model: this.model,
        rateLimit: {
          requests: this.requestCount,
          window: this.rateLimitWindow,
          max: this.maxRequestsPerWindow
        }
      };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        error: error.message 
      };
    }
  }
}

module.exports = GroqService;