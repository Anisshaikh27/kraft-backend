// models/Project.js
import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['html', 'css', 'javascript', 'json', 'markdown', 'image', 'font', 'other']
  },
  content: {
    type: String,
    default: ''
  },
  path: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    default: 0
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: [50, 'Project name cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  projectType: {
    type: String,
    enum: ['react-app', 'full-stack', 'static-site', 'component-library'],
    default: 'react-app'
  },
  files: [fileSchema],
  buildStatus: {
    type: String,
    enum: ['success', 'error', 'building', 'pending'],
    default: 'pending'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  totalSize: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for file count
projectSchema.virtual('fileCount').get(function() {
  return this.files.length;
});

export default mongoose.model('Project', projectSchema);
