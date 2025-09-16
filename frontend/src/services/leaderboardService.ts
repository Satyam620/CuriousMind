import { API_BASE_URL } from './api';

export interface LeaderboardEntry {
  rank: number;
  username: string;
  display_name: string;
  total_score: number;
  total_quizzes_completed: number;
  average_score_percentage: number;
}

export interface GlobalLeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  total_users: number;
}

export interface QuizLeaderboardEntry {
  rank: number;
  username: string;
  display_name: string;
  score: number;
  total_points: number;
  percentage: number;
  completed_at: string;
  time_taken: string;
}

export interface QuizLeaderboardResponse {
  quiz_id: number;
  quiz_title: string;
  leaderboard: QuizLeaderboardEntry[];
}

export interface UserProfile {
  username: string;
  first_name: string;
  last_name: string;
  total_score: number;
  total_quizzes_completed: number;
  average_score_percentage: number;
  rank: number;
}

export interface RecentAttempt {
  quiz_title: string;
  score: number;
  total_points: number;
  percentage: number;
  completed_at: string;
  time_taken: string;
}

export interface UserProfileResponse {
  profile: UserProfile;
  recent_attempts: RecentAttempt[];
}

export const leaderboardService = {
  async getGlobalLeaderboard(limit: number = 50): Promise<GlobalLeaderboardResponse> {
    const response = await fetch(`${API_BASE_URL}/leaderboard/?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch global leaderboard');
    }

    return response.json();
  },

  async getQuizLeaderboard(quizId: number): Promise<QuizLeaderboardResponse> {
    const response = await fetch(`${API_BASE_URL}/leaderboard/quiz/${quizId}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch quiz leaderboard');
    }

    return response.json();
  },

  async getUserProfile(userId: number): Promise<UserProfileResponse> {
    const response = await fetch(`${API_BASE_URL}/profile/${userId}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }

    return response.json();
  },
};