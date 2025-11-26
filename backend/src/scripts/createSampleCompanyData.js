const { db } = require('../config/firebase');
const bcrypt = require('bcryptjs');

const createSampleCompanyData = async () => {
  try {
    console.log('💼 Creating sample company data...');

    // Create sample companies
    const companies = [
      {
        email: 'tech.solutions@example.com',
        companyName: 'Tech Solutions Ltd',
        industry: 'Information Technology',
        size: '51-200',
        address: '456 Tech Park, Maseru, Lesotho',
        phone: '+266 2233 4455',
        website: 'https://techsolutions.ls',
        description: 'Leading technology solutions provider in Lesotho, specializing in software development and IT consulting.'
      },
      {
        email: 'green.energy@example.com',
        companyName: 'Green Energy Africa',
        industry: 'Renewable Energy',
        size: '201-500',
        address: '789 Energy Street, Maseru, Lesotho',
        phone: '+266 3344 5566',
        website: 'https://greenenergyafrica.ls',
        description: 'Pioneering renewable energy solutions across Southern Africa, focusing on solar and wind power.'
      },
      {
        email: 'finance.partners@example.com',
        companyName: 'Finance Partners Lesotho',
        industry: 'Financial Services',
        size: '11-50',
        address: '321 Finance Avenue, Maseru, Lesotho',
        phone: '+266 4455 6677',
        website: 'https://financepartners.ls',
        description: 'Providing comprehensive financial services and investment solutions to businesses and individuals.'
      }
    ];

    const companyIds = [];
    
    for (const company of companies) {
      // Check if company already exists
      const companySnapshot = await db.collection('users')
        .where('email', '==', company.email)
        .get();

      if (companySnapshot.empty) {
        const hashedPassword = await bcrypt.hash('company123', 12);
        
        const companyData = {
          email: company.email,
          password: hashedPassword,
          role: 'company',
          ...company,
          isVerified: true,
          isApproved: true,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const companyRef = await db.collection('users').add(companyData);
        companyIds.push(companyRef.id);
        console.log(`✅ Company created: ${company.companyName}`);
      } else {
        companyIds.push(companySnapshot.docs[0].id);
        console.log(`✅ Company already exists: ${company.companyName}`);
      }
    }

    // Create sample job postings
    const jobs = [
      // Tech Solutions Ltd jobs
      {
        companyId: companyIds[0],
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
          requiredSkills: ['JavaScript', 'Python', 'Problem Solving'],
          minExperience: '0-1 years'
        },
        location: 'Maseru, Lesotho',
        jobType: 'full-time',
        salaryRange: { min: 15000, max: 25000, currency: 'LSL' },
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        positionsAvailable: 3
      },
      {
        companyId: companyIds[0],
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
        positionsAvailable: 2
      },

      // Green Energy Africa jobs
      {
        companyId: companyIds[1],
        title: 'Renewable Energy Engineer',
        department: 'Engineering',
        description: 'We are looking for a Renewable Energy Engineer to join our team. You will be responsible for designing, developing, and evaluating renewable energy projects with a focus on solar and wind power solutions.',
        requirements: [
          'Bachelor\'s degree in Electrical Engineering or Renewable Energy',
          'Knowledge of renewable energy systems and technologies',
          'Experience with energy modeling software'
        ],
        qualifications: {
          minEducation: 'Bachelor\'s Degree',
          requiredSkills: ['Renewable Energy', 'Project Management', 'CAD Software'],
          minExperience: '2-3 years'
        },
        location: 'Maseru, Lesotho',
        jobType: 'full-time',
        salaryRange: { min: 20000, max: 35000, currency: 'LSL' },
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        positionsAvailable: 1
      },

      // Finance Partners Lesotho jobs
      {
        companyId: companyIds[2],
        title: 'Financial Analyst Intern',
        department: 'Finance',
        description: 'We are offering an internship opportunity for a Financial Analyst to gain practical experience in financial modeling, data analysis, and investment research in a dynamic financial services environment.',
        requirements: [
          'Currently pursuing or recently completed a degree in Finance, Economics, or related field',
          'Strong analytical and mathematical skills',
          'Proficiency in Microsoft Excel'
        ],
        qualifications: {
          minEducation: 'Bachelor\'s Degree (in progress)',
          requiredSkills: ['Financial Analysis', 'Excel', 'Data Interpretation'],
          minExperience: '0 years (internship)'
        },
        location: 'Maseru, Lesotho',
        jobType: 'internship',
        salaryRange: { min: 8000, max: 12000, currency: 'LSL' },
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        positionsAvailable: 2
      }
    ];

    const jobIds = [];
    for (const job of jobs) {
      const jobData = {
        ...job,
        positionsFilled: 0,
        status: 'active',
        views: Math.floor(Math.random() * 100),
        applicationsCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const jobRef = await db.collection('jobs').add(jobData);
      jobIds.push(jobRef.id);
      console.log(`✅ Job created: ${job.title} at ${job.department}`);
    }

    console.log('🎉 Sample company data created successfully!');
    console.log('🏢 Created/Found:', companies.length, 'companies');
    console.log('💼 Created:', jobs.length, 'job postings');
    console.log('📧 Company Logins:');
    companies.forEach((company, index) => {
      console.log(`   ${company.email} / company123`);
    });

  } catch (error) {
    console.error('❌ Error creating sample company data:', error.message);
  }
};

if (require.main === module) {
  createSampleCompanyData();
}

module.exports = createSampleCompanyData;