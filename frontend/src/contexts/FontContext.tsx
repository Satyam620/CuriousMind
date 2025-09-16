import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { storage } from '../utils/storage';
import { logError, AppError } from '../utils/errorHandling';

export type FontFamily = 'default' | 'roboto' | 'opensans' | 'lato' | 'montserrat' | 'poppins';

interface FontConfig {
  name: string;
  family: FontFamily;
  fontFamily: string;
}

export const AVAILABLE_FONTS: FontConfig[] = [
  { name: 'Default', family: 'default', fontFamily: 'System' },
  { name: 'Roboto', family: 'roboto', fontFamily: 'Roboto' },
  { name: 'Open Sans', family: 'opensans', fontFamily: 'Open Sans' },
  { name: 'Lato', family: 'lato', fontFamily: 'Lato' },
  { name: 'Montserrat', family: 'montserrat', fontFamily: 'Montserrat' },
  { name: 'Poppins', family: 'poppins', fontFamily: 'Poppins' },
];

interface FontContextType {
  currentFont: FontConfig;
  setFont: (font: FontFamily) => void;
  getFontStyle: () => { fontFamily?: string };
}

const FontContext = createContext<FontContextType | undefined>(undefined);


export const FontProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentFont, setCurrentFont] = useState<FontConfig>(AVAILABLE_FONTS[0]);

  useEffect(() => {
    loadSavedFont();

    // Load Google Fonts for web
    if (Platform.OS === 'web') {
      loadWebFonts();
    }
  }, []);

  const loadWebFonts = () => {
    if (typeof document !== 'undefined') {
      const link = document.createElement('link');
      link.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Open+Sans:wght@300;400;500;600;700&family=Lato:wght@300;400;700;900&family=Montserrat:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  };

  const loadSavedFont = async () => {
    try {
      const savedFont = await storage.getFontFamily();
      if (savedFont) {
        const fontConfig = AVAILABLE_FONTS.find(f => f.family === savedFont);
        if (fontConfig) {
          setCurrentFont(fontConfig);
        }
      }
    } catch (error) {
      logError(new AppError('Failed to load saved font'), { error });
    }
  };

  const setFont = async (font: FontFamily) => {
    try {
      const fontConfig = AVAILABLE_FONTS.find(f => f.family === font);
      if (fontConfig) {
        setCurrentFont(fontConfig);
        await storage.setFontFamily(font);
      }
    } catch (error) {
      logError(new AppError('Failed to save font'), { error });
    }
  };

  const getFontStyle = () => {
    if (currentFont.family === 'default') {
      return {};
    }

    // For Android, use system fonts that are guaranteed to exist
    if (Platform.OS === 'android') {
      const androidFontMap: Record<FontFamily, string> = {
        'default': '',
        'roboto': 'sans-serif', // Default Android font
        'opensans': 'sans-serif-light',
        'lato': 'sans-serif-medium',
        'montserrat': 'sans-serif-condensed',
        'poppins': 'monospace', // Different style for variety
      };

      const androidFont = androidFontMap[currentFont.family];
      return androidFont ? { fontFamily: androidFont } : {};
    }

    // For web and iOS, use the exact font names with fallbacks
    const webFontMap: Record<FontFamily, string> = {
      'default': '',
      'roboto': 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      'opensans': '"Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      'lato': 'Lato, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      'montserrat': 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      'poppins': 'Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    };

    const webFont = webFontMap[currentFont.family];
    return webFont ? { fontFamily: webFont } : {};
  };

  return (
    <FontContext.Provider value={{ currentFont, setFont, getFontStyle }}>
      {children}
    </FontContext.Provider>
  );
};

export const useFont = (): FontContextType => {
  const context = useContext(FontContext);
  if (!context) {
    throw new Error('useFont must be used within a FontProvider');
  }
  return context;
};