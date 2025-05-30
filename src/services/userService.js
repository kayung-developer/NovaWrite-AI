// src/services/userService.js
import { db, serverTimestamp } from '../firebase'; // Adjust path as needed
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const DEFAULT_FREE_PLAN_CREDITS = 5000; // Example

export const userService = {
  /**
   * Fetches or creates a user profile in Firestore.
   * Called when currentUser is set (e.g., onAuthStateChanged).
   * @param {object} authUser - Firebase Auth user object (user from onAuthStateChanged)
   * @returns {Promise<object|null>} User profile data from Firestore or null if error.
   */
  async getOrCreateUserProfile(authUser) {
    if (!authUser) return null;

    const userDocRef = doc(db, 'users', authUser.uid);
    try {
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        // User profile exists
        return { uid: authUser.uid, ...docSnap.data() };
      } else {
        // New user, create a profile
        console.log('Creating new user profile for:', authUser.uid);
        const newUserProfile = {
          uid: authUser.uid,
          email: authUser.email,
          username: authUser.displayName || authUser.email.split('@')[0], // Default username
          plan: 'free', // Default plan
          credits: DEFAULT_FREE_PLAN_CREDITS, // Default credits for free plan
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await setDoc(userDocRef, newUserProfile);
        return newUserProfile;
      }
    } catch (error) {
      console.error("Error getting or creating user profile:", error);
      return null;
    }
  },

  /**
   * Fetches a user's full profile from Firestore.
   * @param {string} userId
   * @returns {Promise<object|null>} User profile data or null if not found/error.
   */
  async getUserProfile(userId) {
    if (!userId) return null;
    const userDocRef = doc(db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        return { uid: userId, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  },

  /**
   * Updates specific fields in a user's profile.
   * @param {string} userId
   * @param {object} dataToUpdate - e.g., { username: "New Name" }
   * @returns {Promise<void>}
   */
  async updateUserProfile(userId, dataToUpdate) {
    if (!userId) throw new Error("User ID is required for update.");
    const userDocRef = doc(db, 'users', userId);
    try {
      await updateDoc(userDocRef, {
        ...dataToUpdate,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  }
};