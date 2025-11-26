const { db } = require('../config/firebase');
const bcrypt = require('bcryptjs');

const createTestUser = async () => {
  try {
    console.log('🧪 Creating test users for development...');
    
    const testUsers = [
      {
        email: 'test@student.com',
        password: 'password123',
        role: 'student',
        firstName: 'Test',
        lastName: 'Student',
        phone: '+2661234567',
        address: '123 Test Street, Maseru, Lesotho',
        isVerified: true,
        isActive: true
      },
      {
        email: 'admin@careerplatform.com',
        password: 'admin123',
        role: 'admin',
        firstName: 'System',
        lastName: 'Administrator',
        isVerified: true,
        isActive: true
      },
      {
        email: 'institute@test.com',
        password: 'institute123',
        role: 'institute',
        institutionName: 'Test University',
        address: '456 University Ave, Maseru, Lesotho',
        phone: '+2662345678',
        isVerified: true,
        isActive: true,
        isApproved: true
      },
      {
        email: 'company@test.com',
        password: 'company123',
        role: 'company',
        companyName: 'Test Company Ltd',
        address: '789 Business Park, Maseru, Lesotho',
        phone: '+2663456789',
        isVerified: true,
        isActive: true,
        isApproved: true
      }
    ];

    let createdCount = 0;
    let existingCount = 0;

    for (const userData of testUsers) {
      // Check if user already exists
      const userSnapshot = await db.collection('users')
        .where('email', '==', userData.email)
        .get();

      if (!userSnapshot.empty) {
        console.log(`✅ User already exists: ${userData.email} (${userData.role})`);
        existingCount++;
        continue;
      }

      // Create new user
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      const userToCreate = {
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        isVerified: userData.isVerified,
        isActive: userData.isActive,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Add role-specific fields
      if (userData.role === 'student') {
        userToCreate.firstName = userData.firstName;
        userToCreate.lastName = userData.lastName;
        userToCreate.phone = userData.phone;
        userToCreate.address = userData.address;
        userToCreate.applications = [];
        userToCreate.transcripts = [];
        userToCreate.certificates = [];
      } else if (userData.role === 'institute') {
        userToCreate.institutionName = userData.institutionName;
        userToCreate.address = userData.address;
        userToCreate.phone = userData.phone;
        userToCreate.isApproved = userData.isApproved;
        userToCreate.faculties = [];
      } else if (userData.role === 'company') {
        userToCreate.companyName = userData.companyName;
        userToCreate.address = userData.address;
        userToCreate.phone = userData.phone;
        userToCreate.isApproved = userData.isApproved;
        userToCreate.jobPostings = [];
      } else if (userData.role === 'admin') {
        userToCreate.firstName = userData.firstName;
        userToCreate.lastName = userData.lastName;
        userToCreate.isApproved = true;
      }

      await db.collection('users').add(userToCreate);
      console.log(`✅ Created test user: ${userData.email} (${userData.role})`);
      createdCount++;
    }

    console.log('='.repeat(50));
    console.log('🎉 TEST USERS SUMMARY:');
    console.log(`   Created: ${createdCount} new users`);
    console.log(`   Existing: ${existingCount} users already existed`);
    console.log('='.repeat(50));
    console.log('🔑 LOGIN CREDENTIALS:');
    console.log('   👨‍🎓 Student: test@student.com / password123');
    console.log('   👑 Admin: admin@careerplatform.com / admin123');
    console.log('   🏫 Institute: institute@test.com / institute123');
    console.log('   🏢 Company: company@test.com / company123');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ Error creating test users:', error);
    console.error('Error details:', error.message);
  }
};

// Run if this file is executed directly
if (require.main === module) {
  createTestUser();
}

module.exports = createTestUser;