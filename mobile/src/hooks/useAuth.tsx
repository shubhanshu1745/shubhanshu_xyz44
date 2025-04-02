import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import apiClient from '../lib/api';

// Define user type
interface User {
  id: number;
  username: string;
  email: string;
  fullName: string | null;
  profileImageUrl: string | null;
  bio: string | null;
}

// Define auth context type
interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

// Define register data
interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  fullName?: string;
  bio?: string;
}

// Create auth context
const AuthContext = createContext<AuthContextData>({} as AuthContextData);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Check if user is already authenticated on mount
  useEffect(() => {
    async function loadStoredUser() {
      try {
        const storedUser = await AsyncStorage.getItem('@CricSocial:user');
        const token = await AsyncStorage.getItem('@CricSocial:token');
        
        if (storedUser && token) {
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.error('Error loading stored user:', err);
      } finally {
        setLoading(false);
      }
    }
    
    loadStoredUser();
  }, []);
  
  // Login function
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.login(email, password);
      
      // Store user and token
      const { user, token } = response;
      await AsyncStorage.setItem('@CricSocial:user', JSON.stringify(user));
      await AsyncStorage.setItem('@CricSocial:token', token);
      
      setUser(user);
    } catch (err) {
      console.error('Login error:', err);
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to login. Please check your credentials and try again.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Register function
  const register = async (userData: RegisterData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.register(userData);
      
      // Store user and token
      const { user, token } = response;
      await AsyncStorage.setItem('@CricSocial:user', JSON.stringify(user));
      await AsyncStorage.setItem('@CricSocial:token', token);
      
      setUser(user);
    } catch (err) {
      console.error('Registration error:', err);
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to register. Please try again with different credentials.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      
      // Call logout API
      await apiClient.logout();
      
      // Remove stored user and token
      await AsyncStorage.removeItem('@CricSocial:user');
      await AsyncStorage.removeItem('@CricSocial:token');
      
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
      // Even if API call fails, we still want to clear local storage
      await AsyncStorage.removeItem('@CricSocial:user');
      await AsyncStorage.removeItem('@CricSocial:token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };
  
  // Clear error
  const clearError = () => {
    setError(null);
  };
  
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading: loading,
        error,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export default function useAuth(): AuthContextData {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}