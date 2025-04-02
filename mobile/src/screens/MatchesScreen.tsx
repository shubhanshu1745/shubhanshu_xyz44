import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import useAuth from '../hooks/useAuth';
import apiClient from '../lib/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

type MatchesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Match'>;

interface Match {
  id: number;
  matchType: 'friendly' | 'league' | 'tournament' | 'practice';
  venue: string;
  team1: string;
  team2: string;
  team1Score: string;
  team2Score: string;
  date: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  result: string | null;
  userId: number;
  overs: number;
}

const MatchesScreen: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
  
  const navigation = useNavigation<MatchesScreenNavigationProp>();
  const { user } = useAuth();
  
  // Fetch matches
  const fetchMatches = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getPlayerMatches(user?.id || 0);
      setMatches(response);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchMatches();
  };
  
  // Navigate to match details
  const navigateToMatch = (matchId: number) => {
    navigation.navigate('Match', { matchId });
  };
  
  // Navigate to live scoring
  const navigateToLiveScoring = () => {
    navigation.navigate('LiveScoring');
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };
  
  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  
  // Get status color
  const getStatusColor = (status: Match['status']) => {
    switch (status) {
      case 'upcoming':
        return '#3182CE';
      case 'ongoing':
        return '#DD6B20';
      case 'completed':
        return '#2E8B57';
      default:
        return '#718096';
    }
  };
  
  // Get match type label
  const getMatchTypeLabel = (type: Match['matchType']) => {
    switch (type) {
      case 'friendly':
        return 'Friendly Match';
      case 'league':
        return 'League Match';
      case 'tournament':
        return 'Tournament Match';
      case 'practice':
        return 'Practice Match';
      default:
        return 'Cricket Match';
    }
  };
  
  // Initial load
  useEffect(() => {
    fetchMatches();
  }, []);
  
  // Filter matches
  const filteredMatches = matches.filter(match => {
    if (filter === 'upcoming') return match.status === 'upcoming';
    if (filter === 'completed') return match.status === 'completed';
    return true;
  });
  
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
      {/* Filter tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterTab, filter === 'all' && styles.activeFilterTab]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
            All
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterTab, filter === 'upcoming' && styles.activeFilterTab]}
          onPress={() => setFilter('upcoming')}
        >
          <Text style={[styles.filterText, filter === 'upcoming' && styles.activeFilterText]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterTab, filter === 'completed' && styles.activeFilterTab]}
          onPress={() => setFilter('completed')}
        >
          <Text style={[styles.filterText, filter === 'completed' && styles.activeFilterText]}>
            Completed
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Start live scoring button */}
      <Card style={styles.createMatchCard}>
        <View style={styles.createMatchContent}>
          <MaterialCommunityIcons name="cricket" size={28} color="#2E8B57" />
          <View style={styles.createMatchText}>
            <Text style={styles.createMatchTitle}>Start Scoring a Match</Text>
            <Text style={styles.createMatchDescription}>
              Track ball-by-ball commentary, scores, and statistics
            </Text>
          </View>
        </View>
        
        <Button
          title="Start Live Scoring"
          onPress={navigateToLiveScoring}
          style={styles.createMatchButton}
        />
      </Card>
      
      {/* Matches list */}
      <FlatList
        data={filteredMatches}
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
            <MaterialCommunityIcons name="cricket" size={48} color="#CBD5E0" />
            <Text style={styles.emptyText}>No matches found</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'upcoming' 
                ? 'You have no upcoming matches' 
                : filter === 'completed' 
                  ? 'You have no completed matches'
                  : 'Start by creating a new match'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            onPress={() => navigateToMatch(item.id)}
            activeOpacity={0.7}
          >
            <Card style={styles.matchCard}>
              <View style={styles.matchHeader}>
                <View style={styles.matchTypeContainer}>
                  <Text style={styles.matchType}>{getMatchTypeLabel(item.matchType)}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.statusText}>{item.status}</Text>
                  </View>
                </View>
                
                <View style={styles.matchInfo}>
                  <Feather name="map-pin" size={14} color="#718096" />
                  <Text style={styles.venueText}>{item.venue}</Text>
                </View>
                
                <View style={styles.matchInfo}>
                  <Feather name="calendar" size={14} color="#718096" />
                  <Text style={styles.dateText}>{formatDate(item.date)}</Text>
                </View>
              </View>
              
              <View style={styles.teamsContainer}>
                <View style={styles.teamSection}>
                  <Text style={styles.teamName}>{item.team1}</Text>
                  <Text style={styles.teamScore}>{item.team1Score || '-'}</Text>
                </View>
                
                <View style={styles.vsContainer}>
                  <Text style={styles.vsText}>VS</Text>
                </View>
                
                <View style={styles.teamSection}>
                  <Text style={styles.teamName}>{item.team2}</Text>
                  <Text style={styles.teamScore}>{item.team2Score || '-'}</Text>
                </View>
              </View>
              
              {item.status === 'completed' && item.result && (
                <View style={styles.resultContainer}>
                  <Text style={styles.resultText}>{item.result}</Text>
                </View>
              )}
              
              <View style={styles.matchFooter}>
                <View style={styles.matchDetail}>
                  <MaterialCommunityIcons name="cricket" size={16} color="#718096" />
                  <Text style={styles.matchDetailText}>{item.overs} Overs</Text>
                </View>
                
                {item.status === 'ongoing' && (
                  <Button
                    title="Continue Scoring"
                    size="sm"
                    onPress={() => navigateToLiveScoring()}
                    style={styles.scoreButton}
                  />
                )}
              </View>
            </Card>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 4,
  },
  activeFilterTab: {
    backgroundColor: '#E6F7EF',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#718096',
  },
  activeFilterText: {
    color: '#2E8B57',
  },
  createMatchCard: {
    margin: 16,
    marginBottom: 8,
  },
  createMatchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  createMatchText: {
    marginLeft: 12,
    flex: 1,
  },
  createMatchTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F3B4D',
    marginBottom: 4,
  },
  createMatchDescription: {
    fontSize: 12,
    color: '#718096',
  },
  createMatchButton: {
    borderRadius: 8,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  matchCard: {
    marginBottom: 16,
    padding: 0,
    overflow: 'hidden',
  },
  matchHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  matchTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  matchType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F3B4D',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  matchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  venueText: {
    fontSize: 12,
    color: '#718096',
    marginLeft: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#718096',
    marginLeft: 4,
  },
  teamsContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  teamSection: {
    flex: 2,
    alignItems: 'center',
  },
  vsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F3B4D',
    marginBottom: 8,
    textAlign: 'center',
  },
  teamScore: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E8B57',
    textAlign: 'center',
  },
  vsText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#718096',
  },
  resultContainer: {
    padding: 12,
    backgroundColor: '#E6F7EF',
    alignItems: 'center',
  },
  resultText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E8B57',
  },
  matchFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  matchDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchDetailText: {
    fontSize: 12,
    color: '#718096',
    marginLeft: 4,
  },
  scoreButton: {
    paddingHorizontal: 12,
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
    textAlign: 'center',
  },
});

export default MatchesScreen;