import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  GestureResponderEvent,
} from 'react-native';

export interface ButtonProps {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
}) => {
  // Determine button and text style based on variant
  const buttonStyle = [
    styles.button,
    styles[`button_${variant}`],
    styles[`button_${size}`],
    disabled && styles.button_disabled,
    disabled && styles[`button_${variant}_disabled`],
    style,
  ];

  const buttonTextStyle = [
    styles.text,
    styles[`text_${variant}`],
    styles[`text_${size}`],
    disabled && styles.text_disabled,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#ffffff' : '#2E8B57'}
        />
      ) : (
        <>
          {leftIcon && <span style={styles.leftIcon}>{leftIcon}</span>}
          <Text style={buttonTextStyle}>{title}</Text>
          {rightIcon && <span style={styles.rightIcon}>{rightIcon}</span>}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  button_primary: {
    backgroundColor: '#2E8B57',
    borderWidth: 0,
  },
  button_secondary: {
    backgroundColor: '#E2F2EB',
    borderWidth: 0,
  },
  button_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2E8B57',
  },
  button_ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  button_danger: {
    backgroundColor: '#E53E3E',
    borderWidth: 0,
  },
  button_sm: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 80,
  },
  button_md: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 100,
  },
  button_lg: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    minWidth: 120,
  },
  button_disabled: {
    opacity: 0.5,
  },
  button_primary_disabled: {
    backgroundColor: '#2E8B57',
  },
  text: {
    fontWeight: '500',
    textAlign: 'center',
  },
  text_primary: {
    color: '#FFFFFF',
  },
  text_secondary: {
    color: '#2E8B57',
  },
  text_outline: {
    color: '#2E8B57',
  },
  text_ghost: {
    color: '#2E8B57',
  },
  text_danger: {
    color: '#FFFFFF',
  },
  text_sm: {
    fontSize: 14,
  },
  text_md: {
    fontSize: 16,
  },
  text_lg: {
    fontSize: 18,
  },
  text_disabled: {
    opacity: 1,
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
});

export default Button;