const { v4: uuidv4 } = require('uuid');
const path = require('path');

// In-memory project storage (in production, use a database)
const projects = new Map();
const sessions = new Map();

class ProjectController {
  
  // Create a new project
  async createProject(req, res) {
    try {
      const {
        name = 'Untitled Project',
        type = 'react-app',
        template = 'default',
        description = ''
      } = req.body;

      const sessionId = req.headers['x-session-id'] || uuidv4();
      const projectId = uuidv4();

      const project = {
        id: projectId,
        name: name.trim(),
        type,
        template,
        description: description.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        files: new Map(),
        structure: {},
        settings: {
          autoSave: true,
          linting: true,
          formatting: true
        }
      };

      // Initialize with basic structure based on type
      this.initializeProjectStructure(project, type, template);

      // Store project
      projects.set(projectId, project);
      
      // Associate with session
      if (!sessions.has(sessionId)) {
        sessions.set(sessionId, {
          projects: [],
          createdAt: new Date().toISOString()
        });
      }
      sessions.get(sessionId).projects.push(projectId);

      res.status(201).json({
        success: true,
        data: {
          project: this.sanitizeProject(project),
          sessionId
        },
        message: 'Project created successfully'
      });

    } catch (error) {
      console.error('Create project error:', error);
      res.status(500).json({
        error: 'Failed to create project',
        message: error.message
      });
    }
  }

  // Get project by ID
  async getProject(req, res) {
    try {
      const { id } = req.params;
      const project = projects.get(id);

      if (!project) {
        return res.status(404).json({
          error: 'Project not found',
          message: `Project with ID ${id} does not exist`
        });
      }

      res.json({
        success: true,
        data: {
          project: this.sanitizeProject(project),
          files: Array.from(project.files.entries()).map(([path, file]) => ({
            path,
            ...file
          }))
        }
      });

    } catch (error) {
      console.error('Get project error:', error);
      res.status(500).json({
        error: 'Failed to retrieve project',
        message: error.message
      });
    }
  }

