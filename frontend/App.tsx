import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { FontProvider, useFont } from './src/contexts/FontContext';
import { ActivityIndicator, View, StyleSheet, Dimensions, Text, TouchableOpacity, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

// Global CSS injection function for web to remove all outlines
const injectGlobalStyles = () => {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const existingStyle = document.getElementById('react-native-web-outline-fix');
    if (!existingStyle) {
      const style = document.createElement('style');
      style.id = 'react-native-web-outline-fix';
      style.textContent = `
        * {
          outline: none !important;
        }
        *:focus {
          outline: none !important;
        }
        *:active {
          outline: none !important;
        }
        input, textarea, button, div, span, select, option {
          outline: none !important;
        }
        input:focus, textarea:focus, button:focus, div:focus, span:focus, select:focus, option:focus {
          outline: none !important;
        }
        /* React Native Web specific selectors */
        [role="button"], [role="textbox"], [role="combobox"], [role="listbox"] {
          outline: none !important;
        }
        [role="button"]:focus, [role="textbox"]:focus, [role="combobox"]:focus, [role="listbox"]:focus {
          outline: none !important;
        }
        /* Picker dropdown specific fixes */
        select {
          outline: none !important;
          border: none !important;
          background: transparent !important;
        }
        select:focus {
          outline: none !important;
          border: none !important;
          box-shadow: none !important;
        }
        /* Fix white bars in dropdown */
        select option {
          background-color: inherit !important;
          color: inherit !important;
          padding: 0 !important;
          margin: 0 !important;
          text-align: center !important;
        }
        /* Remove default dropdown styling */
        select::-webkit-scrollbar {
          display: none;
        }
        select:-webkit-autofill,
        select:-webkit-autofill:hover,
        select:-webkit-autofill:focus {
          -webkit-box-shadow: none !important;
          box-shadow: none !important;
        }
        /* Additional picker styling */
        .picker-container select {
          background: transparent !important;
          border: none !important;
          outline: none !important;
        }
      `;
      document.head.appendChild(style);
    }
  }
};

// Auth Screens
import IntroScreen from './src/screens/IntroScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';

// App Screens
import CategoryScreen from './src/screens/CategoryScreen';
import QuizGenerateScreen from './src/screens/QuizGenerateScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import QuizListScreen from './src/screens/QuizListScreen';
import QuizConfigScreen from './src/screens/QuizConfigScreen';
import QuizScreen from './src/screens/QuizScreen';
import ResultScreen from './src/screens/ResultScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import PrivacyScreen from './src/screens/PrivacyScreen';
import { AlertProvider } from './src/components/AlertProvider';

export type RootStackParamList = {
  // Intro screen
  Intro: undefined;
  // Auth screens
  Login: undefined;
  Signup: undefined;
  // Main app
  MainTabs: undefined;
  // Modal screens
  QuizList: { category?: string };
  QuizConfig: { category: string };
  Quiz: {
    quizId?: number;
    category?: string;
    difficulty?: string;
    questionCount?: number;
    customQuiz?: any;
  };
  Result: {
    score: number;
    totalPoints: number;
    percentage: number;
    quiz?: any;
    answers?: any[];
  };
  Settings: undefined;
  Privacy: undefined;
};

export type TabParamList = {
  Category: undefined;
  QuizGenerate: undefined;
  Leaderboard: undefined;
  Profile: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function AuthNavigator() {
  const { theme } = useTheme();
  const { getFontStyle } = useFont();

  return (
    <Stack.Navigator
      initialRouteName="Intro"
      screenOptions={{
        headerStyle: { backgroundColor: theme.isDark ? theme.colors.surface : '#007AFF' },
        headerTintColor: theme.isDark ? theme.colors.text : 'white',
        headerTitleStyle: { fontWeight: 'bold', ...getFontStyle() }
      }}
    >
      <Stack.Screen
        name="Intro"
        component={IntroScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: 'Sign In' }}
      />
      <Stack.Screen
        name="Signup"
        component={SignupScreen}
        options={{ title: 'Create Account' }}
      />
    </Stack.Navigator>
  );
}

function useOrientation() {
  const [orientation, setOrientation] = useState('portrait');

  useEffect(() => {
    const updateOrientation = () => {
      const { width, height } = Dimensions.get('window');
      setOrientation(width > height ? 'landscape' : 'portrait');
    };

    const subscription = Dimensions.addEventListener('change', updateOrientation);
    updateOrientation();

    return () => subscription?.remove();
  }, []);

  return orientation;
}

