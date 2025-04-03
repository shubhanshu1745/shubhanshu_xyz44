import { storage } from '../../storage';
import * as schema from '@shared/schema';

/**
 * Generates tournament fixtures based on the specified tournament type
 * Supports: league (round robin), knockout, and group_stage_knockout formats
 */
export async function generateFixtures(tournamentId: number, options: {
  doubleRoundRobin?: boolean;
  scheduleWeekdayMatches?: boolean;
  maxMatchesPerDay?: number;
  prioritizeWeekends?: boolean;
  avoidBackToBackMatches?: boolean;
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    // Default options
    const defaultOptions = {
      doubleRoundRobin: false,
      scheduleWeekdayMatches: true,
      maxMatchesPerDay: 2,
      prioritizeWeekends: true,
      avoidBackToBackMatches: true
    };

    const fixtureOptions = { ...defaultOptions, ...options };
    
    // Get tournament details
    const tournament = await storage.getTournament(tournamentId);

    if (!tournament) {
      throw new Error(`Tournament with ID ${tournamentId} not found`);
    }

    // Get teams registered for the tournament
    const tournamentTeams = await storage.getTournamentTeams(tournamentId);

    if (tournamentTeams.length < 2) {
      throw new Error("At least two teams are required to generate fixtures");
    }

    // Get team IDs
    const teamIds = tournamentTeams.map(t => t.teamId);

    // Generate fixtures based on tournament format
    let fixtures = [];
    
    switch (tournament.format) {
      case "league":
        fixtures = generateLeagueFixtures(teamIds, fixtureOptions.doubleRoundRobin);
        break;
      case "knockout":
        fixtures = generateKnockoutFixtures(teamIds.length);
        break;
      case "group_stage_knockout":
        // First, we need to handle groups
        // This requires additional implementation
        // For now, we'll throw an error
        throw new Error("Group stage + knockout format not yet implemented");
      default:
        fixtures = generateLeagueFixtures(teamIds, fixtureOptions.doubleRoundRobin);
    }

    // Schedule fixtures with dates and times if dates are provided
    if (tournament.startDate && tournament.endDate) {
      fixtures = scheduleFixtures(
        fixtures, 
        tournament.startDate, 
        tournament.endDate, 
        fixtureOptions.maxMatchesPerDay,
        fixtureOptions.prioritizeWeekends,
        fixtureOptions.scheduleWeekdayMatches,
        fixtureOptions.avoidBackToBackMatches
      );
    }

    // Save fixtures to database
    await saveFixtures(tournamentId, fixtures);

    // If it's a league format, create initial standings
    if (tournament.format === "league") {
      await createInitialStandings(tournamentId, teamIds);
    }

    return fixtures;
  } catch (error) {
    console.error("Error generating fixtures:", error);
    throw error;
  }
}

/**
 * Interface representing a tournament fixture
 */
interface TournamentFixture {
  team1Id: number;
  team2Id: number;
  round?: number;
  matchNumber?: number;
  stage?: string;
  group?: string;
  scheduledDate?: Date;
  scheduledTime?: string;
  venueId?: number;
}

/**
 * Generates a round-robin league format
 */
