import { storage } from '../../storage';
import * as schema from '@shared/schema';

/**
 * Enhanced Tournament Summary Stats interface
 */
interface EnhancedTournamentSummaryStats {
  tournamentId: number;
  tournamentName: string;
  totalMatches: number;
  completedMatches: number;
  totalRuns: number;
  totalWickets: number;
  highestTeamScore: {
    score: number;
    team: any;
    matchId: number;
  };
  lowestTeamScore: {
    score: number;
    team: any;
    matchId: number;
  } | null;
  highestIndividualScore: {
    score: number;
    player: any;
    matchId: number;
    teamId: number;
  };
  bestBowling: {
    wickets: number;
    runs: number;
    player: any;
    matchId: number;
    teamId: number;
  };
  boundaries: {
    fours: number;
    sixes: number;
  };
  mostSixes: {
    count: number;
    player: any;
  };
  mostFours: {
    count: number;
    player: any;
  };
  fastestFifty: {
    balls: number;
    player: any;
    matchId: number;
  };
  fastestCentury: {
    balls: number;
    player: any;
    matchId: number;
  };
}

/**
 * Interface for tournament standings data with advanced stats
 */
interface EnhancedStandingsData {
  teamId: number;
  team: any;
  position: number;
  played: number;
  won: number;
  lost: number;
  tied: number;
  noResult: number;
  points: number;
  nrr: number;
  forRuns: number;
  forOvers: number;
  againstRuns: number;
  againstOvers: number;
  lastFiveMatches: Array<'W' | 'L' | 'T' | 'N'>;
  homeRecord: {
    played: number;
    won: number;
    lost: number;
  };
  awayRecord: {
    played: number;
    won: number;
    lost: number;
  };
  qualified: boolean;
  eliminated: boolean;
}

/**
 * Enhanced tournament statistics service
 */

/**
 * Get comprehensive tournament statistics including team and player performances
 */
