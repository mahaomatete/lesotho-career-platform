import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import authService from '../services/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Use useCallback to memoize the initializeAuth function
  const initializeAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      console.log('📦 Stored auth data:', { 
        hasToken: !!token, 
        hasUserData: !!userData 
      });

      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          console.log('👤 Found stored user:', parsedUser.email);
          setUser(parsedUser);
          
          // Verify token is still valid
          try {
            const response = await authService.getProfile();
            if (response.success) {
              console.log('✅ Token is valid, updating user data');
              setUser(response.data);
              localStorage.setItem('user', JSON.stringify(response.data));
            } else {
              console.log('❌ Token invalid, logging out');
              logout();
            }
          } catch (profileError) {
            console.error('Profile fetch error:', profileError);
            logout();
          }
        } catch (parseError) {
          console.error('❌ Error parsing user data:', parseError);
          logout();
        }
      } else {
        console.log('🔐 No stored authentication data found');
      }
    } catch (error) {
      console.error('❌ Auth initialization error:', error);
      setError('Failed to initialize authentication');
    } finally {
      setLoading(false);
      console.log('✅ AuthProvider initialized');
    }
  }, []); // Empty dependency array since we're using useCallback

  useEffect(() => {
    console.log('🔄 AuthProvider initializing...');
    initializeAuth();
  }, [initializeAuth]); // Now include initializeAuth in dependencies

  const login = async (credentials) => {
    try {
      console.log('🔐 Attempting login...');
      setError('');
      const response = await authService.login(credentials);
      
      if (response.success) {
        console.log('✅ Login successful, setting user');
        setUser(response.data.user);
        return response;
      } else {
        console.log('❌ Login failed:', response.message);
        setError(response.message);
        return response;
      }
    } catch (error) {
      console.error('❌ Login error in context:', error);
      setError(error.message || 'Login failed. Please try again.');
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      console.log('📝 Attempting registration...');
      setError('');
      const response = await authService.register(userData);
      return response;
    } catch (error) {
      console.error('❌ Registration error in context:', error);
      setError(error.message || 'Registration failed. Please try again.');
      throw error;
    }
  };

  const logout = () => {
    console.log('🚪 Logging out from context...');
    authService.logout();
    setUser(null);
    setError('');
  };

  const updateUser = (userData) => {
    console.log('🔄 Updating user data');
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const clearError = () => {
    setError('');
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateUser,
    error,
    clearError,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isInstitute: user?.role === 'institute',
    isStudent: user?.role === 'student',
    isCompany: user?.role === 'company'
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};