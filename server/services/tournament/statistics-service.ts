import { storage } from '../../storage';
import * as schema from '@shared/schema';

/**
 * Updates tournament statistics based on player performance in a match
 */
export async function updatePlayerStatistics(tournamentId: number, matchId: number) {
  try {
    // Get match details
    const match = await storage.getTournamentMatch(matchId);
    
    if (!match || match.status !== "completed") {
      throw new Error("Match not found or not completed");
    }
    
    // Get player performances for this match
    const performances = await storage.getMatchPerformances(matchId);
    
    if (!performances || performances.length === 0) {
      // No performances recorded yet
      return;
    }
    
    // Process each player's performance
    for (const performance of performances) {
      // Get existing tournament stats for this player
      const existingStats = await storage.getPlayerTournamentStats(tournamentId, performance.userId);
      
      if (existingStats) {
        // Update existing stats
        await storage.updatePlayerTournamentStats(tournamentId, performance.userId, {
          matches: existingStats.matches + 1,
          runs: existingStats.runs + (performance.runsScored || 0),
          balls: existingStats.balls + (performance.ballsFaced || 0),
          fours: existingStats.fours + (performance.fours || 0),
          sixes: existingStats.sixes + (performance.sixes || 0),
          fifties: existingStats.fifties + (performance.runsScored && performance.runsScored >= 50 && performance.runsScored < 100 ? 1 : 0),
          hundreds: existingStats.hundreds + (performance.runsScored && performance.runsScored >= 100 ? 1 : 0),
          highestScore: Math.max(existingStats.highestScore || 0, performance.runsScored || 0),
          
          // Bowling stats
          overs: existingStats.overs + (performance.oversBowled ? parseFloat(performance.oversBowled) : 0),
          wickets: existingStats.wickets + (performance.wicketsTaken || 0),
          catches: existingStats.catches + (performance.catches || 0),
          runOuts: existingStats.runOuts + (performance.runOuts || 0),
          
          // Updated averages and strike rates will be calculated below
          updatedAt: new Date()
        });
      } else {
        // Create new stats entry
        await storage.createPlayerTournamentStats({
          tournamentId,
          userId: performance.userId,
          matches: 1,
          innings: 1,
          runs: performance.runsScored || 0,
          balls: performance.ballsFaced || 0,
          fours: performance.fours || 0,
          sixes: performance.sixes || 0,
          fifties: (performance.runsScored && performance.runsScored >= 50 && performance.runsScored < 100) ? 1 : 0,
          hundreds: (performance.runsScored && performance.runsScored >= 100) ? 1 : 0,
          highestScore: performance.runsScored || 0,
          average: 0, // Will be calculated below
          strikeRate: 0, // Will be calculated below
          
          // Bowling stats
          overs: performance.oversBowled ? parseFloat(performance.oversBowled) : 0,
          wickets: performance.wicketsTaken || 0,
          bestBowling: null,
          economyRate: 0, // Will be calculated below
          
          // Fielding stats
          catches: performance.catches || 0,
          runOuts: performance.runOuts || 0,
          stumpings: performance.stumpings || 0,
          
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      // Update derived statistics (averages, etc.)
      await updatePlayerAverages(tournamentId, performance.userId);
    }
    
    return true;
  } catch (error) {
    console.error("Error updating player statistics:", error);
    throw error;
  }
}

/**
 * Helper function to update a player's batting and bowling averages
 */
async function updatePlayerAverages(tournamentId: number, userId: number) {
  try {
    const stats = await storage.getPlayerTournamentStats(tournamentId, userId);
    
    if (!stats) {
      return;
    }
    
    // Calculate batting average (runs / dismissals)
    // For simplicity, we'll assume each innings counts as a dismissal
    const battingAverage = stats.innings > 0 ? stats.runs / stats.innings : 0;
    
    // Calculate strike rate (runs / balls faced * 100)
    const strikeRate = stats.balls > 0 ? (stats.runs / stats.balls) * 100 : 0;
    
    // Calculate economy rate (runs conceded / overs)
    const economyRate = stats.overs > 0 ? stats.runs / stats.overs : 0;
    
    // Update the statistics
    await storage.updatePlayerTournamentStats(tournamentId, userId, {
      average: battingAverage,
      strikeRate,
      economyRate,
      updatedAt: new Date()
    });
    
    return true;
  } catch (error) {
    console.error("Error updating player averages:", error);
    throw error;
  }
}

/**
 * Gets the top performers in a tournament by various statistics
 */
export async function getTopPerformers(tournamentId: number, category: string, limit: number = 10) {
  try {
    // Validate the tournament exists
    const tournament = await storage.getTournament(tournamentId);
    
    if (!tournament) {
      throw new Error(`Tournament with ID ${tournamentId} not found`);
    }
    
    // Get all player stats in this tournament
    const allStats = await storage.getPlayerTournamentStatsByTournament(tournamentId);
    
    // Enrich with user data and sort based on category
    const statsWithUsers = await Promise.all(allStats.map(async (stat) => {
      const user = await storage.getUser(stat.userId);
      return { ...stat, user };
    }));
    
    let sortedStats = [...statsWithUsers];
    
    // Different orders based on category
    switch (category.toLowerCase()) {
      case 'runs':
        sortedStats.sort((a, b) => b.runs - a.runs);
        break;
        
      case 'batting_average':
        sortedStats.sort((a, b) => (b.average || 0) - (a.average || 0));
        break;
        
      case 'strike_rate':
        sortedStats.sort((a, b) => (b.strikeRate || 0) - (a.strikeRate || 0));
        break;
        
      case 'wickets':
        sortedStats.sort((a, b) => (b.wickets || 0) - (a.wickets || 0));
        break;
        
      case 'economy_rate':
        // Filter out players with no economy rate, then sort ascending (lower is better)
        sortedStats = sortedStats.filter(stat => stat.economyRate && stat.economyRate > 0);
        sortedStats.sort((a, b) => (a.economyRate || 999) - (b.economyRate || 999));
        break;
        
      case 'allrounder':
        // Combined ranking for all-rounders (e.g., runs + wickets * 20)
        sortedStats.sort((a, b) => {
          const aScore = a.runs + (a.wickets || 0) * 20;
          const bScore = b.runs + (b.wickets || 0) * 20;
          return bScore - aScore;
        });
        break;
        
      case 'sixes':
        sortedStats.sort((a, b) => (b.sixes || 0) - (a.sixes || 0));
        break;
        
      case 'fours':
        sortedStats.sort((a, b) => (b.fours || 0) - (a.fours || 0));
        break;
        
      case 'fielding':
        sortedStats.sort((a, b) => {
          const aFielding = (a.catches || 0) + (a.runOuts || 0) + (a.stumpings || 0);
          const bFielding = (b.catches || 0) + (b.runOuts || 0) + (b.stumpings || 0);
          return bFielding - aFielding;
        });
        break;
        
      default:
        // Default to most runs
        sortedStats.sort((a, b) => b.runs - a.runs);
    }
    
    // Return limited results
    return sortedStats.slice(0, limit);
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
    // Get player's statistics for this tournament
    const stats = await storage.getPlayerTournamentStats(tournamentId, userId);
    
    if (!stats) {
      // Player has no stats for this tournament yet
      return {
        userId,
        matches: 0,
        innings: 0,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        wickets: 0,
        overs: 0,
        user: await storage.getUser(userId)
      };
    }
    
    // Enrich with user data
    const user = await storage.getUser(userId);
    const statsWithUser = { ...stats, user };
    
    // Get all tournament matches
    const tournamentMatches = await storage.getTournamentMatchesByTournament(tournamentId);
    const tournamentMatchIds = tournamentMatches.map(match => match.matchId);
    
    // Get player's recent performances from matches in this tournament
    const allPlayerPerformances = await storage.getPlayerMatchesByUserId(userId);
    const recentPerformances = allPlayerPerformances
      .filter(perf => tournamentMatchIds.includes(perf.matchId))
      .sort((a, b) => {
        const dateA = a.createdAt ? a.createdAt.getTime() : 0;
        const dateB = b.createdAt ? b.createdAt.getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5); // Get last 5 performances
    
    return {
      ...statsWithUser,
      recentPerformances
    };
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
    // Validate the tournament exists
    const tournament = await storage.getTournament(tournamentId);
    
    if (!tournament) {
      throw new Error(`Tournament with ID ${tournamentId} not found`);
    }
    
    // Get all matches in this tournament
    const tournamentMatches = await storage.getTournamentMatchesByTournament(tournamentId);
    
    // Get the actual matches
    const matchPromises = tournamentMatches.map(tm => storage.getTournamentMatch(tm.matchId));
    const matches = await Promise.all(matchPromises);
    
    // Get all player stats in this tournament
    const playerStats = await storage.getPlayerTournamentStatsByTournament(tournamentId);
    
    // Calculate tournament summary statistics
    const totalMatches = tournamentMatches.length;
    const completedMatches = tournamentMatches.filter(m => m.status === 'completed').length;
    
    // Total runs in tournament
    const totalRuns = playerStats.reduce((sum, stat) => sum + stat.runs, 0);
    
    // Total wickets in tournament
    const totalWickets = playerStats.reduce((sum, stat) => sum + (stat.wickets || 0), 0);
    
    // Highest team score
    let highestTeamScore = 0;
    let highestScoringTeamId = null;
    let highestScoringMatchId = null;
    
    for (const match of matches) {
      if (match && match.team1Score && match.team1Score > highestTeamScore) {
        highestTeamScore = match.team1Score;
        highestScoringTeamId = match.team1Id;
        highestScoringMatchId = match.id;
      }
      
      if (match && match.team2Score && match.team2Score > highestTeamScore) {
        highestTeamScore = match.team2Score;
        highestScoringTeamId = match.team2Id;
        highestScoringMatchId = match.id;
      }
    }
    
    // Get scoring teams if we have them
    let highestScoringTeam = null;
    if (highestScoringTeamId) {
      highestScoringTeam = await storage.getTeam(highestScoringTeamId);
    }
    
    // Lowest team score (only count completed matches with scores)
    const completedMatchesWithScores = matches.filter(m => 
      m && m.status === 'completed' && 
      (m.team1Score !== null || m.team2Score !== null)
    );
    
    let lowestTeamScore = Number.MAX_SAFE_INTEGER;
    let lowestScoringTeamId = null;
    let lowestScoringMatchId = null;
    
    for (const match of completedMatchesWithScores) {
      if (match && match.team1Score !== null && match.team1Score < lowestTeamScore) {
        lowestTeamScore = match.team1Score;
        lowestScoringTeamId = match.team1Id;
        lowestScoringMatchId = match.id;
      }
      
      if (match && match.team2Score !== null && match.team2Score < lowestTeamScore) {
        lowestTeamScore = match.team2Score;
        lowestScoringTeamId = match.team2Id;
        lowestScoringMatchId = match.id;
      }
    }
    
    let lowestScoringTeam = null;
    if (lowestScoringTeamId) {
      lowestScoringTeam = await storage.getTeam(lowestScoringTeamId);
    }
    
    // Most boundaries
    const totalFours = playerStats.reduce((sum, stat) => sum + (stat.fours || 0), 0);
    const totalSixes = playerStats.reduce((sum, stat) => sum + (stat.sixes || 0), 0);
    
    // Return the summary statistics
    return {
      tournamentId,
      tournamentName: tournament.name,
      totalMatches,
      completedMatches,
      totalRuns,
      totalWickets,
      highestTeamScore: {
        score: highestTeamScore,
        team: highestScoringTeam,
        matchId: highestScoringMatchId
      },
      lowestTeamScore: lowestTeamScore === Number.MAX_SAFE_INTEGER ? null : {
        score: lowestTeamScore,
        team: lowestScoringTeam,
        matchId: lowestScoringMatchId
      },
      boundaries: {
        fours: totalFours,
        sixes: totalSixes
      }
    };
  } catch (error) {
    console.error("Error getting tournament summary stats:", error);
    throw error;
  }
}