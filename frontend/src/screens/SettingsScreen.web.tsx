import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme, ThemeMode } from '../contexts/ThemeContext';
import { useFont, AVAILABLE_FONTS, FontFamily } from '../contexts/FontContext';
import { RootStackParamList } from '../../App';
import { Ionicons } from '@expo/vector-icons';

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

interface Props {
  navigation: SettingsScreenNavigationProp;
}

const SettingsScreenWeb: React.FC<Props> = ({ navigation }) => {
  const { theme, themeMode, setThemeMode } = useTheme();
  const { currentFont, setFont, getFontStyle } = useFont();

  const handleThemeChange = (mode: ThemeMode) => {
    try {
      setThemeMode(mode);
    } catch (error) {
      console.error('Error changing theme:', error);
    }
  };

  const handleFontChange = (fontFamily: FontFamily) => {
    try {
      setFont(fontFamily);
    } catch (error) {
      console.error('Error changing font:', error);
    }
  };

  // Inject custom scrollbar styles
  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      const styleId = 'settings-scrollbar-styles';
      let existingStyle = document.getElementById(styleId);

      if (existingStyle) {
        existingStyle.remove();
      }

      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .settings-custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .settings-custom-scrollbar::-webkit-scrollbar-track {
          background: ${theme.isDark ? '#1F2937' : '#F8FAFC'};
          border-radius: 4px;
        }
        .settings-custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${theme.isDark ? '#4B5563' : '#CBD5E1'};
          border-radius: 4px;
          transition: background-color 0.2s ease;
        }
        .settings-custom-scrollbar::-webkit-scrollbar-thumb:hover {
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
      <div style={{
        height: '92vh',
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
        paddingBottom: '20px',
        scrollbarWidth: 'thin',
        scrollbarColor: theme.isDark ? '#4B5563 #1F2937' : '#CBD5E1 #F8FAFC'
      }}
      className="settings-custom-scrollbar"
      >
        {/* Header */}
        <div style={{ padding: '20px', paddingBottom: '10px' }}>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary, ...getFontStyle() }]}>
            Customize your app experience
          </Text>
        </div>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text, ...getFontStyle() }]}>Appearance</Text>

          <View style={[styles.settingCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.settingHeader}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="color-palette-outline" size={20} color={theme.colors.textSecondary} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: theme.colors.text, ...getFontStyle() }]}>Theme</Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary, ...getFontStyle() }]}>
                  Choose your preferred theme
                </Text>
              </View>
            </View>

            <View style={styles.themeOptions}>
              {(['light', 'dark'] as ThemeMode[]).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.themeOption,
                    { backgroundColor: themeMode === mode ? '#3B82F6' + '20' : 'transparent' }
                  ]}
                  onPress={() => handleThemeChange(mode)}
                >
                  <Ionicons
                    name={mode === 'light' ? 'sunny' : 'moon'}
                    size={20}
                    color={themeMode === mode ? '#3B82F6' : theme.colors.textSecondary}
                  />
                  <Text style={[
                    styles.themeOptionText,
                    { color: themeMode === mode ? '#3B82F6' : theme.colors.text, ...getFontStyle() }
                  ]}>
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </Text>
                  {themeMode === mode && (
                    <Ionicons name="checkmark" size={18} color="#3B82F6" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.settingCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.settingHeader}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="text-outline" size={20} color={theme.colors.textSecondary} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: theme.colors.text, ...getFontStyle() }]}>Font</Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary, ...getFontStyle() }]}>
                  Choose your preferred font
                </Text>
              </View>
            </View>

            <View style={styles.fontOptions}>
              {AVAILABLE_FONTS.map((font) => (
                <TouchableOpacity
                  key={font.family}
                  style={[
                    styles.fontOption,
                    { backgroundColor: currentFont.family === font.family ? '#3B82F6' + '20' : 'transparent' }
                  ]}
                  onPress={() => handleFontChange(font.family)}
                >
                  <Text style={[
                    styles.fontOptionText,
                    {
                      color: currentFont.family === font.family ? '#3B82F6' : theme.colors.text,
                      fontFamily: font.family === 'default' ? undefined : font.fontFamily,
                      ...getFontStyle()
                    }
                  ]}>
                    {font.name}
                  </Text>
                  {currentFont.family === font.family && (
                    <Ionicons name="checkmark" size={18} color="#3B82F6" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* General Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text, ...getFontStyle() }]}>General</Text>

          <TouchableOpacity
            style={[styles.settingCard, { backgroundColor: theme.colors.surface }]}
            onPress={() => navigation.navigate('Privacy')}
          >
            <View style={styles.settingRow}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.textSecondary} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: theme.colors.text, ...getFontStyle() }]}>Privacy & Security</Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary, ...getFontStyle() }]}>
                  Control your privacy settings
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>
      </div>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
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
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
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
  fontOptions: {
    gap: 8,
  },
  fontOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  fontOptionText: {
    fontSize: 16,
    flex: 1,
  },
});

export default SettingsScreenWeb;