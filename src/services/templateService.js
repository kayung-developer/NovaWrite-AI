// src/services/templateService.js
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore'; // Added query, orderBy

// If you still want MOCK_TEMPLATES as a fallback or for initial load:
// import { MOCK_TEMPLATES } from '../mockData';

let cachedTemplates = null; // Simple in-memory cache

export const templateService = {
  async fetchTemplates(forceRefresh = false) {
    if (cachedTemplates && !forceRefresh) {
      return cachedTemplates;
    }

    try {
      // Example: order by a field 'order' if you add it, or 'name'
      const q = query(collection(db, 'templates'), orderBy('name')); // or orderBy('order')
      const querySnapshot = await getDocs(q);
      const templates = [];
      querySnapshot.forEach((doc) => {
        templates.push({ id: doc.id, ...doc.data() });
      });
      cachedTemplates = templates;
      return templates;
    } catch (error) {
      console.error("Error fetching templates from Firestore:", error);
      // Fallback to MOCK_TEMPLATES if desired, or handle error
      // return MOCK_TEMPLATES;
      throw error; // Or return empty array: return [];
    }
  },

  // Client-side filtering remains useful even if data is from Firestore
  filterTemplates(templates, searchTerm, category) {
    return templates.filter(template => {
      const nameMatch = template.name.toLowerCase().includes(searchTerm.toLowerCase());
      const categoryMatch = category ? template.category === category : true;
      return nameMatch && categoryMatch;
    });
  }
};