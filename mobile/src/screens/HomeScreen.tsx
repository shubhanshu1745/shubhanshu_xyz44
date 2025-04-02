import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainTabParamList } from '../navigation/AppNavigator';
import useAuth from '../hooks/useAuth';
import apiClient from '../lib/api';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import Avatar from '../components/ui/Avatar';
import Card from '../components/ui/Card';

// Types for posts
interface User {
  id: number;
  username: string;
  fullName: string | null;
  profileImageUrl: string | null;
}

interface Post {
  id: number;
  userId: number;
  content: string;
  createdAt: Date | null;
  imageUrl: string | null;
  videoUrl: string | null;
  isReel: boolean;
}

interface PostWithUser extends Post {
  user: User;
  likeCount: number;
  commentCount: number;
  hasLiked: boolean;
}

const HomeScreen: React.FC = () => {
  const [posts, setPosts] = useState<PostWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const navigation = useNavigation<NativeStackNavigationProp<MainTabParamList>>();
  const { user } = useAuth();
  
  // Format post date
  const formatDate = (date: Date | null) => {
    if (!date) return '';
    
    const now = new Date();
    const postDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds}s`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}h`;
    } else if (diffInSeconds < 604800) {
      return `${Math.floor(diffInSeconds / 86400)}d`;
    } else {
      return postDate.toLocaleDateString();
    }
  };
  
  // Load posts
  const loadPosts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getPosts();
      setPosts(response);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadPosts();
  };
  
  // Like post
  const handleLike = async (postId: number) => {
    try {
      // Optimistic update
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                hasLiked: !post.hasLiked, 
                likeCount: post.hasLiked ? post.likeCount - 1 : post.likeCount + 1 
              } 
            : post
        )
      );
      
      // Make API call
      if (posts.find(p => p.id === postId)?.hasLiked) {
        await apiClient.post(`/posts/${postId}/unlike`);
      } else {
        await apiClient.post(`/posts/${postId}/like`);
      }
    } catch (error) {
      console.error('Error liking post:', error);
      // Revert on error
      loadPosts();
    }
  };
  
  // Navigation to comments
  const handleComment = (postId: number) => {
    // navigation.navigate('Comments', { postId });
    console.log('Navigate to comments for post', postId);
  };
  
  // Navigation to profile
  const handleProfilePress = (username: string) => {
    navigation.navigate('Profile', { username });
  };
  
  useEffect(() => {
    loadPosts();
  }, []);
  
  // Render post item
  const renderPostItem = ({ item }: { item: PostWithUser }) => (
    <Card style={styles.postCard}>
      {/* Post header */}
      <View style={styles.postHeader}>
        <TouchableOpacity 
          style={styles.profileContainer}
          onPress={() => handleProfilePress(item.user.username)}
        >
          <Avatar 
            uri={item.user.profileImageUrl} 
            name={item.user.fullName || item.user.username} 
            size="sm"
          />
          <View style={styles.userInfo}>
            <Text style={styles.username}>{item.user.username}</Text>
            <Text style={styles.timestamp}>{formatDate(item.createdAt)}</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.moreButton}>
          <Feather name="more-horizontal" size={20} color="#1F3B4D" />
        </TouchableOpacity>
      </View>
      
      {/* Post content */}
      <Text style={styles.postContent}>{item.content}</Text>
      
      {/* Post image if exists */}
      {item.imageUrl && (
        <Image 
          source={{ uri: item.imageUrl }}
          style={styles.postImage}
          resizeMode="cover"
        />
      )}
      
      {/* Post footer */}
      <View style={styles.postFooter}>
        <View style={styles.statsRow}>
          <TouchableOpacity 
            style={styles.statContainer}
            onPress={() => handleLike(item.id)}
          >
            <MaterialCommunityIcons 
              name={item.hasLiked ? "heart" : "heart-outline"} 
              size={22} 
              color={item.hasLiked ? "#E53E3E" : "#1F3B4D"} 
            />
            <Text style={styles.statText}>{item.likeCount > 0 ? item.likeCount : ''}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.statContainer}
            onPress={() => handleComment(item.id)}
          >
            <MaterialCommunityIcons name="comment-outline" size={22} color="#1F3B4D" />
            <Text style={styles.statText}>{item.commentCount > 0 ? item.commentCount : ''}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.statContainer}>
            <MaterialCommunityIcons name="share-outline" size={22} color="#1F3B4D" />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logoText}>CricSocial</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Feather name="search" size={24} color="#1F3B4D" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Feather name="bell" size={24} color="#1F3B4D" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Content */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E8B57" />
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPostItem}
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
              <Text style={styles.emptyText}>No posts yet</Text>
              <Text style={styles.emptySubtext}>Follow some users to see their posts</Text>
            </View>
          }
        />
      )}
      
      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <Feather name="plus" size={28} color="#ffffff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  logoText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2E8B57',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  postCard: {
    marginBottom: 16,
    padding: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    marginLeft: 8,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F3B4D',
  },
  timestamp: {
    fontSize: 12,
    color: '#718096',
  },
  moreButton: {
    padding: 4,
  },
  postContent: {
    fontSize: 16,
    color: '#1F3B4D',
    marginBottom: 12,
    lineHeight: 22,
  },
  postImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 12,
  },
  postFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  statText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#4A5568',
    minWidth: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F3B4D',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
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

export default HomeScreen;