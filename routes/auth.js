import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';
import { validateSignup, validateLogin } from '../middleware/validation.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET, 
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// User signup
router.post('/signup', validateSignup, async (req, res) => {
  try {
    const { name, email, password, provider = 'email' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        error: 'User already exists with this email' 
      });
    }

    // Create new user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: provider === 'email' ? password : undefined,
      provider
    });

    await user.save();
    logger.info(`New user created: ${user.email}`);

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        provider: user.provider,
        avatar: user.avatar,
        preferences: user.preferences
      },
      token
    });

  } catch (error) {
    logger.error('Signup error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to create user' 
    });
  }
});

// User login
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+password');
      
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid email or password' 
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({ 
        success: false,
        error: 'Account is deactivated' 
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid email or password' 
      });
    }

    // Reset daily usage if needed
    user.resetDailyUsage();
    await user.save();

    logger.info(`User logged in: ${user.email}`);

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        provider: user.provider,
        avatar: user.avatar,
        preferences: user.preferences,
        usage: user.usage
      },
      token
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Login failed' 
    });
  }
});

// OAuth Login (Google/GitHub simulation)
router.post('/oauth', async (req, res) => {
  try {
    const { name, email, provider, providerId, avatar } = req.body;

    if (!name || !email || !provider) {
      return res.status(400).json({
        success: false,
        error: 'Missing required OAuth data'
      });
    }

    // Find or create user
    let user = await User.findOne({ 
      $or: [
        { email: email.toLowerCase().trim() },
        { provider, providerId }
      ]
    });

    if (!user) {
      user = new User({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        provider,
        providerId,
        avatar: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=00b4d8&color=ffffff`
      });
      await user.save();
      logger.info(`New OAuth user created: ${user.email} (${provider})`);
    } else {
      // Update user info if needed
      user.name = name.trim();
      user.avatar = avatar || user.avatar;
      user.resetDailyUsage();
      await user.save();
      logger.info(`OAuth user logged in: ${user.email} (${provider})`);
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'OAuth login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        provider: user.provider,
        avatar: user.avatar,
        preferences: user.preferences,
        usage: user.usage
      },
      token
    });

  } catch (error) {
    logger.error('OAuth error:', error);
    res.status(500).json({ 
      success: false,
      error: 'OAuth login failed' 
    });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select('-password')
      .populate('projects', 'name description createdAt');

    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    user.resetDailyUsage();
    await user.save();

    res.json({ 
      success: true,
      user 
    });
    
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get user data' 
    });
  }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, preferences } = req.body;
    const updates = {};

    if (name && name.trim()) {
      updates.name = name.trim();
    }

    if (preferences) {
      updates.preferences = { ...updates.preferences, ...preferences };
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    logger.info(`User profile updated: ${user.email}`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });

  } catch (error) {
    logger.error('Profile update error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update profile' 
    });
  }
});

// Logout (client-side token removal, server logs it)
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    logger.info(`User logged out: ${req.userId}`);
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Logout failed' 
    });
  }
});

export default router;