function LandscapeNavButton({ iconName, focusedIconName, label, isActive, onPress, theme, getFontStyle }: {
  iconName: string;
  focusedIconName: string;
  label: string;
  isActive: boolean;
  onPress: () => void;
  theme: any;
  getFontStyle: () => { fontFamily?: string };
}) {
  return (
    <TouchableOpacity
      style={landscapeNavStyles.navButton}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[
        landscapeNavStyles.iconContainer,
        isActive && {
          backgroundColor: theme.isDark ? '#60A5FA' : '#3B82F6',
        }
      ]}>
        <Ionicons
          name={isActive ? focusedIconName as any : iconName as any}
          size={20}
          color={isActive ? 'white' : theme.colors.textSecondary}
        />
      </View>
      <Text style={[
        landscapeNavStyles.navLabel,
        {
          color: isActive ? (theme.isDark ? '#60A5FA' : '#3B82F6') : theme.colors.textSecondary,
          fontWeight: isActive ? '600' : '400',
          ...getFontStyle()
        }
      ]}>
        {label}
      </Text>
      {isActive && (
        <View style={[
          landscapeNavStyles.activeIndicator,
          { backgroundColor: theme.isDark ? '#60A5FA' : '#3B82F6' }
        ]} />
      )}
    </TouchableOpacity>
  );
}

