import { pgTable, text, serial, integer, boolean, timestamp, numeric, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  fullName: text("full_name"),
  email: text("email").notNull().unique(),
  bio: text("bio"),
  location: text("location"),
  profileImage: text("profile_image"),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  isPlayer: boolean("is_player").default(false),
  emailVerified: boolean("email_verified").default(false),
});

export const tokens = pgTable("tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  token: text("token").notNull(),
  type: text("type").notNull(), // 'email_verification', 'password_reset'
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  content: text("content"),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"), // For reels/short videos
  thumbnailUrl: text("thumbnail_url"), // For video thumbnails
  location: text("location"),
  category: text("category"), // E.g., "match_discussion", "player_highlight", "news", "opinion", "meme", "reel"
  matchId: text("match_id"), // Reference to a cricket match (could be an external API ID)
  teamId: text("team_id"), // Reference to a cricket team (could be an external API ID)
  playerId: text("player_id"), // Reference to a cricket player (could be an external API ID)
  duration: integer("duration"), // Video duration in seconds
  createdAt: timestamp("created_at").defaultNow(),
});

export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  postId: integer("post_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  userId: integer("user_id").notNull(),
  postId: integer("post_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const follows = pgTable("follows", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").notNull(),
  followingId: integer("following_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const blockedUsers = pgTable("blocked_users", {
  id: serial("id").primaryKey(),
  blockerId: integer("blocker_id").notNull(), // User who blocked
  blockedId: integer("blocked_id").notNull(), // User who was blocked
  createdAt: timestamp("created_at").defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  user1Id: integer("user1_id").notNull(),
  user2Id: integer("user2_id").notNull(),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  senderId: integer("sender_id").notNull(),
  content: text("content").notNull(),
  messageType: text("message_type").default("text").notNull(), // "text", "image", "document", "location"
  mediaUrl: text("media_url"), // URL to image or document
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const stories = pgTable("stories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  imageUrl: text("image_url"),
  caption: text("caption"),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // 24 hours after creation
});

export const playerStats = pgTable("player_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  position: text("position"),
  battingStyle: text("batting_style"),
  bowlingStyle: text("bowling_style"),
  playerOfMatchAwards: integer("player_of_match_awards").default(0),
  highestScoreNotOut: boolean("highest_score_not_out").default(false),
  totalMatches: integer("total_matches").default(0),
  totalRuns: integer("total_runs").default(0),
  totalWickets: integer("total_wickets").default(0),
  totalCatches: integer("total_catches").default(0),
  totalSixes: integer("total_sixes").default(0),
  totalFours: integer("total_fours").default(0),
  highestScore: integer("highest_score").default(0),
  bestBowling: text("best_bowling").default("0/0"),
  battingAverage: numeric("batting_average", { precision: 2 }).default("0"),
  bowlingAverage: numeric("bowling_average", { precision: 2 }).default("0"),
  strikeRate: numeric("strike_rate", { precision: 2 }).default("0"),
  economyRate: numeric("economy_rate", { precision: 2 }).default("0"),
  innings: integer("innings").default(0),
  notOuts: integer("not_outs").default(0),
  ballsFaced: integer("balls_faced").default(0),
  oversBowled: text("overs_bowled").default("0"),
  runsConceded: integer("runs_conceded").default(0),
  maidens: integer("maidens").default(0),
  fifties: integer("fifties").default(0),
  hundreds: integer("hundreds").default(0),
  totalRunOuts: integer("total_run_outs").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const playerMatches = pgTable("player_matches", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  matchName: text("match_name").notNull(),
  matchDate: timestamp("match_date").notNull(),
  venue: text("venue"),
  opponent: text("opponent").notNull(),
  matchType: text("match_type"), // e.g., "T20", "ODI", "Test"
  teamScore: text("team_score"), // e.g., "180/5"
  opponentScore: text("opponent_score"), // e.g., "165/8"
  result: text("result"), // e.g., "Won by 15 runs", "Lost by 2 wickets"
  createdAt: timestamp("created_at").defaultNow(),
});

export const playerMatchPerformance = pgTable("player_match_performance", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  matchId: integer("match_id").notNull(), // References playerMatches.id
  // Batting
  runsScored: integer("runs_scored").default(0),
  ballsFaced: integer("balls_faced").default(0),
  fours: integer("fours").default(0),
  sixes: integer("sixes").default(0),
  battingStatus: text("batting_status"), // e.g., "Not Out", "Bowled", "Caught"
  battingPosition: integer("batting_position"),
  battingStyle: text("batting_style"),
  strikeRate: numeric("strike_rate", { precision: 2 }),
  // Bowling
  oversBowled: numeric("overs_bowled").default("0"),
  runsConceded: integer("runs_conceded").default(0),
  wicketsTaken: integer("wickets_taken").default(0),
  maidens: integer("maidens").default(0),
  bowlingPosition: integer("bowling_position"),
  bowlingStyle: text("bowling_style"),
  economyRate: numeric("economy_rate", { precision: 2 }),
  // Fielding
  catches: integer("catches").default(0),
  runOuts: integer("run_outs").default(0),
  stumpings: integer("stumpings").default(0),
  // Additional fields
  playerOfMatch: boolean("player_of_match").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// New tables for the enhanced scoring system
export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  venue: text("venue"),
  matchDate: timestamp("match_date").notNull(),
  matchType: text("match_type").notNull(), // "T20", "ODI", "Test", etc.
  overs: integer("overs").notNull(),
  team1Id: integer("team1_id").notNull(),
  team2Id: integer("team2_id").notNull(),
  team1Score: integer("team1_score").default(0),
  team1Wickets: integer("team1_wickets").default(0),
  team1Overs: numeric("team1_overs", { precision: 2 }).default("0"),
  team2Score: integer("team2_score").default(0),
  team2Wickets: integer("team2_wickets").default(0),
  team2Overs: numeric("team2_overs", { precision: 2 }).default("0"),
  status: text("status").notNull().default("upcoming"), // "upcoming", "live", "completed"
  result: text("result"),
  tossWinner: integer("toss_winner"),
  tossDecision: text("toss_decision"), // "bat", "bowl"
  currentInnings: integer("current_innings").default(1),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  logo: text("logo"),
  shortName: text("short_name"),
  description: text("description"),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const teamPlayers = pgTable("team_players", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull(),
  userId: integer("user_id").notNull(),
  playerRole: text("player_role"), // "captain", "vice-captain", "player"
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const matchPlayers = pgTable("match_players", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull(),
  teamId: integer("team_id").notNull(),
  userId: integer("user_id").notNull(),
  isPlaying: boolean("is_playing").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ballByBall = pgTable("ball_by_ball", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull(),
  innings: integer("innings").notNull(), // 1 or 2
  overNumber: integer("over_number").notNull(),
  ballNumber: integer("ball_number").notNull(),
  batsmanId: integer("batsman_id").notNull(),
  bowlerId: integer("bowler_id").notNull(),
  runsScored: integer("runs_scored").default(0),
  extras: integer("extras").default(0),
  extrasType: text("extras_type"), // "wide", "no_ball", "bye", "leg_bye"
  isWicket: boolean("is_wicket").default(false),
  dismissalType: text("dismissal_type"), // "bowled", "caught", "lbw", etc.
  playerOutId: integer("player_out_id"),
  fielderId: integer("fielder_id"),
  commentary: text("commentary"),
  shotType: text("shot_type"), // "drive", "pull", "cut", etc.
  shotDirection: integer("shot_direction"), // angle in degrees (0-360)
  shotDistance: numeric("shot_distance", { precision: 2 }), // normalized 0-1 value for distance
  ballSpeed: integer("ball_speed"), // in km/h
  ballLength: text("ball_length"), // "yorker", "full", "good", "short", etc.
  ballLine: text("ball_line"), // "off", "middle", "leg"
  timestamp: timestamp("timestamp").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const partnerships = pgTable("partnerships", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull(),
  innings: integer("innings").notNull(),
  batsman1Id: integer("batsman1_id").notNull(),
  batsman2Id: integer("batsman2_id").notNull(),
  runs: integer("runs").default(0),
  balls: integer("balls").default(0),
  startOver: numeric("start_over", { precision: 1 }),
  endOver: numeric("end_over", { precision: 1 }),
  isCurrent: boolean("is_current").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const matchHighlights = pgTable("match_highlights", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // "wicket", "boundary", "milestone", "partnership", etc.
  ballId: integer("ball_id"), // Reference to the ball where the highlight occurred
  mediaUrl: text("media_url"),
  thumbnailUrl: text("thumbnail_url"),
  playerId: integer("player_id"), // Player who made the highlight
  timestamp: timestamp("timestamp").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const playerVsPlayerStats = pgTable("player_vs_player_stats", {
  id: serial("id").primaryKey(),
  batsmanId: integer("batsman_id").notNull(),
  bowlerId: integer("bowler_id").notNull(),
  ballsFaced: integer("balls_faced").default(0),
  runsScored: integer("runs_scored").default(0),
  dismissals: integer("dismissals").default(0),
  fours: integer("fours").default(0),
  sixes: integer("sixes").default(0),
  dotBalls: integer("dot_balls").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const heatMapData = pgTable("heat_map_data", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(), 
  matchId: integer("match_id"),
  isForBatting: boolean("is_for_batting").notNull(), // true for batting, false for bowling
  zoneData: jsonb("zone_data").notNull(), // Stores data about each zone's activity
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  fullName: true,
  email: true,
  bio: true,
  location: true,
  profileImage: true,
  password: true,
  isPlayer: true,
});

export const insertPostSchema = createInsertSchema(posts).pick({
  userId: true,
  content: true,
  imageUrl: true,
  videoUrl: true,
  thumbnailUrl: true,
  location: true,
  category: true,
  matchId: true,
  teamId: true,
  playerId: true,
  duration: true,
});

export const insertLikeSchema = createInsertSchema(likes).pick({
  userId: true,
  postId: true,
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  content: true,
  userId: true,
  postId: true,
});

export const insertFollowSchema = createInsertSchema(follows).pick({
  followerId: true,
  followingId: true,
});

export const insertBlockedUserSchema = createInsertSchema(blockedUsers).pick({
  blockerId: true,
  blockedId: true,
});

export const insertConversationSchema = createInsertSchema(conversations).pick({
  user1Id: true,
  user2Id: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  conversationId: true,
  senderId: true,
  content: true,
  messageType: true,
  mediaUrl: true,
  read: true,
  createdAt: true,
});

export const insertStorySchema = createInsertSchema(stories).pick({
  userId: true,
  imageUrl: true,
  caption: true,
  expiresAt: true,
});

export const insertPlayerStatsSchema = createInsertSchema(playerStats).pick({
  userId: true,
  position: true,
  battingStyle: true,
  bowlingStyle: true,
  playerOfMatchAwards: true,
  highestScoreNotOut: true,
  totalMatches: true,
  totalRuns: true,
  totalWickets: true,
  totalCatches: true,
  totalSixes: true,
  totalFours: true,
  highestScore: true,
  bestBowling: true,
  battingAverage: true,
  bowlingAverage: true,
  strikeRate: true,
  economyRate: true,
  innings: true,
  notOuts: true,
  ballsFaced: true,
  oversBowled: true,
  runsConceded: true,
  maidens: true,
  fifties: true,
  hundreds: true,
  totalRunOuts: true,
});

export const insertPlayerMatchSchema = createInsertSchema(playerMatches).pick({
  userId: true,
  matchName: true,
  matchDate: true,
  venue: true,
  opponent: true,
  matchType: true,
  teamScore: true,
  opponentScore: true,
  result: true,
});

export const insertPlayerMatchPerformanceSchema = createInsertSchema(playerMatchPerformance)
  .pick({
    userId: true,
    matchId: true,
    runsScored: true,
    ballsFaced: true,
    fours: true,
    sixes: true,
    battingStatus: true,
    oversBowled: true,
    runsConceded: true,
    wicketsTaken: true,
    maidens: true,
    catches: true,
    runOuts: true,
    stumpings: true,
  })
  .extend({
    runsScored: z.coerce.number().min(0),
    ballsFaced: z.coerce.number().min(0),
    fours: z.coerce.number().min(0),
    sixes: z.coerce.number().min(0),
    wicketsTaken: z.coerce.number().min(0),
    runsConceded: z.coerce.number().min(0),
    maidens: z.coerce.number().min(0),
    catches: z.coerce.number().min(0),
    runOuts: z.coerce.number().min(0),
    stumpings: z.coerce.number().min(0),
    oversBowled: z.string().regex(/^\d+(\.\d)?$/, "Invalid overs format"),
    userId: z.coerce.number().int().positive(),
    matchId: z.coerce.number().int().positive(),
  });

// Story Schema
export const createStorySchema = insertStorySchema.extend({
  imageUrl: z.string().min(1, "Image URL is required"),
  caption: z.string().max(100, "Caption must be less than 100 characters").optional(),
});

// New enhanced scoring system schemas
export const insertMatchSchema = createInsertSchema(matches).pick({
  title: true,
  venue: true,
  matchDate: true,
  matchType: true,
  overs: true,
  team1Id: true,
  team2Id: true,
  status: true,
  tossWinner: true,
  tossDecision: true,
  createdBy: true,
});

export const insertTeamSchema = createInsertSchema(teams).pick({
  name: true,
  logo: true,
  shortName: true,
  description: true,
  createdBy: true,
});

export const insertTeamPlayerSchema = createInsertSchema(teamPlayers).pick({
  teamId: true,
  userId: true,
  playerRole: true,
  isActive: true,
});

export const insertMatchPlayerSchema = createInsertSchema(matchPlayers).pick({
  matchId: true,
  teamId: true,
  userId: true,
  isPlaying: true,
});

export const insertBallByBallSchema = createInsertSchema(ballByBall).pick({
  matchId: true,
  innings: true,
  overNumber: true,
  ballNumber: true,
  batsmanId: true,
  bowlerId: true,
  runsScored: true,
  extras: true,
  extrasType: true,
  isWicket: true,
  dismissalType: true,
  playerOutId: true,
  fielderId: true,
  commentary: true,
  shotType: true,
  shotDirection: true,
  shotDistance: true,
  ballSpeed: true,
  ballLength: true,
  ballLine: true,
});

export const insertPartnershipSchema = createInsertSchema(partnerships).pick({
  matchId: true,
  innings: true,
  batsman1Id: true,
  batsman2Id: true,
  runs: true,
  balls: true,
  startOver: true,
  endOver: true,
  isCurrent: true,
});

export const insertMatchHighlightSchema = createInsertSchema(matchHighlights).pick({
  matchId: true,
  title: true,
  description: true,
  type: true,
  ballId: true,
  mediaUrl: true,
  thumbnailUrl: true,
  playerId: true,
});

export const insertPlayerVsPlayerStatsSchema = createInsertSchema(playerVsPlayerStats).pick({
  batsmanId: true,
  bowlerId: true,
  ballsFaced: true,
  runsScored: true,
  dismissals: true,
  fours: true,
  sixes: true,
  dotBalls: true,
});

export const insertHeatMapDataSchema = createInsertSchema(heatMapData).pick({
  playerId: true,
  matchId: true,
  isForBatting: true,
  zoneData: true,
});

// Type definitions
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;

export type InsertLike = z.infer<typeof insertLikeSchema>;
export type Like = typeof likes.$inferSelect;

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

export type InsertFollow = z.infer<typeof insertFollowSchema>;
export type Follow = typeof follows.$inferSelect;

export type InsertBlockedUser = z.infer<typeof insertBlockedUserSchema>;
export type BlockedUser = typeof blockedUsers.$inferSelect;

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertStory = z.infer<typeof insertStorySchema>;
export type Story = typeof stories.$inferSelect;

export type InsertPlayerStats = z.infer<typeof insertPlayerStatsSchema>;
export type PlayerStats = typeof playerStats.$inferSelect;

export type InsertPlayerMatch = z.infer<typeof insertPlayerMatchSchema>;
export type PlayerMatch = typeof playerMatches.$inferSelect;

export type InsertPlayerMatchPerformance = z.infer<typeof insertPlayerMatchPerformanceSchema>;
export type PlayerMatchPerformance = typeof playerMatchPerformance.$inferSelect;

// New types for enhanced scoring system
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = typeof matches.$inferSelect;

export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;

export type InsertTeamPlayer = z.infer<typeof insertTeamPlayerSchema>;
export type TeamPlayer = typeof teamPlayers.$inferSelect;

export type InsertMatchPlayer = z.infer<typeof insertMatchPlayerSchema>;
export type MatchPlayer = typeof matchPlayers.$inferSelect;

export type InsertBallByBall = z.infer<typeof insertBallByBallSchema>;
export type BallByBall = typeof ballByBall.$inferSelect;

export type InsertPartnership = z.infer<typeof insertPartnershipSchema>;
export type Partnership = typeof partnerships.$inferSelect;

export type InsertMatchHighlight = z.infer<typeof insertMatchHighlightSchema>;
export type MatchHighlight = typeof matchHighlights.$inferSelect;

export type InsertPlayerVsPlayerStats = z.infer<typeof insertPlayerVsPlayerStatsSchema>;
export type PlayerVsPlayerStats = typeof playerVsPlayerStats.$inferSelect;

export type InsertHeatMapData = z.infer<typeof insertHeatMapDataSchema>;
export type HeatMapData = typeof heatMapData.$inferSelect;

// Token schema
export const insertTokenSchema = createInsertSchema(tokens).pick({
  userId: true,
  token: true,
  type: true,
  expiresAt: true,
});

export type InsertToken = z.infer<typeof insertTokenSchema>;
export type Token = typeof tokens.$inferSelect;

// Extended schemas for frontend validation
export const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export type RegisterFormData = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const createPostSchema = insertPostSchema.omit({ userId: true }).extend({
  content: z.string().max(500, "Caption must be less than 500 characters"),
  imageUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  duration: z.number().optional(),
  location: z.string().optional(),
  category: z.enum([
    "match_discussion",
    "player_highlight",
    "team_news",
    "opinion",
    "meme",
    "highlights",
    "reel"
  ]).optional(),
  matchId: z.string().optional(),
  teamId: z.string().optional(),
  playerId: z.string().optional(),
});

// Player Dashboard Schemas
export const createPlayerStatsSchema = insertPlayerStatsSchema.extend({
  position: z.string().min(1, "Position is required"),
  battingStyle: z.string().optional(),
  bowlingStyle: z.string().optional(),
  playerOfMatchAwards: z.number().optional(),
});

export const createPlayerMatchSchema = insertPlayerMatchSchema.extend({
  matchName: z.string().min(1, "Match name is required"),
  matchDate: z.string().min(1, "Match date is required")
    .transform((dateStr) => new Date(dateStr)),
  venue: z.string().optional(),
  opponent: z.string().min(1, "Opponent is required"),
  matchType: z.string().optional(),
  teamScore: z.string().optional(),
  opponentScore: z.string().optional(),
  result: z.string().optional(),
  matchDescription: z.string().optional(),
  tossResult: z.string().optional(),
  firstInnings: z.boolean().optional(),
});

export const createPlayerMatchPerformanceSchema = insertPlayerMatchPerformanceSchema.extend({
  runsScored: z.coerce.number().min(0, "Runs scored must be a positive number").optional(),
  ballsFaced: z.coerce.number().min(0, "Balls faced must be a positive number").optional(),
  fours: z.coerce.number().min(0, "Fours must be a positive number").optional(),
  sixes: z.coerce.number().min(0, "Sixes must be a positive number").optional(),
  battingStatus: z.string().optional(),
  battingPosition: z.coerce.number().min(1).max(11).optional(),
  battingStyle: z.string().optional(),
  strikeRate: z.coerce.number().min(0).optional(),
  oversBowled: z.string().optional(),
  runsConceded: z.coerce.number().min(0, "Runs conceded must be a positive number").optional(),
  wicketsTaken: z.coerce.number().min(0, "Wickets taken must be a positive number").optional(),
  maidens: z.coerce.number().min(0, "Maidens must be a positive number").optional(),
  bowlingPosition: z.coerce.number().min(1).max(11).optional(),
  bowlingStyle: z.string().optional(),
  economyRate: z.coerce.number().min(0).optional(),
  catches: z.coerce.number().min(0, "Catches must be a positive number").optional(),
  runOuts: z.coerce.number().min(0, "Run outs must be a positive number").optional(),
  stumpings: z.coerce.number().min(0, "Stumpings must be a positive number").optional(),
  playerOfMatch: z.preprocess(
    (val) => val === "true" || val === true,
    z.boolean().optional().default(false)
  ),
});

// Story Schema

// Enhanced scoring system validation schemas
export const createMatchSchema = insertMatchSchema.extend({
  title: z.string().min(1, "Match title is required"),
  venue: z.string().optional(),
  matchDate: z.string().min(1, "Match date is required")
    .transform((dateStr) => new Date(dateStr)),
  matchType: z.enum(["T20", "ODI", "Test", "T10", "100-ball", "Custom"]),
  overs: z.coerce.number().min(1, "Overs must be at least 1").max(50, "Overs cannot exceed 50"),
  team1Id: z.coerce.number().int().positive(),
  team2Id: z.coerce.number().int().positive(),
  status: z.enum(["upcoming", "live", "completed"]).default("upcoming"),
  tossWinner: z.coerce.number().int().positive().optional(),
  tossDecision: z.enum(["bat", "bowl"]).optional(),
  createdBy: z.coerce.number().int().positive(),
});

export const createTeamSchema = insertTeamSchema.extend({
  name: z.string().min(1, "Team name is required"),
  logo: z.string().url().optional(),
  shortName: z.string().max(10, "Short name must be less than 10 characters").optional(),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  createdBy: z.coerce.number().int().positive(),
});

export const createBallByBallSchema = insertBallByBallSchema.extend({
  matchId: z.coerce.number().int().positive(),
  innings: z.coerce.number().int().min(1).max(2),
  overNumber: z.coerce.number().int().min(0),
  ballNumber: z.coerce.number().int().min(1).max(6),
  batsmanId: z.coerce.number().int().positive(),
  bowlerId: z.coerce.number().int().positive(),
  runsScored: z.coerce.number().int().min(0).max(6),
  extras: z.coerce.number().int().min(0).max(5).default(0),
  extrasType: z.enum(["none", "wide", "no_ball", "bye", "leg_bye"]).optional(),
  isWicket: z.boolean().default(false),
  dismissalType: z.enum([
    "bowled", "caught", "lbw", "run_out", "stumping", 
    "hit_wicket", "retired_hurt", "obstructing", "timed_out", "handling"
  ]).optional(),
  playerOutId: z.coerce.number().int().positive().optional(),
  fielderId: z.coerce.number().int().positive().optional(),
  commentary: z.string().max(200, "Commentary must be less than 200 characters").optional(),
  shotType: z.enum([
    "drive", "cut", "pull", "hook", "sweep", "reverse_sweep", 
    "scoop", "flick", "defensive", "leave", "edge", "other"
  ]).optional(),
  shotDirection: z.coerce.number().int().min(0).max(360).optional(),
  shotDistance: z.coerce.number().min(0).max(1).optional(),
  ballSpeed: z.coerce.number().int().min(0).max(200).optional(),
  ballLength: z.enum(["yorker", "full", "good", "short", "bouncer"]).optional(),
  ballLine: z.enum(["off", "middle", "leg", "wide"]).optional(),
});

export const createHeatMapDataSchema = insertHeatMapDataSchema.extend({
  playerId: z.coerce.number().int().positive(),
  matchId: z.coerce.number().int().positive().optional(),
  isForBatting: z.boolean(),
  zoneData: z.record(z.string(), z.number()),
});

export const createPlayerVsPlayerStatsSchema = insertPlayerVsPlayerStatsSchema.extend({
  batsmanId: z.coerce.number().int().positive(),
  bowlerId: z.coerce.number().int().positive(),
  ballsFaced: z.coerce.number().int().min(0).default(0),
  runsScored: z.coerce.number().int().min(0).default(0),
  dismissals: z.coerce.number().int().min(0).default(0),
  fours: z.coerce.number().int().min(0).default(0),
  sixes: z.coerce.number().int().min(0).default(0),
  dotBalls: z.coerce.number().int().min(0).default(0),
});

export const createMatchHighlightSchema = insertMatchHighlightSchema.extend({
  matchId: z.coerce.number().int().positive(),
  title: z.string().min(1, "Title is required"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  type: z.enum([
    "wicket", "boundary", "milestone", "partnership", "catch", "runout", "custom"
  ]),
  ballId: z.coerce.number().int().positive().optional(),
  mediaUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  playerId: z.coerce.number().int().positive().optional(),
});

export const createPartnershipSchema = insertPartnershipSchema.extend({
  matchId: z.coerce.number().int().positive(),
  innings: z.coerce.number().int().min(1).max(2),
  batsman1Id: z.coerce.number().int().positive(),
  batsman2Id: z.coerce.number().int().positive(),
  runs: z.coerce.number().int().min(0).default(0),
  balls: z.coerce.number().int().min(0).default(0),
  startOver: z.coerce.number().min(0),
  endOver: z.coerce.number().min(0).optional(),
  isCurrent: z.boolean().default(false),
});

// Types for forms
export type CreatePostFormData = z.infer<typeof createPostSchema>;
export type CreatePlayerStatsFormData = z.infer<typeof createPlayerStatsSchema>;
export type CreatePlayerMatchFormData = z.infer<typeof createPlayerMatchSchema>;
export type CreatePlayerMatchPerformanceFormData = z.infer<typeof createPlayerMatchPerformanceSchema>;
export type CreateStoryFormData = z.infer<typeof createStorySchema>;

// Types for enhanced scoring forms
export type CreateMatchFormData = z.infer<typeof createMatchSchema>;
export type CreateTeamFormData = z.infer<typeof createTeamSchema>;
export type CreateBallByBallFormData = z.infer<typeof createBallByBallSchema>;
export type CreateHeatMapDataFormData = z.infer<typeof createHeatMapDataSchema>;
export type CreatePlayerVsPlayerStatsFormData = z.infer<typeof createPlayerVsPlayerStatsSchema>;
export type CreateMatchHighlightFormData = z.infer<typeof createMatchHighlightSchema>;
export type CreatePartnershipFormData = z.infer<typeof createPartnershipSchema>;