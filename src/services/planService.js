// src/services/planService.js
import { db, serverTimestamp } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

// Define your plans (could also be fetched from Firestore if they are complex)
export const PLANS = {
  free: { name: "Free", credits: 5000, price: 0 },
  basic: { name: "Basic", credits: 20000, price: 10 },
  pro: { name: "Pro", credits: 100000, price: 25 },
};

export const planService = {
  /**
   * Updates the user's plan and resets credits according to the new plan.
   * @param {string} userId
   * @param {string} newPlanId - e.g., "free", "basic", "pro"
   * @returns {Promise<void>}
   */
  async selectPlan(userId, newPlanId) {
    if (!userId) throw new Error("User ID is required.");
    if (!PLANS[newPlanId]) throw new Error(`Invalid plan ID: ${newPlanId}`);

    const userDocRef = doc(db, 'users', userId);
    const planDetails = PLANS[newPlanId];

    try {
      await updateDoc(userDocRef, {
        plan: newPlanId,
        credits: planDetails.credits, // Or adjust logic for prorated credits, etc.
        updatedAt: serverTimestamp(),
      });
      console.log(`User ${userId} plan updated to ${newPlanId}. Credits set to ${planDetails.credits}`);
    } catch (error) {
      console.error("Error selecting plan:", error);
      throw error;
    }
  },

  getPlanDetails(planId) {
    return PLANS[planId] || null;
  }
};