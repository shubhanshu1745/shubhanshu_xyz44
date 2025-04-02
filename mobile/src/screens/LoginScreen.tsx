import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AppNavigator';
import useAuth from '../hooks/useAuth';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  // State for form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Navigation and authentication
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login, error: authError, isLoading, clearError } = useAuth();

  // Handle login submission
  const handleLogin = async () => {
    // Reset errors
    setEmailError('');
    setPasswordError('');
    clearError();
    
    // Validate fields
    let hasErrors = false;
    
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
    
    if (hasErrors) {
      return;
    }
    
    // Attempt login
    try {
      await login(email, password);
    } catch (err) {
      // Error is handled by auth context and displayed
      console.log('Login error:', err);
    }
  };

  // Navigate to registration
  const navigateToRegister = () => {
    navigation.navigate('Register');
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
          {/* Logo and title */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>CS</Text>
            </View>
            <Text style={styles.appTitle}>CricSocial</Text>
            <Text style={styles.appTagline}>Connect. Play. Cricket.</Text>
          </View>
          
          {/* Login form */}
          <Card style={styles.formCard}>
            <Text style={styles.formTitle}>Login</Text>
            
            {/* Error message */}
            {authError && <Text style={styles.errorText}>{authError}</Text>}
            
            {/* Email input */}
            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              error={emailError}
              containerStyle={styles.inputContainer}
            />
            
            {/* Password input */}
            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              error={passwordError}
              containerStyle={styles.inputContainer}
            />
            
            {/* Login button */}
            <Button
              title="Login"
              onPress={handleLogin}
              isLoading={isLoading}
              disabled={isLoading}
              style={styles.loginButton}
            />
            
            {/* Register link */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={navigateToRegister}>
                <Text style={styles.registerLink}>Sign Up</Text>
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
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2E8B57',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F3B4D',
    marginBottom: 8,
  },
  appTagline: {
    fontSize: 16,
    color: '#4A5568',
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
  loginButton: {
    marginTop: 16,
    marginBottom: 24,
  },
  errorText: {
    color: '#E53E3E',
    marginBottom: 16,
    textAlign: 'center',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  registerText: {
    fontSize: 14,
    color: '#4A5568',
  },
  registerLink: {
    fontSize: 14,
    color: '#2E8B57',
    fontWeight: 'bold',
  },
});

export default LoginScreen;