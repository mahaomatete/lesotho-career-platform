const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Validation rules
const updateProfileValidation = [
  body('companyName').optional().trim().notEmpty(),
  body('address').optional().trim(),
  body('phone').optional().trim(),
  body('website').optional().isURL(),
  body('description').optional().trim(),
  body('industry').optional().trim(),
  body('size').optional().isIn(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']),
  body('logo').optional().isURL()
];

const jobValidation = [
  body('title').notEmpty().trim(),
  body('department').notEmpty().trim(),
  body('description').notEmpty().trim(),
  body('requirements').optional().isArray(),
  body('responsibilities').optional().isArray(),
  body('qualifications').optional().isObject(),
  body('location').notEmpty().trim(),
  body('jobType').isIn(['full-time', 'part-time', 'contract', 'internship']),
  body('salaryRange').optional().isObject(),
  body('deadline').isISO8601(),
  body('positionsAvailable').isInt({ min: 1 })
];

const applicationStatusValidation = [
  body('status').isIn(['pending', 'reviewed', 'shortlisted', 'rejected', 'hired']),
  body('notes').optional().trim(),
  body('interviewDate').optional().isISO8601()
];

const closeJobValidation = [
  body('reason').optional().trim()
];

// All company routes require authentication and company role
router.use(authenticateToken);
router.use(authorizeRoles('company'));

// ✅ DASHBOARD ROUTE - ADDED THIS
router.get('/dashboard', companyController.getDashboard);

// Profile routes
router.put('/profile', updateProfileValidation, companyController.updateProfile);

// Job management routes
router.post('/jobs', jobValidation, companyController.createJob);
router.get('/jobs', companyController.getJobs);
router.put('/jobs/:jobId', companyController.updateJob);
router.patch('/jobs/:jobId/close', closeJobValidation, companyController.closeJob);

// Application management routes
router.get('/applications', companyController.getJobApplications);
router.patch('/applications/:applicationId/status', applicationStatusValidation, companyController.updateApplicationStatus);

// Candidate management routes
router.get('/qualified-candidates', companyController.getQualifiedCandidates);
router.get('/candidates/:candidateId', companyController.getCandidateProfile);

module.exports = router;