const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const auth = require('../middleware/auth');

// GET all chat messages for a project
router.get('/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.userId;

    // Convert projectId string to ObjectId if needed
    const mongoose = require('mongoose');
    const projectObjectId = mongoose.Types.ObjectId.isValid(projectId) 
      ? new mongoose.Types.ObjectId(projectId)
      : projectId;

    const messages = await Chat.find({
      projectId: projectObjectId,
      userId
    }).sort({ createdAt: 1 });

    res.json({ success: true, messages });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch chat messages',
      details: error.message 
    });
  }
});

// POST a new chat message
router.post('/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { type, content, metadata } = req.body;
    const userId = req.user.userId;

    if (!type || !content) {
      return res.status(400).json({
        success: false,
        error: 'Type and content are required'
      });
    }

    // Convert projectId string to ObjectId if needed
    const mongoose = require('mongoose');
    const projectObjectId = mongoose.Types.ObjectId.isValid(projectId) 
      ? new mongoose.Types.ObjectId(projectId)
      : projectId;

    const chat = new Chat({
      projectId: projectObjectId,
      userId,
      type,
      content,
      metadata: metadata || {}
    });

    await chat.save();

    res.json({ 
      success: true, 
      message: 'Chat message saved',
      data: chat 
    });
  } catch (error) {
    console.error('Error saving chat message:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save chat message',
      details: error.message 
    });
  }
});

// POST multiple chat messages (bulk save)
router.post('/bulk/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { messages } = req.body;
    const userId = req.user.userId;

    if (!Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: 'Messages must be an array'
      });
    }

    // Convert projectId string to ObjectId if needed
    const mongoose = require('mongoose');
    const projectObjectId = mongoose.Types.ObjectId.isValid(projectId) 
      ? new mongoose.Types.ObjectId(projectId)
      : projectId;

    const chatMessages = messages.map(msg => ({
      projectId: projectObjectId,
      userId,
      type: msg.type,
      content: msg.content,
      metadata: msg.metadata || {}
    }));

    const saved = await Chat.insertMany(chatMessages);

    res.json({ 
      success: true, 
      message: `${saved.length} chat messages saved`,
      count: saved.length,
      data: saved
    });
  } catch (error) {
    console.error('Error saving bulk chat messages:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save chat messages',
      details: error.message 
    });
  }
});

// DELETE all chat messages for a project
router.delete('/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.userId;

    // Convert projectId string to ObjectId if needed
    const mongoose = require('mongoose');
    const projectObjectId = mongoose.Types.ObjectId.isValid(projectId) 
      ? new mongoose.Types.ObjectId(projectId)
      : projectId;

    const result = await Chat.deleteMany({
      projectId: projectObjectId,
      userId
    });

    res.json({ 
      success: true, 
      message: `${result.deletedCount} chat messages deleted`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting chat messages:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete chat messages',
      details: error.message 
    });
  }
});

module.exports = router;
