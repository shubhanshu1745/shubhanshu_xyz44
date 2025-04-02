import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import useAuth from '../hooks/useAuth';
import apiClient from '../lib/api';
import Card from '../components/ui/Card';

type StatsScreenRouteProp = RouteProp<RootStackParamList, 'Stats'>;

interface PlayerStats {
  id: number;
  userId: number;
  matchesPlayed: number;
  runsScored: number;
  ballsFaced: number;
  fifties: number;
  hundreds: number;
  highestScore: number;
  battingAverage: number;
  battingStrikeRate: number;
  wicketsTaken: number;
  ballsBowled: number;
  runsConceded: number;
  bowlingAverage: number;
  bowlingStrikeRate: number;
  economy: number;
  bestBowling: string;
  catches: number;
  stumpings: number;
  runOuts: number;
  playerOfMatchAwards: number;
  battingStyle: string | null;
  bowlingStyle: string | null;
  position: string | null;
}

const StatsScreen: React.FC = () => {
  const route = useRoute<StatsScreenRouteProp>();
  const { user } = useAuth();
  
  // Get userId from route params or use current user's id
  const userId = route.params?.userId || user?.id;
  
  // State
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'batting' | 'bowling' | 'fielding'>('batting');
  
  // Fetch player stats
  const fetchStats = async () => {
    try {
      if (!userId) return;
      
      setLoading(true);
      const playerStats = await apiClient.getPlayerStats(userId);
      setStats(playerStats);
    } catch (error) {
      console.error('Error fetching player stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };
  
  // Initial load
  useEffect(() => {
    fetchStats();
  }, [userId]);
  
  // Loading state
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E8B57" />
      </View>
    );
  }
  
  // Empty state
  if (!stats) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="cricket" size={64} color="#CBD5E0" />
        <Text style={styles.emptyText}>No stats available</Text>
        <Text style={styles.emptySubtext}>Play matches to start tracking your cricket statistics</Text>
      </View>
    );
  }
  
  // Render batting stats
  const renderBattingStats = () => (
    <Card style={styles.statsCard}>
      <View style={styles.statRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.runsScored}</Text>
          <Text style={styles.statLabel}>Runs</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.highestScore}</Text>
          <Text style={styles.statLabel}>Highest Score</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.battingAverage.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Average</Text>
        </View>
      </View>
      
      <View style={styles.statDividerHorizontal} />
      
      <View style={styles.statRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.battingStrikeRate.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Strike Rate</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.fifties}</Text>
          <Text style={styles.statLabel}>50s</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.hundreds}</Text>
          <Text style={styles.statLabel}>100s</Text>
        </View>
      </View>
      
      <View style={styles.detailSection}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Matches</Text>
          <Text style={styles.detailValue}>{stats.matchesPlayed}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Balls Faced</Text>
          <Text style={styles.detailValue}>{stats.ballsFaced}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Batting Style</Text>
          <Text style={styles.detailValue}>{stats.battingStyle || 'Not specified'}</Text>
        </View>
      </View>
    </Card>
  );
  
  // Render bowling stats
  const renderBowlingStats = () => (
    <Card style={styles.statsCard}>
      <View style={styles.statRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.wicketsTaken}</Text>
          <Text style={styles.statLabel}>Wickets</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.bestBowling}</Text>
          <Text style={styles.statLabel}>Best Bowling</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.bowlingAverage.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Average</Text>
        </View>
      </View>
      
      <View style={styles.statDividerHorizontal} />
      
      <View style={styles.statRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.economy.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Economy</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.bowlingStrikeRate.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Strike Rate</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.runsConceded}</Text>
          <Text style={styles.statLabel}>Runs Conceded</Text>
        </View>
      </View>
      
      <View style={styles.detailSection}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Matches</Text>
          <Text style={styles.detailValue}>{stats.matchesPlayed}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Balls Bowled</Text>
          <Text style={styles.detailValue}>{stats.ballsBowled}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Bowling Style</Text>
          <Text style={styles.detailValue}>{stats.bowlingStyle || 'Not specified'}</Text>
        </View>
      </View>
    </Card>
  );
  
  // Render fielding stats
  const renderFieldingStats = () => (
    <Card style={styles.statsCard}>
      <View style={styles.statRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.catches}</Text>
          <Text style={styles.statLabel}>Catches</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.stumpings}</Text>
          <Text style={styles.statLabel}>Stumpings</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.runOuts}</Text>
          <Text style={styles.statLabel}>Run Outs</Text>
        </View>
      </View>
      
      <View style={styles.detailSection}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Matches</Text>
          <Text style={styles.detailValue}>{stats.matchesPlayed}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Player of Match</Text>
          <Text style={styles.detailValue}>{stats.playerOfMatchAwards}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Position</Text>
          <Text style={styles.detailValue}>{stats.position || 'Not specified'}</Text>
        </View>
      </View>
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
      {/* Summary Card */}
      <Card style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Career Summary</Text>
        
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <MaterialCommunityIcons name="cricket" size={24} color="#2E8B57" />
            <Text style={styles.summaryValue}>{stats.matchesPlayed}</Text>
            <Text style={styles.summaryLabel}>Matches</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <MaterialCommunityIcons name="home-run" size={24} color="#2E8B57" />
            <Text style={styles.summaryValue}>{stats.runsScored}</Text>
            <Text style={styles.summaryLabel}>Runs</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <MaterialCommunityIcons name="bowling" size={24} color="#2E8B57" />
            <Text style={styles.summaryValue}>{stats.wicketsTaken}</Text>
            <Text style={styles.summaryLabel}>Wickets</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <MaterialCommunityIcons name="trophy-outline" size={24} color="#2E8B57" />
            <Text style={styles.summaryValue}>{stats.playerOfMatchAwards}</Text>
            <Text style={styles.summaryLabel}>POTM</Text>
          </View>
        </View>
      </Card>
      
      {/* Tab navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'batting' && styles.activeTab]}
          onPress={() => setActiveTab('batting')}
        >
          <Text style={[styles.tabText, activeTab === 'batting' && styles.activeTabText]}>
            Batting
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'bowling' && styles.activeTab]}
          onPress={() => setActiveTab('bowling')}
        >
          <Text style={[styles.tabText, activeTab === 'bowling' && styles.activeTabText]}>
            Bowling
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'fielding' && styles.activeTab]}
          onPress={() => setActiveTab('fielding')}
        >
          <Text style={[styles.tabText, activeTab === 'fielding' && styles.activeTabText]}>
            Fielding
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Tab content */}
      {activeTab === 'batting' && renderBattingStats()}
      {activeTab === 'bowling' && renderBowlingStats()}
      {activeTab === 'fielding' && renderFieldingStats()}
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
    padding: 16,
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
    textAlign: 'center',
    marginTop: 8,
  },
  summaryCard: {
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F3B4D',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F3B4D',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#718096',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tab: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#2E8B57',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A5568',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  statsCard: {
    padding: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F3B4D',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#718096',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    alignSelf: 'stretch',
  },
  statDividerHorizontal: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  detailSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#718096',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F3B4D',
  },
});

export default StatsScreen;