const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user || !req.user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

// Role-based access
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this resource`
      });
    }
    next();
  };
};

// Can approve orders (director, builder, chairperson)
const canApprove = authorize('director', 'builder', 'chairperson', 'admin');

// Can request materials (site_engineer + all contractors)
const canRequest = authorize(
  'site_engineer', 'civil_contractor', 'plumbing_contractor', 'color_contractor',
  'lift_contractor', 'electric_contractor', 'tile_contractor',
  'acp_contractor', 'aluminium_contractor', 'door_lock_contractor',
  'director', 'builder', 'admin'
);

// Is vendor
const isVendor = authorize('vendor');

// Is delivery operator
const isDelivery = authorize('delivery_operator', 'site_engineer', 'admin');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

module.exports = { protect, authorize, canApprove, canRequest, isVendor, isDelivery, generateToken };
