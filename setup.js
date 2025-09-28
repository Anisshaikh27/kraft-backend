#!/usr/bin/env node

/**
 * Weblify.AI Backend Setup Script
 * Automated setup for the backend with API key validation
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function validateApiKey(provider, apiKey) {
  if (!apiKey || apiKey === 'your_api_key_here') {
    return false;
  }

  try {
    if (provider === 'groq') {
      const Groq = require('groq-sdk');
      const client = new Groq({ apiKey });
      await client.chat.completions.create({
        messages: [{ role: 'user', content: 'test' }],
        model: 'llama-3.1-8b-instant',
        max_tokens: 5
      });
      return true;
    } else if (provider === 'gemini') {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const client = new GoogleGenerativeAI(apiKey);
      const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
      await model.generateContent('test');
      return true;
    }
  } catch (error) {
    return false;
  }
  return false;
}

async function main() {
  console.log(colorize('🚀 Weblify.AI Backend Setup', 'bold'));
  console.log(colorize('================================\n', 'cyan'));

  // Check if .env already exists
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const overwrite = await ask(colorize('⚠️  .env file already exists. Overwrite? (y/n): ', 'yellow'));
    if (overwrite.toLowerCase() !== 'y') {
      console.log(colorize('Setup cancelled.', 'yellow'));
      rl.close();
      return;
    }
  }

  console.log(colorize('📝 Let\'s configure your environment variables:\n', 'blue'));

  // Get API keys
  console.log(colorize('🔑 API Key Configuration', 'bold'));
  console.log('You need at least one API key. Both are free!');
  console.log('- Groq (Recommended): https://console.groq.com/keys');
  console.log('- Google Gemini: https://aistudio.google.com/app/apikey\n');

  const groqKey = await ask('Enter your Groq API key (or press Enter to skip): ');
  const geminiKey = await ask('Enter your Google Gemini API key (or press Enter to skip): ');

  if (!groqKey && !geminiKey) {
    console.log(colorize('❌ At least one API key is required!', 'red'));
    rl.close();
    return;
  }

  // Validate keys
  console.log(colorize('\n🔍 Validating API keys...', 'cyan'));

  const groqValid = groqKey ? await validateApiKey('groq', groqKey) : false;
  const geminiValid = geminiKey ? await validateApiKey('gemini', geminiKey) : false;

  if (groqValid) {
    console.log(colorize('✅ Groq API key is valid', 'green'));
  } else if (groqKey) {
    console.log(colorize('❌ Groq API key is invalid', 'red'));
  }

  if (geminiValid) {
    console.log(colorize('✅ Gemini API key is valid', 'green'));
  } else if (geminiKey) {
    console.log(colorize('❌ Gemini API key is invalid', 'red'));
  }

  if (!groqValid && !geminiValid) {
    console.log(colorize('❌ No valid API keys found. Please check your keys and try again.', 'red'));
    rl.close();
    return;
  }

  // Get other configurations
  const port = await ask('\nEnter server port (default: 3001): ') || '3001';
  const corsOrigin = await ask('Enter CORS origin (default: http://localhost:3000): ') || 'http://localhost:3000';
  const primaryProvider = groqValid ? 'groq' : 'gemini';
  const fallbackProvider = primaryProvider === 'groq' ? 'gemini' : 'groq';

  // Create .env file
  const envContent = `# Weblify.AI Backend Configuration
# Generated on ${new Date().toISOString()}

# Server Configuration
PORT=${port}
NODE_ENV=development

# AI Model API Keys
${groqKey ? `GROQ_API_KEY=${groqKey}` : '# GROQ_API_KEY=your_groq_api_key_here'}
${geminiKey ? `GOOGLE_API_KEY=${geminiKey}` : '# GOOGLE_API_KEY=your_google_api_key_here'}

# AI Provider Configuration
PRIMARY_AI_PROVIDER=${primaryProvider}
FALLBACK_AI_PROVIDER=${fallbackProvider}

# Model Settings
GROQ_MODEL=llama-3.1-70b-versatile
GROQ_MAX_TOKENS=4096
GROQ_TEMPERATURE=0.1

GEMINI_MODEL=gemini-1.5-flash
GEMINI_MAX_TOKENS=4096
GEMINI_TEMPERATURE=0.1

# Rate Limiting (requests per minute)
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=30

# CORS Settings
CORS_ORIGIN=${corsOrigin}

# Project Settings
MAX_PROJECT_SIZE_MB=50
MAX_FILES_PER_PROJECT=100
SESSION_TIMEOUT_HOURS=24

# Logging
LOG_LEVEL=info

# Cache Settings (in seconds)
CACHE_TTL=300
`;

  fs.writeFileSync(envPath, envContent);
  console.log(colorize('\n✅ Environment configuration saved to .env', 'green'));

  // Installation instructions
  console.log(colorize('\n🎉 Setup Complete!', 'bold'));
  console.log(colorize('==================\n', 'cyan'));
  
  console.log('Next steps:');
  console.log(`1. ${colorize('npm install', 'cyan')} - Install dependencies`);
  console.log(`2. ${colorize('npm run dev', 'cyan')} - Start development server`);
  console.log(`3. Visit ${colorize(`http://localhost:${port}/health`, 'blue')} to test\n`);

  console.log('API Endpoints:');
  console.log(`- Health: ${colorize(`http://localhost:${port}/health`, 'blue')}`);
  console.log(`- Generate: ${colorize(`http://localhost:${port}/api/ai/generate`, 'blue')}`);
  console.log(`- Projects: ${colorize(`http://localhost:${port}/api/projects`, 'blue')}`);

  console.log(colorize('\n📚 Check README.md for detailed API documentation', 'magenta'));

  rl.close();
}

main().catch((error) => {
  console.error(colorize('Setup failed:', 'red'), error.message);
  rl.close();
  process.exit(1);
});