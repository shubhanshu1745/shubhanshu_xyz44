import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import useAuth from '../hooks/useAuth';
import apiClient from '../lib/api';
import Avatar from '../components/ui/Avatar';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

type ProfileScreenRouteProp = RouteProp<RootStackParamList, 'Profile'>;
type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

interface ProfileData {
  id: number;
  username: string;
  fullName: string | null;
  bio: string | null;
  profileImageUrl: string | null;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowing?: boolean;
  isCurrentUser: boolean;
  battingStyle?: string | null;
  bowlingStyle?: string | null;
  position?: string | null;
}

interface Post {
  id: number;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  hasLiked: boolean;
}

const ProfileScreen: React.FC = () => {
  const route = useRoute<ProfileScreenRouteProp>();
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { user } = useAuth();
  
  // Get username from route params or use current user's username
  const username = route.params?.username || user?.username;
  
  // State
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTab, setCurrentTab] = useState<'posts' | 'stats'>('posts');
  
  // Fetch profile data
  const fetchProfile = async () => {
    try {
      if (!username) return;
      
      setLoading(true);
      const profileData = await apiClient.getProfile(username);
      
      // Check if it's the current user
      const isCurrentUser = user?.id === profileData.id;
      
      setProfile({
        ...profileData,
        isCurrentUser,
      });
      
      // Fetch posts
      const userPosts = await apiClient.getUserPosts(username);
      setPosts(userPosts);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Follow/unfollow user
  const handleFollowToggle = async () => {
    if (!profile) return;
    
    try {
      // Optimistic update
      setProfile(prev => 
        prev ? {
          ...prev,
          isFollowing: !prev.isFollowing,
          followersCount: prev.isFollowing 
            ? prev.followersCount - 1 
            : prev.followersCount + 1,
        } : null
      );
      
      // Make API call
      if (profile.isFollowing) {
        await apiClient.unfollowUser(profile.id);
      } else {
        await apiClient.followUser(profile.id);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      // Revert on error
      fetchProfile();
    }
  };
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };
  
  // Initial load
  useEffect(() => {
    fetchProfile();
  }, [username]);
  
  // Loading state
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E8B57" />
      </View>
    );
  }
  
  // Post item renderer
  const renderPostItem = ({ item }: { item: Post }) => (
    <Card style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.postUser}>
          <Avatar 
            uri={profile?.profileImageUrl} 
            name={profile?.fullName || profile?.username || ''}
            size="sm"
          />
          <View style={styles.postUserInfo}>
            <Text style={styles.postUsername}>{profile?.username}</Text>
            <Text style={styles.postTime}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.moreButton}>
          <Feather name="more-horizontal" size={20} color="#1F3B4D" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.postContent}>{item.content}</Text>
      
      {item.imageUrl && (
        <Image 
          source={{ uri: item.imageUrl }} 
          style={styles.postImage}
          resizeMode="cover"
        />
      )}
      
      <View style={styles.postFooter}>
        <View style={styles.postStats}>
          <TouchableOpacity style={styles.postStat}>
            <MaterialCommunityIcons 
              name={item.hasLiked ? "heart" : "heart-outline"} 
              size={20} 
              color={item.hasLiked ? "#E53E3E" : "#1F3B4D"} 
            />
            <Text style={styles.postStatText}>{item.likeCount}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.postStat}>
            <Feather name="message-circle" size={20} color="#1F3B4D" />
            <Text style={styles.postStatText}>{item.commentCount}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
  
  // Stats display
  const renderStats = () => (
    <Card style={styles.statsCard}>
      <Text style={styles.statsTitle}>Cricket Statistics</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{profile?.position || 'N/A'}</Text>
          <Text style={styles.statLabel}>Position</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{profile?.battingStyle || 'N/A'}</Text>
          <Text style={styles.statLabel}>Batting Style</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{profile?.bowlingStyle || 'N/A'}</Text>
          <Text style={styles.statLabel}>Bowling Style</Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.viewDetailsButton}
        onPress={() => navigation.navigate('Stats', { userId: profile?.id })}
      >
        <Text style={styles.viewDetailsText}>View Detailed Stats</Text>
        <Feather name="chevron-right" size={16} color="#2E8B57" />
      </TouchableOpacity>
    </Card>
  );
  
  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={handleRefresh}
          colors={['#2E8B57']}
          tintColor="#2E8B57"
        />
      }
    >
      {/* Profile Header */}
      <View style={styles.header}>
        <Avatar 
          uri={profile?.profileImageUrl}
          name={profile?.fullName || profile?.username || ''}
          size="xl"
          showBorder
        />
        
        <View style={styles.profileInfo}>
          <Text style={styles.fullName}>{profile?.fullName || profile?.username}</Text>
          <Text style={styles.username}>@{profile?.username}</Text>
          {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}
          
          {!profile?.isCurrentUser ? (
            <Button
              title={profile?.isFollowing ? "Following" : "Follow"}
              variant={profile?.isFollowing ? "outline" : "primary"}
              size="sm"
              onPress={handleFollowToggle}
              style={styles.followButton}
            />
          ) : (
            <Button
              title="Edit Profile"
              variant="outline"
              size="sm"
              onPress={() => {}}
              style={styles.followButton}
            />
          )}
        </View>
      </View>
      
      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <TouchableOpacity style={styles.statBox}>
          <Text style={styles.statCount}>{profile?.postsCount || 0}</Text>
          <Text style={styles.statType}>Posts</Text>
        </TouchableOpacity>
        
        <View style={styles.statDivider} />
        
        <TouchableOpacity style={styles.statBox}>
          <Text style={styles.statCount}>{profile?.followersCount || 0}</Text>
          <Text style={styles.statType}>Followers</Text>
        </TouchableOpacity>
        
        <View style={styles.statDivider} />
        
        <TouchableOpacity style={styles.statBox}>
          <Text style={styles.statCount}>{profile?.followingCount || 0}</Text>
          <Text style={styles.statType}>Following</Text>
        </TouchableOpacity>
      </View>
      
      {/* Tab Navigation */}
      <View style={styles.tabNav}>
        <TouchableOpacity 
          style={[styles.tab, currentTab === 'posts' && styles.activeTab]}
          onPress={() => setCurrentTab('posts')}
        >
          <Feather 
            name="grid" 
            size={18} 
            color={currentTab === 'posts' ? '#2E8B57' : '#718096'} 
          />
          <Text 
            style={[
              styles.tabText, 
              currentTab === 'posts' && styles.activeTabText
            ]}
          >
            Posts
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, currentTab === 'stats' && styles.activeTab]}
          onPress={() => setCurrentTab('stats')}
        >
          <Feather 
            name="bar-chart-2" 
            size={18} 
            color={currentTab === 'stats' ? '#2E8B57' : '#718096'} 
          />
          <Text 
            style={[
              styles.tabText, 
              currentTab === 'stats' && styles.activeTabText
            ]}
          >
            Stats
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Tab Content */}
      {currentTab === 'posts' ? (
        posts.length > 0 ? (
          <View style={styles.postsContainer}>
            {posts.map(post => renderPostItem({ item: post }))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Feather name="image" size={48} color="#CBD5E0" />
            <Text style={styles.emptyStateText}>No posts yet</Text>
          </View>
        )
      ) : (
        renderStats()
      )}
    </ScrollView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  fullName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F3B4D',
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 12,
    lineHeight: 20,
  },
  followButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F3B4D',
  },
  statType: {
    fontSize: 12,
    color: '#718096',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    height: '70%',
    alignSelf: 'center',
  },
  tabNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2E8B57',
  },
  tabText: {
    fontSize: 14,
    color: '#718096',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#2E8B57',
    fontWeight: '500',
  },
  postsContainer: {
    paddingHorizontal: 16,
  },
  postCard: {
    marginBottom: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  postUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postUserInfo: {
    marginLeft: 8,
  },
  postUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F3B4D',
  },
  postTime: {
    fontSize: 12,
    color: '#718096',
  },
  moreButton: {
    padding: 4,
  },
  postContent: {
    fontSize: 14,
    color: '#1F3B4D',
    marginBottom: 12,
    lineHeight: 20,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  postFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
  },
  postStats: {
    flexDirection: 'row',
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  postStatText: {
    fontSize: 12,
    color: '#718096',
    marginLeft: 4,
  },
  emptyState: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
  },
  statsCard: {
    margin: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F3B4D',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  statItem: {
    width: '33%',
    alignItems: 'center',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F3B4D',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#718096',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#2E8B57',
    fontWeight: '500',
    marginRight: 4,
  },
});

export default ProfileScreen;