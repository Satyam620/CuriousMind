import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  leaderboardService,
  LeaderboardEntry,
  GlobalLeaderboardResponse,
} from '../services/leaderboardService';
import { useTheme } from '../contexts/ThemeContext';
import { useFont } from '../contexts/FontContext';

const { width: screenWidth } = Dimensions.get('window');

const LeaderboardScreen = () => {
  const { theme } = useTheme();
  const { getFontStyle } = useFont();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTab, setCurrentTab] = useState<'global'>('global');
  const animatedValues = useState(() =>
    new Array(20).fill(0).map(() => new Animated.Value(0))
  )[0];

  const fetchLeaderboard = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const response: GlobalLeaderboardResponse = await leaderboardService.getGlobalLeaderboard();
      setLeaderboard(response.leaderboard);
      setTotalUsers(response.total_users);

      // Animate items in sequence
      animatedValues.forEach((value, index) => {
        value.setValue(0);
        Animated.timing(value, {
          toValue: 1,
          duration: 600,
          delay: index * 100,
          useNativeDriver: true,
        }).start();
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch leaderboard data');
      console.error('Leaderboard fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard(false);
  };

  const getRankBadgeColors = (rank: number) => {
    if (rank === 1) return ['#FFD700', '#FFA500']; // Gold gradient
    if (rank === 2) return ['#C0C0C0', '#A0A0A0']; // Silver gradient
    if (rank === 3) return ['#CD7F32', '#B8860B']; // Bronze gradient
    return [theme.colors.textSecondary, theme.isDark ? '#4B5563' : '#9CA3AF']; // Gray gradient
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '👑';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  };

  const renderLeaderboardItem = ({ item, index }: { item: LeaderboardEntry, index: number }) => {
    const animatedValue = animatedValues[index] || new Animated.Value(1);
    const rankColors = getRankBadgeColors(item.rank);
    const rankIcon = getRankIcon(item.rank);

    return (
      <Animated.View
        style={[
          styles.animatedContainer,
          {
            opacity: animatedValue,
            transform: [
              {
                translateY: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.leaderboardItem,
            { backgroundColor: theme.colors.surface },
            item.rank <= 3 && styles.topThreeItem,
          ]}
          activeOpacity={0.7}
        >
          {/* Rank Badge */}
          <View style={styles.rankContainer}>
            <LinearGradient
              colors={rankColors}
              style={[styles.rankBadge, item.rank <= 3 && styles.topThreeRankBadge]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {rankIcon ? (
                <Text style={styles.rankIcon}>{rankIcon}</Text>
              ) : (
                <Text style={[styles.rankText, getFontStyle()]}>#{item.rank}</Text>
              )}
            </LinearGradient>
            {item.rank <= 3 && (
              <View style={styles.rankGlow} />
            )}
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            <View style={styles.userNameContainer}>
              <Text style={[styles.displayName, { color: theme.colors.text }, getFontStyle()]} numberOfLines={1}>
                {item.display_name}
              </Text>
              {item.rank <= 3 && <Text style={styles.topPlayerBadge}>⭐</Text>}
            </View>
            <Text style={[styles.username, { color: theme.colors.textSecondary }, getFontStyle()]}>
              @{item.username}
            </Text>
          </View>

          {/* Stats Container */}
          <View style={styles.statsContainer}>
            <View style={[styles.scoreBadge, { backgroundColor: theme.isDark ? '#065F46' : '#D1FAE5' }]}>
              <Text style={[styles.totalScore, { color: theme.isDark ? '#34D399' : '#059669' }, getFontStyle()]}>
                {item.total_score} pts
              </Text>
            </View>
            <Text style={[styles.quizCount, { color: theme.colors.textSecondary }, getFontStyle()]}>
              {item.total_quizzes_completed} quiz{item.total_quizzes_completed !== 1 ? 'es' : ''}
            </Text>
            <View style={[styles.averageBadge, { backgroundColor: theme.isDark ? '#1E3A8A' : '#DBEAFE' }]}>
              <Text style={[styles.averageScore, { color: theme.isDark ? '#60A5FA' : '#2563EB' }, getFontStyle()]}>
                {item.average_score_percentage.toFixed(1)}% avg
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderHeader = () => (
    <LinearGradient
      colors={theme.isDark ? ['#1F2937', '#374151'] : ['#F8FAFC', '#E5E7EB']}
      style={[styles.header, { borderBottomColor: theme.colors.border }]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.headerContent}>
        <View style={styles.titleContainer}>
          <Text style={styles.trophyIcon}>🏆</Text>
          <Text style={[styles.title, { color: theme.colors.text }, getFontStyle()]}>
            Global Leaderboard
          </Text>
        </View>
        <View style={[styles.playerCountBadge, { backgroundColor: theme.isDark ? '#374151' : '#FFFFFF' }]}>
          <Text style={styles.playersIcon}>👥</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }, getFontStyle()]}>
            {totalUsers} active players
          </Text>
        </View>
      </View>
    </LinearGradient>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📊</Text>
      <Text style={[styles.emptyTitle, { color: theme.colors.text }, getFontStyle()]}>No players yet!</Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }, getFontStyle()]}>
        Complete a quiz to appear on the leaderboard
      </Text>
      <View style={[styles.emptyActionHint, { backgroundColor: theme.isDark ? '#374151' : '#F3F4F6' }]}>
        <Text style={[styles.emptyActionText, { color: theme.colors.textSecondary }, getFontStyle()]}>
          🎯 Start your journey to the top!
        </Text>
      </View>
    </View>
  );

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.isDark ? '#60A5FA' : '#3B82F6'} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }, getFontStyle()]}>Loading leaderboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={leaderboard}
        keyExtractor={(item, index) => `${item.username}-${index}`}
        renderItem={({ item, index }) => renderLeaderboardItem({ item, index })}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
      />
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
  },
  listContainer: {
    paddingBottom: 20,
  },
  itemSeparator: {
    height: 8,
  },
  // Header Styles
  header: {
    padding: 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  headerContent: {
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  trophyIcon: {
    fontSize: 28,
    marginRight: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  playerCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  playersIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Animated Container
  animatedContainer: {
    marginHorizontal: 16,
  },
  // Leaderboard Item Styles
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  topThreeItem: {
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  // Rank Badge Styles
  rankContainer: {
    position: 'relative',
    marginRight: 16,
  },
  rankBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  topThreeRankBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  rankGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    zIndex: -1,
  },
  rankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  rankIcon: {
    fontSize: 20,
  },
  // User Info Styles
  userInfo: {
    flex: 1,
    marginRight: 16,
  },
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  displayName: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 6,
  },
  topPlayerBadge: {
    fontSize: 12,
  },
  username: {
    fontSize: 13,
    fontWeight: '400',
  },
  // Stats Container Styles
  statsContainer: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  scoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
    minWidth: 70,
    alignItems: 'center',
  },
  totalScore: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  quizCount: {
    fontSize: 11,
    marginBottom: 4,
    textAlign: 'right',
  },
  averageBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  averageScore: {
    fontSize: 11,
    fontWeight: '500',
  },
  // Empty State Styles
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  emptyActionHint: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  emptyActionText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default LeaderboardScreen;