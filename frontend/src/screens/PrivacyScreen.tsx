import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../contexts/ThemeContext';
import { useFont } from '../contexts/FontContext';
import { RootStackParamList } from '../../App';
import { Ionicons } from '@expo/vector-icons';

// Import web-specific component
import PrivacyScreenWeb from './PrivacyScreen.web';

type PrivacyScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Privacy'>;

interface Props {
  navigation: PrivacyScreenNavigationProp;
}

const PrivacyScreen: React.FC<Props> = ({ navigation }) => {
  // Use web-specific component for web platform
  if (Platform.OS === 'web') {
    return <PrivacyScreenWeb navigation={navigation} />;
  }

  const { theme } = useTheme();
  const { getFontStyle } = useFont();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary, ...getFontStyle() }]}>
            Your privacy and data security settings
          </Text>
        </View>

        {/* Data Protection Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text, ...getFontStyle() }]}>Data Protection</Text>

          <View style={[styles.settingCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.privacyOptions}>
              <View style={styles.privacyItem}>
                <View style={styles.privacyInfo}>
                  <Text style={[styles.privacyTitle, { color: theme.colors.text, ...getFontStyle() }]}>
                    Local Data Storage
                  </Text>
                  <Text style={[styles.privacyDescription, { color: theme.colors.textSecondary, ...getFontStyle() }]}>
                    Theme and font preferences are stored locally on your device
                  </Text>
                </View>
                <View style={[styles.privacyBadge, { backgroundColor: theme.isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)' }]}>
                  <Ionicons name="checkmark-circle" size={16} color={theme.isDark ? '#22C55E' : '#10B981'} />
                  <Text style={[styles.privacyBadgeText, { color: theme.isDark ? '#22C55E' : '#10B981', ...getFontStyle() }]}>
                    Secure
                  </Text>
                </View>
              </View>

              <View style={styles.privacyItem}>
                <View style={styles.privacyInfo}>
                  <Text style={[styles.privacyTitle, { color: theme.colors.text, ...getFontStyle() }]}>
                    Quiz History
                  </Text>
                  <Text style={[styles.privacyDescription, { color: theme.colors.textSecondary, ...getFontStyle() }]}>
                    Quiz scores and progress are encrypted and stored securely
                  </Text>
                </View>
                <View style={[styles.privacyBadge, { backgroundColor: theme.isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)' }]}>
                  <Ionicons name="lock-closed" size={16} color={theme.isDark ? '#22C55E' : '#10B981'} />
                  <Text style={[styles.privacyBadgeText, { color: theme.isDark ? '#22C55E' : '#10B981', ...getFontStyle() }]}>
                    Encrypted
                  </Text>
                </View>
              </View>

              <View style={styles.privacyItem}>
                <View style={styles.privacyInfo}>
                  <Text style={[styles.privacyTitle, { color: theme.colors.text, ...getFontStyle() }]}>
                    No Tracking
                  </Text>
                  <Text style={[styles.privacyDescription, { color: theme.colors.textSecondary, ...getFontStyle() }]}>
                    We don't track your behavior or collect personal information
                  </Text>
                </View>
                <View style={[styles.privacyBadge, { backgroundColor: theme.isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)' }]}>
                  <Ionicons name="eye-off" size={16} color={theme.isDark ? '#22C55E' : '#10B981'} />
                  <Text style={[styles.privacyBadgeText, { color: theme.isDark ? '#22C55E' : '#10B981', ...getFontStyle() }]}>
                    Private
                  </Text>
                </View>
              </View>

              <View style={styles.privacyItem}>
                <View style={styles.privacyInfo}>
                  <Text style={[styles.privacyTitle, { color: theme.colors.text, ...getFontStyle() }]}>
                    Minimal Data Collection
                  </Text>
                  <Text style={[styles.privacyDescription, { color: theme.colors.textSecondary, ...getFontStyle() }]}>
                    We only collect essential data necessary for app functionality
                  </Text>
                </View>
                <View style={[styles.privacyBadge, { backgroundColor: theme.isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(96, 165, 250, 0.2)' }]}>
                  <Ionicons name="shield-outline" size={16} color={theme.isDark ? '#60A5FA' : '#3B82F6'} />
                  <Text style={[styles.privacyBadgeText, { color: theme.isDark ? '#60A5FA' : '#3B82F6', ...getFontStyle() }]}>
                    Essential Only
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Security Features Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text, ...getFontStyle() }]}>Security Features</Text>

          <View style={[styles.settingCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: theme.isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)' }]}>
                  <Ionicons name="shield-checkmark" size={20} color={theme.isDark ? '#22C55E' : '#10B981'} />
                </View>
                <View style={styles.featureContent}>
                  <Text style={[styles.featureTitle, { color: theme.colors.text, ...getFontStyle() }]}>
                    JWT Authentication
                  </Text>
                  <Text style={[styles.featureDescription, { color: theme.colors.textSecondary, ...getFontStyle() }]}>
                    Secure token-based authentication with refresh tokens
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: theme.isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)' }]}>
                  <Ionicons name="server" size={20} color={theme.isDark ? '#22C55E' : '#10B981'} />
                </View>
                <View style={styles.featureContent}>
                  <Text style={[styles.featureTitle, { color: theme.colors.text, ...getFontStyle() }]}>
                    Secure API Communication
                  </Text>
                  <Text style={[styles.featureDescription, { color: theme.colors.textSecondary, ...getFontStyle() }]}>
                    HTTPS/TLS encryption for all data transmission
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: theme.isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)' }]}>
                  <Ionicons name="key" size={20} color={theme.isDark ? '#22C55E' : '#10B981'} />
                </View>
                <View style={styles.featureContent}>
                  <Text style={[styles.featureTitle, { color: theme.colors.text, ...getFontStyle() }]}>
                    Password Protection
                  </Text>
                  <Text style={[styles.featureDescription, { color: theme.colors.textSecondary, ...getFontStyle() }]}>
                    Passwords are hashed and securely stored
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Data Collection Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text, ...getFontStyle() }]}>What We Collect</Text>

          <View style={[styles.settingCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.dataList}>
              <Text style={[styles.dataDescription, { color: theme.colors.textSecondary, ...getFontStyle() }]}>
                We only collect essential data necessary for the quiz functionality:
              </Text>

              <View style={styles.dataItem}>
                <Ionicons name="person-outline" size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.dataText, { color: theme.colors.text, ...getFontStyle() }]}>
                  Username and email for account creation
                </Text>
              </View>

              <View style={styles.dataItem}>
                <Ionicons name="trophy-outline" size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.dataText, { color: theme.colors.text, ...getFontStyle() }]}>
                  Quiz scores and completion times
                </Text>
              </View>

              <View style={styles.dataItem}>
                <Ionicons name="settings-outline" size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.dataText, { color: theme.colors.text, ...getFontStyle() }]}>
                  App preferences (theme, font)
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  section: {
    marginHorizontal: 20,
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  settingCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  // Privacy Options
  privacyOptions: {
    gap: 20,
  },
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  privacyInfo: {
    flex: 1,
    marginRight: 12,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  privacyDescription: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  privacyBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Security Features
  featureList: {
    gap: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  // Data Collection
  dataList: {
    gap: 16,
  },
  dataDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  dataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dataText: {
    fontSize: 14,
    flex: 1,
  },
});

export default PrivacyScreen;