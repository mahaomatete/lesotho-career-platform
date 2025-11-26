const { db } = require('../config/firebase');
const { validationResult } = require('express-validator');

const companyController = {
  // Get company dashboard - FIXED AND OPTIMIZED
  async getDashboard(req, res) {
    try {
      const companyId = req.user.uid;
      console.log(`📊 Fetching dashboard for company: ${companyId}`);

      // Get company data
      const companyDoc = await db.collection('users').doc(companyId).get();
      
      if (!companyDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Company not found'
        });
      }

      const companyData = companyDoc.data();
      console.log('✅ Company data loaded:', companyData.companyName);

      // Get all data in parallel with error handling
      const [
        jobsSnapshot,
        applicationsSnapshot,
        qualifiedCandidatesSnapshot
      ] = await Promise.all([
        db.collection('jobs').where('companyId', '==', companyId).get().catch(err => {
          console.error('Error fetching jobs:', err);
          return { docs: [] };
        }),
        db.collection('job_applications').where('companyId', '==', companyId).get().catch(err => {
          console.error('Error fetching applications:', err);
          return { docs: [] };
        }),
        db.collection('job_applications')
          .where('companyId', '==', companyId)
          .where('qualificationScore', '>=', 70)
          .get().catch(err => {
            console.error('Error fetching qualified candidates:', err);
            return { docs: [] };
          })
      ]);

      // Process data safely
      const jobs = jobsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const applications = applicationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const qualifiedCandidates = qualifiedCandidatesSnapshot.docs.map(doc => doc.data());

      console.log(`📈 Data counts - Jobs: ${jobs.length}, Applications: ${applications.length}, Qualified: ${qualifiedCandidates.length}`);

      // Calculate statistics with safe defaults
      const activeJobs = jobs.filter(job => job.status === 'active').length;
      const totalApplications = applications.length;
      const newApplications = applications.filter(app => {
        try {
          return new Date(app.appliedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        } catch (e) {
          return false;
        }
      }).length;
      
      const shortlistedCandidates = applications.filter(app => app.status === 'shortlisted').length;
      const hiredCandidates = applications.filter(app => app.status === 'hired').length;

      // Get recent applications with safe data handling
      const recentApplications = await Promise.all(
        applications
          .sort((a, b) => {
            try {
              return new Date(b.appliedAt || 0) - new Date(a.appliedAt || 0);
            } catch (e) {
              return 0;
            }
          })
          .slice(0, 5)
          .map(async (app) => {
            try {
              const [studentDoc, jobDoc] = await Promise.all([
                db.collection('users').doc(app.studentId).get().catch(() => ({ exists: false })),
                db.collection('jobs').doc(app.jobId).get().catch(() => ({ exists: false }))
              ]);

              const studentData = studentDoc.exists ? studentDoc.data() : {};
              const jobData = jobDoc.exists ? jobDoc.data() : {};

              return {
                id: app.id,
                studentName: studentData.firstName && studentData.lastName 
                  ? `${studentData.firstName} ${studentData.lastName}`.trim()
                  : 'Applicant',
                studentEmail: studentData.email || 'No email',
                jobTitle: jobData.title || 'Position',
                qualificationScore: app.qualificationScore || 0,
                status: app.status || 'pending',
                appliedAt: app.appliedAt || new Date()
              };
            } catch (error) {
              console.error('Error processing application:', error);
              return {
                id: app.id,
                studentName: 'Applicant',
                studentEmail: 'No email',
                jobTitle: 'Position',
                qualificationScore: 0,
                status: 'pending',
                appliedAt: new Date()
              };
            }
          })
      );

      // Get jobs nearing deadline safely
      const jobsNearingDeadline = jobs.filter(job => {
        try {
          if (!job.deadline) return false;
          const timeToDeadline = new Date(job.deadline) - new Date();
          return timeToDeadline > 0 && timeToDeadline < 7 * 24 * 60 * 60 * 1000;
        } catch (e) {
          return false;
        }
      }).slice(0, 3);

      // Get top qualified candidates safely
      const topQualifiedCandidates = await Promise.all(
        qualifiedCandidates
          .sort((a, b) => (b.qualificationScore || 0) - (a.qualificationScore || 0))
          .slice(0, 3)
          .map(async (candidate) => {
            try {
              const studentDoc = await db.collection('users').doc(candidate.studentId).get().catch(() => ({ exists: false }));
              const studentData = studentDoc.exists ? studentDoc.data() : {};
              
              return {
                studentName: studentData.firstName && studentData.lastName 
                  ? `${studentData.firstName} ${studentData.lastName}`.trim()
                  : 'Qualified Candidate',
                qualificationScore: candidate.qualificationScore || 0,
                studentId: candidate.studentId,
                applicationId: candidate.id
              };
            } catch (error) {
              return {
                studentName: 'Qualified Candidate',
                qualificationScore: candidate.qualificationScore || 0,
                studentId: candidate.studentId,
                applicationId: candidate.id
              };
            }
          })
      );

      const dashboardData = {
        companyInfo: {
          companyName: companyData.companyName,
          email: companyData.email,
          isApproved: companyData.isApproved || false,
          profileComplete: calculateCompanyProfileCompleteness(companyData)
        },
        stats: {
          totalJobs: jobs.length,
          activeJobs,
          totalApplications,
          newApplications,
          shortlistedCandidates,
          hiredCandidates,
          qualifiedCandidates: qualifiedCandidates.length,
          applicationConversion: totalApplications > 0 ? 
            Math.round((hiredCandidates / totalApplications) * 100) + '%' : '0%'
        },
        recentApplications: recentApplications.filter(app => app !== null),
        jobsNearingDeadline: jobsNearingDeadline,
        qualifiedCandidates: topQualifiedCandidates.filter(candidate => candidate !== null)
      };

      console.log('✅ Dashboard data prepared successfully');
      
      res.json({
        success: true,
        data: dashboardData
      });

    } catch (error) {
      console.error('❌ Get company dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error loading dashboard',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Create job posting
  async createJob(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const companyId = req.user.uid;
      const {
        title,
        department,
        description,
        requirements,
        responsibilities,
        qualifications,
        location,
        jobType,
        salaryRange,
        deadline,
        positionsAvailable
      } = req.body;

      const jobData = {
        companyId,
        title,
        department,
        description,
        requirements: requirements || [],
        responsibilities: responsibilities || [],
        qualifications: qualifications || {},
        location,
        jobType,
        salaryRange: salaryRange || {},
        deadline: new Date(deadline),
        positionsAvailable: parseInt(positionsAvailable),
        positionsFilled: 0,
        status: 'active',
        views: 0,
        applicationsCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const jobRef = await db.collection('jobs').add(jobData);

      // Notify qualified students
      await notifyQualifiedStudents(jobData, jobRef.id);

      res.status(201).json({
        success: true,
        message: 'Job posted successfully',
        data: {
          id: jobRef.id,
          ...jobData
        }
      });

    } catch (error) {
      console.error('Create job error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Get company jobs
  async getJobs(req, res) {
    try {
      const companyId = req.user.uid;
      const { 
        page = 1, 
        limit = 10, 
        status = 'all',
        search = '' 
      } = req.query;

      let query = db.collection('jobs').where('companyId', '==', companyId);

      if (status !== 'all') {
        query = query.where('status', '==', status);
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
          job.department.toLowerCase().includes(search.toLowerCase()) ||
          job.description.toLowerCase().includes(search.toLowerCase())
        );
      }

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedJobs = jobs.slice(startIndex, endIndex);

      // Get application counts for each job
      const jobsWithStats = await Promise.all(
        paginatedJobs.map(async (job) => {
          const applicationsSnapshot = await db.collection('job_applications')
            .where('jobId', '==', job.id)
            .get();

          const applications = applicationsSnapshot.docs.map(doc => doc.data());
          
          return {
            ...job,
            stats: {
              totalApplications: applications.length,
              newApplications: applications.filter(app => 
                new Date(app.appliedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              ).length,
              qualifiedApplications: applications.filter(app => app.qualificationScore >= 70).length,
              shortlisted: applications.filter(app => app.status === 'shortlisted').length,
              hired: applications.filter(app => app.status === 'hired').length
            }
          };
        })
      );

      res.json({
        success: true,
        data: {
          jobs: jobsWithStats,
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

  // Update job
  async updateJob(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const companyId = req.user.uid;
      const { jobId } = req.params;
      const updateData = req.body;

      // Verify the job belongs to this company
      const jobDoc = await db.collection('jobs').doc(jobId).get();
      
      if (!jobDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        });
      }

      const jobData = jobDoc.data();
      if (jobData.companyId !== companyId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Don't allow updating certain fields directly
      delete updateData.positionsFilled;
      delete updateData.applicationsCount;
      delete updateData.views;

      updateData.updatedAt = new Date();

      await db.collection('jobs').doc(jobId).update(updateData);

      res.json({
        success: true,
        message: 'Job updated successfully'
      });

    } catch (error) {
      console.error('Update job error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Close job
  async closeJob(req, res) {
    try {
      const companyId = req.user.uid;
      const { jobId } = req.params;
      const { reason } = req.body;

      // Verify the job belongs to this company
      const jobDoc = await db.collection('jobs').doc(jobId).get();
      
      if (!jobDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        });
      }

      const jobData = jobDoc.data();
      if (jobData.companyId !== companyId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      await db.collection('jobs').doc(jobId).update({
        status: 'closed',
        closedAt: new Date(),
        closeReason: reason,
        updatedAt: new Date()
      });

      res.json({
        success: true,
        message: 'Job closed successfully'
      });

    } catch (error) {
      console.error('Close job error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Get job applications
  async getJobApplications(req, res) {
    try {
      const companyId = req.user.uid;
      const { 
        page = 1, 
        limit = 10, 
        status = 'all',
        jobId = 'all',
        minScore = 0 
      } = req.query;

      let query = db.collection('job_applications').where('companyId', '==', companyId);

      // Apply filters
      if (status !== 'all') {
        query = query.where('status', '==', status);
      }

      if (jobId !== 'all') {
        query = query.where('jobId', '==', jobId);
      }

      const snapshot = await query.get();
      let applications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter by qualification score
      applications = applications.filter(app => app.qualificationScore >= minScore);

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedApplications = applications.slice(startIndex, endIndex);

      // Enrich applications with student and job info
      const enrichedApplications = await Promise.all(
        paginatedApplications.map(async (app) => {
          const [studentDoc, jobDoc, transcriptsSnapshot, certificatesSnapshot] = await Promise.all([
            db.collection('users').doc(app.studentId).get(),
            db.collection('jobs').doc(app.jobId).get(),
            db.collection('transcripts').where('studentId', '==', app.studentId).get(),
            db.collection('certificates').where('studentId', '==', app.studentId).get()
          ]);

          const studentData = studentDoc.exists ? studentDoc.data() : {};
          const jobData = jobDoc.exists ? jobDoc.data() : {};

          return {
            ...app,
            studentName: `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim(),
            studentEmail: studentData.email,
            studentPhone: studentData.phone,
            jobTitle: jobData.title,
            department: jobData.department,
            documents: {
              transcripts: transcriptsSnapshot.size,
              certificates: certificatesSnapshot.size
            }
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
  },

  // Update application status
  async updateApplicationStatus(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const companyId = req.user.uid;
      const { applicationId } = req.params;
      const { status, notes, interviewDate } = req.body;

      if (!['pending', 'reviewed', 'shortlisted', 'rejected', 'hired'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
      }

      // Verify the application belongs to this company
      const applicationDoc = await db.collection('job_applications').doc(applicationId).get();
      
      if (!applicationDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }

      const applicationData = applicationDoc.data();
      if (applicationData.companyId !== companyId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const updateData = {
        status,
        updatedAt: new Date()
      };

      if (notes) updateData.notes = notes;
      if (interviewDate) updateData.interviewDate = new Date(interviewDate);

      // If hiring, update job positions filled
      if (status === 'hired') {
        const jobDoc = await db.collection('jobs').doc(applicationData.jobId).get();
        const jobData = jobDoc.data();
        
        if (jobData.positionsFilled >= jobData.positionsAvailable) {
          return res.status(400).json({
            success: false,
            message: 'All positions for this job have been filled'
          });
        }

        await db.collection('jobs').doc(applicationData.jobId).update({
          positionsFilled: jobData.positionsFilled + 1,
          updatedAt: new Date()
        });
      }

      await db.collection('job_applications').doc(applicationId).update(updateData);

      // Create notification for student
      await createJobApplicationStatusNotification(applicationData.studentId, status, applicationData.jobId);

      res.json({
        success: true,
        message: `Application ${status} successfully`
      });

    } catch (error) {
      console.error('Update application status error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Get qualified candidates - FIXED TO USE REAL DATA
  async getQualifiedCandidates(req, res) {
    try {
      const companyId = req.user.uid;
      const { minScore = 70, page = 1, limit = 10 } = req.query;

      console.log(`🔍 Fetching qualified candidates for company: ${companyId}, minScore: ${minScore}`);

      // Get all applications with high qualification scores
      const applicationsSnapshot = await db.collection('job_applications')
        .where('companyId', '==', companyId)
        .where('qualificationScore', '>=', parseInt(minScore))
        .get();

      if (applicationsSnapshot.empty) {
        console.log('📭 No qualified candidates found');
        return res.json({
          success: true,
          data: {
            candidates: [],
            pagination: {
              currentPage: parseInt(page),
              totalPages: 0,
              totalItems: 0,
              itemsPerPage: parseInt(limit)
            }
          }
        });
      }

      let applications = applicationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log(`✅ Found ${applications.length} qualified applications`);

      // Sort by qualification score (descending)
      applications.sort((a, b) => (b.qualificationScore || 0) - (a.qualificationScore || 0));

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedApplications = applications.slice(startIndex, endIndex);

      console.log(`📄 Paginated to ${paginatedApplications.length} candidates`);

      // Enrich with detailed candidate info
      const qualifiedCandidates = await Promise.all(
        paginatedApplications.map(async (app) => {
          try {
            console.log(`👤 Enriching candidate data for student: ${app.studentId}`);
            
            const [studentDoc, jobDoc, transcriptsSnapshot, certificatesSnapshot] = await Promise.all([
              db.collection('users').doc(app.studentId).get().catch(err => {
                console.error(`Error fetching student ${app.studentId}:`, err);
                return { exists: false };
              }),
              db.collection('jobs').doc(app.jobId).get().catch(err => {
                console.error(`Error fetching job ${app.jobId}:`, err);
                return { exists: false };
              }),
              db.collection('transcripts').where('studentId', '==', app.studentId).get().catch(err => {
                console.error(`Error fetching transcripts for ${app.studentId}:`, err);
                return { docs: [] };
              }),
              db.collection('certificates').where('studentId', '==', app.studentId).get().catch(err => {
                console.error(`Error fetching certificates for ${app.studentId}:`, err);
                return { docs: [] };
              })
            ]);

            const studentData = studentDoc.exists ? studentDoc.data() : {};
            const jobData = jobDoc.exists ? jobDoc.data() : {};

            // Get academic performance from transcripts
            const transcripts = transcriptsSnapshot.docs.map(doc => doc.data());
            const averageGPA = transcripts.length > 0 ? 
              transcripts.reduce((sum, transcript) => sum + (transcript.gpa || 0), 0) / transcripts.length : 0;

            // Calculate experience years from student data
            const experienceYears = studentData.experienceYears || studentData.yearsOfExperience || 0;

            // Determine education level
            const educationLevel = getHighestEducationLevel(transcripts);

            console.log(`✅ Enriched candidate: ${studentData.firstName} ${studentData.lastName}, GPA: ${averageGPA.toFixed(2)}, Certs: ${certificatesSnapshot.size}`);

            return {
              applicationId: app.id,
              studentId: app.studentId,
              studentName: `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim() || 'Unknown Candidate',
              studentEmail: studentData.email || 'No email',
              studentPhone: studentData.phone || 'No phone',
              jobTitle: jobData.title || 'Unknown Position',
              qualificationScore: app.qualificationScore || 0,
              status: app.status || 'pending',
              academicPerformance: {
                averageGPA: averageGPA.toFixed(2),
                transcriptsCount: transcriptsSnapshot.size
              },
              certificatesCount: certificatesSnapshot.size,
              experience: experienceYears > 0 ? `${experienceYears} year${experienceYears > 1 ? 's' : ''}` : 'No experience',
              educationLevel: educationLevel,
              coverLetter: app.coverLetter || 'No cover letter provided.',
              appliedAt: app.appliedAt || new Date()
            };
          } catch (error) {
            console.error(`❌ Error enriching candidate ${app.id}:`, error);
            // Return basic candidate info if enrichment fails
            return {
              applicationId: app.id,
              studentId: app.studentId,
              studentName: 'Candidate',
              studentEmail: 'No email',
              studentPhone: 'No phone',
              jobTitle: 'Position',
              qualificationScore: app.qualificationScore || 0,
              status: app.status || 'pending',
              academicPerformance: {
                averageGPA: '0.00',
                transcriptsCount: 0
              },
              certificatesCount: 0,
              experience: 'No experience',
              educationLevel: 'Unknown',
              coverLetter: 'No cover letter provided.',
              appliedAt: app.appliedAt || new Date()
            };
          }
        })
      );

      // Filter out any null results from failed enrichments
      const validCandidates = qualifiedCandidates.filter(candidate => candidate !== null);

      console.log(`🎯 Returning ${validCandidates.length} valid qualified candidates`);

      res.json({
        success: true,
        data: {
          candidates: validCandidates,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(applications.length / limit),
            totalItems: applications.length,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('❌ Get qualified candidates error:', error);
      res.status(500).json({
        success: false,
        message: 'Error loading qualified candidates: ' + error.message
      });
    }
  },

  // Get candidate profile
  async getCandidateProfile(req, res) {
    try {
      const companyId = req.user.uid;
      const { candidateId } = req.params;

      console.log(`🔍 Fetching candidate profile: ${candidateId} for company: ${companyId}`);

      // Verify the company has applications from this candidate
      const applicationsSnapshot = await db.collection('job_applications')
        .where('companyId', '==', companyId)
        .where('studentId', '==', candidateId)
        .get();

      if (applicationsSnapshot.empty) {
        return res.status(403).json({
          success: false,
          message: 'Access denied - no applications found from this candidate'
        });
      }

      // Get candidate data
      const [studentDoc, transcriptsSnapshot, certificatesSnapshot, applications] = await Promise.all([
        db.collection('users').doc(candidateId).get(),
        db.collection('transcripts').where('studentId', '==', candidateId).get(),
        db.collection('certificates').where('studentId', '==', candidateId).get(),
        db.collection('job_applications')
          .where('studentId', '==', candidateId)
          .where('companyId', '==', companyId)
          .get()
      ]);

      if (!studentDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Candidate not found'
        });
      }

      const studentData = studentDoc.data();
      const transcripts = transcriptsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const certificates = certificatesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const jobApplications = applications.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Calculate overall qualification metrics
      const averageQualificationScore = jobApplications.length > 0 ?
        jobApplications.reduce((sum, app) => sum + (app.qualificationScore || 0), 0) / jobApplications.length : 0;

      const averageGPA = transcripts.length > 0 ?
        transcripts.reduce((sum, transcript) => sum + (transcript.gpa || 0), 0) / transcripts.length : 0;

      // Calculate total experience
      const totalExperience = studentData.experienceYears || studentData.yearsOfExperience || 0;

      console.log(`✅ Candidate profile loaded: ${studentData.firstName} ${studentData.lastName}`);

      res.json({
        success: true,
        data: {
          candidate: {
            id: candidateId,
            name: `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim(),
            email: studentData.email,
            phone: studentData.phone,
            address: studentData.address,
            dateOfBirth: studentData.dateOfBirth,
            bio: studentData.bio || 'No bio provided.',
            totalExperience: totalExperience
          },
          qualifications: {
            averageQualificationScore: averageQualificationScore.toFixed(1),
            averageGPA: averageGPA.toFixed(2),
            totalCertificates: certificates.length,
            totalTranscripts: transcripts.length,
            totalExperience: totalExperience
          },
          academic: {
            transcripts: transcripts,
            certificates: certificates
          },
          applications: jobApplications.map(app => ({
            applicationId: app.id,
            jobId: app.jobId,
            status: app.status,
            qualificationScore: app.qualificationScore,
            appliedAt: app.appliedAt,
            coverLetter: app.coverLetter
          }))
        }
      });

    } catch (error) {
      console.error('Get candidate profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Update company profile
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

      const companyId = req.user.uid;
      const updateData = req.body;

      // Remove fields that shouldn't be updated
      delete updateData.email;
      delete updateData.role;
      delete updateData.isApproved;

      updateData.updatedAt = new Date();

      await db.collection('users').doc(companyId).update(updateData);

      // Get updated company data
      const companyDoc = await db.collection('users').doc(companyId).get();
      const companyData = companyDoc.data();
      const { password, ...companyProfile } = companyData;

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: companyProfile
      });

    } catch (error) {
      console.error('Update company profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};

// Helper functions
async function notifyQualifiedStudents(jobData, jobId) {
  try {
    // Get all students
    const studentsSnapshot = await db.collection('users')
      .where('role', '==', 'student')
      .where('isActive', '==', true)
      .get();

    const notifications = [];

    for (const studentDoc of studentsSnapshot.docs) {
      const studentId = studentDoc.id;
      const studentData = studentDoc.data();

      // Calculate qualification score
      const qualificationScore = await calculateJobQualificationScore(studentId, jobData);

      if (qualificationScore >= 70) { // 70% match threshold
        notifications.push({
          userId: studentId,
          type: 'job_match',
          title: 'New Job Match Found!',
          message: `We found a new job opportunity "${jobData.title}" at ${jobData.companyName} that matches your profile with ${qualificationScore}% qualification match.`,
          data: {
            jobId: jobId,
            jobTitle: jobData.title,
            companyName: jobData.companyName,
            qualificationScore: qualificationScore
          },
          isRead: false,
          createdAt: new Date()
        });

        // Also send email notification
        await sendNewJobNotification(studentData.email, studentData.firstName, jobData.title, jobData.companyName, qualificationScore);
      }
    }

    // Batch create notifications
    if (notifications.length > 0) {
      const batch = db.batch();
      notifications.forEach(notification => {
        const notificationRef = db.collection('notifications').doc();
        batch.set(notificationRef, notification);
      });
      await batch.commit();
    }

  } catch (error) {
    console.error('Error notifying qualified students:', error);
  }
}

async function calculateJobQualificationScore(studentId, job) {
  try {
    let score = 0;
    const maxScore = 100;
    
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

    // Education level matching (25 points)
    if (job.qualifications?.minEducation) {
      const hasRequiredEducation = checkEducationLevel(transcripts, job.qualifications.minEducation);
      if (hasRequiredEducation) score += 25;
    }

    // Skills matching (30 points)
    if (job.qualifications?.requiredSkills) {
      const skillsMatch = await checkSkillsMatch(studentId, job.qualifications.requiredSkills);
      score += skillsMatch * 30; // skillsMatch is between 0 and 1
    }

    // Experience matching (25 points)
    if (job.qualifications?.minExperience) {
      const experienceMatch = checkExperienceMatch(studentData, job.qualifications.minExperience);
      score += experienceMatch * 25;
    }

    // Academic performance (10 points)
    const academicScore = calculateAcademicPerformance(transcripts);
    score += academicScore * 10;

    // Certificates bonus (10 points)
    const certificateBonus = Math.min(certificates.length * 2, 10);
    score += certificateBonus;

    return Math.min(Math.round(score), maxScore);

  } catch (error) {
    console.error('Qualification score calculation error:', error);
    return 0;
  }
}

function checkEducationLevel(transcripts, requiredEducation) {
  const highestEducation = getHighestEducationLevel(transcripts);
  return highestEducation >= mapEducationLevel(requiredEducation);
}

async function checkSkillsMatch(studentId, requiredSkills) {
  // This would check student's skills against required skills
  // For now, return a random match between 0.5 and 1 for demonstration
  return 0.7 + Math.random() * 0.3;
}

function checkExperienceMatch(studentData, minExperience) {
  // Check if student has required experience
  const studentExperience = studentData.experienceYears || studentData.yearsOfExperience || 0;
  const requiredYears = parseInt(minExperience) || 0;
  
  if (studentExperience >= requiredYears) return 1.0;
  if (studentExperience >= requiredYears * 0.7) return 0.8;
  if (studentExperience >= requiredYears * 0.5) return 0.5;
  return 0.2;
}

function calculateAcademicPerformance(transcripts) {
  if (transcripts.length === 0) return 0;
  
  const totalGPA = transcripts.reduce((sum, transcript) => sum + (transcript.gpa || 0), 0);
  const averageGPA = totalGPA / transcripts.length;
  
  // Normalize GPA to 0-1 scale (assuming 4.0 scale)
  return Math.min(averageGPA / 4.0, 1);
}

function getHighestEducationLevel(transcripts) {
  if (transcripts.length === 0) return 1; // High School as default
  
  // Look for the highest education level in transcripts
  let highestLevel = 1; // High School
  
  transcripts.forEach(transcript => {
    const program = transcript.program || '';
    const programLower = program.toLowerCase();
    
    if (programLower.includes('phd') || programLower.includes('doctorate')) {
      highestLevel = Math.max(highestLevel, 5);
    } else if (programLower.includes('master')) {
      highestLevel = Math.max(highestLevel, 4);
    } else if (programLower.includes('bachelor') || programLower.includes('undergraduate')) {
      highestLevel = Math.max(highestLevel, 3);
    } else if (programLower.includes('diploma') || programLower.includes('associate')) {
      highestLevel = Math.max(highestLevel, 2);
    }
  });
  
  return highestLevel;
}

function mapEducationLevel(education) {
  const levels = {
    'High School': 1,
    'Diploma': 2,
    'Bachelor\'s Degree': 3,
    'Master\'s Degree': 4,
    'PhD': 5
  };
  return levels[education] || 1;
}

async function createJobApplicationStatusNotification(studentId, status, jobId) {
  const statusMessages = {
    shortlisted: 'Congratulations! You have been shortlisted for the position.',
    rejected: 'Thank you for your application. Unfortunately, you have not been selected.',
    hired: 'Congratulations! You have been hired for the position.'
  };

  const jobDoc = await db.collection('jobs').doc(jobId).get();
  const jobTitle = jobDoc.exists ? jobDoc.data().title : 'the position';

  await db.collection('notifications').add({
    userId: studentId,
    type: 'job_application_update',
    title: `Job Application Update - ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    message: statusMessages[status] || `Your job application status has been updated to ${status}.`,
    data: {
      jobId: jobId,
      jobTitle: jobTitle,
      status: status
    },
    isRead: false,
    createdAt: new Date()
  });
}

function calculateCompanyProfileCompleteness(companyData) {
  const requiredFields = ['companyName', 'address', 'phone', 'description', 'industry'];
  let completedFields = 0;

  requiredFields.forEach(field => {
    if (companyData[field] && companyData[field].toString().trim() !== '') {
      completedFields++;
    }
  });

  return (completedFields / requiredFields.length * 100).toFixed(0) + '%';
}

// Mock email function (would be implemented with real email service)
async function sendNewJobNotification(email, studentName, jobTitle, companyName, qualificationScore) {
  console.log(`📧 [MOCK] Sending job notification to ${email}: ${jobTitle} at ${companyName} (${qualificationScore}% match)`);
}

module.exports = companyController;