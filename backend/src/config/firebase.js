const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const initializeFirebase = () => {
  try {
    console.log('🔧 Initializing Firebase...');

    let serviceAccount;

    // --- METHOD 1: Use Environment Variable (CRITICAL FOR RENDER) ---
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      console.log('☁️ Using SERVICE ACCOUNT KEY from Environment Variable for Firebase configuration');
      try {
        // Parse the JSON string from the environment variable
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      } catch (e) {
        console.error('❌ Error parsing FIREBASE_SERVICE_ACCOUNT_KEY JSON:', e.message);
        throw new Error('Invalid Firebase Service Account JSON provided via environment variable.');
      }
    } 
    // --- METHOD 2: Fallback to Local File (for local development) ---
    else {
      const serviceAccountPath = path.join(__dirname, '..', '..', 'firebase-service-account.json');
      
      if (fs.existsSync(serviceAccountPath)) {
        console.log('📁 Using local service account file for Firebase configuration');
        try {
          // Note: Using require() on a json file works best for local files
          serviceAccount = require(serviceAccountPath); 
        } catch (fileError) {
          console.error('❌ Error reading local service account file:', fileError.message);
          throw fileError;
        }
      } else {
        console.log('❌ Service account file not found at:', serviceAccountPath);
        throw new Error('Firebase service account file not found or FIREBASE_SERVICE_ACCOUNT_KEY environment variable not set.');
      }
    }

    // --- Common Initialization Logic ---
    
    // Validate the service account (basic check)
    if (!serviceAccount || !serviceAccount.private_key || !serviceAccount.client_email) {
      throw new Error('Service account object is missing required fields (private_key or client_email).');
    }

    // Fix private key formatting (important if copied as a single line JSON string)
    let privateKey = serviceAccount.private_key;
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    const config = {
      credential: admin.credential.cert({
        ...serviceAccount,
        private_key: privateKey
      }),
      // Use FIREBASE_DATABASE_URL from environment variable if available
      databaseURL: process.env.FIREBASE_DATABASE_URL || `https://${serviceAccount.project_id}.firebaseio.com`,
      storageBucket: `${serviceAccount.project_id}.appspot.com`
    };

    if (admin.apps.length === 0) {
      admin.initializeApp(config);
      console.log('✅ Firebase Admin initialized successfully.');
    }
    
    console.log(`📁 Project: ${serviceAccount.project_id || 'Unknown'}`);
    console.log(`📧 Service Account: ${serviceAccount.client_email || 'Unknown'}`);
    return admin;

  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error.message);
    
    console.log('\n🔧 Firebase Troubleshooting Guide:');
    console.log('1. For Render: Ensure FIREBASE_SERVICE_ACCOUNT_KEY is set and contains the full JSON string.');
    console.log('2. For Local: Ensure firebase-service-account.json is present.');
    
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
