const { db } = require('../config/firebase');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

const adminController = {
  // Get admin dashboard overview - FIXED
  async getDashboardOverview(req, res) {
    try {
      console.log('📊 Fetching admin dashboard data...');
      
      // Get all statistics with error handling
      const [
        usersSnapshot,
        institutionsSnapshot,
        companiesSnapshot,
        studentsSnapshot,
        coursesSnapshot,
        applicationsSnapshot,
        jobsSnapshot,
        jobApplicationsSnapshot
      ] = await Promise.all([
        db.collection('users').get().catch(() => ({ size: 0 })),
        db.collection('users').where('role', '==', 'institute').get().catch(() => ({ size: 0, docs: [] })),
        db.collection('users').where('role', '==', 'company').get().catch(() => ({ size: 0, docs: [] })),
        db.collection('users').where('role', '==', 'student').get().catch(() => ({ size: 0 })),
        db.collection('courses').get().catch(() => ({ size: 0 })),
        db.collection('applications').get().catch(() => ({ size: 0 })),
        db.collection('jobs').get().catch(() => ({ size: 0 })),
        db.collection('job_applications').get().catch(() => ({ size: 0 }))
      ]);

      // Calculate pending approvals
      const pendingInstitutions = institutionsSnapshot.docs ? 
        institutionsSnapshot.docs.filter(doc => !doc.data().isApproved) : [];
      const pendingCompanies = companiesSnapshot.docs ? 
        companiesSnapshot.docs.filter(doc => !doc.data().isApproved) : [];

      // Get recent activities
      const recentActivities = await getRecentAdminActivities();

      // System health check
      const systemHealth = await checkSystemHealth();

      const responseData = {
        stats: {
          totalUsers: usersSnapshot.size || 0,
          totalStudents: studentsSnapshot.size || 0,
          totalInstitutions: institutionsSnapshot.size || 0,
          totalCompanies: companiesSnapshot.size || 0,
          totalCourses: coursesSnapshot.size || 0,
          totalApplications: applicationsSnapshot.size || 0,
          totalJobs: jobsSnapshot.size || 0,
          activeJobs: jobsSnapshot.docs ? jobsSnapshot.docs.filter(doc => doc.data().status === 'active').length : 0,
          pendingApprovals: pendingInstitutions.length + pendingCompanies.length
        },
        pendingApprovals: {
          institutions: pendingInstitutions.map(doc => ({
            id: doc.id,
            name: doc.data().institutionName,
            email: doc.data().email,
            createdAt: doc.data().createdAt
          })),
          companies: pendingCompanies.map(doc => ({
            id: doc.id,
            name: doc.data().companyName,
            email: doc.data().email,
            createdAt: doc.data().createdAt
          }))
        },
        recentActivities: recentActivities,
        systemHealth: systemHealth
      };

      console.log('✅ Dashboard data fetched successfully');
      res.json({
        success: true,
        data: responseData
      });

    } catch (error) {
      console.error('❌ Get admin dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error: ' + error.message
      });
    }
  },

  // Get all institutions with filtering and pagination - FIXED
  async getInstitutions(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        status = 'all',
        search = '' 
      } = req.query;

      let query = db.collection('users').where('role', '==', 'institute');

      // Apply status filter
      if (status === 'pending') {
        query = query.where('isApproved', '==', false);
      } else if (status === 'approved') {
        query = query.where('isApproved', '==', true);
      } else if (status === 'suspended') {
        query = query.where('isActive', '==', false);
      }

      const snapshot = await query.get();
      let institutions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Apply search filter
      if (search) {
        institutions = institutions.filter(inst =>
          inst.institutionName?.toLowerCase().includes(search.toLowerCase()) ||
          inst.email?.toLowerCase().includes(search.toLowerCase())
        );
      }

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedInstitutions = institutions.slice(startIndex, endIndex);

      // Get additional stats for each institution
      const institutionsWithStats = await Promise.all(
        paginatedInstitutions.map(async (inst) => {
          try {
            const coursesSnapshot = await db.collection('courses')
              .where('instituteId', '==', inst.id)
              .get();
            
            const applicationsSnapshot = await db.collection('applications')
              .where('instituteId', '==', inst.id)
              .get();

            return {
              ...inst,
              stats: {
                totalCourses: coursesSnapshot.size,
                totalApplications: applicationsSnapshot.size,
                activeCourses: coursesSnapshot.docs.filter(doc => doc.data().status === 'active').length
              }
            };
          } catch (error) {
            return {
              ...inst,
              stats: { totalCourses: 0, totalApplications: 0, activeCourses: 0 }
            };
          }
        })
      );

      res.json({
        success: true,
        data: {
          institutions: institutionsWithStats,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(institutions.length / limit),
            totalItems: institutions.length,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Get institutions error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Add new institution (by admin)
  async addInstitution(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const {
        institutionName,
        email,
        password,
        address,
        phone,
        website,
        description,
        type = 'university',
        establishedYear,
        accreditation
      } = req.body;

      // Check if user already exists
      const userSnapshot = await db.collection('users')
        .where('email', '==', email.toLowerCase())
        .get();

      if (!userSnapshot.empty) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email'
        });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const institutionData = {
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'institute',
        institutionName,
        address,
        phone,
        website,
        description,
        type,
        establishedYear: establishedYear ? parseInt(establishedYear) : null,
        accreditation,
        isVerified: true,
        isApproved: true,
        isActive: true,
        approvedAt: new Date(),
        approvedBy: req.user.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const institutionRef = await db.collection('users').add(institutionData);

      res.status(201).json({
        success: true,
        message: 'Institution added successfully',
        data: {
          id: institutionRef.id,
          institutionName,
          email
        }
      });

    } catch (error) {
      console.error('Add institution error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Update institution details
  async updateInstitution(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const userDoc = await db.collection('users').doc(id).get();
      
      if (!userDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Institution not found'
        });
      }

      const userData = userDoc.data();
      
      if (userData.role !== 'institute') {
        return res.status(400).json({
          success: false,
          message: 'User is not an institution'
        });
      }

      // Remove fields that shouldn't be updated
      delete updateData.password;
      delete updateData.email;
      delete updateData.role;

      // Handle establishedYear conversion
      if (updateData.establishedYear) {
        updateData.establishedYear = parseInt(updateData.establishedYear);
      }

      updateData.updatedAt = new Date();

      await db.collection('users').doc(id).update(updateData);

      res.json({
        success: true,
        message: 'Institution updated successfully'
      });

    } catch (error) {
      console.error('Update institution error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Delete institution
  async deleteInstitution(req, res) {
    try {
      const { id } = req.params;

      const userDoc = await db.collection('users').doc(id).get();
      
      if (!userDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Institution not found'
        });
      }

      const userData = userDoc.data();
      if (userData.role !== 'institute') {
        return res.status(400).json({
          success: false,
          message: 'User is not an institution'
        });
      }

      // Soft delete - mark as deleted
      await db.collection('users').doc(id).update({
        isActive: false,
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: req.user.uid,
        updatedAt: new Date()
      });

      res.json({
        success: true,
        message: 'Institution deleted successfully'
      });

    } catch (error) {
      console.error('Delete institution error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Get all companies with filtering and pagination - FIXED
  async getCompanies(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        status = 'all',
        search = '' 
      } = req.query;

      let query = db.collection('users').where('role', '==', 'company');

      // Apply status filter
      if (status === 'pending') {
        query = query.where('isApproved', '==', false);
      } else if (status === 'approved') {
        query = query.where('isApproved', '==', true);
      } else if (status === 'suspended') {
        query = query.where('isActive', '==', false);
      }

      const snapshot = await query.get();
      let companies = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Apply search filter
      if (search) {
        companies = companies.filter(company =>
          company.companyName?.toLowerCase().includes(search.toLowerCase()) ||
          company.email?.toLowerCase().includes(search.toLowerCase())
        );
      }

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedCompanies = companies.slice(startIndex, endIndex);

      // Get additional stats for each company
      const companiesWithStats = await Promise.all(
        paginatedCompanies.map(async (company) => {
          try {
            const jobsSnapshot = await db.collection('jobs')
              .where('companyId', '==', company.id)
              .get();
            
            const jobApplicationsSnapshot = await db.collection('job_applications')
              .where('companyId', '==', company.id)
              .get();

            return {
              ...company,
              stats: {
                totalJobs: jobsSnapshot.size,
                totalApplications: jobApplicationsSnapshot.size,
                activeJobs: jobsSnapshot.docs.filter(doc => doc.data().status === 'active').length
              }
            };
          } catch (error) {
            return {
              ...company,
              stats: { totalJobs: 0, totalApplications: 0, activeJobs: 0 }
            };
          }
        })
      );

      res.json({
        success: true,
        data: {
          companies: companiesWithStats,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(companies.length / limit),
            totalItems: companies.length,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Get companies error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Add new company (by admin)
  async addCompany(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const {
        companyName,
        email,
        password,
        industry,
        companySize,
        phone,
        website,
        address,
        description,
        contactPerson
      } = req.body;

      // Check if user already exists
      const userSnapshot = await db.collection('users')
        .where('email', '==', email.toLowerCase())
        .get();

      if (!userSnapshot.empty) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email'
        });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const companyData = {
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'company',
        companyName,
        industry,
        companySize,
        phone,
        website,
        address,
        description,
        contactPerson: contactPerson || {},
        isVerified: true,
        isApproved: true,
        isActive: true,
        approvedAt: new Date(),
        approvedBy: req.user.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const companyRef = await db.collection('users').add(companyData);

      res.status(201).json({
        success: true,
        message: 'Company added successfully',
        data: {
          id: companyRef.id,
          companyName,
          email
        }
      });

    } catch (error) {
      console.error('Add company error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Update company details
  async updateCompany(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const userDoc = await db.collection('users').doc(id).get();
      
      if (!userDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Company not found'
        });
      }

      const userData = userDoc.data();
      
      if (userData.role !== 'company') {
        return res.status(400).json({
          success: false,
          message: 'User is not a company'
        });
      }

      // Remove fields that shouldn't be updated
      delete updateData.password;
      delete updateData.email;
      delete updateData.role;

      updateData.updatedAt = new Date();

      await db.collection('users').doc(id).update(updateData);

      res.json({
        success: true,
        message: 'Company updated successfully'
      });

    } catch (error) {
      console.error('Update company error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Get all students with filtering and pagination - FIXED
  async getStudents(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        status = 'all',
        search = '' 
      } = req.query;

      let query = db.collection('users').where('role', '==', 'student');

      // Apply status filter
      if (status === 'active') {
        query = query.where('isActive', '==', true);
      } else if (status === 'inactive') {
        query = query.where('isActive', '==', false);
      }

      const snapshot = await query.get();
      let students = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Apply search filter
      if (search) {
        students = students.filter(student =>
          student.firstName?.toLowerCase().includes(search.toLowerCase()) ||
          student.lastName?.toLowerCase().includes(search.toLowerCase()) ||
          student.email?.toLowerCase().includes(search.toLowerCase())
        );
      }

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedStudents = students.slice(startIndex, endIndex);

      // Get additional stats for each student
      const studentsWithStats = await Promise.all(
        paginatedStudents.map(async (student) => {
          try {
            const applicationsSnapshot = await db.collection('applications')
              .where('studentId', '==', student.id)
              .get();

            const jobApplicationsSnapshot = await db.collection('job_applications')
              .where('studentId', '==', student.id)
              .get();

            const transcriptsSnapshot = await db.collection('transcripts')
              .where('studentId', '==', student.id)
              .get();

            const certificatesSnapshot = await db.collection('certificates')
              .where('studentId', '==', student.id)
              .get();

            const admittedApplications = applicationsSnapshot.docs.filter(
              doc => doc.data().status === 'admitted'
            );

            return {
              ...student,
              stats: {
                totalApplications: applicationsSnapshot.size,
                admittedApplications: admittedApplications.length,
                pendingApplications: applicationsSnapshot.docs.filter(
                  doc => doc.data().status === 'pending'
                ).length,
                jobApplications: jobApplicationsSnapshot.size,
                transcriptsUploaded: transcriptsSnapshot.size,
                certificatesUploaded: certificatesSnapshot.size
              }
            };
          } catch (error) {
            return {
              ...student,
              stats: {
                totalApplications: 0,
                admittedApplications: 0,
                pendingApplications: 0,
                jobApplications: 0,
                transcriptsUploaded: 0,
                certificatesUploaded: 0
              }
            };
          }
        })
      );

      res.json({
        success: true,
        data: {
          students: studentsWithStats,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(students.length / limit),
            totalItems: students.length,
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
  },

  // Faculty Management
  async getFaculties(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const snapshot = await db.collection('faculties')
        .where('instituteId', '==', id)
        .get();

      const faculties = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedFaculties = faculties.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: {
          faculties: paginatedFaculties,
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

  async addFaculty(req, res) {
    try {
      const { id } = req.params;
      const { name, description, dean, contactEmail } = req.body;

      const facultyData = {
        instituteId: id,
        name,
        description,
        dean,
        contactEmail,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const facultyRef = await db.collection('faculties').add(facultyData);

      res.status(201).json({
        success: true,
        message: 'Faculty added successfully',
        data: {
          id: facultyRef.id,
          ...facultyData
        }
      });

    } catch (error) {
      console.error('Add faculty error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  async updateFaculty(req, res) {
    try {
      const { id, facultyId } = req.params;
      const updateData = req.body;

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

  async deleteFaculty(req, res) {
    try {
      const { facultyId } = req.params;

      await db.collection('faculties').doc(facultyId).delete();

      res.json({
        success: true,
        message: 'Faculty deleted successfully'
      });

    } catch (error) {
      console.error('Delete faculty error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Course Management
  async getCourses(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const snapshot = await db.collection('courses')
        .where('instituteId', '==', id)
        .get();

      const courses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedCourses = courses.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: {
          courses: paginatedCourses,
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

  async addCourse(req, res) {
    try {
      const { id } = req.params;
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

      const courseData = {
        instituteId: id,
        facultyId,
        name,
        code,
        description,
        duration: parseInt(duration),
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
        message: 'Course added successfully',
        data: {
          id: courseRef.id,
          ...courseData
        }
      });

    } catch (error) {
      console.error('Add course error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  async updateCourse(req, res) {
    try {
      const { courseId } = req.params;
      const updateData = req.body;

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

  async deleteCourse(req, res) {
    try {
      const { courseId } = req.params;

      await db.collection('courses').doc(courseId).delete();

      res.json({
        success: true,
        message: 'Course deleted successfully'
      });

    } catch (error) {
      console.error('Delete course error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Approve organization
  async approveOrganization(req, res) {
    try {
      const { id } = req.params;
      const { type } = req.body;

      if (!['institute', 'company'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Type must be either "institute" or "company"'
        });
      }

      const userDoc = await db.collection('users').doc(id).get();
      
      if (!userDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Organization not found'
        });
      }

      const userData = userDoc.data();
      
      if (userData.role !== type) {
        return res.status(400).json({
          success: false,
          message: `User is not a ${type}`
        });
      }

      // Update approval status
      await db.collection('users').doc(id).update({
        isApproved: true,
        approvedAt: new Date(),
        approvedBy: req.user.uid,
        updatedAt: new Date()
      });

      res.json({
        success: true,
        message: `${type === 'institute' ? 'Institution' : 'Company'} approved successfully`
      });

    } catch (error) {
      console.error('Approve organization error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Toggle user status
  async toggleUserStatus(req, res) {
    try {
      const { id } = req.params;
      const { action } = req.body;

      if (!['suspend', 'activate'].includes(action)) {
        return res.status(400).json({
          success: false,
          message: 'Action must be either "suspend" or "activate"'
        });
      }

      const userDoc = await db.collection('users').doc(id).get();
      
      if (!userDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const isActive = action === 'activate';
      
      await db.collection('users').doc(id).update({
        isActive: isActive,
        suspendedAt: isActive ? null : new Date(),
        suspendedBy: isActive ? null : req.user.uid,
        updatedAt: new Date()
      });

      res.json({
        success: true,
        message: `User ${action === 'suspend' ? 'suspended' : 'activated'} successfully`
      });

    } catch (error) {
      console.error('Toggle user status error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Toggle company status (alias for toggleUserStatus)
  async toggleCompanyStatus(req, res) {
    await this.toggleUserStatus(req, res);
  },

  // Toggle student status (alias for toggleUserStatus)
  async toggleStudentStatus(req, res) {
    await this.toggleUserStatus(req, res);
  },

  // Delete user account
  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      const userDoc = await db.collection('users').doc(id).get();
      
      if (!userDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Soft delete - mark as deleted
      await db.collection('users').doc(id).update({
        isActive: false,
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: req.user.uid,
        updatedAt: new Date()
      });

      res.json({
        success: true,
        message: 'User deleted successfully'
      });

    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Get system reports
  async getSystemReports(req, res) {
    try {
      const { reportType, startDate, endDate } = req.query;

      let reportData = {};

      switch (reportType) {
        case 'user_registrations':
          reportData = await getUserRegistrationReport(startDate, endDate);
          break;
        case 'application_stats':
          reportData = await getApplicationStatisticsReport(startDate, endDate);
          break;
        case 'job_postings':
          reportData = await getJobPostingsReport(startDate, endDate);
          break;
        case 'system_usage':
          reportData = await getSystemUsageReport(startDate, endDate);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid report type'
          });
      }

      res.json({
        success: true,
        data: reportData
      });

    } catch (error) {
      console.error('Get system reports error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};

// Helper functions
async function getRecentAdminActivities() {
  try {
    const activitiesSnapshot = await db.collection('admin_activities')
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();

    return activitiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    return [];
  }
}

async function checkSystemHealth() {
  try {
    // Check if database is responsive
    await db.collection('users').limit(1).get();

    // Get system metrics
    const usersCount = (await db.collection('users').get()).size;
    const applicationsCount = (await db.collection('applications').get()).size;
    const jobsCount = (await db.collection('jobs').get()).size;

    return {
      status: 'healthy',
      database: 'connected',
      users: usersCount,
      applications: applicationsCount,
      jobs: jobsCount,
      lastChecked: new Date()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      lastChecked: new Date()
    };
  }
}

async function getUserRegistrationReport(startDate, endDate) {
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();

  const usersSnapshot = await db.collection('users')
    .where('createdAt', '>=', start)
    .where('createdAt', '<=', end)
    .get();

  const users = usersSnapshot.docs.map(doc => doc.data());
  
  const studentRegistrations = users.filter(u => u.role === 'student').length;
  const instituteRegistrations = users.filter(u => u.role === 'institute').length;
  const companyRegistrations = users.filter(u => u.role === 'company').length;

  return {
    reportType: 'user_registrations',
    period: { start, end },
    summary: {
      totalRegistrations: users.length,
      studentRegistrations,
      instituteRegistrations,
      companyRegistrations
    },
    dailyBreakdown: await getDailyRegistrations(start, end)
  };
}

async function getApplicationStatisticsReport(startDate, endDate) {
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();

  const applicationsSnapshot = await db.collection('applications')
    .where('appliedAt', '>=', start)
    .where('appliedAt', '<=', end)
    .get();

  const applications = applicationsSnapshot.docs.map(doc => doc.data());
  
  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {});

  return {
    reportType: 'application_stats',
    period: { start, end },
    summary: {
      totalApplications: applications.length,
      statusBreakdown: statusCounts,
      admissionRate: applications.length > 0 ? 
        ((statusCounts.admitted || 0) / applications.length * 100).toFixed(1) + '%' : '0%'
    }
  };
}

async function getJobPostingsReport(startDate, endDate) {
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();

  const jobsSnapshot = await db.collection('jobs')
    .where('createdAt', '>=', start)
    .where('createdAt', '<=', end)
    .get();

  const jobs = jobsSnapshot.docs.map(doc => doc.data());

  const statusCounts = jobs.reduce((acc, job) => {
    acc[job.status] = (acc[job.status] || 0) + 1;
    return acc;
  }, {});

  return {
    reportType: 'job_postings',
    period: { start, end },
    summary: {
      totalJobs: jobs.length,
      statusBreakdown: statusCounts,
      activeJobs: statusCounts.active || 0
    }
  };
}

async function getSystemUsageReport(startDate, endDate) {
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();

  const activitiesSnapshot = await db.collection('user_activities')
    .where('timestamp', '>=', start)
    .where('timestamp', '<=', end)
    .get();

  const activities = activitiesSnapshot.docs.map(doc => doc.data());

  const activityCounts = activities.reduce((acc, activity) => {
    acc[activity.action] = (acc[activity.action] || 0) + 1;
    return acc;
  }, {});

  return {
    reportType: 'system_usage',
    period: { start, end },
    summary: {
      totalActivities: activities.length,
      activityBreakdown: activityCounts,
      peakUsage: await getPeakUsageTimes(start, end)
    }
  };
}

async function getDailyRegistrations(start, end) {
  return { total: await getRegistrationsCount(start, end) };
}

async function getRegistrationsCount(start, end) {
  const snapshot = await db.collection('users')
    .where('createdAt', '>=', start)
    .where('createdAt', '<=', end)
    .get();
  return snapshot.size;
}

async function getPeakUsageTimes(start, end) {
  return {
    peakHour: '14:00-15:00',
    averageDailyUsers: 150
  };
}

module.exports = adminController;