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
    this.model = process.env.GROQ_MODEL || 'llama-3.1-70b-versatile';
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
      console.log('   Prompt:', prompt.substring(0, 100) + '...');
      console.log('   Model:', this.model);

      const response = await this.client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(type)
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: this.model,
        temperature: 0.1,
        max_tokens: 4000,
        stream: false
      });

      console.log('✅ Groq API responded');
      console.log('   Response type:', typeof response);
      console.log('   Response keys:', Object.keys(response || {}));

      // Debug: Log the full response structure
      console.log('=== RAW GROQ RESPONSE ===');
      console.log(JSON.stringify(response, null, 2));
      console.log('=========================');

      // Extract content from the response
      let content = '';
      if (response.choices && response.choices[0]) {
        content = response.choices[0].message?.content || response.choices[0].text || '';
      } else if (response.content) {
        content = response.content;
      } else if (response.data) {
        content = response.data;
      }

      console.log('📝 Extracted content length:', content.length);
      console.log('📝 Content preview:', content.substring(0, 200) + '...');

      // Return in expected format
      return {
        success: true,
        content: content,
        model: this.model,
        provider: 'groq',
        usage: response.usage || null,
        // Keep original response for debugging
        raw: response
      };

    } catch (error) {
      console.error('❌ Groq API error:', error.message);
      throw new Error(`Groq API error: ${error.message}`);
    }
  }

  getSystemPrompt(type) {
    const prompts = {
      react: `You are an expert React developer. Generate clean, modern React code with the following guidelines:

1. Use functional components with hooks
2. Include proper imports
3. Use modern JavaScript/ES6+ features
4. Add helpful comments
5. Follow React best practices
6. Include proper error handling where appropriate
7. Use Tailwind CSS for styling when possible

Format your response as complete, ready-to-use code. If creating multiple files, clearly separate them with file path comments like:

// src/components/ComponentName.jsx
[component code here]

// src/styles/ComponentName.css  
[css code here if needed]

Provide clean, production-ready code that can be directly used.`,

      component: `You are an expert React developer. Create a single, focused React component with these requirements:

1. Functional component using hooks
2. Proper TypeScript types if applicable
3. Clean, readable code structure
4. Responsive design with Tailwind CSS
5. Proper prop validation
6. Good accessibility practices
7. Comprehensive error handling

Return only the component code with necessary imports.`,

      fullstack: `You are a full-stack developer. Create both frontend and backend code as requested:

1. Frontend: Modern React with hooks and Tailwind CSS
2. Backend: Node.js/Express with proper error handling
3. Database: Include schema/model definitions
4. API: RESTful endpoints with validation
5. Security: Basic authentication and data validation
6. Documentation: Clear comments and usage examples

Separate files clearly with path comments.`,

      general: `You are an expert software developer. Write clean, efficient code following best practices:

1. Clear, readable code structure
2. Proper error handling
3. Good documentation/comments
4. Modern language features
5. Security considerations
6. Performance optimization where relevant

Provide complete, working code that can be immediately used.`
    };

    return prompts[type] || prompts.general;
  }

  async healthCheck() {
    if (!this.available) {
      throw new Error('Groq service not available');
    }

    try {
      // Simple health check - just verify we can make a request
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