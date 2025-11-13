/**
 * Sandpack Response Processor
 * Validates and fixes generated React code to ensure it works in Sandpack
 */

class SandpackResponseProcessor {
  /**
   * Process and validate AI response for Sandpack compatibility
   */
  static processResponse(content, provider = 'groq') {
    const files = this.extractFiles(content);
    
    // If no files extracted, try to create a minimal project
    if (files.length === 0) {
      return this.createMinimalProject(content);
    }

    // Validate and fix extracted files
    const validatedFiles = this.validateAndFixFiles(files);
    
    // Ensure essential files exist
    return this.ensureEssentialFiles(validatedFiles);
  }

  /**
   * Extract files from content using multiple patterns
   */
  static extractFiles(content) {
    const files = [];
    
    // Pattern 1: // filepath with ``` (supports root level files like package.json, public/*, src/*)
    const pattern1 = /\/\/\s*(?:src\/|public\/|)([\w\.\/-]+\.(jsx?|tsx?|css|html|json|md))\s*\n```[\w]*\n([\s\S]*?)```/gi;
    let match;

    while ((match = pattern1.exec(content)) !== null) {
      let filePath = match[1].trim();
      const fileContent = match[3].trim();

      // Ensure proper path prefix
      if (!filePath.startsWith('/')) {
        if (filePath === 'package.json' || filePath.startsWith('tailwind.')) {
          filePath = '/' + filePath;
        } else if (!filePath.startsWith('src/') && !filePath.startsWith('public/')) {
          filePath = '/src/' + filePath;
        } else {
          filePath = '/' + filePath;
        }
      }

      if (fileContent && filePath && fileContent.length > 5) {
        files.push({
          path: filePath,
          content: fileContent,
          language: this.getLanguageFromPath(filePath),
          operation: 'create'
        });
      }
    }

    // Pattern 2: ** filepath ** with ``` (supports all file types)
    if (files.length === 0) {
      const pattern2 = /\*\*(?:src\/|public\/|)?([\w\.\/-]+\.(jsx?|tsx?|css|html|json|md))\*\*\s*\n```[\w]*\n([\s\S]*?)```/gi;

      while ((match = pattern2.exec(content)) !== null) {
        let filePath = match[1].trim();
        const fileContent = match[3].trim();

        // Ensure proper path prefix
        if (!filePath.startsWith('/')) {
          if (filePath === 'package.json' || filePath.startsWith('tailwind.')) {
            filePath = '/' + filePath;
          } else if (!filePath.startsWith('src/') && !filePath.startsWith('public/')) {
            filePath = '/src/' + filePath;
          } else {
            filePath = '/' + filePath;
          }
        }

        if (fileContent && filePath && fileContent.length > 5) {
          files.push({
            path: filePath,
            content: fileContent,
            language: this.getLanguageFromPath(filePath),
            operation: 'create'
          });
        }
      }
    }

    // Pattern 3: Generic code blocks with smart path detection
    if (files.length === 0) {
      const pattern3 = /```(jsx?|tsx?|css|html|json)\n([\s\S]*?)```/gi;
      let fileIndex = 1;

      while ((match = pattern3.exec(content)) !== null) {
        const language = match[1];
        const fileContent = match[2].trim();

        if (fileContent && fileContent.length > 5) {
          const smartPath = this.generateSmartFilePath(fileContent, language, fileIndex);
          files.push({
            path: smartPath,
            content: fileContent,
            language: this.getLanguageFromPath(fileContent),
            operation: 'create'
          });
          fileIndex++;
        }
      }
    }

    return files;
  }

  /**
   * Validate and fix extracted files
   */
  static validateAndFixFiles(files) {
    return files.map(file => {
      let content = file.content;

      // Fix common issues
      content = this.fixReactImports(content, file.path);
      content = this.fixJSXSyntax(content);
      content = this.ensureProperExports(content, file.path);

      return {
        ...file,
        content: content
      };
    });
  }