function generateLeagueFixtures(teamIds: number[], doubleRoundRobin: boolean): TournamentFixture[] {
  const fixtures: TournamentFixture[] = [];
  const n = teamIds.length;
  
  // If odd number of teams, add a dummy team (bye)
  const teams = [...teamIds];
  if (n % 2 !== 0) {
    teams.push(-1); // -1 represents "bye"
  }
  
  const numTeams = teams.length;
  const numRounds = numTeams - 1;
  const matchesPerRound = numTeams / 2;
  
  // Generate single round-robin fixtures using circle method
  for (let round = 0; round < numRounds; round++) {
    for (let match = 0; match < matchesPerRound; match++) {
      const home = match;
      const away = numTeams - 1 - match;
      
      // Skip if one of the teams is the dummy team
      if (teams[home] !== -1 && teams[away] !== -1) {
        // Alternate home and away teams for fairness
        const fixture: TournamentFixture = (round % 2 === 0) 
          ? { team1Id: teams[home], team2Id: teams[away], round: round + 1 }
          : { team1Id: teams[away], team2Id: teams[home], round: round + 1 };
        
        fixtures.push(fixture);
      }
    }
    
    // Rotate teams (keep first team fixed, rotate the rest)
    const firstTeam = teams[0];
    const lastTeam = teams[numTeams - 1];
    
    for (let i = numTeams - 1; i > 1; i--) {
      teams[i] = teams[i - 1];
    }
    
    teams[1] = lastTeam;
  }
  
  // For double round-robin, add return fixtures
  if (doubleRoundRobin && fixtures.length > 0) {
    const numSingleRoundFixtures = fixtures.length;
    
    for (let i = 0; i < numSingleRoundFixtures; i++) {
      const originalFixture = fixtures[i];
      const returnFixture: TournamentFixture = {
        team1Id: originalFixture.team2Id,
        team2Id: originalFixture.team1Id,
        round: (originalFixture.round || 0) + numRounds
      };
      
      fixtures.push(returnFixture);
    }
  }
  
  // Add match numbers
  for (let i = 0; i < fixtures.length; i++) {
    fixtures[i].matchNumber = i + 1;
  }
  
  return fixtures;
}

/**
 * Generates a knockout tournament format
 */
function generateKnockoutFixtures(numTeams: number): TournamentFixture[] {
  const fixtures: TournamentFixture[] = [];
  
  // Find the nearest power of 2 greater than or equal to numTeams
  let nextPowerOf2 = 1;
  while (nextPowerOf2 < numTeams) {
    nextPowerOf2 *= 2;
  }
  
  // Number of teams with byes in the first round
  const numByes = nextPowerOf2 - numTeams;
  
  // Total number of rounds in the tournament
  const totalRounds = Math.log2(nextPowerOf2);
  
  // First round matches (with byes factored in)
  const firstRoundMatches = nextPowerOf2 / 2 - numByes;
  
  // Assign placeholder team IDs for now - these will be updated based on results
  for (let i = 0; i < firstRoundMatches; i++) {
    const team1Id = i * 2 + 1;
    const team2Id = i * 2 + 2;
    
    const fixture: TournamentFixture = {
      team1Id,
      team2Id,
      round: 1,
      matchNumber: i + 1,
      stage: getRoundName(totalRounds, 1)
    };
    
    fixtures.push(fixture);
  }
  
  // Add subsequent rounds with placeholder team IDs
  let currentRoundMatches = firstRoundMatches;
  let matchNumberOffset = firstRoundMatches;
  
  for (let round = 2; round <= totalRounds; round++) {
    const numMatches = currentRoundMatches / 2;
    const roundName = getRoundName(totalRounds, round);
    
    for (let i = 0; i < numMatches; i++) {
      const fixture: TournamentFixture = {
        team1Id: -1, // placeholder, will be determined by previous round
        team2Id: -1, // placeholder, will be determined by previous round
        round,
        matchNumber: matchNumberOffset + i + 1,
        stage: roundName
      };
      
      fixtures.push(fixture);
    }
    
    matchNumberOffset += numMatches;
    currentRoundMatches = numMatches;
  }
  
  return fixtures;
}

/**
 * Gets the name of a knockout round based on the total number of rounds and current round
 */
function getRoundName(totalRounds: number, currentRound: number): string {
  if (currentRound === totalRounds) {
    return "Final";
  } else if (currentRound === totalRounds - 1) {
    return "Semi-Final";
  } else if (currentRound === totalRounds - 2) {
    return "Quarter-Final";
  } else {
    return `Round ${currentRound}`;
  }
}

/**
 * Schedules fixtures with dates, times, and venues
 */
