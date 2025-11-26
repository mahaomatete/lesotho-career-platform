const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const instituteRoutes = require('./routes/institute');
const studentRoutes = require('./routes/student');
const companyRoutes = require('./routes/company');
const profileRoutes = require('./routes/profile');

// Import scripts for initial data setup
const createAdminUser = require('./scripts/createAdminUser');
const createSampleData = require('./scripts/createSampleData');
const cleanupApplications = require('./scripts/cleanupApplications');

const app = express();

// --- START: MODIFIED CORS CONFIGURATION ---

// CRITICAL: Get the frontend URL from the environment (will be your Vercel URL)
const CLIENT_URL = process.env.CLIENT_URL;

// Get the backend's own URL from Render environment (for health checks/pings)
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;

const allowedOrigins = [
  'http://localhost:3000', // For local development
];

if (CLIENT_URL) {
  // Add the Vercel production URL
  allowedOrigins.push(CLIENT_URL);
  // Also add common Vercel preview domains if they use a custom format (optional but safer)
  // Example if your Vercel URL is https://my-app.vercel.app, you might add:
  // allowedOrigins.push(new RegExp(`https://.*\.vercel\.app$`)); 
}

if (RENDER_EXTERNAL_URL) {
  // Allow Render's own URL for internal health checks/pings
  allowedOrigins.push(RENDER_EXTERNAL_URL); 
}

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Apply the dynamic CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, cURL, or server-to-server)
    if (!origin) return callback(null, true); 
    
    // Check if the origin is in the allowed list
    if (allowedOrigins.includes(origin) || allowedOrigins.find(url => origin.startsWith(url))) {
      callback(null, true);
    } else {
      console.log(`🚫 CORS blocked request from origin: ${origin}`);
      callback(new Error(`Not allowed by CORS: ${origin}`), false);
    }
  },
  credentials: true
}));

// --- END: MODIFIED CORS CONFIGURATION ---

app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/institute', instituteRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/profile', profileRoutes);