function CustomTabBar({ state, descriptors, navigation, theme, getFontStyle }: any) {
  const getTabIcon = (routeName: string, focused: boolean) => {
    let iconName: keyof typeof Ionicons.glyphMap;

    switch (routeName) {
      case 'Category':
        iconName = focused ? 'grid' : 'grid-outline';
        break;
      case 'QuizGenerate':
        iconName = focused ? 'create' : 'create-outline';
        break;
      case 'Leaderboard':
        iconName = focused ? 'trophy' : 'trophy-outline';
        break;
      case 'Profile':
        iconName = focused ? 'person' : 'person-outline';
        break;
      default:
        iconName = 'help-circle-outline';
    }

    return iconName;
  };

  return (
    <View style={[
      tabBarStyles.container,
      {
        backgroundColor: theme.colors.surface,
        borderTopColor: theme.colors.border,
      }
    ]}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel !== undefined ? options.tabBarLabel : options.title !== undefined ? options.title : route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            style={tabBarStyles.tabButton}
            activeOpacity={0.7}
          >
            <View style={tabBarStyles.tabContent}>

              {/* Icon */}
              <View style={[
                tabBarStyles.iconContainer,
                isFocused && {
                  backgroundColor: theme.isDark ? '#60A5FA' : '#3B82F6',
                }
              ]}>
                <Ionicons
                  name={getTabIcon(route.name, isFocused)}
                  size={22}
                  color={isFocused ? 'white' : theme.colors.textSecondary}
                />
              </View>

              {/* Label */}
              <Text style={[
                tabBarStyles.tabLabel,
                {
                  color: isFocused ? (theme.isDark ? '#60A5FA' : '#3B82F6') : theme.colors.textSecondary,
                  fontWeight: isFocused ? '600' : '400',
                  ...getFontStyle(),
                }
              ]}>
                {label}
              </Text>

              {/* Active indicator dot */}
              {isFocused && (
                <View style={[
                  tabBarStyles.activeIndicator,
                  { backgroundColor: theme.isDark ? '#60A5FA' : '#3B82F6' }
                ]} />
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function TabNavigatorWithLandscape() {
  const { theme } = useTheme();
  const { getFontStyle } = useFont();
  const orientation = useOrientation();

  return (
    <Tab.Navigator
      tabBar={orientation === 'landscape' ? undefined : (props) => (
        <CustomTabBar {...props} theme={theme} getFontStyle={getFontStyle} />
      )}
      screenOptions={({ route }) => ({
        tabBarStyle: orientation === 'landscape' ? { display: 'none' } : undefined,
        headerStyle: { backgroundColor: theme.isDark ? theme.colors.surface : '#3B82F6' },
        headerTintColor: theme.isDark ? theme.colors.text : 'white',
        headerTitleStyle: { fontWeight: 'bold', ...getFontStyle() },
      })}
    >
      <Tab.Screen
        name="Category"
        component={CategoryScreen}
        options={{ title: 'Categories' }}
      />
      <Tab.Screen
        name="QuizGenerate"
        component={QuizGenerateScreen}
        options={{ title: 'Generate' }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{ title: 'Leaderboard' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

function TabNavigator() {
  const { theme } = useTheme();
  const orientation = useOrientation();

  if (orientation === 'landscape') {
    return (
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <LandscapeNav />
        <View style={{ flex: 1 }}>
          <TabNavigatorWithLandscape />
        </View>
      </View>
    );
  }

  return <TabNavigatorWithLandscape />;
}

function LandscapeNav() {
  const { theme } = useTheme();
  const { getFontStyle } = useFont();
  const navigation = useNavigation<NavigationProp<TabParamList>>();
  const [activeTab, setActiveTab] = useState('Category');

  const handleTabPress = (tabName: keyof TabParamList) => {
    setActiveTab(tabName);
    navigation.navigate(tabName);
  };

  return (
    <LinearGradient
      colors={theme.isDark ? ['#1F2937', '#374151'] : ['#F8FAFC', '#E5E7EB']}
      style={landscapeNavStyles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <LandscapeNavButton
        iconName="grid-outline"
        focusedIconName="grid"
        label="Categories"
        isActive={activeTab === 'Category'}
        onPress={() => handleTabPress('Category')}
        theme={theme}
        getFontStyle={getFontStyle}
      />
      <LandscapeNavButton
        iconName="create-outline"
        focusedIconName="create"
        label="Generate"
        isActive={activeTab === 'QuizGenerate'}
        onPress={() => handleTabPress('QuizGenerate')}
        theme={theme}
        getFontStyle={getFontStyle}
      />
      <LandscapeNavButton
        iconName="trophy-outline"
        focusedIconName="trophy"
        label="Leaderboard"
        isActive={activeTab === 'Leaderboard'}
        onPress={() => handleTabPress('Leaderboard')}
        theme={theme}
        getFontStyle={getFontStyle}
      />
      <LandscapeNavButton
        iconName="person-outline"
        focusedIconName="person"
        label="Profile"
        isActive={activeTab === 'Profile'}
        onPress={() => handleTabPress('Profile')}
        theme={theme}
        getFontStyle={getFontStyle}
      />
    </LinearGradient>
  );
}


function AppNavigator() {
  const { theme } = useTheme();
  const { getFontStyle } = useFont();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.isDark ? theme.colors.surface : '#3B82F6' },
        headerTintColor: theme.isDark ? theme.colors.text : 'white',
        headerTitleStyle: { fontWeight: 'bold', ...getFontStyle() },
        // Web-specific scrolling options
        ...(Platform.OS === 'web' && {
          contentStyle: {
            backgroundColor: 'transparent',
          },
        }),
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="QuizList"
        component={QuizListScreen}
        options={{ title: 'Available Quizzes' }}
      />
      <Stack.Screen
        name="QuizConfig"
        component={QuizConfigScreen}
        options={({ route }) => {
          const category = route.params?.category || 'Quiz';

          // Use the same getCategoryColor logic as in ThemeContext
          const getCategoryColorForHeader = (categoryName: string): string => {
            // Special case for art category to match our recent change
            if (categoryName.toLowerCase().includes('art')) {
              return '#E91E63';
            }

            const colors = [
              '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
              '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
              '#8395A7', '#3C6382', '#40407A', '#706FD3', '#F8B500',
            ];

            let hash = 0;
            for (let i = 0; i < categoryName.length; i++) {
              hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
            }
            return colors[Math.abs(hash) % colors.length];
          };

          const categoryColor = getCategoryColorForHeader(category);

          return {
            title: 'Quiz Configuration',
            headerStyle: {
              backgroundColor: categoryColor,
            },
            headerTintColor: 'white',
            headerTitleStyle: {
              fontWeight: 'bold'
            },
            // Enable proper scrolling for web
            ...(Platform.OS === 'web' && {
              contentStyle: {
                backgroundColor: 'transparent',
                overflow: 'visible',
              },
            }),
          };
        }}
      />
      <Stack.Screen
        name="Quiz"
        component={QuizScreen}
        options={{ title: 'Quiz' }}
      />
      <Stack.Screen
        name="Result"
        component={ResultScreen}
        options={{ title: 'Quiz Result' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <Stack.Screen
        name="Privacy"
        component={PrivacyScreen}
        options={{ title: 'Privacy & Security' }}
      />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return isAuthenticated ? <AppNavigator /> : <AuthNavigator />;
}

export default function App() {
  // Inject global styles to remove outlines on web
  useEffect(() => {
    injectGlobalStyles();
  }, []);

  return (
    <FontProvider>
      <ThemeProvider>
        <AuthProvider>
          <AlertProvider>
            <ThemedApp />
          </AlertProvider>
        </AuthProvider>
      </ThemeProvider>
    </FontProvider>
  );
}

function ThemedApp() {
  const { theme } = useTheme();

  return (
    <NavigationContainer>
      <StatusBar
        style={theme.isDark ? "light" : "light"}
        backgroundColor={theme.isDark ? theme.colors.surface : "#3B82F6"}
        translucent={false}
      />
      <RootNavigator />
    </NavigationContainer>
  );
}

const tabBarStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 85 : 65,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    borderTopWidth: 1,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
    width: '100%',
  },
  activeBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  activeIndicator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginTop: 2,
  },
});

const landscapeNavStyles = StyleSheet.create({
  container: {
    width: 80,
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.1)',
    paddingVertical: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navButton: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    marginVertical: 4,
    width: 64,
    position: 'relative',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  navLabel: {
    fontSize: 9,
    textAlign: 'center',
    marginBottom: 2,
  },
  activeIndicator: {
    position: 'absolute',
    right: -8,
    top: '50%',
    width: 2,
    height: 16,
    borderRadius: 1,
    transform: [{ translateY: -8 }],
  },
});

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});