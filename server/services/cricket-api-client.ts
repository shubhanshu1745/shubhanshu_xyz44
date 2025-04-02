import fetch from 'node-fetch';

interface Team {
  name: string;
  logo: string;
  score?: string;
}

export interface MatchData {
  id: string;
  title: string;
  teams: {
    team1: Team;
    team2: Team;
  };
  status: "upcoming" | "live" | "completed";
  result?: string;
  date: string;
  time: string;
  venue: string;
  type: string;
  imageUrl?: string;
}

interface MatchSummary {
  id: number;
  matchType: string;
  status: string;
  venue: string;
  date: string;
  team1: { name: string; score: string; };
  team2: { name: string; score: string; };
  result: string;
}

interface MatchDetails {
  title: string;
  matchType: string;
  status: string;
  venue: string;
  date: string;
  time: string;
  teams: {
    team1: { name: string; logo: string; score: string; };
    team2: { name: string; logo: string; score: string; };
  };
  result: string;
  scorecard: {
    innings: Array<{
      team: string;
      score: string;
      wickets: number;
      overs: string;
      battingScores: Array<{
        batsman: string;
        runs: number;
        balls: number;
        fours: number;
        sixes: number;
        strikeRate: number;
        dismissal: string;
      }>;
      bowlingFigures: Array<{
        bowler: string;
        overs: string;
        maidens: number;
        runs: number;
        wickets: number;
        economy: number;
      }>;
    }>;
  };
}

interface HighlightVideo {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  tags: string[];
  duration: string;
  date: string;
}

/**
 * Cricket API Client for accessing live scores, match details and highlights
 */
export class CricketAPIClient {
  private readonly USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  
  /**
   * Get current live matches
   */
  public async getLiveMatches(): Promise<MatchData[]> {
    try {
      // First try to get from Cricbuzz
      const matches = await this.getCricbuzzLiveMatches();
      if (matches && matches.length > 0) {
        return matches;
      }
      
      // Fallback to ESPNCricinfo
      return await this.getESPNCricinfoLiveMatches();
    } catch (error) {
      console.error('Error fetching live matches:', error);
      return this.getFallbackLiveMatches();
    }
  }
  
  /**
   * Get match highlights
   */
  public async getMatchHighlights(): Promise<HighlightVideo[]> {
    try {
      // Try to get from the web
      return await this.getCricketHighlights();
    } catch (error) {
      console.error('Error fetching match highlights:', error);
      return this.getFallbackHighlights();
    }
  }
  
  /**
   * Get match details
   */
  public async getMatchDetails(matchId: string): Promise<MatchDetails | null> {
    try {
      // Try to get from the web
      return await this.fetchMatchDetails(matchId);
    } catch (error) {
      console.error(`Error fetching match details for ${matchId}:`, error);
      return this.getFallbackMatchDetails(matchId);
    }
  }
  
  /**
   * Get match history (recent completed matches)
   */
  public async getRecentMatches(): Promise<MatchData[]> {
    try {
      // Try to get from API
      return await this.getRecentCompletedMatches();
    } catch (error) {
      console.error('Error fetching recent matches:', error);
      return this.getFallbackRecentMatches();
    }
  }
  
