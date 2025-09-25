import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import Groq from 'groq-sdk';
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

      // Hugging Face (FREE with limits) - Try to import dynamically
      if (process.env.HUGGINGFACE_API_TOKEN) {
        try {
          import('@huggingface/inference').then((module) => {
            models.huggingface = new module.HuggingFaceInference({
              apiKey: process.env.HUGGINGFACE_API_TOKEN,
            });
            logger.info('✅ Hugging Face model initialized');
          }).catch(() => {
            logger.warn('⚠️  Hugging Face package not available');
          });
        } catch (error) {
          logger.warn('⚠️  Hugging Face initialization failed:', error.message);
        }
      }

      // Together AI - Skip if package not available
      if (process.env.TOGETHER_API_KEY) {
        try {
          // Try to import together-ai dynamically
          import('together-ai').then((module) => {
            models.together = new module.Together({
              apiKey: process.env.TOGETHER_API_KEY,
            });
            logger.info('✅ Together AI model initialized');
          }).catch(() => {
            logger.warn('⚠️  Together AI package not available - using alternative');
            // Alternative: Use direct API calls
            models.together = {
              isDirectAPI: true,
              apiKey: process.env.TOGETHER_API_KEY
            };
          });
        } catch (error) {
          logger.warn('⚠️  Together AI initialization failed:', error.message);
        }
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
      ])
    };
  }

  // Helper method for Groq API calls
  async callGroq(messages, model = 'llama-3.1-70b-versatile') {
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

  // Alternative Together AI direct API call
  async callTogetherDirect(messages, model = 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo') {
    try {
      const response = await fetch('https://api.together.xyz/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.models.together.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: 0.3,
          max_tokens: 2048,
        }),
      });

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      logger.error('Together AI direct API error:', error);
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
        
      } else {
        throw new Error(`Model ${preferredModel} not available`);
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
        displayName: 'Groq Llama 3.1 70B',
        description: 'Fastest inference, great for real-time generation',
        cost: 'FREE',
        speed: 'Ultra Fast (300+ tokens/sec)',
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