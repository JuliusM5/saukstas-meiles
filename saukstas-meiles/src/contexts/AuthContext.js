import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verify token on startup
    const verifyToken = async () => {
      if (token) {
        try {
          const response = await api.get('/auth/verify');
          if (response.data.success) {
            setCurrentUser(response.data.user);
          } else {
            // Invalid token
            setToken(null);
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          setToken(null);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, [token]);

  // Save token to localStorage when it changes
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      if (response.data.success) {
        setToken(response.data.token);
        setCurrentUser(response.data.user);
        return { success: true };
      }
      return { success: false, error: response.data.error || 'Login failed' };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Authentication error' 
      };
    }
  };

  const logout = () => {
    setToken(null);
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    token,
    login,
    logout,
    isAuthenticated: !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}