// Health check route with better error handling
app.get('/api/health', async (req, res) => {
  try {
    const { db } = require('./config/firebase');
    
    if (!db) {
      return res.status(503).json({ 
        success: false,
        message: 'Database service unavailable',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        database: 'disconnected',
        services: {
          api: 'operational',
          database: 'disconnected',
          authentication: 'disconnected'
        }
      });
    }
    
    // Check database connectivity
    await db.collection('users').limit(1).get();
    
    // Get basic statistics if database is connected
    let statistics = {};
    try {
      const usersCount = await db.collection('users').get().then(snap => snap.size);
      const applicationsCount = await db.collection('applications').get().then(snap => snap.size);
      const coursesCount = await db.collection('courses').get().then(snap => snap.size);
      const jobsCount = await db.collection('jobs').get().then(snap => snap.size);
      
      statistics = {
        totalUsers: usersCount,
        totalApplications: applicationsCount,
        totalCourses: coursesCount,
        totalJobs: jobsCount
      };
    } catch (statsError) {
      console.log('Statistics unavailable:', statsError.message);
    }

    res.status(200).json({ 
      success: true,
      message: 'Career Guidance Platform API is running!',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: 'connected',
      statistics: statistics,
      services: {
        api: 'operational',
        database: 'operational',
        authentication: 'operational'
      },
      version: '1.0.0'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      message: 'API is running but database connection failed',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: 'disconnected',
      services: {
        api: 'operational',
        database: 'disconnected',
        authentication: 'degraded'
      },
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});


// System info endpoint
app.get('/api/system/info', async (req, res) => {
  try {
    const { db } = require('./config/firebase');
    
    if (!db) {
      return res.json({
        success: false,
        message: 'Database service unavailable',
        data: {
          system: {
            name: 'Career Guidance Platform',
            version: '1.0.0',
            environment: process.env.NODE_ENV,
            status: 'degraded'
          },
          services: {
            database: 'disconnected'
          }
        }
      });
    }

    // Get system information
    const systemInfo = {
      system: {
        name: 'Career Guidance Platform',
        version: '1.0.0',
        environment: process.env.NODE_ENV,
        uptime: process.uptime(),
        status: 'operational'
      },
      services: {
        database: 'connected',
        authentication: 'operational',
        email: process.env.EMAIL_USER ? 'configured' : 'not configured'
      },
      serverTime: new Date().toISOString()
    };

    res.json({
      success: true,
      data: systemInfo
    });
  } catch (error) {
    console.error('System info error:', error);
    res.json({
      success: false,
      message: 'Failed to get system information',
      data: {
        system: {
          name: 'Career Guidance Platform',
          version: '1.0.0',
          environment: process.env.NODE_ENV,
          status: 'degraded'
        }
      }
    });
  }
});

// Development tools and utilities
if (process.env.NODE_ENV === 'development') {
  // Data cleanup endpoint for development
  app.post('/api/dev/cleanup-applications', async (req, res) => {
    try {
      console.log('🧹 Running applications cleanup...');
      await cleanupApplications();
      res.json({
        success: true,
        message: 'Applications cleanup completed successfully'
      });
    } catch (error) {
      console.error('Cleanup error:', error);
      res.status(500).json({
        success: false,
        message: 'Cleanup failed: ' + error.message
      });
    }
  });

  // Database statistics endpoint
  app.get('/api/dev/database-stats', async (req, res) => {
    try {
      const { db } = require('./config/firebase');
      
      if (!db) {
        return res.status(503).json({
          success: false,
          message: 'Database not available'
        });
      }

      const [
        usersSnapshot,
        studentsSnapshot,
        institutesSnapshot,
        companiesSnapshot,
        coursesSnapshot,
        applicationsSnapshot,
        jobsSnapshot,
        facultiesSnapshot
      ] = await Promise.all([
        db.collection('users').get(),
        db.collection('users').where('role', '==', 'student').get(),
        db.collection('users').where('role', '==', 'institute').get(),
        db.collection('users').where('role', '==', 'company').get(),
        db.collection('courses').get(),
        db.collection('applications').get(),
        db.collection('jobs').get(),
        db.collection('faculties').get()
      ]);

      // Check for corrupted applications
      const applications = applicationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const corruptedApplications = applications.filter(app => 
        !app.courseId || !app.studentId || !app.instituteId
      );

      const stats = {
        users: {
          total: usersSnapshot.size,
          students: studentsSnapshot.size,
          institutes: institutesSnapshot.size,
          companies: companiesSnapshot.size,
          admins: usersSnapshot.docs.filter(doc => doc.data().role === 'admin').length
        },
        academic: {
          courses: coursesSnapshot.size,
          faculties: facultiesSnapshot.size,
          applications: applicationsSnapshot.size,
          corruptedApplications: corruptedApplications.length
        },
        jobs: {
          total: jobsSnapshot.size,
          active: jobsSnapshot.docs.filter(doc => doc.data().status === 'active').length
        },
        system: {
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV
        }
      };

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Database stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get database statistics'
      });
    }
  });

  // Reset sample data endpoint
  app.post('/api/dev/reset-sample-data', async (req, res) => {
    try {
      console.log('🔄 Resetting sample data...');
      await createSampleData();
      res.json({
        success: true,
        message: 'Sample data reset successfully'
      });
    } catch (error) {
      console.error('Reset sample data error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reset sample data: ' + error.message
      });
    }
  });

  // Check application data integrity
  app.get('/api/dev/check-data-integrity', async (req, res) => {
    try {
      const { db } = require('./config/firebase');
      
      const applicationsSnapshot = await db.collection('applications').get();
      const applications = applicationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const integrityReport = {
        totalApplications: applications.length,
        validApplications: applications.filter(app => 
          app.courseId && app.studentId && app.instituteId
        ).length,
        corruptedApplications: applications.filter(app => 
          !app.courseId || !app.studentId || !app.instituteId
        ).length,
        issues: {
          missingCourseId: applications.filter(app => !app.courseId).length,
          missingStudentId: applications.filter(app => !app.studentId).length,
          missingInstituteId: applications.filter(app => !app.instituteId).length
        },
        recommendations: []
      };

      if (integrityReport.corruptedApplications > 0) {
        integrityReport.recommendations.push(
          `Run cleanup to remove ${integrityReport.corruptedApplications} corrupted applications`
        );
      }

      res.json({
        success: true,
        data: integrityReport
      });

    } catch (error) {
      console.error('Data integrity check error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check data integrity'
      });
    }
  });
}

