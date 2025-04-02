/**
 * Cricket Data Service
 * Handles fetching and processing cricket data from external APIs
 */

import fetch from 'node-fetch';
import { CricketAPIClient, MatchData } from './cricket-api-client';

export interface MatchInfo {
  id: string;
  title: string;
  teams: {
    team1: {
      name: string;
      logo: string;
      score?: string;
    };
    team2: {
      name: string;
      logo: string;
      score?: string;
    };
  };
  status: 'upcoming' | 'live' | 'completed';
  result?: string;
  date: string;
  time: string;
  venue: string;
  type: string;
  imageUrl?: string;
}

export interface MatchesResponse {
  matches: MatchInfo[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
  };
}

// Initialize the cricket API client
const cricketApiClient = new CricketAPIClient();

/**
 * Cricket data service methods
 */
export default {
  /**
   * Get recent cricket matches
   */
  async getRecentMatches(): Promise<MatchInfo[]> {
    try {
      const matches = await cricketApiClient.getRecentMatches();
      return matches;
    } catch (error) {
      console.error('Error fetching recent matches:', error);
      throw error;
    }
  },

  /**
   * Get live cricket matches
   */
  async getLiveMatches(): Promise<MatchInfo[]> {
    try {
      const matches = await cricketApiClient.getLiveMatches();
      return matches;
    } catch (error) {
      console.error('Error fetching live matches:', error);
      throw error;
    }
  },

  /**
   * Get match details by ID
   */
  async getMatchDetails(matchId: string): Promise<any> {
    try {
      const matchDetails = await cricketApiClient.getMatchDetails(matchId);
      return matchDetails;
    } catch (error) {
      console.error(`Error fetching match details for ${matchId}:`, error);
      throw error;
    }
  },

  /**
   * Get match highlights
   */
  async getMatchHighlights(): Promise<any[]> {
    try {
      const highlights = await cricketApiClient.getMatchHighlights();
      return highlights;
    } catch (error) {
      console.error('Error fetching match highlights:', error);
      throw error;
    }
  },

  /**
   * Get all cricket matches (live, recent, upcoming)
   */
  async getAllMatches(): Promise<MatchesResponse> {
    try {
      // Use the RapidAPI endpoint and key
      const url = 'https://cricbuzz-cricket.p.rapidapi.com/matches/v1/recent';
      const options = {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': '4b04aa9514msh041be25d5e7d749p157f79jsn3a91d53cb9f6',
          'X-RapidAPI-Host': 'cricbuzz-cricket.p.rapidapi.com'
        }
      };

      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`Failed to fetch matches: ${response.status}`);
      }

      const rawData = await response.json();
      
      // Process and format the response data
      const matches: MatchInfo[] = [];
      let processedMatches = 0;
      
      if (rawData.typeMatches && Array.isArray(rawData.typeMatches)) {
        for (const typeMatch of rawData.typeMatches) {
          if (typeMatch.seriesMatches && Array.isArray(typeMatch.seriesMatches)) {
            for (const seriesMatch of typeMatch.seriesMatches) {
              if (seriesMatch.seriesAdWrapper && seriesMatch.seriesAdWrapper.matches) {
                for (const match of seriesMatch.seriesAdWrapper.matches) {
                  if (match.matchInfo) {
                    const { matchInfo, matchScore } = match;
                    
                    // Determine match status
                    let status: 'upcoming' | 'live' | 'completed' = 'upcoming';
                    if (matchInfo.state === 'Complete') {
                      status = 'completed';
                    } else if (['In Progress', 'Live', 'Innings Break'].includes(matchInfo.state)) {
                      status = 'live';
                    }
                    
                    // Format team scores
                    const formatTeamScore = (teamScore: any): string => {
                      if (!teamScore) return '';
                      
                      let scoreStr = '';
                      if (teamScore.inngs1) {
                        const { runs, wickets, overs } = teamScore.inngs1;
                        scoreStr += `${runs}/${wickets} (${formatOvers(overs)})`;
                      }
                      
                      if (teamScore.inngs2) {
                        const { runs, wickets, overs } = teamScore.inngs2;
                        scoreStr += ` & ${runs}/${wickets} (${formatOvers(overs)})`;
                      }
                      
                      return scoreStr;
                    };
                    
                    // Format overs (handle decimal part for partial overs)
                    const formatOvers = (overs: number): string => {
                      const fullOvers = Math.floor(overs);
                      const balls = Math.round((overs - fullOvers) * 10);
                      return balls > 0 ? `${fullOvers}.${balls}` : `${fullOvers}`;
                    };
                    
                    // Format date and time
                    const startDate = new Date(parseInt(matchInfo.startDate));
                    const formattedDate = startDate.toISOString().split('T')[0];
                    const formattedTime = startDate.toTimeString().substring(0, 5);
                    
                    // Default logos for teams
                    const getTeamLogo = (teamName: string) => {
                      const teamMap: Record<string, string> = {
                        'India': 'https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160/lsci/db/PICTURES/CMS/313100/313128.logo.png',
                        'Australia': 'https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160/lsci/db/PICTURES/CMS/340400/340493.png',
                        'England': 'https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160/lsci/db/PICTURES/CMS/313100/313114.logo.png',
                        'South Africa': 'https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160/lsci/db/PICTURES/CMS/313100/313125.logo.png',
                        'New Zealand': 'https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160/lsci/db/PICTURES/CMS/340500/340503.png',
                        'Pakistan': 'https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160/lsci/db/PICTURES/CMS/313100/313129.logo.png',
                        'West Indies': 'https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160/lsci/db/PICTURES/CMS/317600/317615.png',
                        'Sri Lanka': 'https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160/lsci/db/PICTURES/CMS/340000/340047.png',
                        'Bangladesh': 'https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160/lsci/db/PICTURES/CMS/341400/341456.png',
                        'Afghanistan': 'https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160/lsci/db/PICTURES/CMS/321000/321005.png'
                      };
                      
                      return teamMap[teamName] || `https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160/lsci/db/PICTURES/CMS/313200/313200.logo.png`;
                    };
                    
                    // Add match to our collection
                    matches.push({
                      id: matchInfo.matchId.toString(),
                      title: `${matchInfo.team1.teamName} vs ${matchInfo.team2.teamName}, ${matchInfo.matchDesc}`,
                      teams: {
                        team1: {
                          name: matchInfo.team1.teamName,
                          logo: getTeamLogo(matchInfo.team1.teamName),
                          score: formatTeamScore(matchScore?.team1Score)
                        },
                        team2: {
                          name: matchInfo.team2.teamName,
                          logo: getTeamLogo(matchInfo.team2.teamName),
                          score: formatTeamScore(matchScore?.team2Score)
                        }
                      },
                      status,
                      result: matchInfo.status,
                      date: formattedDate,
                      time: formattedTime,
                      venue: `${matchInfo.venueInfo.ground}, ${matchInfo.venueInfo.city}`,
                      type: matchInfo.matchFormat,
                      imageUrl: `https://img1.hscicdn.com/image/upload/f_auto,t_ds_wide_w_1280/lsci/db/PICTURES/CMS/3${Math.floor(Math.random() * 40) + 10}000/${Math.floor(Math.random() * 9000) + 1000}.6.jpg`
                    });
                    
                    processedMatches++;
                  }
                }
              }
            }
          }
        }
      }
      
      return {
        matches,
        meta: {
          total: processedMatches,
          page: 1,
          pageSize: processedMatches
        }
      };
    } catch (error) {
      console.error('Failed to fetch matches:', error);
      throw error;
    }
  }
};