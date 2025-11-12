const express = require('express');
const AIController = require('../controllers/aiController');
const ReactTemplateValidator = require('../services/reactTemplateValidator');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const aiController = new AIController();

// POST /api/ai/generate - General code generation (no auth required)
router.post('/generate', async (req, res) => {
  try {
    await aiController.generateCode(req, res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/generate/:projectId - Generate code for a specific project (requires auth)
router.post('/generate/:projectId', authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { prompt, projectType = 'react-app' } = req.body;
    const userId = req.user.userId;

    // Note: projectId and userId would be validated/used in a real implementation
    // For now, we just generate the code based on the prompt
    
    await aiController.generateCode(req, res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/validate - Validate React template files
// Body: { files: [{ path: 'src/App.js', content: '...' }] }
router.post('/validate', async (req, res) => {
  try {
    const { files } = req.body;

    if (!files || !Array.isArray(files)) {
      return res.status(400).json({ error: 'Files array is required' });
    }

    const report = ReactTemplateValidator.generateReport(files);

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ai/health
router.get('/health', async (req, res) => {
  try {
    await aiController.healthCheck(req, res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;