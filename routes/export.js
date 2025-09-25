import express from 'express';
import fileExportService from '../services/fileExportService.js';
import hostingService from '../services/hostingService.js';
import Project from '../models/Project.js';
import { authenticate } from './auth.js';

const router = express.Router();

router.get('/:projectId/zip', authenticate, async (req, res) => {
  const { projectId } = req.params;
  try {
    const project = await Project.findOne({ _id: projectId, owner: req.userId });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const result = await fileExportService.exportProject(project, 'zip');
    res.setHeader('Content-disposition', `attachment; filename=${result.filename}`);
    res.setHeader('Content-type', 'application/zip');
    res.send(result.buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:projectId/deploy', authenticate, async (req, res) => {
  const { projectId } = req.params;
  const { platform } = req.body;
  try {
    const project = await Project.findOne({ _id: projectId, owner: req.userId });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const result = await hostingService.generateDeploymentConfig(project, platform);
    res.json({ success: true, deployment: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/platforms', (req, res) => {
  res.json({ platforms: hostingService.getAvailablePlatforms() });
});

export default router;