/**
 * File Schema & Model
 * Defines file structure within projects
 */

const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    path: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      default: '',
    },
    language: {
      type: String,
      enum: ['javascript', 'jsx', 'typescript', 'tsx', 'css', 'html', 'json', 'markdown', 'python'],
      default: 'javascript',
    },
    size: {
      type: Number,
      default: 0,
    },
    operation: {
      type: String,
      enum: ['create', 'update', 'delete'],
      default: 'create',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for faster queries
fileSchema.index({ projectId: 1, path: 1 });

// Calculate file size before saving
fileSchema.pre('save', function (next) {
  this.size = this.content.length;
  next();
});

module.exports = mongoose.model('File', fileSchema);
