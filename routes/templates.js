import express from 'express';
import ReactTemplateService from '../services/reactTemplateService.js';
import webContainerService from '../services/webContainerService.js';
import { authenticate } from './auth.js';

const router = express.Router();

// List template types
router.get('/types', (req, res) => {
  res.json({ types: ReactTemplateService.getTemplateTypes() });
});

// Generate template + live preview
router.post('/generate', authenticate, async (req, res) => {
  const { templateType, description, customRequirements, model, platform } = req.body;
  try {
    const result = await ReactTemplateService.generateTemplate(templateType, description, customRequirements, model);
    // Create live preview
    const preview = await webContainerService.createReactPreview(result.template);
    // Save project info
    // (this needs to be integrated with project management)
    res.json({ success: true, result, preview });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create live preview from existing project files
router.post('/preview/:projectId', authenticate, async (req, res) => {
  const { projectId } = req.params;
  const { platform } = req.body;
  try {
    // Fetch project, convert to template
    // Then generate preview in webcontainer
    res.json({ success: true, preview: { /* preview data */ } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;