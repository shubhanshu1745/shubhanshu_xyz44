import { storage } from '../../storage';
import { db } from '../../db';
import * as schema from '@shared/schema';
import { eq, and } from 'drizzle-orm';

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
  isBye?: boolean;
}

/**
 * Generates tournament fixtures based on the specified tournament type
 * Supports: league (round robin), knockout, and group_stage_knockout formats
 * Handles odd number of teams with BYE system
 */
export async function generateFixtures(tournamentId: number, options: {
  doubleRoundRobin?: boolean;
  scheduleWeekdayMatches?: boolean;
  maxMatchesPerDay?: number;
  prioritizeWeekends?: boolean;
  avoidBackToBackMatches?: boolean;
  startDate?: Date;
  endDate?: Date;
  venueIds?: number[];
}) {
  try {
    // Default options
    const defaultOptions = {
      doubleRoundRobin: false,
      scheduleWeekdayMatches: true,
      maxMatchesPerDay: 2,
      prioritizeWeekends: true,
      avoidBackToBackMatches: true,
      venueIds: []
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

    // Get venues for rotation
    let venues: number[] = fixtureOptions.venueIds || [];
    if (venues.length === 0) {
      const allVenues = await storage.getVenues();
      venues = allVenues.map((v: any) => v.id);
    }

    // Generate fixtures based on tournament format
    let fixtures: TournamentFixture[] = [];
    
    switch (tournament.tournamentType) {
      case "league":
        fixtures = generateLeagueFixtures(teamIds, fixtureOptions.doubleRoundRobin, venues);
        break;
      case "knockout":
        fixtures = generateKnockoutFixtures(teamIds, venues);
        break;
      case "group_stage_knockout":
        fixtures = await generateGroupStageKnockoutFixtures(tournamentId, teamIds, venues, fixtureOptions.doubleRoundRobin);
        break;
      default:
        fixtures = generateLeagueFixtures(teamIds, fixtureOptions.doubleRoundRobin, venues);
    }

    // Schedule fixtures with dates and times if dates are provided
    if (tournament.startDate && tournament.endDate) {
      fixtures = scheduleFixtures(
        fixtures, 
        new Date(tournament.startDate), 
        new Date(tournament.endDate), 
        fixtureOptions.maxMatchesPerDay,
        fixtureOptions.prioritizeWeekends,
        fixtureOptions.scheduleWeekdayMatches,
        fixtureOptions.avoidBackToBackMatches
      );
    }

    // Save fixtures to database
    await saveFixtures(tournamentId, fixtures);

    // Create initial standings for league and group formats
    if (tournament.tournamentType === "league" || tournament.tournamentType === "group_stage_knockout") {
      await createInitialStandings(tournamentId, teamIds);
    }

    return fixtures;
  } catch (error) {
    console.error("Error generating fixtures:", error);
    throw error;
  }
}

/**
 * Generates a round-robin league format using Circle Method algorithm
 * Properly handles odd number of teams with BYE
 */
function generateLeagueFixtures(teamIds: number[], doubleRoundRobin: boolean, venues: number[]): TournamentFixture[] {
  const fixtures: TournamentFixture[] = [];
  const n = teamIds.length;
  
  // If odd number of teams, add a BYE team (-1)
  const teams = [...teamIds];
  const hasOddTeams = n % 2 !== 0;
  if (hasOddTeams) {
    teams.push(-1); // -1 represents BYE
  }
  
  const numTeams = teams.length;
  const numRounds = numTeams - 1;
  const matchesPerRound = numTeams / 2;
  
  let venueIndex = 0;
  
  // Circle Method: Fix first team, rotate others
  for (let round = 0; round < numRounds; round++) {
    for (let match = 0; match < matchesPerRound; match++) {
      const home = match;
      const away = numTeams - 1 - match;
      
      const team1 = teams[home];
      const team2 = teams[away];
      
      // Skip if one of the teams is BYE
      if (team1 !== -1 && team2 !== -1) {
        // Alternate home and away for fairness
        const fixture: TournamentFixture = (round % 2 === 0) 
          ? { 
              team1Id: team1, 
              team2Id: team2, 
              round: round + 1,
              stage: 'league',
              venueId: venues.length > 0 ? venues[venueIndex % venues.length] : undefined
            }
          : { 
              team1Id: team2, 
              team2Id: team1, 
              round: round + 1,
              stage: 'league',
              venueId: venues.length > 0 ? venues[venueIndex % venues.length] : undefined
            };
        
        fixtures.push(fixture);
        venueIndex++;
      }
    }
    
    // Rotate teams (keep first team fixed, rotate the rest clockwise)
    const lastTeam = teams[numTeams - 1];
    for (let i = numTeams - 1; i > 1; i--) {
      teams[i] = teams[i - 1];
    }
    teams[1] = lastTeam;
  }
  
  // For double round-robin, add return fixtures with swapped home/away
  if (doubleRoundRobin && fixtures.length > 0) {
    const numSingleRoundFixtures = fixtures.length;
    
    for (let i = 0; i < numSingleRoundFixtures; i++) {
      const originalFixture = fixtures[i];
      const returnFixture: TournamentFixture = {
        team1Id: originalFixture.team2Id,
        team2Id: originalFixture.team1Id,
        round: (originalFixture.round || 0) + numRounds,
        stage: 'league',
        venueId: venues.length > 0 ? venues[venueIndex % venues.length] : undefined
      };
      
      fixtures.push(returnFixture);
      venueIndex++;
    }
  }
  
  // Add match numbers
  for (let i = 0; i < fixtures.length; i++) {
    fixtures[i].matchNumber = i + 1;
  }
  
  return fixtures;
}

/**
 * Generates a knockout tournament format with proper seeding
 * Handles non-power-of-2 teams with BYEs in first round
 */
function generateKnockoutFixtures(teamIds: number[], venues: number[]): TournamentFixture[] {
  const fixtures: TournamentFixture[] = [];
  const numTeams = teamIds.length;
  
  // Find the nearest power of 2 >= numTeams
  let bracketSize = 1;
  while (bracketSize < numTeams) {
    bracketSize *= 2;
  }
  
  // Number of BYEs needed
  const numByes = bracketSize - numTeams;
  
  // Total number of rounds
  const totalRounds = Math.log2(bracketSize);
  
  // Seed teams (top seeds get BYEs)
  const seededTeams = [...teamIds];
  
  // Add BYE placeholders at the end
  for (let i = 0; i < numByes; i++) {
    seededTeams.push(-1); // -1 represents BYE
  }
  
  // Create bracket positions (standard tournament seeding)
  const bracketPositions = createBracketSeeding(bracketSize);
  
  let matchNumber = 1;
  let venueIndex = 0;
  
  // Generate first round matches
  const firstRoundMatches = bracketSize / 2;
  const teamsAdvancingFromByes: { position: number; teamId: number }[] = [];
  
  for (let i = 0; i < firstRoundMatches; i++) {
    const pos1 = bracketPositions[i * 2];
    const pos2 = bracketPositions[i * 2 + 1];
    
    const team1 = seededTeams[pos1 - 1] || -1;
    const team2 = seededTeams[pos2 - 1] || -1;
    
    // If one team is BYE, the other advances automatically
    if (team1 === -1 && team2 !== -1) {
      teamsAdvancingFromByes.push({ position: i, teamId: team2 });
      continue;
    }
    if (team2 === -1 && team1 !== -1) {
      teamsAdvancingFromByes.push({ position: i, teamId: team1 });
      continue;
    }
    if (team1 === -1 && team2 === -1) {
      continue; // Both BYE, skip
    }
    
    const stageName = getKnockoutStageName(1, totalRounds);
    
    fixtures.push({
      team1Id: team1,
      team2Id: team2,
      round: 1,
      matchNumber: matchNumber++,
      stage: stageName,
      venueId: venues.length > 0 ? venues[venueIndex++ % venues.length] : undefined
    });
  }
  
  // Generate subsequent rounds with placeholder teams
  let currentRoundMatches = firstRoundMatches;
  
  for (let round = 2; round <= totalRounds; round++) {
    const numMatches = currentRoundMatches / 2;
    const stageName = getKnockoutStageName(round, totalRounds);
    
    for (let i = 0; i < numMatches; i++) {
      fixtures.push({
        team1Id: -1, // To be determined from previous round
        team2Id: -1, // To be determined from previous round
        round,
        matchNumber: matchNumber++,
        stage: stageName,
        venueId: venues.length > 0 ? venues[venueIndex++ % venues.length] : undefined
      });
    }
    
    currentRoundMatches = numMatches;
  }
  
  return fixtures;
}

/**
 * Creates standard tournament bracket seeding
 * E.g., for 8 teams: [1,8,4,5,2,7,3,6] so 1 plays 8, 4 plays 5, etc.
 */
function createBracketSeeding(size: number): number[] {
  if (size === 2) return [1, 2];
  
  const smaller = createBracketSeeding(size / 2);
  const result: number[] = [];
  
  for (const seed of smaller) {
    result.push(seed);
    result.push(size + 1 - seed);
  }
  
  return result;
}

/**
 * Gets the name of a knockout round
 */
function getKnockoutStageName(currentRound: number, totalRounds: number): string {
  const roundsFromEnd = totalRounds - currentRound;
  
  switch (roundsFromEnd) {
    case 0: return 'final';
    case 1: return 'semi-final';
    case 2: return 'quarter-final';
    default: return `round-${currentRound}`;
  }
}

/**
 * Generates Group Stage + Knockout format
 * Teams are divided into groups, play round-robin, then top teams advance to knockout
 */
async function generateGroupStageKnockoutFixtures(
  tournamentId: number,
  teamIds: number[], 
  venues: number[],
  doubleRoundRobin: boolean = false
): Promise<TournamentFixture[]> {
  const fixtures: TournamentFixture[] = [];
  const numTeams = teamIds.length;
  
  // Determine number of groups (2 groups for 4-8 teams, 4 groups for 9-16 teams, etc.)
  let numGroups = 2;
  if (numTeams > 8) numGroups = 4;
  if (numTeams > 16) numGroups = 8;
  
  // Ensure at least 2 teams per group
  while (numTeams / numGroups < 2 && numGroups > 1) {
    numGroups = numGroups / 2;
  }
  
  // Distribute teams into groups (snake draft style for fairness)
  const groups: number[][] = Array.from({ length: numGroups }, () => []);
  const shuffledTeams = [...teamIds].sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < shuffledTeams.length; i++) {
    const groupIndex = i % numGroups;
    groups[groupIndex].push(shuffledTeams[i]);
  }
  
  const groupNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  let matchNumber = 1;
  let venueIndex = 0;
  
  // Generate group stage fixtures
  for (let g = 0; g < numGroups; g++) {
    const groupTeams = groups[g];
    const groupName = groupNames[g];
    
    // Generate round-robin for this group
    const groupFixtures = generateLeagueFixtures(groupTeams, doubleRoundRobin, venues);
    
    for (const fixture of groupFixtures) {
      fixtures.push({
        ...fixture,
        matchNumber: matchNumber++,
        group: groupName,
        stage: 'group',
        venueId: venues.length > 0 ? venues[venueIndex++ % venues.length] : undefined
      });
    }
  }
  
  // Generate knockout stage fixtures
  // Top 2 from each group advance (or top 1 if only 2 teams per group)
  const teamsPerGroupAdvancing = Math.min(2, Math.floor(numTeams / numGroups));
  const knockoutTeams = numGroups * teamsPerGroupAdvancing;
  
  // Create placeholder knockout fixtures
  // For 2 groups: Semi-finals (A1 vs B2, B1 vs A2) -> Final
  // For 4 groups: Quarter-finals -> Semi-finals -> Final
  
  let knockoutRounds = Math.log2(knockoutTeams);
  if (!Number.isInteger(knockoutRounds)) {
    knockoutRounds = Math.ceil(knockoutRounds);
  }
  
  let currentRoundMatches = knockoutTeams / 2;
  
  for (let round = 1; round <= knockoutRounds; round++) {
    const stageName = getKnockoutStageName(round, knockoutRounds);
    const numMatches = Math.ceil(currentRoundMatches);
    
    for (let i = 0; i < numMatches; i++) {
      fixtures.push({
        team1Id: -1, // Placeholder - will be filled after group stage
        team2Id: -1, // Placeholder - will be filled after group stage
        round: round,
        matchNumber: matchNumber++,
        stage: stageName,
        venueId: venues.length > 0 ? venues[venueIndex++ % venues.length] : undefined
      });
    }
    
    currentRoundMatches = currentRoundMatches / 2;
  }
  
  return fixtures;
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
  
  // Sort fixtures by round and stage priority
  const stagePriority: { [key: string]: number } = {
    'group': 1,
    'league': 1,
    'round-1': 2,
    'round-2': 3,
    'quarter-final': 4,
    'semi-final': 5,
    'final': 6
  };
  
  scheduledFixtures.sort((a, b) => {
    const roundDiff = (a.round || 0) - (b.round || 0);
    if (roundDiff !== 0) return roundDiff;
    
    const stagePriorityA = stagePriority[a.stage || 'league'] || 0;
    const stagePriorityB = stagePriority[b.stage || 'league'] || 0;
    return stagePriorityA - stagePriorityB;
  });
  
  // Schedule each match
  for (let i = 0; i < scheduledFixtures.length; i++) {
    const fixture = scheduledFixtures[i];
    
    // Skip BYE matches
    if (fixture.team1Id === -1 || fixture.team2Id === -1) {
      continue;
    }
    
    let dateAssigned = false;
    const currentDate = new Date(startDate);
    
    while (!dateAssigned && currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      if (!matchesPerDay[dateStr]) {
        matchesPerDay[dateStr] = 0;
      }
      
      const canScheduleToday = 
        (isWeekend || scheduleWeekdayMatches) && 
        matchesPerDay[dateStr] < maxMatchesPerDay;
      
      // Check back-to-back constraint
      const team1LastPlayed = teamLastPlayedDate[fixture.team1Id];
      const team2LastPlayed = teamLastPlayedDate[fixture.team2Id];
      
      const backToBackForTeam1 = team1LastPlayed && 
        (currentDate.getTime() - team1LastPlayed.getTime()) < (24 * 60 * 60 * 1000) &&
        avoidBackToBackMatches;
      
      const backToBackForTeam2 = team2LastPlayed && 
        (currentDate.getTime() - team2LastPlayed.getTime()) < (24 * 60 * 60 * 1000) &&
        avoidBackToBackMatches;
      
      if (canScheduleToday && 
          (!avoidBackToBackMatches || (!backToBackForTeam1 && !backToBackForTeam2)) &&
          (!prioritizeWeekends || isWeekend || (currentDate.getTime() + (3 * 24 * 60 * 60 * 1000)) >= endDate.getTime())) {
        
        fixture.scheduledDate = new Date(currentDate);
        
        // Set time based on match slot
        const matchSlot = matchesPerDay[dateStr];
        if (matchSlot === 0) {
          fixture.scheduledTime = isWeekend ? "14:00" : "18:30";
        } else {
          fixture.scheduledTime = isWeekend ? "19:30" : "18:30";
        }
        
        matchesPerDay[dateStr]++;
        teamLastPlayedDate[fixture.team1Id] = new Date(currentDate);
        teamLastPlayedDate[fixture.team2Id] = new Date(currentDate);
        
        dateAssigned = true;
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Fallback to end date if no date could be assigned
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
    
    // Get tournament details for match creation
    const tournament = await storage.getTournament(tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }
    
    // Insert new fixtures
    for (const fixture of fixtures) {
      // Skip BYE matches
      if (fixture.team1Id === -1 || fixture.team2Id === -1) {
        continue;
      }
      
      // First create a match record
      const matchData = {
        title: `Match ${fixture.matchNumber || 0}`,
        venue: '',
        matchDate: fixture.scheduledDate || new Date(),
        matchType: tournament.format || 'T20',
        overs: tournament.overs || 20,
        team1Id: fixture.team1Id,
        team2Id: fixture.team2Id,
        status: 'upcoming',
        createdBy: tournament.organizerId
      };
      
      const createdMatch = await storage.createMatch(matchData);
      
      // Then create the tournament match linking record
      await storage.createTournamentMatch({
        tournamentId,
        matchId: createdMatch.id,
        round: fixture.round,
        matchNumber: fixture.matchNumber,
        stage: fixture.stage,
        group: fixture.group,
        scheduledDate: fixture.scheduledDate,
        scheduledTime: fixture.scheduledTime,
        venueId: fixture.venueId,
        status: "scheduled",
        home_team_id: fixture.team1Id,
        away_team_id: fixture.team2Id
      });
    }
  } catch (error) {
    console.error("Error saving fixtures:", error);
    throw error;
  }
}

/**
 * Creates initial standings entries for all teams in a league/group format
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
        tied: 0,
        no_result: 0,
        points: 0,
        netRunRate: "0",
        forRuns: 0,
        forOvers: "0",
        againstRuns: 0,
        againstOvers: "0",
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
 * Recalculates all standings for a tournament from scratch
 * Call this after match results are entered
 */
export async function recalculateStandings(tournamentId: number) {
  try {
    const tournament = await storage.getTournament(tournamentId);
    if (!tournament) {
      throw new Error(`Tournament with ID ${tournamentId} not found`);
    }
    
    // Get all teams
    const tournamentTeams = await storage.getTournamentTeams(tournamentId);
    const teamIds = tournamentTeams.map(t => t.teamId);
    
    // Reset standings
    for (const teamId of teamIds) {
      const standing = await storage.getTournamentStandingByTeam(tournamentId, teamId);
      if (standing) {
        await storage.updateTournamentStanding(standing.id, {
          played: 0,
          won: 0,
          lost: 0,
          tied: 0,
          no_result: 0,
          points: 0,
          netRunRate: "0",
          forRuns: 0,
          forOvers: "0",
          againstRuns: 0,
          againstOvers: "0"
        });
      }
    }
    
    // Get all completed matches
    const matches = await storage.getTournamentMatchesByTournament(tournamentId);
    const completedMatches = matches.filter(m => m.status === 'completed');
    
    // Process each completed match
    for (const match of completedMatches) {
      await processMatchResult(tournamentId, match);
    }
    
    // Update positions
    await updateStandingsPositions(tournamentId);
    
    return true;
  } catch (error) {
    console.error("Error recalculating standings:", error);
    throw error;
  }
}

/**
 * Process a single match result and update standings
 */
async function processMatchResult(tournamentId: number, match: any) {
  const tournament = await storage.getTournament(tournamentId);
  if (!tournament) return;
  
  const team1Id = match.home_team_id || match.team1Id;
  const team2Id = match.away_team_id || match.team2Id;
  
  if (!team1Id || !team2Id) return;
  
  const team1Standing = await storage.getTournamentStandingByTeam(tournamentId, team1Id);
  const team2Standing = await storage.getTournamentStandingByTeam(tournamentId, team2Id);
  
  if (!team1Standing || !team2Standing) return;
  
  // Parse scores (format: "156/7 (20)" or "156/7")
  const team1ScoreData = parseScoreString(match.home_team_score);
  const team2ScoreData = parseScoreString(match.away_team_score);
  
  // Points system from tournament settings
  const pointsPerWin = tournament.pointsPerWin || 2;
  const pointsPerLoss = tournament.pointsPerLoss || 0;
  const pointsPerTie = tournament.pointsPerTie || 1;
  const pointsPerNoResult = tournament.pointsPerNoResult || 1;
  
  // Update based on result
  let team1Points = 0;
  let team2Points = 0;
  let team1Won = 0, team1Lost = 0, team1Tied = 0, team1NoResult = 0;
  let team2Won = 0, team2Lost = 0, team2Tied = 0, team2NoResult = 0;
  
  switch (match.result) {
    case 'home_win':
      team1Points = pointsPerWin;
      team2Points = pointsPerLoss;
      team1Won = 1;
      team2Lost = 1;
      break;
    case 'away_win':
      team1Points = pointsPerLoss;
      team2Points = pointsPerWin;
      team1Lost = 1;
      team2Won = 1;
      break;
    case 'tie':
      team1Points = pointsPerTie;
      team2Points = pointsPerTie;
      team1Tied = 1;
      team2Tied = 1;
      break;
    case 'no_result':
    case 'abandoned':
      team1Points = pointsPerNoResult;
      team2Points = pointsPerNoResult;
      team1NoResult = 1;
      team2NoResult = 1;
      break;
    default:
      // Determine winner by score
      if (team1ScoreData.runs > team2ScoreData.runs) {
        team1Points = pointsPerWin;
        team2Points = pointsPerLoss;
        team1Won = 1;
        team2Lost = 1;
      } else if (team2ScoreData.runs > team1ScoreData.runs) {
        team1Points = pointsPerLoss;
        team2Points = pointsPerWin;
        team1Lost = 1;
        team2Won = 1;
      } else {
        team1Points = pointsPerTie;
        team2Points = pointsPerTie;
        team1Tied = 1;
        team2Tied = 1;
      }
  }
  
  // Update team 1 standings
  await storage.updateTournamentStanding(team1Standing.id, {
    played: (team1Standing.played || 0) + 1,
    won: (team1Standing.won || 0) + team1Won,
    lost: (team1Standing.lost || 0) + team1Lost,
    tied: (team1Standing.tied || 0) + team1Tied,
    no_result: (team1Standing.no_result || 0) + team1NoResult,
    points: (team1Standing.points || 0) + team1Points,
    forRuns: (team1Standing.forRuns || 0) + team1ScoreData.runs,
    forOvers: addOvers(team1Standing.forOvers || "0", team1ScoreData.overs),
    againstRuns: (team1Standing.againstRuns || 0) + team2ScoreData.runs,
    againstOvers: addOvers(team1Standing.againstOvers || "0", team2ScoreData.overs)
  });
  
  // Update team 2 standings
  await storage.updateTournamentStanding(team2Standing.id, {
    played: (team2Standing.played || 0) + 1,
    won: (team2Standing.won || 0) + team2Won,
    lost: (team2Standing.lost || 0) + team2Lost,
    tied: (team2Standing.tied || 0) + team2Tied,
    no_result: (team2Standing.no_result || 0) + team2NoResult,
    points: (team2Standing.points || 0) + team2Points,
    forRuns: (team2Standing.forRuns || 0) + team2ScoreData.runs,
    forOvers: addOvers(team2Standing.forOvers || "0", team2ScoreData.overs),
    againstRuns: (team2Standing.againstRuns || 0) + team1ScoreData.runs,
    againstOvers: addOvers(team2Standing.againstOvers || "0", team1ScoreData.overs)
  });
}

/**
 * Parse score string like "156/7 (20)" or "156/7" into runs and overs
 */
function parseScoreString(scoreString: string | null | undefined): { runs: number; overs: number } {
  if (!scoreString) return { runs: 0, overs: 0 };
  
  let runs = 0;
  let overs = 0;
  
  // Extract runs (before / or -)
  const runsMatch = scoreString.match(/^(\d+)/);
  if (runsMatch) {
    runs = parseInt(runsMatch[1], 10);
  }
  
  // Extract overs from parentheses like (20) or (19.4)
  const oversMatch = scoreString.match(/\((\d+\.?\d*)\)/);
  if (oversMatch) {
    overs = parseFloat(oversMatch[1]);
  }
  
  return { runs, overs };
}

/**
 * Add two overs values (handles decimal format like 19.4 + 0.2 = 20.0)
 */
function addOvers(overs1: string | number, overs2: number): string {
  const o1 = typeof overs1 === 'string' ? parseFloat(overs1) : overs1;
  
  // Convert to balls
  const balls1 = Math.floor(o1) * 6 + Math.round((o1 % 1) * 10);
  const balls2 = Math.floor(overs2) * 6 + Math.round((overs2 % 1) * 10);
  
  const totalBalls = balls1 + balls2;
  const totalOvers = Math.floor(totalBalls / 6);
  const remainingBalls = totalBalls % 6;
  
  return `${totalOvers}.${remainingBalls}`;
}

/**
 * Calculate Net Run Rate
 * NRR = (Total Runs Scored / Total Overs Faced) - (Total Runs Conceded / Total Overs Bowled)
 */
function calculateNRR(forRuns: number, forOvers: string | number, againstRuns: number, againstOvers: string | number): number {
  const forOversNum = typeof forOvers === 'string' ? parseFloat(forOvers) : forOvers;
  const againstOversNum = typeof againstOvers === 'string' ? parseFloat(againstOvers) : againstOvers;
  
  // Convert overs to decimal (19.4 overs = 19 + 4/6 = 19.667)
  const forOversDecimal = Math.floor(forOversNum) + (forOversNum % 1) * 10 / 6;
  const againstOversDecimal = Math.floor(againstOversNum) + (againstOversNum % 1) * 10 / 6;
  
  if (forOversDecimal === 0 || againstOversDecimal === 0) {
    return 0;
  }
  
  const runRateFor = forRuns / forOversDecimal;
  const runRateAgainst = againstRuns / againstOversDecimal;
  
  return Number((runRateFor - runRateAgainst).toFixed(3));
}

/**
 * Updates the positions of teams in the standings based on points and NRR
 */
async function updateStandingsPositions(tournamentId: number) {
  try {
    const allStandings = await storage.getTournamentStandingsByTournament(tournamentId);
    
    // Calculate NRR for each team
    for (const standing of allStandings) {
      const nrr = calculateNRR(
        standing.forRuns || 0,
        standing.forOvers || "0",
        standing.againstRuns || 0,
        standing.againstOvers || "0"
      );
      
      await storage.updateTournamentStanding(standing.id, {
        netRunRate: nrr.toString()
      });
    }
    
    // Re-fetch standings with updated NRR
    const updatedStandings = await storage.getTournamentStandingsByTournament(tournamentId);
    
    // Sort by points (desc), then NRR (desc), then wins (desc)
    const sortedStandings = [...updatedStandings].sort((a, b) => {
      // First by points
      const pointsDiff = (b.points || 0) - (a.points || 0);
      if (pointsDiff !== 0) return pointsDiff;
      
      // Then by NRR
      const nrrA = parseFloat(a.netRunRate?.toString() || "0");
      const nrrB = parseFloat(b.netRunRate?.toString() || "0");
      const nrrDiff = nrrB - nrrA;
      if (Math.abs(nrrDiff) > 0.001) return nrrDiff;
      
      // Then by wins
      return (b.won || 0) - (a.won || 0);
    });
    
    // Update positions
    for (let i = 0; i < sortedStandings.length; i++) {
      const standing = sortedStandings[i];
      await storage.updateTournamentStanding(standing.id, {
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
 * Updates tournament standings after a match result is recorded
 */
export async function updateStandings(tournamentId: number, matchId: number) {
  try {
    // Get match details
    const match = await storage.getTournamentMatch(matchId);
    
    if (!match) {
      throw new Error(`Match with ID ${matchId} not found`);
    }
    
    if (match.status !== 'completed') {
      throw new Error("Match is not completed yet");
    }
    
    // Process this match result
    await processMatchResult(tournamentId, match);
    
    // Update positions
    await updateStandingsPositions(tournamentId);
    
    // Check if knockout stage needs to be updated
    const tournament = await storage.getTournament(tournamentId);
    if (tournament && tournament.tournamentType === 'group_stage_knockout') {
      await checkAndUpdateKnockoutStage(tournamentId);
    }
    
    return true;
  } catch (error) {
    console.error("Error updating standings:", error);
    throw error;
  }
}

/**
 * Check if group stage is complete and update knockout fixtures
 */
async function checkAndUpdateKnockoutStage(tournamentId: number) {
  try {
    const matches = await storage.getTournamentMatchesByTournament(tournamentId);
    
    // Check if all group stage matches are completed
    const groupMatches = matches.filter(m => m.stage === 'group');
    const completedGroupMatches = groupMatches.filter(m => m.status === 'completed');
    
    if (groupMatches.length === 0 || completedGroupMatches.length < groupMatches.length) {
      return; // Group stage not complete
    }
    
    // Get standings sorted by position
    const standings = await storage.getTournamentStandingsByTournament(tournamentId);
    const sortedStandings = [...standings].sort((a, b) => (a.position || 0) - (b.position || 0));
    
    // Get knockout matches
    const knockoutMatches = matches.filter(m => 
      m.stage === 'quarter-final' || m.stage === 'semi-final' || m.stage === 'final'
    ).sort((a, b) => (a.matchNumber || 0) - (b.matchNumber || 0));
    
    if (knockoutMatches.length === 0) return;
    
    // For 2 groups: A1 vs B2, B1 vs A2 in semi-finals
    // Get top 2 from each group
    const groupA = sortedStandings.filter(s => s.group === 'A').slice(0, 2);
    const groupB = sortedStandings.filter(s => s.group === 'B').slice(0, 2);
    
    if (groupA.length >= 2 && groupB.length >= 2) {
      // Update semi-final 1: A1 vs B2
      if (knockoutMatches[0]) {
        await storage.updateTournamentMatch(knockoutMatches[0].id, {
          home_team_id: groupA[0].teamId,
          away_team_id: groupB[1].teamId
        });
      }
      
      // Update semi-final 2: B1 vs A2
      if (knockoutMatches[1]) {
        await storage.updateTournamentMatch(knockoutMatches[1].id, {
          home_team_id: groupB[0].teamId,
          away_team_id: groupA[1].teamId
        });
      }
    }
  } catch (error) {
    console.error("Error updating knockout stage:", error);
  }
}

/**
 * Updates knockout bracket after a knockout match is completed
 */
export async function updateKnockoutBracket(tournamentId: number, matchId: number) {
  try {
    const match = await storage.getTournamentMatch(matchId);
    if (!match || match.status !== 'completed') return;
    
    // Determine winner
    let winnerId: number | null = null;
    
    if (match.result === 'home_win') {
      winnerId = match.home_team_id;
    } else if (match.result === 'away_win') {
      winnerId = match.away_team_id;
    } else {
      // For ties in knockout, need super over or other tiebreaker
      // For now, default to home team
      winnerId = match.home_team_id;
    }
    
    if (!winnerId) return;
    
    // Find the next match in the bracket
    const allMatches = await storage.getTournamentMatchesByTournament(tournamentId);
    const knockoutMatches = allMatches.filter(m => 
      m.stage === 'quarter-final' || m.stage === 'semi-final' || m.stage === 'final'
    ).sort((a, b) => (a.matchNumber || 0) - (b.matchNumber || 0));
    
    const currentMatchIndex = knockoutMatches.findIndex(m => m.id === matchId);
    if (currentMatchIndex === -1) return;
    
    // Calculate next match index
    // In a standard bracket: matches 0,1 feed into match at index (numMatches/2)
    const currentStageMatches = knockoutMatches.filter(m => m.stage === match.stage);
    const matchIndexInStage = currentStageMatches.findIndex(m => m.id === matchId);
    
    // Find next stage
    const stageOrder = ['quarter-final', 'semi-final', 'final'];
    const currentStageIndex = stageOrder.indexOf(match.stage || '');
    if (currentStageIndex === -1 || currentStageIndex >= stageOrder.length - 1) return;
    
    const nextStage = stageOrder[currentStageIndex + 1];
    const nextStageMatches = knockoutMatches.filter(m => m.stage === nextStage);
    
    if (nextStageMatches.length === 0) return;
    
    // Determine which slot in next match
    const nextMatchIndex = Math.floor(matchIndexInStage / 2);
    const isFirstSlot = matchIndexInStage % 2 === 0;
    
    if (nextStageMatches[nextMatchIndex]) {
      const updateData = isFirstSlot 
        ? { home_team_id: winnerId }
        : { away_team_id: winnerId };
      
      await storage.updateTournamentMatch(nextStageMatches[nextMatchIndex].id, updateData);
    }
  } catch (error) {
    console.error("Error updating knockout bracket:", error);
  }
}

/**
 * Updates tournament knockout stages based on group standings
 */
export async function updateKnockoutStages(tournamentId: number) {
  return checkAndUpdateKnockoutStage(tournamentId);
}

/**
 * Tracks statistical leaders for a tournament
 */
export async function updateTournamentStatistics(tournamentId: number, matchId: number) {
  try {
    return true;
  } catch (error) {
    console.error("Error updating tournament statistics:", error);
    throw error;
  }
}
