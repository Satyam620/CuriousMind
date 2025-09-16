import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { quizAPI, QuizDetail, Question } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useFont } from '../contexts/FontContext';

type QuizScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Quiz'>;
type QuizScreenRouteProp = RouteProp<RootStackParamList, 'Quiz'>;

interface Props {
  navigation: QuizScreenNavigationProp;
  route: QuizScreenRouteProp;
}

interface Answer {
  question_id: number;
  selected_choice_id?: number;
  text_answer?: string;
}

export default function QuizScreen({ navigation, route }: Props) {
  const { quizId, customQuiz } = route.params;
  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const { theme } = useTheme();
  const { getFontStyle } = useFont();
  const { user } = useAuth();

  useEffect(() => {
    if (customQuiz) {
      setQuiz(customQuiz);
      setLoading(false);
      setStartTime(Date.now()); // Start timer when quiz loads
    } else if (quizId) {
      fetchQuiz();
    }
  }, [quizId, customQuiz]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const data = await quizAPI.getQuizById(quizId!);
      setQuiz(data);
      setStartTime(Date.now()); // Start timer when quiz loads
    } catch (err: any) {
      let errorMessage = 'Failed to load quiz. Please try again.';

      if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please check your internet connection and try again.';
      } else if (err?.code === 'NETWORK_ERROR' || !err?.response) {
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      } else if (err?.response?.status === 404) {
        errorMessage = 'Quiz not found. It may have been removed.';
      }

      Alert.alert('Error', errorMessage);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: number, choiceId: number) => {
    const newAnswers = [...answers];
    const existingAnswerIndex = newAnswers.findIndex(a => a.question_id === questionId);
    
    if (existingAnswerIndex >= 0) {
      newAnswers[existingAnswerIndex].selected_choice_id = choiceId;
    } else {
      newAnswers.push({
        question_id: questionId,
        selected_choice_id: choiceId,
      });
    }
    
    setAnswers(newAnswers);
  };

  const getSelectedChoiceId = (questionId: number): number | undefined => {
    const answer = answers.find(a => a.question_id === questionId);
    return answer?.selected_choice_id;
  };

  const handleNext = () => {
    if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!quiz) return;

    if (answers.length !== quiz.questions.length) {
      Alert.alert('Incomplete', 'Please answer all questions before submitting.');
      return;
    }

    try {
      setSubmitting(true);

      // For custom quizzes, calculate score locally since there's no real quiz_id
      if (customQuiz) {
        let score = 0;
        const totalPoints = quiz.total_points;

        for (const answer of answers) {
          const question = quiz.questions.find(q => q.id === answer.question_id);
          if (question && answer.selected_choice_id) {
            const selectedChoice = question.choices.find(c => c.id === answer.selected_choice_id);
            if (selectedChoice?.is_correct) {
              score += question.points;
            }
          }
        }

        const percentage = totalPoints > 0 ? (score / totalPoints * 100) : 0;

        // Save custom quiz result for history tracking
        if (user?.id) {
          try {
            await quizAPI.saveQuizResult({
              user_id: user.id,
              quiz_title: quiz.title,
              score,
              total_points: totalPoints,
              time_taken_seconds: Math.floor((Date.now() - startTime) / 1000),
              is_ai_generated: quiz.is_ai_generated ?? true // Use quiz's is_ai_generated flag, default to true for backward compatibility
            });
          } catch (error) {
            console.error('Failed to save custom quiz result:', error);
            // Continue even if save fails - don't block user experience
          }
        }

        navigation.replace('Result', {
          score,
          totalPoints,
          percentage,
          quiz,
          answers,
        });
      } else {
        // Regular quiz submission
        const result = await quizAPI.submitQuizAnswers({
          quiz_id: quizId!,
          user_id: 1, // For demo purposes
          answers: answers,
          time_taken_seconds: Math.floor((Date.now() - startTime) / 1000),
        });

        navigation.replace('Result', {
          score: result.score,
          totalPoints: result.total_points,
          percentage: result.percentage,
          quiz,
          answers,
        });
      }
    } catch (err: any) {
      let errorMessage = 'Failed to submit quiz. Your answers may not have been saved.';

      if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) {
        errorMessage = 'Submission timed out. Please check your internet connection and try again.';
      } else if (err?.code === 'NETWORK_ERROR' || !err?.response) {
        errorMessage = 'Unable to connect to server. Please check your internet connection and try submitting again.';
      }

      Alert.alert('Submission Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={[styles.loadingText, { color: theme.colors.text }, getFontStyle()]}>Loading quiz...</Text>
      </View>
    );
  }

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.text }, getFontStyle()]}>Quiz not found or has no questions</Text>
      </View>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  if (!currentQuestion) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.text }, getFontStyle()]}>Question not found</Text>
      </View>
    );
  }

  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.quizTitle, { color: theme.colors.text }, getFontStyle()]}>{quiz.title}</Text>
        <Text style={[styles.questionCounter, { color: theme.colors.textSecondary }, getFontStyle()]}>
          Question {currentQuestionIndex + 1} of {quiz.questions.length}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.questionText, { color: theme.colors.text }, getFontStyle()]}>{currentQuestion.question_text}</Text>

        <View style={styles.choicesContainer}>
          {currentQuestion.choices && Array.isArray(currentQuestion.choices) ?
            currentQuestion.choices.map((choice) => {
              const isSelected = getSelectedChoiceId(currentQuestion.id) === choice.id;
              return (
                <TouchableOpacity
                  key={choice.id}
                  style={[
                    styles.choiceButton,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                    isSelected && { borderColor: '#007AFF', backgroundColor: theme.isDark ? 'rgba(0, 122, 255, 0.2)' : '#f0f8ff' }
                  ]}
                  onPress={() => handleAnswerSelect(currentQuestion.id, choice.id)}
                >
                  <Text style={[
                    styles.choiceText,
                    { color: theme.colors.text },
                    isSelected && { color: '#007AFF', fontWeight: '600' },
                    getFontStyle()
                  ]}>
                    {choice.choice_text}
                  </Text>
                </TouchableOpacity>
              );
            }) : (
              <Text style={[styles.errorText, { color: theme.colors.text }, getFontStyle()]}>
                No choices available for this question
              </Text>
            )
          }
        </View>
      </ScrollView>

      <View style={[styles.navigationContainer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
        <TouchableOpacity
          style={[styles.navButton, currentQuestionIndex === 0 && styles.disabledButton]}
          onPress={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          <Text style={[styles.navButtonText, getFontStyle()]}>Previous</Text>
        </TouchableOpacity>

        {isLastQuestion ? (
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={[styles.submitButtonText, getFontStyle()]}>
              {submitting ? 'Submitting...' : 'Submit'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.navButton}
            onPress={handleNext}
          >
            <Text style={[styles.navButtonText, getFontStyle()]}>Next</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
  },
  quizTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  questionCounter: {
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  questionText: {
    fontSize: 20,
    marginBottom: 30,
    lineHeight: 28,
  },
  choicesContainer: {
    gap: 15,
  },
  choiceButton: {
    padding: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  choiceText: {
    fontSize: 16,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
  },
  navButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 100,
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 100,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  navButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
  },
});