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

  const updatePreferences = async (preferences) => {
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update preferences');
      }

      // Update local storage with new token
      localStorage.setItem('token', data.token);

      // Update user state with new preferences and token
      setUser(prev => ({
        ...prev,
        token: data.token,
        jobPrefsTitle: data.preferences.job_prefs_title,
        jobPrefsLocation: data.preferences.job_prefs_location,
        jobPrefsLevel: data.preferences.job_prefs_level
      }));

      return true;
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, initialized, updatePreferences }}>
      {initialized ? children : null}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return React.useContext(AuthContext);
};
