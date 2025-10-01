// Add this line at the very top to load environment variables
require('dotenv').config();

const GroqService = require('./services/groqService');
const GeminiService = require('./services/geminiService');

async function debugGroqResponse() {
  console.log('🔍 Debugging Groq Response Structure...\n');

  try {
    const groqService = new GroqService();
    const groqResponse = await groqService.generateCode(
      'Create a simple React button component',
      'react',
      {}
    );

    console.log('=== FULL GROQ RESPONSE ===');
    console.log(JSON.stringify(groqResponse, null, 2));
    console.log('===========================\n');

    console.log('Response type:', typeof groqResponse);
    console.log('Response keys:', Object.keys(groqResponse || {}));

    // Check different possible content locations
    if (groqResponse.content) {
      console.log('✅ Found content in: groqResponse.content');
      console.log('Content preview:', groqResponse.content.substring(0, 100) + '...');
    }
    
    if (groqResponse.choices) {
      console.log('✅ Found choices array:', groqResponse.choices.length, 'choices');
      if (groqResponse.choices[0]) {
        console.log('Choice 0 keys:', Object.keys(groqResponse.choices[0]));
        if (groqResponse.choices[0].message) {
          console.log('Message keys:', Object.keys(groqResponse.choices[0].message));
          console.log('Message content:', groqResponse.choices[0].message.content?.substring(0, 100) + '...');
        }
      }
    }

    if (groqResponse.data) {
      console.log('✅ Found data object');
      console.log('Data keys:', Object.keys(groqResponse.data));
    }

  } catch (error) {
    console.log('❌ Groq test failed:', error.message);
  }
}

async function testCorrectGeminiModel() {
  console.log('\n🔍 Testing Correct Gemini Models...\n');
  
  const modelsToTry = [
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-pro'
  ];

  for (const model of modelsToTry) {
    console.log(`Testing model: ${model}`);
    try {
      // Temporarily override the model
      process.env.GEMINI_MODEL = model;
      
      const geminiService = new GeminiService();
      const geminiResponse = await geminiService.generateCode(
        'Create a simple React button',
        'react',
        {}
      );
      
      console.log(`✅ ${model} works!`);
      console.log('Response keys:', Object.keys(geminiResponse));
      
      if (geminiResponse.candidates && geminiResponse.candidates[0]) {
        const content = geminiResponse.candidates[0].content?.parts?.[0]?.text;
        console.log('Content preview:', content?.substring(0, 100) + '...');
      }
      
      break; // If successful, stop trying other models
      
    } catch (error) {
      console.log(`❌ ${model} failed:`, error.message.substring(0, 100) + '...');
    }
  }
}

async function runAllTests() {
  await debugGroqResponse();
  await testCorrectGeminiModel();
  
  console.log('\n🎯 Summary:');
  console.log('Environment variables loaded:', !!process.env.GROQ_API_KEY && !!process.env.GOOGLE_API_KEY);
  console.log('Current Groq model:', process.env.GROQ_MODEL || 'default');
  console.log('Current Gemini model:', process.env.GEMINI_MODEL || 'default');
}

runAllTests().catch(console.error);