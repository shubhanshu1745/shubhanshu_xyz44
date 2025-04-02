import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';

/**
 * Avatar sizes available
 */
type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Avatar props interface
 */
interface AvatarProps {
  /**
   * Image URI to display
   */
  uri?: string | null;
  
  /**
   * Name to use for initials fallback
   */
  name?: string;
  
  /**
   * Size of the avatar
   */
  size?: AvatarSize;
  
  /**
   * Additional container styles
   */
  containerStyle?: ViewStyle;
  
  /**
   * Additional image styles
   */
  imageStyle?: ImageStyle;
  
  /**
   * Additional text styles for initials
   */
  textStyle?: TextStyle;
}

/**
 * Avatar component for displaying user profile images with fallback to initials
 */
export const Avatar: React.FC<AvatarProps> = ({
  uri,
  name = '',
  size = 'md',
  containerStyle,
  imageStyle,
  textStyle,
}) => {
  // Calculate the dimensions based on size
  const dimensions = {
    width: AVATAR_SIZES[size],
    height: AVATAR_SIZES[size],
    borderRadius: AVATAR_SIZES[size] / 2,
  };

  // Generate initials from name
  const initials = name
    .split(' ')
    .map(part => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Choose between image or text fallback
  const renderContent = () => {
    if (uri) {
      return (
        <Image
          source={{ uri }}
          style={[styles.image, dimensions, imageStyle]}
          defaultSource={require('../../../assets/placeholder-profile.png')}
        />
      );
    } else {
      return (
        <View style={[styles.initialsContainer, dimensions, { backgroundColor: getColorFromName(name) }]}>
          <Text style={[styles.initialsText, { fontSize: AVATAR_SIZES[size] * 0.4 }, textStyle]}>
            {initials}
          </Text>
        </View>
      );
    }
  };

  return (
    <View style={[styles.container, dimensions, containerStyle]}>
      {renderContent()}
    </View>
  );
};

// Avatar size dimensions in pixels
const AVATAR_SIZES = {
  xs: 24,
  sm: 32,
  md: 48,
  lg: 64,
  xl: 96,
};

// Simple color generator based on name
const getColorFromName = (name: string): string => {
  const colors = [
    '#2E8B57', // Sea Green
    '#1F3B4D', // Navy Blue
    '#4CAF50', // Green
    '#F9A825', // Cricket Gold
    '#3F51B5', // Indigo
    '#FF5722', // Deep Orange
    '#607D8B', // Blue Grey
    '#009688', // Teal
  ];
  
  if (!name) return colors[0];
  
  // Use simple hash function to get consistent colors
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initialsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default Avatar;