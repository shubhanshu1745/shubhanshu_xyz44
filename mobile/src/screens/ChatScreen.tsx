import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Feather } from '@expo/vector-icons';
import useAuth from '../hooks/useAuth';
import apiClient from '../lib/api';
import Avatar from '../components/ui/Avatar';
import Card from '../components/ui/Card';

type ChatScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Conversation'>;

interface Conversation {
  id: number;
  otherUser: {
    id: number;
    username: string;
    fullName: string | null;
    profileImageUrl: string | null;
  };
  lastMessage: {
    id: number;
    content: string;
    createdAt: string;
    senderId: number;
    read: boolean;
  } | null;
  unreadCount: number;
}

const ChatScreen: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const navigation = useNavigation<ChatScreenNavigationProp>();
  const { user } = useAuth();
  
  // Fetch conversations
  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<Conversation[]>('/conversations');
      setConversations(response);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };
  
  // Format timestamp
  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // Same day
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Within last 7 days
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Otherwise show date
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };
  
  // Navigate to conversation
  const navigateToConversation = (conversationId: number, username: string) => {
    navigation.navigate('Conversation', { conversationId });
  };
  
  // Initial load
  useEffect(() => {
    fetchConversations();
  }, []);
  
  // Filter conversations
  const filteredConversations = searchQuery 
    ? conversations.filter(convo => 
        convo.otherUser.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (convo.otherUser.fullName && convo.otherUser.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : conversations;
  
  // Loading state
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E8B57" />
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Feather name="search" size={18} color="#718096" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>
      
      {/* Conversations list */}
      <FlatList
        data={filteredConversations}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#2E8B57']}
            tintColor="#2E8B57"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="message-circle" size={48} color="#CBD5E0" />
            <Text style={styles.emptyText}>No conversations yet</Text>
            <Text style={styles.emptySubtext}>Start chatting with cricket enthusiasts</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            onPress={() => navigateToConversation(item.id, item.otherUser.username)} 
            activeOpacity={0.7}
          >
            <Card style={[styles.conversationCard, item.unreadCount > 0 && styles.unreadCard]}>
              <View style={styles.conversationContent}>
                <Avatar 
                  uri={item.otherUser.profileImageUrl}
                  name={item.otherUser.fullName || item.otherUser.username}
                  size="md"
                  online={false} // This could be dynamic in a real implementation
                />
                
                <View style={styles.conversationDetails}>
                  <View style={styles.conversationHeader}>
                    <Text 
                      style={[
                        styles.username, 
                        item.unreadCount > 0 && styles.unreadText
                      ]}
                      numberOfLines={1}
                    >
                      {item.otherUser.fullName || item.otherUser.username}
                    </Text>
                    
                    {item.lastMessage && (
                      <Text style={styles.timestamp}>
                        {formatTimestamp(item.lastMessage.createdAt)}
                      </Text>
                    )}
                  </View>
                  
                  <View style={styles.messageRow}>
                    {item.lastMessage ? (
                      <Text 
                        style={[
                          styles.messagePreview, 
                          item.unreadCount > 0 && styles.unreadText
                        ]}
                        numberOfLines={1}
                      >
                        {item.lastMessage.senderId === user?.id ? 'You: ' : ''}
                        {item.lastMessage.content}
                      </Text>
                    ) : (
                      <Text style={styles.noMessage}>No messages yet</Text>
                    )}
                    
                    {item.unreadCount > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadCount}>
                          {item.unreadCount > 99 ? '99+' : item.unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        )}
      />
      
      {/* New conversation button */}
      <TouchableOpacity style={styles.newChatButton}>
        <Feather name="edit-2" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    color: '#1F3B4D',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80, // Extra space for FAB
  },
  conversationCard: {
    marginBottom: 12,
    padding: 12,
  },
  unreadCard: {
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 3,
    borderLeftColor: '#2E8B57',
  },
  conversationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conversationDetails: {
    flex: 1,
    marginLeft: 12,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F3B4D',
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    color: '#718096',
    marginLeft: 8,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  messagePreview: {
    fontSize: 14,
    color: '#4A5568',
    flex: 1,
  },
  unreadText: {
    fontWeight: '600',
    color: '#1F3B4D',
  },
  noMessage: {
    fontSize: 14,
    color: '#A0AEC0',
    fontStyle: 'italic',
  },
  unreadBadge: {
    backgroundColor: '#2E8B57',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F3B4D',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#718096',
    marginTop: 8,
  },
  newChatButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#2E8B57',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});

export default ChatScreen;