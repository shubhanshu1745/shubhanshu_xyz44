import { pgTable, text, serial, integer, boolean, timestamp, numeric } from "drizzle-orm/pg-core";
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
  // Bowling
  oversBowled: numeric("overs_bowled").default("0"),
  runsConceded: integer("runs_conceded").default(0),
  wicketsTaken: integer("wickets_taken").default(0),
  maidens: integer("maidens").default(0),
  // Fielding
  catches: integer("catches").default(0),
  runOuts: integer("run_outs").default(0),
  stumpings: integer("stumpings").default(0),
  createdAt: timestamp("created_at").defaultNow(),
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
  });

// Story Schema
export const createStorySchema = insertStorySchema.extend({
  imageUrl: z.string().min(1, "Image URL is required"),
  caption: z.string().max(100, "Caption must be less than 100 characters").optional(),
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
  runsScored: z.number().min(0, "Runs scored must be a positive number").optional(),
  ballsFaced: z.number().min(0, "Balls faced must be a positive number").optional(),
  fours: z.number().min(0, "Fours must be a positive number").optional(),
  sixes: z.number().min(0, "Sixes must be a positive number").optional(),
  battingStatus: z.string().optional(),
  oversBowled: z.string().optional(),
  runsConceded: z.number().min(0, "Runs conceded must be a positive number").optional(),
  wicketsTaken: z.number().min(0, "Wickets taken must be a positive number").optional(),
  maidens: z.number().min(0, "Maidens must be a positive number").optional(),
  catches: z.number().min(0, "Catches must be a positive number").optional(),
  runOuts: z.number().min(0, "Run outs must be a positive number").optional(),
  stumpings: z.number().min(0, "Stumpings must be a positive number").optional(),
});

// Story Schema

export type CreatePostFormData = z.infer<typeof createPostSchema>;
export type CreatePlayerStatsFormData = z.infer<typeof createPlayerStatsSchema>;
export type CreatePlayerMatchFormData = z.infer<typeof createPlayerMatchSchema>;
export type CreatePlayerMatchPerformanceFormData = z.infer<typeof createPlayerMatchPerformanceSchema>;
export type CreateStoryFormData = z.infer<typeof createStorySchema>;