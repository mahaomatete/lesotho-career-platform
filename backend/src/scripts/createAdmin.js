

const { db } = require('../config/firebase');
const bcrypt = require('bcryptjs');

const createAdminUser = async () => {
  try {
    const adminEmail = 'admin@careerplatform.com';
    
    console.log('🔍 Checking if admin user exists...');

    // Check if admin already exists
    const adminSnapshot = await db.collection('users')
      .where('email', '==', adminEmail)
      .get();

    if (!adminSnapshot.empty) {
      console.log('✅ Admin user already exists');
      return;
    }

    console.log('👤 Creating admin user...');
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
    console.log('💡 Make sure Firebase is properly configured');
  }
};

// Run if this file is executed directly
if (require.main === module) {
  createAdminUser();
}

module.exports = createAdminUser;