// Root route with API documentation
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Career Guidance Platform API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    status: 'operational',
    documentation: {
      authentication: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/profile',
        verifyEmail: 'POST /api/auth/verify-email',
        forgotPassword: 'POST /api/auth/forgot-password',
        resetPassword: 'POST /api/auth/reset-password'
      },
      dashboard: {
        profile: 'GET /api/profile/dashboard',
        stats: 'GET /api/profile/stats',
        notifications: 'GET /api/profile/notifications'
      },
      admin: {
        dashboard: 'GET /api/admin/dashboard',
        institutions: 'GET /api/admin/institutions',
        companies: 'GET /api/admin/companies',
        students: 'GET /api/admin/students',
        reports: 'GET /api/admin/reports'
      },
      institute: {
        dashboard: 'GET /api/institute/dashboard',
        courses: 'GET /api/institute/courses',
        applications: 'GET /api/institute/applications',
        faculties: 'GET /api/institute/faculties',
        students: 'GET /api/institute/students'
      },
      student: {
        dashboard: 'GET /api/student/dashboard',
        courses: 'GET /api/student/courses',
        applications: 'GET /api/student/applications',
        jobs: 'GET /api/student/jobs',
        documents: 'GET /api/student/documents'
      },
      company: {
        dashboard: 'GET /api/company/dashboard',
        jobs: 'GET /api/company/jobs',
        applications: 'GET /api/company/applications',
        candidates: 'GET /api/company/qualified-candidates'
      },
      system: {
        health: 'GET /api/health',
        info: 'GET /api/system/info'
      },
      development: process.env.NODE_ENV === 'development' ? {
        cleanup: 'POST /api/dev/cleanup-applications',
        stats: 'GET /api/dev/database-stats',
        integrity: 'GET /api/dev/check-data-integrity',
        resetData: 'POST /api/dev/reset-sample-data'
      } : 'Available in development mode only'
    }
  });
});

