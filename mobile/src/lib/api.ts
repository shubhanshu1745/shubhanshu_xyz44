import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const TOKEN_KEY = '@CricSocial:token';

// Base URL configuration 
// This would be replaced with your actual API URL in production
const API_BASE_URL = 'http://10.0.2.2:3000/api';

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000, // 15 seconds
});

// Add a request interceptor to include the auth token in requests
apiClient.interceptors.request.use(
  async (config) => {
    // Try to get the token
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    
    // If token exists, add it to the headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle token expiration
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Here you could implement token refresh logic if needed
      // For now, we'll just clear the token and reject
      await clearToken();
      
      // You could also redirect to login screen here if you had navigation
      return Promise.reject(error);
    }
    
    // Handle other errors
    return Promise.reject(error);
  }
);

// API wrapper with typed methods
export const apiRequest = {
  /**
   * GET request
   * @param url - API endpoint
   * @param params - Query parameters
   * @param config - Axios config
   */
  async get<T>(url: string, params = {}, config = {}): Promise<T> {
    const response: AxiosResponse<T> = await apiClient.get(url, {
      params,
      ...config,
    });
    return response.data;
  },
  
  /**
   * POST request
   * @param url - API endpoint
   * @param data - Request body
   * @param config - Axios config
   */
  async post<T>(url: string, data = {}, config = {}): Promise<T> {
    const response: AxiosResponse<T> = await apiClient.post(url, data, config);
    return response.data;
  },
  
  /**
   * PUT request
   * @param url - API endpoint
   * @param data - Request body
   * @param config - Axios config
   */
  async put<T>(url: string, data = {}, config = {}): Promise<T> {
    const response: AxiosResponse<T> = await apiClient.put(url, data, config);
    return response.data;
  },
  
  /**
   * PATCH request
   * @param url - API endpoint
   * @param data - Request body
   * @param config - Axios config
   */
  async patch<T>(url: string, data = {}, config = {}): Promise<T> {
    const response: AxiosResponse<T> = await apiClient.patch(url, data, config);
    return response.data;
  },
  
  /**
   * DELETE request
   * @param url - API endpoint
   * @param config - Axios config
   */
  async delete<T>(url: string, config = {}): Promise<T> {
    const response: AxiosResponse<T> = await apiClient.delete(url, config);
    return response.data;
  },
  
  /**
   * Upload file(s)
   * @param url - API endpoint
   * @param formData - FormData with files
   * @param onProgress - Progress callback
   */
  async upload<T>(
    url: string,
    formData: FormData,
    onProgress?: (progressEvent: any) => void
  ): Promise<T> {
    const response: AxiosResponse<T> = await apiClient.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress,
    });
    return response.data;
  },
};

/**
 * Store auth token in AsyncStorage
 */
export const storeToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('Error storing token:', error);
    throw error;
  }
};

/**
 * Clear auth token from AsyncStorage
 */
export const clearToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error clearing token:', error);
    throw error;
  }
};

/**
 * Check if user is authenticated (token exists)
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    return !!token;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};