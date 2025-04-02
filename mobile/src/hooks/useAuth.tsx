import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest, storeToken, clearToken, isAuthenticated as checkAuthStatus } from '../lib/api';

// User interface
interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  bio?: string;
  avatarUrl?: string;
  role: string;
  createdAt: string;
}

// Auth state interface
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Login credentials interface
interface LoginCredentials {
  email: string;
  password: string;
}

// Register data interface
interface RegisterData {
  username: string;
  email: string;
  password: string;
  name: string;
}

// Auth context interface
interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  updateUser: (userData: Partial<User>) => Promise<boolean>;
}

// Initial auth state
const initialAuthState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export const AuthProvider: React.FC = ({ children }) => {
  const [state, setState] = useState<AuthState>(initialAuthState);

  // Load user data from storage on app start
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Check if the user is authenticated
        const isUserAuthenticated = await checkAuthStatus();
        
        if (isUserAuthenticated) {
          // Fetch user data from the API
          try {
            const userData = await apiRequest.get<User>('/auth/user');
            setState({
              user: userData,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } catch (error) {
            // If we can't fetch the user, log them out
            await clearToken();
            setState({
              ...initialAuthState,
              isLoading: false,
              error: 'Session expired. Please log in again.',
            });
          }
        } else {
          // Not authenticated
          setState({
            ...initialAuthState,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('Error loading user:', error);
        setState({
          ...initialAuthState,
          isLoading: false,
          error: 'Failed to load user data.',
        });
      }
    };

    loadUser();
  }, []);

  /**
   * Login function
   * @param credentials - Email and password
   */
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await apiRequest.post<{ token: string; user: User }>('/auth/login', credentials);
      
      // Store the auth token
      await storeToken(response.token);
      
      // Update state with user data
      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      
      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.message || 'Failed to login. Please check your credentials.',
      }));
      return false;
    }
  };

  /**
   * Register function
   * @param data - Registration data
   */
  const register = async (data: RegisterData): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await apiRequest.post<{ token: string; user: User }>('/auth/register', data);
      
      // Store the auth token
      await storeToken(response.token);
      
      // Update state with user data
      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      
      return true;
    } catch (error: any) {
      console.error('Registration error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.message || 'Failed to register. Please try again.',
      }));
      return false;
    }
  };

  /**
   * Logout function
   */
  const logout = async (): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Clear the token from storage
      await clearToken();
      
      // Reset auth state
      setState({
        ...initialAuthState,
        isLoading: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to logout. Please try again.',
      }));
    }
  };

  /**
   * Clear any auth errors
   */
  const clearError = (): void => {
    setState(prev => ({ ...prev, error: null }));
  };

  /**
   * Update user profile
   * @param userData - Partial user data to update
   */
  const updateUser = async (userData: Partial<User>): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const updatedUser = await apiRequest.patch<User>('/auth/user', userData);
      
      setState(prev => ({
        ...prev,
        user: updatedUser,
        isLoading: false,
      }));
      
      return true;
    } catch (error: any) {
      console.error('Update user error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.message || 'Failed to update profile. Please try again.',
      }));
      return false;
    }
  };

  // Context value with all auth functionality
  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    clearError,
    updateUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// useAuthentication alias for useAuth (for clarity in some cases)
export const useAuthentication = useAuth;