# Weblify.AI Clone - Backend Implementation Guide

## Project Structure
```
backend/
├── package.json
├── .env.example
├── server.js                 # Main Express server
├── config/
│   ├── database.js          # Database configuration (optional)
│   └── ai-models.js         # AI model configurations
├── controllers/
│   ├── aiController.js      # AI generation logic
│   ├── projectController.js # Project management
│   └── fileController.js    # File operations
├── middleware/
│   ├── auth.js             # Authentication middleware
│   ├── rateLimiter.js      # Rate limiting
│   └── errorHandler.js     # Error handling
├── services/
│   ├── groqService.js      # Groq API integration
│   ├── geminiService.js    # Google Gemini integration
│   └── fileService.js      # File system operations
├── prompts/
│   ├── systemPrompts.js    # System prompts for different scenarios
│   ├── reactPrompts.js     # React-specific prompts
│   └── basePrompts.js      # Base code generation prompts
├── utils/
│   ├── helpers.js          # Utility functions
│   ├── validation.js       # Input validation
│   └── constants.js        # Application constants
└── routes/
    ├── ai.js              # AI generation routes
    ├── projects.js        # Project management routes
    └── files.js           # File operation routes
```

## Key Features to Implement

### 1. AI Model Integration
- **Primary**: Groq API with CodeLlama/Llama models
- **Fallback**: Google Gemini API
- **Rate limiting**: Respect free tier limits
- **Error handling**: Graceful fallbacks between models

### 2. Code Generation Pipeline
- **System prompts**: Define AI behavior and constraints
- **Context management**: Maintain project context across requests
- **File awareness**: AI understands existing project structure
- **Incremental updates**: Support for iterative development

### 3. Project Management
- **Virtual file system**: In-memory project structure
- **Session management**: Track user projects
- **File operations**: Create, read, update, delete files
- **Project templates**: Pre-configured starting points

### 4. API Endpoints
- `POST /api/generate-code` - Generate code from natural language
- `POST /api/create-project` - Initialize new project
- `GET /api/projects/:id` - Get project structure
- `POST /api/files` - Create/update files
- `DELETE /api/files/:path` - Delete files
- `POST /api/preview` - Generate preview/build

## Free Models Comparison

| Model | Provider | Free Limits | Best For |
|-------|----------|-------------|----------|
| CodeLlama 70B | Groq | Generous rate limits | Code generation, debugging |
| Llama 3.1 405B | Groq | 131k tokens/min | Complex reasoning |
| Gemini 2.0 Flash | Google | 60 req/min, 1k/day | Fast responses |
| Gemini 1.5 Pro | Google | Lower limits | Complex tasks |

## Implementation Priority
1. **Phase 1**: Basic Express server with Groq integration
2. **Phase 2**: Add system prompts and code generation
3. **Phase 3**: File management and project structure
4. **Phase 4**: Add Gemini fallback and error handling
5. **Phase 5**: Rate limiting and optimization