  // Update project settings
  async updateProject(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const project = projects.get(id);
      if (!project) {
        return res.status(404).json({
          error: 'Project not found',
          message: `Project with ID ${id} does not exist`
        });
      }

      // Update allowed fields
      const allowedFields = ['name', 'description', 'settings'];
      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          if (field === 'settings') {
            project.settings = { ...project.settings, ...updates.settings };
          } else {
            project[field] = updates[field];
          }
        }
      });

      project.updatedAt = new Date().toISOString();

      res.json({
        success: true,
        data: {
          project: this.sanitizeProject(project)
        },
        message: 'Project updated successfully'
      });

    } catch (error) {
      console.error('Update project error:', error);
      res.status(500).json({
        error: 'Failed to update project',
        message: error.message
      });
    }
  }

  // Delete project
  async deleteProject(req, res) {
    try {
      const { id } = req.params;
      
      if (!projects.has(id)) {
        return res.status(404).json({
          error: 'Project not found',
          message: `Project with ID ${id} does not exist`
        });
      }

      projects.delete(id);

      // Remove from sessions
      for (const [sessionId, session] of sessions.entries()) {
        const index = session.projects.indexOf(id);
        if (index > -1) {
          session.projects.splice(index, 1);
        }
      }

      res.json({
        success: true,
        message: 'Project deleted successfully'
      });

    } catch (error) {
      console.error('Delete project error:', error);
      res.status(500).json({
        error: 'Failed to delete project',
        message: error.message
      });
    }
  }

  // List projects for session
  async listProjects(req, res) {
    try {
      const sessionId = req.headers['x-session-id'];
      
      if (!sessionId || !sessions.has(sessionId)) {
        return res.json({
          success: true,
          data: {
            projects: [],
            total: 0
          }
        });
      }

      const session = sessions.get(sessionId);
      const userProjects = session.projects
        .map(projectId => projects.get(projectId))
        .filter(Boolean)
        .map(project => this.sanitizeProject(project));

      res.json({
        success: true,
        data: {
          projects: userProjects,
          total: userProjects.length,
          sessionId
        }
      });

    } catch (error) {
      console.error('List projects error:', error);
      res.status(500).json({
        error: 'Failed to list projects',
        message: error.message
      });
    }
  }

  // Clone/duplicate project
  async cloneProject(req, res) {
    try {
      const { id } = req.params;
      const { name } = req.body;

      const originalProject = projects.get(id);
      if (!originalProject) {
        return res.status(404).json({
          error: 'Project not found',
          message: `Project with ID ${id} does not exist`
        });
      }

      const newProjectId = uuidv4();
      const sessionId = req.headers['x-session-id'] || uuidv4();

      const clonedProject = {
        ...originalProject,
        id: newProjectId,
        name: name || `${originalProject.name} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        files: new Map(originalProject.files) // Clone files
      };

      projects.set(newProjectId, clonedProject);

      // Associate with session
      if (!sessions.has(sessionId)) {
        sessions.set(sessionId, {
          projects: [],
          createdAt: new Date().toISOString()
        });
      }
      sessions.get(sessionId).projects.push(newProjectId);

      res.status(201).json({
        success: true,
        data: {
          project: this.sanitizeProject(clonedProject),
          sessionId
        },
        message: 'Project cloned successfully'
      });

    } catch (error) {
      console.error('Clone project error:', error);
      res.status(500).json({
        error: 'Failed to clone project',
        message: error.message
      });
    }
  }

  // Export project as ZIP (simplified - return file structure)
  async exportProject(req, res) {
    try {
      const { id } = req.params;
      const project = projects.get(id);

      if (!project) {
        return res.status(404).json({
          error: 'Project not found'
        });
      }

      // Convert files Map to plain object for export
      const filesObject = {};
      project.files.forEach((file, filePath) => {
        filesObject[filePath] = {
          content: file.content,
          language: file.language,
          size: Buffer.byteLength(file.content, 'utf8')
        };
      });

      const exportData = {
        project: this.sanitizeProject(project),
        files: filesObject,
        exportedAt: new Date().toISOString(),
        version: '1.0.0'
      };

      res.json({
        success: true,
        data: exportData,
        message: 'Project exported successfully'
      });

    } catch (error) {
      console.error('Export project error:', error);
      res.status(500).json({
        error: 'Failed to export project',
        message: error.message
      });
    }
  }

  // Helper methods

  initializeProjectStructure(project, type, template) {
    const templates = {
      'react-app': this.createReactAppStructure,
      'next-app': this.createNextAppStructure,
      'express-api': this.createExpressApiStructure,
      'static-site': this.createStaticSiteStructure
    };

    const initFunction = templates[type] || templates['react-app'];
    initFunction.call(this, project);
  }

  createReactAppStructure(project) {
    const files = {
      'package.json': {
        content: JSON.stringify({
          name: project.name.toLowerCase().replace(/\s+/g, '-'),
          version: '0.1.0',
          private: true,
          dependencies: {
            'react': '^18.2.0',
            'react-dom': '^18.2.0',
            'react-scripts': '5.0.1'
          },
          scripts: {
            start: 'react-scripts start',
            build: 'react-scripts build',
            test: 'react-scripts test',
            eject: 'react-scripts eject'
          },
          browserslist: {
            production: ['>0.2%', 'not dead', 'not op_mini all'],
            development: ['last 1 chrome version', 'last 1 firefox version', 'last 1 safari version']
          }
        }, null, 2),
        language: 'json',
        createdAt: new Date().toISOString()
      },
      'public/index.html': {
        content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="${project.description || 'React application'}" />
    <title>${project.name}</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>`,
        language: 'html',
        createdAt: new Date().toISOString()
      },
      'src/index.js': {
        content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
        language: 'javascript',
        createdAt: new Date().toISOString()
      },
      'src/App.js': {
        content: `import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to ${project.name}</h1>
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
      </header>
    </div>
  );
}

export default App;`,
        language: 'javascript',
        createdAt: new Date().toISOString()
      },
      'src/App.css': {
        content: `.App {
  text-align: center;
}

.App-header {
  background-color: #282c34;
  padding: 20px;
  color: white;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.App-header h1 {
  margin-bottom: 1rem;
}

code {
  background-color: #f1f1f1;
  padding: 2px 4px;
  border-radius: 3px;
  color: #333;
}`,
        language: 'css',
        createdAt: new Date().toISOString()
      },
      'src/index.css': {
        content: `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
}`,
        language: 'css',
        createdAt: new Date().toISOString()
      },
      'README.md': {
        content: `# ${project.name}

${project.description || 'A React application built with Weblify.AI'}

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Start the development server:
   \`\`\`bash
   npm start
   \`\`\`

3. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Available Scripts

- \`npm start\` - Runs the app in development mode
- \`npm build\` - Builds the app for production
- \`npm test\` - Launches the test runner

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).`,
        language: 'markdown',
        createdAt: new Date().toISOString()
      }
    };

    // Add files to project
    Object.entries(files).forEach(([filePath, fileData]) => {
      project.files.set(filePath, fileData);
    });

    // Update project structure
    project.structure = this.generateProjectStructure(project.files);
  }

  createNextAppStructure(project) {
    // Similar to React app but with Next.js specific structure
    // Implementation would go here
  }

  createExpressApiStructure(project) {
    // Express API specific structure
    // Implementation would go here
  }

  createStaticSiteStructure(project) {
    // Static site structure
    // Implementation would go here  
  }

  sanitizeProject(project) {
    return {
      id: project.id,
      name: project.name,
      type: project.type,
      template: project.template,
      description: project.description,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      settings: project.settings,
      fileCount: project.files.size,
      structure: project.structure
    };
  }

  generateProjectStructure(filesMap) {
    const structure = {};
    
    filesMap.forEach((file, filePath) => {
      const parts = filePath.split('/');
      let current = structure;
      
      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          // It's a file
          current[part] = {
            type: 'file',
            language: file.language,
            size: Buffer.byteLength(file.content, 'utf8')
          };
        } else {
          // It's a directory
          if (!current[part]) {
            current[part] = {
              type: 'directory',
              children: {}
            };
          }
          current = current[part].children;
        }
      });
    });
    
    return structure;
  }
}

module.exports = ProjectController;