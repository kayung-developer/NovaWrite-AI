// Example: App.js or a context provider
import React, { useState, useEffect, createContext, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase'; // Your Firebase setup
import { userService } from './services/userService'; // Your user service

// Create a context for user data
const UserContext = createContext(null);
export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null); // Firebase Auth user
  const [userProfile, setUserProfile] = useState(null); // Firestore user profile
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoadingUser(true);
      if (user) {
        setCurrentUser(user);
        // Fetch or create user profile from Firestore
        const profile = await userService.getOrCreateUserProfile(user);
        setUserProfile(profile);
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoadingUser(false);
    });

    return () => unsubscribe(); // Cleanup subscription
  }, []);

  // Function to refresh user profile (e.g., after plan change or credit deduction)
  const refreshUserProfile = async () => {
    if (currentUser) {
      setLoadingUser(true);
      const profile = await userService.getUserProfile(currentUser.uid);
      setUserProfile(profile);
      setLoadingUser(false);
    }
  };

  const value = {
    currentUser,      // from Auth
    userProfile,      // from Firestore (plan, credits, etc.)
    loadingUser,
    refreshUserProfile // Add this to context
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

// In your main index.js or App.js
// ReactDOM.render(
//   <React.StrictMode>
//     <UserProvider>
//       <App />
//     </UserProvider>
//   </React.StrictMode>,
//   document.getElementById('root')
// );

// In your components, you can now use:
// const { currentUser, userProfile, loadingUser, refreshUserProfile } = useUser();
// if (loadingUser) return <p>Loading user...</p>;
// if (userProfile) { /* Access userProfile.plan, userProfile.credits */ }