  /**
   * Fix React imports
   */
  static fixReactImports(content, filePath) {
    // If it's a JSX/JS file without React import
    if ((filePath.includes('.jsx') || filePath.includes('.js')) && 
        content.includes('function ') && !content.includes('import React')) {
      if (content.includes('<')) {
        // Has JSX, add React import
        content = `import React from 'react';\n\n${content}`;
      }
    }

    // Ensure react-dom/client is used in index.js
    if (filePath.includes('index.js') && !content.includes('react-dom')) {
      if (!content.includes('ReactDOM.createRoot')) {
        content = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);`;
      }
    }

    return content;
  }

  /**
   * Fix common JSX syntax issues
   */
  static fixJSXSyntax(content) {
    // Fix: class -> className
    content = content.replace(/\sclass=/g, ' className=');
    
    // Fix: for -> htmlFor
    content = content.replace(/\sfor=/g, ' htmlFor=');

    // Ensure proper closing tags (basic fix)
    const openTags = (content.match(/<([a-zA-Z]+)[^>]*(?<!\/)]>/g) || []).length;
    const closeTags = (content.match(/<\/[a-zA-Z]+>/g) || []).length;
    
    // This is a basic check - complex JSX validation would need a full parser
    if (openTags !== closeTags) {
      console.warn('JSX tag mismatch detected - manual review recommended');
    }

    return content;
  }

  /**
   * Ensure proper exports
   */
  static ensureProperExports(content, filePath) {
    const isComponent = filePath.includes('.jsx') || 
                       (filePath.includes('.js') && !filePath.includes('index'));

    if (isComponent) {
      // If no export found, add default export
      if (!content.includes('export ')) {
        // Find the last function or const declaration
        if (content.includes('function ') || content.includes('const ')) {
          content = content + '\n\nexport default ' + this.extractComponentName(content) + ';';
        }
      }
    }

    return content;
  }

  /**
   * Extract component name from code
   */
  static extractComponentName(content) {
    // Try to find function declaration
    const funcMatch = content.match(/function\s+([A-Z][a-zA-Z0-9]*)/);
    if (funcMatch) return funcMatch[1];

    // Try to find const declaration
    const constMatch = content.match(/const\s+([A-Z][a-zA-Z0-9]*)\s*=/);
    if (constMatch) return constMatch[1];

    return 'Component';
  }

  /**
   * Generate smart file path based on content
   */
  static generateSmartFilePath(content, language, index) {
    const lower = content.toLowerCase();
    
    // Root level files
    if (lower.includes('"name":') && lower.includes('"dependencies":')) return '/package.json';
    if (lower.includes('<!doctype') || lower.includes('<html')) return '/public/index.html';
    if (lower.includes('tailwind') && language === 'js') return '/tailwind.config.js';
    
    // Source files
    if (content.includes('createRoot') || content.includes('ReactDOM')) return '/src/index.js';
    if (content.includes('export default function App') || 
        (content.includes('export default') && content.includes('return ('))) return '/src/App.js';
    
    // CSS files
    if (language === 'css' && lower.includes('@tailwind')) return '/src/index.css';
    if (language === 'css') return `/src/styles/style${index}.css`;
    
    // Components
    if (content.includes('function ') || content.includes('const ') || content.includes('import')) {
      return `/src/components/Component${index}.jsx`;
    }
    
    return `/src/file${index}.${language}`;
  }

  /**
   * Create minimal working project from raw content
   */
  static createMinimalProject(content) {
    const files = [];

    // Create package.json
    files.push({
      path: '/package.json',
      content: JSON.stringify({
        "name": "sandpack-app",
        "version": "1.0.0",
        "dependencies": {
          "react": "^18.2.0",
          "react-dom": "^18.2.0"
        }
      }, null, 2),
      language: 'json',
      operation: 'create'
    });

    // Create HTML
    files.push({
      path: '/public/index.html',
      content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"><\/script>
    <title>React App</title>
  </head>
  <body>
    <div id="root"><\/div>
  </body>
</html>`,
      language: 'html',
      operation: 'create'
    });

