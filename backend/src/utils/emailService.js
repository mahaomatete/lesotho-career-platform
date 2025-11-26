const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Test email configuration
const testEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email server is ready to send messages');
    return true;
  } catch (error) {
    console.warn('⚠️ Email configuration issue:', error.message);
    console.log('📧 Email functionality may not work properly');
    return false;
  }
};

// Send verification email
const sendVerificationEmail = async (email, verificationToken) => {
  try {
    const canSendEmails = await testEmailConfig();
    if (!canSendEmails) {
      console.log('📧 [MOCK] Verification email would be sent to:', email);
      return true;
    }

    const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your Email - Career Guidance Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">Career Guidance Platform</h1>
            <p style="color: #666; margin: 10px 0 0 0;">Lesotho's Premier Career Development System</p>
          </div>
          
          <h2 style="color: #333; margin-bottom: 20px;">Email Verification Required</h2>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 25px;">
            Thank you for registering with the Career Guidance Platform. 
            To complete your registration and access all features, please verify your email address by clicking the button below:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #2563eb; color: white; padding: 14px 28px; 
                      text-decoration: none; border-radius: 6px; font-weight: bold; 
                      display: inline-block; font-size: 16px;">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #777; font-size: 14px; margin-bottom: 10px;">
            Or copy and paste this link in your browser:
          </p>
          <p style="background-color: #f8f9fa; padding: 12px; border-radius: 4px; 
                    word-break: break-all; font-size: 14px; color: #555; margin: 0;">
            ${verificationUrl}
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              This verification link will expire in 24 hours.<br>
              If you didn't create an account, please ignore this email.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to: ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    return false;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const canSendEmails = await testEmailConfig();
    if (!canSendEmails) {
      console.log('📧 [MOCK] Password reset email would be sent to:', email);
      return true;
    }

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Reset Your Password - Career Guidance Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2626; margin: 0;">Password Reset</h1>
            <p style="color: #666; margin: 10px 0 0 0;">Career Guidance Platform</p>
          </div>
          
          <h2 style="color: #333; margin-bottom: 20px;">Reset Your Password</h2>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 25px;">
            We received a request to reset your password for your Career Guidance Platform account. 
            Click the button below to create a new password:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #dc2626; color: white; padding: 14px 28px; 
                      text-decoration: none; border-radius: 6px; font-weight: bold; 
                      display: inline-block; font-size: 16px;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #777; font-size: 14px; margin-bottom: 10px;">
            Or copy and paste this link in your browser:
          </p>
          <p style="background-color: #f8f9fa; padding: 12px; border-radius: 4px; 
                    word-break: break-all; font-size: 14px; color: #555; margin: 0;">
            ${resetUrl}
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              This reset link will expire in 1 hour.<br>
              If you didn't request a password reset, please ignore this email and your password will remain unchanged.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to: ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    return false;
  }
};

// Send application status notification
const sendApplicationStatusEmail = async (email, studentName, courseName, status, instituteName) => {
  try {
    const canSendEmails = await testEmailConfig();
    if (!canSendEmails) {
      console.log(`📧 [MOCK] Application status email would be sent to ${email}: ${status} for ${courseName}`);
      return true;
    }

    const statusMessages = {
      admitted: {
        subject: 'Congratulations! You Have Been Admitted',
        message: `Congratulations! You have been admitted to ${courseName} at ${instituteName}.`,
        color: '#10b981'
      },
      rejected: {
        subject: 'Application Status Update',
        message: `Thank you for your application to ${courseName} at ${instituteName}. Unfortunately, you have not been selected for this program.`,
        color: '#ef4444'
      },
      waiting_list: {
        subject: 'Application Waiting List',
        message: `Your application for ${courseName} at ${instituteName} has been placed on the waiting list.`,
        color: '#f59e0b'
      }
    };

    const statusInfo = statusMessages[status] || {
      subject: 'Application Status Update',
      message: `Your application status for ${courseName} has been updated to ${status}.`,
      color: '#2563eb'
    };

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: statusInfo.subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: ${statusInfo.color}; margin: 0;">Application Update</h1>
            <p style="color: #666; margin: 10px 0 0 0;">Career Guidance Platform</p>
          </div>
          
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${studentName},</h2>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 25px;">
            ${statusInfo.message}
          </p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 25px 0;">
            <h3 style="color: #333; margin: 0 0 10px 0;">Application Details</h3>
            <p style="color: #555; margin: 5px 0;"><strong>Course:</strong> ${courseName}</p>
            <p style="color: #555; margin: 5px 0;"><strong>Institution:</strong> ${instituteName}</p>
            <p style="color: #555; margin: 5px 0;"><strong>Status:</strong> <span style="color: ${statusInfo.color}; font-weight: bold;">${status.charAt(0).toUpperCase() + status.slice(1)}</span></p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/student/applications" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; font-weight: bold; 
                      display: inline-block;">
              View Application Details
            </a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              This is an automated notification. Please do not reply to this email.<br>
              If you have any questions, contact the institution directly.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Application status email sent to: ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending application status email:', error);
    return false;
  }
};

