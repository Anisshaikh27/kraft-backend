// routes/auth.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// routes/auth.js - Add debugging to signup route
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    console.log('🔍 Signup request received:', {
      name: name,
      email: email,
      password: password ? '***' : 'MISSING',
      hasName: !!name,
      hasEmail: !!email,
      hasPassword: !!password
    });

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('❌ User already exists:', email);
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('🔍 Password hashing result:', {
      originalLength: password.length,
      hashedLength: hashedPassword.length,
      hashedPrefix: hashedPassword.substring(0, 7)
    });

    // Create new user
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=00b4d8&color=ffffff`,
      isOAuthUser: false // Explicitly set this
    };

    console.log('🔍 Creating user with data:', {
      name: userData.name,
      email: userData.email,
      hasPassword: !!userData.password,
      passwordLength: userData.password ? userData.password.length : 0,
      isOAuthUser: userData.isOAuthUser
    });

    const user = new User(userData);
    await user.save();

    console.log('🔍 User saved successfully:', {
      id: user._id,
      email: user.email,
      hasPassword: !!user.password,
      passwordInDB: user.password ? user.password.substring(0, 7) + '...' : 'MISSING'
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    logger.info(`New user created: ${email}`);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Signup error:', error);
    logger.error('Signup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user'
    });
  }
});



// routes/auth.js - Add debugging to login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // DEBUG: Log what we received (don't log passwords in production!)
    console.log('🔍 Backend received login request:', {
      email: email,
      password: password ? '***' : 'MISSING',
      hasEmail: !!email,
      hasPassword: !!password
    });
    
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Always lower-case for lookup
    const user = await User.findOne({ email: email.toLowerCase() });
    
    console.log('🔍 Database lookup result:', {
      userFound: !!user,
      hasPassword: user && !!user.password,
      isOAuthUser: user && user.isOAuthUser
    });

    // User not found or missing password (i.e. OAuth user, corrupt data, etc)
    if (!user || typeof user.password !== 'string' || !user.password) {
      console.log('❌ User not found or no password');
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // bcrypt.compare returns false if not a valid bcrypt hash!
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    console.log('🔍 Password comparison result:', {
      isValid: isValidPassword,
      passwordType: typeof user.password,
      passwordStartsWith: user.password.substring(0, 7) // Show hash prefix
    });
    
    if (!isValidPassword) {
      console.log('❌ Invalid password');
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Success: Generate JWT Token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Optionally update lastLogin
    user.lastLogin = new Date();
    await user.save();

    console.log('✅ Login successful for:', email);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to login'
    });
  }
});

// OAuth login endpoint
router.post('/oauth', async (req, res) => {
  try {
    const { provider, name, email, avatar } = req.body;

    if (!provider || !email) {
      return res.status(400).json({
        success: false,
        error: 'Provider and email are required'
      });
    }

    // Check if user exists
    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // Update existing user
      user.lastLogin = new Date();
      if (avatar) user.avatar = avatar;
      await user.save();
    } else {
      // Create new user
      user = new User({
        name: name || 'OAuth User',
        email: email.toLowerCase().trim(),
        password: await bcrypt.hash(Math.random().toString(36), 10), // Random password for OAuth users
        avatar: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=00b4d8&color=ffffff`,
        oauthProvider: provider,
        isOAuthUser: true
      });

      await user.save();
      logger.info(`New OAuth user created: ${email} (${provider})`);
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      message: 'OAuth login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        provider: user.oauthProvider,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    logger.error('OAuth login error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete OAuth login'
    });
  }
});

// Get current user - FIXED VERSION
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');

    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    res.json({ 
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
    
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get user data' 
    });
  }
});

// Logout endpoint
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    // In a production app, you might want to blacklist the token
    // For now, we'll just return success (client will remove token)
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to logout'
    });
  }
});

export default router;
