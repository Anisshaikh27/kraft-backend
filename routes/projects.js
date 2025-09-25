import express from 'express';
import Project from '../models/Project.js';
import { authenticate } from './auth.js';

const router = express.Router();

// List user projects
router.get('/', authenticate, async (req, res) => {
  try {
    const projects = await Project.find({ owner: req.userId });
    res.json({ projects });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Create new project
router.post('/', authenticate, async (req, res) => {
  const { name, description } = req.body;
  try {
    const newProject = new Project({ name, description, owner: req.userId, files: [] });
    await newProject.save();
    res.json({ success: true, project: newProject });
  } catch (err) {
    res.status(500).json({ error: 'Project creation failed' });
  }
});

// Get specific project
router.get('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const project = await Project.findOne({ _id: id, owner: req.userId });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ project });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Update project info
router.put('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { name, description, tags } = req.body;
  try {
    const project = await Project.findOneAndUpdate(
      { _id: id, owner: req.userId },
      { name, description, tags },
      { new: true }
    );
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

// Delete project
router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    await Project.deleteOne({ _id: id, owner: req.userId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Deletion failed' });
  }
});

// Clone project
router.post('/:id/clone', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const original = await Project.findOne({ _id: id, owner: req.userId });
    if (!original) return res.status(404).json({ error: 'Original project not found' });
    const cloneData = original.toObject();
    delete cloneData._id;
    cloneData.name += ' (Copy)';
    const cloneProject = new Project(cloneData);
    await cloneProject.save();
    res.json({ success: true, project: cloneProject });
  } catch (err) {
    res.status(500).json({ error: 'Clone failed' });
  }
});

// Update file in project
router.put('/:id/files/:fileName', authenticate, async (req, res) => {
  const { id, fileName } = req.params;
  const { content } = req.body;
  try {
    const project = await Project.findOne({ _id: id, owner: req.userId });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const file = project.files.find(f => f.name === fileName);
    if (!file) return res.status(404).json({ error: 'File not found' });
    file.content = content;
    await project.save();
    res.json({ success: true, file });
  } catch (err) {
    res.status(500).json({ error: 'File update failed' });
  }
});

// Delete file
router.delete('/:id/files/:fileName', authenticate, async (req, res) => {
  const { id, fileName } = req.params;
  try {
    const project = await Project.findOne({ _id: id, owner: req.userId });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    project.files = project.files.filter(f => f.name !== fileName);
    await project.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'File deletion failed' });
  }
});

export default router;