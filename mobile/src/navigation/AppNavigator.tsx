import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import useAuth from '../hooks/useAuth';

// Screens - Auth
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

// Screens - Main
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MatchesScreen from '../screens/MatchesScreen';
import StatsScreen from '../screens/StatsScreen';
import ChatScreen from '../screens/ChatScreen';
import ConversationScreen from '../screens/ConversationScreen';
import PostDetailScreen from '../screens/PostDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import LiveScoringScreen from '../screens/LiveScoringScreen';
import MatchDetailScreen from '../screens/MatchDetailScreen';
import SearchScreen from '../screens/SearchScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

// Define the RootStack param list
export type RootStackParamList = {
  // Auth Screens
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  
  // Main Screens
  MainTabs: undefined;
  Home: undefined;
  Profile: { username?: string };
  Matches: undefined;
  Stats: { userId?: number };
  Chat: undefined;
  Conversation: { conversationId: number };
  PostDetail: { postId: number };
  Settings: undefined;
  EditProfile: undefined;
  LiveScoring: { matchId?: number };
  Match: { matchId: number };
  Search: undefined;
  Notifications: undefined;
};

// Create the Stacks
const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<RootStackParamList>();

// Bottom Tabs Navigator
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2E8B57',
        tabBarInactiveTintColor: '#718096',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          paddingTop: 5,
          paddingBottom: 5,
          height: 60,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      
      <Tab.Screen
        name="Matches"
        component={MatchesScreen}
        options={{
          tabBarLabel: 'Matches',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cricket" size={size} color={color} />
          ),
        }}
      />
      
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarLabel: 'Messages',
          tabBarIcon: ({ color, size }) => (
            <Feather name="message-circle" size={size} color={color} />
          ),
        }}
      />
      
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Main Navigator
const AppNavigator = () => {
  const { isSignedIn, isLoading } = useAuth();
  
  // Show a loading screen if auth state is being determined
  if (isLoading) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Loading" component={LoadingScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }
  
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          headerTintColor: '#1F3B4D',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      >
        {isSignedIn ? (
          // Logged-in User Screens
          <>
            <Stack.Screen
              name="MainTabs"
              component={MainTabNavigator}
              options={{ headerShown: false }}
            />
            
            <Stack.Screen
              name="Conversation"
              component={ConversationScreen}
              options={({ route }) => ({
                title: '',
                headerBackTitle: 'Back',
              })}
            />
            
            <Stack.Screen
              name="PostDetail"
              component={PostDetailScreen}
              options={{ title: 'Post' }}
            />
            
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{ title: 'Settings' }}
            />
            
            <Stack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={{ title: 'Edit Profile' }}
            />
            
            <Stack.Screen
              name="Stats"
              component={StatsScreen}
              options={{ title: 'Cricket Stats' }}
            />
            
            <Stack.Screen
              name="LiveScoring"
              component={LiveScoringScreen}
              options={{ title: 'Live Scoring' }}
            />
            
            <Stack.Screen
              name="Match"
              component={MatchDetailScreen}
              options={{ title: 'Match Details' }}
            />
            
            <Stack.Screen
              name="Search"
              component={SearchScreen}
              options={{ title: 'Search' }}
            />
            
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{ title: 'Notifications' }}
            />
          </>
        ) : (
          // Auth Screens
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ title: 'Create Account' }}
            />
            
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
              options={{ title: 'Reset Password' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Loading Screen Component
const LoadingScreen = () => {
  return null; // Replace with an actual loading screen component
};

export default AppNavigator;