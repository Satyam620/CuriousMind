import Constants from 'expo-constants';

interface AppConfig {
  geminiApiKey: string;
  apiBaseUrl: string;
}

const getEnvironmentConfig = (): AppConfig => {
  // Get environment variables from expo constants
  const geminiApiKey = Constants.expoConfig?.extra?.geminiApiKey ||
                       process.env.EXPO_PUBLIC_GEMINI_API_KEY;

  const apiBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl ||
                     process.env.EXPO_PUBLIC_API_BASE_URL;

  // Validate required environment variables
  if (!geminiApiKey || geminiApiKey === 'your-gemini-api-key-here') {
    console.warn('⚠️  Gemini API key not configured. Please add your API key to .env file.');
  }

  return {
    geminiApiKey: geminiApiKey || '',
    apiBaseUrl,
  };
};

export const env = getEnvironmentConfig();

// Helper function to check if API key is configured
export const isGeminiConfigured = (): boolean => {
  return !!(env.geminiApiKey && env.geminiApiKey !== 'your-gemini-api-key-here');
};

// Development helper
if (__DEV__) {
  console.log('🔧 Environment Config:', {
    hasGeminiKey: isGeminiConfigured(),
    apiBaseUrl: env.apiBaseUrl,
  });
}