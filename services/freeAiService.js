// services/freeAiService.js - Fixed with correct model names and fallback
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import { logger } from '../utils/logger.js';

class FreeAIService {
  constructor() {
    this.models = null;
    this.initialized = false;
  }

  ensureInitialized() {
    if (!this.initialized) {
      console.log('🔍 Initializing AI models (lazy initialization)...');
      console.log('🔍 Environment check:', {
        hasGoogleKey: !!process.env.GOOGLE_API_KEY,
        hasGroqKey: !!process.env.GROQ_API_KEY,
        googleKeyLength: process.env.GOOGLE_API_KEY ? process.env.GOOGLE_API_KEY.length : 0,
        groqKeyLength: process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.length : 0
      });
      
      this.models = this.initializeModels();
      this.initialized = true;
    }
    return this.models;
  }

  initializeModels() {
    const models = {};
    
    try {
      // Google Gemini with correct model names
      if (process.env.GOOGLE_API_KEY) {
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        
        // Try different model names that are known to work
        const modelNames = [
          'gemini-pro',           // Standard model
          'gemini-1.5-pro-latest', // Latest version
          'gemini-1.0-pro',      // Stable version
          'text-bison-001'       // Fallback
        ];
        
        // Use the first available model
        models.gemini = genAI.getGenerativeModel({ model: modelNames[0] });
        models.geminiPro = genAI.getGenerativeModel({ model: modelNames[0] });
        
        console.log('✅ Google Gemini models initialized (direct API) with model:', modelNames[0]);
        logger.info('✅ Google Gemini models initialized');
      } else {
        console.log('❌ GOOGLE_API_KEY not found');
      }

      // Groq (This should work)
      if (process.env.GROQ_API_KEY) {
        models.groq = new Groq({
          apiKey: process.env.GROQ_API_KEY,
        });
        console.log('✅ Groq model initialized');
        logger.info('✅ Groq model initialized');
      } else {
        console.log('❌ GROQ_API_KEY not found');
      }

    } catch (error) {
      console.error('❌ Error initializing AI models:', error);
      logger.error('Error initializing AI models:', error);
    }

    console.log('🔍 Models initialized (lazy):', Object.keys(models));
    return models;
  }

