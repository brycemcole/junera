"use client";
import React, { createContext, useState, useEffect } from 'react';
import jwt from 'jsonwebtoken';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const decoded = jwt.decode(token);
          if (decoded && decoded.exp * 1000 > Date.now()) {
            setUser({
              token,
              fullName: decoded.fullName,
              email: decoded.email,
              username: decoded.username,
              id: decoded.id,
              avatar: decoded.avatar,
              jobPrefsTitle: decoded.jobPrefsTitle,
              jobPrefsLocation: decoded.jobPrefsLocation,
              jobPrefsLevel: decoded.jobPrefsLevel
            });
          } else {
            localStorage.removeItem('token');
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    initAuth();
  }, []);

  const login = async (token, username, id, fullName, avatar, jobPrefsTitle, jobPrefsLocation, jobPrefsLevel) => {
    try {
      localStorage.setItem('token', token);
      const userData = {
        token,
        username,
        id,
        fullName,
        avatar,
        jobPrefsTitle,
        jobPrefsLocation,
        jobPrefsLevel
      };
      setUser(userData);
      return true;
    } catch (error) {
      console.error('Error during login:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, initialized }}>
      {initialized ? children : null}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return React.useContext(AuthContext);
};
