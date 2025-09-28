const express = require('express');
const { body, validationResult } = require('express-validator');
const AIController = require('../controllers/aiController');
const { asyncHandler, ValidationError } = require('../middleware/errorHandler');

const router = express.Router();
const aiController = new AIController();

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }
  next();
};

// POST /api/ai/generate - Generate code from natural language prompt
router.post('/generate',
  // Validation rules
  [
    body('prompt')
      .notEmpty()
      .withMessage('Prompt is required')
      .isLength({ min: 10, max: 5000 })
      .withMessage('Prompt must be between 10 and 5000 characters'),
    
    body('type')
      .optional()
      .isIn(['general', 'react', 'component', 'hook', 'context', 'tailwind', 'fullstack', 'debug', 'optimize', 'init'])
      .withMessage('Invalid generation type'),
    
    body('provider')
      .optional()
      .isIn(['groq', 'gemini'])
      .withMessage('Invalid AI provider'),
    
    body('context')
      .optional()
      .isObject()
      .withMessage('Context must be an object')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    await aiController.generateCode(req, res);
  })
);

// POST /api/ai/chat - Chat with AI for interactive development
router.post('/chat',
  [
    body('messages')
      .isArray({ min: 1 })
      .withMessage('Messages array is required'),
    
    body('messages.*.role')
      .isIn(['system', 'user', 'assistant'])
      .withMessage('Invalid message role'),
    
    body('messages.*.content')
      .notEmpty()
      .withMessage('Message content is required'),
    
    body('provider')
      .optional()
      .isIn(['groq', 'gemini'])
      .withMessage('Invalid AI provider')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    await aiController.chatWithAI(req, res);
  })
);

// GET /api/ai/models - Get available AI models
router.get('/models',
  asyncHandler(async (req, res) => {
    await aiController.getAvailableModels(req, res);
  })
);

// GET /api/ai/health - Health check for AI services
router.get('/health',
  asyncHandler(async (req, res) => {
    await aiController.healthCheck(req, res);
  })
);

// POST /api/ai/complete - Code completion endpoint
router.post('/complete',
  [
    body('code')
      .notEmpty()
      .withMessage('Code context is required'),
    
    body('language')
      .optional()
      .isIn(['javascript', 'typescript', 'jsx', 'tsx', 'html', 'css', 'json'])
      .withMessage('Invalid language'),
    
    body('cursorPosition')
      .optional()
      .isNumeric()
      .withMessage('Cursor position must be a number')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { code, language = 'javascript', cursorPosition = code.length, provider = null } = req.body;

    const systemPrompt = `You are an expert code completion assistant. Provide intelligent code suggestions based on the context. Return only the completion, no explanations.

Language: ${language}
Context: Code completion`;

    const userPrompt = `Complete this ${language} code:
\`\`\`${language}
${code}
\`\`\`
Cursor position: ${cursorPosition}`;

    // Use the generateCode method with specific context
    req.body = {
      prompt: userPrompt,
      type: 'general',
      context: { language, cursorPosition },
      provider
    };

    await aiController.generateCode(req, res);
  })
);

// POST /api/ai/explain - Explain code functionality
router.post('/explain',
  [
    body('code')
      .notEmpty()
      .withMessage('Code is required'),
    
    body('language')
      .optional()
      .isIn(['javascript', 'typescript', 'jsx', 'tsx', 'html', 'css', 'python', 'sql'])
      .withMessage('Invalid language')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { code, language = 'javascript' } = req.body;

    const systemPrompt = 'You are an expert code explainer. Analyze the provided code and explain what it does, how it works, and any notable patterns or techniques used.';
    
    const userPrompt = `Explain this ${language} code:
\`\`\`${language}
${code}
\`\`\``;

    req.body = {
      prompt: userPrompt,
      type: 'general',
      context: { language, operation: 'explain' }
    };

    await aiController.generateCode(req, res);
  })
);

