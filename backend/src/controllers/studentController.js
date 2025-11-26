const { db } = require('../config/firebase');
const { validationResult } = require('express-validator');

const studentController = {
  // Get student dashboard
  async getDashboard(req, res) {
    try {
      const studentId = req.user.uid;

      const [
        studentDoc,
        applicationsSnapshot,
        transcriptsSnapshot,
        certificatesSnapshot,
        jobApplicationsSnapshot
      ] = await Promise.all([
        db.collection('users').doc(studentId).get(),
        db.collection('applications').where('studentId', '==', studentId).get(),
        db.collection('transcripts').where('studentId', '==', studentId).get(),
        db.collection('certificates').where('studentId', '==', studentId).get(),
        db.collection('job_applications').where('studentId', '==', studentId).get()
      ]);

      if (!studentDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      const studentData = studentDoc.data();
      const applications = applicationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Calculate statistics
      const pendingApplications = applications.filter(app => app.status === 'pending').length;
      const admittedApplications = applications.filter(app => app.status === 'admitted').length;
      const rejectedApplications = applications.filter(app => app.status === 'rejected').length;
      
      // Get unique institutions applied to
      const appliedInstitutions = [...new Set(applications.map(app => app.instituteId))].length;

      // Get recent applications with course and institute info
      const recentApplications = await Promise.all(
        applications
          .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt))
          .slice(0, 5)
          .map(async (app) => {
            const courseDoc = await db.collection('courses').doc(app.courseId).get();
            const instituteDoc = await db.collection('users').doc(app.instituteId).get();
            
            return {
              id: app.id,
              courseName: courseDoc.exists ? courseDoc.data().name : 'Unknown Course',
              instituteName: instituteDoc.exists ? instituteDoc.data().institutionName : 'Unknown Institution',
              status: app.status,
              appliedAt: app.appliedAt
            };
          })
      );

      // Get job applications count
      const jobApplications = jobApplicationsSnapshot.docs.map(doc => doc.data());
      const pendingJobApplications = jobApplications.filter(app => app.status === 'pending').length;

      // Get recommended jobs based on student profile
      const recommendedJobs = await getRecommendedJobs(studentId);

      res.json({
        success: true,
        data: {
          studentInfo: {
            firstName: studentData.firstName,
            lastName: studentData.lastName,
            email: studentData.email,
            profileComplete: calculateProfileCompleteness(studentData),
            profilePicture: studentData.profilePicture
          },
          stats: {
            totalApplications: applications.length,
            pendingApplications,
            admittedApplications,
            rejectedApplications,
            appliedInstitutions,
            transcriptsUploaded: transcriptsSnapshot.size,
            certificatesUploaded: certificatesSnapshot.size,
            jobApplications: jobApplications.length,
            pendingJobApplications,
            successRate: applications.length > 0 ? 
              Math.round((admittedApplications / applications.length) * 100) + '%' : '0%'
          },
          recentApplications,
          recommendedJobs: recommendedJobs.slice(0, 3)
        }
      });

    } catch (error) {
      console.error('Get student dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Browse courses with proper filtering
  async getCourses(req, res) {
    try {
      const studentId = req.user.uid;
      const { 
        page = 1, 
        limit = 10, 
        search = '',
        institutionId = 'all',
        faculty = 'all',
        minFee = 0,
        maxFee = 1000000,
        sortBy = 'deadline' 
      } = req.query;

      let query = db.collection('courses').where('status', '==', 'active');

      // Apply institution filter
      if (institutionId !== 'all') {
        query = query.where('instituteId', '==', institutionId);
      }

      const snapshot = await query.get();
      let courses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Apply additional filters
      if (search) {
        courses = courses.filter(course =>
          course.name.toLowerCase().includes(search.toLowerCase()) ||
          course.description.toLowerCase().includes(search.toLowerCase()) ||
          course.code.toLowerCase().includes(search.toLowerCase())
        );
      }

      if (faculty !== 'all') {
        courses = courses.filter(course => course.facultyId === faculty);
      }

      // Filter by tuition fee range
      courses = courses.filter(course => 
        course.tuitionFee >= parseInt(minFee) && 
        course.tuitionFee <= parseInt(maxFee)
      );

      // Apply sorting
      if (sortBy === 'deadline') {
        courses.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
      } else if (sortBy === 'fee_low') {
        courses.sort((a, b) => a.tuitionFee - b.tuitionFee);
      } else if (sortBy === 'fee_high') {
        courses.sort((a, b) => b.tuitionFee - a.tuitionFee);
      } else if (sortBy === 'name') {
        courses.sort((a, b) => a.name.localeCompare(b.name));
      }

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedCourses = courses.slice(startIndex, endIndex);

      // Enrich courses with institution and faculty info
      const enrichedCourses = await Promise.all(
        paginatedCourses.map(async (course) => {
          const [instituteDoc, facultyDoc, applicationsSnapshot] = await Promise.all([
            db.collection('users').doc(course.instituteId).get(),
            db.collection('faculties').doc(course.facultyId).get(),
            db.collection('applications')
              .where('courseId', '==', course.id)
              .where('studentId', '==', studentId)
              .get()
          ]);

          const instituteData = instituteDoc.exists ? instituteDoc.data() : {};
          const facultyData = facultyDoc.exists ? facultyDoc.data() : {};

          const filledPercentage = course.maxStudents > 0 ? 
            Math.round((course.currentStudents / course.maxStudents) * 100) : 0;

          const hasApplied = !applicationsSnapshot.empty;
          const applicationData = hasApplied ? applicationsSnapshot.docs[0].data() : null;

          // Check if student qualifies for the course
          const qualificationCheck = await checkStudentQualification(studentId, course);

          return {
            ...course,
            instituteName: instituteData.institutionName,
            instituteLogo: instituteData.logo,
            facultyName: facultyData.name,
            stats: {
              totalApplications: (await db.collection('applications').where('courseId', '==', course.id).get()).size,
              filledPercentage,
              spotsLeft: course.maxStudents - course.currentStudents
            },
            hasApplied,
            applicationId: hasApplied ? applicationsSnapshot.docs[0].id : null,
            applicationStatus: applicationData?.status,
            canApply: qualificationCheck.canApply,
            qualificationMessage: qualificationCheck.message
          };
        })
      );

      res.json({
        success: true,
        data: {
          courses: enrichedCourses,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(courses.length / limit),
            totalItems: courses.length,
            itemsPerPage: parseInt(limit)
          },
          filters: {
            institutions: await getAvailableInstitutions(),
            faculties: await getAvailableFaculties()
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

  // Apply for course with proper validation
  async applyForCourse(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const studentId = req.user.uid;
      const { courseId, personalStatement, additionalInfo } = req.body;

      console.log(`Student ${studentId} applying for course ${courseId}`);

      // Get course details
      const courseDoc = await db.collection('courses').doc(courseId).get();
      
      if (!courseDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      const courseData = courseDoc.data();

      // Validation checks
      if (courseData.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'Course is not available for applications'
        });
      }

      if (new Date(courseData.deadline) < new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Application deadline has passed'
        });
      }

      if (courseData.currentStudents >= courseData.maxStudents) {
        return res.status(400).json({
          success: false,
          message: 'Course has reached maximum capacity'
        });
      }

      // Check qualification requirements
      const qualificationCheck = await checkStudentQualification(studentId, courseData);
      if (!qualificationCheck.canApply) {
        return res.status(400).json({
          success: false,
          message: qualificationCheck.message
        });
      }

      // Check if student has already applied to this course
      const existingApplicationSnapshot = await db.collection('applications')
        .where('courseId', '==', courseId)
        .where('studentId', '==', studentId)
        .get();

      if (!existingApplicationSnapshot.empty) {
        return res.status(400).json({
          success: false,
          message: 'You have already applied to this course'
        });
      }

      // Check application limit for this institution (max 2)
      const instituteApplicationsSnapshot = await db.collection('applications')
        .where('studentId', '==', studentId)
        .where('instituteId', '==', courseData.instituteId)
        .where('status', 'in', ['pending', 'admitted', 'waiting_list'])
        .get();

      if (instituteApplicationsSnapshot.size >= 2) {
        return res.status(400).json({
          success: false,
          message: 'You can only apply to maximum 2 courses per institution'
        });
      }

      // Create application
      const applicationData = {
        studentId,
        courseId,
        instituteId: courseData.instituteId,
        personalStatement: personalStatement || '',
        additionalInfo: additionalInfo || {},
        status: 'pending',
        appliedAt: new Date(),
        updatedAt: new Date()
      };

      const applicationRef = await db.collection('applications').add(applicationData);

      // Create notification for student
      await db.collection('notifications').add({
        userId: studentId,
        type: 'application_submitted',
        title: 'Application Submitted',
        message: `Your application for ${courseData.name} has been submitted successfully.`,
        isRead: false,
        createdAt: new Date(),
        data: {
          courseId: courseId,
          courseName: courseData.name,
          applicationId: applicationRef.id
        }
      });

      // Create notification for institute
      await db.collection('notifications').add({
        userId: courseData.instituteId,
        type: 'new_application',
        title: 'New Application Received',
        message: `New application received for ${courseData.name}`,
        isRead: false,
        createdAt: new Date(),
        data: {
          courseId: courseId,
          courseName: courseData.name,
          applicationId: applicationRef.id,
          studentId: studentId
        }
      });

      console.log(`Application created successfully: ${applicationRef.id}`);

      res.status(201).json({
        success: true,
        message: 'Application submitted successfully',
        data: {
          applicationId: applicationRef.id,
          courseName: courseData.name,
          instituteId: courseData.instituteId,
          status: 'pending',
          appliedAt: applicationData.appliedAt
        }
      });

    } catch (error) {
      console.error('Apply for course error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Get student applications with detailed info
  async getApplications(req, res) {
    try {
      const studentId = req.user.uid;
      const { 
        page = 1, 
        limit = 10, 
        status = 'all',
        sortBy = 'newest' 
      } = req.query;

      let query = db.collection('applications').where('studentId', '==', studentId);

      // Apply status filter
      if (status !== 'all') {
        query = query.where('status', '==', status);
      }

      const snapshot = await query.get();
      let applications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Apply sorting
      if (sortBy === 'newest') {
        applications.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
      } else if (sortBy === 'oldest') {
        applications.sort((a, b) => new Date(a.appliedAt) - new Date(b.appliedAt));
      } else if (sortBy === 'status') {
        applications.sort((a, b) => a.status.localeCompare(b.status));
      }

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedApplications = applications.slice(startIndex, endIndex);

      // Enrich applications with course and institute info
      const enrichedApplications = await Promise.all(
        paginatedApplications.map(async (app) => {
          const [courseDoc, instituteDoc] = await Promise.all([
            db.collection('courses').doc(app.courseId).get(),
            db.collection('users').doc(app.instituteId).get()
          ]);

          const courseData = courseDoc.exists ? courseDoc.data() : {};
          const instituteData = instituteDoc.exists ? instituteDoc.data() : {};

          return {
            ...app,
            courseName: courseData.name,
            courseCode: courseData.code,
            instituteName: instituteData.institutionName,
            deadline: courseData.deadline,
            tuitionFee: courseData.tuitionFee,
            facultyName: await getFacultyName(courseData.facultyId)
          };
        })
      );

      res.json({
        success: true,
        data: {
          applications: enrichedApplications,
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

  // Withdraw application
  async withdrawApplication(req, res) {
    try {
      const studentId = req.user.uid;
      const { applicationId } = req.params;

      // Verify the application belongs to this student
      const applicationDoc = await db.collection('applications').doc(applicationId).get();
      
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

      // Check if application can be withdrawn (only pending applications)
      if (applicationData.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Only pending applications can be withdrawn'
        });
      }

      // Get course info for notification
      const courseDoc = await db.collection('courses').doc(applicationData.courseId).get();
      const courseData = courseDoc.exists ? courseDoc.data() : {};

      // Delete the application
      await db.collection('applications').doc(applicationId).delete();

      // Create notification
      await db.collection('notifications').add({
        userId: studentId,
        type: 'application_withdrawn',
        title: 'Application Withdrawn',
        message: `Your application for ${courseData.name} has been withdrawn successfully.`,
        isRead: false,
        createdAt: new Date()
      });

      res.json({
        success: true,
        message: 'Application withdrawn successfully'
      });

    } catch (error) {
      console.error('Withdraw application error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Upload transcript
  async uploadTranscript(req, res) {
    try {
      const studentId = req.user.uid;
      const { 
        institutionName, 
        program, 
        yearCompleted, 
        grades, 
        gpa,
        fileUrl 
      } = req.body;

      const transcriptData = {
        studentId,
        institutionName,
        program,
        yearCompleted,
        grades,
        gpa,
        fileUrl,
        verified: false,
        uploadedAt: new Date(),
        updatedAt: new Date()
      };

      const transcriptRef = await db.collection('transcripts').add(transcriptData);

      // Create notification
      await db.collection('notifications').add({
        userId: studentId,
        type: 'transcript_uploaded',
        title: 'Transcript Uploaded',
        message: `Your transcript for ${program} has been uploaded successfully.`,
        isRead: false,
        createdAt: new Date()
      });

      res.status(201).json({
        success: true,
        message: 'Transcript uploaded successfully',
        data: {
          transcriptId: transcriptRef.id,
          ...transcriptData
        }
      });

    } catch (error) {
      console.error('Upload transcript error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Upload certificate
  async uploadCertificate(req, res) {
    try {
      const studentId = req.user.uid;
      const { 
        name, 
        issuingOrganization, 
        issueDate, 
        expiryDate, 
        credentialUrl,
        fileUrl 
      } = req.body;

      const certificateData = {
        studentId,
        name,
        issuingOrganization,
        issueDate: new Date(issueDate),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        credentialUrl,
        fileUrl,
        verified: false,
        uploadedAt: new Date(),
        updatedAt: new Date()
      };

      const certificateRef = await db.collection('certificates').add(certificateData);

      // Create notification
      await db.collection('notifications').add({
        userId: studentId,
        type: 'certificate_uploaded',
        title: 'Certificate Uploaded',
        message: `Your certificate ${name} has been uploaded successfully.`,
        isRead: false,
        createdAt: new Date()
      });

      res.status(201).json({
        success: true,
        message: 'Certificate uploaded successfully',
        data: {
          certificateId: certificateRef.id,
          ...certificateData
        }
      });

    } catch (error) {
      console.error('Upload certificate error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Get student documents
  async getDocuments(req, res) {
    try {
      const studentId = req.user.uid;

      const [transcriptsSnapshot, certificatesSnapshot] = await Promise.all([
        db.collection('transcripts').where('studentId', '==', studentId).get(),
        db.collection('certificates').where('studentId', '==', studentId).get()
      ]);

      const transcripts = transcriptsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const certificates = certificatesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      res.json({
        success: true,
        data: {
          transcripts,
          certificates
        }
      });

    } catch (error) {
      console.error('Get documents error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Browse and apply for jobs
  async getJobs(req, res) {
    try {
      const studentId = req.user.uid;
      const { 
        page = 1, 
        limit = 10, 
        search = '',
        jobType = 'all',
        location = 'all'
      } = req.query;

      let query = db.collection('jobs').where('status', '==', 'active');

      // Apply filters
      if (jobType !== 'all') {
        query = query.where('jobType', '==', jobType);
      }

      const snapshot = await query.get();
      let jobs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Apply search filter
      if (search) {
        jobs = jobs.filter(job =>
          job.title.toLowerCase().includes(search.toLowerCase()) ||
          job.description.toLowerCase().includes(search.toLowerCase()) ||
          job.department.toLowerCase().includes(search.toLowerCase())
        );
      }

      // Apply location filter
      if (location !== 'all') {
        jobs = jobs.filter(job => 
          job.location.toLowerCase().includes(location.toLowerCase())
        );
      }

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedJobs = jobs.slice(startIndex, endIndex);

      // Enrich jobs with company info and application status
      const enrichedJobs = await Promise.all(
        paginatedJobs.map(async (job) => {
          const [companyDoc, applicationSnapshot] = await Promise.all([
            db.collection('users').doc(job.companyId).get(),
            db.collection('job_applications')
              .where('jobId', '==', job.id)
              .where('studentId', '==', studentId)
              .get()
          ]);

          const companyData = companyDoc.exists ? companyDoc.data() : {};
          const hasApplied = !applicationSnapshot.empty;
          const applicationData = hasApplied ? applicationSnapshot.docs[0].data() : null;

          // Check qualification match
          const qualificationScore = await calculateJobQualificationScore(studentId, job);

          return {
            ...job,
            companyName: companyData.companyName,
            companyLogo: companyData.logo,
            hasApplied,
            applicationId: hasApplied ? applicationSnapshot.docs[0].id : null,
            applicationStatus: applicationData?.status,
            qualificationScore,
            isQualified: qualificationScore >= 70 // 70% match threshold
          };
        })
      );

      res.json({
        success: true,
        data: {
          jobs: enrichedJobs,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(jobs.length / limit),
            totalItems: jobs.length,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Get jobs error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Apply for job
  async applyForJob(req, res) {
    try {
      const studentId = req.user.uid;
      const { jobId, coverLetter } = req.body;

      // Get job details
      const jobDoc = await db.collection('jobs').doc(jobId).get();
      
      if (!jobDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        });
      }

      const jobData = jobDoc.data();

      // Validation checks
      if (jobData.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'Job is not available for applications'
        });
      }

      if (new Date(jobData.deadline) < new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Job application deadline has passed'
        });
      }

      // Check if already applied
      const existingApplicationSnapshot = await db.collection('job_applications')
        .where('jobId', '==', jobId)
        .where('studentId', '==', studentId)
        .get();

      if (!existingApplicationSnapshot.empty) {
        return res.status(400).json({
          success: false,
          message: 'You have already applied to this job'
        });
      }

      // Check qualification score
      const qualificationScore = await calculateJobQualificationScore(studentId, jobData);
      if (qualificationScore < 50) { // 50% minimum threshold
        return res.status(400).json({
          success: false,
          message: 'Your qualifications do not meet the minimum requirements for this job'
        });
      }

      // Create job application
      const applicationData = {
        studentId,
        jobId,
        companyId: jobData.companyId,
        coverLetter: coverLetter || '',
        qualificationScore,
        status: 'pending',
        appliedAt: new Date(),
        updatedAt: new Date()
      };

      const applicationRef = await db.collection('job_applications').add(applicationData);

      // Update job applications count
      await db.collection('jobs').doc(jobId).update({
        applicationsCount: (jobData.applicationsCount || 0) + 1,
        updatedAt: new Date()
      });

      // Create notifications
      await db.collection('notifications').add({
        userId: studentId,
        type: 'job_application_submitted',
        title: 'Job Application Submitted',
        message: `Your application for ${jobData.title} has been submitted.`,
        isRead: false,
        createdAt: new Date()
      });

      await db.collection('notifications').add({
        userId: jobData.companyId,
        type: 'new_job_application',
        title: 'New Job Application',
        message: `New application received for ${jobData.title}`,
        isRead: false,
        createdAt: new Date()
      });

      res.status(201).json({
        success: true,
        message: 'Job application submitted successfully',
        data: {
          applicationId: applicationRef.id,
          jobTitle: jobData.title,
          companyId: jobData.companyId,
          qualificationScore,
          status: 'pending'
        }
      });

    } catch (error) {
      console.error('Apply for job error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Get job applications
  async getJobApplications(req, res) {
    try {
      const studentId = req.user.uid;
      const { 
        page = 1, 
        limit = 10, 
        status = 'all'
      } = req.query;

      let query = db.collection('job_applications').where('studentId', '==', studentId);

      // Apply status filter
      if (status !== 'all') {
        query = query.where('status', '==', status);
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

      // Enrich applications with job and company info
      const enrichedApplications = await Promise.all(
        paginatedApplications.map(async (app) => {
          const [jobDoc, companyDoc] = await Promise.all([
            db.collection('jobs').doc(app.jobId).get(),
            db.collection('users').doc(app.companyId).get()
          ]);

          const jobData = jobDoc.exists ? jobDoc.data() : {};
          const companyData = companyDoc.exists ? companyDoc.data() : {};

          return {
            ...app,
            jobTitle: jobData.title,
            jobDepartment: jobData.department,
            companyName: companyData.companyName,
            location: jobData.location,
            jobType: jobData.jobType
          };
        })
      );

      res.json({
        success: true,
        data: {
          applications: enrichedApplications,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(applications.length / limit),
            totalItems: applications.length,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Get job applications error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};

// Helper functions
async function checkStudentQualification(studentId, course) {
  try {
    // This is a simplified qualification check
    // In a real application, you would check:
    // - Previous education levels
    // - Required subjects/grades
    // - Prerequisite courses
    // - Minimum GPA requirements
    
    const studentDoc = await db.collection('users').doc(studentId).get();
    const studentData = studentDoc.exists ? studentDoc.data() : {};

    // Check if student has required documents
    const transcriptsSnapshot = await db.collection('transcripts')
      .where('studentId', '==', studentId)
      .get();

    if (transcriptsSnapshot.empty) {
      return {
        canApply: false,
        message: 'You need to upload your academic transcripts before applying'
      };
    }

    // Basic high school completion check (simplified)
    const hasHighSchoolCompletion = transcriptsSnapshot.docs.some(doc => {
      const transcript = doc.data();
      return transcript.program && transcript.program.toLowerCase().includes('high school');
    });

    if (!hasHighSchoolCompletion && course.requirements?.includes('high_school')) {
      return {
        canApply: false,
        message: 'This course requires high school completion'
      };
    }

    return {
      canApply: true,
      message: 'You meet the basic requirements for this course'
    };

  } catch (error) {
    console.error('Qualification check error:', error);
    return {
      canApply: false,
      message: 'Unable to verify qualifications at this time'
    };
  }
}

async function calculateJobQualificationScore(studentId, job) {
  try {
    let score = 0;
    
    // Get student data
    const studentDoc = await db.collection('users').doc(studentId).get();
    const studentData = studentDoc.exists ? studentDoc.data() : {};

    // Get student documents
    const [transcriptsSnapshot, certificatesSnapshot] = await Promise.all([
      db.collection('transcripts').where('studentId', '==', studentId).get(),
      db.collection('certificates').where('studentId', '==', studentId).get()
    ]);

    const transcripts = transcriptsSnapshot.docs.map(doc => doc.data());
    const certificates = certificatesSnapshot.docs.map(doc => doc.data());

    // Education level matching (simplified)
    if (job.qualifications?.minEducation) {
      // Check if student meets minimum education requirement
      score += 30;
    }

    // Skills matching (simplified)
    if (job.qualifications?.requiredSkills) {
      // In real implementation, check student skills against required skills
      score += 20;
    }

    // Experience matching (simplified)
    if (job.qualifications?.minExperience) {
      // Check if student has required experience
      score += 20;
    }

    // Document completeness bonus
    if (transcripts.length > 0) score += 15;
    if (certificates.length > 0) score += 15;

    return Math.min(score, 100);

  } catch (error) {
    console.error('Qualification score calculation error:', error);
    return 0;
  }
}

async function getRecommendedJobs(studentId) {
  try {
    // Get active jobs
    const jobsSnapshot = await db.collection('jobs')
      .where('status', '==', 'active')
      .limit(10)
      .get();

    const jobs = jobsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Calculate qualification scores and return top matches
    const jobsWithScores = await Promise.all(
      jobs.map(async (job) => {
        const score = await calculateJobQualificationScore(studentId, job);
        return { ...job, qualificationScore: score };
      })
    );

    return jobsWithScores
      .filter(job => job.qualificationScore >= 70)
      .sort((a, b) => b.qualificationScore - a.qualificationScore);

  } catch (error) {
    console.error('Get recommended jobs error:', error);
    return [];
  }
}

async function getAvailableInstitutions() {
  try {
    const snapshot = await db.collection('users')
      .where('role', '==', 'institute')
      .where('isApproved', '==', true)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().institutionName
    }));
  } catch (error) {
    return [];
  }
}

async function getAvailableFaculties() {
  try {
    const snapshot = await db.collection('faculties').get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name
    }));
  } catch (error) {
    return [];
  }
}

async function getFacultyName(facultyId) {
  try {
    const facultyDoc = await db.collection('faculties').doc(facultyId).get();
    return facultyDoc.exists ? facultyDoc.data().name : 'Unknown Faculty';
  } catch (error) {
    return 'Unknown Faculty';
  }
}

function calculateProfileCompleteness(studentData) {
  const requiredFields = ['firstName', 'lastName', 'phone', 'address', 'dateOfBirth'];
  let completedFields = 0;

  requiredFields.forEach(field => {
    if (studentData[field] && studentData[field].toString().trim() !== '') {
      completedFields++;
    }
  });

  return (completedFields / requiredFields.length * 100).toFixed(0) + '%';
}

module.exports = studentController;