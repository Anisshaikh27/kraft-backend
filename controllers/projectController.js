const { v4: uuidv4 } = require('uuid');

class ProjectController {
  constructor() {
    this.projects = new Map();
    this.userProjects = new Map();
    this.files = new Map();
  }

  async createProject(req, res) {
    const sessionId = req.headers['x-session-id'] || 'default-session';
    const { name = 'New Project', type = 'react-app', description = '' } = req.body;

    const projectId = uuidv4();
    const project = {
      id: projectId,
      name,
      type,
      description,
      sessionId,
      createdAt: new Date().toISOString(),
      files: []
    };

    this.projects.set(projectId, project);

    if (!this.userProjects.has(sessionId)) {
      this.userProjects.set(sessionId, new Set());
    }
    this.userProjects.get(sessionId).add(projectId);

    this.files.set(projectId, new Map());

    res.status(201).json({ success: true, data: { project } });
  }

  async getProject(req, res) {
    const projectId = req.params.id;
    const project = this.projects.get(projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const projectFiles = this.files.get(projectId) || new Map();
    const filesArray = Array.from(projectFiles.values());

    res.json({ success: true, data: { project: { ...project, files: filesArray } } });
  }

  async listProjects(req, res) {
    const sessionId = req.headers['x-session-id'] || 'default-session';
    const userProjectIds = this.userProjects.get(sessionId) || new Set();

    const projects = [];
    for (const projectId of userProjectIds) {
      const project = this.projects.get(projectId);
      if (project) {
        projects.push(project);
      }
    }

    res.json({ success: true, data: projects });
  }

  async updateProject(req, res) {
    const projectId = req.params.id;
    const project = this.projects.get(projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { name, description } = req.body;
    if (name) project.name = name;
    if (description) project.description = description;

    this.projects.set(projectId, project);

    res.json({ success: true, data: { project } });
  }

  async deleteProject(req, res) {
    const projectId = req.params.id;
    const project = this.projects.get(projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const sessionId = project.sessionId;
    if (this.userProjects.has(sessionId)) {
      this.userProjects.get(sessionId).delete(projectId);
    }

    this.projects.delete(projectId);
    this.files.delete(projectId);

    res.json({ success: true });
  }
}

module.exports = ProjectController;
