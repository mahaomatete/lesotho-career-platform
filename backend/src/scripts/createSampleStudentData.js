const { db } = require('../config/firebase');
const bcrypt = require('bcryptjs');

const createSampleStudentData = async () => {
  try {
    console.log('🎓 Creating sample student data...');

    // Create sample students
    const students = [
      {
        email: 'john.doe@student.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+266 1234 5678',
        address: '123 Student Street, Maseru, Lesotho',
        dateOfBirth: '2000-05-15',
        gender: 'male'
      },
      {
        email: 'sarah.smith@student.com',
        firstName: 'Sarah',
        lastName: 'Smith',
        phone: '+266 2345 6789',
        address: '456 College Avenue, Maseru, Lesotho',
        dateOfBirth: '2001-08-22',
        gender: 'female'
      },
      {
        email: 'michael.nganga@student.com',
        firstName: 'Michael',
        lastName: 'Nganga',
        phone: '+266 3456 7890',
        address: '789 University Road, Maseru, Lesotho',
        dateOfBirth: '1999-12-10',
        gender: 'male'
      }
    ];

    const studentIds = [];
    
    for (const student of students) {
      // Check if student already exists
      const studentSnapshot = await db.collection('users')
        .where('email', '==', student.email)
        .get();

      if (studentSnapshot.empty) {
        const hashedPassword = await bcrypt.hash('student123', 12);
        
        const studentData = {
          email: student.email,
          password: hashedPassword,
          role: 'student',
          ...student,
          isVerified: true,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const studentRef = await db.collection('users').add(studentData);
        studentIds.push(studentRef.id);
        console.log(`✅ Student created: ${student.firstName} ${student.lastName}`);
      } else {
        studentIds.push(studentSnapshot.docs[0].id);
        console.log(`✅ Student already exists: ${student.firstName} ${student.lastName}`);
      }
    }

    // Get available courses
    const coursesSnapshot = await db.collection('courses').get();
    const courses = coursesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    if (courses.length === 0) {
      console.log('❌ No courses found. Please create sample institute data first.');
      return;
    }

    // Create sample applications
    const applications = [
      // John Doe applies to Computer Science and Business Administration
      { studentId: studentIds[0], courseId: courses[0].id, status: 'pending' },
      { studentId: studentIds[0], courseId: courses[2].id, status: 'pending' },
      
      // Sarah Smith applies to Electrical Engineering
      { studentId: studentIds[1], courseId: courses[1].id, status: 'admitted' },
      
      // Michael Nganga applies to all courses
      { studentId: studentIds[2], courseId: courses[0].id, status: 'pending' },
      { studentId: studentIds[2], courseId: courses[1].id, status: 'rejected' },
      { studentId: studentIds[2], courseId: courses[2].id, status: 'waiting_list' }
    ];

    for (const application of applications) {
      const courseDoc = await db.collection('courses').doc(application.courseId).get();
      const courseData = courseDoc.data();

      // Check if application already exists
      const existingAppSnapshot = await db.collection('applications')
        .where('studentId', '==', application.studentId)
        .where('courseId', '==', application.courseId)
        .get();

      if (existingAppSnapshot.empty) {
        const applicationData = {
          studentId: application.studentId,
          courseId: application.courseId,
          instituteId: courseData.instituteId,
          personalStatement: `I am very interested in ${courseData.name} and believe I have the necessary skills and motivation to succeed in this program.`,
          status: application.status,
          appliedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date within last week
          updatedAt: new Date()
        };

        await db.collection('applications').add(applicationData);
        console.log(`✅ Application created: ${application.status} status for course`);
      }
    }

    console.log('🎉 Sample student data created successfully!');
    console.log('👥 Created/Found:', students.length, 'students');
    console.log('📝 Created sample applications with different statuses');
    console.log('📧 Student Logins:');
    students.forEach((student, index) => {
      console.log(`   ${student.email} / student123`);
    });

  } catch (error) {
    console.error('❌ Error creating sample student data:', error.message);
  }
};

if (require.main === module) {
  createSampleStudentData();
}

module.exports = createSampleStudentData;