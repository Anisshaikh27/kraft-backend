import express from 'express';
import freeAiService from '../services/freeAiService.js';
import { authenticate } from './auth.js';

const router = express.Router();

// Generate React component
router.post('/generate-component', authenticate, async (req, res) => {
  const { description, requirements, model } = req.body;
  try {
    const result = await freeAiService.generateReactComponent(description, requirements, model);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate React app
router.post('/generate-app', authenticate, async (req, res) => {
  const { description, features, model, platform } = req.body;
  try {
    const result = await freeAiService.generateReactApp(description, features, model);
    // Generate live preview
    const previewData = await freeAiService.generateLivePreview(result.app.files, {}, platform);
    res.json({ success: true, result, previewData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate full-stack app
router.post('/generate-fullstack', authenticate, async (req, res) => {
  const { description, stackType, features, model } = req.body;
  try {
    const result = await fullStackService.generateFullStackApp(description, stackType, features, model);
    const previewData = await webContainerService.createReactPreview(result.fullStackApp);
    res.json({ success: true, result, previewData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Improve code
router.post('/improve-code', authenticate, async (req, res) => {
  const { code, improvements, model }  = req.body;
  try {
    const result = await freeAiService.improveCode(code, improvements, model);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Debug code
router.post('/debug-code', authenticate, async (req, res) => {
  const { code, errorMessage, model } = req.body
  try {
    const result = await freeAiService.debugCode(code, errorMessage, model);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get models
router.get('/free-models', (req, res) => {
  res.json({ models: freeAiService.getAvailableModels() });
});

export default router;