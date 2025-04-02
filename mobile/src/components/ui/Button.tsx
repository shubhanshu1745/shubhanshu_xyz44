import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
  View,
} from 'react-native';

/**
 * Button variants
 * - primary: filled with primary color
 * - secondary: filled with secondary color
 * - outline: transparent with colored border
 * - ghost: transparent with colored text
 * - link: looks like a link (no background or border)
 * - danger: red for destructive actions
 * - success: green for success actions
 */
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'danger' | 'success';

/**
 * Button sizes
 * - xs: extra small
 * - sm: small
 * - md: medium (default)
 * - lg: large
 * - xl: extra large
 */
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Cricket-themed color palette
const COLORS = {
  primary: '#2E8B57', // Sea Green - primary brand color
  primaryLight: '#3DA57A',
  primaryDark: '#236844',
  secondary: '#1E88E5', // Cricket Blue
  secondaryLight: '#4BA3F4',
  secondaryDark: '#1565C0',
  danger: '#E53935', // Red for alerts/errors
  dangerLight: '#EF5350',
  dangerDark: '#C62828',
  success: '#43A047', // Green for success
  successLight: '#66BB6A',
  successDark: '#2E7D32',
  black: '#212121',
  white: '#FFFFFF',
  gray100: '#F5F5F5',
  gray200: '#EEEEEE',
  gray300: '#E0E0E0',
  gray400: '#BDBDBD',
  gray500: '#9E9E9E',
  gray600: '#757575',
  gray700: '#616161',
  gray800: '#424242',
  gray900: '#212121',
};

/**
 * Returns the background color based on variant
 */
const getBackgroundColor = (variant: ButtonVariant, disabled: boolean): string => {
  if (disabled) return COLORS.gray300;
  
  switch (variant) {
    case 'primary':
      return COLORS.primary;
    case 'secondary':
      return COLORS.secondary;
    case 'danger':
      return COLORS.danger;
    case 'success':
      return COLORS.success;
    case 'outline':
    case 'ghost':
    case 'link':
      return 'transparent';
    default:
      return COLORS.primary;
  }
};

/**
 * Returns text color based on variant
 */
const getTextColor = (variant: ButtonVariant, disabled: boolean): string => {
  if (disabled) return COLORS.gray600;
  
  switch (variant) {
    case 'primary':
    case 'secondary':
    case 'danger':
    case 'success':
      return COLORS.white;
    case 'outline':
      return COLORS.primary;
    case 'ghost':
      return COLORS.primary;
    case 'link':
      return COLORS.primary;
    default:
      return COLORS.white;
  }
};

/**
 * Returns border color and width based on variant
 */
const getBorder = (variant: ButtonVariant, disabled: boolean): { borderColor: string; borderWidth: number } => {
  if (disabled) {
    return { borderColor: COLORS.gray400, borderWidth: variant === 'outline' ? 1 : 0 };
  }
  
  switch (variant) {
    case 'outline':
      return { borderColor: COLORS.primary, borderWidth: 1 };
    default:
      return { borderColor: 'transparent', borderWidth: 0 };
  }
};

/**
 * Returns size-based styles
 */
const getSizeStyles = (size: ButtonSize): { 
  container: ViewStyle; 
  text: TextStyle;
  iconSize: number;
} => {
  switch (size) {
    case 'xs':
      return {
        container: {
          paddingVertical: 4,
          paddingHorizontal: 8,
          borderRadius: 4,
        },
        text: {
          fontSize: 12,
        },
        iconSize: 12,
      };
    case 'sm':
      return {
        container: {
          paddingVertical: 6,
          paddingHorizontal: 12,
          borderRadius: 6,
        },
        text: {
          fontSize: 14,
        },
        iconSize: 14,
      };
    case 'lg':
      return {
        container: {
          paddingVertical: 12,
          paddingHorizontal: 24,
          borderRadius: 10,
        },
        text: {
          fontSize: 18,
        },
        iconSize: 20,
      };
    case 'xl':
      return {
        container: {
          paddingVertical: 16,
          paddingHorizontal: 32,
          borderRadius: 12,
        },
        text: {
          fontSize: 20,
        },
        iconSize: 24,
      };
    default: // md
      return {
        container: {
          paddingVertical: 10,
          paddingHorizontal: 16,
          borderRadius: 8,
        },
        text: {
          fontSize: 16,
        },
        iconSize: 16,
      };
  }
};

interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  isLoading = false,
  disabled = false,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  style,
  textStyle,
  fullWidth = false,
  ...rest
}) => {
  const sizeStyles = getSizeStyles(size);
  const { borderColor, borderWidth } = getBorder(variant, disabled);
  const backgroundColor = getBackgroundColor(variant, disabled);
  const textColor = getTextColor(variant, disabled);
  
  const isDisabled = disabled || isLoading;
  
  return (
    <TouchableOpacity
      style={[
        styles.container,
        sizeStyles.container,
        {
          backgroundColor,
          borderColor,
          borderWidth,
          opacity: isDisabled ? 0.8 : 1,
          width: fullWidth ? '100%' : undefined,
        },
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator 
          size="small" 
          color={textColor} 
        />
      ) : (
        <View style={styles.contentContainer}>
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
          <Text style={[
            styles.text,
            sizeStyles.text,
            { color: textColor },
            textStyle,
          ]}>
            {title}
          </Text>
          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
});

export default Button;