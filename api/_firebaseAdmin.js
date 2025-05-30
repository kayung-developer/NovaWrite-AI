// api/_firebaseAdmin.js
import admin from 'firebase-admin';

let isFirebaseAdminInitialized = false;

if (!admin.apps.length) {
  try {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountString) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set or empty.");
    }
    const serviceAccount = JSON.parse(serviceAccountString);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin SDK Initialized successfully.');
    isFirebaseAdminInitialized = true;
  } catch (error) {
    console.error('CRITICAL: Firebase Admin SDK Initialization Error. Service Key (first 50 chars):', process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? process.env.FIREBASE_SERVICE_ACCOUNT_KEY.substring(0,50) : "UNDEFINED/MISSING");
    console.error('Full Initialization Error:', error.stack);
    // DO NOT export db and auth if initialization failed
  }
} else {
  isFirebaseAdminInitialized = true; // Already initialized
}

// Conditionally export or export objects that will throw if not initialized
export const db = isFirebaseAdminInitialized ? admin.firestore() : null;
export const auth = isFirebaseAdminInitialized ? admin.auth() : null;
export default admin; // The admin object itself

export { isFirebaseAdminInitialized }; // Export the status
