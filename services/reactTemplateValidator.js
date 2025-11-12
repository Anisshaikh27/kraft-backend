/**
 * React Template Validator
 * Validates that LLM responses contain executable React templates
 * Checks file structure, imports, syntax, and completeness
 */

class ReactTemplateValidator {
  /**
   * Main validation method - returns detailed report
   */
  static validate(files) {
    const report = {
      isValid: false,
      errors: [],
      warnings: [],
      fixedFiles: files,
      score: 0,
      issues: {},
      recommendations: []
    };

    if (!files || files.length === 0) {
      report.errors.push('No files provided');
      return report;
    }

    // Check essential files
    const essentialCheck = this.checkEssentialFiles(files);
    report.issues.essential = essentialCheck;
    if (!essentialCheck.allPresent) {
      report.errors.push(...essentialCheck.missing.map(f => `Missing essential file: ${f}`));
    }

    // Check file completeness (not partial)
    const completenessCheck = this.checkFileCompleteness(files);
    report.issues.completeness = completenessCheck;
    if (!completenessCheck.allComplete) {
      report.errors.push(...completenessCheck.incompleteFiles.map(f => `Incomplete file: ${f}`));
    }

    // Check React syntax and imports
    const syntaxCheck = this.checkReactSyntax(files);
    report.issues.syntax = syntaxCheck;
    if (syntaxCheck.errors.length > 0) {
      report.errors.push(...syntaxCheck.errors.map(e => `Syntax error in ${e.file}: ${e.message}`));
    }
    if (syntaxCheck.warnings.length > 0) {
      report.warnings.push(...syntaxCheck.warnings.map(w => `Syntax warning in ${w.file}: ${w.message}`));
    }

    // Check dependencies in package.json
    const dependencyCheck = this.checkDependencies(files);
    report.issues.dependencies = dependencyCheck;
    if (!dependencyCheck.hasReact || !dependencyCheck.hasReactDom) {
      report.errors.push('Missing React or React-DOM in dependencies');
    }

    // Check file linkage and exports
    const linkageCheck = this.checkFileLinkage(files);
    report.issues.linkage = linkageCheck;
    if (linkageCheck.errors.length > 0) {
      report.errors.push(...linkageCheck.errors.map(e => `Linkage error: ${e}`));
    }
    if (linkageCheck.warnings.length > 0) {
      report.warnings.push(...linkageCheck.warnings.map(w => `Linkage warning: ${w}`));
    }

    // Calculate score
    report.score = this.calculateScore(report.issues);

    // Fix issues if possible
    if (report.errors.length > 0) {
      const fixed = this.autoFixIssues(files, report.issues);
      report.fixedFiles = fixed.files;
      report.recommendations.push(...fixed.recommendations);
      report.isValid = report.errors.length === 0; // Check again after fixes
    } else {
      report.isValid = true;
    }

    return report;
  }

  /**
   * Check if all essential React files are present
   */
  static checkEssentialFiles(files) {
    const required = [
      { name: 'package.json', path: 'package.json', critical: true },
      { name: 'public/index.html', path: 'public/index.html', critical: true },
      { name: 'src/index.js', path: 'src/index.js', critical: true },
      { name: 'src/App.js', path: 'src/App.js', critical: true }
    ];

    const filePaths = files.map(f => f.path);
    const missing = [];

    required.forEach(req => {
      const exists = filePaths.some(p => p === req.path || p.endsWith(req.name));
      if (!exists && req.critical) {
        missing.push(req.name);
      }
    });

    return {
      allPresent: missing.length === 0,
      missing,
      found: required.length - missing.length,
      total: required.length
    };
  }

  /**
   * Check if files have complete content (not partial/truncated)
   */
  static checkFileCompleteness(files) {
    const incompleteFiles = [];
    const issues = [];

    files.forEach(file => {
      if (!file.content || typeof file.content !== 'string') {
        incompleteFiles.push(file.path);
        issues.push(`${file.path}: Missing or invalid content`);
        return;
      }

      const content = file.content.trim();
      
      // Check for incomplete markers
      if (content.endsWith('...') || content.endsWith('/* ... */') || 
          content.endsWith('// ...') || content.length < 10) {
        incompleteFiles.push(file.path);
        issues.push(`${file.path}: Content appears incomplete or too short`);
      }

      // Check for unclosed braces/brackets/parentheses
      if (file.path.endsWith('.js') || file.path.endsWith('.jsx')) {
        const braceCount = {
          '{': (content.match(/{/g) || []).length - (content.match(/}/g) || []).length,
          '[': (content.match(/\[/g) || []).length - (content.match(/\]/g) || []).length,
          '(': (content.match(/\(/g) || []).length - (content.match(/\)/g) || []).length
        };

        if (braceCount['{'] !== 0 || braceCount['['] !== 0 || braceCount['('] !== 0) {
          incompleteFiles.push(file.path);
          issues.push(`${file.path}: Unmatched braces/brackets/parentheses`);
        }
      }
    });

    return {
      allComplete: incompleteFiles.length === 0,
      incompleteFiles,
      issues,
      completeCount: files.length - incompleteFiles.length,
      totalCount: files.length
    };
  }

