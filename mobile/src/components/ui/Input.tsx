import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  TextInputProps,
  StyleProp,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  touched?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  inputStyle?: StyleProp<ViewStyle>;
  errorStyle?: StyleProp<TextStyle>;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onLeftIconPress?: () => void;
  onRightIconPress?: () => void;
  secureTextEntry?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  touched,
  placeholder,
  secureTextEntry = false,
  containerStyle,
  labelStyle,
  inputStyle,
  errorStyle,
  leftIcon,
  rightIcon,
  onLeftIconPress,
  onRightIconPress,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);

  const showError = error && touched;
  
  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, labelStyle]}>
          {label}
        </Text>
      )}
      
      <View style={[
        styles.inputContainer,
        isFocused && styles.focused,
        showError && styles.errorInput,
        inputStyle,
      ]}>
        {leftIcon && (
          <TouchableOpacity
            style={styles.iconLeft}
            disabled={!onLeftIconPress}
            onPress={onLeftIconPress}
          >
            {leftIcon}
          </TouchableOpacity>
        )}
        
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#A0AEC0"
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...rest}
        />
        
        {secureTextEntry ? (
          <TouchableOpacity
            style={styles.iconRight}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          >
            <Feather 
              name={isPasswordVisible ? 'eye' : 'eye-off'} 
              size={20} 
              color="#718096" 
            />
          </TouchableOpacity>
        ) : rightIcon && (
          <TouchableOpacity
            style={styles.iconRight}
            disabled={!onRightIconPress}
            onPress={onRightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      
      {showError && (
        <Text style={[styles.errorText, errorStyle]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#4A5568',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#F7FAFC',
    paddingHorizontal: 12,
    height: 48,
    width: '100%',
  },
  input: {
    flex: 1,
    color: '#2D3748',
    fontSize: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  focused: {
    borderColor: '#2E8B57',
    shadowColor: '#2E8B57',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  errorInput: {
    borderColor: '#E53E3E',
  },
  errorText: {
    color: '#E53E3E',
    fontSize: 12,
    marginTop: 4,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

export default Input;