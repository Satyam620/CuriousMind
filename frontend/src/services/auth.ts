import axios from 'axios';
import { API_BASE_URL } from './api';
import { APP_CONFIG, API_ENDPOINTS } from '../constants/app';

// Use the same dynamic API base URL from api.ts

const authAPI = axios.create({
  baseURL: API_BASE_URL,
  timeout: APP_CONFIG.api.timeout,
});

export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface SignupCredentials {
  username: string;
  email: string;
  password: string;
  re_password: string;
  first_name?: string;
  last_name?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse extends AuthTokens {}

export const authService = {
  // Register new user
  signup: async (credentials: SignupCredentials): Promise<void> => {
    const response = await authAPI.post(API_ENDPOINTS.auth.register, credentials);
    return response.data;
  },

  // Login user
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await authAPI.post(API_ENDPOINTS.auth.login, credentials);
    return response.data;
  },

  // Refresh access token
  refreshToken: async (refreshToken: string): Promise<{ access: string }> => {
    const response = await authAPI.post(API_ENDPOINTS.auth.refresh, {
      refresh: refreshToken,
    });
    return response.data;
  },

  // Get current user info
  getUser: async (accessToken: string): Promise<User> => {
    const response = await authAPI.get(API_ENDPOINTS.auth.profile, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  },

  // Logout (blacklist refresh token)
  logout: async (refreshToken: string): Promise<void> => {
    try {
      await authAPI.post('/auth/jwt/blacklist/', {
        refresh: refreshToken,
      });
    } catch (error) {
      // Even if blacklisting fails, we'll clear local storage
      console.warn('Token blacklisting failed:', error);
    }
  },

  // Verify token
  verifyToken: async (token: string): Promise<boolean> => {
    try {
      await authAPI.post(API_ENDPOINTS.auth.verify, { token });
      return true;
    } catch {
      return false;
    }
  },
};