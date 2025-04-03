import { db } from '../../db';
import { asc, desc, eq, and, sql } from 'drizzle-orm';
import * as schema from '@shared/schema';

/**
 * Updates tournament statistics based on player performance in a match
 */
export async function updatePlayerStatistics(tournamentId: number, matchId: number) {
  try {
    // Get match details
    const match = await db.query.tournamentMatches.findFirst({
      where: and(
        eq(schema.tournamentMatches.id, matchId),
        eq(schema.tournamentMatches.tournamentId, tournamentId)
      )
    });
    
    if (!match || match.status !== "completed") {
      throw new Error("Match not found or not completed");
    }
    
    // Get player performances for this match
    const performances = await db.query.playerMatchPerformance.findMany({
      where: eq(schema.playerMatchPerformance.matchId, matchId),
      with: {
        user: true
      }
    });
    
    if (!performances || performances.length === 0) {
      // No performances recorded yet
      return;
    }
    
    // Process each player's performance
    for (const performance of performances) {
      // Get existing tournament stats for this player
      const existingStats = await db.query.playerTournamentStats.findFirst({
        where: and(
          eq(schema.playerTournamentStats.tournamentId, tournamentId),
          eq(schema.playerTournamentStats.userId, performance.userId)
        )
      });
      
      if (existingStats) {
        // Update existing stats
        await db.update(schema.playerTournamentStats)
          .set({
            matches: existingStats.matches + 1,
            runs: existingStats.runs + (performance.runs || 0),
            ballsFaced: existingStats.ballsFaced + (performance.ballsFaced || 0),
            fours: existingStats.fours + (performance.fours || 0),
            sixes: existingStats.sixes + (performance.sixes || 0),
            fifties: existingStats.fifties + (performance.runs && performance.runs >= 50 && performance.runs < 100 ? 1 : 0),
            hundreds: existingStats.hundreds + (performance.runs && performance.runs >= 100 ? 1 : 0),
            highestScore: Math.max(existingStats.highestScore || 0, performance.runs || 0),
            
            // Bowling stats
            overs: existingStats.overs + (performance.overs || 0),
            wickets: existingStats.wickets + (performance.wickets || 0),
            runsConceded: existingStats.runsConceded + (performance.runsConceded || 0),
            maidens: existingStats.maidens + (performance.maidens || 0),
            fiveWickets: existingStats.fiveWickets + (performance.wickets && performance.wickets >= 5 ? 1 : 0),
            
            // Fielding stats
            catches: existingStats.catches + (performance.catches || 0),
            runOuts: existingStats.runOuts + (performance.runOuts || 0),
            
            // Updated averages and strike rates will be calculated below
            lastUpdated: new Date()
          })
          .where(and(
            eq(schema.playerTournamentStats.tournamentId, tournamentId),
            eq(schema.playerTournamentStats.userId, performance.userId)
          ));
      } else {
        // Create new stats entry
        await db.insert(schema.playerTournamentStats)
          .values({
            tournamentId,
            userId: performance.userId,
            matches: 1,
            runs: performance.runs || 0,
            ballsFaced: performance.ballsFaced || 0,
            fours: performance.fours || 0,
            sixes: performance.sixes || 0,
            fifties: (performance.runs && performance.runs >= 50 && performance.runs < 100) ? 1 : 0,
            hundreds: (performance.runs && performance.runs >= 100) ? 1 : 0,
            highestScore: performance.runs || 0,
            battingAverage: 0, // Will be calculated below
            strikeRate: 0, // Will be calculated below
            
            // Bowling stats
            overs: performance.overs || 0,
            wickets: performance.wickets || 0,
            runsConceded: performance.runsConceded || 0,
            maidens: performance.maidens || 0,
            fiveWickets: (performance.wickets && performance.wickets >= 5) ? 1 : 0,
            bowlingAverage: 0, // Will be calculated below
            economyRate: 0, // Will be calculated below
            
            // Fielding stats
            catches: performance.catches || 0,
            runOuts: performance.runOuts || 0,
            
            lastUpdated: new Date()
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
    const stats = await db.query.playerTournamentStats.findFirst({
      where: and(
        eq(schema.playerTournamentStats.tournamentId, tournamentId),
        eq(schema.playerTournamentStats.userId, userId)
      )
    });
    
    if (!stats) {
      return;
    }
    
    // Calculate batting average (runs / dismissals)
    // For simplicity, we'll assume each match counts as a dismissal
    // In a real implementation, you'd track actual dismissals
    const battingAverage = stats.matches > 0 ? stats.runs / stats.matches : 0;
    
    // Calculate strike rate (runs / balls faced * 100)
    const strikeRate = stats.ballsFaced > 0 ? (stats.runs / stats.ballsFaced) * 100 : 0;
    
    // Calculate bowling average (runs conceded / wickets)
    const bowlingAverage = stats.wickets > 0 ? stats.runsConceded / stats.wickets : 0;
    
    // Calculate economy rate (runs conceded / overs)
    const economyRate = stats.overs > 0 ? stats.runsConceded / stats.overs : 0;
    
    // Update the statistics
    await db.update(schema.playerTournamentStats)
      .set({
        battingAverage,
        strikeRate,
        bowlingAverage,
        economyRate
      })
      .where(and(
        eq(schema.playerTournamentStats.tournamentId, tournamentId),
        eq(schema.playerTournamentStats.userId, userId)
      ));
    
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
    const tournament = await db.query.tournaments.findFirst({
      where: eq(schema.tournaments.id, tournamentId)
    });
    
    if (!tournament) {
      throw new Error(`Tournament with ID ${tournamentId} not found`);
    }
    
    // Different orders based on category
    switch (category.toLowerCase()) {
      case 'runs':
        return await db.query.playerTournamentStats.findMany({
          where: eq(schema.playerTournamentStats.tournamentId, tournamentId),
          orderBy: [{ column: schema.playerTournamentStats.runs, order: 'desc' }],
          limit,
          with: {
            user: true
          }
        });
        
      case 'batting_average':
        return await db.query.playerTournamentStats.findMany({
          where: eq(schema.playerTournamentStats.tournamentId, tournamentId),
          orderBy: [{ column: schema.playerTournamentStats.battingAverage, order: 'desc' }],
          limit,
          with: {
            user: true
          }
        });
        
      case 'strike_rate':
        return await db.query.playerTournamentStats.findMany({
          where: eq(schema.playerTournamentStats.tournamentId, tournamentId),
          orderBy: [{ column: schema.playerTournamentStats.strikeRate, order: 'desc' }],
          limit,
          with: {
            user: true
          }
        });
        
      case 'wickets':
        return await db.query.playerTournamentStats.findMany({
          where: eq(schema.playerTournamentStats.tournamentId, tournamentId),
          orderBy: [{ column: schema.playerTournamentStats.wickets, order: 'desc' }],
          limit,
          with: {
            user: true
          }
        });
        
      case 'bowling_average':
        return await db.query.playerTournamentStats.findMany({
          where: and(
            eq(schema.playerTournamentStats.tournamentId, tournamentId),
            sql`${schema.playerTournamentStats.bowlingAverage} > 0`
          ),
          orderBy: [{ column: schema.playerTournamentStats.bowlingAverage, order: 'asc' }],
          limit,
          with: {
            user: true
          }
        });
        
      case 'economy_rate':
        return await db.query.playerTournamentStats.findMany({
          where: and(
            eq(schema.playerTournamentStats.tournamentId, tournamentId),
            sql`${schema.playerTournamentStats.economyRate} > 0`
          ),
          orderBy: [{ column: schema.playerTournamentStats.economyRate, order: 'asc' }],
          limit,
          with: {
            user: true
          }
        });
        
      case 'allrounder':
        // Combined ranking for all-rounders (e.g., runs + wickets * 20)
        // This is a simplified approach, in a real implementation you might want
        // to use a more sophisticated formula
        return await db.query.playerTournamentStats.findMany({
          where: eq(schema.playerTournamentStats.tournamentId, tournamentId),
          orderBy: [{ column: sql`(${schema.playerTournamentStats.runs} + ${schema.playerTournamentStats.wickets} * 20)`, order: 'desc' }],
          limit,
          with: {
            user: true
          }
        });
        
      case 'sixes':
        return await db.query.playerTournamentStats.findMany({
          where: eq(schema.playerTournamentStats.tournamentId, tournamentId),
          orderBy: [{ column: schema.playerTournamentStats.sixes, order: 'desc' }],
          limit,
          with: {
            user: true
          }
        });
        
      case 'fours':
        return await db.query.playerTournamentStats.findMany({
          where: eq(schema.playerTournamentStats.tournamentId, tournamentId),
          orderBy: [{ column: schema.playerTournamentStats.fours, order: 'desc' }],
          limit,
          with: {
            user: true
          }
        });
        
      case 'fielding':
        return await db.query.playerTournamentStats.findMany({
          where: eq(schema.playerTournamentStats.tournamentId, tournamentId),
          orderBy: [{ column: sql`(${schema.playerTournamentStats.catches} + ${schema.playerTournamentStats.runOuts})`, order: 'desc' }],
          limit,
          with: {
            user: true
          }
        });
        
      default:
        // Default to most runs
        return await db.query.playerTournamentStats.findMany({
          where: eq(schema.playerTournamentStats.tournamentId, tournamentId),
          orderBy: [{ column: schema.playerTournamentStats.runs, order: 'desc' }],
          limit,
          with: {
            user: true
          }
        });
    }
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
    const stats = await db.query.playerTournamentStats.findFirst({
      where: and(
        eq(schema.playerTournamentStats.tournamentId, tournamentId),
        eq(schema.playerTournamentStats.userId, userId)
      ),
      with: {
        user: true
      }
    });
    
    if (!stats) {
      // Player has no stats for this tournament yet
      return {
        userId,
        matches: 0,
        runs: 0,
        wickets: 0,
        // Include other default values as needed
      };
    }
    
    // Get player's recent performances in this tournament
    const recentPerformances = await db.query.playerMatchPerformance.findMany({
      where: and(
        eq(schema.playerMatchPerformance.userId, userId),
        sql`${schema.playerMatchPerformance.matchId} IN (
          SELECT id FROM tournament_matches WHERE tournament_id = ${tournamentId}
        )`
      ),
      orderBy: [{ column: schema.playerMatchPerformance.createdAt, order: 'desc' }],
      limit: 5 // Get last 5 performances
    });
    
    return {
      ...stats,
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
    const tournament = await db.query.tournaments.findFirst({
      where: eq(schema.tournaments.id, tournamentId)
    });
    
    if (!tournament) {
      throw new Error(`Tournament with ID ${tournamentId} not found`);
    }
    
    // Get all matches in this tournament
    const matches = await db.query.tournamentMatches.findMany({
      where: eq(schema.tournamentMatches.tournamentId, tournamentId)
    });
    
    // Get all player stats in this tournament
    const playerStats = await db.query.playerTournamentStats.findMany({
      where: eq(schema.playerTournamentStats.tournamentId, tournamentId)
    });
    
    // Calculate tournament summary statistics
    const totalMatches = matches.length;
    const completedMatches = matches.filter(m => m.status === 'completed').length;
    
    // Total runs in tournament
    const totalRuns = playerStats.reduce((sum, stat) => sum + stat.runs, 0);
    
    // Total wickets in tournament
    const totalWickets = playerStats.reduce((sum, stat) => sum + stat.wickets, 0);
    
    // Highest team score
    let highestTeamScore = 0;
    let highestScoringTeamId = null;
    let highestScoringMatchId = null;
    
    for (const match of matches) {
      if (match.team1Score && match.team1Score > highestTeamScore) {
        highestTeamScore = match.team1Score;
        highestScoringTeamId = match.team1Id;
        highestScoringMatchId = match.id;
      }
      
      if (match.team2Score && match.team2Score > highestTeamScore) {
        highestTeamScore = match.team2Score;
        highestScoringTeamId = match.team2Id;
        highestScoringMatchId = match.id;
      }
    }
    
    // Get scoring teams if we have them
    let highestScoringTeam = null;
    if (highestScoringTeamId) {
      highestScoringTeam = await db.query.teams.findFirst({
        where: eq(schema.teams.id, highestScoringTeamId)
      });
    }
    
    // Lowest team score (only count completed matches)
    const completedMatchesWithScores = matches.filter(m => 
      m.status === 'completed' && 
      (m.team1Score !== null || m.team2Score !== null)
    );
    
    let lowestTeamScore = Number.MAX_SAFE_INTEGER;
    let lowestScoringTeamId = null;
    let lowestScoringMatchId = null;
    
    for (const match of completedMatchesWithScores) {
      if (match.team1Score !== null && match.team1Score < lowestTeamScore) {
        lowestTeamScore = match.team1Score;
        lowestScoringTeamId = match.team1Id;
        lowestScoringMatchId = match.id;
      }
      
      if (match.team2Score !== null && match.team2Score < lowestTeamScore) {
        lowestTeamScore = match.team2Score;
        lowestScoringTeamId = match.team2Id;
        lowestScoringMatchId = match.id;
      }
    }
    
    let lowestScoringTeam = null;
    if (lowestScoringTeamId) {
      lowestScoringTeam = await db.query.teams.findFirst({
        where: eq(schema.teams.id, lowestScoringTeamId)
      });
    }
    
    // Most boundaries
    const totalFours = playerStats.reduce((sum, stat) => sum + stat.fours, 0);
    const totalSixes = playerStats.reduce((sum, stat) => sum + stat.sixes, 0);
    
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