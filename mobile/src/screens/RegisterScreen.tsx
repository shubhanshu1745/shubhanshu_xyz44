import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AppNavigator';
import useAuth from '../hooks/useAuth';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

const RegisterScreen: React.FC = () => {
  // State for form fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  // Form validation errors
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  // Navigation and auth
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { register, error: authError, isLoading, clearError } = useAuth();
  
  // Navigate back to login
  const navigateToLogin = () => {
    navigation.navigate('Login');
  };
  
  // Handle registration
  const handleRegister = async () => {
    // Reset errors
    setUsernameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    clearError();
    
    // Validate fields
    let hasErrors = false;
    
    if (!username) {
      setUsernameError('Username is required');
      hasErrors = true;
    } else if (username.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      hasErrors = true;
    }
    
    if (!email) {
      setEmailError('Email is required');
      hasErrors = true;
    } else if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
      hasErrors = true;
    }
    
    if (!password) {
      setPasswordError('Password is required');
      hasErrors = true;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      hasErrors = true;
    }
    
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      hasErrors = true;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      hasErrors = true;
    }
    
    if (hasErrors) {
      return;
    }
    
    // Attempt registration
    try {
      await register({
        username,
        email,
        password,
        confirmPassword,
        fullName: fullName || undefined,
      });
    } catch (err) {
      // Error is handled by auth context and displayed
      console.log('Registration error:', err);
    }
  };
  
  // Email validation helper
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    return emailRegex.test(email);
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={navigateToLogin}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Text style={styles.backButtonText}>← Back to Login</Text>
          </TouchableOpacity>
          
          {/* Registration form */}
          <Card style={styles.formCard}>
            <Text style={styles.formTitle}>Create Account</Text>
            
            {/* Error message */}
            {authError && <Text style={styles.errorText}>{authError}</Text>}
            
            {/* Full Name input (optional) */}
            <Input
              label="Full Name (optional)"
              placeholder="Enter your full name"
              value={fullName}
              onChangeText={(value) => setFullName(value)}
              error=""
              containerStyle={styles.inputContainer}
            />
            
            {/* Username input */}
            <Input
              label="Username"
              placeholder="Choose a username"
              value={username}
              onChangeText={(value) => setUsername(value)}
              autoCapitalize="none"
              error={usernameError}
              containerStyle={styles.inputContainer}
            />
            
            {/* Email input */}
            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={(value) => setEmail(value)}
              keyboardType="email-address"
              autoCapitalize="none"
              error={emailError}
              containerStyle={styles.inputContainer}
            />
            
            {/* Password input */}
            <Input
              label="Password"
              placeholder="Create a password"
              value={password}
              onChangeText={(value) => setPassword(value)}
              secureTextEntry
              error={passwordError}
              containerStyle={styles.inputContainer}
            />
            
            {/* Confirm Password input */}
            <Input
              label="Confirm Password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={(value) => setConfirmPassword(value)}
              secureTextEntry
              error={confirmPasswordError}
              containerStyle={styles.inputContainer}
            />
            
            {/* Register button */}
            <Button
              title="Create Account"
              onPress={handleRegister}
              isLoading={isLoading}
              disabled={isLoading}
              style={styles.registerButton}
            />
            
            {/* Login link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={navigateToLogin}>
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoidView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2E8B57',
    fontWeight: '500',
  },
  formCard: {
    padding: 24,
    borderRadius: 12,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F3B4D',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  registerButton: {
    marginTop: 16,
    marginBottom: 24,
  },
  errorText: {
    color: '#E53E3E',
    marginBottom: 16,
    textAlign: 'center',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#4A5568',
  },
  loginLink: {
    fontSize: 14,
    color: '#2E8B57',
    fontWeight: 'bold',
  },
});

export default RegisterScreen;