  /**
   * Check React syntax validity
   */
  static checkReactSyntax(files) {
    const errors = [];
    const warnings = [];

    files.forEach(file => {
      const content = file.content || '';

      if (file.path.endsWith('.jsx') || file.path.endsWith('.js')) {
        // Check for JSX without React import
        if (content.includes('<') && content.includes('>') && !content.match(/import.*React/)) {
          warnings.push({
            file: file.path,
            message: 'JSX detected but React not imported'
          });
        }

        // Check for invalid className/htmlFor usage
        if (content.includes('class=') && !content.includes('className=')) {
          warnings.push({
            file: file.path,
            message: 'Using "class" instead of "className"'
          });
        }

        // Check for proper export statements
        if (!content.includes('export') && 
            (file.path.includes('App') || file.path.includes('components'))) {
          warnings.push({
            file: file.path,
            message: 'Component file missing export statement'
          });
        }

        // Check for obvious syntax errors
        const syntaxIssues = this.detectSyntaxErrors(content);
        if (syntaxIssues.length > 0) {
          errors.push({
            file: file.path,
            message: syntaxIssues.join(', ')
          });
        }
      }

      if (file.path === 'package.json') {
        try {
          JSON.parse(content);
        } catch (e) {
          errors.push({
            file: file.path,
            message: 'Invalid JSON syntax'
          });
        }
      }

      if (file.path.endsWith('.html')) {
        if (!content.includes('</html>')) {
          errors.push({
            file: file.path,
            message: 'HTML not properly closed'
          });
        }
        if (!content.includes('id="root"')) {
          warnings.push({
            file: file.path,
            message: 'Missing root div element'
          });
        }
      }
    });

    return { errors, warnings };
  }

  /**
   * Detect obvious syntax errors
   */
  static detectSyntaxErrors(content) {
    const errors = [];

    // Check for common syntax patterns
    if (content.match(/function\s+\w+\s*\(/)) {
      // Function declaration found
      if (!content.match(/\}\s*$/)) {
        if (content.split('{').length > content.split('}').length) {
          errors.push('Unclosed function body');
        }
      }
    }

    // Check for arrow function syntax
    if (content.includes('=>') && !content.includes('function')) {
      if (content.split('(').length !== content.split(')').length) {
        errors.push('Arrow function has unmatched parentheses');
      }
    }

    // Check for missing return statements in JSX
    if (content.includes('export default') && content.includes('<') &&
        !content.includes('return')) {
      errors.push('JSX component without return statement');
    }

    return errors;
  }

  /**
   * Check React dependencies
   */
  static checkDependencies(files) {
    const packageJsonFile = files.find(f => f.path === 'package.json');
    
    if (!packageJsonFile) {
      return {
        hasReact: false,
        hasReactDom: false,
        hasReactScripts: false,
        valid: false,
        issues: ['package.json not found']
      };
    }

    try {
      const pkg = JSON.parse(packageJsonFile.content);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      return {
        hasReact: !!deps.react,
        hasReactDom: !!deps['react-dom'],
        hasReactScripts: !!deps['react-scripts'],
        dependencies: Object.keys(deps),
        valid: !!deps.react && !!deps['react-dom'],
        version: {
          react: deps.react || 'missing',
          reactDom: deps['react-dom'] || 'missing'
        }
      };
    } catch (e) {
      return {
        hasReact: false,
        hasReactDom: false,
        valid: false,
        issues: ['Invalid package.json JSON']
      };
    }
  }

