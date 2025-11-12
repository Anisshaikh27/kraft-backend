/**
 * React Template Validator Test Utility
 * Test and verify React template generation and validation
 */

const ReactTemplateValidator = require('./services/reactTemplateValidator');
const SandpackResponseProcessor = require('./services/sandpackResponseProcessor');

class TemplateValidationTester {
  /**
   * Test a complete LLM response
   */
  static testLLMResponse(llmContent) {
    console.log('\n' + '='.repeat(80));
    console.log('TESTING LLM RESPONSE');
    console.log('='.repeat(80));

    // Step 1: Extract files from response
    console.log('\n📝 STEP 1: Extracting files from LLM response...');
    const files = SandpackResponseProcessor.processResponse(llmContent, 'groq');
    console.log(`✅ Extracted ${files.length} files`);
    files.forEach(f => console.log(`   - ${f.path} (${f.content?.length || 0} bytes)`));

    // Step 2: Validate extracted files
    console.log('\n🔍 STEP 2: Validating React template...');
    const validation = ReactTemplateValidator.validate(files);

    console.log(`\nValidation Status: ${validation.isValid ? '✅ VALID' : '❌ INVALID'}`);
    console.log(`Score: ${validation.score}/100`);

    // Step 3: Show essential files status
    console.log('\n📦 Essential Files:');
    const essential = validation.issues.essential;
    console.log(`   Found: ${essential.found}/${essential.total}`);
    if (essential.missing.length > 0) {
      console.log(`   ❌ Missing: ${essential.missing.join(', ')}`);
    }

    // Step 4: Show completeness status
    console.log('\n📄 File Completeness:');
    const completeness = validation.issues.completeness;
    console.log(`   Complete: ${completeness.completeCount}/${completeness.totalCount}`);
    if (completeness.incompleteFiles.length > 0) {
      console.log(`   ⚠️  Incomplete: ${completeness.incompleteFiles.join(', ')}`);
    }

    // Step 5: Show dependency status
    console.log('\n📚 Dependencies:');
    const deps = validation.issues.dependencies;
    console.log(`   React: ${deps.hasReact ? '✅' : '❌'}`);
    console.log(`   React-DOM: ${deps.hasReactDom ? '✅' : '❌'}`);

    // Step 6: Show errors
    if (validation.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      validation.errors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
    }

    // Step 7: Show warnings
    if (validation.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      validation.warnings.forEach((warn, i) => console.log(`   ${i + 1}. ${warn}`));
    }

    // Step 8: Show recommendations
    if (validation.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      validation.recommendations.forEach((rec, i) => console.log(`   ${i + 1}. ${rec}`));
    }

    // Step 9: Show fixed files
    console.log('\n🔧 Files After Auto-Fix:');
    console.log(`   Total: ${validation.fixedFiles.length}`);
    validation.fixedFiles.forEach(f => {
      const isFixed = !files.find(orig => orig.path === f.path);
      console.log(`   ${isFixed ? '✨ NEW' : '   '} ${f.path}`);
    });

    console.log('\n' + '='.repeat(80));

    return {
      files,
      validation,
      fixedFiles: validation.fixedFiles,
      isExecutable: validation.isValid
    };
  }

  /**
   * Test a sample LLM response
   */
  static testSampleResponse() {
    const sampleResponse = `
Here's a complete React counter app for you:

// package.json
\`\`\`json
{
  "name": "counter-app",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
\`\`\`

// public/index.html
\`\`\`html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <title>Counter App</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
\`\`\`

// src/index.js
\`\`\`jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
\`\`\`

// src/App.js
\`\`\`jsx
import React, { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);
  const [theme, setTheme] = useState('light');

  const bgClass = theme === 'light' 
    ? 'bg-gradient-to-br from-blue-50 to-indigo-100'
    : 'bg-gradient-to-br from-gray-900 to-gray-800';

  const textClass = theme === 'light' ? 'text-gray-900' : 'text-white';

  return (
    <div className={\`min-h-screen \${bgClass} p-8 transition-colors\`}>
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className={\`text-4xl font-bold \${textClass}\`}>Counter App</h1>
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <p className={`text-6xl font-bold \${textClass}`}>{count}</p>
            <p className={`text-lg \${textClass} opacity-70 mt-2`}>Current Count</p>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setCount(count - 1)}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition"
            >
              - Decrease
            </button>
            <button
              onClick={() => setCount(0)}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition"
            >
              Reset
            </button>
            <button
              onClick={() => setCount(count + 1)}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition"
            >
              + Increase
            </button>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className={`text-sm text-center \${textClass} opacity-60`}>
              Click the buttons above to change the counter
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
\`\`\`
    `;

    return this.testLLMResponse(sampleResponse);
  }

  /**
   * Test a malformed response (with issues)
   */
  static testMalformedResponse() {
    const malformedResponse = `
Here's a React app (incomplete):

// src/App.js
\`\`\`jsx
import React, { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);
  // ... rest of component
\`\`\`

Some other description here...
    `;

    return this.testLLMResponse(malformedResponse);
  }

