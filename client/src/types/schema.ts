// Import the actual types from shared schema
import { User, Post, Comment, Like, Follow, Story, Match as DbMatch, Team as DbTeam, Tournament as DbTournament, TournamentTeam, TournamentMatch, MatchPlayer, BallByBall, PlayerStats, PlayerVsPlayerStats, HeatMapData, Partnership, MatchHighlight } from '@shared/schema';

// Re-export these types for component usage
export { User, Post, Comment, Like, Follow, Story, TournamentMatch };

// Define ExtendedTournamentTeam with additional UI-specific properties
export interface ExtendedTournamentTeam extends TournamentTeam {
  team?: Team;
  stats?: {
    matches: number;
    won: number;
    lost: number;
    tied: number;
    noResult: number;
    points: number;
    nrr: number;
  };
  qualified?: boolean;
}

// Export additional component-specific interfaces
export interface Team extends DbTeam {
  players?: Player[];
}

export interface Match extends DbMatch {
  team1?: Team;
  team2?: Team;
  tossWinner?: number;
  tossDecision?: 'bat' | 'bowl';
  tossTime?: Date;
  matchStartTime?: Date;
  matchEndTime?: Date;
  mainUmpireId?: number;
  secondUmpireId?: number;
  thirdUmpireId?: number;
  matchRefereeId?: number;
  weatherConditions?: string;
  pitchConditions?: string;
}

export interface Player {
  id: number;
  userId?: number;
  name: string;
  username?: string;
  profileImage?: string;
  role?: string;
  battingStyle?: string;
  bowlingStyle?: string;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  isWicketkeeper?: boolean;
  stats?: PlayerStats;
  matchStats?: MatchPlayerStats;
}

export interface MatchPlayerStats {
  battingStats?: BattingStats;
  bowlingStats?: BowlingStats;
  fieldingStats?: FieldingStats;
}

export interface BattingStats {
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  battingPosition?: number;
}

export interface BowlingStats {
  overs: string;
  maidens: number;
  runs: number;
  wickets: number;
  economy: number;
  bowlingPosition?: number;
}

export interface FieldingStats {
  catches: number;
  runOuts: number;
  stumpings: number;
}

export interface BallEvent extends BallByBall {
  id: string;
  batsman: string;
  bowler: string;
  isFour?: boolean;
  isSix?: boolean;
  isWide?: boolean;
  isNoBall?: boolean;
  isLegBye?: boolean;
  isBye?: boolean;
  playerOut?: string;
  fielder?: string;
  commentary?: string;
  shotType?: string;
  shotDirection?: number;
  shotDistance?: number;
  timestamp: Date;
}

export interface PlayerMatchup extends PlayerVsPlayerStats {
  batsmanName?: string;
  bowlerName?: string;
  strikeRate?: number;
  economyRate?: number;
  dotBallPercentage?: number;
  boundaryPercentage?: number;
}

export interface ZoneData {
  [key: string]: number;
}

export interface HeatMapEntry extends HeatMapData {
  playerName?: string;
  zones?: ZoneData;
}

export interface PartnershipData extends Partnership {
  batsman1Name?: string;
  batsman2Name?: string;
  runRate?: number;
}

export interface Highlight extends MatchHighlight {
  playerName?: string;
  timeAgo?: string;
}

export interface MatchOfficials {
  mainUmpire: string;
  secondUmpire: string;
  thirdUmpire: string;
  matchReferee: string;
  weatherConditions: string;
  pitchConditions: string;
  venue: string;
  additionalNotes: string;
}

export interface Tournament extends DbTournament {
  teams?: (TournamentTeam & { team: Team })[];
  matches?: TournamentMatch[] | any[]; // Allow matches to be either TournamentMatch or ClientTournamentMatch array
  venues?: any[];
  status: string;
  groups?: { id: number; name: string; teams: number[] }[];
}