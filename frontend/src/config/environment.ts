import Constants from 'expo-constants';

interface AppConfig {
  apiBaseUrl: string;
}

const getEnvironmentConfig = (): AppConfig => {
  // Get environment variables from expo constants
  const apiBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl ||
                     process.env.EXPO_PUBLIC_API_BASE_URL;

  return {
    apiBaseUrl,
  };
};

export const env = getEnvironmentConfig();

// Development helper
if (__DEV__) {
  console.log('🔧 Environment Config:', {
    apiBaseUrl: env.apiBaseUrl,
  });
}