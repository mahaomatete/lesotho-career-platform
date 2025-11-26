const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Validation rules
const applyForCourseValidation = [
  body('courseId').notEmpty().withMessage('Course ID is required'),
  body('personalStatement').optional().trim(),
  body('additionalInfo').optional().isObject()
];

const uploadTranscriptValidation = [
  body('institutionName').notEmpty().trim(),
  body('program').notEmpty().trim(),
  body('yearCompleted').isInt({ min: 1900, max: new Date().getFullYear() }),
  body('grades').optional().isObject(),
  body('gpa').optional().isFloat({ min: 0, max: 4.0 }),
  body('fileUrl').optional().isURL()
];

const uploadCertificateValidation = [
  body('name').notEmpty().trim(),
  body('issuingOrganization').notEmpty().trim(),
  body('issueDate').isISO8601(),
  body('expiryDate').optional().isISO8601(),
  body('credentialUrl').optional().isURL(),
  body('fileUrl').optional().isURL()
];

const applyForJobValidation = [
  body('jobId').notEmpty().withMessage('Job ID is required'),
  body('coverLetter').optional().trim()
];

// All student routes require authentication and student role
router.use(authenticateToken);
router.use(authorizeRoles('student'));

// Dashboard routes
router.get('/dashboard', studentController.getDashboard);

// Course management routes
router.get('/courses', studentController.getCourses);
router.post('/applications', applyForCourseValidation, studentController.applyForCourse);
router.get('/applications', studentController.getApplications);
router.delete('/applications/:applicationId', studentController.withdrawApplication);

// Document management routes
router.post('/transcripts', uploadTranscriptValidation, studentController.uploadTranscript);
router.post('/certificates', uploadCertificateValidation, studentController.uploadCertificate);
router.get('/documents', studentController.getDocuments);

// Job management routes
router.get('/jobs', studentController.getJobs);
router.post('/job-applications', applyForJobValidation, studentController.applyForJob);
router.get('/job-applications', studentController.getJobApplications);

// Additional routes for institutions and faculties
router.get('/institutions', async (req, res) => {
  try {
    const { db } = require('../config/firebase');
    const institutionsSnapshot = await db.collection('users')
      .where('role', '==', 'institute')
      .where('isApproved', '==', true)
      .get();

    const institutions = institutionsSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().institutionName
    }));

    res.json({
      success: true,
      data: { institutions }
    });
  } catch (error) {
    console.error('Get institutions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching institutions'
    });
  }
});

router.get('/faculties', async (req, res) => {
  try {
    const { db } = require('../config/firebase');
    const facultiesSnapshot = await db.collection('faculties').get();

    const faculties = facultiesSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name
    }));

    res.json({
      success: true,
      data: { faculties }
    });
  } catch (error) {
    console.error('Get faculties error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching faculties'
    });
  }
});

// Accept admission offer route
router.put('/applications/:applicationId/accept', async (req, res) => {
  try {
    const { applicationId } = req.params;
    const studentId = req.user.uid;

    const applicationDoc = await require('../config/firebase').db.collection('applications').doc(applicationId).get();
    
    if (!applicationDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    const applicationData = applicationDoc.data();
    
    if (applicationData.studentId !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (applicationData.status !== 'admitted') {
      return res.status(400).json({
        success: false,
        message: 'Only admitted applications can be accepted'
      });
    }

    // Update application status to accepted
    await require('../config/firebase').db.collection('applications').doc(applicationId).update({
      offerAccepted: true,
      acceptedAt: new Date(),
      updatedAt: new Date()
    });

    // Reject other applications from this student
    const otherApplicationsSnapshot = await require('../config/firebase').db.collection('applications')
      .where('studentId', '==', studentId)
      .where('status', '==', 'admitted')
      .where('offerAccepted', '!=', true)
      .get();

    const batch = require('../config/firebase').db.batch();
    otherApplicationsSnapshot.docs.forEach(doc => {
      if (doc.id !== applicationId) {
        batch.update(doc.ref, {
          status: 'rejected',
          notes: 'Student accepted another offer',
          updatedAt: new Date()
        });
      }
    });
    await batch.commit();

    res.json({
      success: true,
      message: 'Offer accepted successfully'
    });

  } catch (error) {
    console.error('Accept offer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error accepting offer'
    });
  }
});

module.exports = router;