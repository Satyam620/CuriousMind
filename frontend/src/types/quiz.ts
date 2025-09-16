import { Ionicons } from '@expo/vector-icons';

export interface QuizOption {
  id: string;
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  color: string;
}

// Shared difficulty options
export const difficulties: QuizOption[] = [
  { id: 'any', label: 'Any Difficulty', value: 'any', icon: 'shuffle', description: 'Mixed challenge levels', color: '#8B5CF6' },
  { id: 'easy', label: 'Easy', value: 'easy', icon: 'happy', description: 'Perfect for beginners', color: '#22C55E' },
  { id: 'medium', label: 'Medium', value: 'medium', icon: 'warning', description: 'Good challenge level', color: '#F59E0B' },
  { id: 'hard', label: 'Hard', value: 'hard', icon: 'flame', description: 'Expert level difficulty', color: '#EF4444' },
];

// Question counts for QuizConfig screens (category-based)
export const configQuestionCounts: QuizOption[] = [
  { id: '10', label: '10 Questions', value: '10', icon: 'flash', description: 'Quick 5 min quiz', color: '#8B5CF6' },
  { id: '20', label: '20 Questions', value: '20', icon: 'time', description: 'Standard 10 min quiz', color: '#3B82F6' },
  { id: '30', label: '30 Questions', value: '30', icon: 'trending-up', description: 'Extended 15 min quiz', color: '#06B6D4' },
  { id: '40', label: '40 Questions', value: '40', icon: 'trophy', description: 'Challenge 20 min quiz', color: '#F59E0B' },
  { id: '50', label: '50 Questions', value: '50', icon: 'medal', description: 'Expert 25 min quiz', color: '#EF4444' },
];

// Question counts for Generate screen (AI-based)
export const generateQuestionCounts: QuizOption[] = [
  { id: '5', label: '5 Questions', value: '5', icon: 'flash', description: 'Quick 2 min quiz', color: '#22C55E' },
  { id: '10', label: '10 Questions', value: '10', icon: 'time', description: 'Short 5 min quiz', color: '#8B5CF6' },
  { id: '15', label: '15 Questions', value: '15', icon: 'trending-up', description: 'Standard 8 min quiz', color: '#3B82F6' },
  { id: '20', label: '20 Questions', value: '20', icon: 'trophy', description: 'Extended 10 min quiz', color: '#F59E0B' },
];