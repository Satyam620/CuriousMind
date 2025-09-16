import { GoogleGenerativeAI } from '@google/generative-ai';
import { env, isGeminiConfigured } from '../config/environment';
import { QuizDetail, Question, Choice } from './api';

// Initialize Gemini AI with environment variable
const genAI = new GoogleGenerativeAI(env.geminiApiKey);

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'multiple_choice';
}

export interface GeneratedQuiz {
  title: string;
  description: string;
  questions: QuizQuestion[];
  total_questions: number;
  difficulty: string;
}

class GeminiService {
  private model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  private readonly maxRetries = 3;
  private readonly baseDelay = 2000; // 2 seconds

  async generateQuiz(
    difficulty: 'easy' | 'medium' | 'hard' | 'any',
    questionCount: number,
    topic?: string
  ): Promise<QuizDetail> {
    // Check if API key is configured
    if (!isGeminiConfigured()) {
      throw new Error('Gemini API key is not configured. Please add your API key to the .env file.');
    }

    return this.retryWithBackoff(() => this.makeQuizRequest(difficulty, questionCount, topic));
  }

  private async makeQuizRequest(
    difficulty: 'easy' | 'medium' | 'hard' | 'any',
    questionCount: number,
    topic?: string
  ): Promise<QuizDetail> {
    const prompt = this.createQuizPrompt(difficulty, questionCount, topic);

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean up the response text - remove markdown code blocks if present
    let cleanText = text.trim();

    // Remove ```json and ``` markers if present
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Parse the JSON response
    const quizData = JSON.parse(cleanText);

    // Validate and format the response
    return this.transformToQuizDetail(quizData, difficulty, questionCount);
  }

  private async retryWithBackoff<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.error(`Gemini API attempt ${attempt} failed:`, error);

        // Check if it's a retryable error
        if (this.isRetryableError(error)) {
          if (attempt < this.maxRetries) {
            const delay = this.baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
            console.log(`Retrying in ${delay}ms... (attempt ${attempt + 1}/${this.maxRetries})`);
            await this.sleep(delay);
            continue;
          }
        }

        // If it's not retryable or we've exhausted retries, throw appropriate error
        break;
      }
    }

    // Handle specific error types
    if (lastError.message.includes('API_KEY') || lastError.message.includes('API key')) {
      throw new Error('Invalid API key. Please check your Gemini API key configuration.');
    }

    if (lastError.message.includes('overloaded') || lastError.message.includes('503')) {
      throw new Error('AI service is currently overloaded. Please wait a moment and try again.');
    }

    if (lastError.message.includes('quota') || lastError.message.includes('limit')) {
      throw new Error('API quota exceeded. Please try again later or check your API usage limits.');
    }

    if (lastError.message.includes('timeout') || lastError.message.includes('TIMEOUT')) {
      throw new Error('Request timed out. Please check your internet connection and try again.');
    }

    // Generic fallback error
    throw new Error('Failed to generate quiz. The AI service may be temporarily unavailable. Please try again in a few moments.');
  }

  private isRetryableError(error: any): boolean {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorString = error?.toString()?.toLowerCase() || '';

    // Retry on service overload, timeout, or network errors
    return (
      errorMessage.includes('overloaded') ||
      errorMessage.includes('503') ||
      errorMessage.includes('502') ||
      errorMessage.includes('504') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('network') ||
      errorMessage.includes('fetch') ||
      errorString.includes('overloaded') ||
      errorString.includes('503')
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private createQuizPrompt(
    difficulty: 'easy' | 'medium' | 'hard' | 'any',
    questionCount: number,
    topic?: string
  ): string {
    const topicText = topic ? `about ${topic}` : 'on general knowledge topics';
    const difficultyText = difficulty === 'any'
      ? 'mixed difficulty levels (include a variety of easy, medium, and hard questions)'
      : `${difficulty} difficulty level`;

    return `Generate a quiz ${topicText} with the following specifications:

Difficulty: ${difficultyText}
Number of questions: ${questionCount}

Requirements:
- Each question should have exactly 4 multiple choice options (A, B, C, D)
- Only one option should be correct
- Questions should be appropriate for ${difficultyText}
- Include a mix of topics if no specific topic is provided
- Make questions engaging and educational

Please respond with ONLY a valid JSON object in this exact format:
{
  "title": "Generated Quiz Title",
  "description": "Brief description of the quiz",
  "questions": [
    {
      "question": "What is the question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A",
      "difficulty": "${difficulty === 'any' ? 'easy" (or "medium" or "hard" for each question individually)' : difficulty}",
      "type": "multiple_choice"
    }
  ]
}

${difficulty === 'any' ? 'IMPORTANT: For mixed difficulty, assign each question a specific difficulty level ("easy", "medium", or "hard") based on its complexity. Make sure to include a good mix of all three difficulty levels.' : ''}

Generate exactly ${questionCount} questions. Do not include any text before or after the JSON object.`;
  }

  private transformToQuizDetail(
    quizData: any,
    difficulty: string,
    questionCount: number
  ): QuizDetail {
    if (!quizData || typeof quizData !== 'object') {
      throw new Error('Invalid quiz data format');
    }

    if (!Array.isArray(quizData.questions) || quizData.questions.length !== questionCount) {
      throw new Error(`Expected ${questionCount} questions, got ${quizData.questions?.length || 0}`);
    }

    // Validate each question
    for (const question of quizData.questions) {
      if (!question.question || !Array.isArray(question.options) || question.options.length !== 4) {
        throw new Error('Invalid question format');
      }
      if (!question.correct_answer || !question.options.includes(question.correct_answer)) {
        throw new Error('Invalid correct answer');
      }
    }

    // Helper function to get points based on difficulty
    const getPointsForDifficulty = (questionDifficulty: string): number => {
      switch (questionDifficulty?.toLowerCase()) {
        case 'easy': return 1;
        case 'medium': return 2;
        case 'hard': return 4;
        default: return 2; // Default to medium difficulty points
      }
    };

    // Transform questions to QuizDetail format
    const transformedQuestions: Question[] = quizData.questions.map((geminiQuestion: any, index: number) => {
      // Transform options to choices
      const choices: Choice[] = geminiQuestion.options.map((option: string, choiceIndex: number) => ({
        id: choiceIndex + 1,
        choice_text: option,
        is_correct: option === geminiQuestion.correct_answer
      }));

      // Get points based on question difficulty
      const questionPoints = getPointsForDifficulty(geminiQuestion.difficulty);

      return {
        id: index + 1,
        question_text: geminiQuestion.question,
        question_type: 'multiple_choice' as const,
        points: questionPoints,
        order: index + 1,
        choices: choices
      };
    });

    const totalPoints = transformedQuestions.reduce((sum, q) => sum + q.points, 0);

    return {
      id: Date.now(), // Generate a unique ID based on timestamp
      title: quizData.title || `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Quiz`,
      description: quizData.description || `A ${difficulty} difficulty quiz with ${questionCount} questions`,
      created_at: new Date().toISOString(),
      questions: transformedQuestions,
      total_points: totalPoints
    };
  }

  // Method to test if API key is working
  async testConnection(): Promise<boolean> {
    try {
      return await this.retryWithBackoff(async () => {
        const result = await this.model.generateContent("Say 'API working' if you can see this.");
        const response = await result.response;
        const text = response.text();
        if (!text.toLowerCase().includes('api working')) {
          throw new Error('Unexpected response from API');
        }
        return true;
      });
    } catch (error) {
      console.error('Gemini API test failed:', error);
      return false;
    }
  }
}

export const geminiService = new GeminiService();