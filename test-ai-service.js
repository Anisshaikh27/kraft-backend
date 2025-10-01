// Add this line at the very top to load environment variables
require('dotenv').config();

// Quick test file to diagnose the AI service
// Save as: test-ai-service.js in your backend directory

const GroqService = require('./services/groqService');
const GeminiService = require('./services/geminiService');

async function testAIServices() {
  console.log('🧪 Testing AI Services...\n');

  // Test Groq
  console.log('1. Testing Groq Service:');
  try {
    const groqService = new GroqService();
    const groqResponse = await groqService.generateCode(
      'Create a simple React button component with props',
      'react',
      {}
    );
    console.log('✅ Groq works! Response keys:', Object.keys(groqResponse));
    console.log('✅ Groq content preview:', groqResponse.choices?.[0]?.message?.content?.substring(0, 100) + '...');
  } catch (error) {
    console.log('❌ Groq failed:', error.message);
    console.log('   Check your GROQ_API_KEY in .env file');
    console.log('   Make sure you have the latest model name');
  }

  console.log('\n2. Testing Gemini Service:');
  try {
    const geminiService = new GeminiService();
    const geminiResponse = await geminiService.generateCode(
      'Create a simple React button component with props',
      'react', 
      {}
    );
    console.log('✅ Gemini works! Response keys:', Object.keys(geminiResponse));
    console.log('✅ Gemini content preview:', geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text?.substring(0, 100) + '...');
  } catch (error) {
    console.log('❌ Gemini failed:', error.message);
    console.log('   Check your GOOGLE_API_KEY in .env file');
    console.log('   Make sure the API key has Gemini access');
  }

  console.log('\n3. Environment Check:');
  console.log('GROQ_API_KEY present:', !!process.env.GROQ_API_KEY);
  console.log('GOOGLE_API_KEY present:', !!process.env.GOOGLE_API_KEY);
  console.log('PRIMARY_AI_PROVIDER:', process.env.PRIMARY_AI_PROVIDER || 'undefined');
  console.log('FALLBACK_AI_PROVIDER:', process.env.FALLBACK_AI_PROVIDER || 'undefined');
  
  // Show first few chars of keys for debugging (without exposing full keys)
  if (process.env.GROQ_API_KEY) {
    console.log('GROQ_API_KEY preview:', process.env.GROQ_API_KEY.substring(0, 10) + '...');
  }
  if (process.env.GOOGLE_API_KEY) {
    console.log('GOOGLE_API_KEY preview:', process.env.GOOGLE_API_KEY.substring(0, 10) + '...');
  }
}

// Run the test
testAIServices().catch(console.error);