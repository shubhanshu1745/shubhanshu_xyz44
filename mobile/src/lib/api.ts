import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define API base URL (for development)
const API_URL = 'http://localhost:3000/api';

// Types for API responses
interface ApiResponse<T> {
  data: T;
  message?: string;
}

// Create axios instance
const instance: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to add auth token
instance.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API client methods
const apiClient = {
  // Generic methods
  get: async <T>(url: string): Promise<T> => {
    const response: AxiosResponse<ApiResponse<T>> = await instance.get(url);
    return response.data.data;
  },
  
  post: async <T>(url: string, data?: any): Promise<T> => {
    const response: AxiosResponse<ApiResponse<T>> = await instance.post(url, data);
    return response.data.data;
  },
  
  put: async <T>(url: string, data: any): Promise<T> => {
    const response: AxiosResponse<ApiResponse<T>> = await instance.put(url, data);
    return response.data.data;
  },
  
  delete: async <T>(url: string): Promise<T> => {
    const response: AxiosResponse<ApiResponse<T>> = await instance.delete(url);
    return response.data.data;
  },
  
  // Authentication
  login: async (email: string, password: string): Promise<any> => {
    const response = await instance.post('/auth/login', { email, password });
    return response.data.data;
  },
  
  register: async (userData: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    fullName?: string;
    bio?: string;
  }): Promise<any> => {
    const response = await instance.post('/auth/register', userData);
    return response.data.data;
  },
  
  logout: async (): Promise<any> => {
    const response = await instance.post('/auth/logout');
    return response.data.data;
  },
  
  // Posts
  getPosts: async (): Promise<any[]> => {
    const response = await instance.get('/posts');
    return response.data.data;
  },
  
  getPost: async (id: number): Promise<any> => {
    const response = await instance.get(`/posts/${id}`);
    return response.data.data;
  },
  
  createPost: async (postData: {
    content: string;
    imageUrl?: string;
    videoUrl?: string;
    isReel?: boolean;
  }): Promise<any> => {
    const response = await instance.post('/posts', postData);
    return response.data.data;
  },
  
  likePost: async (postId: number): Promise<any> => {
    const response = await instance.post(`/posts/${postId}/like`);
    return response.data.data;
  },
  
  unlikePost: async (postId: number): Promise<any> => {
    const response = await instance.post(`/posts/${postId}/unlike`);
    return response.data.data;
  },
  
  // Comments
  getComments: async (postId: number): Promise<any[]> => {
    const response = await instance.get(`/posts/${postId}/comments`);
    return response.data.data;
  },
  
  createComment: async (postId: number, content: string): Promise<any> => {
    const response = await instance.post(`/posts/${postId}/comments`, { content });
    return response.data.data;
  },
  
  // User profile
  getProfile: async (username: string): Promise<any> => {
    const response = await instance.get(`/users/${username}`);
    return response.data.data;
  },
  
  getUserPosts: async (username: string): Promise<any[]> => {
    const response = await instance.get(`/users/${username}/posts`);
    return response.data.data;
  },
  
  updateProfile: async (userData: {
    fullName?: string;
    bio?: string;
    profileImageUrl?: string;
  }): Promise<any> => {
    const response = await instance.put('/users/profile', userData);
    return response.data.data;
  },
  
  // Follow/Unfollow
  followUser: async (userId: number): Promise<any> => {
    const response = await instance.post(`/users/${userId}/follow`);
    return response.data.data;
  },
  
  unfollowUser: async (userId: number): Promise<any> => {
    const response = await instance.post(`/users/${userId}/unfollow`);
    return response.data.data;
  },
  
  getFollowers: async (userId: number): Promise<any[]> => {
    const response = await instance.get(`/users/${userId}/followers`);
    return response.data.data;
  },
  
  getFollowing: async (userId: number): Promise<any[]> => {
    const response = await instance.get(`/users/${userId}/following`);
    return response.data.data;
  },
  
  // Cricket stats
  getPlayerStats: async (userId: number): Promise<any> => {
    const response = await instance.get(`/stats/player/${userId}`);
    return response.data.data;
  },
  
  getPlayerMatches: async (userId: number): Promise<any[]> => {
    const response = await instance.get(`/stats/player/${userId}/matches`);
    return response.data.data;
  },
  
  createMatch: async (matchData: any): Promise<any> => {
    const response = await instance.post('/stats/matches', matchData);
    return response.data.data;
  },
  
  updateMatchPerformance: async (matchId: number, performanceData: any): Promise<any> => {
    const response = await instance.put(`/stats/matches/${matchId}/performance`, performanceData);
    return response.data.data;
  },
};

export default apiClient;