    // Create index.css
    files.push({
      path: '/src/index.css',
      content: `@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

html, body, #root {
  height: 100%;
  width: 100%;
}`,
      language: 'css',
      operation: 'create'
    });

    // Create index.js
    files.push({
      path: '/src/index.js',
      content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
      language: 'javascript',
      operation: 'create'
    });

    // Create App.js from content
    const appContent = this.sanitizeCodeContent(content);
    files.push({
      path: '/src/App.js',
      content: appContent,
      language: 'javascript',
      operation: 'create'
    });

    return files;
  }

  /**
   * Sanitize and wrap content as React component
   */
  static sanitizeCodeContent(content) {
    // Remove markdown code fences if present
    content = content.replace(/```[\w]*\n?/g, '').trim();

    // If it's not already a component, wrap it
    if (!content.includes('function ') && !content.includes('export ')) {
      return `import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">React App</h1>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <p className="text-lg text-gray-700">${content.substring(0, 100)}</p>
        </div>
      </div>
    </div>
  );
}`;
    }

    // Ensure React import
    if (!content.includes('import React')) {
      content = `import React from 'react';\n\n${content}`;
    }

    return content;
  }

  /**
   * Ensure essential files exist
   */
  static ensureEssentialFiles(files) {
    const hasPackageJson = files.some(f => f.path === '/package.json' || f.path === 'package.json');
    const hasHtml = files.some(f => f.path === '/public/index.html' || f.path === 'public/index.html');
    const hasIndex = files.some(f => f.path === '/src/index.js' || f.path === 'src/index.js' || 
                                      f.path === '/src/index.jsx' || f.path === 'src/index.jsx');
    const hasApp = files.some(f => f.path === '/src/App.js' || f.path === 'src/App.js' || 
                                   f.path === '/src/App.jsx' || f.path === 'src/App.jsx');
    const hasIndexCss = files.some(f => f.path === '/src/index.css' || f.path === 'src/index.css');

    // Normalize paths to start with /
    const normalizedFiles = files.map(f => ({
      ...f,
      path: f.path.startsWith('/') ? f.path : '/' + f.path
    }));

    if (!hasPackageJson) {
      normalizedFiles.push({
        path: '/package.json',
        content: JSON.stringify({
          "name": "sandpack-app",
          "version": "1.0.0",
          "dependencies": {
            "react": "^18.2.0",
            "react-dom": "^18.2.0"
          }
        }, null, 2),
        language: 'json',
        operation: 'create'
      });
    }

    if (!hasHtml) {
      normalizedFiles.push({
        path: '/public/index.html',
        content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"><\/script>
    <title>React App</title>
  </head>
  <body>
    <div id="root"><\/div>
  </body>
</html>`,
        language: 'html',
        operation: 'create'
      });
    }

    if (!hasIndex) {
      normalizedFiles.push({
        path: '/src/index.js',
        content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
        language: 'javascript',
        operation: 'create'
      });
    }

    if (!hasApp) {
      normalizedFiles.push({
        path: '/src/App.js',
        content: `import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Your React App</h1>
        <p className="text-lg text-gray-700">Start editing to see your app live!</p>
      </div>
    </div>
  );
}`,
        language: 'javascript',
        operation: 'create'
      });
    }

    if (!hasIndexCss) {
      normalizedFiles.push({
        path: '/src/index.css',
        content: `@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

html, body, #root {
  height: 100%;
  width: 100%;
}`,
        language: 'css',
        operation: 'create'
      });
    }

    return normalizedFiles;
  }

  /**
   * Get language from file path
   */
  static getLanguageFromPath(filePath) {
    const ext = filePath.split('.').pop().toLowerCase();
    const map = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      css: 'css',
      html: 'html',
      json: 'json',
      md: 'markdown'
    };
    return map[ext] || 'javascript';
  }
}

module.exports = SandpackResponseProcessor;