// API status endpoint
app.get('/api/status', async (req, res) => {
  try {
    const { db } = require('./config/firebase');
    
    if (!db) {
      return res.json({
        success: false,
        status: 'degraded',
        services: {
          api: 'operational',
          database: 'disconnected',
          authentication: 'degraded'
        },
        lastChecked: new Date().toISOString(),
        message: 'Database connection issues detected'
      });
    }

    // Test database connection
    await db.collection('users').limit(1).get();
    
    res.json({
      success: true,
      status: 'operational',
      services: {
        api: 'operational',
        database: 'operational',
        authentication: 'operational'
      },
      lastChecked: new Date().toISOString()
    });
  } catch (error) {
    res.json({
      success: false,
      status: 'degraded',
      services: {
        api: 'operational',
        database: 'degraded',
        authentication: 'degraded'
      },
      lastChecked: new Date().toISOString(),
      message: 'Database connection issues detected'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('🚨 Error Stack:', err.stack);
  
  // Firebase specific errors
  if (err.code && err.code.startsWith('5')) {
    console.error('🔥 Firebase Error:', err.message);
    return res.status(503).json({ 
      success: false,
      message: 'Database service temporarily unavailable. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ 
      success: false,
      message: 'Invalid authentication token'
    });
  }
  
  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      success: false,
      message: 'Validation error',
      errors: err.details || err.message
    });
  }

  // Database connection errors
  if (err.message && err.message.includes('Firebase')) {
    return res.status(503).json({ 
      success: false,
      message: 'Database service unavailable',
      error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
  }

  res.status(500).json({ 
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    availableEndpoints: [
      'GET /',
      'GET /api/health',
      'GET /api/status',
      'GET /api/system/info',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'POST /api/auth/verify-email',
      'POST /api/auth/resend-verification',
      'POST /api/auth/forgot-password',
      'POST /api/auth/reset-password',
      'GET /api/auth/profile',
      'GET /api/profile/dashboard',
      'GET /api/student/dashboard',
      'GET /api/student/courses',
      'POST /api/student/applications',
      'GET /api/student/applications',
      'GET /api/student/jobs',
      'POST /api/student/job-applications',
      'GET /api/institute/dashboard',
      'GET /api/institute/applications',
      'GET /api/institute/courses',
      'GET /api/institute/students',
      'GET /api/company/dashboard',
      'GET /api/company/jobs',
      'GET /api/company/applications',
      ...(process.env.NODE_ENV === 'development' ? [
        'POST /api/dev/cleanup-applications',
        'GET /api/dev/database-stats',
        'GET /api/dev/check-data-integrity',
        'POST /api/dev/reset-sample-data'
      ] : [])
    ]
  });
});

// --- START: MODIFIED PORT LISTENING ---

// CRITICAL: Use Render's PORT environment variable or fallback to 5000
const PORT = process.env.PORT || 5000;

// Initialize data and start server
const initializeServer = async () => {
  try {
    console.log('🚀 Initializing Career Guidance Platform Server...');
    
    // Test Firebase connection first
    const { db } = require('./config/firebase');
    
    if (!db) {
      throw new Error('Firebase connection failed. Please check your configuration.');
    }
    
    // Test database connection
    console.log('🔌 Testing database connection...');
    await db.collection('users').limit(1).get();
    console.log('✅ Database connection successful');
    
    // Check data integrity
    console.log('🔍 Checking data integrity...');
    try {
      const applicationsSnapshot = await db.collection('applications').get();
      const applications = applicationsSnapshot.docs.map(doc => doc.data());
      const corruptedApplications = applications.filter(app => !app.courseId || !app.studentId);
      
      if (corruptedApplications.length > 0) {
        console.log(`⚠️  Found ${corruptedApplications.length} corrupted applications`);
        console.log('💡 Run POST /api/dev/cleanup-applications to fix this issue');
      } else {
        console.log('✅ All applications data is valid');
      }
    } catch (integrityError) {
      console.log('⚠️  Could not check data integrity:', integrityError.message);
    }
    
    // Create admin user (but don't fail if it doesn't work)
    console.log('👑 Setting up admin user...');
    try {
      await createAdminUser();
      console.log('✅ Admin user setup completed');
    } catch (adminError) {
      console.log('⚠️ Admin user creation skipped:', adminError.message);
    }
    
    // Create sample data for development (optional)
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Creating sample data for development...');
      try {
        await createSampleData();
        console.log('✅ Sample data creation completed');
      } catch (sampleError) {
        console.log('⚠️ Sample data creation skipped:', sampleError.message);
      }
    }
    
    // Start the server
    app.listen(PORT, () => {
      console.log('\n🎉 Server initialized successfully!');
      console.log('='.repeat(60));
      console.log(`📍 Server is running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      // Use RENDER_EXTERNAL_URL for the live host if available, otherwise localhost
      const hostUrl = RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
      console.log(`🔗 Health check: ${hostUrl}/api/health`);
      console.log(`🏠 API Home: ${hostUrl}/`);
      console.log(`⚡ System Info: ${hostUrl}/api/system/info`);
      
      console.log('\n📋 Key Endpoints:');
      console.log('   POST /api/auth/register          - Register new user');
      console.log('   POST /api/auth/login             - User login');
      console.log('   GET  /api/profile/dashboard      - User dashboard');
      console.log('   GET  /api/institute/applications - Institute applications');
      console.log('   GET  /api/student/courses        - Browse courses');
      console.log('   POST /api/student/applications   - Apply for course');
      
      if (process.env.NODE_ENV === 'development') {
        console.log('\n🔧 Development Tools:');
        console.log('   POST /api/dev/cleanup-applications - Fix corrupted data');
        console.log('   GET  /api/dev/database-stats       - Database statistics');
        console.log('   GET  /api/dev/check-data-integrity - Data integrity check');
        console.log('   POST /api/dev/reset-sample-data    - Reset sample data');
      }
      
      console.log('\n🔐 Default Logins:');
      console.log('   👑 Admin:    admin@careerplatform.com / admin123');
      console.log('   👨‍🎓 Student:  test@student.com / password123');
      console.log('   🏫 Institute: sample.university@edu.ls / institute123');
      console.log('   🏢 Company:  tech.solutions@company.ls / company123');
      
      console.log('='.repeat(60));
    });
    
  } catch (error) {
    console.error('\n❌ Server initialization failed:', error.message);
    console.log('\n💡 Troubleshooting tips:');
    console.log('  1. For Render: Check FIREBASE_SERVICE_ACCOUNT_KEY environment variable.');
    console.log('  2. For Local: Check if firebase-service-account.json exists.');
    console.log('  3. Verify Firebase project configuration.');
    
    // Start server anyway but with limited functionality
    console.log('\n⚠️ Starting server in degraded mode...');
    app.listen(PORT, () => {
      console.log(`\n📍 Server started in degraded mode on port ${PORT}`);
      console.log('❌ Database functionality will not work');
      console.log('✅ API endpoints will respond but may return errors');
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log('\n💡 Please fix Firebase configuration to restore full functionality');
    });
  }
};

// --- END: MODIFIED PORT LISTENING ---


// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  console.log('🔄 Server will continue running...');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  console.log('🔄 Server will continue running...');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Initialize and start the server
initializeServer();

module.exports = app;