export async function getEnhancedTournamentStats(tournamentId: number) {
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
    const totalRuns = playerStats.reduce((sum, stat) => sum + (stat.runs || 0), 0);
    
    // Total wickets in tournament
    const totalWickets = playerStats.reduce((sum, stat) => sum + (stat.wickets || 0), 0);
    
    // Highest team score
    let highestTeamScore = 0;
    let highestScoringTeamId = null;
    let highestScoringMatchId = null;
    
    // Lowest team score
    let lowestTeamScore = Number.MAX_SAFE_INTEGER;
    let lowestScoringTeamId = null;
    let lowestScoringMatchId = null;
    
    for (const match of matches) {
      if (!match) continue;
      
      // Process team1 score
      if (match.team1Score) {
        const team1ScoreNum = parseTeamScore(match.team1Score);
        if (team1ScoreNum > highestTeamScore) {
          highestTeamScore = team1ScoreNum;
          highestScoringTeamId = match.team1Id;
          highestScoringMatchId = match.id;
        }
        if (team1ScoreNum < lowestTeamScore && team1ScoreNum > 0) {
          lowestTeamScore = team1ScoreNum;
          lowestScoringTeamId = match.team1Id;
          lowestScoringMatchId = match.id;
        }
      }
      
      // Process team2 score
      if (match.team2Score) {
        const team2ScoreNum = parseTeamScore(match.team2Score);
        if (team2ScoreNum > highestTeamScore) {
          highestTeamScore = team2ScoreNum;
          highestScoringTeamId = match.team2Id;
          highestScoringMatchId = match.id;
        }
        if (team2ScoreNum < lowestTeamScore && team2ScoreNum > 0) {
          lowestTeamScore = team2ScoreNum;
          lowestScoringTeamId = match.team2Id;
          lowestScoringMatchId = match.id;
        }
      }
    }
    
    // Get team info
    let highestScoringTeam = null;
    let lowestScoringTeam = null;
    
    if (highestScoringTeamId) {
      highestScoringTeam = await storage.getTeam(highestScoringTeamId);
    }
    
    if (lowestScoringTeamId) {
      lowestScoringTeam = await storage.getTeam(lowestScoringTeamId);
    }
    
    // Calculate highest individual score
    let highestIndividualScore = {
      score: 0,
      player: null,
      matchId: null,
      teamId: null
    };
    
    // Calculate best bowling figures
    let bestBowling = {
      wickets: 0,
      runs: Number.MAX_SAFE_INTEGER,
      player: null,
      matchId: null,
      teamId: null
    };
    
    // Calculate most boundaries
    const totalFours = playerStats.reduce((sum, stat) => sum + (stat.fours || 0), 0);
    const totalSixes = playerStats.reduce((sum, stat) => sum + (stat.sixes || 0), 0);
    
    // Find player with most sixes
    let mostSixesPlayer = null;
    let mostSixesCount = 0;
    
    // Find player with most fours
    let mostFoursPlayer = null;
    let mostFoursCount = 0;
    
    // Find fastest fifty and century
    let fastestFifty = {
      balls: Number.MAX_SAFE_INTEGER,
      player: null,
      matchId: null
    };
    
    let fastestCentury = {
      balls: Number.MAX_SAFE_INTEGER,
      player: null,
      matchId: null
    };
    
    // Process player stats to find records
    for (const stat of playerStats) {
      // Process batting stats
      if (stat.statCategory === 'batting') {
        // Check for highest individual score
        if (stat.highest && stat.highest > highestIndividualScore.score) {
          highestIndividualScore = {
            score: stat.highest,
            player: await storage.getUser(stat.userId),
            matchId: stat.matchId || null,
            teamId: stat.teamId
          };
        }
        
        // Check for most sixes
        if (stat.sixes && stat.sixes > mostSixesCount) {
          mostSixesCount = stat.sixes;
          mostSixesPlayer = await storage.getUser(stat.userId);
        }
        
        // Check for most fours
        if (stat.fours && stat.fours > mostFoursCount) {
          mostFoursCount = stat.fours;
          mostFoursPlayer = await storage.getUser(stat.userId);
        }
        
        // Check for fastest fifty and century
        if (stat.fastestFiftyBalls && stat.fastestFiftyBalls < fastestFifty.balls) {
          fastestFifty = {
            balls: stat.fastestFiftyBalls,
            player: await storage.getUser(stat.userId),
            matchId: stat.matchId || null
          };
        }
        
        if (stat.fastestHundredBalls && stat.fastestHundredBalls < fastestCentury.balls) {
          fastestCentury = {
            balls: stat.fastestHundredBalls,
            player: await storage.getUser(stat.userId),
            matchId: stat.matchId || null
          };
        }
      }
      
      // Process bowling stats
      if (stat.statCategory === 'bowling') {
        // Check for best bowling
        if (stat.wickets && stat.wickets > bestBowling.wickets) {
          bestBowling = {
            wickets: stat.wickets,
            runs: stat.runsConceded || 0,
            player: await storage.getUser(stat.userId),
            matchId: stat.matchId || null,
            teamId: stat.teamId
          };
        } else if (stat.wickets && stat.wickets === bestBowling.wickets && 
                 stat.runsConceded && stat.runsConceded < bestBowling.runs) {
          bestBowling = {
            wickets: stat.wickets,
            runs: stat.runsConceded,
            player: await storage.getUser(stat.userId),
            matchId: stat.matchId || null,
            teamId: stat.teamId
          };
        }
      }
    }
    
    // Return the enhanced summary statistics
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
      highestIndividualScore,
      bestBowling,
      boundaries: {
        fours: totalFours,
        sixes: totalSixes
      },
      mostSixes: {
        count: mostSixesCount,
        player: mostSixesPlayer
      },
      mostFours: {
        count: mostFoursCount,
        player: mostFoursPlayer
      },
      fastestFifty: fastestFifty.balls === Number.MAX_SAFE_INTEGER ? null : fastestFifty,
      fastestCentury: fastestCentury.balls === Number.MAX_SAFE_INTEGER ? null : fastestCentury
    };
  } catch (error) {
    console.error("Error getting enhanced tournament stats:", error);
    throw error;
  }
}

/**
 * Get tournament standings with advanced team statistics
 */
