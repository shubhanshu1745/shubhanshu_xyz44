import { storage } from '../../storage';
import { ipl2023Teams, ipl2023Venues } from '../../data/ipl-2023-teams';
import * as schema from '@shared/schema';
import { addDays, format, differenceInDays, isWeekend, parse } from 'date-fns';

/**
 * Advanced interface representing a tournament fixture with additional fields
 */
interface EnhancedTournamentFixture {
  team1Id: number;
  team2Id: number;
  round?: number;
  matchNumber?: number;
  stage?: string;
  group?: string;
  scheduledDate?: Date;
  scheduledTime?: string;
  venueId?: number;
  isPlayoff?: boolean; 
  playoffRound?: string;
  isEliminator?: boolean;
  isNeutralVenue?: boolean;
}

/**
 * Interfaces for enhanced fixture generation options
 */
interface EnhancedFixtureOptions {
  doubleRoundRobin: boolean;
  scheduleWeekdayMatches: boolean;
  maxMatchesPerDay: number;
  prioritizeWeekends: boolean;
  avoidBackToBackMatches: boolean;
  useNeutralVenues: boolean;
  startDate?: Date;
  endDate?: Date;
  specificDays?: string[];
  isPlayoff?: boolean;
  scheduleEvenly?: boolean;
  iplFormat?: boolean;
}

/**
 * Advanced fixture generator that supports all tournament formats
 * with enhanced scheduling capabilities
 */
export async function generateEnhancedFixtures(tournamentId: number, options: Partial<EnhancedFixtureOptions> = {}) {
  try {
    // Default fixture options
    const defaultOptions: EnhancedFixtureOptions = {
      doubleRoundRobin: false,
      scheduleWeekdayMatches: true,
      maxMatchesPerDay: 2,
      prioritizeWeekends: true,
      avoidBackToBackMatches: true,
      useNeutralVenues: false,
      scheduleEvenly: true,
      iplFormat: false
    };

    const fixtureOptions: EnhancedFixtureOptions = { ...defaultOptions, ...options };
    
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
    
    // Get venues for the tournament
    let venues = [];
    
    if (tournament.venueIds && tournament.venueIds.length > 0) {
      const venuePromises = tournament.venueIds.map(id => storage.getVenue(id));
      venues = await Promise.all(venuePromises);
    } else if (fixtureOptions.iplFormat) {
      // Use IPL 2023 venues if no venues were specified
      venues = ipl2023Venues;
    } else {
      // Fetch available venues
      venues = await storage.getAllVenues();
    }
    
    if (venues.length === 0) {
      throw new Error("At least one venue is required to generate fixtures");
    }
    
    // Generate fixtures based on tournament format
    let fixtures: EnhancedTournamentFixture[] = [];
    
    if (fixtureOptions.iplFormat) {
      // Special IPL format: double round-robin league + playoffs
      fixtures = generateIPLFormatFixtures(teamIds, venues, fixtureOptions);
    } else {
      switch (tournament.format) {
        case "league":
          fixtures = generateAdvancedLeagueFixtures(teamIds, venues, fixtureOptions);
          break;
        case "knockout":
          fixtures = generateAdvancedKnockoutFixtures(teamIds, venues, fixtureOptions);
          break;
        case "group_stage_knockout":
          if (tournament.groups && tournament.groups.length > 0) {
            fixtures = await generateGroupStageKnockoutFixtures(tournamentId, tournament.groups, venues, fixtureOptions);
          } else {
            throw new Error("Group stage + knockout format requires group information");
          }
          break;
        default:
          fixtures = generateAdvancedLeagueFixtures(teamIds, venues, fixtureOptions);
      }
    }

    // Schedule fixtures with dates and times if dates are provided
    if (tournament.startDate && tournament.endDate) {
      const startDate = typeof tournament.startDate === 'string' 
        ? new Date(tournament.startDate) 
        : tournament.startDate;
        
      const endDate = typeof tournament.endDate === 'string' 
        ? new Date(tournament.endDate) 
        : tournament.endDate;
      
      fixtures = scheduleAdvancedFixtures(
        fixtures, 
        startDate, 
        endDate, 
        venues,
        fixtureOptions
      );
    }

    // Save fixtures to database
    await saveEnhancedFixtures(tournamentId, fixtures);

    // If it's a league format, create initial standings
    if (tournament.format === "league" || fixtureOptions.iplFormat) {
      await createEnhancedInitialStandings(tournamentId, teamIds);
    }

    return fixtures;
  } catch (error) {
    console.error("Error generating enhanced fixtures:", error);
    throw error;
  }
}

