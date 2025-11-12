/**
 * Sandpack Prompt Builder
 * Creates optimized prompts for generating React apps that work in Sandpack
 */

const sandpackPrompts = require('./sandpackPrompts');

class SandpackPromptBuilder {
  /**
   * Build a complete Sandpack-optimized prompt
   */
  static buildReactPrompt(userRequest) {
    const prompt = `${sandpackPrompts.getSandpackReactPrompt()}

USER REQUEST:
${userRequest}

REMEMBER: Follow ALL the rules above exactly. Generate a COMPLETE, working React app that runs in Sandpack.`;
    
    return prompt;
  }

  /**
   * Build a component-specific prompt
   */
  static buildComponentPrompt(componentDescription) {
    const prompt = `${sandpackPrompts.getSandpackComponentPrompt()}

Create this component: ${componentDescription}`;
    
    return prompt;
  }

  /**
   * Build a prompt with validation
   */
  static buildValidatedPrompt(userRequest, includeValidation = true) {
    let prompt = this.buildReactPrompt(userRequest);
    
    if (includeValidation) {
      prompt += `\n\n${sandpackPrompts.getSandpackValidationPrompt()}`;
      prompt += `\n\n${sandpackPrompts.getSandpackErrorRecoveryPrompt()}`;
      prompt += `\n\n${sandpackPrompts.getSandpackSimplificationPrompt()}`;
    }
    
    return prompt;
  }

  /**
   * Transform a generic request to a Sandpack-friendly request
   */
  static transformRequest(genericRequest) {
    const additions = [
      'Make sure it runs in Sandpack (browser-based editor).',
      'Use Tailwind CSS from CDN (https://cdn.tailwindcss.com).',
      'Only use React 18 with hooks.',
      'Include all necessary files: package.json, public/index.html, src/index.js, src/App.js.',
      'Keep it simple - no external dependencies except React and react-dom.',
      'Generate complete, working code that\'s ready to run.'
    ];

    return `${genericRequest}\n\nIMPORTANT:\n${additions.join('\n')}`;
  }

  /**
   * Get examples for different types of apps
   */
  static getExamples() {
    return {
      counter: `Create a simple counter app with increment/decrement buttons using React hooks and Tailwind CSS.`,
      
      todo: `Create a todo list app where users can add, complete, and delete todos using React hooks and Tailwind CSS styling.`,
      
      form: `Create a contact form with name, email, message fields that validates inputs and shows success/error messages.`,
      
      weather: `Create a weather display app that shows hardcoded weather data with temperature, humidity, and wind speed using Tailwind CSS.`,
      
      dashboard: `Create a dashboard with cards showing different metrics (users, revenue, orders) using React hooks and Tailwind CSS.`,
      
      gallery: `Create an image gallery that displays hardcoded images with lightbox functionality using React and Tailwind CSS.`,
      
      tabs: `Create a tabbed interface with multiple tabs that switch content when clicked using React hooks.`,
      
      modal: `Create a modal dialog that can be opened and closed with a button, showing form or content inside.`,
      
      pagination: `Create a paginated list showing 10 items per page with previous/next navigation using React hooks.`,
      
      animation: `Create animated cards or elements that fade in or slide in when the page loads using CSS and React.`
    };
  }

  /**
   * Validate request is suitable for Sandpack
   */
  static isSuitableForSandpack(request) {
    const unsuitable = [
      'backend',
      'database',
      'server',
      'api endpoint',
      'npm install',
      'build tool',
      'webpack',
      'babel',
      'native module',
      'canvas',
      'webgl'
    ].map(word => word.toLowerCase());

    const lower = request.toLowerCase();
    
    for (let word of unsuitable) {
      if (lower.includes(word)) {
        return {
          suitable: false,
          warning: `Request mentions '${word}' which may not work in Sandpack browser environment`
        };
      }
    }

    return { suitable: true, warning: null };
  }

  /**
   * Get recommendations for Sandpack
   */
  static getRecommendations() {
    return {
      do: [
        '✅ Use React hooks (useState, useEffect)',
        '✅ Use Tailwind CSS from CDN',
        '✅ Keep components simple and focused',
        '✅ Use hardcoded data or useState',
        '✅ Inline all styles with Tailwind classes',
        '✅ Use React.lazy for code splitting',
        '✅ Test in browser before deploying',
        '✅ Use semantic HTML'
      ],
      dont: [
        '❌ Don\'t use npm packages with native bindings',
        '❌ Don\'t use CSS files or styled-components',
        '❌ Don\'t use complex state management (Redux)',
        '❌ Don\'t use relative imports for components',
        '❌ Don\'t use WebGL or Canvas',
        '❌ Don\'t call external APIs directly',
        '❌ Don\'t use routing (React Router)',
        '❌ Don\'t create deeply nested components'
      ]
    };
  }
}

module.exports = SandpackPromptBuilder;