  /**
   * Check if files are properly linked and have exports
   */
  static checkFileLinkage(files) {
    const errors = [];
    const warnings = [];

    // Find App.js and check for imports
    const appFile = files.find(f => f.path.endsWith('App.js') || f.path.endsWith('App.jsx'));
    if (appFile) {
      const content = appFile.content || '';
      
      // App should export default
      if (!content.includes('export default')) {
        errors.push('App.js must have export default');
      }

      // App should render something
      if (!content.includes('return') && !content.includes('render')) {
        errors.push('App.js must return JSX');
      }
    }

    // Find index.js and check for proper React initialization
    const indexFile = files.find(f => f.path === 'src/index.js');
    if (indexFile) {
      const content = indexFile.content || '';
      
      if (!content.includes('ReactDOM.createRoot')) {
        errors.push('index.js must use ReactDOM.createRoot (React 18)');
      }

      if (!content.includes('App')) {
        warnings.push('index.js should import App component');
      }

      if (!content.includes('document.getElementById')) {
        errors.push('index.js must target root element');
      }
    }

    // Check for circular dependencies or missing imports
    files.forEach(file => {
      if ((file.path.endsWith('.js') || file.path.endsWith('.jsx')) && 
          file.path !== 'src/index.js') {
        const content = file.content || '';
        const imports = content.match(/import\s+.*from\s+['"](.*?)['"]/g) || [];

        imports.forEach(imp => {
          const importPath = imp.match(/from\s+['"](.*?)['"]/)[1];
          
          // Check for non-existent imports
          if (!importPath.startsWith('react') && !importPath.startsWith('.')) {
            warnings.push(`${file.path}: Import from external package "${importPath}"`);
          }
        });
      }
    });

    return { errors, warnings };
  }

  /**
   * Calculate validation score (0-100)
   */
  static calculateScore(issues) {
    let score = 100;

    // Deduct for missing essential files
    if (issues.essential && !issues.essential.allPresent) {
      score -= issues.essential.missing.length * 15;
    }

    // Deduct for incomplete files
    if (issues.completeness && !issues.completeness.allComplete) {
      score -= issues.completeness.incompleteFiles.length * 10;
    }

    // Deduct for syntax errors
    if (issues.syntax && issues.syntax.errors.length > 0) {
      score -= issues.syntax.errors.length * 5;
    }

    // Deduct for dependency issues
    if (issues.dependencies && !issues.dependencies.valid) {
      score -= 20;
    }

    // Deduct for linkage errors
    if (issues.linkage && issues.linkage.errors.length > 0) {
      score -= issues.linkage.errors.length * 8;
    }

    return Math.max(0, score);
  }

  /**
   * Auto-fix common issues
   */
  static autoFixIssues(files, issues) {
    const fixedFiles = [...files];
    const recommendations = [];

    // Fix missing essential files
    if (issues.essential && !issues.essential.allPresent) {
      issues.essential.missing.forEach(missing => {
        if (missing === 'package.json') {
          fixedFiles.push({
            path: 'package.json',
            content: JSON.stringify({
              name: 'react-app',
              version: '1.0.0',
              dependencies: {
                react: '^18.2.0',
                'react-dom': '^18.2.0'
              }
            }, null, 2),
            language: 'json',
            operation: 'create'
          });
          recommendations.push('✅ Added default package.json');
        } else if (missing === 'public/index.html') {
          fixedFiles.push({
            path: 'public/index.html',
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
          recommendations.push('✅ Added default public/index.html');
        } else if (missing === 'src/index.js') {
          fixedFiles.push({
            path: 'src/index.js',
            content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);`,
            language: 'javascript',
            operation: 'create'
          });
          recommendations.push('✅ Added default src/index.js');
        } else if (missing === 'src/App.js') {
          fixedFiles.push({
            path: 'src/App.js',
            content: `import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">React App</h1>
        <p className="text-lg text-gray-600">Welcome to your app!</p>
      </div>
    </div>
  );
}`,
            language: 'javascript',
            operation: 'create'
          });
          recommendations.push('✅ Added default src/App.js');
        }
      });
    }

    // Fix common syntax issues
    if (issues.syntax && issues.syntax.warnings.length > 0) {
      issues.syntax.warnings.forEach(warning => {
        const file = fixedFiles.find(f => f.path === warning.file);
        if (file) {
          if (warning.message.includes('class=')) {
            file.content = file.content.replace(/\sclass=/g, ' className=');
            recommendations.push(`✅ Fixed className in ${warning.file}`);
          }
          if (warning.message.includes('React not imported')) {
            if (!file.content.startsWith('import React')) {
              file.content = `import React from 'react';\n\n${file.content}`;
              recommendations.push(`✅ Added React import to ${warning.file}`);
            }
          }
        }
      });
    }

    return { files: fixedFiles, recommendations };
  }

  /**
   * Generate detailed report for UI
   */
  static generateReport(files) {
    const validation = this.validate(files);

    return {
      status: validation.isValid ? 'VALID' : 'INVALID',
      score: validation.score,
      summary: {
        valid: validation.isValid,
        errors: validation.errors.length,
        warnings: validation.warnings.length,
        filesChecked: files.length
      },
      details: {
        essentialFiles: validation.issues.essential,
        completeness: validation.issues.completeness,
        syntax: validation.issues.syntax,
        dependencies: validation.issues.dependencies,
        linkage: validation.issues.linkage
      },
      errors: validation.errors,
      warnings: validation.warnings,
      recommendations: validation.recommendations,
      fixedFiles: validation.fixedFiles
    };
  }
}

module.exports = ReactTemplateValidator;
