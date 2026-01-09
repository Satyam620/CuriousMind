import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, TabParamList } from '../../App';
import { quizAPI, Quiz } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useFont } from '../contexts/FontContext';
import { getCategoryIcon, getCategoryColor } from '../utils/categoryHelpers';

type CategoryScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Category'>,
  StackNavigationProp<RootStackParamList>
>;

interface Props {
  navigation: CategoryScreenNavigationProp;
}

interface CategoryData {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  totalQuestions: number;
}

const CategoryScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme();
  const { getFontStyle } = useFont();
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Store screen width in state for responsive updates
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);

  // Responsive grid logic
  const getNumColumns = (width: number) => {
    if (Platform.OS === 'web') {
      return width >= 768 ? 2 : 1; // 2 columns on tablets/desktop, 1 on mobile web
    }
    return width >= 768 ? 2 : 1; // 2 columns on iPads/tablets, 1 on phones
  };

  const getItemWidth = (numColumns: number, width: number) => {
    if (numColumns === 2) {
      // For web, be more conservative with the width calculation
      if (Platform.OS === 'web') {
        return Math.floor((width - 120) / 2); // Very conservative for web
      }
      return (width - 80) / 2 - 12; // More conservative width calculation
    }
    return width - 32; // Single column with margins
  };

  const [numColumns, setNumColumns] = useState(getNumColumns(screenWidth));

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];

  // Animate entrance
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Handle screen size changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      const newWidth = window.width;
      setScreenWidth(newWidth);
      setNumColumns(getNumColumns(newWidth));
    });

    return () => subscription?.remove();
  }, []);

  const fetchAvailableCategories = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const quizzes = await quizAPI.getAllQuizzes();

      // Extract unique categories from quiz titles
      const categorySet = new Set<string>();
      const categoryQuestionCount = new Map<string, number>();

      quizzes.forEach(quiz => {
        const categoryName = quiz.title.split(' - ')[0] || 'General Knowledge';
        categorySet.add(categoryName);
        categoryQuestionCount.set(categoryName, (categoryQuestionCount.get(categoryName) || 0) + quiz.question_count);
      });

      // Create category list with metadata
      const categoriesData: CategoryData[] = Array.from(categorySet).map(categoryName => ({
        id: categoryName.toLowerCase().replace(/[^a-z0-9]/g, ''),
        name: categoryName,
        icon: getCategoryIcon(categoryName),
        color: getCategoryColor(categoryName, theme.isDark),
        totalQuestions: categoryQuestionCount.get(categoryName) || 0,
      }));

      // Sort categories alphabetically
      categoriesData.sort((a, b) => a.name.localeCompare(b.name));

      setCategories(categoriesData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load categories');
      console.error('Categories fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };



  const onRefresh = () => {
    setRefreshing(true);
    fetchAvailableCategories(false);
  };

  // Create a separate component for category items to properly use hooks
  const CategoryItem = ({ item, index }: { item: CategoryData, index: number }) => {
    const cardScale = useState(new Animated.Value(1))[0];

    const handlePressIn = () => {
      Animated.spring(cardScale, {
        toValue: 0.96,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(cardScale, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Animated.View
        style={[
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: cardScale }
            ],
          }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.categoryCard,
            { width: getItemWidth(numColumns, screenWidth) },
            numColumns === 2 && { marginBottom: 12 },
            numColumns === 1 && { alignSelf: 'center' }
          ]}
          onPress={() => navigation.navigate('QuizConfig', { category: item.name })}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={theme.isDark
              ? ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']
              : ['rgba(255,255,255,0.9)', 'rgba(248,250,252,0.8)']
            }
            style={[styles.cardGradient, { backgroundColor: theme.colors.surface }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Icon Container with Gradient */}
            <View style={styles.iconSection}>
              <LinearGradient
                colors={[item.color, `${item.color}CC`]}
                style={styles.iconContainer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name={item.icon} size={32} color={theme.isDark ? "#F0F9FF" : "#FFFFFF"} />

                {/* Subtle glow effect */}
                <View style={[styles.iconGlow, { backgroundColor: `${item.color}40` }]} />
              </LinearGradient>

              {/* Category badge */}
              <View style={[styles.categoryBadge, { backgroundColor: `${item.color}20` }]}>
                <Text style={[styles.badgeText, { color: item.color, ...getFontStyle() }]}>
                  #{index + 1}
                </Text>
              </View>
            </View>

            {/* Content Section */}
            <View style={styles.categoryContent}>
              <Text style={[styles.categoryName, { color: theme.colors.text }, getFontStyle()]}>
                {item.name}
              </Text>

              <View style={styles.statsContainer}>
                <View style={styles.questionStat}>
                  <Ionicons name="document-text-outline" size={14} color={theme.colors.textSecondary} />
                  <Text style={[styles.quizCount, { color: theme.colors.textSecondary }, getFontStyle()]}>
                    {item.totalQuestions} questions
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Section */}
            <View style={styles.actionSection}>
              <View style={[styles.chevronContainer, { backgroundColor: `${item.color}15` }]}>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={item.color}
                />
              </View>
            </View>

            {/* Decorative elements */}
            <View style={[styles.decorativeCircle1, { backgroundColor: `${item.color}08` }]} />
            <View style={[styles.decorativeCircle2, { backgroundColor: `${item.color}05` }]} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderCategoryItem = ({ item, index }: { item: CategoryData, index: number }) => {
    return <CategoryItem item={item} index={index} />;
  };

  const renderHeader = () => (
    <View style={styles.simpleHeader}>
      <Text style={[styles.headerTitle, { color: theme.colors.text }, getFontStyle()]}>
        📚 Quiz Categories
      </Text>
      <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }, getFontStyle()]}>
        Choose your knowledge adventure
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <Animated.View
      style={[
        styles.emptyState,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }
      ]}
    >
      <View style={[styles.emptyIconContainer, { backgroundColor: theme.isDark ? 'rgba(156, 163, 175, 0.1)' : 'rgba(107, 114, 128, 0.1)' }]}>
        <Ionicons name="folder-open-outline" size={48} color={theme.colors.textSecondary} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.colors.text }, getFontStyle()]}>
        📂 No categories found
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }, getFontStyle()]}>
        Pull down to refresh and discover new quiz categories
      </Text>
      <View style={[styles.refreshHint, { backgroundColor: theme.isDark ? 'rgba(96, 165, 250, 0.1)' : 'rgba(59, 130, 246, 0.1)' }]}>
        <Ionicons name="refresh" size={16} color={theme.isDark ? '#60A5FA' : '#3B82F6'} />
        <Text style={[styles.refreshText, { color: theme.isDark ? '#60A5FA' : '#3B82F6', ...getFontStyle() }]}>
          Swipe down to refresh
        </Text>
      </View>
    </Animated.View>
  );

  useEffect(() => {
    fetchAvailableCategories();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <LinearGradient
            colors={theme.isDark ? ['#3B82F6', '#1D4ED8'] : ['#60A5FA', '#3B82F6']}
            style={styles.loadingIconContainer}
          >
            <ActivityIndicator size="large" color="#FFFFFF" />
          </LinearGradient>
          <Text style={[styles.loadingTitle, { color: theme.colors.text }, getFontStyle()]}>
            🔍 Discovering Categories
          </Text>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }, getFontStyle()]}>
            Finding the best quiz topics for you...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => renderCategoryItem({ item, index })}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        numColumns={numColumns}
        key={numColumns} // Force re-render when columns change
        columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
        ItemSeparatorComponent={numColumns === 1 ? () => <View style={styles.itemSeparator} /> : null}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  loadingTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  // List Styles
  listContainer: {
    paddingBottom: 30,
  },
  itemSeparator: {
    height: 12,
  },
  // Header Styles
  header: {
    marginBottom: 16,
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
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  statsSection: {
    width: '100%',
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  // Row and Grid Styles
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    gap: 12,
  },
  // Category Card Styles
  categoryCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  cardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  // Icon Section
  iconSection: {
    position: 'relative',
    marginRight: 16,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    position: 'relative',
    zIndex: 2,
  },
  iconGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 34,
    zIndex: 1,
  },
  categoryBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  // Content Section
  categoryContent: {
    flex: 1,
    paddingRight: 16,
  },
  categoryName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 28,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  questionStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quizCount: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 6,
  },
  // Action Section
  actionSection: {
    alignItems: 'center',
  },
  chevronContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Decorative Elements
  decorativeCircle1: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -30,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  // Empty State Styles
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  refreshHint: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  refreshText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  // Simple Header Styles (no card container)
  simpleHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
});

export default CategoryScreen;