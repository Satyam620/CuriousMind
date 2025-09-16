import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { useFont } from '../contexts/FontContext';
import { Ionicons } from '@expo/vector-icons';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttons?: AlertButton[];
  onDismiss: () => void;
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  buttons = [{ text: 'OK', style: 'default' }],
  onDismiss,
}) => {
  const { theme } = useTheme();
  const { getFontStyle } = useFont();
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    onDismiss();
  };

  const getIconForTitle = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('error') || lowerTitle.includes('failed')) {
      return {
        name: 'alert-circle',
        color: '#EF4444',
        gradient: ['#FEF2F2', '#FECACA']
      };
    }
    if (lowerTitle.includes('busy') || lowerTitle.includes('overloaded')) {
      return {
        name: 'time',
        color: '#F59E0B',
        gradient: ['#FFFBEB', '#FDE68A']
      };
    }
    if (lowerTitle.includes('quota') || lowerTitle.includes('limit')) {
      return {
        name: 'warning',
        color: '#F59E0B',
        gradient: ['#FFFBEB', '#FDE68A']
      };
    }
    if (lowerTitle.includes('timeout') || lowerTitle.includes('network')) {
      return {
        name: 'wifi-off',
        color: '#EF4444',
        gradient: ['#FEF2F2', '#FECACA']
      };
    }
    if (lowerTitle.includes('unavailable')) {
      return {
        name: 'cloud-offline',
        color: '#6B7280',
        gradient: ['#F9FAFB', '#E5E7EB']
      };
    }
    if (lowerTitle.includes('logout')) {
      return {
        name: 'log-out',
        color: '#8B5CF6',
        gradient: ['#FAF5FF', '#DDD6FE']
      };
    }
    return {
      name: 'information-circle',
      color: '#3B82F6',
      gradient: ['#EBF8FF', '#BFDBFE']
    };
  };

  const iconConfig = getIconForTitle(title);

  const getButtonStyle = (button: AlertButton, index: number) => {
    if (button.style === 'cancel') {
      return {
        gradient: theme.isDark ? ['#3B82F6', '#1D4ED8'] : ['#60A5FA', '#3B82F6'],
        textColor: '#FFFFFF',
        borderColor: 'transparent'
      };
    }
    if (button.style === 'destructive') {
      return {
        gradient: theme.isDark ? ['#EF4444', '#DC2626'] : ['#F87171', '#EF4444'],
        textColor: '#FFFFFF',
        borderColor: 'transparent'
      };
    }
    return {
      gradient: [theme.colors.surface, theme.colors.surface],
      textColor: theme.colors.text,
      borderColor: theme.colors.border
    };
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onDismiss}
    >
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <Animated.View
          style={[
            styles.alertContainer,
            {
              transform: [{ scale: scaleAnim }],
            }
          ]}
        >
          {/* Background with gradient border */}
          <LinearGradient
            colors={iconConfig.gradient}
            style={styles.gradientBorder}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View
              style={[
                styles.alertContent,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              {/* Header with Enhanced Icon */}
              <View style={styles.header}>
                <LinearGradient
                  colors={theme.isDark ? ['#374151', '#1F2937'] : iconConfig.gradient}
                  style={styles.iconContainer}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons
                    name={iconConfig.name as any}
                    size={28}
                    color={iconConfig.color}
                  />
                </LinearGradient>
                <View style={styles.titleContainer}>
                  <Text
                    style={[
                      styles.title,
                      { color: theme.colors.text, ...getFontStyle() },
                    ]}
                  >
                    {title}
                  </Text>
                </View>
              </View>

              {/* Message with enhanced styling */}
              <Text
                style={[
                  styles.message,
                  { color: theme.colors.textSecondary, ...getFontStyle() },
                ]}
              >
                {message}
              </Text>

              {/* Enhanced Buttons */}
              <View style={styles.buttonContainer}>
                {buttons.map((button, index) => {
                  const buttonStyle = getButtonStyle(button, index);
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[styles.button]}
                      onPress={() => handleButtonPress(button)}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={buttonStyle.gradient}
                        style={styles.buttonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Text
                          style={[
                            styles.buttonText,
                            {
                              color: buttonStyle.textColor,
                              ...getFontStyle(),
                            },
                          ]}
                        >
                          {button.text}
                        </Text>
                        {button.style === 'cancel' && (
                          <Ionicons
                            name="checkmark"
                            size={16}
                            color="#FFFFFF"
                            style={styles.buttonIcon}
                          />
                        )}
                        {button.style === 'destructive' && (
                          <Ionicons
                            name="warning"
                            size={16}
                            color="#FFFFFF"
                            style={styles.buttonIcon}
                          />
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Platform.OS === 'android' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertContainer: {
    width: '100%',
    maxWidth: Platform.OS === 'android' ? 320 : 400,
    ...Platform.select({
      web: {
        maxWidth: 420,
      },
      android: {
        maxWidth: 340,
      },
    }),
  },
  gradientBorder: {
    borderRadius: 20,
    padding: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  alertContent: {
    borderRadius: 17,
    padding: 24,
    minHeight: 140,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: Platform.OS === 'android' ? 20 : 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  message: {
    fontSize: Platform.OS === 'android' ? 16 : 15,
    lineHeight: Platform.OS === 'android' ? 24 : 22,
    marginBottom: 28,
    textAlign: Platform.OS === 'android' ? 'left' : 'left',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    ...Platform.select({
      android: {
        gap: 8,
      },
    }),
  },
  button: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonGradient: {
    paddingVertical: Platform.OS === 'android' ? 14 : 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonText: {
    fontSize: Platform.OS === 'android' ? 15 : 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  buttonIcon: {
    marginLeft: 6,
  },
});

export default CustomAlert;