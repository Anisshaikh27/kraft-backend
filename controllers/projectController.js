/**
 * Project Controller
 * Handles project CRUD operations with MongoDB
 */

const Project = require('../models/Project');
const File = require('../models/File');

// Create new project
const createProject = async (req, res) => {
  try {
    const { name, description, type } = req.body;
    const userId = req.user.userId;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const newProject = new Project({
      userId,
      name,
      description: description || '',
      type: type || 'react-app',
    });

    await newProject.save();

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project: newProject,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all projects for user
const listProjects = async (req, res) => {
  try {
    const userId = req.user.userId;

    const projects = await Project.find({ userId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      projects,
      count: projects.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get specific project with files
const getProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const project = await Project.findOne({
      _id: id,
      userId,
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get files for this project
    const files = await File.find({ projectId: id });

    res.json({
      success: true,
      project,
      files,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update project
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, type, status } = req.body;
    const userId = req.user.userId;

    const project = await Project.findOneAndUpdate(
      { _id: id, userId },
      {
        name: name || undefined,
        description: description || undefined,
        type: type || undefined,
        status: status || undefined,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({
      success: true,
      message: 'Project updated successfully',
      project,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete project
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const project = await Project.findOneAndDelete({
      _id: id,
      userId,
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Delete all files associated with project
    await File.deleteMany({ projectId: id });

    res.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createProject,
  listProjects,
  getProject,
  updateProject,
  deleteProject,
};
