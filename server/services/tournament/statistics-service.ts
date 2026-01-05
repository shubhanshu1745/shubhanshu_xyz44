import { storage } from '../../storage';
import * as schema from '@shared/schema';

/**
 * Updates tournament statistics based on player performance in a match
 */
export async function updatePlayerStatistics(tournamentId: number, matchId: number) {
  try {
    const match = await storage.getTournamentMatch(matchId);
    
    if (!match || match.status !== "completed") {
      throw new Error("Match not found or not completed");
    }
    
    const performances = await storage.getMatchPerformances(matchId);
    
    if (!performances || performances.length === 0) {
      return;
    }
    
    for (const performance of performances) {
      const existingStats = await storage.getPlayerTournamentStats(tournamentId, performance.userId);
      
      const runsScored = performance.runsScored || 0;
      const ballsFaced = performance.ballsFaced || 0;
      const fours = performance.fours || 0;
      const sixes = performance.sixes || 0;
      const wicketsTaken = performance.wicketsTaken || 0;
      const oversBowled = performance.oversBowled ? parseFloat(performance.oversBowled) : 0;
      const runsConceded = performance.runsConceded || 0;
      const catches = performance.catches || 0;
      const runOuts = performance.runOuts || 0;
      const stumpings = performance.stumpings || 0;
      
      if (existingStats) {
        const newMatches = (existingStats.matches || 0) + 1;
        const newRuns = (existingStats.runs || 0) + runsScored;
        const newBalls = (existingStats.ballsFaced || 0) + ballsFaced;
        const newFours = (existingStats.fours || 0) + fours;
        const newSixes = (existingStats.sixes || 0) + sixes;
        const newWickets = (existingStats.wickets || 0) + wicketsTaken;
        const newOvers = (parseFloat(existingStats.overs?.toString() || "0")) + oversBowled;
        const newRunsConceded = (existingStats.runsConceded || 0) + runsConceded;
        const newCatches = (existingStats.catches || 0) + catches;
        const newRunOuts = (existingStats.runOuts || 0) + runOuts;
        const newStumpings = (existingStats.stumpings || 0) + stumpings;
        const newFifties = (existingStats.fifties || 0) + (runsScored >= 50 && runsScored < 100 ? 1 : 0);
        const newHundreds = (existingStats.hundreds || 0) + (runsScored >= 100 ? 1 : 0);
        const newHighestScore = Math.max(existingStats.highestScore || 0, runsScored);
        
        const battingAverage = newMatches > 0 ? newRuns / newMatches : 0;
        const strikeRate = newBalls > 0 ? (newRuns / newBalls) * 100 : 0;
        const economyRate = newOvers > 0 ? newRunsConceded / newOvers : 0;
        
        await storage.updatePlayerTournamentStats(tournamentId, performance.userId, {
          matches: newMatches,
          runs: newRuns,
          ballsFaced: newBalls,
          fours: newFours,
          sixes: newSixes,
          fifties: newFifties,
          hundreds: newHundreds,
          highestScore: newHighestScore,
          battingAverage: battingAverage.toFixed(2),
          strikeRate: strikeRate.toFixed(2),
          overs: newOvers.toString(),
          wickets: newWickets,
          runsConceded: newRunsConceded,
          economyRate: economyRate.toFixed(2),
          catches: newCatches,
          runOuts: newRunOuts,
          stumpings: newStumpings,
          lastUpdated: new Date()
        });
      } else {
        const battingAverage = runsScored;
        const strikeRate = ballsFaced > 0 ? (runsScored / ballsFaced) * 100 : 0;
        const economyRate = oversBowled > 0 ? runsConceded / oversBowled : 0;
        
        await storage.createPlayerTournamentStats({
          tournamentId,
          userId: performance.userId,
          matches: 1,
          runs: runsScored,
          ballsFaced: ballsFaced,
          fours: fours,
          sixes: sixes,
          fifties: (runsScored >= 50 && runsScored < 100) ? 1 : 0,
          hundreds: runsScored >= 100 ? 1 : 0,
          highestScore: runsScored,
          battingAverage: battingAverage.toFixed(2),
          strikeRate: strikeRate.toFixed(2),
          overs: oversBowled.toString(),
          wickets: wicketsTaken,
          runsConceded: runsConceded,
          economyRate: economyRate.toFixed(2),
          catches: catches,
          runOuts: runOuts,
          stumpings: stumpings
        });
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error updating player statistics:", error);
    throw error;
  }
}


/**
 * Gets the top performers in a tournament by various statistics
 */
export async function getTopPerformers(tournamentId: number, category: string, limit: number = 10) {
  try {
    const tournament = await storage.getTournament(tournamentId);
    
    if (!tournament) {
      throw new Error(`Tournament with ID ${tournamentId} not found`);
    }
    
    const allStats = await storage.getPlayerTournamentStatsByTournament(tournamentId);
    
    const statsWithUsers = await Promise.all(allStats.map(async (stat) => {
      const user = await storage.getUser(stat.userId);
      return { ...stat, user };
    }));
    
    let sortedStats = [...statsWithUsers];
    
    switch (category.toLowerCase()) {
      case 'runs':
      case 'orange_cap':
        sortedStats.sort((a, b) => (b.runs || 0) - (a.runs || 0));
        break;
        
      case 'wickets':
      case 'purple_cap':
        sortedStats.sort((a, b) => (b.wickets || 0) - (a.wickets || 0));
        break;
        
      case 'batting_average':
        sortedStats = sortedStats.filter(stat => (stat.matches || 0) >= 3);
        sortedStats.sort((a, b) => {
          const avgA = parseFloat(a.battingAverage?.toString() || "0");
          const avgB = parseFloat(b.battingAverage?.toString() || "0");
          return avgB - avgA;
        });
        break;
        
      case 'strike_rate':
        sortedStats = sortedStats.filter(stat => (stat.runs || 0) >= 100);
        sortedStats.sort((a, b) => {
          const srA = parseFloat(a.strikeRate?.toString() || "0");
          const srB = parseFloat(b.strikeRate?.toString() || "0");
          return srB - srA;
        });
        break;
        
      case 'economy_rate':
        sortedStats = sortedStats.filter(stat => {
          const overs = parseFloat(stat.overs?.toString() || "0");
          return overs >= 10;
        });
        sortedStats.sort((a, b) => {
          const erA = parseFloat(a.economyRate?.toString() || "999");
          const erB = parseFloat(b.economyRate?.toString() || "999");
          return erA - erB;
        });
        break;
        
      case 'sixes':
        sortedStats.sort((a, b) => (b.sixes || 0) - (a.sixes || 0));
        break;
        
      case 'fours':
        sortedStats.sort((a, b) => (b.fours || 0) - (a.fours || 0));
        break;
        
      case 'catches':
      case 'fielding':
        sortedStats.sort((a, b) => {
          const aFielding = (a.catches || 0) + (a.runOuts || 0) + (a.stumpings || 0);
          const bFielding = (b.catches || 0) + (b.runOuts || 0) + (b.stumpings || 0);
          return bFielding - aFielding;
        });
        break;
        
      case 'allrounder':
      case 'mvp':
        // MVP Formula: (Runs * 1) + (Wickets * 20) + (Catches * 10) + (RunOuts * 15)
        sortedStats.sort((a, b) => {
          const aScore = (a.runs || 0) + ((a.wickets || 0) * 20) + ((a.catches || 0) * 10) + ((a.runOuts || 0) * 15);
          const bScore = (b.runs || 0) + ((b.wickets || 0) * 20) + ((b.catches || 0) * 10) + ((b.runOuts || 0) * 15);
          return bScore - aScore;
        });
        break;
        
      default:
        sortedStats.sort((a, b) => (b.runs || 0) - (a.runs || 0));
    }
    
    return sortedStats.slice(0, limit).map((stat, index) => ({
      ...stat,
      rank: index + 1
    }));
  } catch (error) {
    console.error("Error getting top performers:", error);
    throw error;
  }
}

/**
 * Gets a player's tournament statistics
 */
export async function getPlayerStatistics(tournamentId: number, userId: number) {
  try {
    const stats = await storage.getPlayerTournamentStats(tournamentId, userId);
    
    if (!stats) {
      return {
        userId,
        matches: 0,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        wickets: 0,
        overs: 0,
        user: await storage.getUser(userId)
      };
    }
    
    const user = await storage.getUser(userId);
    return { ...stats, user };
  } catch (error) {
    console.error("Error getting player statistics:", error);
    throw error;
  }
}

/**
 * Gets overall tournament statistics
 */
export async function getTournamentSummaryStats(tournamentId: number) {
  try {
    const tournament = await storage.getTournament(tournamentId);
    
    if (!tournament) {
      throw new Error(`Tournament with ID ${tournamentId} not found`);
    }
    
    const tournamentMatches = await storage.getTournamentMatchesByTournament(tournamentId);
    const playerStats = await storage.getPlayerTournamentStatsByTournament(tournamentId);
    
    const totalMatches = tournamentMatches.length;
    const completedMatches = tournamentMatches.filter(m => m.status === 'completed').length;
    const upcomingMatches = tournamentMatches.filter(m => m.status === 'scheduled').length;
    const liveMatches = tournamentMatches.filter(m => m.status === 'live').length;
    
    const totalRuns = playerStats.reduce((sum, stat) => sum + (stat.runs || 0), 0);
    const totalWickets = playerStats.reduce((sum, stat) => sum + (stat.wickets || 0), 0);
    const totalFours = playerStats.reduce((sum, stat) => sum + (stat.fours || 0), 0);
    const totalSixes = playerStats.reduce((sum, stat) => sum + (stat.sixes || 0), 0);
    
    // Orange Cap holder
    const orangeCapHolder = [...playerStats].sort((a, b) => (b.runs || 0) - (a.runs || 0))[0];
    let orangeCapUser = null;
    if (orangeCapHolder) {
      orangeCapUser = await storage.getUser(orangeCapHolder.userId);
    }
    
    // Purple Cap holder
    const purpleCapHolder = [...playerStats].sort((a, b) => (b.wickets || 0) - (a.wickets || 0))[0];
    let purpleCapUser = null;
    if (purpleCapHolder) {
      purpleCapUser = await storage.getUser(purpleCapHolder.userId);
    }
    
    // MVP
    const mvpStats = [...playerStats].sort((a, b) => {
      const aScore = (a.runs || 0) + ((a.wickets || 0) * 20) + ((a.catches || 0) * 10) + ((a.runOuts || 0) * 15);
      const bScore = (b.runs || 0) + ((b.wickets || 0) * 20) + ((b.catches || 0) * 10) + ((b.runOuts || 0) * 15);
      return bScore - aScore;
    })[0];
    let mvpUser = null;
    let mvpScore = 0;
    if (mvpStats) {
      mvpUser = await storage.getUser(mvpStats.userId);
      mvpScore = (mvpStats.runs || 0) + ((mvpStats.wickets || 0) * 20) + ((mvpStats.catches || 0) * 10) + ((mvpStats.runOuts || 0) * 15);
    }
    
    return {
      tournamentId,
      tournamentName: tournament.name,
      status: tournament.status,
      totalMatches,
      completedMatches,
      upcomingMatches,
      liveMatches,
      totalRuns,
      totalWickets,
      boundaries: { fours: totalFours, sixes: totalSixes, total: totalFours + totalSixes },
      orangeCap: orangeCapHolder ? {
        player: orangeCapUser,
        runs: orangeCapHolder.runs,
        matches: orangeCapHolder.matches,
        average: orangeCapHolder.battingAverage,
        strikeRate: orangeCapHolder.strikeRate
      } : null,
      purpleCap: purpleCapHolder ? {
        player: purpleCapUser,
        wickets: purpleCapHolder.wickets,
        matches: purpleCapHolder.matches,
        economy: purpleCapHolder.economyRate
      } : null,
      mvp: mvpStats ? {
        player: mvpUser,
        score: mvpScore,
        runs: mvpStats.runs,
        wickets: mvpStats.wickets,
        catches: mvpStats.catches
      } : null
    };
  } catch (error) {
    console.error("Error getting tournament summary stats:", error);
    throw error;
  }
}

/**
 * Calculate MVP score for a player
 * Formula: (Runs * 1) + (Wickets * 20) + (Catches * 10) + (RunOuts * 15)
 */
export function calculateMVPScore(stats: { runs?: number; wickets?: number; catches?: number; runOuts?: number }): number {
  return (stats.runs || 0) + ((stats.wickets || 0) * 20) + ((stats.catches || 0) * 10) + ((stats.runOuts || 0) * 15);
}

/**
 * Get form guide for a team (last 5 matches)
 */
export async function getTeamFormGuide(tournamentId: number, teamId: number): Promise<string[]> {
  try {
    const matches = await storage.getTournamentMatchesByTournament(tournamentId);
    
    const teamMatches = matches.filter(m => 
      m.status === 'completed' && 
      (m.home_team_id === teamId || m.away_team_id === teamId)
    );
    
    teamMatches.sort((a, b) => {
      const dateA = a.scheduledDate ? new Date(a.scheduledDate).getTime() : 0;
      const dateB = b.scheduledDate ? new Date(b.scheduledDate).getTime() : 0;
      return dateB - dateA;
    });
    
    const formGuide: string[] = [];
    
    for (const match of teamMatches.slice(0, 5)) {
      const isHomeTeam = match.home_team_id === teamId;
      
      if (match.result === 'no_result' || match.result === 'abandoned') {
        formGuide.push('N');
      } else if (match.result === 'tie') {
        formGuide.push('T');
      } else if ((isHomeTeam && match.result === 'home_win') || (!isHomeTeam && match.result === 'away_win')) {
        formGuide.push('W');
      } else {
        formGuide.push('L');
      }
    }
    
    return formGuide;
  } catch (error) {
    console.error("Error getting team form guide:", error);
    return [];
  }
}

/**
 * Get enhanced standings with form guide
 */
export async function getEnhancedStandings(tournamentId: number) {
  try {
    const standings = await storage.getTournamentStandingsByTournament(tournamentId);
    
    const enhancedStandings = await Promise.all(standings.map(async (standing) => {
      const team = await storage.getTeamById(standing.teamId);
      const formGuide = await getTeamFormGuide(tournamentId, standing.teamId);
      const nrr = parseFloat(standing.netRunRate?.toString() || "0");
      
      return {
        ...standing,
        team,
        formGuide,
        nrrFormatted: nrr >= 0 ? `+${nrr.toFixed(3)}` : nrr.toFixed(3)
      };
    }));
    
    enhancedStandings.sort((a, b) => (a.position || 0) - (b.position || 0));
    
    return enhancedStandings;
  } catch (error) {
    console.error("Error getting enhanced standings:", error);
    throw error;
  }
}
