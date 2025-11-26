const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authenticateToken } = require('../middleware/auth');

// Validation rules
const updateProfileValidation = [
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('phone').optional().trim().isMobilePhone().withMessage('Invalid phone number'),
  body('address').optional().trim(),
  body('dateOfBirth').optional().isISO8601().withMessage('Invalid date format'),
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  body('bio').optional().trim()
];

const preferencesValidation = [
  body('preferences').isObject().withMessage('Preferences must be an object')
];

// All profile routes require authentication
router.use(authenticateToken);

// Profile routes
router.get('/dashboard', profileController.getDashboard);
router.get('/stats', profileController.getUserStats);
router.get('/notifications', profileController.getNotifications);
router.get('/activity', profileController.getActivityLog);
router.get('/preferences', profileController.getPreferences);

router.put('/info', updateProfileValidation, profileController.updateProfileInfo);
router.put('/preferences', preferencesValidation, profileController.updatePreferences);

router.post('/upload-picture', profileController.uploadProfilePicture);
router.patch('/notifications/:notificationId/read', profileController.markNotificationAsRead);

module.exports = router;