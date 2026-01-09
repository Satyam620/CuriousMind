// Application-wide constants
export const APP_CONFIG = {
  name: 'CuriousMind',
  version: '1.0.0',
  description: 'An engaging quiz application with AI-powered quiz generation',

  // API Configuration
  api: {
    timeout: 10000,
    retryAttempts: 3,
    retryDelay: 1000,
  },

  // Quiz Configuration
  quiz: {
    defaultTimerDuration: 30, // seconds per question
    maxTimerDuration: 120,
    minTimerDuration: 10,
    pointsPerDifficulty: {
      easy: 1,
      medium: 2,
      hard: 4,
    },
  },

  // UI Configuration
  ui: {
    animationDuration: 300,
    longAnimationDuration: 600,
    borderRadius: {
      small: 8,
      medium: 12,
      large: 16,
      xlarge: 20,
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16,
      xl: 20,
      xxl: 24,
    },
  },

  // Screen breakpoints
  breakpoints: {
    mobile: 0,
    tablet: 768,
    desktop: 1024,
  },

  // Storage keys
  storage: {
    authToken: 'auth_token',
    refreshToken: 'refresh_token',
    userPreferences: 'user_preferences',
    themeMode: 'theme_mode',
    fontFamily: 'font_family',
  },
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  auth: {
    login: '/auth/jwt/create/',
    register: '/auth/users/',
    refresh: '/auth/jwt/refresh/',
    verify: '/auth/jwt/verify/',
    profile: '/auth/users/me/',
  },
  quiz: {
    list: '/quizzes/',
    generate: '/quiz/generate/',
    generateAI: '/quiz/generate-ai/',
    submit: '/submit/',
    saveCustomResult: '/save-custom-result/',
  },
  leaderboard: {
    global: '/leaderboard/',
    byQuiz: (quizId: number) => `/leaderboard/quiz/${quizId}/`,
  },
  profile: {
    get: (userId: number) => `/profile/${userId}/`,
    attempts: (userId: number) => `/attempts/${userId}/`,
  },
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  network: 'Network connection failed. Please check your internet connection.',
  timeout: 'Request timed out. Please try again.',
  unauthorized: 'Your session has expired. Please log in again.',
  forbidden: 'You do not have permission to perform this action.',
  notFound: 'The requested resource was not found.',
  serverError: 'Server error occurred. Please try again later.',
  validation: 'Please check your input and try again.',
  generic: 'An unexpected error occurred. Please try again.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  login: 'Successfully logged in!',
  register: 'Account created successfully!',
  quizCompleted: 'Quiz completed successfully!',
  profileUpdated: 'Profile updated successfully!',
  settingsSaved: 'Settings saved successfully!',
} as const;

// Quiz Categories (for UI display)
export const QUIZ_CATEGORIES = [
  'General Knowledge',
  'Science',
  'History',
  'Geography',
  'Art',
  'Sports',
  'Entertainment',
  'Literature',
  'Mathematics',
  'Technology',
] as const;

export type QuizCategory = typeof QUIZ_CATEGORIES[number];