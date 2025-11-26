const { db } = require('../config/firebase');
const bcrypt = require('bcryptjs');

const createSampleInstituteData = async () => {
  try {
    console.log('🎓 Creating sample institute data...');

    // Create a sample institute
    const instituteEmail = 'sample.institute@example.com';
    
    // Check if institute already exists
    const instituteSnapshot = await db.collection('users')
      .where('email', '==', instituteEmail)
      .get();

    let instituteId;

    if (instituteSnapshot.empty) {
      const hashedPassword = await bcrypt.hash('institute123', 12);
      
      const instituteData = {
        email: instituteEmail,
        password: hashedPassword,
        role: 'institute',
        institutionName: 'Sample University of Technology',
        address: '123 University Avenue, Maseru, Lesotho',
        phone: '+266 1234 5678',
        website: 'https://sampleuniversity.edu.ls',
        description: 'A leading technological university in Lesotho offering cutting-edge programs.',
        isVerified: true,
        isApproved: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const instituteRef = await db.collection('users').add(instituteData);
      instituteId = instituteRef.id;
      console.log('✅ Sample institute created:', instituteData.institutionName);
    } else {
      instituteId = instituteSnapshot.docs[0].id;
      console.log('✅ Sample institute already exists');
    }

    // Create faculties
    const faculties = [
      {
        name: 'Faculty of Engineering',
        description: 'Offering various engineering programs with modern facilities.',
        dean: 'Dr. John Smith',
        contactEmail: 'engineering@sampleuniversity.edu.ls'
      },
      {
        name: 'Faculty of Business',
        description: 'Business and management programs for future leaders.',
        dean: 'Dr. Sarah Johnson',
        contactEmail: 'business@sampleuniversity.edu.ls'
      },
      {
        name: 'Faculty of Computer Science',
        description: 'Cutting-edge computer science and IT programs.',
        dean: 'Dr. Michael Brown',
        contactEmail: 'cs@sampleuniversity.edu.ls'
      }
    ];

    const facultyIds = [];
    for (const faculty of faculties) {
      const facultyData = {
        instituteId,
        ...faculty,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const facultyRef = await db.collection('faculties').add(facultyData);
      facultyIds.push(facultyRef.id);
      console.log(`✅ Faculty created: ${faculty.name}`);
    }

    // Create courses
    const courses = [
      {
        name: 'Computer Science',
        code: 'CS101',
        facultyId: facultyIds[2],
        description: 'Bachelor of Science in Computer Science',
        duration: 4,
        tuitionFee: 15000,
        maxStudents: 50,
        requirements: ['High School Diploma', 'Mathematics Background'],
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        startDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days from now
      },
      {
        name: 'Electrical Engineering',
        code: 'EE201',
        facultyId: facultyIds[0],
        description: 'Bachelor of Engineering in Electrical Engineering',
        duration: 4,
        tuitionFee: 18000,
        maxStudents: 40,
        requirements: ['High School Diploma', 'Physics and Mathematics'],
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        startDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000)
      },
      {
        name: 'Business Administration',
        code: 'BA301',
        facultyId: facultyIds[1],
        description: 'Bachelor of Business Administration',
        duration: 3,
        tuitionFee: 12000,
        maxStudents: 60,
        requirements: ['High School Diploma'],
        deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        startDate: new Date(Date.now() + 55 * 24 * 60 * 60 * 1000)
      }
    ];

    const courseIds = [];
    for (const course of courses) {
      const courseData = {
        instituteId,
        ...course,
        currentStudents: 0,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const courseRef = await db.collection('courses').add(courseData);
      courseIds.push(courseRef.id);
      console.log(`✅ Course created: ${course.name} (${course.code})`);
    }

    console.log('🎉 Sample institute data created successfully!');
    console.log('📧 Institute Login: sample.institute@example.com');
    console.log('🔑 Password: institute123');
    console.log('🏫 Institute has:', faculties.length, 'faculties and', courses.length, 'courses');

  } catch (error) {
    console.error('❌ Error creating sample institute data:', error.message);
  }
};

if (require.main === module) {
  createSampleInstituteData();
}

module.exports = createSampleInstituteData;