  /**
   * Generate HTML report
   */
  static generateHTMLReport(testResult, filename = 'validation-report.html') {
    const { validation } = testResult;
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>React Template Validation Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto'; background: #f5f5f5; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 30px; }
        h1 { color: #333; margin-bottom: 30px; display: flex; align-items: center; gap: 10px; }
        .status { padding: 12px 20px; border-radius: 6px; font-weight: bold; display: inline-block; }
        .status.valid { background: #d4edda; color: #155724; }
        .status.invalid { background: #f8d7da; color: #721c24; }
        .score { font-size: 32px; font-weight: bold; margin: 20px 0; }
        .section { margin: 30px 0; padding: 20px; background: #f9f9f9; border-left: 4px solid #007bff; border-radius: 4px; }
        .section h2 { color: #333; margin-bottom: 15px; font-size: 18px; }
        .item { margin: 10px 0; padding: 10px; background: white; border-radius: 4px; border-left: 3px solid #ddd; }
        .item.error { border-left-color: #dc3545; background: #fff5f5; color: #721c24; }
        .item.warning { border-left-color: #ffc107; background: #fffbf0; color: #856404; }
        .item.success { border-left-color: #28a745; background: #f1f9f1; color: #155724; }
        .file-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 10px; margin-top: 10px; }
        .file-item { padding: 10px; background: #f0f0f0; border-radius: 4px; font-family: monospace; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f0f0f0; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <h1>
            <span>${validation.isValid ? '✅' : '❌'}</span>
            React Template Validation Report
        </h1>

        <div class="status ${validation.isValid ? 'valid' : 'invalid'}">
            ${validation.isValid ? 'VALID - Ready for Sandpack' : 'INVALID - Needs Fixes'}
        </div>

        <div class="score">Score: ${validation.score}/100</div>

        <div class="section">
            <h2>Summary</h2>
            <table>
                <tr>
                    <td>Files Checked:</td>
                    <td><strong>${validation.details.essential?.found || 0}</strong> essential files</td>
                </tr>
                <tr>
                    <td>File Completeness:</td>
                    <td><strong>${validation.details.completeness?.completeCount || 0}/${validation.details.completeness?.totalCount || 0}</strong> complete</td>
                </tr>
                <tr>
                    <td>Errors:</td>
                    <td><strong style="color: #dc3545;">${validation.errors.length}</strong></td>
                </tr>
                <tr>
                    <td>Warnings:</td>
                    <td><strong style="color: #ffc107;">${validation.warnings.length}</strong></td>
                </tr>
            </table>
        </div>

        ${validation.errors.length > 0 ? `
        <div class="section">
            <h2>❌ Errors</h2>
            ${validation.errors.map(err => `<div class="item error">${err}</div>`).join('')}
        </div>
        ` : ''}

        ${validation.warnings.length > 0 ? `
        <div class="section">
            <h2>⚠️ Warnings</h2>
            ${validation.warnings.map(warn => `<div class="item warning">${warn}</div>`).join('')}
        </div>
        ` : ''}

        ${validation.recommendations.length > 0 ? `
        <div class="section">
            <h2>💡 Recommendations</h2>
            ${validation.recommendations.map(rec => `<div class="item success">${rec}</div>`).join('')}
        </div>
        ` : ''}

        <div class="section">
            <h2>📦 Essential Files</h2>
            ${validation.details.essential ? `
                <p>Found: <strong>${validation.details.essential.found}/${validation.details.essential.total}</strong></p>
                ${validation.details.essential.missing.length > 0 ? `
                    <p style="color: #dc3545;">Missing: ${validation.details.essential.missing.join(', ')}</p>
                ` : ''}
            ` : 'No data'}
        </div>

        <div class="section">
            <h2>📄 File Completeness</h2>
            ${validation.details.completeness ? `
                <p>Complete Files: <strong>${validation.details.completeness.completeCount}/${validation.details.completeness.totalCount}</strong></p>
                ${validation.details.completeness.incompleteFiles.length > 0 ? `
                    <p style="color: #dc3545;">Incomplete: ${validation.details.completeness.incompleteFiles.join(', ')}</p>
                ` : ''}
            ` : 'No data'}
        </div>

        <div class="section">
            <h2>📚 Dependencies</h2>
            ${validation.details.dependencies ? `
                <table>
                    <tr>
                        <td>React:</td>
                        <td>${validation.details.dependencies.hasReact ? '✅ ' + validation.details.dependencies.version.react : '❌ Missing'}</td>
                    </tr>
                    <tr>
                        <td>React-DOM:</td>
                        <td>${validation.details.dependencies.hasReactDom ? '✅ ' + validation.details.dependencies.version.reactDom : '❌ Missing'}</td>
                    </tr>
                </table>
            ` : 'No data'}
        </div>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #999; font-size: 12px;">Report generated on ${new Date().toLocaleString()}</p>
    </div>
</body>
</html>
    `;

    require('fs').writeFileSync(filename, html);
    console.log(`\n📊 HTML report generated: ${filename}`);
    return filename;
  }
}

// Run tests if called directly
if (require.main === module) {
  console.log('🧪 RUNNING REACT TEMPLATE VALIDATOR TESTS\n');

  console.log('TEST 1: Valid Sample Response');
  const test1 = TemplateValidationTester.testSampleResponse();

  console.log('\n\nTEST 2: Malformed Response');
  const test2 = TemplateValidationTester.testMalformedResponse();

  console.log('\n\n📊 Generating HTML reports...');
  TemplateValidationTester.generateHTMLReport(test1, './test-report-valid.html');
  TemplateValidationTester.generateHTMLReport(test2, './test-report-malformed.html');

  console.log('\n✅ All tests completed!');
}

module.exports = TemplateValidationTester;
