// api/_firebaseAdmin.js
import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY))
    });
    console.log('Firebase Admin SDK Initialized');
  } catch (error) {
    console.error('Firebase Admin SDK Initialization Error:', error.stack);
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
export default admin;
