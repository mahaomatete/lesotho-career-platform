const { db } = require('../config/firebase');
const bcrypt = require('bcryptjs');

const createSampleData = async () => {
  try {
    console.log('📊 Creating comprehensive sample data with auto-verification...');

    // Check if sample data already exists
    const sampleUserSnapshot = await db.collection('users')
      .where('email', '==', 'test@student.com')
      .get();

    if (!sampleUserSnapshot.empty) {
      console.log('✅ Sample data already exists');
      return;
    }

    // Create sample students - ALL AUTO-VERIFIED
    const students = [
      {
        email: 'test@student.com',
        password: await bcrypt.hash('password123', 12),
        role: 'student',
        firstName: 'Test',
        lastName: 'Student',
        phone: '+266 1234 5678',
        address: '123 Student Street, Maseru, Lesotho',
        dateOfBirth: '2000-05-15',
        gender: 'male',
        isVerified: true, // Auto-verified
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        email: 'john.doe@student.com',
        password: await bcrypt.hash('password123', 12),
        role: 'student',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+266 2345 6789',
        address: '456 College Avenue, Maseru, Lesotho',
        dateOfBirth: '2001-08-22',
        gender: 'male',
        isVerified: true, // Auto-verified
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        email: 'sarah.smith@student.com',
        password: await bcrypt.hash('password123', 12),
        role: 'student',
        firstName: 'Sarah',
        lastName: 'Smith',
        phone: '+266 3456 7890',
        address: '789 University Road, Maseru, Lesotho',
        dateOfBirth: '1999-12-10',
        gender: 'female',
        isVerified: true, // Auto-verified
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const studentIds = [];
    for (const student of students) {
      const studentRef = await db.collection('users').add(student);
      studentIds.push(studentRef.id);
      console.log(`✅ Student created: ${student.firstName} ${student.lastName}`);
    }

    // Create sample institute - AUTO-VERIFIED
    const instituteData = {
      email: 'sample.university@edu.ls',
      password: await bcrypt.hash('institute123', 12),
      role: 'institute',
      institutionName: 'Sample University of Technology',
      address: '123 University Avenue, Maseru, Lesotho',
      phone: '+266 2233 4455',
      website: 'https://sampleuniversity.edu.ls',
      description: 'A leading technological university in Lesotho offering cutting-edge programs.',
      isVerified: true, // Auto-verified
      isApproved: true, // Auto-approved
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const instituteRef = await db.collection('users').add(instituteData);
    const instituteId = instituteRef.id;
    console.log('✅ Institute created: Sample University of Technology');

    // Create faculties
    const faculties = [
      {
        instituteId: instituteId,
        name: 'Faculty of Engineering',
        description: 'Offering various engineering programs with modern facilities.',
        dean: 'Dr. John Smith',
        contactEmail: 'engineering@sampleuniversity.edu.ls',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        instituteId: instituteId,
        name: 'Faculty of Computer Science',
        description: 'Cutting-edge computer science and IT programs.',
        dean: 'Dr. Michael Brown',
        contactEmail: 'cs@sampleuniversity.edu.ls',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        instituteId: instituteId,
        name: 'Faculty of Business',
        description: 'Business and management programs for future leaders.',
        dean: 'Dr. Sarah Johnson',
        contactEmail: 'business@sampleuniversity.edu.ls',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const facultyIds = [];
    for (const faculty of faculties) {
      const facultyRef = await db.collection('faculties').add(faculty);
      facultyIds.push(facultyRef.id);
      console.log(`✅ Faculty created: ${faculty.name}`);
    }

    // Create courses
    const courses = [
      {
        instituteId: instituteId,
        facultyId: facultyIds[1],
        name: 'Computer Science',
        code: 'CS101',
        description: 'Bachelor of Science in Computer Science - Comprehensive program covering programming, algorithms, and software development.',
        duration: 4,
        tuitionFee: 15000,
        maxStudents: 50,
        currentStudents: 0,
        requirements: ['High School Diploma', 'Mathematics Background', 'Basic Programming Knowledge'],
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        startDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        instituteId: instituteId,
        facultyId: facultyIds[0],
        name: 'Electrical Engineering',
        code: 'EE201',
        description: 'Bachelor of Engineering in Electrical Engineering - Focus on electrical systems, power distribution, and electronics.',
        duration: 4,
        tuitionFee: 18000,
        maxStudents: 40,
        currentStudents: 0,
        requirements: ['High School Diploma', 'Physics and Mathematics', 'Science Background'],
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        startDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        instituteId: instituteId,
        facultyId: facultyIds[2],
        name: 'Business Administration',
        code: 'BA301',
        description: 'Bachelor of Business Administration - Comprehensive business management and leadership program.',
        duration: 3,
        tuitionFee: 12000,
        maxStudents: 60,
        currentStudents: 0,
        requirements: ['High School Diploma'],
        deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        startDate: new Date(Date.now() + 55 * 24 * 60 * 60 * 1000),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const courseIds = [];
    for (const course of courses) {
      const courseRef = await db.collection('courses').add(course);
      courseIds.push(courseRef.id);
      console.log(`✅ Course created: ${course.name} (${course.code})`);
    }

    // Create sample company - AUTO-VERIFIED
    const companyData = {
      email: 'tech.solutions@company.ls',
      password: await bcrypt.hash('company123', 12),
      role: 'company',
      companyName: 'Tech Solutions Ltd',
      industry: 'Information Technology',
      size: '51-200',
      address: '456 Tech Park, Maseru, Lesotho',
      phone: '+266 2233 4455',
      website: 'https://techsolutions.ls',
      description: 'Leading technology solutions provider in Lesotho, specializing in software development and IT consulting.',
      isVerified: true, // Auto-verified
      isApproved: true, // Auto-approved
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const companyRef = await db.collection('users').add(companyData);
    const companyId = companyRef.id;
    console.log('✅ Company created: Tech Solutions Ltd');

    // Create sample jobs
    const jobs = [
      {
        companyId: companyId,
        title: 'Junior Software Developer',
        department: 'Engineering',
        description: 'We are looking for a passionate Junior Software Developer to design, develop and install software solutions. The successful candidate will be able to build high-quality, innovative and fully performing software in compliance with coding standards and technical design.',
        requirements: [
          'Bachelor\'s degree in Computer Science or related field',
          'Understanding of software development lifecycle',
          'Knowledge of programming languages like JavaScript, Python, or Java'
        ],
        responsibilities: [
          'Develop software solutions by studying information needs',
          'Document and demonstrate solutions by developing documentation, flowcharts, layouts, diagrams, charts, code comments and clear code',
          'Prepare and install solutions by determining and designing system specifications, standards, and programming'
        ],
        qualifications: {
          minEducation: 'Bachelor\'s Degree',
          requiredSkills: ['JavaScript', 'Python', 'Problem Solving', 'Teamwork'],
          minExperience: '0-1 years'
        },
        location: 'Maseru, Lesotho',
        jobType: 'full-time',
        salaryRange: { min: 15000, max: 25000, currency: 'LSL' },
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        positionsAvailable: 3,
        positionsFilled: 0,
        status: 'active',
        views: 0,
        applicationsCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        companyId: companyId,
        title: 'IT Support Specialist',
        department: 'IT Support',
        description: 'We are seeking an IT Support Specialist to provide technical assistance to our staff and clients. You will be responsible for answering queries and addressing system and user issues in a timely and professional manner.',
        requirements: [
          'Diploma in Information Technology or related field',
          'Proven experience as an IT Support Specialist',
          'Knowledge of network security practices and anti-virus programs'
        ],
        qualifications: {
          minEducation: 'Diploma',
          requiredSkills: ['Technical Support', 'Network Administration', 'Customer Service'],
          minExperience: '1-2 years'
        },
        location: 'Maseru, Lesotho',
        jobType: 'full-time',
        salaryRange: { min: 12000, max: 18000, currency: 'LSL' },
        deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        positionsAvailable: 2,
        positionsFilled: 0,
        status: 'active',
        views: 0,
        applicationsCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const jobIds = [];
    for (const job of jobs) {
      const jobRef = await db.collection('jobs').add(job);
      jobIds.push(jobRef.id);
      console.log(`✅ Job created: ${job.title}`);
    }

    // Create sample applications
    const applications = [
      {
        studentId: studentIds[0],
        courseId: courseIds[0],
        instituteId: instituteId,
        personalStatement: 'I am very interested in Computer Science and believe I have the necessary skills and motivation to succeed in this program. I have been programming for 2 years and have completed several personal projects.',
        status: 'pending',
        appliedAt: new Date(),
        updatedAt: new Date()
      },
      {
        studentId: studentIds[1],
        courseId: courseIds[1],
        instituteId: instituteId,
        personalStatement: 'I have always been fascinated by electrical systems and want to pursue a career in electrical engineering. I have strong background in physics and mathematics.',
        status: 'admitted',
        appliedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        updatedAt: new Date()
      }
    ];

    for (const application of applications) {
      await db.collection('applications').add(application);
      console.log(`✅ Application created for course`);
    }

    console.log('🎉 Comprehensive sample data created successfully!');
    console.log('\n📋 Sample Data Summary:');
    console.log(`   👨‍🎓 Students: ${students.length} (All Auto-verified)`);
    console.log(`   🏫 Institutes: 1 (Auto-verified & approved)`);
    console.log(`   📚 Courses: ${courses.length}`);
    console.log(`   🏢 Companies: 1 (Auto-verified & approved)`);
    console.log(`   💼 Jobs: ${jobs.length}`);
    console.log(`   📝 Applications: ${applications.length}`);
    
    console.log('\n🔐 Test Logins (All Auto-Verified & Ready to Login):');
    console.log('   Student: test@student.com / password123');
    console.log('   Student: john.doe@student.com / password123');
    console.log('   Student: sarah.smith@student.com / password123');
    console.log('   Institute: sample.university@edu.ls / institute123');
    console.log('   Company: tech.solutions@company.ls / company123');
    console.log('   Admin: admin@careerplatform.com / admin123');

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
    throw error;
  }
};

if (require.main === module) {
  createSampleData();
}

module.exports = createSampleData;