const express = require('express');
const AIController = require('../controllers/aiController');

const router = express.Router();
const aiController = new AIController();

// POST /api/ai/generate
router.post('/generate', async (req, res) => {
  try {
    await aiController.generateCode(req, res);
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