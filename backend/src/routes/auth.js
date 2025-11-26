const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['student', 'institute', 'company', 'admin']),
  body('firstName').if(body('role').equals('student')).notEmpty().trim(),
  body('lastName').if(body('role').equals('student')).notEmpty().trim(),
  body('firstName').if(body('role').equals('admin')).optional().trim(),
  body('lastName').if(body('role').equals('admin')).optional().trim(),
  body('institutionName').if(body('role').equals('institute')).notEmpty().trim(),
  body('companyName').if(body('role').equals('company')).notEmpty().trim()
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

const updateProfileValidation = [
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('institutionName').optional().trim().notEmpty(),
  body('companyName').optional().trim().notEmpty(),
  body('phone').optional().trim(),
  body('address').optional().trim()
];

const changePasswordValidation = [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
];

const deleteAccountValidation = [
  body('password').notEmpty()
];

// Public routes
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected routes (require authentication)
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, updateProfileValidation, authController.updateProfile);
router.put('/change-password', authenticateToken, changePasswordValidation, authController.changePassword);
router.delete('/account', authenticateToken, deleteAccountValidation, authController.deleteAccount);

// Test route for development
router.get('/test', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Auth test successful',
    user: req.user
  });
});

module.exports = router;