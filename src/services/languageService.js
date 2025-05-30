// src/services/languageService.js
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

// import { MOCK_LANGUAGES } from '../mockData'; // Fallback

let cachedLanguages = null;

export const languageService = {
  async fetchLanguages(forceRefresh = false) {
    if (cachedLanguages && !forceRefresh) {
      return cachedLanguages;
    }
    try {
      const q = query(collection(db, 'languages'), orderBy('name')); // Order by name
      const querySnapshot = await getDocs(q);
      const languages = [];
      querySnapshot.forEach((doc) => {
        languages.push({ id: doc.id, ...doc.data() });
      });
      cachedLanguages = languages;
      return languages;
    } catch (error) {
      console.error("Error fetching languages from Firestore:", error);
      // Fallback or handle error
      // return MOCK_LANGUAGES;
      throw error; // Or return [];
    }
  }
};