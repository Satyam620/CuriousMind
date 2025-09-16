import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Keyboard, Platform } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useFont } from '../contexts/FontContext';

type SignupScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Signup'>;

interface Props {
  navigation: SignupScreenNavigationProp;
}

export default function SignupScreen({ navigation }: Props) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    re_password: '',
    first_name: '',
    last_name: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    username: '',
    email: '',
    password: '',
    re_password: '',
    general: '',
  });
  const { signup } = useAuth();
  const { theme } = useTheme();
  const { getFontStyle } = useFont();

  // Check if there are any errors
  const hasErrors = Object.values(errors).some(error => error !== '');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '', general: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {
      username: '',
      email: '',
      password: '',
      re_password: '',
      general: '',
    };

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!formData.email.includes('@')) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }
    if (!formData.re_password) {
      newErrors.re_password = 'Please confirm your password';
    } else if (formData.password !== formData.re_password) {
      newErrors.re_password = 'Passwords do not match';
    }

    setErrors(newErrors);

    // Return true if no errors
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setErrors(prev => ({ ...prev, general: '' })); // Clear any previous general errors
      await signup(formData);
      Alert.alert('Success', 'Account created successfully!');
      // Navigation will be handled by auth state change
    } catch (error: any) {
      const newErrors = {
        username: '',
        email: '',
        password: '',
        re_password: '',
        general: '',
      };

      if (error?.response?.data) {
        const errorData = error.response.data;

        if (errorData.username) {
          const usernameError = errorData.username[0];
          if (usernameError.includes('already exists') || usernameError.includes('taken')) {
            newErrors.username = 'This username is already taken. Please choose a different username.';
          } else {
            newErrors.username = usernameError;
          }
        }

        if (errorData.email) {
          const emailError = errorData.email[0];
          if (emailError.includes('already exists') || emailError.includes('taken')) {
            newErrors.email = 'An account with this email already exists. Please use a different email or try logging in.';
          } else {
            newErrors.email = emailError;
          }
        }

        if (errorData.password) {
          newErrors.password = errorData.password[0];
        }

        if (errorData.non_field_errors) {
          newErrors.general = errorData.non_field_errors[0];
        }

        // If no specific field errors, show general error
        if (!newErrors.username && !newErrors.email && !newErrors.password && !newErrors.general) {
          newErrors.general = 'Failed to create account. Please check your information and try again.';
        }
      } else if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
        newErrors.general = 'Request timed out. Please check your internet connection and try again.';
      } else if (error?.code === 'NETWORK_ERROR' || !error?.response) {
        newErrors.general = 'Unable to connect to server. Please check your internet connection and try again.';
      } else {
        newErrors.general = 'Failed to create account. Please try again.';
      }

      setErrors(newErrors);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.contentContainer}>
      <View style={[
        styles.form,
        { backgroundColor: theme.colors.surface },
        Platform.OS === 'web' && styles.webForm
      ]}>
        <Text style={[styles.title, { color: theme.colors.text }, getFontStyle()]}>Create Account</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }, getFontStyle()]}>Sign up to get started</Text>

        {errors.general ? (
          <View style={[styles.errorContainer, { backgroundColor: theme.isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(254, 226, 226, 1)' }]}>
            <Text style={[styles.errorText, { color: theme.isDark ? '#F87171' : '#DC2626' }, getFontStyle()]}>{errors.general}</Text>
          </View>
        ) : null}

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.background,
              borderColor: errors.username ? (theme.isDark ? '#F87171' : '#DC2626') : theme.colors.border,
              color: theme.colors.text
            },
            getFontStyle()
          ]}
          placeholder="Username"
          placeholderTextColor={theme.colors.textSecondary}
          value={formData.username}
          onChangeText={(value) => handleInputChange('username', value)}
          autoCapitalize="none"
          editable={!loading}
          onEndEditing={() => Keyboard.dismiss()}
          onSubmitEditing={() => Keyboard.dismiss()}
          returnKeyType="next"
        />
        {errors.username ? (
          <Text style={[styles.fieldErrorText, { color: theme.isDark ? '#F87171' : '#DC2626' }, getFontStyle()]}>{errors.username}</Text>
        ) : null}

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.background,
              borderColor: errors.email ? (theme.isDark ? '#F87171' : '#DC2626') : theme.colors.border,
              color: theme.colors.text
            },
            getFontStyle()
          ]}
          placeholder="Email"
          placeholderTextColor={theme.colors.textSecondary}
          value={formData.email}
          onChangeText={(value) => handleInputChange('email', value)}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
          onEndEditing={() => Keyboard.dismiss()}
          onSubmitEditing={() => Keyboard.dismiss()}
          returnKeyType="next"
        />
        {errors.email ? (
          <Text style={[styles.fieldErrorText, { color: theme.isDark ? '#F87171' : '#DC2626' }, getFontStyle()]}>{errors.email}</Text>
        ) : null}

        <TextInput
          style={[styles.input, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.text }, getFontStyle()]}
          placeholder="First Name (Optional)"
          placeholderTextColor={theme.colors.textSecondary}
          value={formData.first_name}
          onChangeText={(value) => handleInputChange('first_name', value)}
          editable={!loading}
          onEndEditing={() => Keyboard.dismiss()}
          onSubmitEditing={() => Keyboard.dismiss()}
          returnKeyType="next"
        />

        <TextInput
          style={[styles.input, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.text }, getFontStyle()]}
          placeholder="Last Name (Optional)"
          placeholderTextColor={theme.colors.textSecondary}
          value={formData.last_name}
          onChangeText={(value) => handleInputChange('last_name', value)}
          editable={!loading}
          onEndEditing={() => Keyboard.dismiss()}
          onSubmitEditing={() => Keyboard.dismiss()}
          returnKeyType="next"
        />

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.background,
              borderColor: errors.password ? (theme.isDark ? '#F87171' : '#DC2626') : theme.colors.border,
              color: theme.colors.text
            },
            getFontStyle()
          ]}
          placeholder="Password"
          placeholderTextColor={theme.colors.textSecondary}
          value={formData.password}
          onChangeText={(value) => handleInputChange('password', value)}
          secureTextEntry
          editable={!loading}
          onEndEditing={() => Keyboard.dismiss()}
          onSubmitEditing={() => Keyboard.dismiss()}
          returnKeyType="next"
        />
        {errors.password ? (
          <Text style={[styles.fieldErrorText, { color: theme.isDark ? '#F87171' : '#DC2626' }, getFontStyle()]}>{errors.password}</Text>
        ) : null}

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.background,
              borderColor: errors.re_password ? (theme.isDark ? '#F87171' : '#DC2626') : theme.colors.border,
              color: theme.colors.text
            },
            getFontStyle()
          ]}
          placeholder="Confirm Password"
          placeholderTextColor={theme.colors.textSecondary}
          value={formData.re_password}
          onChangeText={(value) => handleInputChange('re_password', value)}
          secureTextEntry
          editable={!loading}
          onEndEditing={() => Keyboard.dismiss()}
          onSubmitEditing={handleSignup}
          returnKeyType="done"
        />
        {errors.re_password ? (
          <Text style={[styles.fieldErrorText, { color: theme.isDark ? '#F87171' : '#DC2626' }, getFontStyle()]}>{errors.re_password}</Text>
        ) : null}

        <TouchableOpacity
          style={[
            styles.button,
            (loading || hasErrors) && styles.buttonDisabled
          ]}
          onPress={handleSignup}
          disabled={loading || hasErrors}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={[styles.buttonText, getFontStyle()]}>Create Account</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.textSecondary }, getFontStyle()]}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={[styles.linkText, getFontStyle()]}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  form: {
    borderRadius: 20,
    padding: 30,
    elevation: 5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  webForm: {
    maxWidth: 400,
    width: '90%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
  },
  linkText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  fieldErrorText: {
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
    marginLeft: 5,
    fontWeight: '500',
  },
});