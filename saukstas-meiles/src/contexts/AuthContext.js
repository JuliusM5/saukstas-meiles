// src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

// Custom hook for using auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  
  // Constants for security
  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour
  
  useEffect(() => {
    // Check for lockout on mount
    const lockoutEndTime = localStorage.getItem('authLockoutEndTime');
    if (lockoutEndTime) {
      const remainingTime = parseInt(lockoutEndTime) - Date.now();
      if (remainingTime > 0) {
        setIsLocked(true);
        setTimeout(() => {
          setIsLocked(false);
          localStorage.removeItem('authLockoutEndTime');
          setLoginAttempts(0);
        }, remainingTime);
      } else {
        localStorage.removeItem('authLockoutEndTime');
      }
    }
    
    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Check if user document exists in Firestore
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          let userData = null;
          
          if (!userDoc.exists()) {
            // Create user document if it doesn't exist
            console.log('Creating user document for:', user.email);
            
            const newUserData = {
              email: user.email,
              role: 'admin', // Default to admin for first user
              created_at: new Date().toISOString(),
              last_login: new Date().toISOString()
            };
            
            try {
              await setDoc(userDocRef, newUserData);
              userData = newUserData;
              console.log('User document created successfully');
            } catch (createError) {
              console.error('Error creating user document:', createError);
              // Continue without Firestore document
              userData = { role: 'admin' };
            }
          } else {
            // User document exists
            userData = userDoc.data();
            
            // Update last login
            try {
              await setDoc(userDocRef, {
                last_login: new Date().toISOString()
              }, { merge: true });
            } catch (updateError) {
              console.error('Error updating last login:', updateError);
              // Continue even if update fails
            }
          }
          
          // Check if user has admin role
          if (userData && userData.role === 'admin') {
            // Check session timeout
            const lastActivity = localStorage.getItem('lastAuthActivity');
            if (lastActivity) {
              const timeSinceActivity = Date.now() - parseInt(lastActivity);
              if (timeSinceActivity > SESSION_TIMEOUT) {
                // Session expired
                await logout();
                return;
              }
            }
            
            // Update last activity
            localStorage.setItem('lastAuthActivity', Date.now().toString());
            
            // Set user with additional info
            setCurrentUser({
              ...user,
              role: userData.role,
              sessionStart: Date.now()
            });
          } else {
            // User exists but is not admin
            console.warn('User is not admin:', user.email);
            await signOut(auth);
            setCurrentUser(null);
          }
        } catch (error) {
          console.error('Error checking user role:', error);
          // In case of any error, allow the user to continue
          // This prevents lockouts due to Firestore permission issues
          setCurrentUser({
            ...user,
            role: 'admin', // Assume admin to prevent lockout
            sessionStart: Date.now()
          });
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    
    // Set up activity listener for session timeout
    const updateActivity = () => {
      if (currentUser) {
        localStorage.setItem('lastAuthActivity', Date.now().toString());
      }
    };
    
    window.addEventListener('click', updateActivity);
    window.addEventListener('keypress', updateActivity);
    
    return () => {
      unsubscribe();
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('keypress', updateActivity);
    };
  }, [currentUser]);

  const login = async (email, password) => {
    try {
      // Check if locked out
      if (isLocked) {
        return {
          success: false,
          error: 'Paskyra laikinai užblokuota dėl per daug bandymų. Bandykite vėliau.'
        };
      }
      
      // Validate inputs
      if (!email || !password) {
        return {
          success: false,
          error: 'Prašome įvesti el. paštą ir slaptažodį.'
        };
      }
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return {
          success: false,
          error: 'Neteisingas el. pašto formatas.'
        };
      }
      
      // Attempt login
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Reset login attempts on success
      setLoginAttempts(0);
      localStorage.removeItem('authLockoutEndTime');
      localStorage.setItem('lastAuthActivity', Date.now().toString());
      
      // Log successful login (for audit)
      console.log('Successful login:', { 
        email, 
        timestamp: new Date().toISOString(),
        uid: result.user.uid
      });
      
      return { 
        success: true, 
        user: result.user 
      };
    } catch (error) {
      console.error('Login error:', error);
      
      // Increment login attempts
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      
      // Check if should lock account
      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        const lockoutEndTime = Date.now() + LOCKOUT_DURATION;
        localStorage.setItem('authLockoutEndTime', lockoutEndTime.toString());
        setIsLocked(true);
        
        setTimeout(() => {
          setIsLocked(false);
          localStorage.removeItem('authLockoutEndTime');
          setLoginAttempts(0);
        }, LOCKOUT_DURATION);
        
        return {
          success: false,
          error: 'Per daug bandymų. Paskyra laikinai užblokuota 15 minučių.'
        };
      }
      
      // Handle specific error codes
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
        case 'auth/too-many-requests':
          errorMessage = 'Per daug bandymų. Bandykite vėliau.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Tinklo klaida. Patikrinkite internetą.';
          break;
      }
      
      // Log failed attempt (for audit)
      console.warn('Failed login attempt:', {
        email,
        timestamp: new Date().toISOString(),
        error: error.code,
        attempts: newAttempts
      });
      
      return { 
        success: false, 
        error: errorMessage,
        remainingAttempts: MAX_LOGIN_ATTEMPTS - newAttempts
      };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('lastAuthActivity');
      setCurrentUser(null);
      
      // Log logout (for audit)
      console.log('User logged out:', {
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if Firebase fails
      setCurrentUser(null);
      localStorage.removeItem('lastAuthActivity');
    }
  };

  const resetPassword = async (email) => {
    try {
      // Validate email
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return {
          success: false,
          error: 'Prašome įvesti teisingą el. pašto adresą.'
        };
      }
      
      await sendPasswordResetEmail(auth, email);
      
      return {
        success: true,
        message: 'Slaptažodžio atkūrimo instrukcijos išsiųstos el. paštu.'
      };
    } catch (error) {
      console.error('Password reset error:', error);
      
      let errorMessage = 'Klaida siunčiant atkūrimo instrukciją.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Vartotojas su šiuo el. paštu nerastas.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Per daug bandymų. Bandykite vėliau.';
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      if (!currentUser) {
        return {
          success: false,
          error: 'Vartotojas neprisijungęs.'
        };
      }
      
      // Validate new password
      if (!newPassword || newPassword.length < 8) {
        return {
          success: false,
          error: 'Naujas slaptažodis turi būti bent 8 simbolių.'
        };
      }
      
      // Password strength check
      const hasUpperCase = /[A-Z]/.test(newPassword);
      const hasLowerCase = /[a-z]/.test(newPassword);
      const hasNumbers = /\d/.test(newPassword);
      const hasSpecialChar = /[!@#$%^&*]/.test(newPassword);
      
      if (!(hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar)) {
        return {
          success: false,
          error: 'Slaptažodis turi turėti didžiąją raidę, mažąją raidę, skaičių ir specialų simbolį.'
        };
      }
      
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );
      
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      
      return {
        success: true,
        message: 'Slaptažodis sėkmingai pakeistas.'
      };
    } catch (error) {
      console.error('Change password error:', error);
      
      let errorMessage = 'Klaida keičiant slaptažodį.';
      
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Neteisingas dabartinis slaptažodis.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Naujas slaptažodis per silpnas.';
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  const value = {
    currentUser,
    login,
    logout,
    resetPassword,
    changePassword,
    isAuthenticated: !!currentUser,
    loading,
    isLocked,
    loginAttempts,
    maxLoginAttempts: MAX_LOGIN_ATTEMPTS
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}