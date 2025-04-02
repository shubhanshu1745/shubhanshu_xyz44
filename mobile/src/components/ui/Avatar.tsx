import React from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  ImageStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';

type AvatarSize = 'tiny' | 'small' | 'medium' | 'large' | 'xlarge';

// Default fallback avatar image
const DEFAULT_AVATAR = require('../../assets/default-avatar.png');

/**
 * Returns styles based on the avatar size
 */
const getSizeStyles = (size: AvatarSize): {
  container: ViewStyle;
  text: TextStyle;
  fontSize: number;
} => {
  switch (size) {
    case 'tiny':
      return {
        container: {
          width: 24,
          height: 24,
          borderRadius: 12,
        },
        text: {
          fontSize: 10,
        },
        fontSize: 10,
      };
    case 'small':
      return {
        container: {
          width: 32,
          height: 32,
          borderRadius: 16,
        },
        text: {
          fontSize: 12,
        },
        fontSize: 12,
      };
    case 'large':
      return {
        container: {
          width: 64,
          height: 64,
          borderRadius: 32,
        },
        text: {
          fontSize: 24,
        },
        fontSize: 24,
      };
    case 'xlarge':
      return {
        container: {
          width: 96,
          height: 96,
          borderRadius: 48,
        },
        text: {
          fontSize: 36,
        },
        fontSize: 36,
      };
    default: // medium
      return {
        container: {
          width: 48,
          height: 48,
          borderRadius: 24,
        },
        text: {
          fontSize: 18,
        },
        fontSize: 18,
      };
  }
};

/**
 * Gets initials from a name string
 */
const getInitials = (name: string): string => {
  if (!name) return '';
  
  const nameParts = name.trim().split(' ');
  if (nameParts.length === 0) return '';
  
  if (nameParts.length === 1) {
    return nameParts[0].charAt(0).toUpperCase();
  }
  
  return (
    nameParts[0].charAt(0).toUpperCase() + 
    nameParts[nameParts.length - 1].charAt(0).toUpperCase()
  );
};

interface AvatarProps extends Omit<TouchableOpacityProps, 'style'> {
  uri?: string;
  name?: string;
  size?: AvatarSize;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  textStyle?: StyleProp<TextStyle>;
  onPress?: () => void;
}

const Avatar: React.FC<AvatarProps> = ({
  uri,
  name = '',
  size = 'medium',
  style,
  imageStyle,
  textStyle,
  onPress,
  ...rest
}) => {
  const sizeStyles = getSizeStyles(size);
  const initials = getInitials(name);
  
  // Render profile picture if uri is provided
  if (uri) {
    return (
      <TouchableOpacity 
        style={[styles.container, sizeStyles.container, style]}
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={onPress ? 0.8 : 1}
        {...rest}
      >
        <Image
          source={{ uri }}
          style={[styles.image, imageStyle]}
          defaultSource={DEFAULT_AVATAR}
        />
      </TouchableOpacity>
    );
  }
  
  // Render initials if name is provided, default avatar as fallback
  return (
    <TouchableOpacity
      style={[styles.container, sizeStyles.container, style]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.8 : 1}
      {...rest}
    >
      {name ? (
        <View style={styles.initialsContainer}>
          <Text style={[styles.initials, sizeStyles.text, textStyle]}>
            {initials}
          </Text>
        </View>
      ) : (
        <Image
          source={DEFAULT_AVATAR}
          style={[styles.image, imageStyle]}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  initialsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2E8B57', // Primary color for consistency
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default Avatar;