// POST /api/ai/review - Code review and suggestions
router.post('/review',
  [
    body('code')
      .notEmpty()
      .withMessage('Code is required'),
    
    body('language')
      .optional()
      .isIn(['javascript', 'typescript', 'jsx', 'tsx', 'html', 'css', 'python', 'sql'])
      .withMessage('Invalid language'),
    
    body('focus')
      .optional()
      .isArray()
      .withMessage('Focus areas must be an array')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { code, language = 'javascript', focus = [] } = req.body;

    let focusAreas = 'Code quality, best practices, potential bugs, performance, and security';
    if (focus.length > 0) {
      focusAreas = focus.join(', ');
    }

    const systemPrompt = `You are an expert code reviewer. Review the provided code focusing on: ${focusAreas}. Provide constructive feedback and improvement suggestions.`;
    
    const userPrompt = `Review this ${language} code:
\`\`\`${language}
${code}
\`\`\`

Focus on: ${focusAreas}`;

    req.body = {
      prompt: userPrompt,
      type: 'debug',
      context: { language, operation: 'review', focus }
    };

    await aiController.generateCode(req, res);
  })
);

// POST /api/ai/optimize - Code optimization suggestions
router.post('/optimize',
  [
    body('code')
      .notEmpty()
      .withMessage('Code is required'),
    
    body('language')
      .optional()
      .isIn(['javascript', 'typescript', 'jsx', 'tsx'])
      .withMessage('Invalid language'),
    
    body('target')
      .optional()
      .isIn(['performance', 'bundle-size', 'readability', 'accessibility', 'seo'])
      .withMessage('Invalid optimization target')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { code, language = 'javascript', target = 'performance' } = req.body;

    const systemPrompt = `You are a code optimization expert. Analyze the code and provide optimized version focusing on ${target}. Explain the improvements made.`;
    
    const userPrompt = `Optimize this ${language} code for ${target}:
\`\`\`${language}
${code}
\`\`\``;

    req.body = {
      prompt: userPrompt,
      type: 'optimize',
      context: { language, optimization: target }
    };

    await aiController.generateCode(req, res);
  })
);

// POST /api/ai/debug - Debug code issues
router.post('/debug',
  [
    body('code')
      .notEmpty()
      .withMessage('Code is required'),
    
    body('error')
      .optional()
      .isString()
      .withMessage('Error message must be a string'),
    
    body('language')
      .optional()
      .isIn(['javascript', 'typescript', 'jsx', 'tsx'])
      .withMessage('Invalid language')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { code, error, language = 'javascript' } = req.body;

    let prompt = `Debug this ${language} code`;
    if (error) {
      prompt += ` that's producing the error: "${error}"`;
    }

    prompt += `:
\`\`\`${language}
${code}
\`\`\`

Please identify the issue, explain what's wrong, and provide the corrected code.`;

    req.body = {
      prompt: prompt,
      type: 'debug',
      context: { language, error, operation: 'debug' }
    };

    await aiController.generateCode(req, res);
  })
);

// POST /api/ai/template - Generate project templates
router.post('/template',
  [
    body('projectType')
      .notEmpty()
      .isIn(['react-app', 'react-component-library', 'next-app', 'express-api', 'fullstack-app'])
      .withMessage('Invalid project type'),
    
    body('features')
      .optional()
      .isArray()
      .withMessage('Features must be an array'),
    
    body('name')
      .optional()
      .isString()
      .isLength({ min: 1, max: 50 })
      .withMessage('Project name must be between 1 and 50 characters')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { projectType, features = [], name = 'my-project' } = req.body;

    const prompt = `Create a ${projectType} project template named "${name}"${features.length > 0 ? ` with features: ${features.join(', ')}` : ''}. 

Include:
- Complete project structure
- Package.json with all dependencies
- Configuration files
- Basic components and routing setup
- README with setup instructions
- Best practices implementation`;

    req.body = {
      prompt: prompt,
      type: 'init',
      context: { projectType, features, name }
    };

    await aiController.generateCode(req, res);
  })
);

// Error handling for this router
router.use((error, req, res, next) => {
  console.error('AI Router Error:', error);
  next(error);
});

module.exports = router;