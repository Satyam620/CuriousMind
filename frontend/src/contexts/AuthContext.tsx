import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { authService, User, LoginCredentials, SignupCredentials } from '../services/auth';
import { storage } from '../utils/storage';
import { logError, AppError } from '../utils/errorHandling';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuthToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Load stored token and user data on app start
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const accessToken = await storage.getAuthToken();
      const refreshToken = await storage.getRefreshToken();

      if (accessToken && refreshToken) {
        // Verify token is still valid
        const isValid = await authService.verifyToken(accessToken);
        
        if (isValid) {
          // Token is valid, get user info
          const userData = await authService.getUser(accessToken);
          setUser(userData);
        } else {
          // Try to refresh the token
          try {
            const { access } = await authService.refreshToken(refreshToken);
            await storage.setAuthToken(access);
            
            const userData = await authService.getUser(access);
            setUser(userData);
          } catch (error) {
            // Refresh failed, clear stored tokens
            await clearStoredAuth();
          }
        }
      }
    } catch (error) {
      logError(new AppError('Error loading stored auth'), { error });
      await clearStoredAuth();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      const tokens = await authService.login(credentials);
      
      // Store tokens
      await storage.setAuthToken(tokens.access);
      await storage.setRefreshToken(tokens.refresh);
      
      // Get user data
      const userData = await authService.getUser(tokens.access);
      setUser(userData);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (credentials: SignupCredentials) => {
    try {
      setIsLoading(true);
      await authService.signup(credentials);
      
      // After successful signup, automatically login
      await login({
        username: credentials.username,
        password: credentials.password,
      });
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const refreshToken = await storage.getRefreshToken();
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch (error) {
      logError(new AppError('Logout error'), { error });
    } finally {
      await clearStoredAuth();
      setUser(null);
    }
  };

  const refreshAuthToken = async () => {
    try {
      const refreshToken = await storage.getRefreshToken();
      if (!refreshToken) {
        throw new AppError('No refresh token available');
      }

      const { access } = await authService.refreshToken(refreshToken);
      await storage.setAuthToken(access);
    } catch (error) {
      // If refresh fails, logout user
      await logout();
      throw error;
    }
  };

  const clearStoredAuth = async () => {
    await storage.clearAuthData();
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    signup,
    logout,
    refreshAuthToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};