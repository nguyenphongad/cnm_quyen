import api from './api';
import { User, UserRole } from '@/types';

// Define interfaces
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

// Flag to control using mock API
const USE_MOCK_API = false;

// Mock data for development without backend
const MOCK_USER: User = {
  id: 1,
  username: 'admin',
  email: 'admin@example.com',
  full_name: 'Admin User',
  role: UserRole.ADMIN,
  is_active: true,
  date_joined: '2023-01-01T00:00:00Z'
};

const MOCK_TOKENS: AuthTokens = {
  access: 'mock_access_token',
  refresh: 'mock_refresh_token'
};

// Login function, send request to API and save token
export const login = async (credentials: LoginCredentials): Promise<AuthTokens> => {
  console.log('auth.ts: Starting login for', credentials.username);
  
  try {
    let tokens: AuthTokens;
    
    if (USE_MOCK_API) {
      console.log('auth.ts: Using mock API for login');
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      tokens = MOCK_TOKENS;
    } else {
      console.log('auth.ts: Using real API for login');
      // Call real API
      const response = await api.post('/token/', credentials);
      tokens = response.data;
    }

    // Save tokens to localStorage
    console.log('auth.ts: Saving tokens to localStorage');
    localStorage.setItem('authTokens', JSON.stringify(tokens));
    console.log('auth.ts: Login complete, returning tokens');
    return tokens;
  } catch (error) {
    console.error('auth.ts: Error during login:', error);
    throw error;
  }
};

// Logout function, remove token
export const logout = (): void => {
  console.log('auth.ts: Logging out, removing tokens from localStorage');
  localStorage.removeItem('authTokens');
};

// Get current user information
export const getCurrentUser = async (): Promise<User> => {
  console.log('auth.ts: Starting to get current user info');
  
  try {
    let user: User;
    
    if (USE_MOCK_API) {
      console.log('auth.ts: Using mock API to get user info');
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      user = MOCK_USER;
    } else {
      console.log('auth.ts: Using real API to get user info');
      // Call real API
      const response = await api.get('/users/me/');
      user = response.data;
    }
    
    console.log('auth.ts: Successfully got user info:', user);
    return user;
  } catch (error) {
    console.error('auth.ts: Error getting user info:', error);
    throw error;
  }
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const tokensStr = localStorage.getItem('authTokens');
  if (!tokensStr) return false;

  try {
    const tokens = JSON.parse(tokensStr);
    return !!tokens.access;
  } catch (error) {
    console.error('auth.ts: Error checking authentication:', error);
    return false;
  }
};

// Get tokens from localStorage
export const getAuthTokens = (): AuthTokens | null => {
  const tokensStr = localStorage.getItem('authTokens');
  if (tokensStr) {
    try {
      return JSON.parse(tokensStr) as AuthTokens;
    } catch (error) {
      console.error('auth.ts: Error parsing token JSON:', error);
      return null;
    }
  }
  return null;
}; 