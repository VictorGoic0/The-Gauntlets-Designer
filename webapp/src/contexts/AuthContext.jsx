import { createContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";

// Create Auth Context
export const AuthContext = createContext(null);

// AuthProvider component
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const onFirebaseAuthStateChanged = (user) => {
    setCurrentUser(user);
    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, onFirebaseAuthStateChanged);

    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      currentUser,
      loading,
    }),
    [currentUser, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

