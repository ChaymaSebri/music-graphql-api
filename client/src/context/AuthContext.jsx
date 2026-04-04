import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

// Helper function to decode JWT
function decodeJWT(token) {
  try {
    const parts = token.split('.');
    const decoded = JSON.parse(atob(parts[1]));
    return decoded;
  } catch (err) {
    console.error('Failed to decode JWT:', err);
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [email, setEmail] = useState(null);
  const [sub, setSub] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('jwtToken');
    const savedRole = localStorage.getItem('userRole');
    const savedEmail = localStorage.getItem('userEmail');
    if (savedToken && savedRole && savedEmail) {
      const decoded = decodeJWT(savedToken);
      setToken(savedToken);
      setRole(savedRole);
      setEmail(savedEmail);
      setSub(decoded?.sub || null);
      setIsAuthenticated(true);
    }
  }, []);

  const login = (jwtToken, userRole, userEmail) => {
    const decoded = decodeJWT(jwtToken);
    setToken(jwtToken);
    setRole(userRole);
    setEmail(userEmail);
    setSub(decoded?.sub || null);
    setIsAuthenticated(true);
    localStorage.setItem('jwtToken', jwtToken);
    localStorage.setItem('userRole', userRole);
    localStorage.setItem('userEmail', userEmail);
  };

  const logout = () => {
    setToken(null);
    setRole(null);
    setEmail(null);
    setSub(null);
    setIsAuthenticated(false);
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
  };

  return (
    <AuthContext.Provider value={{ token, role, email, sub, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
