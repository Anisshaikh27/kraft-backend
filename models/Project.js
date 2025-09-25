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

const chatSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true
  },
  sender: {
    type: String,
    enum: ['user', 'ai'],
    required: true
  },
  model: {
    type: String,
    enum: ['gemini', 'groq', 'huggingface', 'together', 'deepseek']
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

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
  collaborators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  projectType: {
    type: String,
    enum: ['react-app', 'full-stack', 'static-site', 'component-library'],
    default: 'react-app'
  },
  stackType: {
    type: String,
    enum: ['react-node', 'vue-express', 'static', 'react-python'],
    default: 'react-node'
  },
  files: [fileSchema],
  chatHistory: [chatSchema],
  buildStatus: {
    type: String,
    enum: ['success', 'error', 'building', 'pending'],
    default: 'pending'
  },
  deploymentInfo: {
    platform: {
      type: String,
      enum: ['vercel', 'netlify', 'railway', 'render']
    },
    url: String,
    status: {
      type: String,
      enum: ['deployed', 'deploying', 'failed', 'pending']
    },
    lastDeploy: Date
  },
  metadata: {
    aiModel: String,
    generationTime: Number,
    codeQuality: {
      type: Number,
      min: 0,
      max: 100
    },
    accessibilityScore: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  version: {
    type: String,
    default: '1.0.0'
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

// Indexes for performance
projectSchema.index({ owner: 1, createdAt: -1 });
projectSchema.index({ isPublic: 1, createdAt: -1 });
projectSchema.index({ projectType: 1 });
projectSchema.index({ 'name': 'text', 'description': 'text' });

// Calculate total project size
projectSchema.methods.calculateTotalSize = function() {
  this.totalSize = this.files.reduce((total, file) => total + (file.size || 0), 0);
  return this.totalSize;
};

// Add file to project
projectSchema.methods.addFile = function(fileData) {
  const existingFileIndex = this.files.findIndex(f => f.path === fileData.path);
  
  if (existingFileIndex !== -1) {
    // Update existing file
    this.files[existingFileIndex] = { ...this.files[existingFileIndex], ...fileData };
  } else {
    // Add new file
    this.files.push(fileData);
  }
  
  this.calculateTotalSize();
};

// Virtual for file count
projectSchema.virtual('fileCount').get(function() {
  return this.files.length;
});

export default mongoose.model('Project', projectSchema);
