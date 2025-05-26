// src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword 
} from 'firebase/auth';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Prisijungimo klaida. Bandykite vėliau.';
      
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Neteisingas el. pašto formatas.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Vartotojas užblokuotas.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'Vartotojas nerastas.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Neteisingas slaptažodis.';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Neteisingi prisijungimo duomenys.';
          break;
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Helper function to create admin user (run once)
  const createAdminUser = async (email, password) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Admin user created:', result.user.email);
      return { success: true };
    } catch (error) {
      console.error('Error creating admin user:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    currentUser,
    login,
    logout,
    isAuthenticated: !!currentUser,
    loading,
    createAdminUser // For initial setup only
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}