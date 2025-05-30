// src/services/creditService.js
import { db, serverTimestamp } from '../firebase';
import { doc, runTransaction, getDoc } from 'firebase/firestore'; // Import getDoc for transaction

export const creditService = {
  /**
   * Deducts credits from a user's account using a transaction for atomicity.
   * @param {string} userId
   * @param {number} amountToDeduct
   * @returns {Promise<{success: boolean, newCredits?: number, message?: string}>}
   */
  async deductCredits(userId, amountToDeduct) {
    if (!userId) return { success: false, message: "User ID is required." };
    if (amountToDeduct <= 0) return { success: false, message: "Amount to deduct must be positive." };

    const userDocRef = doc(db, 'users', userId);

    try {
      const newCredits = await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userDocRef); // Use transaction.get

        if (!userDoc.exists()) {
          throw new Error("User document does not exist!"); // Or handle as needed
        }

        const currentCredits = userDoc.data().credits;
        if (currentCredits < amountToDeduct) {
          throw new Error("Insufficient credits."); // This error will be caught by the outer try/catch
        }

        const updatedCredits = currentCredits - amountToDeduct;
        transaction.update(userDocRef, {
          credits: updatedCredits,
          updatedAt: serverTimestamp(),
        });
        return updatedCredits; // Return the new credit balance from the transaction
      });

      console.log(`Deducted ${amountToDeduct} credits for user ${userId}. New balance: ${newCredits}`);
      return { success: true, newCredits };
    } catch (error) {
      console.error("Error deducting credits:", error.message);
      return { success: false, message: error.message };
    }
  },

  /**
   * Adds credits to a user's account.
   * Could also use a transaction if multiple operations might add credits simultaneously.
   * @param {string} userId
   * @param {number} amountToAdd
   * @returns {Promise<{success: boolean, newCredits?: number, message?: string}>}
   */
  async addCredits(userId, amountToAdd) {
    // Simplified: for more complex scenarios, use a transaction like deductCredits
    if (!userId) return { success: false, message: "User ID is required." };
    if (amountToAdd <= 0) return { success: false, message: "Amount to add must be positive." };

    const userDocRef = doc(db, 'users', userId);
    try {
        const userDocSnap = await getDoc(userDocRef);
        if (!userDocSnap.exists()) {
            return { success: false, message: "User document does not exist!" };
        }
        const currentCredits = userDocSnap.data().credits;
        const newCredits = currentCredits + amountToAdd;
        await updateDoc(userDocRef, {
            credits: newCredits,
            updatedAt: serverTimestamp(),
        });
        return { success: true, newCredits };
    } catch (error) {
        console.error("Error adding credits:", error);
        return { success: false, message: error.message };
    }
  }
};