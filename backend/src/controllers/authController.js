const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/firebase');
const { validationResult } = require('express-validator');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/emailService');

const authController = {
  // Register new user - AUTO-VERIFICATION FOR ALL ACCOUNTS
  async register(req, res) {
    try {
      console.log('=== REGISTRATION STARTED ===');
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Validation errors:', errors.array());
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { email, password, role, firstName, lastName, institutionName, companyName } = req.body;

      console.log('Registration data:', {
        email,
        role,
        firstName,
        lastName,
        institutionName,
        companyName
      });

      // Check if user already exists
      console.log('🔍 Checking if user exists...');
      const userSnapshot = await db.collection('users')
        .where('email', '==', email.toLowerCase())
        .get();

      if (!userSnapshot.empty) {
        console.log('❌ User already exists with email:', email);
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email'
        });
      }

      console.log('✅ Email is available');

      // Hash password
      console.log('🔐 Hashing password...');
      const hashedPassword = await bcrypt.hash(password, 12);
      console.log('✅ Password hashed successfully');

      // AUTO-VERIFY ALL ACCOUNTS
      const isAutoVerified = true; // Auto-verify all accounts
      const isAutoApproved = role === 'admin' || role === 'institute' || role === 'company'; // Auto-approve all for now

      console.log(`🔄 Auto-verification: ${isAutoVerified ? 'ENABLED' : 'DISABLED'} for ${role}`);
      console.log(`🔄 Auto-approval: ${isAutoApproved ? 'ENABLED' : 'DISABLED'} for ${role}`);

      // Create user data based on role
      let userData = {
        email: email.toLowerCase(),
        password: hashedPassword,
        role,
        isVerified: isAutoVerified, // Auto-verify all accounts
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Add role-specific data
      if (role === 'student') {
        userData = {
          ...userData,
          firstName,
          lastName,
          applications: [],
          transcripts: [],
          certificates: []
        };
        console.log('👨‍🎓 Student account created');
      } else if (role === 'institute') {
        userData = {
          ...userData,
          institutionName,
          isApproved: isAutoApproved,
          faculties: []
        };
        console.log('🏫 Institute account created');
      } else if (role === 'company') {
        userData = {
          ...userData,
          companyName,
          isApproved: isAutoApproved,
          jobPostings: []
        };
        console.log('🏢 Company account created');
      } else if (role === 'admin') {
        userData = {
          ...userData,
          firstName: firstName || 'Admin',
          lastName: lastName || 'User',
          isApproved: true,
        };
        console.log('👑 Admin account created');
      }

      // Add user to Firestore
      console.log('💾 Saving user to Firestore...');
      const userRef = await db.collection('users').add(userData);
      console.log('✅ User saved to Firestore with ID:', userRef.id);

      // Success message for all roles
      let welcomeMessage = 'Registration successful! Your account has been automatically verified and you can login immediately.';
      
      console.log('🎉 Registration completed successfully!');

      res.status(201).json({
        success: true,
        message: welcomeMessage,
        data: {
          uid: userRef.id,
          email: userData.email,
          role: userData.role,
          isVerified: userData.isVerified,
          isApproved: userData.isApproved || false
        }
      });

      console.log('=== REGISTRATION COMPLETED ===');

    } catch (error) {
      console.error('❌ REGISTRATION ERROR:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Internal server error during registration: ' + error.message
      });
    }
  },

  // Login user - NO VERIFICATION CHECK NEEDED
  async login(req, res) {
    try {
      console.log('=== LOGIN ATTEMPT STARTED ===');
      console.log('Request body:', { 
        email: req.body.email, 
        passwordLength: req.body.password ? req.body.password.length : 'undefined' 
      });

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Validation errors:', errors.array());
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { email, password } = req.body;
      
      if (!email || !password) {
        console.log('❌ Missing email or password');
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      console.log('🔍 Searching for user:', email.toLowerCase());

      // Find user by email
      let userSnapshot;
      try {
        userSnapshot = await db.collection('users')
          .where('email', '==', email.toLowerCase())
          .get();
        console.log('✅ Firestore query completed. Found documents:', userSnapshot.size);
      } catch (firestoreError) {
        console.error('❌ Firestore query failed:', firestoreError);
        return res.status(500).json({
          success: false,
          message: 'Database error. Please try again.'
        });
      }

      if (userSnapshot.empty) {
        console.log('❌ No user found with email:', email);
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      const userDoc = userSnapshot.docs[0];
      const userData = userDoc.data();
      
      console.log('✅ User found in database:', {
        id: userDoc.id,
        email: userData.email,
        role: userData.role,
        isVerified: userData.isVerified,
        isActive: userData.isActive,
        hasPassword: !!userData.password
      });

      // Check if user is active
      if (userData.isActive === false) {
        console.log('❌ User account is deactivated');
        return res.status(401).json({
          success: false,
          message: 'Your account has been deactivated. Please contact support.'
        });
      }

      // Check password
      console.log('🔐 Checking password...');
      
      if (!userData.password) {
        console.log('❌ No password hash found for user');
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      let isPasswordValid;
      try {
        isPasswordValid = await bcrypt.compare(password, userData.password);
        console.log('✅ Password comparison result:', isPasswordValid);
      } catch (bcryptError) {
        console.error('❌ Password comparison failed:', bcryptError);
        return res.status(500).json({
          success: false,
          message: 'Authentication error. Please try again.'
        });
      }
      
      if (!isPasswordValid) {
        console.log('❌ Invalid password');
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Generate JWT token
      console.log('🎫 Generating JWT token...');
      let token;
      try {
        token = jwt.sign(
          { 
            uid: userDoc.id, 
            email: userData.email, 
            role: userData.role 
          },
          process.env.JWT_SECRET || 'fallback-secret-key',
          { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
        );
        console.log('✅ JWT token generated successfully');
      } catch (jwtError) {
        console.error('❌ JWT token generation failed:', jwtError);
        return res.status(500).json({
          success: false,
          message: 'Authentication error. Please try again.'
        });
      }

      // Prepare user response data
      const userResponse = {
        uid: userDoc.id,
        email: userData.email,
        role: userData.role,
        firstName: userData.firstName,
        lastName: userData.lastName,
        institutionName: userData.institutionName,
        companyName: userData.companyName,
        isVerified: userData.isVerified,
        isApproved: userData.isApproved || false,
        isActive: userData.isActive
      };

      console.log('=== LOGIN SUCCESSFUL ===');
      console.log('User logged in:', userResponse.email, 'Role:', userResponse.role);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: userResponse
        }
      });

    } catch (error) {
      console.error('❌ LOGIN ERROR:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Internal server error during login: ' + error.message
      });
    }
  },

  // Verify email (kept for compatibility, but not needed for auto-verification)
  async verifyEmail(req, res) {
    try {
      console.log('=== EMAIL VERIFICATION STARTED ===');
      const { token } = req.body;

      if (!token) {
        console.log('❌ No verification token provided');
        return res.status(400).json({
          success: false,
          message: 'Verification token is required'
        });
      }

      console.log('🔍 Verifying token...');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token verified for user:', decoded.uid);
      
      // Update user verification status
      await db.collection('users').doc(decoded.uid).update({
        isVerified: true,
        updatedAt: new Date()
      });

      console.log('✅ Email verified successfully for user:', decoded.uid);

      res.json({
        success: true,
        message: 'Email verified successfully'
      });

    } catch (error) {
      console.error('❌ Email verification error:', error);
      res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }
  },

  // Resend verification email (kept for compatibility)
  async resendVerification(req, res) {
    try {
      console.log('=== RESEND VERIFICATION STARTED ===');
      const { email } = req.body;

      if (!email) {
        console.log('❌ No email provided');
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      console.log('🔍 Finding user:', email);
      const userSnapshot = await db.collection('users')
        .where('email', '==', email.toLowerCase())
        .get();

      if (userSnapshot.empty) {
        console.log('❌ User not found:', email);
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const userDoc = userSnapshot.docs[0];
      const userData = userDoc.data();

      if (userData.isVerified) {
        console.log('❌ Email already verified:', email);
        return res.status(400).json({
          success: false,
          message: 'Email is already verified'
        });
      }

      // Generate new verification token
      console.log('🎫 Generating new verification token...');
      const verificationToken = jwt.sign(
        { uid: userDoc.id, email: userData.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Send verification email
      console.log('📧 Sending verification email...');
      await sendVerificationEmail(email, verificationToken);

      console.log('✅ Verification email resent to:', email);

      res.json({
        success: true,
        message: 'Verification email sent successfully'
      });

    } catch (error) {
      console.error('❌ Resend verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Forgot password
  async forgotPassword(req, res) {
    try {
      console.log('=== FORGOT PASSWORD STARTED ===');
      const { email } = req.body;

      if (!email) {
        console.log('❌ No email provided');
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      console.log('🔍 Finding user for password reset:', email);
      const userSnapshot = await db.collection('users')
        .where('email', '==', email.toLowerCase())
        .get();

      if (userSnapshot.empty) {
        console.log('❌ No user found with email:', email);
        return res.status(404).json({
          success: false,
          message: 'No user found with this email'
        });
      }

      const userDoc = userSnapshot.docs[0];
      const resetToken = jwt.sign(
        { uid: userDoc.id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      console.log('✅ Reset token generated for user:', userDoc.id);

      try {
        console.log('📧 Sending password reset email...');
        await sendPasswordResetEmail(email, resetToken);
        console.log('✅ Password reset email sent to:', email);
        
        res.json({
          success: true,
          message: 'Password reset instructions sent to your email'
        });
      } catch (emailError) {
        console.error('❌ Password reset email failed:', emailError);
        
        res.status(500).json({
          success: false,
          message: 'Password reset requested, but email failed to send. Please try again later.'
        });
      }

    } catch (error) {
      console.error('❌ Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Reset password
  async resetPassword(req, res) {
    try {
      console.log('=== PASSWORD RESET STARTED ===');
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        console.log('❌ Missing token or new password');
        return res.status(400).json({
          success: false,
          message: 'Token and new password are required'
        });
      }

      console.log('🔍 Verifying reset token...');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token verified for user:', decoded.uid);

      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await db.collection('users').doc(decoded.uid).update({
        password: hashedPassword,
        updatedAt: new Date()
      });

      console.log('✅ Password reset successfully for user:', decoded.uid);

      res.json({
        success: true,
        message: 'Password reset successfully'
      });

    } catch (error) {
      console.error('❌ Reset password error:', error);
      res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }
  },

  // Get user profile
  async getProfile(req, res) {
    try {
      console.log('=== GET PROFILE STARTED ===');
      const userId = req.user.uid;
      console.log('Fetching profile for user:', userId);

      const userDoc = await db.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        console.log('❌ User not found:', userId);
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const userData = userDoc.data();
      
      // Remove sensitive data
      const { password, ...userProfile } = userData;

      console.log('✅ Profile fetched successfully for:', userData.email);

      res.json({
        success: true,
        data: userProfile
      });

    } catch (error) {
      console.error('❌ Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Update user profile
  async updateProfile(req, res) {
    try {
      console.log('=== UPDATE PROFILE STARTED ===');
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Validation errors:', errors.array());
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const userId = req.user.uid;
      const updateData = req.body;

      console.log('Updating profile for user:', userId, 'Data:', updateData);

      // Remove fields that shouldn't be updated
      delete updateData.password;
      delete updateData.email;
      delete updateData.role;
      delete updateData.isVerified;

      // Add updated timestamp
      updateData.updatedAt = new Date();

      await db.collection('users').doc(userId).update(updateData);

      // Get updated user data
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();
      const { password, ...userProfile } = userData;

      console.log('✅ Profile updated successfully for:', userData.email);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: userProfile
      });

    } catch (error) {
      console.error('❌ Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Change password
  async changePassword(req, res) {
    try {
      console.log('=== CHANGE PASSWORD STARTED ===');
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Validation errors:', errors.array());
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const userId = req.user.uid;
      const { currentPassword, newPassword } = req.body;

      console.log('Changing password for user:', userId);

      // Get user current data
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();

      // Verify current password
      console.log('🔐 Verifying current password...');
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userData.password);
      if (!isCurrentPasswordValid) {
        console.log('❌ Current password is incorrect');
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await db.collection('users').doc(userId).update({
        password: hashedNewPassword,
        updatedAt: new Date()
      });

      console.log('✅ Password changed successfully for user:', userId);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      console.error('❌ Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Delete account (soft delete)
  async deleteAccount(req, res) {
    try {
      console.log('=== DELETE ACCOUNT STARTED ===');
      const userId = req.user.uid;
      const { password } = req.body;

      console.log('Deleting account for user:', userId);

      // Get user data
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();

      // Verify password
      console.log('🔐 Verifying password for account deletion...');
      const isPasswordValid = await bcrypt.compare(password, userData.password);
      if (!isPasswordValid) {
        console.log('❌ Password is incorrect for account deletion');
        return res.status(400).json({
          success: false,
          message: 'Password is incorrect'
        });
      }

      // Soft delete - mark as inactive
      await db.collection('users').doc(userId).update({
        isActive: false,
        deletedAt: new Date(),
        updatedAt: new Date()
      });

      console.log('✅ Account deleted successfully for user:', userId);

      res.json({
        success: true,
        message: 'Account deleted successfully'
      });

    } catch (error) {
      console.error('❌ Delete account error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};

console.log('✅ Auth Controller loaded successfully with auto-verification');

module.exports = authController;