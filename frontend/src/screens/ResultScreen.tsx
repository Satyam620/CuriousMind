import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, SafeAreaView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { useTheme } from '../contexts/ThemeContext';
import { useFont } from '../contexts/FontContext';
import { Ionicons } from '@expo/vector-icons';

type ResultScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Result'>;
type ResultScreenRouteProp = RouteProp<RootStackParamList, 'Result'>;

interface Props {
  navigation: ResultScreenNavigationProp;
  route: ResultScreenRouteProp;
}

export default function ResultScreen({ navigation, route }: Props) {
  const { score, totalPoints, percentage, quiz, answers } = route.params;
  const { theme } = useTheme();
  const { getFontStyle } = useFont();
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return '#34C759';
    if (percentage >= 60) return '#FF9500';
    return '#FF3B30';
  };

  const getScoreMessage = (percentage: number) => {
    if (percentage >= 90) return 'Excellent! 🏆';
    if (percentage >= 80) return 'Great job! 👏';
    if (percentage >= 70) return 'Good work! 👍';
    if (percentage >= 60) return 'Not bad! 📚';
    return 'Keep practicing! 💪';
  };

  const renderCorrectAnswersModal = () => {
    if (!quiz || !answers) return null;

    return (
      <Modal
        visible={showCorrectAnswers}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }, getFontStyle()]}>Correct Answers</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCorrectAnswers(false)}
            >
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {quiz.questions?.map((question: any, index: number) => {
              const userAnswer = answers.find((a: any) => a.question_id === question.id);
              const correctChoice = question.choices?.find((c: any) => c.is_correct);
              const userChoice = question.choices?.find((c: any) => c.id === userAnswer?.selected_choice_id);
              const isCorrect = userChoice?.is_correct || false;

              return (
                <View key={question.id} style={[styles.questionCard, { backgroundColor: theme.colors.surface }]}>
                  <Text style={[styles.questionNumber, { color: theme.colors.textSecondary }, getFontStyle()]}>
                    Question {index + 1}
                  </Text>
                  <Text style={[styles.questionText, { color: theme.colors.text }, getFontStyle()]}>
                    {question.question_text}
                  </Text>

                  <View style={styles.answersContainer}>
                    {question.choices?.map((choice: any) => {
                      const isUserChoice = choice.id === userAnswer?.selected_choice_id;
                      const isCorrectChoice = choice.is_correct;

                      let backgroundColor = 'transparent';
                      let borderColor = theme.colors.border;
                      let textColor = theme.colors.text;

                      if (isCorrectChoice) {
                        backgroundColor = '#10B981';
                        borderColor = '#10B981';
                        textColor = 'white';
                      } else if (isUserChoice && !isCorrectChoice) {
                        backgroundColor = '#EF4444';
                        borderColor = '#EF4444';
                        textColor = 'white';
                      }

                      return (
                        <View
                          key={choice.id}
                          style={[
                            styles.answerChoice,
                            { backgroundColor, borderColor }
                          ]}
                        >
                          <View style={styles.choiceHeader}>
                            <Text style={[styles.choiceText, { color: textColor }, getFontStyle()]}>
                              {choice.choice_text}
                            </Text>
                            {isCorrectChoice && (
                              <Ionicons name="checkmark-circle" size={20} color="white" />
                            )}
                            {isUserChoice && !isCorrectChoice && (
                              <Ionicons name="close-circle" size={20} color="white" />
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>

                  <View style={[styles.resultIndicator, { backgroundColor: isCorrect ? '#10B981' : '#EF4444' }]}>
                    <Ionicons
                      name={isCorrect ? "checkmark" : "close"}
                      size={16}
                      color="white"
                    />
                    <Text style={[styles.resultText, getFontStyle()]}>
                      {isCorrect ? 'Correct' : 'Incorrect'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.resultCard, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.title, { color: theme.colors.text }, getFontStyle()]}>Quiz Complete!</Text>

        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreText, { color: getScoreColor(percentage) }, getFontStyle()]}>
            {Math.round(percentage)}%
          </Text>
          <Text style={[styles.scoreDetails, { color: theme.colors.textSecondary }, getFontStyle()]}>
            {score} out of {totalPoints} points
          </Text>
        </View>

        <Text style={[styles.messageText, { color: theme.colors.text }, getFontStyle()]}>{getScoreMessage(percentage)}</Text>

        <View style={styles.buttonContainer}>
          {quiz && answers && (
            <TouchableOpacity
              style={[styles.viewAnswersButton, { borderColor: theme.colors.textSecondary }]}
              onPress={() => setShowCorrectAnswers(true)}
            >
              <Ionicons name="eye-outline" size={20} color={theme.colors.text} />
              <Text style={[styles.viewAnswersButtonText, { color: theme.colors.text }, getFontStyle()]}>View Correct Answers</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.isDark ? '#3B82F6' : '#007AFF' }]}
            onPress={() => navigation.navigate('MainTabs')}
          >
            <Text style={[styles.primaryButtonText, getFontStyle()]}>Take Another Quiz</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: theme.isDark ? '#3B82F6' : '#007AFF' }]}
            onPress={() => navigation.navigate('MainTabs')}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.isDark ? '#3B82F6' : '#007AFF' }, getFontStyle()]}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>

      {renderCorrectAnswersModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  resultCard: {
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    elevation: 5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  scoreText: {
    fontSize: 64,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  scoreDetails: {
    fontSize: 18,
  },
  messageText: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 40,
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  viewAnswersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 2,
    gap: 8,
  },
  viewAnswersButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 2,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  questionCard: {
    marginBottom: 24,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    lineHeight: 24,
  },
  answersContainer: {
    gap: 8,
    marginBottom: 16,
  },
  answerChoice: {
    borderRadius: 8,
    borderWidth: 2,
    padding: 12,
  },
  choiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  choiceText: {
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  resultIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  resultText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});