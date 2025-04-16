import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const login = (token, decodedToken) => {
    console.log('Logging in user - token:', token, 'decoded:', decodedToken);
    localStorage.setItem('token', token);
    setToken(token);
    setUserData(decodedToken);
    setIsSignedIn(true);
    setLoading(false);
  };

  const logout = () => {
    console.log('Logging out user');
    localStorage.removeItem('token');
    setToken(null);
    setUserData(null);
    setIsSignedIn(false);
    setLoading(false);
  };

  useEffect(() => {
    const fetchUser = async () => {
      console.log('Fetching user - token from state:', token);
      if (!token) {
        console.log('No token found, setting loading to false');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get('http://localhost:3000/user/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('User data fetched from /user/me:', response.data);
        setUserData(response.data);
        setIsSignedIn(true);
      } catch (error) {
        console.error('Error fetching user data from /user/me:', error.response?.data || error.message);
        setIsSignedIn(false);
        localStorage.removeItem('token');
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [token]);

  return (
    <UserContext.Provider value={{ user: userData, isSignedIn, login, logout, loading, token }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
};