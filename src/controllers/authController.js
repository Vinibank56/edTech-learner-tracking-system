
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const setTokenCookies = require("../utils/setTokenCookies.js");
const generateTokens = require("../utils/generateTokens.js");

const signup = async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body;
    
    // Validate
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields required' });
    }
    
    // Check existing
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const user = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      role // First user is admin
    });
    await user.save();
    
    // Generate tokens
    const tokens = generateTokens(user);
    await User.updateOne(
      { _id: user._id },
      { $push: { refreshTokens: tokens.refreshToken } }
    );
    setTokenCookies(res, tokens);
    
    res.status(201).json({
      success: true,
      user: { id: user._id, email, name, role: user.role }
    });
    
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const tokens = generateTokens(user);
    await User.updateOne(
      { _id: user._id },
      { $push: { refreshTokens: tokens.refreshToken } }
    );
    setTokenCookies(res, tokens);
    
    res.json({
      success: true,
      user: { id: user._id, email: user.email, name: user.name, role: user.role }
    });
    
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }
    
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(403).json({ error: 'User not found' });
    }
    
    const tokenExists = user.refreshTokens.includes(refreshToken);
    if (!tokenExists) {
      return res.status(403).json({ error: 'Token revoked' });
    }
    
    const newTokens = generateTokens(user);
    await User.updateOne(
      { _id: user._id },
      {
        $pull: { refreshTokens: refreshToken },
        $push: { refreshTokens: newTokens.refreshToken }
      }
    );
    setTokenCookies(res, newTokens);
    
    res.json({ success: true });
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired', needsRefresh: false });
    }
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      await User.updateOne(
        { refreshTokens: refreshToken },
        { $pull: { refreshTokens: refreshToken } }
      );
    }
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

module.exports = { signup, login, refresh, logout };