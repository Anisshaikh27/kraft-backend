const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  metadata: {
    fileCount: Number,
    codeGenerated: Boolean,
    model: String // 'groq' or 'gemini'
  }
}, { 
  timestamps: true,
  indexes: [
    { projectId: 1, createdAt: 1 },
    { userId: 1, createdAt: 1 }
  ]
});

// Index for efficient queries
chatSchema.index({ projectId: 1, createdAt: 1 });

module.exports = mongoose.model('Chat', chatSchema);
