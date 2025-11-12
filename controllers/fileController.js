/**
 * File Controller
 * Handles file CRUD operations with MongoDB
 */

const File = require('../models/File');
const Project = require('../models/Project');

// Create/add file to project
const createFile = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { path, content, language } = req.body;
    const userId = req.user.userId;

    if (!path) {
      return res.status(400).json({ error: 'File path is required' });
    }

    // Verify project exists and belongs to user
    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if file already exists
    const existingFile = await File.findOne({ projectId, path });
    if (existingFile) {
      return res.status(400).json({ error: 'File already exists' });
    }

    const newFile = new File({
      projectId,
      userId,
      path,
      content: content || '',
      language: language || 'javascript',
      operation: 'create',
    });

    await newFile.save();

    // Update project file count
    project.fileCount = (project.fileCount || 0) + 1;
    await project.save();

    res.status(201).json({
      success: true,
      message: 'File created successfully',
      file: newFile,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// List files in project
const listFiles = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.userId;

    // Verify project exists
    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const files = await File.find({ projectId });

    res.json({
      success: true,
      files,
      count: files.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get specific file
const getFile = async (req, res) => {
  try {
    const { projectId, fileId } = req.params;
    const userId = req.user.userId;

    // Verify project exists
    await Project.findOne({ _id: projectId, userId });

    const file = await File.findOne({ _id: fileId, projectId });
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json({
      success: true,
      file,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update file
const updateFile = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { path, content, language } = req.body;
    const userId = req.user.userId;

    // Verify project exists
    await Project.findOne({ _id: projectId, userId });

    // Find file by path (main update method)
    const file = await File.findOne({ projectId, path });
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Update content
    if (content !== undefined) {
      file.content = content;
      file.operation = 'update';
    }
    if (language) {
      file.language = language;
    }

    await file.save();

    res.json({
      success: true,
      message: 'File updated successfully',
      file,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete file
const deleteFile = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { path } = req.body;
    const userId = req.user.userId;

    // Verify project exists
    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const file = await File.findOneAndDelete({ projectId, path });
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Decrease file count
    project.fileCount = Math.max(0, (project.fileCount || 1) - 1);
    await project.save();

    res.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createFile,
  listFiles,
  getFile,
  updateFile,
  deleteFile,
};
