import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storage } from '../utils/storage';
import { logError, AppError } from '../utils/errorHandling';

export type ThemeMode = 'light' | 'dark';

export interface Theme {
  mode: ThemeMode;
  isDark: boolean;
  colors: {
    background: string;
    surface: string;
    card: string;
    text: string;
    textSecondary: string;
    textOnColor: string;
    border: string;
    shadow: string;
    error: string;
    success: string;
    warning: string;
  };
}

const lightTheme: Theme = {
  mode: 'light',
  isDark: false,
  colors: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    text: '#1F2937',
    textSecondary: '#6B7280',
    textOnColor: '#FFFFFF',
    border: '#E5E7EB',
    shadow: '#000000',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
  },
};

const darkTheme: Theme = {
  mode: 'dark',
  isDark: true,
  colors: {
    background: '#111827',
    surface: '#1F2937',
    card: '#374151',
    text: '#F9FAFB',
    textSecondary: '#D1D5DB',
    textOnColor: '#FFFFFF',
    border: '#4B5563',
    shadow: '#000000',
    error: '#F87171',
    success: '#34D399',
    warning: '#FBBF24',
  },
};

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');

  // Simple theme determination - no automatic detection
  const getActualTheme = (mode: ThemeMode): Theme => {
    return mode === 'dark' ? darkTheme : lightTheme;
  };

  const [theme, setTheme] = useState<Theme>(getActualTheme(themeMode));

  // Load saved theme preference, default to 'light' if none exists
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedMode = await storage.getThemeMode();

        // Only accept 'light' or 'dark', reject any old 'system' values
        if (savedMode === 'light' || savedMode === 'dark') {
          const mode = savedMode as ThemeMode;
          setThemeModeState(mode);
          setTheme(getActualTheme(mode));
        } else {
          // Invalid or no saved preference (including old 'system'), use 'light' as default
          setThemeModeState('light');
          setTheme(getActualTheme('light'));
          await storage.setThemeMode('light');
        }
      } catch (error) {
        logError(new AppError('Error loading theme preference'), { error });
        // Fallback to light theme if there's an error
        setThemeModeState('light');
        setTheme(getActualTheme('light'));
      }
    };
    loadTheme();
  }, []);

  // Update theme when mode changes
  useEffect(() => {
    const newTheme = getActualTheme(themeMode);
    setTheme(newTheme);
  }, [themeMode]);

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      setTheme(getActualTheme(mode));
      await storage.setThemeMode(mode);
    } catch (error) {
      logError(new AppError('Error saving theme preference'), { error });
    }
  };

  const toggleTheme = () => {
    const newMode = theme.isDark ? 'light' : 'dark';
    setThemeMode(newMode);
  };

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setThemeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Helper function to get category colors that work with both themes
export const getCategoryColor = (categoryName: string, isDark: boolean = false): string => {
  // Special case for art category
  if (categoryName.toLowerCase().includes('art')) {
    return isDark ? '#FF6B9D' : '#E91E63';
  }

  const lightColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
    '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
    '#8395A7', '#3C6382', '#40407A', '#706FD3', '#F8B500',
  ];

  const darkColors = [
    '#FF8A8A', '#6CE5DC', '#66C7E8', '#B8DCC8', '#FFD574',
    '#FFB8F5', '#74B8FF', '#7F47E5', '#26E2E3', '#FFB863',
    '#A5B5C7', '#5C7BA2', '#605A9A', '#8F8CE3', '#FFB720',
  ];

  const colors = isDark ? darkColors : lightColors;

  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};