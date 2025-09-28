# Weblify.AI Backend 🚀

A powerful backend for AI-powered web application generation, similar to bolt.new but using **free AI models** like Groq and Google Gemini instead of paid services like Claude.

## ✨ Features

- **🤖 Multiple AI Providers**: Groq (primary) and Google Gemini (fallback) for reliable code generation
- **🔄 Automatic Fallback**: If one AI service fails, automatically switches to the backup
- **⚡ Fast & Free**: Uses high-performance free AI models with generous rate limits
- **🎯 Specialized Prompts**: Optimized system prompts for React, Next.js, and full-stack development
- **📁 Project Management**: Virtual file system for managing multiple projects
- **🛡️ Production Ready**: Comprehensive error handling, rate limiting, and validation
- **🔧 Easy Setup**: Simple configuration with environment variables

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Free API keys from:
  - [Groq Console](https://console.groq.com/keys) (Primary - recommended)
  - [Google AI Studio](https://aistudio.google.com/app/apikey) (Fallback)

### Installation

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd weblify-ai-backend
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```

3. **Add your API keys** to `.env`:
   ```env
   PORT=3001
   NODE_ENV=development
   
   # Get free API key from https://console.groq.com/keys
   GROQ_API_KEY=your_groq_api_key_here
   
   # Get free API key from https://aistudio.google.com/app/apikey
   GOOGLE_API_KEY=your_google_api_key_here
   
   # Choose primary provider
   PRIMARY_AI_PROVIDER=groq
   FALLBACK_AI_PROVIDER=gemini
   ```

4. **Start the server**:
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

5. **Test the API**:
   ```bash
   curl http://localhost:3001/health
   ```

## 🔑 Getting Free API Keys

### Groq API (Primary - Recommended)

1. Visit [Groq Console](https://console.groq.com/keys)
2. Sign up with Google/GitHub (free)
3. Generate API key
4. **Free tier includes**:
   - 30 requests per minute
   - Very fast inference (10x faster than competitors)
   - Access to Llama 3.1 70B and other models

### Google Gemini API (Fallback)

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with Google account
3. Create API key
4. **Free tier includes**:
   - 60 requests per minute
   - 1,000 requests per day
   - Gemini 1.5 Flash model access

## 📚 API Documentation

### Health Check
```http
GET /health
```

### AI Code Generation
```http
POST /api/ai/generate
Content-Type: application/json

{
  "prompt": "Create a React component for a user profile card with avatar, name, email, and edit button",
  "type": "react",
  "context": {
    "projectType": "react-app",
    "targetFramework": "React 18"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "content": "Generated response with explanations",
    "files": [
      {
        "path": "components/UserProfile.jsx",
        "content": "import React from 'react'...",
        "operation": "create"
      }
    ],
    "explanation": "Detailed explanation of the generated code",
    "model": "llama-3.1-70b-versatile",
    "provider": "groq"
  }
}
```

### Generation Types

- `general` - Basic code generation
- `react` - React-specific components and patterns
- `component` - Focused React component creation
- `hook` - Custom React hooks
- `fullstack` - Full-stack applications
- `debug` - Code debugging and fixes
- `optimize` - Performance optimization
- `init` - Project initialization

### Project Management
```http
# Create project
POST /api/projects
{
  "name": "My React App",
  "type": "react-app",
  "description": "A modern React application"
}

# Get project
GET /api/projects/:id

# List projects
GET /api/projects
Headers: x-session-id: your-session-id
```

### File Operations
```http
# Create file
POST /api/files/:projectId
{
  "path": "src/components/Button.jsx",
  "content": "import React from 'react'...",
  "language": "jsx"
}

# Get file
GET /api/files/:projectId/file?path=src/App.js

# Update file
PUT /api/files/:projectId
{
  "path": "src/App.js",
  "content": "updated content..."
}
```

## 🧪 Testing the API

### Using curl

1. **Test health check**:
   ```bash
   curl http://localhost:3001/health
   ```

2. **Generate React component**:
   ```bash
   curl -X POST http://localhost:3001/api/ai/generate \
     -H "Content-Type: application/json" \
     -d '{
       "prompt": "Create a responsive navigation bar with logo, menu items, and mobile hamburger menu",
       "type": "react"
     }'
   ```

3. **Create a project**:
   ```bash
   curl -X POST http://localhost:3001/api/projects \
     -H "Content-Type: application/json" \
     -H "x-session-id: test-session" \
     -d '{
       "name": "Test Project",
       "type": "react-app"
     }'
   ```

### Using JavaScript/Frontend

```javascript
// Generate code
const response = await fetch('http://localhost:3001/api/ai/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: 'Create a login form with email, password, and remember me checkbox',
    type: 'react',
    context: {
      projectType: 'react-app'
    }
  })
});

const result = await response.json();
console.log(result.data.files); // Generated files
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | 3001 | No |
| `NODE_ENV` | Environment | development | No |
| `GROQ_API_KEY` | Groq API key | - | Yes* |
| `GOOGLE_API_KEY` | Google Gemini API key | - | Yes* |
| `PRIMARY_AI_PROVIDER` | Primary AI provider | groq | No |
| `FALLBACK_AI_PROVIDER` | Fallback AI provider | gemini | No |
| `CORS_ORIGIN` | CORS origin | http://localhost:3000 | No |

*At least one API key is required

### Rate Limiting

The backend includes intelligent rate limiting:

- **Groq**: 30 requests per minute (conservative for free tier)
- **Gemini**: 15 requests per minute (conservative for free tier)
- **Global**: 30 requests per minute per IP

## 🔧 Advanced Usage

### Custom System Prompts

You can customize the AI behavior by modifying the system prompts in `prompts/systemPrompts.js`.

### Adding New AI Providers

1. Create a new service in `services/`
2. Implement the required interface
3. Add to the AI controller
4. Update environment configuration

### Database Integration

The current implementation uses in-memory storage. For production:

1. Replace Map storage with database (MongoDB, PostgreSQL)
2. Implement proper user authentication
3. Add data persistence layers

## 📊 Monitoring & Logging

The backend includes comprehensive logging:

- Request/response logging
- Error tracking with stack traces
- AI service usage monitoring
- Performance metrics

## 🛡️ Security Features

- **Rate limiting** per IP and endpoint
- **Input validation** for all requests
- **Error sanitization** (no sensitive data in responses)
- **CORS protection** with configurable origins
- **Request timeout** protection

## 🚀 Deployment

### Using PM2
```bash
npm install -g pm2
pm2 start server.js --name "weblify-backend"
pm2 startup
pm2 save
```

### Using Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### Environment-Specific Configs

**Development:**
```env
NODE_ENV=development
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:3000
```

**Production:**
```env
NODE_ENV=production
LOG_LEVEL=error
CORS_ORIGIN=https://yourdomain.com
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

1. **API keys not working**:
   - Verify keys are correctly set in `.env`
   - Check if keys have required permissions
   - Ensure no extra spaces in keys

2. **Rate limit exceeded**:
   - Wait for the rate limit window to reset
   - Consider using both providers for higher throughput

3. **CORS errors**:
   - Update `CORS_ORIGIN` in `.env`
   - Ensure frontend URL matches exactly

4. **Memory issues**:
   - Restart server periodically in development
   - Implement database storage for production

### Getting Help

- Create an issue in the repository
- Check existing issues for solutions
- Review the API documentation above

---

**Built with ❤️ for developers who want AI-powered coding without breaking the bank! 🎉**