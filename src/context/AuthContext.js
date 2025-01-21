"use client";
import React, { createContext, useState, useEffect } from 'react';
import jwt from 'jsonwebtoken';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwt.decode(token);
        if (decoded && decoded.exp * 1000 > Date.now()) {
          setUser({ token, fullName: decoded.fullName, email: decoded.email, username: decoded.username, id: decoded.id, avatar: decoded.avatar, jobPrefsTitle: decoded.jobPrefsTitle, jobPrefsLocation: decoded.jobPrefsLocation, jobPrefsLevel: decoded.jobPrefsLevel });
        } else {
          localStorage.removeItem('token');
          setLoading(false);
          setUser(null);
        }
      } catch (error) {
        console.error("Token decoding failed:", error);
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token, username, id, avatar) => {
    localStorage.setItem('token', token);
    setUser({ token, username, id, avatar });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return React.useContext(AuthContext);
};
