const { db } = require('../config/firebase');

const cleanupApplications = async () => {
  try {
    console.log('🧹 Cleaning up applications data...');
    
    // Get all applications
    const applicationsSnapshot = await db.collection('applications').get();
    
    let corruptedCount = 0;
    let validCount = 0;
    
    for (const doc of applicationsSnapshot.docs) {
      const application = doc.data();
      
      // Check if application has required fields
      if (!application.courseId || !application.studentId || !application.instituteId) {
        console.log(`❌ Corrupted application found: ${doc.id}`, {
          courseId: application.courseId,
          studentId: application.studentId,
          instituteId: application.instituteId
        });
        
        // Delete corrupted applications
        await db.collection('applications').doc(doc.id).delete();
        corruptedCount++;
      } else {
        validCount++;
      }
    }
    
    console.log('🎉 Cleanup completed!');
    console.log(`✅ Valid applications: ${validCount}`);
    console.log(`🗑️  Deleted corrupted applications: ${corruptedCount}`);
    
  } catch (error) {
    console.error('❌ Cleanup error:', error);
  }
};

if (require.main === module) {
  cleanupApplications();
}

module.exports = cleanupApplications;