  /**
   * Try to get live matches from Cricbuzz
   */
  private async getCricbuzzLiveMatches(): Promise<MatchData[]> {
    try {
      const headers = {
        'User-Agent': this.USER_AGENT,
        'Accept': 'application/json',
        'Referer': 'https://www.cricbuzz.com/'
      };
      
      // Using a more reliable endpoint from Cricbuzz
      const response = await fetch('https://www.cricbuzz.com/api/cricket-match/commentary/live', {
        headers
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch from Cricbuzz: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transform the data to our format
      const matches: MatchData[] = [];
      
      // Process data and add to matches array
      // This would need to be adapted based on the actual response structure
      
      return matches;
    } catch (error) {
      console.error('Error getting Cricbuzz live matches:', error);
      return [];
    }
  }
  
  /**
   * Try to get live matches from ESPNCricinfo
   */
  private async getESPNCricinfoLiveMatches(): Promise<MatchData[]> {
    try {
      const headers = {
        'User-Agent': this.USER_AGENT,
        'Accept': 'application/json',
        'Referer': 'https://www.espncricinfo.com/'
      };
      
      const response = await fetch('https://hs-consumer-api.espncricinfo.com/v1/pages/matches/current?lang=en&latest=true', {
        headers
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch from ESPNCricinfo: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transform the data to our format
      const matches: MatchData[] = [];
      
      // Process data and add to matches array
      // This would need to be adapted based on the actual response structure
      
      return matches;
    } catch (error) {
      console.error('Error getting ESPNCricinfo live matches:', error);
      return [];
    }
  }
  
  /**
   * Get cricket highlights from YouTube API
   */
  private async getCricketHighlights(): Promise<HighlightVideo[]> {
    try {
      // Use YouTube API to get cricket highlights
      // This requires an API key
      
      // For now, return fallback data
      return this.getFallbackHighlights();
    } catch (error) {
      console.error('Error getting cricket highlights:', error);
      return this.getFallbackHighlights();
    }
  }
  
  /**
   * Fetch details for a specific match
   */
  private async fetchMatchDetails(matchId: string): Promise<MatchDetails | null> {
    try {
      // Fetch match details from appropriate API
      
      // For now, return fallback data
      return this.getFallbackMatchDetails(matchId);
    } catch (error) {
      console.error(`Error fetching match details for ${matchId}:`, error);
      return null;
    }
  }
  
  /**
   * Get recent completed matches
   */
  private async getRecentCompletedMatches(): Promise<MatchData[]> {
    try {
      // Fetch recent matches from appropriate API
      
      // For now, return fallback data
      return this.getFallbackRecentMatches();
    } catch (error) {
      console.error('Error getting recent matches:', error);
      return [];
    }
  }
  
  /**
   * Get fallback live matches data
   */
  private getFallbackLiveMatches(): MatchData[] {
    return [
      {
        id: "1",
        title: "India vs Australia, 1st T20I",
        teams: {
          team1: {
            name: "India",
            logo: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160/lsci/db/PICTURES/CMS/313100/313128.logo.png",
            score: "208/6 (20)"
          },
          team2: {
            name: "Australia",
            logo: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160/lsci/db/PICTURES/CMS/340400/340493.png",
            score: "194/9 (20)"
          }
        },
        status: "live",
        result: "India need 24 runs from 18 balls",
        date: "2025-04-02",
        time: "19:00",
        venue: "Sydney Cricket Ground, Sydney",
        type: "T20"
      },
      {
        id: "2",
        title: "England vs South Africa, 3rd ODI",
        teams: {
          team1: {
            name: "England",
            logo: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160/lsci/db/PICTURES/CMS/313100/313114.logo.png",
            score: "285/7 (42.3)"
          },
          team2: {
            name: "South Africa",
            logo: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160/lsci/db/PICTURES/CMS/313100/313125.logo.png",
            score: "283/6 (50)"
          }
        },
        status: "live",
        date: "2025-04-02",
        time: "14:00",
        venue: "Lord's, London",
        type: "ODI"
      }
    ];
  }
  
  /**
   * Get fallback match highlights data
   */
  private getFallbackHighlights(): HighlightVideo[] {
    return [
      {
        id: "h1",
        title: "India vs Australia 1st T20I - Match Highlights",
        url: "https://youtu.be/example1",
        thumbnail: "https://i.ytimg.com/vi/example1/maxresdefault.jpg",
        views: 1500000,
        likes: 45000,
        comments: 3200,
        shares: 5600,
        tags: ["India", "Australia", "T20", "Highlights"],
        duration: "15:32",
        date: "2025-04-01"
      },
      {
        id: "h2",
        title: "England's Record Chase Against South Africa - Full Highlights",
        url: "https://youtu.be/example2",
        thumbnail: "https://i.ytimg.com/vi/example2/maxresdefault.jpg",
        views: 980000,
        likes: 32000,
        comments: 2100,
        shares: 4100,
        tags: ["England", "South Africa", "ODI", "Highlights", "Record Chase"],
        duration: "12:45",
        date: "2025-04-01"
      },
      {
        id: "h3",
        title: "Virat Kohli's Century Against Australia - Extended Highlights",
        url: "https://youtu.be/example3",
        thumbnail: "https://i.ytimg.com/vi/example3/maxresdefault.jpg",
        views: 2200000,
        likes: 85000,
        comments: 7500,
        shares: 12000,
        tags: ["Virat Kohli", "Century", "India", "Australia", "Highlights"],
        duration: "18:20",
        date: "2025-03-30"
      },
      {
        id: "h4",
        title: "Jos Buttler's Explosive Innings - 86 off 37 Balls",
        url: "https://youtu.be/example4",
        thumbnail: "https://i.ytimg.com/vi/example4/maxresdefault.jpg",
        views: 1100000,
        likes: 41000,
        comments: 3500,
        shares: 6200,
        tags: ["Jos Buttler", "England", "T20", "Explosive Innings"],
        duration: "10:15",
        date: "2025-03-30"
      },
      {
        id: "h5",
        title: "Bangladesh vs New Zealand - 2nd Test Day 5 Highlights",
        url: "https://youtu.be/example5",
        thumbnail: "https://i.ytimg.com/vi/example5/maxresdefault.jpg",
        views: 750000,
        likes: 28000,
        comments: 1800,
        shares: 3200,
        tags: ["Bangladesh", "New Zealand", "Test", "Highlights"],
        duration: "20:08",
        date: "2025-03-29"
      },
      {
        id: "h6",
        title: "Epic Last Over Finish - Pakistan vs West Indies",
        url: "https://youtu.be/example6",
        thumbnail: "https://i.ytimg.com/vi/example6/maxresdefault.jpg",
        views: 1300000,
        likes: 52000,
        comments: 4800,
        shares: 9500,
        tags: ["Pakistan", "West Indies", "Last Over", "T20", "Thriller"],
        duration: "8:42",
        date: "2025-03-28"
      }
    ];
  }
  
  /**
   * Get fallback match details
   */
  private getFallbackMatchDetails(matchId: string): MatchDetails {
    return {
      title: "India vs Australia, 1st T20I",
      matchType: "T20I",
      status: "live",
      venue: "Sydney Cricket Ground, Sydney",
      date: "2025-04-02",
      time: "19:00",
      teams: {
        team1: {
          name: "India", 
          logo: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160/lsci/db/PICTURES/CMS/313100/313128.logo.png",
          score: "208/6 (20)"
        },
        team2: {
          name: "Australia", 
          logo: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160/lsci/db/PICTURES/CMS/340400/340493.png",
          score: "194/9 (20)"
        }
      },
      result: "India won by 14 runs",
      scorecard: {
        innings: [
          {
            team: "India",
            score: "208/6",
            wickets: 6,
            overs: "20.0",
            battingScores: [
              { batsman: "Rohit Sharma (c)", runs: 82, balls: 43, fours: 8, sixes: 5, strikeRate: 190.7, dismissal: "c Cummins b Starc" },
              { batsman: "KL Rahul", runs: 45, balls: 28, fours: 5, sixes: 2, strikeRate: 160.7, dismissal: "b Hazlewood" },
              { batsman: "Virat Kohli", runs: 35, balls: 21, fours: 3, sixes: 2, strikeRate: 166.7, dismissal: "c Finch b Zampa" },
              { batsman: "Rishabh Pant (wk)", runs: 21, balls: 12, fours: 1, sixes: 2, strikeRate: 175.0, dismissal: "not out" },
              { batsman: "Hardik Pandya", runs: 15, balls: 9, fours: 1, sixes: 1, strikeRate: 166.7, dismissal: "c Carey b Cummins" },
              { batsman: "Ravindra Jadeja", runs: 8, balls: 5, fours: 1, sixes: 0, strikeRate: 160.0, dismissal: "run out" },
              { batsman: "Axar Patel", runs: 2, balls: 2, fours: 0, sixes: 0, strikeRate: 100.0, dismissal: "not out" }
            ],
            bowlingFigures: [
              { bowler: "Mitchell Starc", overs: "4.0", maidens: 0, runs: 42, wickets: 2, economy: 10.50 },
              { bowler: "Josh Hazlewood", overs: "4.0", maidens: 0, runs: 36, wickets: 1, economy: 9.00 },
              { bowler: "Pat Cummins", overs: "4.0", maidens: 0, runs: 45, wickets: 1, economy: 11.25 },
              { bowler: "Adam Zampa", overs: "4.0", maidens: 0, runs: 38, wickets: 1, economy: 9.50 },
              { bowler: "Marcus Stoinis", overs: "2.0", maidens: 0, runs: 25, wickets: 0, economy: 12.50 },
              { bowler: "Glenn Maxwell", overs: "2.0", maidens: 0, runs: 22, wickets: 0, economy: 11.00 }
            ]
          },
          {
            team: "Australia",
            score: "194/9",
            wickets: 9,
            overs: "20.0",
            battingScores: [
              { batsman: "Aaron Finch (c)", runs: 38, balls: 26, fours: 3, sixes: 2, strikeRate: 146.2, dismissal: "b Bumrah" },
              { batsman: "David Warner", runs: 56, balls: 36, fours: 6, sixes: 2, strikeRate: 155.6, dismissal: "b Chahal" },
              { batsman: "Steve Smith", runs: 28, balls: 21, fours: 2, sixes: 1, strikeRate: 133.3, dismissal: "lbw b Jadeja" },
              { batsman: "Glenn Maxwell", runs: 31, balls: 14, fours: 2, sixes: 3, strikeRate: 221.4, dismissal: "b Bumrah" },
              { batsman: "Marcus Stoinis", runs: 15, balls: 10, fours: 1, sixes: 1, strikeRate: 150.0, dismissal: "c Jadeja b Bumrah" },
              { batsman: "Alex Carey (wk)", runs: 12, balls: 7, fours: 1, sixes: 0, strikeRate: 171.4, dismissal: "b Chahal" },
              { batsman: "Pat Cummins", runs: 5, balls: 3, fours: 0, sixes: 0, strikeRate: 166.7, dismissal: "run out" },
              { batsman: "Mitchell Starc", runs: 4, balls: 2, fours: 1, sixes: 0, strikeRate: 200.0, dismissal: "c Kohli b Thakur" },
              { batsman: "Adam Zampa", runs: 1, balls: 1, fours: 0, sixes: 0, strikeRate: 100.0, dismissal: "c Pant b Thakur" },
              { batsman: "Josh Hazlewood", runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0.0, dismissal: "not out" }
            ],
            bowlingFigures: [
              { bowler: "Jasprit Bumrah", overs: "4.0", maidens: 0, runs: 31, wickets: 3, economy: 7.75 },
              { bowler: "Bhuvneshwar Kumar", overs: "4.0", maidens: 0, runs: 39, wickets: 0, economy: 9.75 },
              { bowler: "Shardul Thakur", overs: "4.0", maidens: 0, runs: 45, wickets: 2, economy: 11.25 },
              { bowler: "Yuzvendra Chahal", overs: "4.0", maidens: 0, runs: 36, wickets: 2, economy: 9.00 },
              { bowler: "Ravindra Jadeja", overs: "2.0", maidens: 0, runs: 25, wickets: 1, economy: 12.50 },
              { bowler: "Hardik Pandya", overs: "2.0", maidens: 0, runs: 18, wickets: 0, economy: 9.00 }
            ]
          }
        ]
      }
    };
  }
  
  /**
   * Get fallback recent matches
   */
  private getFallbackRecentMatches(): MatchData[] {
    return [
      {
        id: "3",
        title: "Pakistan vs West Indies, 2nd ODI",
        teams: {
          team1: {
            name: "Pakistan",
            logo: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160/lsci/db/PICTURES/CMS/313100/313129.logo.png",
            score: "320/7 (50)"
          },
          team2: {
            name: "West Indies",
            logo: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160/lsci/db/PICTURES/CMS/317600/317615.png",
            score: "305/8 (50)"
          }
        },
        status: "completed",
        result: "Pakistan won by 15 runs",
        date: "2025-04-01",
        time: "14:00",
        venue: "National Stadium, Karachi",
        type: "ODI",
        imageUrl: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_wide_w_1280/lsci/db/PICTURES/CMS/336700/336783.6.jpg"
      },
      {
        id: "4",
        title: "New Zealand vs Bangladesh, 1st Test",
        teams: {
          team1: {
            name: "New Zealand",
            logo: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160/lsci/db/PICTURES/CMS/340500/340503.png",
            score: "342 & 285/5d"
          },
          team2: {
            name: "Bangladesh",
            logo: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160/lsci/db/PICTURES/CMS/341400/341456.png",
            score: "298 & 213"
          }
        },
        status: "completed",
        result: "New Zealand won by 116 runs",
        date: "2025-03-28",
        time: "10:00",
        venue: "Basin Reserve, Wellington",
        type: "Test",
        imageUrl: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_wide_w_1280/lsci/db/PICTURES/CMS/336800/336846.6.jpg"
      },
      {
        id: "5",
        title: "Sri Lanka vs Afghanistan, 3rd T20I",
        teams: {
          team1: {
            name: "Sri Lanka",
            logo: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160/lsci/db/PICTURES/CMS/340000/340047.png",
            score: "175/6 (20)"
          },
          team2: {
            name: "Afghanistan",
            logo: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160/lsci/db/PICTURES/CMS/321000/321005.png",
            score: "146/9 (20)"
          }
        },
        status: "completed",
        result: "Sri Lanka won by 29 runs",
        date: "2025-03-25",
        time: "19:00",
        venue: "Pallekele International Cricket Stadium",
        type: "T20",
        imageUrl: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_wide_w_1280/lsci/db/PICTURES/CMS/336900/336910.6.jpg"
      }
    ];
  }
}

// Export singleton instance
export const cricketAPIClient = new CricketAPIClient();
export default cricketAPIClient;