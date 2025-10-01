const { v4: uuidv4 } = require('uuid');

class ProjectController {
  constructor() {
    // In-memory storage (replace with database in production)
    this.projects = new Map();
    this.userProjects = new Map(); // sessionId -> Set of projectIds
    this.files = new Map(); // projectId -> Map of files
  }

  // Create new project
  async createProject(req, res) {
    try {
      const sessionId = req.headers['x-session-id'];
      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'Session ID is required',
          message: 'x-session-id header is missing'
        });
      }

      // Extract and validate project data
      const {
        name = 'New React Project',
        type = 'react-app',
        template = 'default',
        description = 'AI-generated React application',
        settings = {}
      } = req.body;

      // Create project with guaranteed ID
      const projectId = uuidv4();
      const project = {
        id: projectId,
        name: String(name).trim(),
        type: String(type),
        template: String(template),
        description: String(description).trim(),
        settings: settings || {},
        sessionId: sessionId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        files: []
      };

      console.log('Creating project:', project);

      // Store project
      this.projects.set(projectId, project);

      // Associate project with session
      if (!this.userProjects.has(sessionId)) {
        this.userProjects.set(sessionId, new Set());
      }
      this.userProjects.get(sessionId).add(projectId);

      // Initialize empty file system for project
      this.files.set(projectId, new Map());

      console.log('Project created successfully:', projectId);

      // Return consistent response structure
      res.status(201).json({
        success: true,
        data: {
          project: project
        },
        message: 'Project created successfully'
      });

    } catch (error) {
      console.error('Create project error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to create project'
      });
    }
  }

  // Get specific project
  async getProject(req, res) {
    try {
      const projectId = req.params.id;
      
      // Validate project ID (already validated by middleware)
      if (!projectId || projectId === 'undefined') {
        return res.status(400).json({
          success: false,
          error: 'Invalid project ID',
          message: 'Project ID is required and cannot be undefined'
        });
      }

      console.log('Getting project:', projectId);

      // Find project
      const project = this.projects.get(projectId);
      if (!project) {
        console.log('Project not found:', projectId);
        return res.status(404).json({
          success: false,
          error: 'Project not found',
          message: `Project with ID ${projectId} does not exist`
        });
      }

      // Get project files
      const projectFiles = this.files.get(projectId) || new Map();
      const filesArray = Array.from(projectFiles.values());

      console.log('Project found:', projectId, 'with', filesArray.length, 'files');

      // Return consistent response structure
      res.json({
        success: true,
        data: {
          project: {
            ...project,
            files: filesArray
          }
        }
      });

    } catch (error) {
      console.error('Get project error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve project'
      });
    }
  }

  // List user projects
  async listProjects(req, res) {
    try {
      const sessionId = req.headers['x-session-id'];
      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'Session ID required',
          message: 'x-session-id header is missing'
        });
      }

      console.log('Listing projects for session:', sessionId);

      // Get user's project IDs
      const userProjectIds = this.userProjects.get(sessionId) || new Set();
      
      // Get project details
      const projects = [];
      for (const projectId of userProjectIds) {
        const project = this.projects.get(projectId);
        if (project) {
          // Get file count for each project
          const projectFiles = this.files.get(projectId) || new Map();
          projects.push({
            ...project,
            fileCount: projectFiles.size
          });
        }
      }

      console.log('Found', projects.length, 'projects for session:', sessionId);

      res.json({
        success: true,
        data: projects
      });

    } catch (error) {
      console.error('List projects error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to list projects'
      });
    }
  }

  // Update project
  async updateProject(req, res) {
    try {
      const projectId = req.params.id;
      const updates = req.body;

      if (!projectId || projectId === 'undefined') {
        return res.status(400).json({
          success: false,
          error: 'Invalid project ID',
          message: 'Project ID is required'
        });
      }

      console.log('Updating project:', projectId, 'with:', updates);

      // Find project
      const project = this.projects.get(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found',
          message: `Project with ID ${projectId} does not exist`
        });
      }

      // Update allowed fields
      const allowedFields = ['name', 'description', 'settings'];
      const updatedProject = { ...project };

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          updatedProject[key] = value;
        }
      }

      updatedProject.updatedAt = new Date().toISOString();

      // Store updated project
      this.projects.set(projectId, updatedProject);

      console.log('Project updated successfully:', projectId);

      res.json({
        success: true,
        data: {
          project: updatedProject
        },
        message: 'Project updated successfully'
      });

    } catch (error) {
      console.error('Update project error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to update project'
      });
    }
  }

  // Delete project
  async deleteProject(req, res) {
    try {
      const projectId = req.params.id;

      if (!projectId || projectId === 'undefined') {
        return res.status(400).json({
          success: false,
          error: 'Invalid project ID',
          message: 'Project ID is required'
        });
      }

      console.log('Deleting project:', projectId);

      // Find project
      const project = this.projects.get(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found',
          message: `Project with ID ${projectId} does not exist`
        });
      }

      // Remove from user's projects
      const sessionId = project.sessionId;
      if (this.userProjects.has(sessionId)) {
        this.userProjects.get(sessionId).delete(projectId);
      }

      // Delete project and its files
      this.projects.delete(projectId);
      this.files.delete(projectId);

      console.log('Project deleted successfully:', projectId);

      res.json({
        success: true,
        message: 'Project deleted successfully'
      });

    } catch (error) {
      console.error('Delete project error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to delete project'
      });
    }
  }

  // Clone project
  async cloneProject(req, res) {
    try {
      const originalProjectId = req.params.id;
      const { name } = req.body;
      const sessionId = req.headers['x-session-id'];

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'Session ID required',
          message: 'x-session-id header is missing'
        });
      }

      console.log('Cloning project:', originalProjectId);

      // Find original project
      const originalProject = this.projects.get(originalProjectId);
      if (!originalProject) {
        return res.status(404).json({
          success: false,
          error: 'Project not found',
          message: `Project with ID ${originalProjectId} does not exist`
        });
      }

      // Create cloned project
      const clonedProjectId = uuidv4();
      const clonedProject = {
        ...originalProject,
        id: clonedProjectId,
        name: name || `${originalProject.name} (Copy)`,
        sessionId: sessionId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store cloned project
      this.projects.set(clonedProjectId, clonedProject);

      // Associate with session
      if (!this.userProjects.has(sessionId)) {
        this.userProjects.set(sessionId, new Set());
      }
      this.userProjects.get(sessionId).add(clonedProjectId);

      // Clone files
      const originalFiles = this.files.get(originalProjectId) || new Map();
      const clonedFiles = new Map(originalFiles);
      this.files.set(clonedProjectId, clonedFiles);

      console.log('Project cloned successfully:', clonedProjectId);

      res.status(201).json({
        success: true,
        data: {
          project: clonedProject
        },
        message: 'Project cloned successfully'
      });

    } catch (error) {
      console.error('Clone project error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to clone project'
      });
    }
  }

  // Export project
  async exportProject(req, res) {
    try {
      const projectId = req.params.id;

      console.log('Exporting project:', projectId);

      // Find project
      const project = this.projects.get(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found',
          message: `Project with ID ${projectId} does not exist`
        });
      }

      // Get project files
      const projectFiles = this.files.get(projectId) || new Map();
      const filesArray = Array.from(projectFiles.values());

      // Create export data
      const exportData = {
        project: {
          ...project,
          exportedAt: new Date().toISOString()
        },
        files: filesArray,
        metadata: {
          version: '1.0.0',
          exportedBy: 'Weblify.AI',
          totalFiles: filesArray.length
        }
      };

      console.log('Project exported successfully:', projectId);

      res.json({
        success: true,
        data: exportData,
        message: 'Project exported successfully'
      });

    } catch (error) {
      console.error('Export project error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to export project'
      });
    }
  }
}

module.exports = ProjectController;