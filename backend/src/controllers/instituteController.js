const { db } = require('../config/firebase');
const { validationResult } = require('express-validator');

const instituteController = {
  // Get institute dashboard
  async getDashboard(req, res) {
    try {
      const instituteId = req.user.uid;

      const [
        instituteDoc,
        coursesSnapshot,
        applicationsSnapshot,
        facultiesSnapshot,
        studentsSnapshot
      ] = await Promise.all([
        db.collection('users').doc(instituteId).get(),
        db.collection('courses').where('instituteId', '==', instituteId).get(),
        db.collection('applications').where('instituteId', '==', instituteId).get(),
        db.collection('faculties').where('instituteId', '==', instituteId).get(),
        db.collection('applications')
          .where('instituteId', '==', instituteId)
          .where('status', '==', 'admitted')
          .get()
      ]);

      if (!instituteDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Institute not found'
        });
      }

      const instituteData = instituteDoc.data();
      const courses = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const applications = applicationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const faculties = facultiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const admittedStudents = studentsSnapshot.docs.map(doc => doc.data());

      // Calculate statistics
      const pendingApplications = applications.filter(app => app.status === 'pending').length;
      const admittedApplications = applications.filter(app => app.status === 'admitted').length;
      const rejectedApplications = applications.filter(app => app.status === 'rejected').length;
      const waitingListApplications = applications.filter(app => app.status === 'waiting_list').length;

      // Get recent applications (last 5)
      const recentApplications = await Promise.all(
        applications
          .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt))
          .slice(0, 5)
          .map(async (app) => {
            const [studentDoc, courseDoc] = await Promise.all([
              db.collection('users').doc(app.studentId).get(),
              db.collection('courses').doc(app.courseId).get()
            ]);

            const studentData = studentDoc.exists ? studentDoc.data() : {};
            const courseData = courseDoc.exists ? courseDoc.data() : {};

            return {
              id: app.id,
              studentName: `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim(),
              studentEmail: studentData.email,
              courseName: courseData.name,
              status: app.status,
              appliedAt: app.appliedAt
            };
          })
      );

      // Get courses nearing capacity
      const coursesNearingCapacity = courses.filter(course => {
        const filledPercentage = (course.currentStudents / course.maxStudents) * 100;
        return filledPercentage >= 80 && filledPercentage < 100;
      });

      // Get admission statistics by course
      const courseAdmissionStats = await Promise.all(
        courses.map(async (course) => {
          const courseApplications = applications.filter(app => app.courseId === course.id);
          const courseAdmitted = courseApplications.filter(app => app.status === 'admitted').length;
          
          return {
            courseName: course.name,
            totalApplications: courseApplications.length,
            admitted: courseAdmitted,
            admissionRate: courseApplications.length > 0 ? 
              Math.round((courseAdmitted / courseApplications.length) * 100) : 0,
            capacityUsed: course.maxStudents > 0 ? 
              Math.round((course.currentStudents / course.maxStudents) * 100) : 0
          };
        })
      );

      res.json({
        success: true,
        data: {
          instituteInfo: {
            name: instituteData.institutionName,
            email: instituteData.email,
            isApproved: instituteData.isApproved,
            profileComplete: calculateInstituteProfileCompleteness(instituteData)
          },
          stats: {
            totalCourses: courses.length,
            totalApplications: applications.length,
            pendingApplications,
            admittedApplications,
            rejectedApplications,
            waitingListApplications,
            totalFaculties: faculties.length,
            activeCourses: courses.filter(course => course.status === 'active').length,
            totalStudents: admittedStudents.length,
            admissionRate: applications.length > 0 ? 
              Math.round((admittedApplications / applications.length) * 100) : 0
          },
          recentApplications,
          coursesNearingCapacity,
          courseAdmissionStats,
          upcomingDeadlines: getUpcomingDeadlines(courses)
        }
      });

    } catch (error) {
      console.error('Get institute dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Update institute profile
  async updateProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const instituteId = req.user.uid;
      const updateData = req.body;

      // Remove fields that shouldn't be updated
      delete updateData.email;
      delete updateData.role;
      delete updateData.isApproved;

      updateData.updatedAt = new Date();

      await db.collection('users').doc(instituteId).update(updateData);

      // Get updated institute data
      const instituteDoc = await db.collection('users').doc(instituteId).get();
      const instituteData = instituteDoc.data();
      const { password, ...instituteProfile } = instituteData;

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: instituteProfile
      });

    } catch (error) {
      console.error('Update institute profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Create faculty
  async createFaculty(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const instituteId = req.user.uid;
      const { name, description, dean, contactEmail, phone } = req.body;

      // Check if faculty with same name already exists for this institute
      const existingFacultySnapshot = await db.collection('faculties')
        .where('instituteId', '==', instituteId)
        .where('name', '==', name)
        .get();

      if (!existingFacultySnapshot.empty) {
        return res.status(400).json({
          success: false,
          message: 'Faculty with this name already exists'
        });
      }

      const facultyData = {
        instituteId,
        name,
        description,
        dean,
        contactEmail,
        phone: phone || '',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const facultyRef = await db.collection('faculties').add(facultyData);

      res.status(201).json({
        success: true,
        message: 'Faculty created successfully',
        data: {
          id: facultyRef.id,
          ...facultyData
        }
      });

    } catch (error) {
      console.error('Create faculty error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Get all faculties for institute
  async getFaculties(req, res) {
    try {
      const instituteId = req.user.uid;
      const { page = 1, limit = 10, activeOnly = 'false' } = req.query;

      let query = db.collection('faculties').where('instituteId', '==', instituteId);

      if (activeOnly === 'true') {
        query = query.where('isActive', '==', true);
      }

      const snapshot = await query.get();
      const faculties = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedFaculties = faculties.slice(startIndex, endIndex);

      // Get course counts for each faculty
      const facultiesWithStats = await Promise.all(
        paginatedFaculties.map(async (faculty) => {
          const coursesSnapshot = await db.collection('courses')
            .where('facultyId', '==', faculty.id)
            .get();

          const courses = coursesSnapshot.docs.map(doc => doc.data());
          const totalStudents = courses.reduce((sum, course) => sum + course.currentStudents, 0);

          return {
            ...faculty,
            stats: {
              totalCourses: coursesSnapshot.size,
              activeCourses: courses.filter(course => course.status === 'active').length,
              totalStudents
            }
          };
        })
      );

      res.json({
        success: true,
        data: {
          faculties: facultiesWithStats,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(faculties.length / limit),
            totalItems: faculties.length,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Get faculties error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Update faculty
  async updateFaculty(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const instituteId = req.user.uid;
      const { facultyId } = req.params;
      const updateData = req.body;

      // Verify the faculty belongs to this institute
      const facultyDoc = await db.collection('faculties').doc(facultyId).get();
      
      if (!facultyDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Faculty not found'
        });
      }

      const facultyData = facultyDoc.data();
      if (facultyData.instituteId !== instituteId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      updateData.updatedAt = new Date();
      await db.collection('faculties').doc(facultyId).update(updateData);

      res.json({
        success: true,
        message: 'Faculty updated successfully'
      });

    } catch (error) {
      console.error('Update faculty error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Create course
  async createCourse(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const instituteId = req.user.uid;
      const {
        name,
        code,
        facultyId,
        description,
        duration,
        tuitionFee,
        maxStudents,
        requirements,
        deadline,
        startDate
      } = req.body;

      // Verify the faculty belongs to this institute
      const facultyDoc = await db.collection('faculties').doc(facultyId).get();
      if (!facultyDoc.exists || facultyDoc.data().instituteId !== instituteId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid faculty'
        });
      }

      // Check if course with same code already exists
      const existingCourseSnapshot = await db.collection('courses')
        .where('instituteId', '==', instituteId)
        .where('code', '==', code)
        .get();

      if (!existingCourseSnapshot.empty) {
        return res.status(400).json({
          success: false,
          message: 'Course with this code already exists'
        });
      }

      const courseData = {
        instituteId,
        facultyId,
        name,
        code,
        description,
        duration: parseInt(duration), // in years
        tuitionFee: parseFloat(tuitionFee),
        maxStudents: parseInt(maxStudents),
        currentStudents: 0,
        requirements: requirements || [],
        deadline: new Date(deadline),
        startDate: new Date(startDate),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const courseRef = await db.collection('courses').add(courseData);

      res.status(201).json({
        success: true,
        message: 'Course created successfully',
        data: {
          id: courseRef.id,
          ...courseData
        }
      });

    } catch (error) {
      console.error('Create course error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Get all courses for institute
  async getCourses(req, res) {
    try {
      const instituteId = req.user.uid;
      const { 
        page = 1, 
        limit = 10, 
        status = 'all',
        facultyId = 'all',
        search = '' 
      } = req.query;

      let query = db.collection('courses').where('instituteId', '==', instituteId);

      // Apply filters
      if (status !== 'all') {
        query = query.where('status', '==', status);
      }

      if (facultyId !== 'all') {
        query = query.where('facultyId', '==', facultyId);
      }

      const snapshot = await query.get();
      let courses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Apply search filter
      if (search) {
        courses = courses.filter(course =>
          course.name.toLowerCase().includes(search.toLowerCase()) ||
          course.code.toLowerCase().includes(search.toLowerCase())
        );
      }

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedCourses = courses.slice(startIndex, endIndex);

      // Get faculty info and application counts for each course
      const coursesWithDetails = await Promise.all(
        paginatedCourses.map(async (course) => {
          const [facultyDoc, applicationsSnapshot] = await Promise.all([
            db.collection('faculties').doc(course.facultyId).get(),
            db.collection('applications').where('courseId', '==', course.id).get()
          ]);

          const facultyData = facultyDoc.exists ? facultyDoc.data() : { name: 'Unknown Faculty' };
          const applications = applicationsSnapshot.docs.map(doc => doc.data());

          return {
            ...course,
            facultyName: facultyData.name,
            stats: {
              totalApplications: applications.length,
              pendingApplications: applications.filter(app => app.status === 'pending').length,
              admittedApplications: applications.filter(app => app.status === 'admitted').length,
              rejectedApplications: applications.filter(app => app.status === 'rejected').length,
              filledPercentage: course.maxStudents > 0 ? 
                Math.round((course.currentStudents / course.maxStudents) * 100) : 0,
              admissionRate: applications.length > 0 ? 
                Math.round((applications.filter(app => app.status === 'admitted').length / applications.length) * 100) : 0
            }
          };
        })
      );

      res.json({
        success: true,
        data: {
          courses: coursesWithDetails,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(courses.length / limit),
            totalItems: courses.length,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Get courses error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Update course
  async updateCourse(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const instituteId = req.user.uid;
      const { courseId } = req.params;
      const updateData = req.body;

      // Verify the course belongs to this institute
      const courseDoc = await db.collection('courses').doc(courseId).get();
      
      if (!courseDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      const courseData = courseDoc.data();
      if (courseData.instituteId !== instituteId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Don't allow updating currentStudents directly through this endpoint
      delete updateData.currentStudents;

      // Convert numeric fields if present
      if (updateData.duration) updateData.duration = parseInt(updateData.duration);
      if (updateData.tuitionFee) updateData.tuitionFee = parseFloat(updateData.tuitionFee);
      if (updateData.maxStudents) updateData.maxStudents = parseInt(updateData.maxStudents);

      updateData.updatedAt = new Date();
      await db.collection('courses').doc(courseId).update(updateData);

      res.json({
        success: true,
        message: 'Course updated successfully'
      });

    } catch (error) {
      console.error('Update course error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Get applications for institute - FIXED VERSION
  async getApplications(req, res) {
    try {
      const instituteId = req.user.uid;
      const { 
        page = 1, 
        limit = 10, 
        status = 'all',
        courseId = 'all',
        search = '' 
      } = req.query;

      let query = db.collection('applications').where('instituteId', '==', instituteId);

      // Apply filters
      if (status !== 'all') {
        query = query.where('status', '==', status);
      }

      if (courseId !== 'all') {
        query = query.where('courseId', '==', courseId);
      }

      const snapshot = await query.get();
      let applications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedApplications = applications.slice(startIndex, endIndex);

      // Enrich applications with student and course info
      const enrichedApplications = await Promise.all(
        paginatedApplications.map(async (app) => {
          try {
            const [studentDoc, courseDoc] = await Promise.all([
              db.collection('users').doc(app.studentId).get(),
              db.collection('courses').doc(app.courseId).get()
            ]);

            const studentData = studentDoc.exists ? studentDoc.data() : {};
            const courseData = courseDoc.exists ? courseDoc.data() : {};

            // Get student documents count
            const transcriptsSnapshot = await db.collection('transcripts').where('studentId', '==', app.studentId).get();
            const certificatesSnapshot = await db.collection('certificates').where('studentId', '==', app.studentId).get();

            return {
              id: app.id,
              studentId: app.studentId,
              courseId: app.courseId,
              instituteId: app.instituteId,
              studentName: `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim(),
              studentEmail: studentData.email,
              studentPhone: studentData.phone,
              courseName: courseData.name,
              courseCode: courseData.code,
              facultyName: await getFacultyName(courseData.facultyId),
              personalStatement: app.personalStatement,
              status: app.status,
              appliedAt: app.appliedAt,
              processedAt: app.processedAt,
              notes: app.notes,
              documents: {
                transcripts: transcriptsSnapshot.size,
                certificates: certificatesSnapshot.size
              }
            };
          } catch (error) {
            console.error('Error enriching application:', error);
            return {
              id: app.id,
              studentId: app.studentId,
              courseId: app.courseId,
              studentName: 'Unknown Student',
              studentEmail: 'Unknown',
              courseName: 'Unknown Course',
              facultyName: 'Unknown Faculty',
              status: app.status,
              appliedAt: app.appliedAt,
              documents: { transcripts: 0, certificates: 0 }
            };
          }
        })
      );

      // Apply search filter on enriched data
      let filteredApplications = enrichedApplications;
      if (search) {
        filteredApplications = enrichedApplications.filter(app =>
          app.studentName.toLowerCase().includes(search.toLowerCase()) ||
          app.courseName.toLowerCase().includes(search.toLowerCase()) ||
          app.studentEmail.toLowerCase().includes(search.toLowerCase())
        );
      }

      res.json({
        success: true,
        data: {
          applications: filteredApplications,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(applications.length / limit),
            totalItems: applications.length,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Get applications error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Update application status - FIXED VERSION
  async updateApplicationStatus(req, res) {
    try {
      const instituteId = req.user.uid;
      const { applicationId } = req.params;
      const { status, notes } = req.body;

      console.log(`Updating application ${applicationId} to status: ${status}`);

      if (!['pending', 'admitted', 'rejected', 'waiting_list'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be: pending, admitted, rejected, or waiting_list'
        });
      }

      // Verify the application belongs to this institute
      const applicationDoc = await db.collection('applications').doc(applicationId).get();
      
      if (!applicationDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }

      const applicationData = applicationDoc.data();
      if (applicationData.instituteId !== instituteId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied - Application does not belong to your institute'
        });
      }

      const updateData = {
        status,
        processedAt: new Date(),
        processedBy: instituteId,
        updatedAt: new Date()
      };

      if (notes) {
        updateData.notes = notes;
      }

      // Get course info
      const courseDoc = await db.collection('courses').doc(applicationData.courseId).get();
      const courseData = courseDoc.exists ? courseDoc.data() : {};

      // If admitting a student, check course capacity and handle multiple admissions
      if (status === 'admitted') {
        if (courseData.currentStudents >= courseData.maxStudents) {
          return res.status(400).json({
            success: false,
            message: 'Course has reached maximum capacity'
          });
        }

        // Check if student is already admitted to another course in this institute
        const existingAdmissions = await db.collection('applications')
          .where('studentId', '==', applicationData.studentId)
          .where('instituteId', '==', instituteId)
          .where('status', '==', 'admitted')
          .get();

        if (!existingAdmissions.empty) {
          return res.status(400).json({
            success: false,
            message: 'Student is already admitted to another course in this institution'
          });
        }

        // Update course student count
        await db.collection('courses').doc(applicationData.courseId).update({
          currentStudents: (courseData.currentStudents || 0) + 1,
          updatedAt: new Date()
        });

        // Reject other applications from this student to this institute
        await handleMultipleApplications(applicationData.studentId, instituteId, applicationId);
      }

      // If moving from admitted to another status, adjust course count
      if (applicationData.status === 'admitted' && status !== 'admitted') {
        await db.collection('courses').doc(applicationData.courseId).update({
          currentStudents: Math.max(0, (courseData.currentStudents || 0) - 1),
          updatedAt: new Date()
        });
      }

      // Update the application
      await db.collection('applications').doc(applicationId).update(updateData);

      // Create notification for student
      await createApplicationStatusNotification(applicationData.studentId, status, applicationData.courseId);

      console.log(`Successfully updated application ${applicationId} to ${status}`);

      res.json({
        success: true,
        message: `Application ${status} successfully`
      });

    } catch (error) {
      console.error('Update application status error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error: ' + error.message
      });
    }
  },

  // Publish admissions (bulk update)
  async publishAdmissions(req, res) {
    try {
      const instituteId = req.user.uid;
      const { courseId, admittedStudents } = req.body;

      if (!courseId || !Array.isArray(admittedStudents)) {
        return res.status(400).json({
          success: false,
          message: 'Course ID and admitted students array are required'
        });
      }

      // Verify the course belongs to this institute
      const courseDoc = await db.collection('courses').doc(courseId).get();
      if (!courseDoc.exists || courseDoc.data().instituteId !== instituteId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied or course not found'
        });
      }

      const courseData = courseDoc.data();

      // Check if we're not exceeding course capacity
      if (admittedStudents.length > (courseData.maxStudents - courseData.currentStudents)) {
        return res.status(400).json({
          success: false,
          message: 'Number of admitted students exceeds course capacity'
        });
      }

      const batch = db.batch();
      const studentIds = [];

      // Update all admitted applications
      for (const applicationId of admittedStudents) {
        const applicationRef = db.collection('applications').doc(applicationId);
        const applicationDoc = await applicationRef.get();
        
        if (applicationDoc.exists) {
          const applicationData = applicationDoc.data();
          
          // Only process if application belongs to this institute and course
          if (applicationData.instituteId === instituteId && applicationData.courseId === courseId) {
            batch.update(applicationRef, {
              status: 'admitted',
              processedAt: new Date(),
              processedBy: instituteId,
              updatedAt: new Date()
            });
            
            studentIds.push(applicationData.studentId);
            
            // Create notification for student
            const notificationRef = db.collection('notifications').doc();
            batch.set(notificationRef, {
              userId: applicationData.studentId,
              type: 'application_update',
              title: 'Application Admitted',
              message: `Congratulations! You have been admitted to ${courseData.name}.`,
              isRead: false,
              createdAt: new Date(),
              data: {
                courseId: courseId,
                courseName: courseData.name,
                status: 'admitted'
              }
            });
          }
        }
      }

      // Update course student count
      const courseRef = db.collection('courses').doc(courseId);
      batch.update(courseRef, {
        currentStudents: courseData.currentStudents + admittedStudents.length,
        updatedAt: new Date()
      });

      await batch.commit();

      // Handle multiple applications for admitted students
      for (const studentId of studentIds) {
        await handleMultipleApplications(studentId, instituteId);
      }

      res.json({
        success: true,
        message: `Admissions published successfully for ${admittedStudents.length} students`
      });

    } catch (error) {
      console.error('Publish admissions error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Get student profiles for admitted students
  async getStudents(req, res) {
    try {
      const instituteId = req.user.uid;
      const { 
        page = 1, 
        limit = 10,
        status = 'admitted',
        courseId = 'all'
      } = req.query;

      let query = db.collection('applications').where('instituteId', '==', instituteId);

      if (status !== 'all') {
        query = query.where('status', '==', status);
      }

      if (courseId !== 'all') {
        query = query.where('courseId', '==', courseId);
      }

      const snapshot = await query.get();
      const applications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get unique student IDs
      const studentIds = [...new Set(applications.map(app => app.studentId))];

      // Apply pagination to student IDs
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedStudentIds = studentIds.slice(startIndex, endIndex);

      // Get student details
      const studentsWithDetails = await Promise.all(
        paginatedStudentIds.map(async (studentId) => {
          const [studentDoc, studentApplications, transcriptsSnapshot] = await Promise.all([
            db.collection('users').doc(studentId).get(),
            db.collection('applications')
              .where('studentId', '==', studentId)
              .where('instituteId', '==', instituteId)
              .get(),
            db.collection('transcripts').where('studentId', '==', studentId).get()
          ]);

          const studentData = studentDoc.exists ? studentDoc.data() : {};
          const applicationsData = studentApplications.docs.map(doc => doc.data());
          const currentApplication = applicationsData.find(app => app.studentId === studentId);

          // Find admitted course
          const admittedApplication = applicationsData.find(app => app.status === 'admitted');
          let admittedCourse = null;
          if (admittedApplication) {
            const courseDoc = await db.collection('courses').doc(admittedApplication.courseId).get();
            admittedCourse = courseDoc.exists ? courseDoc.data() : null;
          }

          return {
            studentId,
            studentName: `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim(),
            email: studentData.email,
            phone: studentData.phone,
            applications: applicationsData.map(app => ({
              courseId: app.courseId,
              status: app.status,
              appliedAt: app.appliedAt
            })),
            currentStatus: currentApplication?.status,
            admittedCourse: admittedCourse ? {
              name: admittedCourse.name,
              faculty: await getFacultyName(admittedCourse.facultyId)
            } : null,
            admittedApplicationId: admittedApplication?.id,
            documents: {
              transcripts: transcriptsSnapshot.size
            }
          };
        })
      );

      res.json({
        success: true,
        data: {
          students: studentsWithDetails,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(studentIds.length / limit),
            totalItems: studentIds.length,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Get students error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};

// Helper functions
async function handleMultipleApplications(studentId, instituteId, admittedApplicationId = null) {
  try {
    // Get all applications from this student to this institute
    const applicationsSnapshot = await db.collection('applications')
      .where('studentId', '==', studentId)
      .where('instituteId', '==', instituteId)
      .get();

    const batch = db.batch();

    for (const doc of applicationsSnapshot.docs) {
      const application = doc.data();
      
      // Skip the admitted application
      if (admittedApplicationId && doc.id === admittedApplicationId) {
        continue;
      }

      // If student is admitted to one course, reject or move to waiting list others
      if (application.status === 'pending') {
        const applicationRef = db.collection('applications').doc(doc.id);
        batch.update(applicationRef, {
          status: 'rejected',
          notes: 'Student admitted to another course in this institution',
          processedAt: new Date(),
          updatedAt: new Date()
        });

        // Create notification
        const notificationRef = db.collection('notifications').doc();
        batch.set(notificationRef, {
          userId: studentId,
          type: 'application_update',
          title: 'Application Updated',
          message: 'Your application status has been updated due to admission in another course.',
          isRead: false,
          createdAt: new Date()
        });
      }
    }

    await batch.commit();
  } catch (error) {
    console.error('Handle multiple applications error:', error);
  }
}

async function createApplicationStatusNotification(studentId, status, courseId) {
  const statusMessages = {
    admitted: 'Congratulations! You have been admitted to the course.',
    rejected: 'Your application has been reviewed and unfortunately not accepted.',
    waiting_list: 'You have been placed on the waiting list for the course.'
  };

  const courseDoc = await db.collection('courses').doc(courseId).get();
  const courseName = courseDoc.exists ? courseDoc.data().name : 'the course';

  await db.collection('notifications').add({
    userId: studentId,
    type: 'application_update',
    title: `Application Update - ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    message: statusMessages[status] || `Your application status has been updated to ${status}.`,
    data: {
      courseId,
      courseName,
      status
    },
    isRead: false,
    createdAt: new Date()
  });
}

async function getFacultyName(facultyId) {
  try {
    const facultyDoc = await db.collection('faculties').doc(facultyId).get();
    return facultyDoc.exists ? facultyDoc.data().name : 'Unknown Faculty';
  } catch (error) {
    return 'Unknown Faculty';
  }
}

function calculateInstituteProfileCompleteness(instituteData) {
  const requiredFields = ['institutionName', 'address', 'phone', 'description'];
  let completedFields = 0;

  requiredFields.forEach(field => {
    if (instituteData[field] && instituteData[field].toString().trim() !== '') {
      completedFields++;
    }
  });

  return (completedFields / requiredFields.length * 100).toFixed(0) + '%';
}

function getUpcomingDeadlines(courses) {
  const now = new Date();
  const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  return courses
    .filter(course => 
      course.deadline && 
      new Date(course.deadline) > now && 
      new Date(course.deadline) <= twoWeeksFromNow
    )
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 5);
}

module.exports = instituteController;