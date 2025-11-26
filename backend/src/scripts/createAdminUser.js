const { db } = require('../config/firebase');
const bcrypt = require('bcryptjs');

const createAdminUser = async () => {
  try {
    const adminEmail = 'admin@careerplatform.com';
    
    console.log('🔍 Checking if admin user exists...');

    // First, check if we have database connection
    if (!db) {
      throw new Error('Database not available. Firebase connection failed.');
    }

    // Check if admin already exists
    const adminSnapshot = await db.collection('users')
      .where('email', '==', adminEmail)
      .get();

    if (!adminSnapshot.empty) {
      const adminDoc = adminSnapshot.docs[0];
      const adminData = adminDoc.data();
      console.log('✅ Admin user already exists:', {
        id: adminDoc.id,
        email: adminData.email,
        role: adminData.role
      });
      return;
    }

    console.log('👑 Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 12);

    const adminData = {
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      firstName: 'System',
      lastName: 'Administrator',
      isVerified: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('users').add(adminData);
    
    console.log('🎉 Admin user created successfully!');
    console.log('📧 Email: admin@careerplatform.com');
    console.log('🔑 Password: admin123');
    console.log('🆔 User ID:', result.id);
    console.log('⚠️  IMPORTANT: Change the password after first login!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    throw error; // Re-throw to let caller handle it
  }
};

// Run if this file is executed directly
if (require.main === module) {
  createAdminUser().catch(error => {
    console.error('Failed to create admin user:', error);
    process.exit(1);
  });
}

module.exports = createAdminUser;