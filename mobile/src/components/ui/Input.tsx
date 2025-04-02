import React, { forwardRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
  KeyboardTypeOptions,
  NativeSyntheticEvent,
  TextInputFocusEventData,
} from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: TextStyle;
  errorStyle?: TextStyle;
  placeholder?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      containerStyle,
      labelStyle,
      inputStyle,
      errorStyle,
      placeholder,
      ...props
    },
    ref
  ) => {
    return (
      <View style={[styles.container, containerStyle]}>
        {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
        <TextInput
          ref={ref}
          style={[
            styles.input,
            inputStyle,
            error ? styles.inputError : null,
          ]}
          placeholder={placeholder}
          placeholderTextColor="#a0aec0"
          {...props}
        />
        {error && <Text style={[styles.errorText, errorStyle]}>{error}</Text>}
      </View>
    );
  }
);

// Set display name for debugging
Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 6,
    color: '#1F3B4D',
  },
  input: {
    backgroundColor: '#f9fafb',
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#1F3B4D',
  },
  inputError: {
    borderColor: '#e53e3e',
  },
  errorText: {
    color: '#e53e3e',
    fontSize: 14,
    marginTop: 4,
  },
});

export default Input;