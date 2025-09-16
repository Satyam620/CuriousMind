import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useFont } from '../contexts/FontContext';
import { leaderboardService, UserProfileResponse } from '../services/leaderboardService';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../App';
import CustomAlert from '../components/CustomAlert';
import { showAlert, setWebAlertHandler } from '../utils/alertUtils';

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const { getFontStyle } = useFont();
  const [profileData, setProfileData] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Alert state for web
  const [alertState, setAlertState] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons: Array<{
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }>;
  }>({
    visible: false,
    title: "",
    message: "",
    buttons: [],
  });

  // Set up web alert handler
  React.useEffect(() => {
    if (Platform.OS === 'web') {
      setWebAlertHandler((alert) => {
        setAlertState(alert);
      });
    }
  }, []);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);


  const fetchProfileData = async (showLoader = true) => {
    if (!user?.id) return;
    
    try {
      if (showLoader) setLoading(true);
      const data = await leaderboardService.getUserProfile(user.id);
      setProfileData(data);
    } catch (error) {
      console.error('Profile fetch error:', error);
      // Don't show alert for profile fetch errors as user might not have taken quizzes yet
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfileData(false);
  };

  const handleLogout = () => {
    showAlert({
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    });
  };

  useEffect(() => {
    fetchProfileData();
  }, [user?.id]);

  // Refresh profile data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        fetchProfileData(false); // Don't show loading spinner on focus refresh
      }
    }, [user?.id])
  );

  const renderStatCard = (title: string, value: string | number, icon: keyof typeof Ionicons.glyphMap, color: string) => (
    <View style={[styles.statCard, { borderLeftColor: color, backgroundColor: theme.colors.surface }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={[styles.statValue, { color: theme.isDark ? '#FFFFFF' : theme.colors.text }, getFontStyle()]}>{value}</Text>
        <Text style={[styles.statTitle, { color: theme.isDark ? '#CCCCCC' : theme.colors.textSecondary }, getFontStyle()]}>{title}</Text>
      </View>
    </View>
  );

  const formatTime = (seconds: number | string | null | undefined): string => {
    // Handle null or undefined values
    if (seconds === null || seconds === undefined) {
      return '0:00';
    }

    // Handle various input types and invalid values
    const numSeconds = typeof seconds === 'string' ? parseInt(seconds, 10) : Number(seconds);

    // Check if the conversion resulted in a valid number (allow 0 as valid)
    if (isNaN(numSeconds) || numSeconds < 0) {
      return '0:00';
    }

    const mins = Math.floor(numSeconds / 60);
    const secs = numSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderHelpModal = () => (
    <Modal
      visible={showHelpModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.modalHeader, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.modalTitle, { color: theme.colors.text }, getFontStyle()]}>Help & Support</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowHelpModal(false)}
          >
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.helpSection, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="help-circle" size={24} color="#3B82F6" />
            <Text style={[styles.helpTitle, { color: theme.colors.text }, getFontStyle()]}>How to Use CuriousMind</Text>
            <Text style={[styles.helpText, { color: theme.colors.textSecondary }, getFontStyle()]}>
              • Browse quiz categories and select your favorite topics{'\n'}
              • Choose difficulty level and number of questions{'\n'}
              • Complete quizzes to earn points and climb the leaderboard{'\n'}
              • Generate custom quizzes using AI for any topic{'\n'}
              • Track your progress in the Profile section
            </Text>
          </View>

          <View style={[styles.helpSection, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="bulb" size={24} color="#F59E0B" />
            <Text style={[styles.helpTitle, { color: theme.colors.text }, getFontStyle()]}>Tips for Better Scores</Text>
            <Text style={[styles.helpText, { color: theme.colors.textSecondary }, getFontStyle()]}>
              • Take your time to read questions carefully{'\n'}
              • Start with easier categories to build confidence{'\n'}
              • Review correct answers after each quiz{'\n'}
              • Practice regularly to improve your knowledge{'\n'}
              • Use AI-generated quizzes to explore new topics
            </Text>
          </View>

          <View style={[styles.helpSection, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="chatbubbles" size={24} color="#10B981" />
            <Text style={[styles.helpTitle, { color: theme.colors.text }, getFontStyle()]}>Need More Help?</Text>
            <Text style={[styles.helpText, { color: theme.colors.textSecondary }, getFontStyle()]}>
              If you're experiencing issues or have questions about the app, here are some ways to get help:
              {'\n\n'}
              • Check the About section for app information{'\n'}
              • Restart the app if you encounter any glitches{'\n'}
              • Make sure you have a stable internet connection{'\n'}
              • Update the app to the latest version for best performance
            </Text>
          </View>

          <View style={[styles.helpSection, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="star" size={24} color="#8B5CF6" />
            <Text style={[styles.helpTitle, { color: theme.colors.text }, getFontStyle()]}>Feedback</Text>
            <Text style={[styles.helpText, { color: theme.colors.textSecondary }, getFontStyle()]}>
              We'd love to hear from you! Your feedback helps us improve CuriousMind. Share your thoughts, suggestions, or report any issues you encounter while using the app.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderAboutModal = () => (
    <Modal
      visible={showAboutModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.modalHeader, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.modalTitle, { color: theme.colors.text }, getFontStyle()]}>About CuriousMind</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowAboutModal(false)}
          >
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.aboutSection, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.appIconContainer}>
              <Text style={styles.appIcon}>🧠</Text>
            </View>
            <Text style={[styles.appName, { color: theme.colors.text }, getFontStyle()]}>CuriousMind</Text>
            <Text style={[styles.appVersion, { color: theme.colors.textSecondary }, getFontStyle()]}>Version 1.0.0</Text>
          </View>

          <View style={[styles.aboutSection, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="information-circle" size={24} color="#3B82F6" />
            <Text style={[styles.aboutTitle, { color: theme.colors.text }, getFontStyle()]}>About the App</Text>
            <Text style={[styles.aboutText, { color: theme.colors.textSecondary }, getFontStyle()]}>
              CuriousMind is an engaging quiz application designed to test and expand your knowledge across various topics. From science and history to entertainment and sports, challenge yourself with thousands of questions and compete with others on the global leaderboard.
            </Text>
          </View>

          <View style={[styles.aboutSection, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="sparkles" size={24} color="#F59E0B" />
            <Text style={[styles.aboutTitle, { color: theme.colors.text }, getFontStyle()]}>Key Features</Text>
            <Text style={[styles.aboutText, { color: theme.colors.textSecondary }, getFontStyle()]}>
              • Multiple quiz categories and difficulty levels{'\n'}
              • AI-powered custom quiz generation{'\n'}
              • Global leaderboard and ranking system{'\n'}
              • Detailed performance statistics{'\n'}
              • Dark and light theme support{'\n'}
              • Cross-platform compatibility (Web, iOS, Android)
            </Text>
          </View>

          <View style={[styles.aboutSection, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="code-slash" size={24} color="#8B5CF6" />
            <Text style={[styles.aboutTitle, { color: theme.colors.text }, getFontStyle()]}>Technology Stack</Text>
            <Text style={[styles.aboutText, { color: theme.colors.textSecondary }, getFontStyle()]}>
              Built with modern technologies to deliver a smooth, responsive experience:{'\n'}
              • React Native & Expo for cross-platform development{'\n'}
              • TypeScript for type-safe code{'\n'}
              • Django REST Framework for backend API{'\n'}
              • Gemini AI for intelligent quiz generation{'\n'}
              • SQLite/PostgreSQL for data storage
            </Text>
          </View>

          <View style={[styles.aboutSection, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="heart" size={24} color="#EF4444" />
            <Text style={[styles.aboutTitle, { color: theme.colors.text }, getFontStyle()]}>Acknowledgments</Text>
            <Text style={[styles.aboutText, { color: theme.colors.textSecondary }, getFontStyle()]}>
              Special thanks to:{'\n'}
              • Open Trivia Database for quiz questions{'\n'}
              • The React Native and Expo communities{'\n'}
              • All beta testers and early users{'\n'}
              • Contributors to open source libraries used in this project
            </Text>
          </View>

          <View style={[styles.aboutSection, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.copyrightText, { color: theme.colors.textSecondary }, getFontStyle()]}>
              © 2024 CuriousMind. All rights reserved.{'\n'}
              Made with ❤️ for knowledge enthusiasts everywhere.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderQuizHistoryItem = (attempt: any, index: number) => {
    const getPerformanceColor = (percentage: number) => {
      if (percentage >= 80) return '#10B981';
      if (percentage >= 60) return '#F59E0B';
      return '#EF4444';
    };

    const getPerformanceIcon = (percentage: number) => {
      if (percentage >= 80) return 'trophy';
      if (percentage >= 60) return 'ribbon';
      return 'trending-down';
    };

    return (
      <TouchableOpacity
        key={index}
        style={[styles.historyCard, { backgroundColor: theme.colors.surface }]}
        activeOpacity={0.7}
        onPress={() => {
          // Future: Navigate to detailed quiz result view
        }}
      >
        <View style={styles.historyHeader}>
          <View style={styles.historyTitleContainer}>
            <Ionicons
              name={getPerformanceIcon(attempt.percentage)}
              size={20}
              color={getPerformanceColor(attempt.percentage)}
            />
            <View style={styles.historyTitleInfo}>
              <Text style={[styles.historyTitle, { color: theme.colors.text }, getFontStyle()]} numberOfLines={1}>
                {(() => {
                  // Clean up the quiz title by removing UUID suffixes
                  let cleanTitle = attempt.quiz_title;

                  // Remove UUID patterns like " - 57092962" or " - a2cbe527"
                  cleanTitle = cleanTitle?.replace(/ - [a-f0-9]{8}$/, '') || cleanTitle;

                  // Add AI Generated label if applicable
                  return attempt.is_ai_generated
                    ? `${cleanTitle} (AI Generated)`
                    : cleanTitle;
                })()}
              </Text>
              <Text style={[styles.historyDate, { color: theme.colors.textSecondary }, getFontStyle()]}>
                {new Date(attempt.completed_at).toLocaleDateString()} • {formatTime(attempt.time_taken_seconds || attempt.time_taken)}
              </Text>
            </View>
          </View>
          <View style={[styles.performanceBadge, { backgroundColor: getPerformanceColor(attempt.percentage) + '20' }]}>
            <Text style={[styles.performanceText, { color: getPerformanceColor(attempt.percentage) }, getFontStyle()]}>
              {attempt.percentage.toFixed(0)}%
            </Text>
          </View>
        </View>

        <View style={styles.historyStats}>
          <View style={styles.historyStat}>
            <Text style={[styles.historyStatValue, { color: theme.colors.text }, getFontStyle()]}>
              {attempt.score}/{attempt.total_points}
            </Text>
            <Text style={[styles.historyStatLabel, { color: theme.colors.textSecondary }, getFontStyle()]}>Score</Text>
          </View>
          <View style={[styles.historyDivider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.historyStat}>
            <Text style={[styles.historyStatValue, { color: getPerformanceColor(attempt.percentage) }, getFontStyle()]}>
              {attempt.percentage >= 80 ? 'Excellent' : attempt.percentage >= 60 ? 'Good' : 'Needs Practice'}
            </Text>
            <Text style={[styles.historyStatLabel, { color: theme.colors.textSecondary }, getFontStyle()]}>Performance</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={[styles.loadingText, getFontStyle()]}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
          <View style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              <Text style={[styles.avatarText, getFontStyle()]}>
                {user?.first_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: theme.colors.text }, getFontStyle()]}>
                {user?.first_name && user?.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : user?.first_name || user?.username || 'User'}
              </Text>
              <Text style={[styles.userEmail, { color: theme.colors.textSecondary }, getFontStyle()]}>{user?.email}</Text>
              {profileData && (
                <View style={styles.rankContainer}>
                  <Ionicons name="trophy" size={16} color="#F59E0B" />
                  <Text style={[styles.rankText, getFontStyle()]}>Rank #{profileData.profile.rank}</Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* Statistics */}
        {profileData ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.isDark ? '#FFFFFF' : theme.colors.text }, getFontStyle()]}>My Statistics</Text>
            <View style={styles.statsGrid}>
              {renderStatCard(
                'Total Score',
                profileData.profile.total_score,
                'trophy',
                '#10B981'
              )}
              {renderStatCard(
                'Quizzes Completed',
                profileData.profile.total_quizzes_completed,
                'checkmark-circle',
                '#3B82F6'
              )}
              {renderStatCard(
                'Average Score',
                `${profileData.profile.average_score_percentage.toFixed(1)}%`,
                'analytics',
                '#8B5CF6'
              )}
              {renderStatCard(
                'Global Rank',
                `#${profileData.profile.rank}`,
                'podium',
                '#F59E0B'
              )}
            </View>
          </View>
        ) : (
          <View style={styles.noDataContainer}>
            <Ionicons name="bar-chart-outline" size={48} color={theme.colors.textSecondary} />
            <Text style={[styles.noDataTitle, { color: theme.colors.text }, getFontStyle()]}>No Statistics Yet</Text>
            <Text style={[styles.noDataSubtitle, { color: theme.colors.textSecondary }, getFontStyle()]}>
              Complete a quiz to see your statistics and rank
            </Text>
          </View>
        )}

        {/* Quiz History */}
        {profileData && profileData.recent_attempts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.isDark ? '#FFFFFF' : theme.colors.text }, getFontStyle()]}>Quiz History</Text>
              {profileData.recent_attempts.length > 3 && (
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={() => setShowAllHistory(!showAllHistory)}
                >
                  <Text style={[styles.viewAllText, { color: '#3B82F6' }, getFontStyle()]}>
                    {showAllHistory ? 'Show Less' : 'View All'}
                  </Text>
                  <Ionicons
                    name={showAllHistory ? "chevron-up" : "chevron-forward"}
                    size={16}
                    color="#3B82F6"
                  />
                </TouchableOpacity>
              )}
            </View>
            {(showAllHistory ? profileData.recent_attempts : profileData.recent_attempts.slice(0, 3)).map(renderQuizHistoryItem)}
          </View>
        )}



        {/* Account Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.isDark ? '#FFFFFF' : theme.colors.text }, getFontStyle()]}>Account</Text>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.surface }]}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={20} color={theme.colors.textSecondary} />
            <Text style={[styles.actionButtonText, { color: theme.colors.text }, getFontStyle()]}>Settings</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.surface }]}
            onPress={() => setShowHelpModal(true)}
          >
            <Ionicons name="help-circle-outline" size={20} color={theme.colors.textSecondary} />
            <Text style={[styles.actionButtonText, { color: theme.colors.text }, getFontStyle()]}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.surface }]}
            onPress={() => setShowAboutModal(true)}
          >
            <Ionicons name="information-circle-outline" size={20} color={theme.colors.textSecondary} />
            <Text style={[styles.actionButtonText, { color: theme.colors.text }, getFontStyle()]}>About</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Help Modal */}
      {renderHelpModal()}

      {/* About Modal */}
      {renderAboutModal()}

      {/* Custom Alert Modal for Web */}
      {Platform.OS === 'web' && (
        <CustomAlert
          visible={alertState.visible}
          title={alertState.title}
          message={alertState.message}
          buttons={alertState.buttons}
          onDismiss={() => setAlertState(prev => ({ ...prev, visible: false }))}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  scrollContainer: {
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 4,
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F59E0B',
    marginLeft: 4,
  },
  logoutButton: {
    padding: 8,
  },
  section: {
    margin: 20,
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsGrid: {
    gap: 12,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 14,
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 40,
  },
  noDataTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  noDataSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  attemptCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  attemptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  attemptTitle: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  attemptDate: {
    fontSize: 12,
  },
  attemptStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  attemptStat: {
    alignItems: 'center',
  },
  attemptScore: {
    fontSize: 16,
    fontWeight: '600',
  },
  attemptPercentage: {
    fontSize: 16,
    fontWeight: '600',
  },
  attemptTime: {
    fontSize: 16,
    fontWeight: '600',
  },
  attemptLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionButtonText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  themeContainer: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  themeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  themeTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  themeOptions: {
    gap: 8,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  themeOptionText: {
    fontSize: 16,
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  historyCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  historyTitleInfo: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 12,
  },
  performanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  performanceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  historyStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyStat: {
    alignItems: 'center',
  },
  historyStatValue: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  historyStatLabel: {
    fontSize: 12,
  },
  historyDivider: {
    width: 1,
    height: 24,
    marginHorizontal: 16,
  },
  // Modal Styles
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
  // Help Modal Styles
  helpSection: {
    marginBottom: 24,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 12,
  },
  helpText: {
    fontSize: 15,
    lineHeight: 22,
  },
  // About Modal Styles
  aboutSection: {
    marginBottom: 24,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
  },
  appIconContainer: {
    marginBottom: 16,
  },
  appIcon: {
    fontSize: 64,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 16,
    marginBottom: 16,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  aboutText: {
    fontSize: 15,
    lineHeight: 22,
    alignSelf: 'flex-start',
  },
  copyrightText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ProfileScreen;