// Send job application status notification
const sendJobApplicationStatusEmail = async (email, studentName, jobTitle, companyName, status, interviewDate = null) => {
  try {
    const canSendEmails = await testEmailConfig();
    if (!canSendEmails) {
      console.log(`📧 [MOCK] Job application status email would be sent to ${email}: ${status} for ${jobTitle}`);
      return true;
    }

    const statusMessages = {
      shortlisted: {
        subject: 'Interview Invitation',
        message: `Congratulations! You have been shortlisted for ${jobTitle} at ${companyName}.`,
        color: '#10b981'
      },
      rejected: {
        subject: 'Job Application Update',
        message: `Thank you for your application to ${jobTitle} at ${companyName}. Unfortunately, you have not been selected to proceed.`,
        color: '#ef4444'
      },
      hired: {
        subject: 'Job Offer',
        message: `Congratulations! You have been selected for ${jobTitle} at ${companyName}.`,
        color: '#10b981'
      }
    };

    const statusInfo = statusMessages[status] || {
      subject: 'Job Application Update',
      message: `Your application status for ${jobTitle} has been updated to ${status}.`,
      color: '#2563eb'
    };

    const transporter = createTransporter();

    let interviewSection = '';
    if (status === 'shortlisted' && interviewDate) {
      interviewSection = `
        <div style="background-color: #f0f9ff; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #0ea5e9;">
          <h4 style="color: #0369a1; margin: 0 0 10px 0;">Interview Details</h4>
          <p style="color: #0c4a6e; margin: 5px 0;"><strong>Date & Time:</strong> ${new Date(interviewDate).toLocaleString()}</p>
          <p style="color: #0c4a6e; margin: 5px 0;"><strong>Location:</strong> Will be provided separately</p>
        </div>
      `;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: statusInfo.subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: ${statusInfo.color}; margin: 0;">Job Application Update</h1>
            <p style="color: #666; margin: 10px 0 0 0;">Career Guidance Platform</p>
          </div>
          
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${studentName},</h2>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 25px;">
            ${statusInfo.message}
          </p>
          
          ${interviewSection}
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 25px 0;">
            <h3 style="color: #333; margin: 0 0 10px 0;">Application Details</h3>
            <p style="color: #555; margin: 5px 0;"><strong>Position:</strong> ${jobTitle}</p>
            <p style="color: #555; margin: 5px 0;"><strong>Company:</strong> ${companyName}</p>
            <p style="color: #555; margin: 5px 0;"><strong>Status:</strong> <span style="color: ${statusInfo.color}; font-weight: bold;">${status.charAt(0).toUpperCase() + status.slice(1)}</span></p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/student/job-applications" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; font-weight: bold; 
                      display: inline-block;">
              View Application Details
            </a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              This is an automated notification. Please do not reply to this email.<br>
              If you have any questions, contact the company directly.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Job application status email sent to: ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending job application status email:', error);
    return false;
  }
};

// Send new job notification to qualified students
const sendNewJobNotification = async (email, studentName, jobTitle, companyName, qualificationScore) => {
  try {
    const canSendEmails = await testEmailConfig();
    if (!canSendEmails) {
      console.log(`📧 [MOCK] New job notification would be sent to ${email}: ${jobTitle} at ${companyName}`);
      return true;
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `New Job Opportunity: ${jobTitle} at ${companyName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #7c3aed; margin: 0;">New Job Match Found!</h1>
            <p style="color: #666; margin: 10px 0 0 0;">Career Guidance Platform</p>
          </div>
          
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${studentName},</h2>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 25px;">
            We found a new job opportunity that matches your profile with a <strong>${qualificationScore}% qualification match</strong>.
          </p>
          
          <div style="background-color: #faf5ff; padding: 20px; border-radius: 6px; margin: 25px 0; border-left: 4px solid #7c3aed;">
            <h3 style="color: #5b21b6; margin: 0 0 15px 0;">Job Opportunity</h3>
            <p style="color: #6d28d9; margin: 8px 0; font-size: 18px; font-weight: bold;">${jobTitle}</p>
            <p style="color: #7c3aed; margin: 8px 0; font-size: 16px;">${companyName}</p>
            <p style="color: #8b5cf6; margin: 8px 0;">Qualification Match: <strong>${qualificationScore}%</strong></p>
          </div>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 25px;">
            This position appears to be a great fit for your skills and qualifications. 
            We encourage you to review the job details and apply if interested.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/student/jobs" 
               style="background-color: #7c3aed; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; font-weight: bold; 
                      display: inline-block; margin: 0 10px;">
              Browse Jobs
            </a>
            <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/student/jobs?search=${encodeURIComponent(jobTitle)}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; font-weight: bold; 
                      display: inline-block; margin: 0 10px;">
              View This Job
            </a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              You received this notification because your profile matches this job's requirements.<br>
              To adjust your notification preferences, update your account settings.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ New job notification sent to: ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending new job notification:', error);
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendApplicationStatusEmail,
  sendJobApplicationStatusEmail,
  sendNewJobNotification,
  testEmailConfig
};