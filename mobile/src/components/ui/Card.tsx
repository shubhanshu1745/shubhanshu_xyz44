import React from 'react';
import {
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Platform,
} from 'react-native';

/**
 * Card variants
 * - default: subtle shadow with light border
 * - elevated: stronger shadow
 * - outlined: border only, no shadow
 * - flat: no border, no shadow, just background color
 */
type CardVariant = 'default' | 'elevated' | 'outlined' | 'flat';

interface CardProps {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  variant?: CardVariant;
}

/**
 * Card component for displaying content in a contained, styled box
 * 
 * @param style - Additional styles to apply to the card container
 * @param children - Content to render inside the card
 * @param variant - Card style variant (default, elevated, outlined, flat)
 */
const Card: React.FC<CardProps> = ({
  style,
  children,
  variant = 'default',
}) => {
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return styles.elevated;
      case 'outlined':
        return styles.outlined;
      case 'flat':
        return styles.flat;
      default:
        return styles.default;
    }
  };

  return (
    <View style={[styles.container, getVariantStyle(), style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    width: '100%',
  },
  default: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  elevated: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  outlined: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  flat: {
    // Just background color, no border or shadow
  },
});

export default Card;