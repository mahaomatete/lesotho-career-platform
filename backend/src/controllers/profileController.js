const { db } = require('../config/firebase');
const { validationResult } = require('express-validator');

const profileController = {
  // Get user dashboard data based on role - UPDATED WITH COMPANY FIX
  async getDashboard(req, res) {
    try {
      const userId = req.user.uid;
      const userRole = req.user.role;

      const userDoc = await db.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const userData = userDoc.data();
      let dashboardData = {};

      switch (userRole) {
        case 'student':
          dashboardData = await getStudentDashboard(userId, userData);
          break;
        case 'institute':
          dashboardData = await getInstituteDashboard(userId, userData);
          break;
        case 'company':
          // Use the company-specific dashboard endpoint instead
          dashboardData = await getCompanyDashboard(userId, userData);
          break;
        case 'admin':
          dashboardData = await getAdminDashboard();
          break;
        default:
          dashboardData = { welcome: 'Welcome to Career Guidance Platform' };
      }

      res.json({
        success: true,
        data: dashboardData
      });

    } catch (error) {
      console.error('Get dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Update user profile information
  async updateProfileInfo(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const userId = req.user.uid;
      const {
        firstName,
        lastName,
        phone,
        address,
        dateOfBirth,
        gender,
        bio
      } = req.body;

      const updateData = {
        updatedAt: new Date()
      };

      // Add only provided fields to update
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (phone !== undefined) updateData.phone = phone;
      if (address !== undefined) updateData.address = address;
      if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
      if (gender !== undefined) updateData.gender = gender;
      if (bio !== undefined) updateData.bio = bio;

      await db.collection('users').doc(userId).update(updateData);

      // Get updated user data
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();
      const { password, ...userProfile } = userData;

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: userProfile
      });

    } catch (error) {
      console.error('Update profile info error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Get user notifications
  async getNotifications(req, res) {
    try {
      const userId = req.user.uid;

      // Get real notifications from database
      const notificationsSnapshot = await db.collection('notifications')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();

      const notifications = notificationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const unreadCount = notifications.filter(n => !n.isRead).length;

      res.json({
        success: true,
        data: {
          notifications: notifications,
          unreadCount: unreadCount
        }
      });

    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Mark notification as read
  async markNotificationAsRead(req, res) {
    try {
      const { notificationId } = req.params;
      const userId = req.user.uid;

      // Verify the notification belongs to the user
      const notificationDoc = await db.collection('notifications').doc(notificationId).get();
      
      if (!notificationDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      const notificationData = notificationDoc.data();
      
      if (notificationData.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Update notification as read
      await db.collection('notifications').doc(notificationId).update({
        isRead: true,
        readAt: new Date()
      });

      res.json({
        success: true,
        message: 'Notification marked as read'
      });

    } catch (error) {
      console.error('Mark notification as read error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Get user activity log
  async getActivityLog(req, res) {
    try {
      const userId = req.user.uid;
      const { limit = 20 } = req.query;

      // Get real activities from database
      const activitiesSnapshot = await db.collection('user_activities')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(parseInt(limit))
        .get();

      const activities = activitiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      res.json({
        success: true,
        data: {
          activities: activities,
          total: activities.length
        }
      });

    } catch (error) {
      console.error('Get activity log error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Get user statistics
  async getUserStats(req, res) {
    try {
      const userId = req.user.uid;
      const userRole = req.user.role;

      let stats = {};

      switch (userRole) {
        case 'student':
          stats = await getStudentStats(userId);
          break;
        case 'institute':
          stats = await getInstituteStats(userId);
          break;
        case 'company':
          stats = await getCompanyStats(userId);
          break;
        case 'admin':
          stats = await getAdminStats();
          break;
        default:
          stats = { message: 'No statistics available for this role' };
      }

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Update user preferences/settings
  async updatePreferences(req, res) {
    try {
      const userId = req.user.uid;
      const { preferences } = req.body;

      if (!preferences || typeof preferences !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'Preferences object is required'
        });
      }

      await db.collection('users').doc(userId).update({
        preferences: preferences,
        updatedAt: new Date()
      });

      res.json({
        success: true,
        message: 'Preferences updated successfully',
        data: { preferences }
      });

    } catch (error) {
      console.error('Update preferences error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Get user preferences
  async getPreferences(req, res) {
    try {
      const userId = req.user.uid;

      const userDoc = await db.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const userData = userDoc.data();
      const preferences = userData.preferences || getDefaultPreferences();

      res.json({
        success: true,
        data: { preferences }
      });

    } catch (error) {
      console.error('Get preferences error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Upload profile picture
  async uploadProfilePicture(req, res) {
    try {
      // This will be implemented when we set up file uploads
      // For now, we'll store the image URL in user profile
      const userId = req.user.uid;
      const { imageUrl } = req.body;

      if (!imageUrl) {
        return res.status(400).json({
          success: false,
          message: 'Image URL is required'
        });
      }

      await db.collection('users').doc(userId).update({
        profilePicture: imageUrl,
        updatedAt: new Date()
      });

      res.json({
        success: true,
        message: 'Profile picture updated successfully',
        data: {
          imageUrl: imageUrl
        }
      });

    } catch (error) {
      console.error('Upload profile picture error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};

// Helper functions for dashboard data - UPDATED COMPANY DASHBOARD
async function getStudentDashboard(userId, userData) {
  try {
    // Get real applications data
    const applicationsSnapshot = await db.collection('applications')
      .where('studentId', '==', userId)
      .get();

    const applications = applicationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get documents count
    const [transcriptsSnapshot, certificatesSnapshot] = await Promise.all([
      db.collection('transcripts').where('studentId', '==', userId).get(),
      db.collection('certificates').where('studentId', '==', userId).get()
    ]);

    // Calculate statistics from real data
    const pendingApplications = applications.filter(app => app.status === 'pending').length;
    const admittedApplications = applications.filter(app => app.status === 'admitted').length;
    const rejectedApplications = applications.filter(app => app.status === 'rejected').length;
    
    // Get unique institutions applied to
    const appliedInstitutions = [...new Set(applications.map(app => app.instituteId))].length;

    return {
      studentInfo: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        profileComplete: calculateProfileCompleteness(userData),
        profilePicture: userData.profilePicture
      },
      stats: {
        totalApplications: applications.length,
        pendingApplications,
        admittedApplications,
        rejectedApplications,
        appliedInstitutions,
        transcriptsUploaded: transcriptsSnapshot.size,
        certificatesUploaded: certificatesSnapshot.size,
        successRate: applications.length > 0 ? 
          Math.round((admittedApplications / applications.length) * 100) + '%' : '0%'
      }
    };
  } catch (error) {
    console.error('Error in getStudentDashboard:', error);
    return getEmptyStudentDashboard(userData);
  }
}

async function getInstituteDashboard(userId, userData) {
  try {
    // Get real courses data
    const coursesSnapshot = await db.collection('courses')
      .where('instituteId', '==', userId)
      .get();

    const courses = coursesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get all applications for this institute
    const applicationsSnapshot = await db.collection('applications')
      .where('instituteId', '==', userId)
      .get();

    const applications = applicationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get faculties count
    const facultiesSnapshot = await db.collection('faculties')
      .where('instituteId', '==', userId)
      .get();

    // Calculate statistics from real data
    const pendingApplications = applications.filter(app => app.status === 'pending').length;
    const admittedApplications = applications.filter(app => app.status === 'admitted').length;

    return {
      instituteInfo: {
        institutionName: userData.institutionName,
        email: userData.email,
        isApproved: userData.isApproved || false,
        profileComplete: calculateProfileCompleteness(userData),
        profilePicture: userData.profilePicture
      },
      stats: {
        totalCourses: courses.length,
        totalApplications: applications.length,
        pendingApplications,
        admittedStudents: admittedApplications,
        totalFaculties: facultiesSnapshot.size,
        activeCourses: courses.filter(course => course.status === 'active').length,
        admissionRate: applications.length > 0 ? 
          Math.round((admittedApplications / applications.length) * 100) + '%' : '0%'
      }
    };
  } catch (error) {
    console.error('Error in getInstituteDashboard:', error);
    return getEmptyInstituteDashboard(userData);
  }
}

// UPDATED: Company dashboard now uses basic data without calling external endpoints
async function getCompanyDashboard(userId, userData) {
  try {
    console.log(`🔄 Getting basic company dashboard for: ${userId}`);
    
    // Get basic company data
    const companyDoc = await db.collection('users').doc(userId).get();
    const companyData = companyDoc.exists ? companyDoc.data() : {};

    // Get basic counts for dashboard
    const [jobsSnapshot, applicationsSnapshot] = await Promise.all([
      db.collection('jobs').where('companyId', '==', userId).get().catch(() => ({ docs: [] })),
      db.collection('job_applications').where('companyId', '==', userId).get().catch(() => ({ docs: [] }))
    ]);

    const jobs = jobsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const applications = applicationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Calculate basic stats
    const activeJobs = jobs.filter(job => job.status === 'active').length;
    const totalApplications = applications.length;
    const hiredCandidates = applications.filter(app => app.status === 'hired').length;
    const qualifiedCandidates = applications.filter(app => (app.qualificationScore || 0) >= 70).length;

    return {
      companyInfo: {
        companyName: companyData.companyName || userData.companyName,
        email: companyData.email || userData.email,
        isApproved: companyData.isApproved || false,
        profileComplete: calculateProfileCompleteness(companyData)
      },
      stats: {
        totalJobs: jobs.length,
        activeJobs,
        totalApplications,
        newApplications: applications.filter(app => {
          try {
            return new Date(app.appliedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          } catch {
            return false;
          }
        }).length,
        shortlistedCandidates: applications.filter(app => app.status === 'shortlisted').length,
        hiredCandidates,
        qualifiedCandidates,
        applicationConversion: totalApplications > 0 ? 
          Math.round((hiredCandidates / totalApplications) * 100) + '%' : '0%'
      },
      recentApplications: applications
        .sort((a, b) => new Date(b.appliedAt || 0) - new Date(a.appliedAt || 0))
        .slice(0, 5)
        .map(app => ({
          id: app.id,
          studentName: 'Applicant',
          jobTitle: 'Position',
          qualificationScore: app.qualificationScore || 0,
          status: app.status || 'pending',
          appliedAt: app.appliedAt || new Date()
        })),
      jobsNearingDeadline: jobs.filter(job => {
        try {
          if (!job.deadline) return false;
          const timeToDeadline = new Date(job.deadline) - new Date();
          return timeToDeadline > 0 && timeToDeadline < 7 * 24 * 60 * 60 * 1000;
        } catch {
          return false;
        }
      }).slice(0, 3),
      qualifiedCandidates: applications
        .filter(app => (app.qualificationScore || 0) >= 70)
        .sort((a, b) => (b.qualificationScore || 0) - (a.qualificationScore || 0))
        .slice(0, 3)
        .map(candidate => ({
          studentName: 'Qualified Candidate',
          qualificationScore: candidate.qualificationScore || 0,
          jobId: candidate.jobId
        }))
    };

  } catch (error) {
    console.error('Error in getCompanyDashboard:', error);
    return getEmptyCompanyDashboard(userData);
  }
}

async function getAdminDashboard() {
  try {
    // Get real data counts from database
    const [
      usersSnapshot,
      institutionsSnapshot,
      companiesSnapshot,
      studentsSnapshot,
      applicationsSnapshot,
      jobsSnapshot
    ] = await Promise.all([
      db.collection('users').get(),
      db.collection('users').where('role', '==', 'institute').get(),
      db.collection('users').where('role', '==', 'company').get(),
      db.collection('users').where('role', '==', 'student').get(),
      db.collection('applications').get(),
      db.collection('jobs').get()
    ]);

    // Calculate pending approvals
    const pendingInstitutions = institutionsSnapshot.docs.filter(doc => !doc.data().isApproved);
    const pendingCompanies = companiesSnapshot.docs.filter(doc => !doc.data().isApproved);

    return {
      userInfo: {
        role: 'Administrator'
      },
      stats: {
        totalUsers: usersSnapshot.size,
        totalStudents: studentsSnapshot.size,
        totalInstitutions: institutionsSnapshot.size,
        totalCompanies: companiesSnapshot.size,
        totalApplications: applicationsSnapshot.size,
        activeJobs: jobsSnapshot.docs.filter(job => job.data().status === 'active').length,
        pendingApprovals: {
          institutions: pendingInstitutions.length,
          companies: pendingCompanies.length
        }
      }
    };
  } catch (error) {
    console.error('Error in getAdminDashboard:', error);
    return getEmptyAdminDashboard();
  }
}

// Statistics helper functions with real data
async function getStudentStats(userId) {
  try {
    const applicationsSnapshot = await db.collection('applications')
      .where('studentId', '==', userId)
      .get();

    const applications = applicationsSnapshot.docs.map(doc => doc.data());
    
    const statusCounts = applications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {});

    return {
      applicationStats: statusCounts,
      totalApplications: applications.length,
      successRate: applications.length > 0 ? 
        ((statusCounts.admitted || 0) / applications.length * 100).toFixed(1) + '%' : '0%'
    };
  } catch (error) {
    console.error('Error in getStudentStats:', error);
    return {
      applicationStats: {},
      totalApplications: 0,
      successRate: '0%'
    };
  }
}

async function getInstituteStats(userId) {
  try {
    const coursesSnapshot = await db.collection('courses')
      .where('instituteId', '==', userId)
      .get();

    const courses = coursesSnapshot.docs.map(doc => doc.data());
    
    let totalApplications = 0;
    let admittedStudents = 0;

    for (const course of courses) {
      const applicationsSnapshot = await db.collection('applications')
        .where('courseId', '==', course.id)
        .get();
      
      const courseApplications = applicationsSnapshot.docs.map(doc => doc.data());
      totalApplications += courseApplications.length;
      admittedStudents += courseApplications.filter(app => app.status === 'admitted').length;
    }

    const admissionRate = totalApplications > 0 ? 
      Math.round((admittedStudents / totalApplications) * 100) + '%' : '0%';

    return {
      totalStudents: admittedStudents,
      admissionRate: admissionRate
    };
  } catch (error) {
    console.error('Error in getInstituteStats:', error);
    return {
      totalStudents: 0,
      admissionRate: '0%'
    };
  }
}

async function getCompanyStats(userId) {
  try {
    const jobsSnapshot = await db.collection('jobs')
      .where('companyId', '==', userId)
      .get();

    const jobs = jobsSnapshot.docs.map(doc => doc.data());
    
    let totalApplications = 0;
    let totalHires = 0;

    for (const job of jobs) {
      const applicationsSnapshot = await db.collection('job_applications')
        .where('jobId', '==', job.id)
        .get();
      
      const jobApplications = applicationsSnapshot.docs.map(doc => doc.data());
      totalApplications += jobApplications.length;
      totalHires += jobApplications.filter(app => app.status === 'hired').length;
    }

    const applicationConversion = totalApplications > 0 ? 
      Math.round((totalHires / totalApplications) * 100) + '%' : '0%';

    return {
      totalHires: totalHires,
      applicationConversion: applicationConversion
    };
  } catch (error) {
    console.error('Error in getCompanyStats:', error);
    return {
      totalHires: 0,
      applicationConversion: '0%'
    };
  }
}

async function getAdminStats() {
  try {
    const usersSnapshot = await db.collection('users').get();
    const applicationsSnapshot = await db.collection('applications').get();
    const jobsSnapshot = await db.collection('jobs').get();

    return {
      systemUsers: usersSnapshot.size,
      activeApplications: applicationsSnapshot.size,
      activeJobs: jobsSnapshot.size
    };
  } catch (error) {
    console.error('Error in getAdminStats:', error);
    return {
      systemUsers: 0,
      activeApplications: 0,
      activeJobs: 0
    };
  }
}

// Helper function to calculate profile completeness
function calculateProfileCompleteness(userData) {
  let completedFields = 0;
  let totalFields = 0;

  // Define required fields for each role
  const studentFields = ['firstName', 'lastName', 'phone', 'address'];
  const instituteFields = ['institutionName', 'address', 'phone', 'description'];
  const companyFields = ['companyName', 'address', 'phone', 'description'];

  let requiredFields = [];
  
  switch (userData.role) {
    case 'student':
      requiredFields = studentFields;
      break;
    case 'institute':
      requiredFields = instituteFields;
      break;
    case 'company':
      requiredFields = companyFields;
      break;
    case 'admin':
      // Admin has no required profile fields
      requiredFields = [];
      break;
  }

  totalFields = requiredFields.length;

  requiredFields.forEach(field => {
    if (userData[field] && userData[field].toString().trim() !== '') {
      completedFields++;
    }
  });

  return totalFields > 0 ? (completedFields / totalFields * 100).toFixed(0) + '%' : '100%';
}

function getDefaultPreferences() {
  return {
    emailNotifications: true,
    pushNotifications: true,
    jobAlerts: true,
    newsletter: false,
    language: 'en',
    theme: 'light'
  };
}

// Empty dashboard fallbacks
function getEmptyStudentDashboard(userData) {
  return {
    studentInfo: {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      profileComplete: '0%',
      profilePicture: userData.profilePicture
    },
    stats: {
      totalApplications: 0,
      pendingApplications: 0,
      admittedApplications: 0,
      rejectedApplications: 0,
      transcriptsUploaded: 0,
      certificatesUploaded: 0
    }
  };
}

function getEmptyInstituteDashboard(userData) {
  return {
    instituteInfo: {
      institutionName: userData.institutionName,
      email: userData.email,
      isApproved: userData.isApproved || false,
      profileComplete: '0%',
      profilePicture: userData.profilePicture
    },
    stats: {
      totalCourses: 0,
      totalApplications: 0,
      pendingApplications: 0,
      admittedStudents: 0,
      faculties: 0
    }
  };
}

function getEmptyCompanyDashboard(userData) {
  return {
    companyInfo: {
      companyName: userData.companyName,
      email: userData.email,
      isApproved: userData.isApproved || false,
      profileComplete: '0%',
      profilePicture: userData.profilePicture
    },
    stats: {
      activeJobs: 0,
      totalApplications: 0,
      newApplications: 0,
      shortlistedCandidates: 0,
      interviewsScheduled: 0
    }
  };
}

function getEmptyAdminDashboard() {
  return {
    userInfo: {
      role: 'Administrator'
    },
    stats: {
      totalUsers: 0,
      totalStudents: 0,
      totalInstitutions: 0,
      totalCompanies: 0,
      pendingApprovals: 0,
      activeApplications: 0,
      activeJobs: 0
    }
  };
}

module.exports = profileController;