const { admin, db } = require('../config/firebase');
const jwt = require('jsonwebtoken');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userDoc = await db.collection('users').doc(decoded.uid).get();
    
    if (!userDoc.exists) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = userDoc.data();

    if (userData.isActive === false) {
      return res.status(401).json({
        success: false,
        message: 'Account is suspended'
      });
    }

    // For institutes and companies, check if they're approved
    if ((userData.role === 'institute' || userData.role === 'company') && !userData.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Account pending approval. Please wait for administrator approval.'
      });
    }

    req.user = {
      uid: decoded.uid,
      ...userData
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }
    next();
  };
};

// Middleware to check if user can post jobs (approved companies only)
const canPostJobs = (req, res, next) => {
  if (req.user.role === 'company' && !req.user.isApproved) {
    return res.status(403).json({
      success: false,
      message: 'Your company account must be approved before posting jobs'
    });
  }
  next();
};

// Middleware to check if user can manage courses (approved institutes only)
const canManageCourses = (req, res, next) => {
  if (req.user.role === 'institute' && !req.user.isApproved) {
    return res.status(403).json({
      success: false,
      message: 'Your institute account must be approved before managing courses'
    });
  }
  next();
};

module.exports = { 
  authenticateToken, 
  authorizeRoles,
  canPostJobs,
  canManageCourses
};