function scheduleFixtures(
  fixtures: TournamentFixture[],
  startDate: Date, 
  endDate: Date, 
  maxMatchesPerDay: number,
  prioritizeWeekends: boolean,
  scheduleWeekdayMatches: boolean,
  avoidBackToBackMatches: boolean
): TournamentFixture[] {
  const scheduledFixtures = [...fixtures];
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (totalDays < 1) {
    throw new Error("Tournament start date must be before end date");
  }
  
  const matchesPerDay: { [key: string]: number } = {};
  const teamLastPlayedDate: { [key: number]: Date } = {};
  
  // Sort fixtures by round to ensure rounds are played in order
  scheduledFixtures.sort((a, b) => (a.round || 0) - (b.round || 0));
  
  // Schedule each match
  for (let i = 0; i < scheduledFixtures.length; i++) {
    const fixture = scheduledFixtures[i];
    let dateAssigned = false;
    
    // Start from tournament start date
    const currentDate = new Date(startDate);
    
    while (!dateAssigned && currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      // Initialize matches count for this day if not already set
      if (!matchesPerDay[dateStr]) {
        matchesPerDay[dateStr] = 0;
      }
      
      // Check if we can schedule a match on this day
      const canScheduleToday = 
        (isWeekend || scheduleWeekdayMatches) && 
        matchesPerDay[dateStr] < maxMatchesPerDay;
      
      // Check if teams are playing back-to-back (if we're trying to avoid that)
      const team1LastPlayed = teamLastPlayedDate[fixture.team1Id];
      const team2LastPlayed = teamLastPlayedDate[fixture.team2Id];
      
      const backToBackForTeam1 = team1LastPlayed && 
        (currentDate.getTime() - team1LastPlayed.getTime()) < (24 * 60 * 60 * 1000) &&
        avoidBackToBackMatches;
      
      const backToBackForTeam2 = team2LastPlayed && 
        (currentDate.getTime() - team2LastPlayed.getTime()) < (24 * 60 * 60 * 1000) &&
        avoidBackToBackMatches;
      
      // Prioritize weekends if set
      if (canScheduleToday && 
          (!avoidBackToBackMatches || (!backToBackForTeam1 && !backToBackForTeam2)) &&
          (!prioritizeWeekends || isWeekend || (currentDate.getTime() + (3 * 24 * 60 * 60 * 1000)) >= endDate.getTime())) {
        
        // Set the fixture date
        fixture.scheduledDate = new Date(currentDate);
        
        // Set a default time (4:00 PM for weekends, 6:30 PM for weekdays)
        fixture.scheduledTime = isWeekend ? "16:00" : "18:30";
        
        // Increment the matches for this day and update last played date for teams
        matchesPerDay[dateStr]++;
        teamLastPlayedDate[fixture.team1Id] = new Date(currentDate);
        teamLastPlayedDate[fixture.team2Id] = new Date(currentDate);
        
        dateAssigned = true;
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // If no date could be assigned, set it to the end date
    if (!dateAssigned) {
      fixture.scheduledDate = new Date(endDate);
      fixture.scheduledTime = "16:00";
    }
  }
  
  return scheduledFixtures;
}

/**
 * Saves generated fixtures to the database
 */
async function saveFixtures(tournamentId: number, fixtures: TournamentFixture[]) {
  try {
    // First, remove any existing fixtures for this tournament
    const existingMatches = await storage.getTournamentMatchesByTournament(tournamentId);
    for (const match of existingMatches) {
      await storage.deleteTournamentMatch(match.id);
    }
    
    // Insert new fixtures
    for (const fixture of fixtures) {
      await storage.createTournamentMatch({
        tournamentId,
        team1Id: fixture.team1Id,
        team2Id: fixture.team2Id,
        round: fixture.round,
        matchNumber: fixture.matchNumber,
        stage: fixture.stage,
        group: fixture.group,
        scheduledDate: fixture.scheduledDate,
        scheduledTime: fixture.scheduledTime,
        venueId: fixture.venueId,
        status: "scheduled"
      });
    }
  } catch (error) {
    console.error("Error saving fixtures:", error);
    throw error;
  }
}

/**
 * Creates initial standings entries for all teams in a league format
 */
async function createInitialStandings(tournamentId: number, teamIds: number[]) {
  try {
    // First, remove any existing standings for this tournament
    const existingStandings = await storage.getTournamentStandingsByTournament(tournamentId);
    for (const standing of existingStandings) {
      await storage.deleteTournamentStanding(standing.id);
    }
    
    // Insert initial standings for each team
    for (const teamId of teamIds) {
      await storage.createTournamentStanding({
        tournamentId,
        teamId,
        played: 0,
        won: 0,
        lost: 0,
        drawn: 0,
        points: 0,
        runsScored: 0,
        runsConceded: 0,
        netRunRate: 0,
        position: 0
      });
    }
    
    // Update positions
    await updateStandingsPositions(tournamentId);
  } catch (error) {
    console.error("Error creating initial standings:", error);
    throw error;
  }
}

/**
 * Updates tournament standings after a match result is recorded
 */
export async function updateStandings(tournamentId: number, matchId: number) {
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
    
    // Get the current standings for both teams
    const team1Standing = await db.query.tournamentStandings.findFirst({
      where: and(
        eq(schema.tournamentStandings.tournamentId, tournamentId),
        eq(schema.tournamentStandings.teamId, match.team1Id)
      )
    });
    
    const team2Standing = await db.query.tournamentStandings.findFirst({
      where: and(
        eq(schema.tournamentStandings.tournamentId, tournamentId),
        eq(schema.tournamentStandings.teamId, match.team2Id)
      )
    });
    
    if (!team1Standing || !team2Standing) {
      throw new Error("Team standings not found");
    }
    
    // Update standings based on match result
    // Assuming team1 = home team, team2 = away team
    const team1Score = match.team1Score || 0;
    const team2Score = match.team2Score || 0;
    
    // Increment played matches for both teams
    await db.update(schema.tournamentStandings)
      .set({ played: team1Standing.played + 1 })
      .where(and(
        eq(schema.tournamentStandings.tournamentId, tournamentId),
        eq(schema.tournamentStandings.teamId, match.team1Id)
      ));
    
    await db.update(schema.tournamentStandings)
      .set({ played: team2Standing.played + 1 })
      .where(and(
        eq(schema.tournamentStandings.tournamentId, tournamentId),
        eq(schema.tournamentStandings.teamId, match.team2Id)
      ));
    
    // Update win/loss/draw and points
    if (team1Score > team2Score) {
      // Team 1 wins
      await db.update(schema.tournamentStandings)
        .set({ 
          won: team1Standing.won + 1,
          points: team1Standing.points + 2
        })
        .where(and(
          eq(schema.tournamentStandings.tournamentId, tournamentId),
          eq(schema.tournamentStandings.teamId, match.team1Id)
        ));
      
      await db.update(schema.tournamentStandings)
        .set({ lost: team2Standing.lost + 1 })
        .where(and(
          eq(schema.tournamentStandings.tournamentId, tournamentId),
          eq(schema.tournamentStandings.teamId, match.team2Id)
        ));
    } else if (team2Score > team1Score) {
      // Team 2 wins
      await db.update(schema.tournamentStandings)
        .set({ lost: team1Standing.lost + 1 })
        .where(and(
          eq(schema.tournamentStandings.tournamentId, tournamentId),
          eq(schema.tournamentStandings.teamId, match.team1Id)
        ));
      
      await db.update(schema.tournamentStandings)
        .set({ 
          won: team2Standing.won + 1,
          points: team2Standing.points + 2
        })
        .where(and(
          eq(schema.tournamentStandings.tournamentId, tournamentId),
          eq(schema.tournamentStandings.teamId, match.team2Id)
        ));
    } else {
      // Draw
      await db.update(schema.tournamentStandings)
        .set({ 
          drawn: team1Standing.drawn + 1,
          points: team1Standing.points + 1
        })
        .where(and(
          eq(schema.tournamentStandings.tournamentId, tournamentId),
          eq(schema.tournamentStandings.teamId, match.team1Id)
        ));
      
      await db.update(schema.tournamentStandings)
        .set({ 
          drawn: team2Standing.drawn + 1,
          points: team2Standing.points + 1
        })
        .where(and(
          eq(schema.tournamentStandings.tournamentId, tournamentId),
          eq(schema.tournamentStandings.teamId, match.team2Id)
        ));
    }
    
    // Update runs scored and conceded
    await db.update(schema.tournamentStandings)
      .set({ 
        runsScored: team1Standing.runsScored + team1Score,
        runsConceded: team1Standing.runsConceded + team2Score
      })
      .where(and(
        eq(schema.tournamentStandings.tournamentId, tournamentId),
        eq(schema.tournamentStandings.teamId, match.team1Id)
      ));
    
    await db.update(schema.tournamentStandings)
      .set({ 
        runsScored: team2Standing.runsScored + team2Score,
        runsConceded: team2Standing.runsConceded + team1Score
      })
      .where(and(
        eq(schema.tournamentStandings.tournamentId, tournamentId),
        eq(schema.tournamentStandings.teamId, match.team2Id)
      ));
    
    // Update net run rates
    // NRR = (Total runs scored / Total overs faced) - (Total runs conceded / Total overs bowled)
    // For simplicity, we'll use a simplified version: (runsScored - runsConceded) / played
    await db.update(schema.tournamentStandings)
      .set({ 
        netRunRate: (team1Standing.runsScored + team1Score - team1Standing.runsConceded - team2Score) / (team1Standing.played + 1)
      })
      .where(and(
        eq(schema.tournamentStandings.tournamentId, tournamentId),
        eq(schema.tournamentStandings.teamId, match.team1Id)
      ));
    
    await db.update(schema.tournamentStandings)
      .set({ 
        netRunRate: (team2Standing.runsScored + team2Score - team2Standing.runsConceded - team1Score) / (team2Standing.played + 1)
      })
      .where(and(
        eq(schema.tournamentStandings.tournamentId, tournamentId),
        eq(schema.tournamentStandings.teamId, match.team2Id)
      ));
    
    // Update positions in the standings
    await updateStandingsPositions(tournamentId);
    
    // If this is a knockout tournament, update the next round with the winner
    const tournament = await db.query.tournaments.findFirst({
      where: eq(schema.tournaments.id, tournamentId)
    });
    
    if (tournament && (tournament.format === "knockout" || tournament.format === "group_stage_knockout")) {
      // Get the next match based on this match's number
      // This is a simplified approach - in a real implementation, you would have more complex logic
      const nextMatchNumber = Math.floor((match.matchNumber || 0) / 2) + Math.floor(tournament.numTeams! / 2);
      const winningTeamId = team1Score > team2Score ? match.team1Id : match.team2Id;
      
      // Update the next match with the winner
      if (match.matchNumber && match.matchNumber % 2 === 1) {
        // Odd match number, winner goes to team1 of next match
        await db.update(schema.tournamentMatches)
          .set({ team1Id: winningTeamId })
          .where(and(
            eq(schema.tournamentMatches.tournamentId, tournamentId),
            eq(schema.tournamentMatches.matchNumber, nextMatchNumber)
          ));
      } else {
        // Even match number, winner goes to team2 of next match
        await db.update(schema.tournamentMatches)
          .set({ team2Id: winningTeamId })
          .where(and(
            eq(schema.tournamentMatches.tournamentId, tournamentId),
            eq(schema.tournamentMatches.matchNumber, nextMatchNumber)
          ));
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error updating standings:", error);
    throw error;
  }
}

/**
 * Updates the positions of teams in the standings based on points and net run rate
 */
async function updateStandingsPositions(tournamentId: number) {
  try {
    // Get all standings for this tournament
    const allStandings = await storage.getTournamentStandingsByTournament(tournamentId);
    
    // Sort by points (desc) and NRR (desc)
    const standings = [...allStandings].sort((a, b) => {
      // First sort by points
      const pointsDiff = b.points - a.points;
      if (pointsDiff !== 0) return pointsDiff;
      
      // If points are equal, sort by net run rate
      return (b.netRunRate || 0) - (a.netRunRate || 0);
    });
    
    // Update positions
    for (let i = 0; i < standings.length; i++) {
      const standing = standings[i];
      await storage.updateTournamentStanding(standing.id, {
        ...standing,
        position: i + 1
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error updating standings positions:", error);
    throw error;
  }
}

/**
 * Updates tournament knockout stages based on group standings
 * This would be called after all group matches are completed
 */
export async function updateKnockoutStages(tournamentId: number) {
  try {
    const tournament = await db.query.tournaments.findFirst({
      where: eq(schema.tournaments.id, tournamentId)
    });
    
    if (!tournament || tournament.format !== "group_stage_knockout") {
      throw new Error("Tournament not found or not a group stage + knockout format");
    }
    
    // Get all groups in this tournament
    const standings = await db.query.tournamentStandings.findMany({
      where: eq(schema.tournamentStandings.tournamentId, tournamentId),
      orderBy: [
        { column: schema.tournamentStandings.group, order: 'asc' },
        { column: schema.tournamentStandings.position, order: 'asc' }
      ]
    });
    
    // Group standings by group
    const groups: { [key: string]: typeof standings } = {};
    for (const standing of standings) {
      const group = standing.group || 'default';
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(standing);
    }
    
    // Get knockout phase matches
    const knockoutMatches = await db.query.tournamentMatches.findMany({
      where: and(
        eq(schema.tournamentMatches.tournamentId, tournamentId),
        eq(schema.tournamentMatches.stage, 'Knockout')
      ),
      orderBy: [
        { column: schema.tournamentMatches.matchNumber, order: 'asc' }
      ]
    });
    
    if (knockoutMatches.length === 0) {
      throw new Error("No knockout matches found");
    }
    
    // For a simple implementation, assume top 2 teams from each group advance
    // and we match A1 vs B2, B1 vs A2, etc.
    let matchIndex = 0;
    const groupKeys = Object.keys(groups).sort();
    
    for (let i = 0; i < groupKeys.length; i++) {
      const groupA = groupKeys[i];
      const groupB = groupKeys[(i + 1) % groupKeys.length];
      
      if (groups[groupA].length >= 2 && groups[groupB].length >= 2 && matchIndex < knockoutMatches.length) {
        // A1 vs B2
        await db.update(schema.tournamentMatches)
          .set({ 
            team1Id: groups[groupA][0].teamId,
            team2Id: groups[groupB][1].teamId,
          })
          .where(eq(schema.tournamentMatches.id, knockoutMatches[matchIndex].id));
        
        matchIndex++;
        
        // B1 vs A2
        if (matchIndex < knockoutMatches.length) {
          await db.update(schema.tournamentMatches)
            .set({ 
              team1Id: groups[groupB][0].teamId,
              team2Id: groups[groupA][1].teamId,
            })
            .where(eq(schema.tournamentMatches.id, knockoutMatches[matchIndex].id));
          
          matchIndex++;
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error updating knockout stages:", error);
    throw error;
  }
}

/**
 * Tracks statistical leaders for a tournament
 */
export async function updateTournamentStatistics(tournamentId: number, matchId: number) {
  try {
    // This would involve complex logic to aggregate player and team statistics
    // For now, we'll just return a placeholder
    return true;
  } catch (error) {
    console.error("Error updating tournament statistics:", error);
    throw error;
  }
}