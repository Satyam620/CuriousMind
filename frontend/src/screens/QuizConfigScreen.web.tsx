import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
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

type QuizConfigScreenNavigationProp = StackNavigationProp<RootStackParamList, 'QuizConfig'>;
type QuizConfigScreenRouteProp = RouteProp<RootStackParamList, 'QuizConfig'>;

interface Props {
  navigation: QuizConfigScreenNavigationProp;
  route: QuizConfigScreenRouteProp;
}

const { width: screenWidth } = Dimensions.get('window');

// Responsive grid logic for options
const getNumColumns = () => {
  return screenWidth >= 768 ? 2 : 1; // 2 columns on tablets/desktop, 1 on mobile web
};

const getItemWidth = (numColumns: number) => {
  if (numColumns === 2) {
    return (screenWidth - 64) / 2 - 8; // Account for margins and gaps
  }
  return screenWidth - 32; // Single column with margins
};

export default function QuizConfigScreenWeb({ navigation, route }: Props) {
  const { theme } = useTheme();
  const { getFontStyle } = useFont();
  const { category } = route.params;

  // Simple web alert implementation
  const [alertState, setAlertState] = useState({ visible: false, title: '', message: '' });
  const showAlert = (title: string, message: string) => {
    setAlertState({ visible: true, title, message });
  };
  const hideAlert = () => setAlertState({ visible: false, title: '', message: '' });

  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('any');
  const [selectedQuestionCount, setSelectedQuestionCount] = useState<string>('10');
  const [loading, setLoading] = useState(false);
  const [numColumns, setNumColumns] = useState(getNumColumns());

  const categoryColor = getCategoryColor(category);
  const categoryIcon = getCategoryIcon(category);

  const { fadeAnim, slideAnim, buttonScale, animateButtonPress } = useScreenAnimation();

  // Handle screen size changes
  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => {
      setNumColumns(getNumColumns());
    });

    return () => subscription?.remove();
  }, []);

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

      navigation.navigate('Quiz', {
        customQuiz: quiz,
        category,
        difficulty: selectedDifficulty,
        questionCount: parseInt(selectedQuestionCount)
      });
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

      showAlert(errorTitle, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderOptionSection = (
    title: string,
    options: QuizOption[],
    selectedValue: string,
    onSelect: (value: string) => void
  ) => {
    // Create rows for grid layout
    const createRows = () => {
      const rows = [];
      for (let i = 0; i < options.length; i += numColumns) {
        rows.push(options.slice(i, i + numColumns));
      }
      return rows;
    };

    return (
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

        {numColumns === 1 ? (
          // Single column layout
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
                    isSelected && { borderColor: option.color, backgroundColor: theme.isDark ? `${option.color}20` : `${option.color}15` }
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
        ) : (
          // Grid layout for two columns
          <View style={styles.gridContainer}>
            {createRows().map((row, rowIndex) => (
              <View key={rowIndex} style={styles.gridRow}>
                {row.map((option, colIndex) => {
                  const isSelected = selectedValue === option.value;
                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.gridItem,
                        {
                          backgroundColor: theme.colors.surface,
                          borderColor: theme.colors.border,
                          width: getItemWidth(numColumns),
                        },
                        isSelected && styles.selectedListItem,
                        isSelected && { borderColor: option.color, backgroundColor: theme.isDark ? `${option.color}20` : `${option.color}15` }
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
                {/* Fill empty space if odd number of items */}
                {row.length < numColumns && (
                  <View style={{ width: getItemWidth(numColumns) }} />
                )}
              </View>
            ))}
          </View>
        )}
      </Animated.View>
    );
  };

  // Simple Alert Component
  const SimpleAlert = () => {
    if (!alertState.visible) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}>
        <div style={{
          backgroundColor: theme.colors.surface,
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '16px',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '20px',
              backgroundColor: '#EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '12px',
            }}>
              ⚠️
            </div>
            <h3 style={{
              margin: 0,
              color: theme.colors.text,
              fontSize: '18px',
              fontWeight: '600',
            }}>
              {alertState.title}
            </h3>
          </div>
          <p style={{
            margin: '0 0 20px 0',
            color: theme.colors.textSecondary,
            fontSize: '16px',
            lineHeight: '1.5',
          }}>
            {alertState.message}
          </p>
          <button
            onClick={hideAlert}
            style={{
              backgroundColor: '#EF4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            OK
          </button>
        </div>
      </div>
    );
  };

  // Inject custom scrollbar styles
  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      const styleId = 'quiz-config-scrollbar-styles';
      let existingStyle = document.getElementById(styleId);

      if (existingStyle) {
        existingStyle.remove();
      }

      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${theme.isDark ? '#1F2937' : '#F8FAFC'};
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${theme.isDark ? '#4B5563' : '#CBD5E1'};
          border-radius: 4px;
          transition: background-color 0.2s ease;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${theme.isDark ? '#6B7280' : '#94A3B8'};
        }
      `;
      document.head.appendChild(style);

      return () => {
        const styleToRemove = document.getElementById(styleId);
        if (styleToRemove) {
          styleToRemove.remove();
        }
      };
    }
  }, [theme.isDark]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SimpleAlert />
      <div style={{
        height: '94vh',
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'thin',
        scrollbarColor: theme.isDark ? '#4B5563 #1F2937' : '#CBD5E1 #F8FAFC'
      }}
      className="custom-scrollbar"
      >
        {/* Simple Header */}
        <div style={{ padding: '16px 20px', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
            <Ionicons name={categoryIcon} size={28} color={categoryColor} />
            <Text style={[styles.headerTitle, { color: theme.colors.text, marginLeft: 12, ...getFontStyle() }]}>
              {category}
            </Text>
          </div>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary, ...getFontStyle() }]}>
            ⚙️ Configure your perfect quiz experience
          </Text>
        </div>

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
      </div>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  // Grid Styles for responsive layout
  gridContainer: {
    gap: 12,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 16,
    paddingHorizontal: 0,
  },
  gridItem: {
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
    marginBottom: 20,
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
    marginTop: 4,
  },
});