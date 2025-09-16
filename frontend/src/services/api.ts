import axios from 'axios';
import { APP_CONFIG, API_ENDPOINTS } from '../constants/app';
import { NetworkError, logError } from '../utils/errorHandling';

// Dynamic IP detection for different network environments
const getApiBaseUrl = () => {
  if (!__DEV__) {
    return 'http://your-production-server.com/api'; // Production
  }

  // Check if environment variable is set
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envUrl) {
    return `${envUrl}/api`;
  }

  // Default fallback - this will be replaced by auto-discovery
  return 'http://192.168.0.101:8000/api'; // Updated to current network
};

let API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: APP_CONFIG.api.timeout,
});

// Auto-discovery and API reconfiguration
export const initializeAPI = async () => {
  try {
    // First try the current configuration
    await api.get('/quizzes/');
    console.log('✅ Using current API configuration:', API_BASE_URL);
    return API_BASE_URL;
  } catch (error) {
    console.log('❌ Current API configuration failed, attempting auto-discovery...');

    try {
      const workingUrl = await findWorkingBackend();
      API_BASE_URL = workingUrl;
      api.defaults.baseURL = workingUrl;
      console.log('✅ Auto-discovery successful, using:', workingUrl);
      return workingUrl;
    } catch (discoveryError) {
      console.error('❌ Auto-discovery failed:', discoveryError);
      throw new Error('Could not connect to backend server. Please ensure the server is running.');
    }
  }
};

export interface Quiz {
  id: number;
  title: string;
  description: string;
  created_at: string;
  question_count: number;
}

export interface Choice {
  id: number;
  choice_text: string;
  is_correct: boolean;
}

export interface Question {
  id: number;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer';
  points: number;
  order: number;
  choices: Choice[];
}

export interface QuizDetail {
  id: number;
  title: string;
  description: string;
  created_at: string;
  questions: Question[];
  total_points: number;
}

export interface QuizSubmission {
  quiz_id: number;
  user_id?: number;
  answers: Array<{
    question_id: number;
    selected_choice_id?: number;
    text_answer?: string;
  }>;
  time_taken_seconds?: number;
}

export interface QuizResult {
  score: number;
  total_points: number;
  percentage: number;
  attempt_id: number;
}

export interface CustomQuizRequest {
  category: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  question_count: number;
}

// Export the base URL for debugging
export { API_BASE_URL };

// Enhanced connection testing with auto-discovery
export const findWorkingBackend = async () => {
  const possibleIPs = [
    '192.168.0.101',    // Current computer IP
    '192.168.0.100',    // Original WiFi network server
    '192.168.1.1',      // Common router IP
    '192.168.1.100',    // Common router IP range
    '192.168.137.1',    // Windows mobile hotspot default
    '192.168.43.1',     // Android hotspot default
    '127.0.0.1',        // localhost
    'localhost',        // Fallback
  ];

  for (const ip of possibleIPs) {
    try {
      const testUrl = `http://${ip}:8000`;
      console.log(`Testing connection to: ${testUrl}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${testUrl}/api/quizzes/`, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' }
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log(`✅ Connection successful to: ${testUrl}`);
        return `${testUrl}/api`;
      }
    } catch (error) {
      console.log(`❌ Failed to connect to: http://${ip}:8000`);
    }
  }

  throw new Error('Could not find working backend server');
};

// Network test function for debugging
export const testConnection = async () => {
  try {
    console.log('Testing connection to:', API_BASE_URL);
    const response = await api.get('/quizzes/');
    console.log('Connection successful:', response.status);
    return true;
  } catch (error) {
    console.error('Connection failed:', error);
    return false;
  }
};

export const quizAPI = {
  // Get all available quizzes/categories
  getAllQuizzes: async (): Promise<Quiz[]> => {
    const response = await api.get(API_ENDPOINTS.quiz.list);
    return response.data;
  },

  // Get specific quiz details with questions
  getQuizById: async (id: number): Promise<QuizDetail> => {
    const response = await api.get(`${API_ENDPOINTS.quiz.list}${id}/`);
    return response.data;
  },

  // Generate a new custom quiz based on user preferences
  generateCustomQuiz: async (config: CustomQuizRequest): Promise<QuizDetail> => {
    const response = await api.post(API_ENDPOINTS.quiz.generate, config);
    return response.data;
  },

  // Submit quiz answers and get results
  submitQuizAnswers: async (submission: QuizSubmission): Promise<QuizResult> => {
    const response = await api.post(API_ENDPOINTS.quiz.submit, submission);
    return response.data;
  },

  // Get user's quiz attempt history
  getUserQuizHistory: async (userId: number) => {
    const response = await api.get(API_ENDPOINTS.profile.attempts(userId));
    return response.data;
  },

  // Save results for custom/AI-generated quiz
  saveQuizResult: async (result: {
    user_id: number;
    quiz_title: string;
    score: number;
    total_points: number;
    time_taken_seconds?: number;
    is_ai_generated?: boolean;
  }) => {
    const response = await api.post(API_ENDPOINTS.quiz.saveCustomResult, result);
    return response.data;
  },
};