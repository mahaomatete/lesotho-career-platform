const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();
const instituteController = require('../controllers/instituteController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Validation rules
const updateProfileValidation = [
  body('institutionName').optional().trim().notEmpty(),
  body('address').optional().trim(),
  body('phone').optional().trim(),
  body('website').optional().isURL(),
  body('description').optional().trim(),
  body('logo').optional().isURL()
];

const facultyValidation = [
  body('name').notEmpty().trim(),
  body('description').optional().trim(),
  body('dean').optional().trim(),
  body('contactEmail').optional().isEmail(),
  body('phone').optional().trim()
];

const courseValidation = [
  body('name').notEmpty().trim(),
  body('code').notEmpty().trim(),
  body('facultyId').notEmpty(),
  body('description').notEmpty().trim(),
  body('duration').isInt({ min: 1, max: 6 }), // 1-6 years
  body('tuitionFee').isFloat({ min: 0 }),
  body('maxStudents').isInt({ min: 1 }),
  body('requirements').optional().isArray(),
  body('deadline').isISO8601(),
  body('startDate').isISO8601()
];

const applicationStatusValidation = [
  body('status').isIn(['pending', 'admitted', 'rejected', 'waiting_list']),
  body('notes').optional().trim()
];

const publishAdmissionsValidation = [
  body('courseId').notEmpty(),
  body('admittedStudents').isArray().notEmpty()
];

// All institute routes require authentication and institute role
router.use(authenticateToken);
router.use(authorizeRoles('institute'));

// Dashboard routes
router.get('/dashboard', instituteController.getDashboard);

// Profile routes
router.put('/profile', updateProfileValidation, instituteController.updateProfile);

// Faculty management routes
router.post('/faculties', facultyValidation, instituteController.createFaculty);
router.get('/faculties', instituteController.getFaculties);
router.put('/faculties/:facultyId', facultyValidation, instituteController.updateFaculty);

// Course management routes
router.post('/courses', courseValidation, instituteController.createCourse);
router.get('/courses', instituteController.getCourses);
router.put('/courses/:courseId', instituteController.updateCourse);

// Application management routes - FIXED
router.get('/applications', instituteController.getApplications);
router.patch('/applications/:applicationId/status', applicationStatusValidation, instituteController.updateApplicationStatus);
router.post('/admissions/publish', publishAdmissionsValidation, instituteController.publishAdmissions);

// Student management routes
router.get('/students', instituteController.getStudents);

// Export routes
router.get('/exports/applications', async (req, res) => {
  try {
    const instituteId = req.user.uid;
    
    // Get applications for export
    const applicationsSnapshot = await require('../config/firebase').db
      .collection('applications')
      .where('instituteId', '==', instituteId)
      .get();

    const applications = applicationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Enrich with student and course info
    const enrichedApplications = await Promise.all(
      applications.map(async (app) => {
        const [studentDoc, courseDoc] = await Promise.all([
          require('../config/firebase').db.collection('users').doc(app.studentId).get(),
          require('../config/firebase').db.collection('courses').doc(app.courseId).get()
        ]);

        const studentData = studentDoc.exists ? studentDoc.data() : {};
        const courseData = courseDoc.exists ? courseDoc.data() : {};

        return {
          applicationId: app.id,
          studentName: `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim(),
          studentEmail: studentData.email,
          courseName: courseData.name,
          courseCode: courseData.code,
          status: app.status,
          appliedAt: app.appliedAt,
          processedAt: app.processedAt
        };
      })
    );

    res.json({
      success: true,
      data: {
        applications: enrichedApplications,
        exportDate: new Date().toISOString(),
        totalRecords: enrichedApplications.length
      }
    });

  } catch (error) {
    console.error('Export applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting applications'
    });
  }
});

module.exports = router;