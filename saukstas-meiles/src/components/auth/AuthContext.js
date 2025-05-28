import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

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
  
  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 15 * 60 * 1000;
  const SESSION_TIMEOUT = 60 * 60 * 1000;
  
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
        // Check if user has admin role in Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists() && userDoc.data().role === 'admin') {
            // Check session timeout
            const lastActivity = localStorage.getItem('lastAuthActivity');
            if (lastActivity) {
              const timeSinceActivity = Date.now() - parseInt(lastActivity);
              if (timeSinceActivity > SESSION_TIMEOUT) {
                logout();
                return;
              }
            }
            
            localStorage.setItem('lastAuthActivity', Date.now().toString());
            
            setCurrentUser({
              ...user,
              role: 'admin',
              sessionStart: Date.now()
            });
          } else {
            // User exists but is not admin
            await signOut(auth);
            setCurrentUser(null);
          }
        } catch (error) {
          console.error('Error checking user role:', error);
          await signOut(auth);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    
    // Set up activity listener
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

  const createAdminUser = async (email, password) => {
    try {
      // Check if this is the first admin setup
      const adminSetupKey = process.env.REACT_APP_ADMIN_SETUP_KEY;
      if (!adminSetupKey) {
        return {
          success: false,
          error: 'Admin setup is not configured. Contact system administrator.'
        };
      }
      
      // Verify setup key from environment
      const setupKeyInput = prompt('Enter admin setup key:');
      if (setupKeyInput !== adminSetupKey) {
        return {
          success: false,
          error: 'Invalid setup key.'
        };
      }
      
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Add admin role to Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: email,
        role: 'admin',
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString()
      });
      
      // Sign out immediately after creation for security
      await signOut(auth);
      
      return {
        success: true,
        message: 'Admin user created successfully. Please login.'
      };
    } catch (error) {
      console.error('Error creating admin user:', error);
      
      let errorMessage = 'Failed to create admin user.';
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already registered.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password should be at least 6 characters.';
          break;
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  const login = async (email, password) => {
    try {
      if (isLocked) {
        return {
          success: false,
          error: 'Account temporarily locked due to too many attempts. Try again later.'
        };
      }
      
      if (!email || !password) {
        return {
          success: false,
          error: 'Please enter email and password.'
        };
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return {
          success: false,
          error: 'Invalid email format.'
        };
      }
      
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Verify admin role
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (!userDoc.exists() || userDoc.data().role !== 'admin') {
        await signOut(auth);
        return {
          success: false,
          error: 'Unauthorized access. Admin privileges required.'
        };
      }
      
      // Update last login
      await setDoc(doc(db, 'users', result.user.uid), {
        last_login: new Date().toISOString()
      }, { merge: true });
      
      setLoginAttempts(0);
      localStorage.removeItem('authLockoutEndTime');
      localStorage.setItem('lastAuthActivity', Date.now().toString());
      
      // Log successful login
      console.log('Admin login successful:', { 
        email, 
        timestamp: new Date().toISOString()
      });
      
      return { 
        success: true, 
        user: result.user 
      };
    } catch (error) {
      console.error('Login error:', error);
      
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      
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
          error: 'Too many attempts. Account locked for 15 minutes.'
        };
      }
      
      let errorMessage = 'Login failed. Please try again.';
      
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Invalid email format.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'User account disabled.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'Invalid credentials.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Invalid credentials.';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Invalid credentials.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many attempts. Try again later.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Check your connection.';
          break;
      }
      
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
      
      console.log('User logged out:', {
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Logout error:', error);
      setCurrentUser(null);
      localStorage.removeItem('lastAuthActivity');
    }
  };

  const resetPassword = async (email) => {
    try {
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return {
          success: false,
          error: 'Please enter a valid email address.'
        };
      }
      
      await sendPasswordResetEmail(auth, email);
      
      return {
        success: true,
        message: 'Password reset instructions sent to email.'
      };
    } catch (error) {
      console.error('Password reset error:', error);
      
      let errorMessage = 'Error sending reset instructions.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No user found with this email.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many attempts. Try again later.';
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
          error: 'User not logged in.'
        };
      }
      
      if (!newPassword || newPassword.length < 8) {
        return {
          success: false,
          error: 'New password must be at least 8 characters.'
        };
      }
      
      const hasUpperCase = /[A-Z]/.test(newPassword);
      const hasLowerCase = /[a-z]/.test(newPassword);
      const hasNumbers = /\d/.test(newPassword);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
      
      if (!(hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar)) {
        return {
          success: false,
          error: 'Password must contain uppercase, lowercase, number, and special character.'
        };
      }
      
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );
      
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      
      return {
        success: true,
        message: 'Password changed successfully.'
      };
    } catch (error) {
      console.error('Change password error:', error);
      
      let errorMessage = 'Error changing password.';
      
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Current password is incorrect.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'New password is too weak.';
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
    createAdminUser,
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