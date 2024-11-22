"use client";
import React, { createContext, useState, useEffect } from 'react';
import jwt from 'jsonwebtoken'; 

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Added loading state

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Use a try-catch here since client-side jwt.decode doesn't verify the signature
        const decoded = jwt.decode(token);
        if (decoded && decoded.exp * 1000 > Date.now()) { // Check token expiration
          setUser({ token, username: decoded.username, id: decoded.id });
        } else {
          localStorage.removeItem('token'); // Remove expired token
          setUser(null);
        }
      } catch (error) {
        console.error("Token decoding failed:", error);
        localStorage.removeItem('token');
        setUser(null);
      }
    }
    setLoading(false); // Set loading to false after verification
  }, []);

  const login = (token, username, id) => { // Accept id as a parameter
    localStorage.setItem('token', token);
    setUser({ token, username, id }); // Include username and id
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}> {/* Provide loading */}
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return React.useContext(AuthContext);
};
