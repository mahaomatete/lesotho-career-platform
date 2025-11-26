const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(authorizeRoles('admin'));

// Validation rules
const addInstitutionValidation = [
  body('institutionName').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('address').optional().trim(),
  body('phone').optional().trim(),
  body('website').optional().isURL(),
  body('description').optional().trim(),
  body('type').optional().isIn(['university', 'college', 'technical', 'vocational', 'polytechnic']),
  body('establishedYear').optional().isInt({ min: 1800, max: new Date().getFullYear() }),
  body('accreditation').optional().trim()
];

const addCompanyValidation = [
  body('companyName').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('industry').optional().trim(),
  body('companySize').optional().isIn(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']),
  body('phone').optional().trim(),
  body('website').optional().isURL(),
  body('address').optional().trim(),
  body('description').optional().trim(),
  body('contactPerson').optional().isObject()
];

const facultyValidation = [
  body('name').notEmpty().trim(),
  body('description').optional().trim(),
  body('dean').optional().trim(),
  body('contactEmail').optional().isEmail()
];

const courseValidation = [
  body('name').notEmpty().trim(),
  body('code').notEmpty().trim(),
  body('facultyId').notEmpty(),
  body('description').notEmpty().trim(),
  body('duration').isInt({ min: 1, max: 6 }),
  body('tuitionFee').isFloat({ min: 0 }),
  body('maxStudents').isInt({ min: 1 }),
  body('requirements').optional().isArray(),
  body('deadline').isISO8601(),
  body('startDate').isISO8601()
];

const approveOrganizationValidation = [
  body('type').isIn(['institute', 'company'])
];

const toggleUserStatusValidation = [
  body('action').isIn(['suspend', 'activate'])
];

const reportValidation = [
  query('reportType').isIn(['user_registrations', 'application_stats', 'job_postings', 'system_usage']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
];

// Dashboard routes
router.get('/dashboard', adminController.getDashboardOverview);

// Institution management routes
router.get('/institutions', adminController.getInstitutions);
router.post('/institutions', addInstitutionValidation, adminController.addInstitution);
router.put('/institutions/:id', adminController.updateInstitution);
router.delete('/institutions/:id', adminController.deleteInstitution);

// Faculty management routes
router.get('/institutions/:id/faculties', adminController.getFaculties);
router.post('/institutions/:id/faculties', facultyValidation, adminController.addFaculty);
router.put('/institutions/:id/faculties/:facultyId', facultyValidation, adminController.updateFaculty);
router.delete('/institutions/:id/faculties/:facultyId', adminController.deleteFaculty);

// Course management routes
router.get('/institutions/:id/courses', adminController.getCourses);
router.post('/institutions/:id/courses', courseValidation, adminController.addCourse);
router.put('/institutions/:id/courses/:courseId', adminController.updateCourse);
router.delete('/institutions/:id/courses/:courseId', adminController.deleteCourse);

// Company management routes
router.get('/companies', adminController.getCompanies);
router.post('/companies', addCompanyValidation, adminController.addCompany);
router.put('/companies/:id', adminController.updateCompany);
router.patch('/companies/:id/status', toggleUserStatusValidation, adminController.toggleCompanyStatus);
router.delete('/companies/:id', adminController.deleteUser);

// Student management routes
router.get('/students', adminController.getStudents);
router.patch('/students/:id/status', toggleUserStatusValidation, adminController.toggleStudentStatus);

// Organization approval routes
router.post('/approve/:id', approveOrganizationValidation, adminController.approveOrganization);

// Reports routes
router.get('/reports', reportValidation, adminController.getSystemReports);

// System management routes
router.get('/system-health', async (req, res) => {
  try {
    const { db } = require('../config/firebase');
    
    // Test database connection
    await db.collection('users').limit(1).get();
    
    // Get system statistics
    const [
      usersCount,
      institutionsCount,
      companiesCount,
      studentsCount,
      coursesCount,
      jobsCount
    ] = await Promise.all([
      db.collection('users').get().then(snap => snap.size),
      db.collection('users').where('role', '==', 'institute').get().then(snap => snap.size),
      db.collection('users').where('role', '==', 'company').get().then(snap => snap.size),
      db.collection('users').where('role', '==', 'student').get().then(snap => snap.size),
      db.collection('courses').get().then(snap => snap.size),
      db.collection('jobs').get().then(snap => snap.size)
    ]);

    res.json({
      success: true,
      data: {
        status: 'operational',
        version: '1.0.0',
        environment: process.env.NODE_ENV,
        timestamp: new Date(),
        statistics: {
          totalUsers: usersCount,
          institutions: institutionsCount,
          companies: companiesCount,
          students: studentsCount,
          courses: coursesCount,
          jobs: jobsCount
        },
        services: {
          database: 'operational',
          authentication: 'operational',
          email: process.env.EMAIL_USER ? 'configured' : 'not configured'
        }
      }
    });
  } catch (error) {
    res.json({
      success: false,
      data: {
        status: 'degraded',
        version: '1.0.0',
        environment: process.env.NODE_ENV,
        timestamp: new Date(),
        error: error.message,
        services: {
          database: 'degraded',
          authentication: 'degraded',
          email: 'unknown'
        }
      }
    });
  }
});

module.exports = router;