export async function getEnhancedTournamentStandings(tournamentId: number) {
  try {
    // Get tournament details
    const tournament = await storage.getTournament(tournamentId);
    
    if (!tournament) {
      throw new Error(`Tournament with ID ${tournamentId} not found`);
    }
    
    // Get all teams in tournament
    const tournamentTeams = await storage.getTournamentTeams(tournamentId);
    
    if (!tournamentTeams || tournamentTeams.length === 0) {
      throw new Error(`No teams found for tournament with ID ${tournamentId}`);
    }
    
    // Get standings for each team
    const standingsPromises = tournamentTeams.map(teamEntry => 
      storage.getTournamentStanding(tournamentId, teamEntry.teamId)
    );
    const standings = await Promise.all(standingsPromises);
    
    // Get teams data
    const teamsPromises = tournamentTeams.map(teamEntry => 
      storage.getTeam(teamEntry.teamId)
    );
    const teams = await Promise.all(teamsPromises);
    
    // Get all matches in this tournament
    const tournamentMatches = await storage.getTournamentMatchesByTournament(tournamentId);
    
    // Get all match details
    const matchPromises = tournamentMatches.map(tm => storage.getTournamentMatch(tm.matchId));
    const matches = await Promise.all(matchPromises);
    
    // Calculate enhanced standings
    const enhancedStandings: EnhancedStandingsData[] = [];
    
    for (let i = 0; i < tournamentTeams.length; i++) {
      const teamId = tournamentTeams[i].teamId;
      const team = teams[i];
      const standing = standings[i];
      
      if (!standing) {
        console.warn(`No standing found for team ${teamId} in tournament ${tournamentId}`);
        continue;
      }
      
      // Calculate for and against runs/overs
      let forRuns = 0;
      let forOvers = 0;
      let againstRuns = 0;
      let againstOvers = 0;
      
      // Calculate last 5 matches result
      const lastFiveMatches: Array<'W' | 'L' | 'T' | 'N'> = [];
      
      // Calculate home and away record
      const homeRecord = { played: 0, won: 0, lost: 0 };
      const awayRecord = { played: 0, won: 0, lost: 0 };
      
      // Process matches to calculate advanced stats
      for (const match of matches) {
        if (!match || match.status !== 'completed') continue;
        
        if (match.home_team_id === teamId || match.away_team_id === teamId) {
          // Determine if this team is home or away
          const isHome = match.home_team_id === teamId;
          
          // Update home/away record
          if (isHome) {
            homeRecord.played++;
          } else {
            awayRecord.played++;
          }
          
          // Determine match result for this team
          let matchResult: 'W' | 'L' | 'T' | 'N' = 'N';
          
          if (match.result === 'no_result') {
            matchResult = 'N';
          } else if (match.result === 'tie') {
            matchResult = 'T';
          } else if ((isHome && match.result === 'home_win') || 
                     (!isHome && match.result === 'away_win')) {
            matchResult = 'W';
            if (isHome) {
              homeRecord.won++;
            } else {
              awayRecord.won++;
            }
          } else {
            matchResult = 'L';
            if (isHome) {
              homeRecord.lost++;
            } else {
              awayRecord.lost++;
            }
          }
          
          // Add to last 5 matches (most recent first)
          if (lastFiveMatches.length < 5) {
            lastFiveMatches.unshift(matchResult);
          }
          
          // Calculate runs and overs
          if (isHome) {
            // Team is home team
            if (match.home_team_score) {
              const { runs, overs } = parseTeamScoreWithOvers(match.home_team_score);
              forRuns += runs;
              forOvers += overs;
            }
            
            if (match.away_team_score) {
              const { runs, overs } = parseTeamScoreWithOvers(match.away_team_score);
              againstRuns += runs;
              againstOvers += overs;
            }
          } else {
            // Team is away team
            if (match.away_team_score) {
              const { runs, overs } = parseTeamScoreWithOvers(match.away_team_score);
              forRuns += runs;
              forOvers += overs;
            }
            
            if (match.home_team_score) {
              const { runs, overs } = parseTeamScoreWithOvers(match.home_team_score);
              againstRuns += runs;
              againstOvers += overs;
            }
          }
        }
      }
      
      // Calculate qualification status
      let qualified = false;
      let eliminated = false;
      
      // For IPL format, top 4 qualify for playoffs
      if (tournament.format === 'league' && tournament.tournamentType === 'league') {
        // Sort all teams by points and NRR
        const sortedStandings = [...standings].sort((a, b) => {
          if (a.points !== b.points) {
            return b.points - a.points;
          }
          return b.nrr - a.nrr;
        });
        
        // Determine position in the sorted list
        const position = sortedStandings.findIndex(s => s.teamId === teamId) + 1;
        const remainingMatches = tournamentMatches.filter(m => 
          m.status !== 'completed' && 
          (m.home_team_id === teamId || m.away_team_id === teamId)
        ).length;
        
        // If team is in top 4 and has no remaining matches, they qualify
        if (position <= 4 && remainingMatches === 0) {
          qualified = true;
        }
        
        // Calculate maximum possible points
        const maxPossiblePoints = standing.points + (remainingMatches * 2); // Assuming 2 points per win
        
        // Find 4th place team's points
        const fourthPlacePoints = sortedStandings.length >= 4 ? sortedStandings[3].points : 0;
        
        // If maximum possible points is less than 4th place, team is eliminated
        if (maxPossiblePoints < fourthPlacePoints) {
          eliminated = true;
        }
      }
      
      enhancedStandings.push({
        teamId,
        team,
        position: standing.position,
        played: standing.played,
        won: standing.won,
        lost: standing.lost,
        tied: standing.tied,
        noResult: standing.noResult,
        points: standing.points,
        nrr: standing.nrr,
        forRuns,
        forOvers,
        againstRuns,
        againstOvers,
        lastFiveMatches,
        homeRecord,
        awayRecord,
        qualified,
        eliminated
      });
    }
    
    // Sort by position
    enhancedStandings.sort((a, b) => a.position - b.position);
    
    return enhancedStandings;
  } catch (error) {
    console.error("Error getting enhanced tournament standings:", error);
    throw error;
  }
}

