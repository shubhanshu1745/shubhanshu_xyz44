import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Feather } from '@expo/vector-icons';
import useAuth from '../hooks/useAuth';
import apiClient from '../lib/api';
import Avatar from '../components/ui/Avatar';

type ConversationScreenRouteProp = RouteProp<RootStackParamList, 'Conversation'>;
type ConversationScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Conversation'>;

interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  createdAt: string;
  read: boolean;
  sender: {
    id: number;
    username: string;
    fullName: string | null;
    profileImageUrl: string | null;
  };
}

interface ConversationDetails {
  id: number;
  otherUser: {
    id: number;
    username: string;
    fullName: string | null;
    profileImageUrl: string | null;
  };
}

const ConversationScreen: React.FC = () => {
  const [conversation, setConversation] = useState<ConversationDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  
  const route = useRoute<ConversationScreenRouteProp>();
  const navigation = useNavigation<ConversationScreenNavigationProp>();
  const { user } = useAuth();
  const flatListRef = useRef<FlatList>(null);
  const conversationId = route.params.conversationId;
  
  // Set up conversation header
  useEffect(() => {
    if (conversation) {
      navigation.setOptions({
        headerTitle: () => (
          <View style={styles.headerTitle}>
            <Avatar 
              uri={conversation.otherUser.profileImageUrl}
              name={conversation.otherUser.fullName || conversation.otherUser.username}
              size="sm"
            />
            <Text style={styles.headerName}>
              {conversation.otherUser.fullName || conversation.otherUser.username}
            </Text>
          </View>
        ),
        headerRight: () => (
          <TouchableOpacity style={styles.headerButton}>
            <Feather name="more-vertical" size={20} color="#2E8B57" />
          </TouchableOpacity>
        ),
      });
    }
  }, [conversation, navigation]);
  
  // Fetch conversation details
  const fetchConversation = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<ConversationDetails>(`/conversations/${conversationId}`);
      setConversation(data);
      
      // Mark messages as read
      await apiClient.post(`/conversations/${conversationId}/read`);
    } catch (error) {
      console.error('Error fetching conversation:', error);
    }
  };
  
  // Fetch messages
  const fetchMessages = async () => {
    try {
      const data = await apiClient.get<Message[]>(`/conversations/${conversationId}/messages`);
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Send a message
  const sendMessage = async () => {
    if (!messageText.trim() || sending) return;
    
    try {
      setSending(true);
      
      const newMessage = await apiClient.post<Message>(`/conversations/${conversationId}/messages`, {
        content: messageText.trim(),
      });
      
      setMessages(prev => [...prev, newMessage]);
      setMessageText('');
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd();
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };
  
  // Format timestamp
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Format date header
  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric',
      });
    }
  };
  
  // Check if we need to show date header
  const shouldShowDateHeader = (message: Message, index: number) => {
    if (index === 0) return true;
    
    const currentDate = new Date(message.createdAt).toDateString();
    const prevDate = new Date(messages[index - 1].createdAt).toDateString();
    
    return currentDate !== prevDate;
  };
  
  // Initial load
  useEffect(() => {
    fetchConversation();
    fetchMessages();
    
    // Set up a timer to periodically check for new messages
    const intervalId = setInterval(fetchMessages, 10000);
    
    return () => clearInterval(intervalId);
  }, [conversationId]);
  
  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E8B57" />
      </View>
    );
  }
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.messageList}
        inverted={false}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item, index }) => (
          <>
            {shouldShowDateHeader(item, index) && (
              <View style={styles.dateHeader}>
                <Text style={styles.dateHeaderText}>
                  {formatDateHeader(item.createdAt)}
                </Text>
              </View>
            )}
            
            <View style={[
              styles.messageBubbleContainer,
              item.senderId === user?.id ? styles.sentContainer : styles.receivedContainer
            ]}>
              <View style={[
                styles.messageBubble,
                item.senderId === user?.id ? styles.sentBubble : styles.receivedBubble
              ]}>
                <Text style={[
                  styles.messageText,
                  item.senderId === user?.id ? styles.sentText : styles.receivedText
                ]}>
                  {item.content}
                </Text>
                <Text style={[
                  styles.messageTime,
                  item.senderId === user?.id ? styles.sentTime : styles.receivedTime
                ]}>
                  {formatMessageTime(item.createdAt)}
                </Text>
              </View>
            </View>
          </>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Start the conversation!</Text>
          </View>
        }
      />
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={messageText}
          onChangeText={setMessageText}
          multiline
          maxLength={500}
        />
        
        <TouchableOpacity 
          style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!messageText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Feather name="send" size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F3B4D',
    marginLeft: 8,
  },
  headerButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageList: {
    padding: 16,
    paddingBottom: 8,
  },
  dateHeader: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateHeaderText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#718096',
    backgroundColor: '#EDF2F7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  messageBubbleContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    maxWidth: '75%',
  },
  sentContainer: {
    alignSelf: 'flex-end',
  },
  receivedContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    minWidth: 80,
  },
  sentBubble: {
    backgroundColor: '#2E8B57',
    borderBottomRightRadius: 4,
  },
  receivedBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
  },
  sentText: {
    color: '#FFFFFF',
  },
  receivedText: {
    color: '#1F3B4D',
  },
  messageTime: {
    fontSize: 10,
    alignSelf: 'flex-end',
  },
  sentTime: {
    color: '#E2F2EB',
  },
  receivedTime: {
    color: '#718096',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F3B4D',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#718096',
    marginTop: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#F7FAFC',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingRight: 40,
    maxHeight: 120,
    fontSize: 16,
    color: '#1F3B4D',
  },
  sendButton: {
    backgroundColor: '#2E8B57',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#A0AEC0',
  },
});

export default ConversationScreen;