/**
 * Generates advanced league fixtures with optimal scheduling
 */
function generateAdvancedLeagueFixtures(
  teamIds: number[], 
  venues: any[], 
  options: EnhancedFixtureOptions
): EnhancedTournamentFixture[] {
  const fixtures: EnhancedTournamentFixture[] = [];
  const numTeams = teamIds.length;
  
  // If odd number of teams, add a dummy team (bye)
  const teams = [...teamIds];
  if (numTeams % 2 !== 0) {
    teams.push(-1); // -1 represents a bye
  }
  
  const n = teams.length;
  const totalRounds = n - 1;
  const matchesPerRound = n / 2;
  
  // Generate fixtures using the circle method algorithm for round robin
  for (let round = 0; round < totalRounds; round++) {
    for (let match = 0; match < matchesPerRound; match++) {
      const home = teams[match];
      const away = teams[n - 1 - match];
      
      // Skip if one of the teams is the dummy team (bye)
      if (home !== -1 && away !== -1) {
        const venueId = venues[Math.floor(Math.random() * venues.length)].id;
        
        fixtures.push({
          team1Id: home,
          team2Id: away,
          round: round + 1,
          matchNumber: fixtures.length + 1,
          stage: "league",
          venueId
        });
      }
    }
    
    // Rotate teams for the next round (keeping first team fixed)
    teams.splice(1, 0, teams.pop()!);
  }
  
  // If double round-robin, add return fixtures
  if (options.doubleRoundRobin) {
    const numSingleRoundFixtures = fixtures.length;
    const numRounds = totalRounds;
    
    for (let i = 0; i < numSingleRoundFixtures; i++) {
      const originalFixture = fixtures[i];
      const returnFixture: EnhancedTournamentFixture = {
        team1Id: originalFixture.team2Id,
        team2Id: originalFixture.team1Id,
        round: (originalFixture.round || 0) + numRounds,
        matchNumber: fixtures.length + 1,
        stage: "league",
        venueId: originalFixture.venueId
      };
      
      fixtures.push(returnFixture);
    }
  }
  
  return fixtures;
}

/**
 * Generates fixtures for IPL format (league + playoffs)
 */
function generateIPLFormatFixtures(
  teamIds: number[], 
  venues: any[],
  options: EnhancedFixtureOptions
): EnhancedTournamentFixture[] {
  // First generate double round-robin league fixtures
  const doubleRoundRobinOptions = { ...options, doubleRoundRobin: true };
  const leagueFixtures = generateAdvancedLeagueFixtures(teamIds, venues, doubleRoundRobinOptions);
  
  // Define playoffs fixtures (to be filled with teams after league stage)
  // We'll use placeholder team IDs (will be updated after league completion)
  const numTeams = teamIds.length;
  const playoffFixtures: EnhancedTournamentFixture[] = [
    { // Qualifier 1: 1st vs 2nd
      team1Id: -1, // Will be updated later with 1st place team
      team2Id: -2, // Will be updated later with 2nd place team
      isPlayoff: true,
      playoffRound: "Qualifier 1",
      stage: "playoff",
      venueId: venues[0].id // Use first venue for now
    },
    { // Eliminator: 3rd vs 4th
      team1Id: -3, // Will be updated later with 3rd place team
      team2Id: -4, // Will be updated later with 4th place team
      isPlayoff: true,
      playoffRound: "Eliminator",
      stage: "playoff",
      isEliminator: true,
      venueId: venues[1].id // Use second venue for now
    },
    { // Qualifier 2: Loser of Q1 vs Winner of Eliminator
      team1Id: -5, // Will be loser of Q1
      team2Id: -6, // Will be winner of Eliminator
      isPlayoff: true,
      playoffRound: "Qualifier 2",
      stage: "playoff",
      venueId: venues[2].id // Use third venue for now
    },
    { // Final: Winner of Q1 vs Winner of Q2
      team1Id: -7, // Will be winner of Q1
      team2Id: -8, // Will be winner of Q2
      isPlayoff: true,
      playoffRound: "Final",
      stage: "playoff",
      venueId: venues[0].id // Use first venue for final
    }
  ];
  
  // Add matchNumber to playoff fixtures
  let matchNumberOffset = leagueFixtures.length;
  for (let i = 0; i < playoffFixtures.length; i++) {
    playoffFixtures[i].matchNumber = matchNumberOffset + i + 1;
  }
  
  return [...leagueFixtures, ...playoffFixtures];
}

