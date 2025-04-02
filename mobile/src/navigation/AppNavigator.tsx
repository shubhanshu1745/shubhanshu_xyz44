import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Dimensions } from 'react-native';
import useAuth from '../hooks/useAuth';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import StatsScreen from '../screens/StatsScreen';
import MatchesScreen from '../screens/MatchesScreen';
import TeamsScreen from '../screens/TeamsScreen';
import LiveScoringScreen from '../screens/LiveScoringScreen';
import ChatScreen from '../screens/ChatScreen';
import ConversationScreen from '../screens/ConversationScreen';

// Icons
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';

// Screen param types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Profile: { username: string };
  LiveScoring: undefined;
  Match: { matchId: number };
  Conversation: { conversationId: number };
  CreatePost: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Stats: undefined;
  Teams: undefined;
  Matches: undefined;
  Profile: { username?: string };
  Chat: undefined;
};

// Create navigators
const Stack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

// Get screen dimensions
const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;

// Authentication stack navigator
const AuthNavigator = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#f5f5f5' },
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
};

// Main tab navigator
const MainTabNavigator = () => {
  return (
    <MainTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#2E8B57',
        tabBarInactiveTintColor: '#718096',
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <MainTab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" color={color} size={size} />
          ),
        }}
      />
      <MainTab.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chart-bar" color={color} size={size} />
          ),
        }}
      />
      <MainTab.Screen
        name="Matches"
        component={MatchesScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cricket" color={color} size={size} />
          ),
        }}
      />
      <MainTab.Screen
        name="Teams"
        component={TeamsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group" color={color} size={size} />
          ),
        }}
      />
      <MainTab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="message-circle" color={color} size={size} />
          ),
        }}
      />
    </MainTab.Navigator>
  );
};

// Root navigator
const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen}
              options={{
                headerShown: true,
                headerTitle: 'Profile',
                headerTintColor: '#2E8B57',
              }}
            />
            <Stack.Screen 
              name="LiveScoring" 
              component={LiveScoringScreen}
              options={{
                headerShown: true,
                headerTitle: 'Live Scoring',
                headerTintColor: '#2E8B57',
              }}
            />
            <Stack.Screen 
              name="Conversation" 
              component={ConversationScreen}
              options={{
                headerShown: true,
                headerTitle: 'Chat',
                headerTintColor: '#2E8B57',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 18,
    color: '#2E8B57',
  },
  tabBar: {
    backgroundColor: '#ffffff',
    borderTopColor: 'rgba(0,0,0,0.05)',
    height: 60,
  },
  tabBarLabel: {
    fontSize: isSmallScreen ? 10 : 12,
    fontWeight: '500',
    marginBottom: 4,
  },
});

export default AppNavigator;