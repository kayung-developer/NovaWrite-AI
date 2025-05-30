// api/_firebaseAdmin.js
import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY); // Parse first
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount) // Use parsed object
    });
    console.log('Firebase Admin SDK Initialized');
  } catch (error) {
    console.error('Firebase Admin SDK Initialization Error. Service Key (first 50 chars):', process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? process.env.FIREBASE_SERVICE_ACCOUNT_KEY.substring(0,50) : "UNDEFINED/MISSING");
    console.error('Full Initialization Error:', error.stack);
    // Optional: throw the error to prevent the function from continuing with a broken admin SDK
    // throw new Error("Failed to initialize Firebase Admin SDK. Check Vercel environment variables and logs.");
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
export default admin; // Make sure this default export is used or FieldValue is imported directly