/**
 * Generates advanced knockout fixtures (tournament bracket)
 */
function generateAdvancedKnockoutFixtures(
  teamIds: number[], 
  venues: any[],
  options: EnhancedFixtureOptions
): EnhancedTournamentFixture[] {
  const fixtures: EnhancedTournamentFixture[] = [];
  const numTeams = teamIds.length;
  
  // Calculate number of rounds in the tournament (log base 2)
  const numRounds = Math.ceil(Math.log2(numTeams));
  
  // Calculate total number of matches
  const totalMatches = numTeams - 1;
  
  // Calculate number of byes (if not power of 2)
  const numByes = Math.pow(2, numRounds) - numTeams;
  
  // Shuffle teams to randomize initial matchups
  const shuffledTeams = [...teamIds];
  for (let i = shuffledTeams.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledTeams[i], shuffledTeams[j]] = [shuffledTeams[j], shuffledTeams[i]];
  }
  
  // Create first round fixtures (with byes)
  const firstRoundTeams = [...shuffledTeams];
  const firstRoundMatches = (numTeams - numByes) / 2;
  
  let matchNumberOffset = 0;
  let currentRoundMatches = firstRoundMatches;
  
  // Generate round 1 fixtures
  for (let i = 0; i < firstRoundMatches; i++) {
    const team1Index = i;
    const team2Index = firstRoundTeams.length - 1 - i;
    
    const team1Id = firstRoundTeams[team1Index];
    const team2Id = firstRoundTeams[team2Index];
    
    const venueId = venues[Math.floor(Math.random() * venues.length)].id;
    
    fixtures.push({
      team1Id,
      team2Id,
      round: 1,
      matchNumber: i + 1,
      stage: "knockout",
      venueId
    });
  }
  
  matchNumberOffset += firstRoundMatches;
  
  // Generate remaining rounds
  for (let round = 2; round <= numRounds; round++) {
    const numMatches = Math.pow(2, numRounds - round);
    const roundName = getRoundName(round, numRounds);
    
    for (let i = 0; i < numMatches; i++) {
      const venueId = venues[Math.floor(Math.random() * venues.length)].id;
      
      const fixture: EnhancedTournamentFixture = {
        team1Id: -1, // To be determined
        team2Id: -1, // To be determined
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
 * Generate fixtures for a tournament with group stage followed by knockout
 */
async function generateGroupStageKnockoutFixtures(
  tournamentId: number,
  groups: any[],
  venues: any[],
  options: EnhancedFixtureOptions
): Promise<EnhancedTournamentFixture[]> {
  let fixtures: EnhancedTournamentFixture[] = [];
  
  // Generate fixtures for each group
  for (const group of groups) {
    const groupFixtures = generateAdvancedLeagueFixtures(
      group.teamIds,
      venues,
      { ...options, doubleRoundRobin: options.doubleRoundRobin }
    );
    
    // Mark these fixtures as part of this group
    for (const fixture of groupFixtures) {
      fixture.group = group.name;
      fixture.stage = "group";
    }
    
    fixtures = fixtures.concat(groupFixtures);
  }
  
  // Add round numbers to prevent conflicts between groups
  let matchNumber = 1;
  for (let i = 0; i < fixtures.length; i++) {
    fixtures[i].matchNumber = matchNumber++;
  }
  
  // Generate knockout stage fixtures assuming top 2 teams from each group qualify
  const numGroups = groups.length;
  const teamsPerGroupAdvancing = 2; // Can be configurable in the future
  const totalTeamsAdvancing = numGroups * teamsPerGroupAdvancing;
  
  const knockoutFixtures = generateKnockoutFixturesWithPlaceholders(
    totalTeamsAdvancing,
    venues,
    fixtures.length + 1
  );
  
  fixtures = fixtures.concat(knockoutFixtures);
  
  return fixtures;
}

/**
 * Generate knockout fixtures with placeholder teams (to be determined)
 */
function generateKnockoutFixturesWithPlaceholders(
  numTeams: number,
  venues: any[],
  startMatchNumber: number
): EnhancedTournamentFixture[] {
  const fixtures: EnhancedTournamentFixture[] = [];
  
  // Calculate number of rounds
  const numRounds = Math.ceil(Math.log2(numTeams));
  
  // Current match number for sequential assignment
  let matchNumber = startMatchNumber;
  
  // Generate knockout rounds
  for (let round = 1; round <= numRounds; round++) {
    const numMatches = Math.pow(2, numRounds - round);
    const roundName = getRoundName(round, numRounds);
    
    for (let match = 0; match < numMatches; match++) {
      const venueId = venues[Math.floor(Math.random() * venues.length)].id;
      
      fixtures.push({
        team1Id: -1, // Will be determined after group stage
        team2Id: -1, // Will be determined after group stage
        round,
        matchNumber: matchNumber++,
        stage: roundName,
        venueId
      });
    }
  }
  
  return fixtures;
}

/**
 * Schedule fixtures by assigning dates, times and venues
 */
function scheduleAdvancedFixtures(
  fixtures: EnhancedTournamentFixture[],
  startDate: Date,
  endDate: Date,
  venues: any[],
  options: EnhancedFixtureOptions
): EnhancedTournamentFixture[] {
  const totalDays = differenceInDays(endDate, startDate) + 1;
  const totalFixtures = fixtures.length;
  
  // Check if we have enough days
  if (totalDays < Math.ceil(totalFixtures / options.maxMatchesPerDay)) {
    throw new Error(`Not enough days to schedule all fixtures. Need at least ${Math.ceil(totalFixtures / options.maxMatchesPerDay)} days.`);
  }
  
  const scheduledFixtures = [...fixtures];
  const venueBookings: Record<number, string[]> = {}; // venueId -> array of dates booked
  const teamBookings: Record<number, string[]> = {}; // teamId -> array of dates booked
  
  // Initialize venue and team bookings
  venues.forEach(venue => {
    venueBookings[venue.id] = [];
  });
  
  const uniqueTeamIds = new Set<number>();
  fixtures.forEach(fixture => {
    if (fixture.team1Id > 0) uniqueTeamIds.add(fixture.team1Id);
    if (fixture.team2Id > 0) uniqueTeamIds.add(fixture.team2Id);
  });
  
  Array.from(uniqueTeamIds).forEach(teamId => {
    teamBookings[teamId] = [];
  });
  
  // Prioritize scheduling playoff matches at the end
  const regularFixtures = scheduledFixtures.filter(f => !f.isPlayoff);
  const playoffFixtures = scheduledFixtures.filter(f => f.isPlayoff);
  
  // Distribute regular matches evenly
  const daysForRegularMatches = options.iplFormat ? 
    Math.min(totalDays - playoffFixtures.length, totalDays - 5) : 
    totalDays;
  
  const fixturesPerDay = Math.min(
    options.maxMatchesPerDay,
    Math.ceil(regularFixtures.length / daysForRegularMatches)
  );
  
  // Schedule regular matches
  let currentDate = new Date(startDate);
  let currentDayMatches = 0;
  let fixtureIndex = 0;
  
  while (fixtureIndex < regularFixtures.length) {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const isWeekendDay = isWeekend(currentDate);
    
    // Determine if we should schedule on this day
    let shouldSchedule = true;
    if (!options.scheduleWeekdayMatches && !isWeekendDay) {
      shouldSchedule = false;
    }
    
    if (shouldSchedule && currentDayMatches < fixturesPerDay) {
      const fixture = regularFixtures[fixtureIndex];
      
      // Check team and venue availability
      const team1CanPlay = !teamBookings[fixture.team1Id]?.includes(dateStr);
      const team2CanPlay = !teamBookings[fixture.team2Id]?.includes(dateStr);
      
      const venueId = fixture.venueId || venues[Math.floor(Math.random() * venues.length)].id;
      const venueAvailable = !venueBookings[venueId]?.includes(dateStr);
      
      if (team1CanPlay && team2CanPlay && venueAvailable) {
        // Schedule this fixture
        fixture.scheduledDate = new Date(currentDate);
        
        // Assign time of day (afternoon/evening)
        fixture.scheduledTime = currentDayMatches === 0 ? "15:30" : "19:30";
        
        // Update team and venue bookings
        if (fixture.team1Id > 0) teamBookings[fixture.team1Id].push(dateStr);
        if (fixture.team2Id > 0) teamBookings[fixture.team2Id].push(dateStr);
        venueBookings[venueId].push(dateStr);
        
        currentDayMatches++;
        fixtureIndex++;
      } else {
        // Try another fixture
        fixtureIndex++;
        continue;
      }
    }
    
    // Move to next day if we've scheduled enough for today
    if (currentDayMatches >= fixturesPerDay || fixtureIndex >= regularFixtures.length) {
      currentDate = addDays(currentDate, 1);
      currentDayMatches = 0;
      
      // Reset fixture index to beginning of unscheduled fixtures
      if (fixtureIndex < regularFixtures.length) {
        const nextUnscheduledIndex = regularFixtures.findIndex(
          (f, idx) => idx >= fixtureIndex && !f.scheduledDate
        );
        
        if (nextUnscheduledIndex !== -1) {
          fixtureIndex = nextUnscheduledIndex;
        }
      }
    }
  }
  
  // Schedule playoff fixtures at the end
  if (playoffFixtures.length > 0) {
    const playoffStartDate = addDays(startDate, daysForRegularMatches);
    let playoffDate = new Date(playoffStartDate);
    
    // Space out playoffs with 2-day gaps
    for (let i = 0; i < playoffFixtures.length; i++) {
      const fixture = playoffFixtures[i];
      fixture.scheduledDate = new Date(playoffDate);
      fixture.scheduledTime = "19:30"; // Evening time for playoffs
      
      // Add 2 days between playoff matches
      playoffDate = addDays(playoffDate, i < playoffFixtures.length - 1 ? 2 : 0);
    }
  }
  
  return [...regularFixtures, ...playoffFixtures];
}

/**
 * Get the name of the round in a knockout tournament
 */
function getRoundName(round: number, totalRounds: number): string {
  if (round === totalRounds) return "final";
  if (round === totalRounds - 1) return "semi-final";
  if (round === totalRounds - 2) return "quarter-final";
  if (round === 1) return "first-round";
  return `round-${round}`;
}

/**
 * Save fixtures to the database
 */
async function saveEnhancedFixtures(tournamentId: number, fixtures: EnhancedTournamentFixture[]) {
  try {
    // First remove existing fixtures
    await storage.deleteTournamentMatches(tournamentId);
    
    // Insert new fixtures
    const fixturePromises = fixtures.map(fixture => {
      const match = {
        tournamentId,
        matchId: fixture.matchNumber || Math.floor(Math.random() * 10000) + 1, // Adding the required matchId
        round: fixture.round || 1,
        matchNumber: fixture.matchNumber || 0,
        group: fixture.group,
        stage: fixture.stage || "league",
        venueId: fixture.venueId,
        scheduledDate: fixture.scheduledDate,
        scheduledTime: fixture.scheduledTime,
        status: "scheduled",
        home_team_id: fixture.team1Id > 0 ? fixture.team1Id : null,
        away_team_id: fixture.team2Id > 0 ? fixture.team2Id : null,
        isPlayoff: fixture.isPlayoff,
        playoffRound: fixture.playoffRound
      };
      
      return storage.createTournamentMatch(match);
    });
    
    await Promise.all(fixturePromises);
  } catch (error) {
    console.error("Error saving fixtures:", error);
    throw error;
  }
}

/**
 * Create initial standings for all teams in a tournament
 */
async function createEnhancedInitialStandings(tournamentId: number, teamIds: number[]) {
  try {
    // First delete existing standings
    await storage.deleteTournamentStandings(tournamentId);
    
    // Create standings for each team
    const standingPromises = teamIds.map(teamId => {
      const standing = {
        tournamentId,
        teamId,
        played: 0,
        won: 0,
        lost: 0,
        tied: 0,
        noResult: 0,
        points: 0,
        nrr: 0,
        position: 0 // Will be updated after matches are played
      };
      
      return storage.createTournamentStanding(standing);
    });
    
    await Promise.all(standingPromises);
  } catch (error) {
    console.error("Error creating initial standings:", error);
    throw error;
  }
}

/**
 * Pre-load IPL 2023 tournament data for demonstration
 */
export async function preloadIPL2023Tournament(tournamentId: number) {
  try {
    const ipl2023Data = await import('../../data/ipl-2023-teams');
    
    // Create teams if they don't exist and add them to the tournament
    for (const team of ipl2023Data.ipl2023Teams) {
      // Get or create the team using the getTeamByNameOrCreate method
      const teamEntity = await storage.getTeamByNameOrCreate({
        name: team.name,
        shortName: team.shortName,
        logo: team.logo,
        primaryColor: team.primaryColor,
        secondaryColor: team.secondaryColor,
        createdBy: 1 // Default admin user
      });
      
      // Add team to tournament if not already added
      const tournamentTeam = await storage.getTournamentTeam(tournamentId, teamEntity.id);
      if (!tournamentTeam) {
        await storage.addTeamToTournament({
          tournamentId,
          teamId: teamEntity.id,
          registrationStatus: 'approved',
          paymentStatus: 'paid'
        });
      }
    }
    
    // Create venues if they don't exist
    for (const venue of ipl2023Data.ipl2023Venues) {
      const existingVenue = await storage.getVenueByName(venue.name);
      
      if (!existingVenue) {
        await storage.createVenue({
          name: venue.name,
          city: venue.city,
          country: venue.country,
          capacity: venue.capacity,
          address: venue.city + ', ' + venue.country // Add required address field
        });
      }
    }
    
    // Load standings data
    const tournament = await storage.getTournament(tournamentId);
    
    if (tournament) {
      // Update tournament with IPL data
      await storage.updateTournament(tournamentId, {
        name: "IPL 2023",
        shortName: "IPL 2023",
        description: "The 16th season of the Indian Premier League",
        format: "league",
        tournamentType: "league"
      });
      
      // Load standings
      for (const standing of ipl2023Data.ipl2023StandingsData) {
        // First make sure the team exists in the tournament
        const teamEntity = await storage.getTeamById(standing.teamId);
        if (teamEntity) {
          // Add team to tournament if not already added
          const tournamentTeam = await storage.getTournamentTeam(tournamentId, teamEntity.id);
          if (!tournamentTeam) {
            await storage.addTeamToTournament({
              tournamentId,
              teamId: teamEntity.id,
              registrationStatus: 'approved',
              paymentStatus: 'paid'
            });
          }
          
          // Create or update standings
          await storage.createTournamentStanding({
            tournamentId,
            teamId: standing.teamId,
            played: standing.matches,
            won: standing.won,
            lost: standing.lost,
            tied: standing.tied,
            noResult: standing.noResult,
            points: standing.points,
            nrr: standing.nrr,
            position: standing.position
          });
        }
      }
      
      // Load top performers
      for (const batter of ipl2023Data.ipl2023TopPerformers.battingStats) {
        await storage.createPlayerTournamentStats({
          tournamentId,
          userId: batter.playerId,
          teamId: batter.teamId,
          matches: batter.matches,
          runs: batter.runs,
          average: batter.average,
          strikeRate: batter.strikeRate,
          fifties: batter.fifties,
          hundreds: batter.hundreds,
          statCategory: "batting"
        });
      }
      
      for (const bowler of ipl2023Data.ipl2023TopPerformers.bowlingStats) {
        await storage.createPlayerTournamentStats({
          tournamentId,
          userId: bowler.playerId,
          teamId: bowler.teamId,
          matches: bowler.matches,
          wickets: bowler.wickets,
          economy: bowler.economy,
          average: bowler.average,
          bestBowling: bowler.bestBowling,
          statCategory: "bowling"
        });
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Error preloading IPL 2023 data:", error);
    throw error;
  }
}