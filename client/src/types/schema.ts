// Types defined from shared/schema.ts for frontend use

export interface User {
  id: number;
  email: string;
  username: string;
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
  isVerified: boolean;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: number;
  userId: number;
  imageUrl: string;
  caption: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Like {
  id: number;
  postId: number;
  userId: number;
  createdAt: string;
}

export interface Comment {
  id: number;
  postId: number;
  userId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Follow {
  id: number;
  followerId: number;
  followingId: number;
  createdAt: string;
}

export interface BlockedUser {
  id: number;
  userId: number;
  blockedUserId: number;
  createdAt: string;
}

export interface Conversation {
  id: number;
  name?: string;
  isGroup: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  imageUrl?: string;
  createdAt: string;
  seen: boolean;
}

export interface Story {
  id: number;
  userId: number;
  imageUrl: string;
  caption?: string;
  createdAt: string;
  expiresAt: string;
}

export interface PlayerStats {
  id: number;
  playerId: number;
  matches: number;
  runs: number;
  highScore: number;
  average: number;
  strikeRate: number;
  centuries: number;
  halfCenturies: number;
  fours: number;
  sixes: number;
  wickets: number;
  bestBowling: string;
  bowlingAverage: number;
  economy: number;
  updatedAt: string;
}

export interface PlayerMatch {
  id: number;
  playerId: number;
  matchId: number;
  teamId: number;
  createdAt: string;
}

export interface PlayerMatchPerformance {
  id: number;
  playerId: number;
  matchId: number;
  teamId: number;
  runsScored: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  overs: number;
  runsConceded: number;
  wickets: number;
  catches: number;
  runOuts: number;
  stumping: number;
  createdAt: string;
  updatedAt: string;
}

export interface Match {
  id: number;
  title: string;
  venue: string;
  matchType: string;
  overs: number;
  team1Id: number;
  team2Id: number;
  team1Score: number;
  team1Wickets: number;
  team1Overs: string;
  team2Score: number;
  team2Wickets: number;
  team2Overs: string;
  status: "upcoming" | "live" | "completed";
  result?: string;
  winner?: number;
  matchDate: string;
  createdAt: string;
  updatedAt: string;
  currentInnings: 1 | 2;
}

export interface Team {
  id: number;
  name: string;
  logo?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamPlayer {
  id: number;
  teamId: number;
  playerId: number;
  role: string;
  createdAt: string;
}

export interface MatchPlayer {
  id: number;
  matchId: number;
  playerId: number;
  teamId: number;
  isCaptain: boolean;
  isWicketkeeper: boolean;
  createdAt: string;
}

export interface BallByBall {
  id: number;
  matchId: number;
  innings: number;
  overNumber: number;
  ballNumber: number;
  batsmanId: number;
  bowlerId: number;
  runsScored: number;
  extras: number;
  extrasType?: string;
  isWicket: boolean;
  dismissalType?: string;
  playerOutId?: number;
  fielderId?: number;
  commentary?: string;
  timestamp: string;
  shotType?: string;
  shotDirection?: number;
  shotDistance?: number;
  ballSpeed?: number;
  ballLength?: string;
  ballLine?: string;
}

export interface Partnership {
  id: number;
  matchId: number;
  innings: number;
  batsman1Id: number;
  batsman2Id: number;
  runs: number;
  balls: number;
  startOver: number;
  endOver?: number;
  createdAt: string;
}

export interface MatchHighlight {
  id: number;
  matchId: number;
  playerId?: number;
  type: string;
  description: string;
  videoUrl?: string;
  timestamp: string;
  over: number;
  createdAt: string;
}

export interface PlayerVsPlayerStats {
  id: number;
  batsmanId: number;
  bowlerId: number;
  matchId?: number;
  ballsFaced: number;
  runsScored: number;
  fours: number;
  sixes: number;
  dismissals: number;
  dotBalls: number;
  createdAt: string;
  updatedAt: string;
}

export interface HeatMapData {
  id: number;
  playerId: number;
  matchId?: number;
  isBatting: boolean;
  zoneType: string;
  zoneName: string;
  frequency: number;
  runs?: number;
  createdAt: string;
  updatedAt: string;
}