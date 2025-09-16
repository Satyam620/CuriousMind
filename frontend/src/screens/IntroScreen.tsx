import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions, Platform } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useTheme } from '../contexts/ThemeContext';
import { useFont } from '../contexts/FontContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

type IntroScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Intro'>;

interface Props {
  navigation: IntroScreenNavigationProp;
}

const { width, height } = Dimensions.get('window');

export default function IntroScreen({ navigation }: Props) {
  const { theme, setThemeMode } = useTheme();
  const { getFontStyle } = useFont();

  return (
    <LinearGradient
      colors={theme.isDark ? ['#1F2937', '#374151'] : ['#3B82F6', '#1E40AF']}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* App Icon/Logo */}
        <View style={styles.iconContainer}>
          <Ionicons name="bulb" size={80} color="#FFD700" />
        </View>

        {/* App Title */}
        <Text style={[styles.title, getFontStyle()]}>CuriousMind</Text>
        <Text style={[styles.subtitle, getFontStyle()]}>Expand Your Knowledge with AI-Powered Quizzes</Text>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Ionicons name="sparkles" size={24} color="#FFD700" />
            <Text style={[styles.featureText, getFontStyle()]}>AI-Generated Quizzes</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="trophy" size={24} color="#FFD700" />
            <Text style={[styles.featureText, getFontStyle()]}>Compete & Learn</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="library" size={24} color="#FFD700" />
            <Text style={[styles.featureText, getFontStyle()]}>Multiple Categories</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={[
          styles.buttonContainer,
          Platform.OS === 'web' && styles.webButtonContainer
        ]}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Signup')}
          >
            <Text style={[styles.primaryButtonText, getFontStyle()]}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={[styles.secondaryButtonText, getFontStyle()]}>I Have an Account</Text>
          </TouchableOpacity>
        </View>

        {/* Theme Toggle */}
        <TouchableOpacity
          style={styles.themeToggle}
          onPress={() => setThemeMode(theme.isDark ? 'light' : 'dark')}
        >
          <Ionicons
            name={theme.isDark ? 'sunny' : 'moon'}
            size={24}
            color="white"
          />
        </TouchableOpacity>

        {/* Attribution */}
        <View style={styles.attribution}>
          <Text style={[styles.attributionText, getFontStyle()]}>
            Made with ❤️ by Venom
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 30,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 100,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  featuresContainer: {
    marginBottom: 50,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  featureText: {
    fontSize: 16,
    color: 'white',
    marginLeft: 15,
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 40,
  },
  webButtonContainer: {
    maxWidth: 400,
    width: '90%',
    alignSelf: 'center',
  },
  primaryButton: {
    backgroundColor: '#FFD700',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 40,
    marginBottom: 15,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  primaryButtonText: {
    color: '#1F2937',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 40,
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  themeToggle: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  attribution: {
    position: 'absolute',
    bottom: 30,
  },
  attributionText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
});