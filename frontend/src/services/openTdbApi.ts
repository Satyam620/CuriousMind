import axios from 'axios';

const OPENTDB_BASE_URL = 'https://opentdb.com';

const openTdbAPI = axios.create({
  baseURL: OPENTDB_BASE_URL,
  timeout: 10000,
});

export interface OpenTDBCategory {
  id: number;
  name: string;
}

export interface OpenTDBCategoriesResponse {
  trivia_categories: OpenTDBCategory[];
}

export interface OpenTDBQuestion {
  category: string;
  type: 'multiple' | 'boolean';
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

export interface OpenTDBQuestionsResponse {
  response_code: number;
  results: OpenTDBQuestion[];
}

export const openTdbService = {
  // Get all available categories
  getCategories: async (): Promise<OpenTDBCategory[]> => {
    const response = await openTdbAPI.get<OpenTDBCategoriesResponse>('/api_category.php');
    return response.data.trivia_categories;
  },

  // Get questions for a specific category
  getQuestions: async (
    categoryId: number,
    amount: number = 10,
    difficulty?: 'easy' | 'medium' | 'hard',
    type?: 'multiple' | 'boolean'
  ): Promise<OpenTDBQuestion[]> => {
    const params: any = {
      amount,
      category: categoryId,
    };

    if (difficulty) params.difficulty = difficulty;
    if (type) params.type = type;

    const response = await openTdbAPI.get<OpenTDBQuestionsResponse>('/api.php', { params });

    if (response.data.response_code !== 0) {
      throw new Error('Failed to fetch questions from OpenTDB');
    }

    return response.data.results;
  },

  // Get questions for multiple categories (general knowledge)
  getGeneralQuestions: async (
    amount: number = 10,
    difficulty?: 'easy' | 'medium' | 'hard'
  ): Promise<OpenTDBQuestion[]> => {
    const params: any = { amount };
    if (difficulty) params.difficulty = difficulty;

    const response = await openTdbAPI.get<OpenTDBQuestionsResponse>('/api.php', { params });

    if (response.data.response_code !== 0) {
      throw new Error('Failed to fetch general questions from OpenTDB');
    }

    return response.data.results;
  },
};

// Re-export the unified helper functions
export { getCategoryIcon, getCategoryColor } from '../utils/categoryHelpers';