/**
 * Get top performers in a tournament
 */
export async function getTournamentTopPerformers(tournamentId: number) {
  try {
    // Get tournament details
    const tournament = await storage.getTournament(tournamentId);
    
    if (!tournament) {
      throw new Error(`Tournament with ID ${tournamentId} not found`);
    }
    
    // Get all player stats for this tournament
    const playerStats = await storage.getPlayerTournamentStatsByTournament(tournamentId);
    
    // Separate batting and bowling stats
    const battingStats = playerStats.filter(stat => stat.statCategory === 'batting');
    const bowlingStats = playerStats.filter(stat => stat.statCategory === 'bowling');
    const fieldingStats = playerStats.filter(stat => stat.statCategory === 'fielding');
    
    // Get top run scorers
    const topRunScorers = [...battingStats].sort((a, b) => (b.runs || 0) - (a.runs || 0)).slice(0, 5);
    
    // Get top wicket takers
    const topWicketTakers = [...bowlingStats].sort((a, b) => (b.wickets || 0) - (a.wickets || 0)).slice(0, 5);
    
    // Get highest strike rates (min 100 runs)
    const highestStrikeRates = [...battingStats]
      .filter(stat => (stat.runs || 0) >= 100)
      .sort((a, b) => (b.strikeRate || 0) - (a.strikeRate || 0))
      .slice(0, 5);
    
    // Get best economy rates (min 5 wickets)
    const bestEconomyRates = [...bowlingStats]
      .filter(stat => (stat.wickets || 0) >= 5)
      .sort((a, b) => (a.economy || 0) - (b.economy || 0))
      .slice(0, 5);
    
    // Get most sixes
    const mostSixes = [...battingStats].sort((a, b) => (b.sixes || 0) - (a.sixes || 0)).slice(0, 5);
    
    // Get best fielders
    const bestFielders = [...fieldingStats].sort((a, b) => 
      ((b.catches || 0) + (b.stumpings || 0) + (b.runOuts || 0)) - 
      ((a.catches || 0) + (a.stumpings || 0) + (a.runOuts || 0))
    ).slice(0, 5);
    
    // Add player and team details to stats
    async function addPlayerAndTeamDetails(statArray: any[]) {
      const statsWithDetails = await Promise.all(statArray.map(async stat => {
        const player = await storage.getUser(stat.userId);
        const team = await storage.getTeam(stat.teamId);
        
        return {
          ...stat,
          player,
          team
        };
      }));
      
      return statsWithDetails;
    }
    
    return {
      topRunScorers: await addPlayerAndTeamDetails(topRunScorers),
      topWicketTakers: await addPlayerAndTeamDetails(topWicketTakers),
      highestStrikeRates: await addPlayerAndTeamDetails(highestStrikeRates),
      bestEconomyRates: await addPlayerAndTeamDetails(bestEconomyRates),
      mostSixes: await addPlayerAndTeamDetails(mostSixes),
      bestFielders: await addPlayerAndTeamDetails(bestFielders)
    };
  } catch (error) {
    console.error("Error getting tournament top performers:", error);
    throw error;
  }
}

/**
 * Get head-to-head statistics between two teams in a tournament
 */
