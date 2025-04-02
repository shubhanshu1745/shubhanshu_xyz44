import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'bordered' | 'flat';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
}) => {
  return (
    <View style={[styles.card, styles[`card_${variant}`], style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
    width: '100%',
  },
  card_default: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  card_elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4, 
  },
  card_bordered: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: 'transparent',
    elevation: 0,
  },
  card_flat: {
    shadowColor: 'transparent',
    elevation: 0,
    backgroundColor: '#f9fafb',
  },
});

export default Card;