  // Updated generateReactApp with better error handling and Groq fallback
  async generateReactApp(appDescription, features = [], preferredModel = 'gemini') {
    const models = this.ensureInitialized();
    
    console.log('🔍 Starting React app generation:', {
      description: appDescription,
      features: features,
      model: preferredModel,
      hasGemini: !!models.gemini,
      hasGeminiPro: !!models.geminiPro,
      hasGroq: !!models.groq,
      modelCount: Object.keys(models).length
    });

    if (Object.keys(models).length === 0) {
      console.log('⚠️ No AI models available, using fallback');
      return this.createFallbackResponse(appDescription, features);
    }

    try {
      let result;
      
      const prompt = `You are an expert React developer. Create a complete React application for: ${appDescription}

Features to include: ${Array.isArray(features) ? features.join(', ') : features}

Requirements:
- Use React 18+ with functional components and hooks
- Style with Tailwind CSS (include CDN in HTML)
- Make it responsive and modern
- Include interactive elements and state management
- Add proper component structure

Return a complete working React application code. Include imports and make sure it's production-ready.

Focus on creating a functional, well-structured application that works out of the box.`;
      
      // Try Groq first (more reliable)
      if (models.groq) {
        console.log('🔍 Using Groq for generation (more reliable)...');
        try {
          const completion = await models.groq.chat.completions.create({
            messages: [
              {
                role: "system",
                content: "You are an expert React developer. Create clean, modern, production-ready React applications."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            model: "llama-3.1-70b-versatile",
            temperature: 0.3,
            max_tokens: 3000, // Increased for larger responses
          });
          
          result = completion.choices[0]?.message?.content || '';
          console.log('✅ Groq API response received:', {
            length: result.length,
            preview: result.substring(0, 200) + '...'
          });
          
          return this.processAIResponse(result, appDescription, 'groq');
          
        } catch (groqError) {
          console.error('❌ Groq failed, trying Gemini:', groqError.message);
        }
      }
      
      // Try Gemini if Groq fails or isn't available
      if (models.gemini) {
        console.log('🔍 Using Gemini for generation...');
        try {
          const response = await models.gemini.generateContent(prompt);
          result = response.response.text();
          
          console.log('✅ Gemini API response received:', {
            length: result ? result.length : 0,
            preview: result ? result.substring(0, 200) + '...' : 'NO CONTENT'
          });
          
          return this.processAIResponse(result, appDescription, 'gemini');
          
        } catch (geminiError) {
          console.error('❌ Gemini failed:', geminiError.message);
          throw geminiError;
        }
      }
      
      throw new Error('No AI models available');

    } catch (error) {
      console.error('❌ App generation error:', error);
      console.log('🔄 Using enhanced fallback response');
      return this.createEnhancedFallbackResponse(appDescription, features);
    }
  }

  processAIResponse(result, appDescription, model) {
    if (!result) {
      return this.createFallbackResponse(appDescription, []);
    }

    // Extract React code from the response
    const extractedCode = this.simpleExtractCode(result);
    
    // If we got good code, use it; otherwise create a smart fallback
    const finalCode = extractedCode && extractedCode.length > 100 
      ? extractedCode 
      : this.createSmartFallbackApp(appDescription, result);

    const parsedResult = {
      files: [
        {
          name: 'App.js',
          path: 'src/App.js',
          content: finalCode
        },
        {
          name: 'package.json',
          path: 'package.json',
          content: JSON.stringify({
            "name": appDescription.toLowerCase().replace(/\s+/g, '-'),
            "version": "1.0.0",
            "private": true,
            "dependencies": {
              "react": "^18.2.0",
              "react-dom": "^18.2.0",
              "react-scripts": "5.0.1"
            },
            "scripts": {
              "start": "react-scripts start",
              "build": "react-scripts build",
              "test": "react-scripts test"
            }
          }, null, 2)
        },
        {
          name: 'index.html',
          path: 'public/index.html',
          content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${appDescription}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="root"></div>
</body>
</html>`
        }
      ],
      dependencies: ['react', 'react-dom', 'react-scripts'],
      scripts: {
        start: 'react-scripts start',
        build: 'react-scripts build'
      }
    };

    return {
      success: true,
      app: parsedResult,
      rawResponse: result,
      model: model
    };
  }

  createEnhancedFallbackResponse(appDescription, features) {
    console.log('🎨 Creating enhanced fallback for:', appDescription);
    
    const isEcommerce = appDescription.toLowerCase().includes('store') || 
                       appDescription.toLowerCase().includes('shop') || 
                       appDescription.toLowerCase().includes('cart');
    
    const isPortfolio = appDescription.toLowerCase().includes('portfolio');
    
    let appCode;
    
    if (isEcommerce) {
      appCode = this.createEcommerceApp(appDescription);
    } else if (isPortfolio) {
      appCode = this.createPortfolioApp(appDescription);
    } else {
      appCode = this.createGenericApp(appDescription, features);
    }
    
    return {
      success: true,
      app: {
        files: [
          {
            name: 'App.js',
            path: 'src/App.js',
            content: appCode
          },
          {
            name: 'package.json',
            path: 'package.json',
            content: JSON.stringify({
              "name": appDescription.toLowerCase().replace(/\s+/g, '-'),
              "version": "1.0.0",
              "private": true,
              "dependencies": {
                "react": "^18.2.0",
                "react-dom": "^18.2.0",
                "react-scripts": "5.0.1"
              },
              "scripts": {
                "start": "react-scripts start",
                "build": "react-scripts build"
              }
            }, null, 2)
          }
        ]
      },
      model: 'enhanced-fallback'
    };
  }

  createEcommerceApp(description) {
    return `import React, { useState } from 'react';

function App() {
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const products = [
    { id: 1, name: 'Fresh Apples', price: 4.99, category: 'fruits', image: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=200' },
    { id: 2, name: 'Organic Bread', price: 3.49, category: 'bakery', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200' },
    { id: 3, name: 'Fresh Milk', price: 2.99, category: 'dairy', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200' },
    { id: 4, name: 'Bananas', price: 2.49, category: 'fruits', image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=200' },
    { id: 5, name: 'Cheese', price: 5.99, category: 'dairy', image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=200' },
    { id: 6, name: 'Croissants', price: 4.49, category: 'bakery', image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=200' }
  ];

  const categories = ['all', 'fruits', 'dairy', 'bakery'];

  const addToCart = (product) => {
    setCart([...cart, { ...product, cartId: Date.now() }]);
  };

  const removeFromCart = (cartId) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold">${description}</h1>
          <div className="flex items-center space-x-4">
            <span className="text-lg">🛒 {cart.length} items</span>
            <span className="text-lg font-semibold">$\{totalPrice.toFixed(2)}</span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6 grid md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <h3 className="font-semibold text-lg mb-4">Categories</h3>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={\`w-full text-left p-2 rounded mb-2 transition-colors \${
                  selectedCategory === cat 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }\`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          {/* Cart */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <h3 className="font-semibold text-lg mb-4">Shopping Cart</h3>
            {cart.length === 0 ? (
              <p className="text-gray-500">Cart is empty</p>
            ) : (
              <div className="space-y-2">
                {cart.map(item => (
                  <div key={item.cartId} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm">{item.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold">$\{item.price}</span>
                      <button
                        onClick={() => removeFromCart(item.cartId)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between items-center font-bold">
                    <span>Total:</span>
                    <span>$\{totalPrice.toFixed(2)}</span>
                  </div>
                  <button className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded mt-2 transition-colors">
                    Checkout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Products Grid */}
        <div className="md:col-span-3">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">
            {selectedCategory === 'all' ? 'All Products' : selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-blue-600">$\{product.price}</span>
                    <button
                      onClick={() => addToCart(product)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;`;
  }

  createPortfolioApp(description) {
    return `import React, { useState } from 'react';

function App() {
  const [activeSection, setActiveSection] = useState('home');

  const projects = [
    { id: 1, title: 'E-commerce Website', tech: 'React, Node.js', image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300' },
    { id: 2, title: 'Mobile App Design', tech: 'React Native, UI/UX', image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=300' },
    { id: 3, title: 'Dashboard Analytics', tech: 'Vue.js, D3.js', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-black/20 backdrop-blur-md z-50 p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Portfolio</h1>
          <div className="space-x-6">
            {['home', 'about', 'projects', 'contact'].map(section => (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                className={\`hover:text-blue-400 transition-colors \${
                  activeSection === section ? 'text-blue-400 border-b-2 border-blue-400' : ''
                }\`}
              >
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      {activeSection === 'home' && (
        <section className="pt-20 min-h-screen flex items-center justify-center">
          <div className="text-center max-w-4xl mx-auto p-8">
            <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              John Developer
            </h1>
            <p className="text-2xl mb-8 text-gray-300">Full Stack Developer & UI/UX Designer</p>
            <p className="text-lg mb-8 text-gray-400 max-w-2xl mx-auto">
              Creating beautiful, functional, and user-centered digital experiences with modern technologies.
            </p>
            <div className="flex justify-center space-x-4">
              <button 
                onClick={() => setActiveSection('projects')}
                className="bg-blue-500 hover:bg-blue-600 px-8 py-3 rounded-full font-semibold transition-all transform hover:scale-105"
              >
                View My Work
              </button>
              <button 
                onClick={() => setActiveSection('contact')}
                className="border border-white/30 hover:bg-white/10 px-8 py-3 rounded-full font-semibold transition-all"
              >
                Get In Touch
              </button>
            </div>
          </div>
        </section>
      )}

      {/* About Section */}
      {activeSection === 'about' && (
        <section className="pt-20 min-h-screen p-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl font-bold mb-12 text-center">About Me</h2>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400" 
                  alt="Developer" 
                  className="rounded-lg shadow-2xl"
                />
              </div>
              <div className="space-y-6">
                <p className="text-lg text-gray-300">
                  I'm a passionate full-stack developer with 5+ years of experience creating digital solutions that make a difference.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <h4 className="font-semibold text-blue-400">Frontend</h4>
                    <p className="text-sm">React, Vue, Angular</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <h4 className="font-semibold text-green-400">Backend</h4>
                    <p className="text-sm">Node.js, Python, PHP</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <h4 className="font-semibold text-purple-400">Database</h4>
                    <p className="text-sm">MongoDB, PostgreSQL</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <h4 className="font-semibold text-pink-400">Design</h4>
                    <p className="text-sm">Figma, Adobe Suite</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Projects Section */}
      {activeSection === 'projects' && (
        <section className="pt-20 min-h-screen p-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-5xl font-bold mb-12 text-center">My Projects</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {projects.map(project => (
                <div key={project.id} className="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden hover:transform hover:scale-105 transition-all duration-300">
                  <img 
                    src={project.image} 
                    alt={project.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{project.title}</h3>
                    <p className="text-blue-400 mb-4">{project.tech}</p>
                    <button className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded transition-colors">
                      View Project
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      {activeSection === 'contact' && (
        <section className="pt-20 min-h-screen p-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-5xl font-bold mb-12">Get In Touch</h2>
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <div className="text-3xl mb-4">📧</div>
                <h3 className="font-semibold mb-2">Email</h3>
                <p className="text-blue-400">john@developer.com</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <div className="text-3xl mb-4">📱</div>
                <h3 className="font-semibold mb-2">Phone</h3>
                <p className="text-blue-400">+1 (555) 123-4567</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <div className="text-3xl mb-4">📍</div>
                <h3 className="font-semibold mb-2">Location</h3>
                <p className="text-blue-400">San Francisco, CA</p>
              </div>
            </div>
            <div className="flex justify-center space-x-6">
              <a href="#" className="text-blue-400 hover:text-blue-300 text-2xl">LinkedIn</a>
              <a href="#" className="text-blue-400 hover:text-blue-300 text-2xl">GitHub</a>
              <a href="#" className="text-blue-400 hover:text-blue-300 text-2xl">Twitter</a>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default App;`;
  }

  createGenericApp(description, features) {
    return `import React, { useState, useEffect } from 'react';

function App() {
  const [count, setCount] = useState(0);
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');

  useEffect(() => {
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
      setTodos(JSON.parse(savedTodos));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const addTodo = () => {
    if (newTodo.trim()) {
      setTodos([...todos, { id: Date.now(), text: newTodo, completed: false }]);
      setNewTodo('');
    }
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-2xl">
            ${description}
          </h1>
          <p className="text-xl text-white/80">Generated with Kraft AI Code Builder</p>
          ${features && features.length > 0 ? `
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            ${features.map(feature => `
            <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
              ${feature}
            </span>
            `).join('')}
          </div>
          ` : ''}
        </header>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Counter Section */}
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">Interactive Counter</h2>
            <div className="text-center">
              <div className="text-8xl font-bold text-white mb-8 font-mono">{count}</div>
              <div className="flex flex-wrap justify-center gap-4">
                <button 
                  onClick={() => setCount(count - 10)}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg"
                >
                  -10
                </button>
                <button 
                  onClick={() => setCount(count - 1)}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg"
                >
                  -1
                </button>
                <button 
                  onClick={() => setCount(0)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg"
                >
                  Reset
                </button>
                <button 
                  onClick={() => setCount(count + 1)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg"
                >
                  +1
                </button>
                <button 
                  onClick={() => setCount(count + 10)}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg"
                >
                  +10
                </button>
              </div>
            </div>
          </div>

          {/* Todo List Section */}
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">Todo List</h2>
            <div className="mb-4 flex gap-2">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                placeholder="Add a new task..."
                className="flex-1 px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm text-white placeholder-white/70 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <button
                onClick={addTodo}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Add
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {todos.length === 0 ? (
                <p className="text-white/70 text-center py-8">No tasks yet. Add one above!</p>
              ) : (
                todos.map(todo => (
                  <div 
                    key={todo.id} 
                    className={\`flex items-center gap-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm transition-all \${
                      todo.completed ? 'opacity-50' : ''
                    }\`}
                  >
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => toggleTodo(todo.id)}
                      className="w-5 h-5 rounded"
                    />
                    <span className={\`flex-1 text-white \${
                      todo.completed ? 'line-through' : ''
                    }\`}>
                      {todo.text}
                    </span>
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="text-red-400 hover:text-red-300 font-bold text-xl"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
            {todos.length > 0 && (
              <div className="mt-4 text-center text-white/70">
                {todos.filter(t => !t.completed).length} of {todos.length} tasks remaining
              </div>
            )}
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center">
            <div className="text-4xl mb-3">🚀</div>
            <h3 className="text-lg font-semibold text-white mb-2">Modern React</h3>
            <p className="text-white/80 text-sm">Built with React 18+ hooks and modern patterns</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center">
            <div className="text-4xl mb-3">🎨</div>
            <h3 className="text-lg font-semibold text-white mb-2">Beautiful UI</h3>
            <p className="text-white/80 text-sm">Styled with Tailwind CSS and glass morphism</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center">
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="text-lg font-semibold text-white mb-2">Interactive</h3>
            <p className="text-white/80 text-sm">Full state management and local storage</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center">
            <div className="text-4xl mb-3">📱</div>
            <h3 className="text-lg font-semibold text-white mb-2">Responsive</h3>
            <p className="text-white/80 text-sm">Mobile-first design that works everywhere</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;`;
  }

  createSmartFallbackApp(description, aiResponse) {
    // Try to extract any useful information from the AI response
    const hasCode = aiResponse && (aiResponse.includes('function') || aiResponse.includes('const') || aiResponse.includes('return'));
    
    if (hasCode) {
      return this.simpleExtractCode(aiResponse) || this.createGenericApp(description, []);
    }
    
    return this.createGenericApp(description, []);
  }

  createFallbackResponse(appDescription, features) {
    return this.createEnhancedFallbackResponse(appDescription, features);
  }

  simpleExtractCode(response) {
    if (!response) return '';
    
    let code = response;
    const patterns = [
      { start: '``````' },
      { start: '``````' },
      { start: '``````' },
      { start: '``````' }
    ];

    for (const pattern of patterns) {
      if (code.includes(pattern.start)) {
        const startIndex = code.indexOf(pattern.start) + pattern.start.length;
        const endIndex = code.indexOf(pattern.end, startIndex);
        
        if (endIndex !== -1) {
          code = code.substring(startIndex, endIndex).trim();
          break;
        }
      }
    }

    return code.trim();
  }

  getAvailableModels() {
    const models = this.ensureInitialized();
    return Object.keys(models).map(name => ({
      name,
      status: 'active',
      provider: name === 'groq' ? 'Groq' : 'Google'
    }));
  }

  async healthCheck() {
    const models = this.ensureInitialized();
    return {
      gemini: !!models.gemini,
      groq: !!models.groq, 
      totalAvailable: Object.keys(models).length,
      timestamp: new Date().toISOString()
    };
  }
}

export default new FreeAIService();