export async function getTeamHeadToHead(tournamentId: number, team1Id: number, team2Id: number) {
  try {
    // Get tournament details
    const tournament = await storage.getTournament(tournamentId);
    
    if (!tournament) {
      throw new Error(`Tournament with ID ${tournamentId} not found`);
    }
    
    // Get team details
    const team1 = await storage.getTeam(team1Id);
    const team2 = await storage.getTeam(team2Id);
    
    if (!team1 || !team2) {
      throw new Error('One or both teams not found');
    }
    
    // Get all matches between these teams in this tournament
    const allMatches = await storage.getTournamentMatchesByTournament(tournamentId);
    
    const headToHeadMatches = allMatches.filter(match => 
      (match.home_team_id === team1Id && match.away_team_id === team2Id) ||
      (match.home_team_id === team2Id && match.away_team_id === team1Id)
    );
    
    // Get details for each match
    const matchDetailsPromises = headToHeadMatches.map(match => 
      storage.getTournamentMatch(match.matchId)
    );
    const matches = await Promise.all(matchDetailsPromises);
    
    // Calculate head-to-head statistics
    const team1Wins = matches.filter(match => 
      (match.home_team_id === team1Id && match.result === 'home_win') ||
      (match.away_team_id === team1Id && match.result === 'away_win')
    ).length;
    
    const team2Wins = matches.filter(match => 
      (match.home_team_id === team2Id && match.result === 'home_win') ||
      (match.away_team_id === team2Id && match.result === 'away_win')
    ).length;
    
    const ties = matches.filter(match => match.result === 'tie').length;
    const noResults = matches.filter(match => match.result === 'no_result').length;
    
    // Calculate highest and lowest scores
    let team1HighestScore = 0;
    let team1LowestScore = Number.MAX_SAFE_INTEGER;
    let team2HighestScore = 0;
    let team2LowestScore = Number.MAX_SAFE_INTEGER;
    
    matches.forEach(match => {
      if (!match) return;
      
      // Process team1 scores
      if (match.home_team_id === team1Id && match.home_team_score) {
        const score = parseTeamScore(match.home_team_score);
        if (score > team1HighestScore) team1HighestScore = score;
        if (score < team1LowestScore && score > 0) team1LowestScore = score;
      } else if (match.away_team_id === team1Id && match.away_team_score) {
        const score = parseTeamScore(match.away_team_score);
        if (score > team1HighestScore) team1HighestScore = score;
        if (score < team1LowestScore && score > 0) team1LowestScore = score;
      }
      
      // Process team2 scores
      if (match.home_team_id === team2Id && match.home_team_score) {
        const score = parseTeamScore(match.home_team_score);
        if (score > team2HighestScore) team2HighestScore = score;
        if (score < team2LowestScore && score > 0) team2LowestScore = score;
      } else if (match.away_team_id === team2Id && match.away_team_score) {
        const score = parseTeamScore(match.away_team_score);
        if (score > team2HighestScore) team2HighestScore = score;
        if (score < team2LowestScore && score > 0) team2LowestScore = score;
      }
    });
    
    return {
      team1: {
        id: team1Id,
        name: team1.name,
        shortName: team1.shortName,
        wins: team1Wins,
        highestScore: team1HighestScore,
        lowestScore: team1LowestScore === Number.MAX_SAFE_INTEGER ? null : team1LowestScore
      },
      team2: {
        id: team2Id,
        name: team2.name,
        shortName: team2.shortName,
        wins: team2Wins,
        highestScore: team2HighestScore,
        lowestScore: team2LowestScore === Number.MAX_SAFE_INTEGER ? null : team2LowestScore
      },
      ties,
      noResults,
      totalMatches: headToHeadMatches.length,
      matches: matches.filter(Boolean)
    };
  } catch (error) {
    console.error("Error getting team head-to-head:", error);
    throw error;
  }
}

/**
 * Helper functions
 */

/**
 * Parse a team score string to extract the runs (e.g., "156/7" -> 156)
 */
function parseTeamScore(scoreString: string): number {
  if (!scoreString) return 0;
  
  // Extract runs from formats like "156/7" or "156-7"
  const runsMatch = scoreString.match(/^(\d+)[/-]/);
  
  if (runsMatch && runsMatch[1]) {
    return parseInt(runsMatch[1], 10);
  }
  
  // If no match, try to parse as a plain number
  const numScore = parseInt(scoreString, 10);
  return isNaN(numScore) ? 0 : numScore;
}

/**
 * Parse a team score string to extract both runs and overs
 */
function parseTeamScoreWithOvers(scoreString: string): { runs: number, overs: number } {
  if (!scoreString) return { runs: 0, overs: 0 };
  
  // Default result
  const result = { runs: 0, overs: 0 };
  
  // Extract runs from formats like "156/7"
  const runsMatch = scoreString.match(/^(\d+)[/-]/);
  
  if (runsMatch && runsMatch[1]) {
    result.runs = parseInt(runsMatch[1], 10);
  } else {
    // If no match, try to parse as a plain number
    const numScore = parseInt(scoreString, 10);
    if (!isNaN(numScore)) {
      result.runs = numScore;
    }
  }
  
  // Extract overs from formats like "156/7 (20)" or "156/7 (19.2)"
  const oversMatch = scoreString.match(/\((\d+(\.\d+)?)\)/);
  
  if (oversMatch && oversMatch[1]) {
    result.overs = parseFloat(oversMatch[1]);
  }
  
  return result;
}