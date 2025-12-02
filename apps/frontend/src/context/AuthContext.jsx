import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('exoin_token');
    const savedUser = localStorage.getItem('exoin_user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await authApi.login(email, password);
    const { user: userData, token } = response.data;
    
    // Transform user data to include full name
    const transformedUser = {
      ...userData,
      name: `${userData.firstName} ${userData.lastName}`.trim(),
    };
    
    localStorage.setItem('exoin_token', token);
    localStorage.setItem('exoin_user', JSON.stringify(transformedUser));
    setUser(transformedUser);
    
    return transformedUser;
  };

  const logout = () => {
    localStorage.removeItem('exoin_token');
    localStorage.removeItem('exoin_user');
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
