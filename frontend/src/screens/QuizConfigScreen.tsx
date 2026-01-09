import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useFont } from '../contexts/FontContext';
import { getCategoryIcon, getCategoryColor } from '../utils/categoryHelpers';
import { quizAPI } from '../services/api';
import { QuizOption, difficulties, configQuestionCounts } from '../types/quiz';
import { useScreenAnimation } from '../hooks/useScreenAnimation';

// Import web-specific component
import QuizConfigScreenWeb from './QuizConfigScreen.web';

type QuizConfigScreenNavigationProp = StackNavigationProp<RootStackParamList, 'QuizConfig'>;
type QuizConfigScreenRouteProp = RouteProp<RootStackParamList, 'QuizConfig'>;

interface Props {
  navigation: QuizConfigScreenNavigationProp;
  route: QuizConfigScreenRouteProp;
}

const { width: screenWidth } = Dimensions.get('window');

export default function QuizConfigScreen({ navigation, route }: Props) {
  // Use web-specific component for web platform
  if (Platform.OS === 'web') {
    return <QuizConfigScreenWeb navigation={navigation} route={route} />;
  }

  const { theme } = useTheme();
  const { getFontStyle } = useFont();
  const { category } = route.params;

  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('any');
  const [selectedQuestionCount, setSelectedQuestionCount] = useState<string>('10');
  const [loading, setLoading] = useState(false);

  const categoryColor = getCategoryColor(category);
  const categoryIcon = getCategoryIcon(category);

  const { fadeAnim, slideAnim, buttonScale, animateButtonPress } = useScreenAnimation();

  const handleStartQuiz = async () => {
    animateButtonPress();

    try {
      setLoading(true);

      // Generate or fetch quiz based on configuration
      const quizConfig = {
        category,
        difficulty: selectedDifficulty === 'any' ? undefined : selectedDifficulty as 'easy' | 'medium' | 'hard',
        question_count: parseInt(selectedQuestionCount)
      };

      const quiz = await quizAPI.generateCustomQuiz(quizConfig);

      // Check if there's a warning about insufficient questions
      if (quiz.warning) {
        Alert.alert('Limited Questions Available', quiz.warning, [
          {
            text: 'Continue Anyway',
            onPress: () => {
              navigation.navigate('Quiz', {
                customQuiz: quiz,
                category,
                difficulty: selectedDifficulty,
                questionCount: parseInt(selectedQuestionCount)
              });
            }
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]);
      } else {
        navigation.navigate('Quiz', {
          customQuiz: quiz,
          category,
          difficulty: selectedDifficulty,
          questionCount: parseInt(selectedQuestionCount)
        });
      }
    } catch (error: any) {
      console.error('Quiz generation error:', error);

      let errorTitle = 'Quiz Generation Failed';
      let errorMessage = 'Failed to generate quiz. Please try again.';

      if (error instanceof Error) {
        if (error.message.includes('API key') || error.message.includes('not configured')) {
          errorMessage = 'Quiz service is not properly configured. Please try again later.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Quiz generation timed out. Please try again with a shorter quiz.';
        } else {
          errorMessage = error.message;
        }
      } else if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please check your internet connection and try again.';
      } else if (error?.code === 'NETWORK_ERROR' || !error?.response) {
        errorMessage = 'Unable to connect to quiz service. Please check your internet connection and try again.';
      }

      Alert.alert(errorTitle, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderOptionSection = (
    title: string,
    options: QuizOption[],
    selectedValue: string,
    onSelect: (value: string) => void
  ) => (
    <Animated.View
      style={[
        styles.section,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }
      ]}
    >
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text, ...getFontStyle() }]}>{title}</Text>
        <View style={[styles.sectionIcon, { backgroundColor: theme.isDark ? 'rgba(96, 165, 250, 0.1)' : 'rgba(59, 130, 246, 0.1)' }]}>
          <Ionicons
            name={title === 'Difficulty' ? 'speedometer-outline' : 'list-outline'}
            size={16}
            color={theme.isDark ? '#60A5FA' : '#3B82F6'}
          />
        </View>
      </View>
      <View style={styles.listContainer}>
        {options.map((option, index) => {
          const isSelected = selectedValue === option.value;
          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.listItem,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                isSelected && styles.selectedListItem,
                isSelected && { borderColor: option.color }
              ]}
              onPress={() => onSelect(option.value)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.listItemIcon,
                { backgroundColor: isSelected ? option.color : theme.isDark ? 'rgba(96, 165, 250, 0.1)' : 'rgba(59, 130, 246, 0.1)' }
              ]}>
                <Ionicons
                  name={option.icon}
                  size={20}
                  color={isSelected ? '#FFFFFF' : option.color}
                />
              </View>

              <View style={styles.listItemContent}>
                <Text style={[
                  styles.listItemLabel,
                  { color: theme.colors.text, ...getFontStyle() },
                  isSelected && {
                    color: theme.isDark ? '#FFFFFF' : option.color,
                    fontWeight: '600'
                  }
                ]}>
                  {option.label}
                </Text>
                <Text style={[
                  styles.listItemDescription,
                  { color: theme.colors.textSecondary, ...getFontStyle() },
                  isSelected && {
                    color: theme.isDark ? '#FFFFFF' : option.color,
                    opacity: 0.8
                  }
                ]}>
                  {option.description}
                </Text>
              </View>

              {isSelected && (
                <View style={styles.listItemCheck}>
                  <Ionicons name="checkmark-circle" size={20} color={theme.isDark ? '#34D399' : '#059669'} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Simple Header */}
        <View style={styles.simpleHeader}>
          <View style={styles.titleColumn}>
            <Ionicons name={categoryIcon} size={32} color={categoryColor} />
            <Text style={[styles.headerTitle, { color: theme.colors.text, ...getFontStyle() }]}>
              {category}
            </Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary, ...getFontStyle() }]}>
            ⚙️ Configure your perfect quiz experience
          </Text>
        </View>

        {renderOptionSection(
          'Difficulty',
          difficulties,
          selectedDifficulty,
          setSelectedDifficulty
        )}

        {renderOptionSection(
          'Number of Questions',
          configQuestionCounts,
          selectedQuestionCount,
          setSelectedQuestionCount
        )}

        <Animated.View
          style={[
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <View
            style={[styles.previewContainer, { backgroundColor: theme.colors.surface }]}
          >
            <View style={styles.previewHeader}>
              <View style={styles.previewTitleContainer}>
                <View style={[styles.previewIconContainer, { backgroundColor: theme.isDark ? '#3B82F6' : '#60A5FA' }]}>
                  <Ionicons name="clipboard" size={20} color="#FFFFFF" />
                </View>
                <Text style={[styles.previewTitle, { color: theme.colors.text, ...getFontStyle() }]}>
                  Quiz Preview
                </Text>
              </View>
              <View style={[styles.previewBadge, { backgroundColor: theme.isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)' }]}>
                <Ionicons name="checkmark-circle" size={14} color={theme.isDark ? '#22C55E' : '#10B981'} />
                <Text style={[styles.previewText, { color: theme.isDark ? '#22C55E' : '#10B981', ...getFontStyle() }]}>
                  Ready
                </Text>
              </View>
            </View>

            <View style={styles.previewGrid}>
              <View style={[styles.previewCard, { backgroundColor: theme.isDark ? 'rgba(251, 191, 36, 0.15)' : 'rgba(245, 158, 11, 0.1)' }]}>
                <View style={[styles.previewCardIcon, { backgroundColor: categoryColor }]}>
                  <Ionicons name={categoryIcon} size={18} color="#FFFFFF" />
                </View>
                <View style={styles.previewCardContent}>
                  <Text style={[styles.previewCardLabel, { color: theme.colors.textSecondary, ...getFontStyle() }]}>Category</Text>
                  <Text style={[styles.previewCardValue, { color: theme.colors.text, ...getFontStyle() }]} numberOfLines={1}>
                    {category}
                  </Text>
                </View>
              </View>

              <View style={[styles.previewCard, { backgroundColor: theme.isDark ? 'rgba(236, 72, 153, 0.15)' : 'rgba(219, 39, 119, 0.1)' }]}>
                <View style={[styles.previewCardIcon, { backgroundColor: difficulties.find(d => d.value === selectedDifficulty)?.color || '#8B5CF6' }]}>
                  <Ionicons name={difficulties.find(d => d.value === selectedDifficulty)?.icon || 'shuffle'} size={18} color="#FFFFFF" />
                </View>
                <View style={styles.previewCardContent}>
                  <Text style={[styles.previewCardLabel, { color: theme.colors.textSecondary, ...getFontStyle() }]}>Difficulty</Text>
                  <Text style={[styles.previewCardValue, { color: theme.colors.text, ...getFontStyle() }]}>
                    {difficulties.find(d => d.value === selectedDifficulty)?.label || 'Unknown'}
                  </Text>
                </View>
              </View>

              <View style={[styles.previewCard, { backgroundColor: theme.isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(124, 58, 237, 0.1)' }]}>
                <View style={[styles.previewCardIcon, { backgroundColor: configQuestionCounts.find(q => q.value === selectedQuestionCount)?.color || '#3B82F6' }]}>
                  <Ionicons name={configQuestionCounts.find(q => q.value === selectedQuestionCount)?.icon || 'flash'} size={18} color="#FFFFFF" />
                </View>
                <View style={styles.previewCardContent}>
                  <Text style={[styles.previewCardLabel, { color: theme.colors.textSecondary, ...getFontStyle() }]}>Questions</Text>
                  <Text style={[styles.previewCardValue, { color: theme.colors.text, ...getFontStyle() }]}>
                    {configQuestionCounts.find(q => q.value === selectedQuestionCount)?.label || selectedQuestionCount}
                  </Text>
                </View>
              </View>
            </View>

          </View>
        </Animated.View>

        <Animated.View
          style={[
            {
              opacity: fadeAnim,
              transform: [{ scale: buttonScale }],
            }
          ]}
        >
          <TouchableOpacity
            style={[styles.generateButton, loading && styles.generateButtonDisabled]}
            onPress={handleStartQuiz}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={loading
                ? ['#9CA3AF', '#6B7280']
                : [categoryColor, `${categoryColor}CC`]
              }
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={[styles.generateButtonText, getFontStyle()]}>
                    Preparing Quiz...
                  </Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Ionicons name="play" size={20} color="#FFFFFF" />
                  <Text style={[styles.generateButtonText, getFontStyle()]}>
                    Start Quiz
                  </Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 40,
    minHeight: '100%',
  },
  // Header Styles
  header: {
    marginBottom: 20,
  },
  headerGradient: {
    borderRadius: 20,
    margin: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  headerContent: {
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  // Section Styles
  section: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // List Styles
  listContainer: {
    gap: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedListItem: {
    borderWidth: 2,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  listItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  listItemContent: {
    flex: 1,
  },
  listItemLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  listItemDescription: {
    fontSize: 14,
    opacity: 0.8,
  },
  listItemCheck: {
    marginLeft: 12,
  },
  // Preview Styles
  previewContainer: {
    margin: 16,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  previewTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  previewText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  previewGrid: {
    gap: 12,
    marginBottom: 16,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  previewCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  previewCardContent: {
    flex: 1,
  },
  previewCardLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    opacity: 0.8,
  },
  previewCardValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  previewCardAccent: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 4,
    height: '100%',
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  previewSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  previewSummaryText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  // Generate Button Styles
  generateButton: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  generateButtonDisabled: {
    shadowOpacity: 0.1,
    elevation: 3,
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Simple Header Styles (no card container)
  simpleHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  titleColumn: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
});