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
      console.log('Full response:', JSON.stringify(response, null, 2));
      console.log('=======================\n');

      // FIXED: Process and structure the response correctly
      const processedResponse = this.processAIResponse(response, usedProvider);
      
      console.log('\n=== PROCESSED RESPONSE ===');
      console.log('Content length:', processedResponse.content?.length || 0);
      console.log('Number of files:', processedResponse.files?.length || 0);
      console.log('Files:', processedResponse.files?.map(f => f.path) || []);
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

      console.log('✅ Final response being sent:', JSON.stringify(finalResponse, null, 2));

      res.json(finalResponse);

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      console.log('\n❌ AI GENERATION ERROR ===');
      console.log('Error message:', error.message);
      console.log('Error stack:', error.stack);
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

  // FIXED: This method was the problem!
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
        // For Groq, the response should already have the content extracted
        content = response.content || '';
        console.log(`📝 Groq content extracted: ${content.length} characters`);
      } else if (provider === 'gemini') {
        // Handle Gemini response format
        if (response.candidates && response.candidates[0]) {
          content = response.candidates[0].content?.parts?.[0]?.text || '';
        }
        console.log(`📝 Gemini content extracted: ${content.length} characters`);
      }

      // Set the content
      processedResponse.content = content;
      processedResponse.explanation = content;

      // FIXED: Extract files from the content properly
      if (content) {
        const extractedFiles = this.extractFilesFromContent(content);
        processedResponse.files = extractedFiles;
        console.log(`📁 Extracted ${extractedFiles.length} files from content`);
      } else {
        console.log('⚠️ No content to extract files from');
      }

      // If no files were extracted but we have content, create a default file
      if (processedResponse.files.length === 0 && content.trim()) {
        console.log('⚠️ No files extracted, creating default file...');
        const defaultFile = {
          path: 'src/components/GeneratedComponent.jsx',
          content: content,
          language: 'javascript',
          operation: 'create'
        };
        processedResponse.files = [defaultFile];
      }

    } catch (error) {
      console.error('Error processing AI response:', error);
      processedResponse.content = 'Error processing AI response: ' + error.message;
    }

    console.log(`✅ Processing complete: ${processedResponse.content.length} chars, ${processedResponse.files.length} files`);
    return processedResponse;
  }

  // FIXED: Better file extraction
  extractFilesFromContent(content) {
    console.log('🔍 Extracting files from content...');
    
    const files = [];
    
    // Look for code blocks with file paths (pattern: // src/path/file.ext)
    const fileRegex = /\/\/\s+(src\/[^\n]+\.(jsx?|tsx?|css|html|json|md))\s*\n```[\w]*\n([\s\S]*?)```/g;
    let match;
    
    while ((match = fileRegex.exec(content)) !== null) {
      const filePath = match[1].trim();
      const fileContent = match[3].trim();
      
      if (fileContent && filePath) {
        files.push({
          path: filePath,
          content: fileContent,
          language: this.getLanguageFromPath(filePath),
          operation: 'create'
        });
        console.log(`📄 Extracted file: ${filePath} (${fileContent.length} chars)`);
      }
    }

    // Fallback: Look for any code blocks
    if (files.length === 0) {
      const codeBlockRegex = /```(?:jsx?|typescript|tsx?)?\n([\s\S]*?)```/g;
      let codeMatch;
      let fileIndex = 1;
      
      while ((codeMatch = codeBlockRegex.exec(content)) !== null) {
        const codeContent = codeMatch[1].trim();
        
        if (codeContent) {
          // Determine file path based on content
          let filePath = `src/components/Component${fileIndex}.jsx`;
          
          if (codeContent.includes('export default') || codeContent.includes('const ') || codeContent.includes('function ')) {
            filePath = `src/components/GeneratedComponent${fileIndex === 1 ? '' : fileIndex}.jsx`;
          }
          
          files.push({
            path: filePath,
            content: codeContent,
            language: 'javascript',
            operation: 'create'
          });
          
          console.log(`📄 Extracted code block ${fileIndex}: ${filePath} (${codeContent.length} chars)`);
          fileIndex++;
        }
      }
    }

    console.log(`📁 Total extracted: ${files.length} files`);
    return files;
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