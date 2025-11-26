const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const initializeFirebase = () => {
  try {
    console.log('🔧 Initializing Firebase...');

    // Method 1: Try using the service account file first
    const serviceAccountPath = path.join(__dirname, '..', '..', 'firebase-service-account.json');
    
    if (fs.existsSync(serviceAccountPath)) {
      console.log('📁 Using service account file for Firebase configuration');
      
      try {
        const serviceAccount = require(serviceAccountPath);
        
        // Validate the service account
        if (!serviceAccount.private_key || !serviceAccount.client_email) {
          throw new Error('Service account file is missing required fields');
        }

        // Fix private key formatting if needed
        let privateKey = serviceAccount.private_key;
        if (privateKey.includes('\\n')) {
          privateKey = privateKey.replace(/\\n/g, '\n');
        }

        const config = {
          credential: admin.credential.cert({
            ...serviceAccount,
            private_key: privateKey
          }),
          databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
          storageBucket: `${serviceAccount.project_id}.appspot.com`
        };

        if (admin.apps.length === 0) {
          admin.initializeApp(config);
          console.log('✅ Firebase Admin initialized with service account file');
        }
        
        console.log(`📁 Project: ${serviceAccount.project_id}`);
        console.log(`📧 Service Account: ${serviceAccount.client_email}`);
        return admin;
      } catch (fileError) {
        console.error('❌ Error reading service account file:', fileError.message);
        throw fileError;
      }
    } else {
      console.log('❌ Service account file not found at:', serviceAccountPath);
      throw new Error('Firebase service account file not found');
    }

  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error.message);
    
    // Provide detailed troubleshooting information
    console.log('\n🔧 Firebase Troubleshooting Guide:');
    console.log('1. Download a new service account key:');
    console.log('   - Go to Firebase Console → Project Settings → Service Accounts');
    console.log('   - Click "Generate New Private Key"');
    console.log('   - Save as firebase-service-account.json in backend folder');
    console.log('2. Verify your Firebase project is active and billing is enabled');
    console.log('3. Check if the service account has proper permissions');
    console.log('4. Ensure your system clock is synchronized');
    
    return null;
  }
};

const firebaseApp = initializeFirebase();

// Only export db and auth if Firebase initialized successfully
let db = null;
let auth = null;

if (firebaseApp) {
  try {
    db = firebaseApp.firestore();
    auth = firebaseApp.auth();
    
    // Configure Firestore settings
    db.settings({ 
      ignoreUndefinedProperties: true,
      timestampsInSnapshots: true
    });
    
    console.log('✅ Firestore service initialized');
    console.log('✅ Auth service initialized');
    
    // Test the connection with a simple query
    console.log('🔌 Testing Firestore connection...');
    db.collection('test_connection').doc('test').get()
      .then(() => console.log('✅ Firestore connection test passed'))
      .catch(error => console.log('⚠️ Firestore connection test failed:', error.message));
      
  } catch (firestoreError) {
    console.error('❌ Firestore initialization failed:', firestoreError.message);
  }
} else {
  console.log('❌ Firebase services NOT initialized - running in degraded mode');
}

module.exports = { admin: firebaseApp, db, auth };