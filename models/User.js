import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: function() {
      return this.provider === 'email';
    },
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  provider: {
    type: String,
    enum: ['email', 'google', 'github'],
    default: 'email'
  },
  providerId: String,
  avatar: {
    type: String,
    default: function() {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&background=00b4d8&color=ffffff`;
    }
  },
  projects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }],
  preferences: {
    defaultModel: {
      type: String,
      enum: ['gemini', 'groq', 'huggingface', 'together', 'deepseek'],
      default: 'gemini'
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'dark'
    },
    autoSave: {
      type: Boolean,
      default: true
    }
  },
  usage: {
    generationsToday: {
      type: Number,
      default: 0
    },
    lastReset: {
      type: Date,
      default: Date.now
    },
    totalGenerations: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for performance
userSchema.index({ email: 1 });
userSchema.index({ provider: 1, providerId: 1 });

// Pre-save hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Reset daily usage
userSchema.methods.resetDailyUsage = function() {
  const now = new Date();
  const lastReset = new Date(this.usage.lastReset);
  
  if (now.getDate() !== lastReset.getDate()) {
    this.usage.generationsToday = 0;
    this.usage.lastReset = now;
  }
};

export default mongoose.model('User', userSchema);
