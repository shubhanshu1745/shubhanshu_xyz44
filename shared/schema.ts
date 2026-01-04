import { pgTable, text, serial, integer, boolean, timestamp, numeric, jsonb, primaryKey, unique } from "drizzle-orm/pg-core";
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
  isCoach: boolean("is_coach").default(false),
  isAdmin: boolean("is_admin").default(false),
  isFan: boolean("is_fan").default(true),
  preferredRole: text("preferred_role"), // "batsman", "bowler", "all-rounder", "wicket-keeper"
  battingStyle: text("batting_style"), // "right-handed", "left-handed"
  bowlingStyle: text("bowling_style"), // "right-arm fast", "left-arm spin", etc.
  favoriteTeam: text("favorite_team"),
  favoritePlayer: text("favorite_player"),
  emailVerified: boolean("email_verified").default(false),
  phoneNumber: text("phone_number"),
  phoneVerified: boolean("phone_verified").default(false),
  verificationBadge: boolean("verification_badge").default(false),
  registrationMethod: text("registration_method").default("email"), // "email", "google", "facebook", "phone"
  lastLoginAt: timestamp("last_login_at"),
  // Privacy settings
  isPrivate: boolean("is_private").default(false), // Private account setting
  allowTagging: boolean("allow_tagging").default(true),
  allowMentions: boolean("allow_mentions").default(true),
  showActivityStatus: boolean("show_activity_status").default(true),
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
  reactionType: text("reaction_type").default("like").notNull(), // "like", "howzat", "six", "four", "clap", "wow"
  createdAt: timestamp("created_at").defaultNow(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  userId: integer("user_id").notNull(),
  postId: integer("post_id").notNull(),
  parentId: integer("parent_id"), // For nested replies - references another comment
  isPinned: boolean("is_pinned").default(false), // Pinned by post owner
  isEdited: boolean("is_edited").default(false), // Track if comment was edited
  editedAt: timestamp("edited_at"), // When comment was last edited
  createdAt: timestamp("created_at").defaultNow(),
});

// Saved posts (bookmarks)
export const savedPosts = pgTable("saved_posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  postId: integer("post_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Comment likes
export const commentLikes = pgTable("comment_likes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  commentId: integer("comment_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Post shares tracking
export const postShares = pgTable("post_shares", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  postId: integer("post_id").notNull(),
  shareType: text("share_type").notNull(), // "followers", "direct", "external", "copy_link"
  recipientId: integer("recipient_id"), // For direct shares to specific users
  platform: text("platform"), // For external shares: "twitter", "facebook", "whatsapp", etc.
  createdAt: timestamp("created_at").defaultNow(),
});

export const follows = pgTable("follows", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").notNull(),
  followingId: integer("following_id").notNull(),
  status: text("status").notNull().default("accepted"), // "pending", "accepted", "rejected"
  createdAt: timestamp("created_at").defaultNow(),
  acceptedAt: timestamp("accepted_at"), // When the follow request was accepted
});

// Notifications system
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // User who receives the notification
  fromUserId: integer("from_user_id"), // User who triggered the notification (optional)
  type: text("type").notNull(), // "follow_request", "follow_accepted", "like", "comment", "mention", "story_view", "post_share"
  title: text("title").notNull(),
  message: text("message").notNull(),
  entityType: text("entity_type"), // "post", "story", "comment", "user"
  entityId: integer("entity_id"), // ID of the related entity
  imageUrl: text("image_url"), // Optional image for the notification
  actionUrl: text("action_url"), // URL to navigate when notification is clicked
  isRead: boolean("is_read").default(false),
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
  filterId: text("filter_id"), // ID of the applied filter
  effectIds: text("effect_ids"), // Comma-separated IDs of applied effects
  mediaType: text("media_type").default("image").notNull(), // "image", "video"
  videoUrl: text("video_url"), // URL for video stories
  musicTrackId: text("music_track_id"), // Optional background music
  matchId: integer("match_id"), // Optional match reference
  isHighlight: boolean("is_highlight").default(false), // Whether to keep after 24 hours
  viewCount: integer("view_count").default(0), // Number of views
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // 24 hours after creation
});

export type Story = typeof stories.$inferSelect;
export type InsertStory = typeof stories.$inferInsert;
export const createInsertStorySchema = createInsertSchema(stories).omit({ id: true, createdAt: true, expiresAt: true, viewCount: true });

export const storyViews = pgTable("story_views", {
  id: serial("id").primaryKey(),
  storyId: integer("story_id").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type StoryView = typeof storyViews.$inferSelect;
export type InsertStoryView = typeof storyViews.$inferInsert;
export const createInsertStoryViewSchema = createInsertSchema(storyViews).omit({ id: true, createdAt: true });

export const storyReactions = pgTable("story_reactions", {
  id: serial("id").primaryKey(),
  storyId: integer("story_id").notNull(),
  userId: integer("user_id").notNull(),
  reactionType: text("reaction_type").default("like").notNull(), // "like", "howzat", "six", "four", "clap", "wow" 
  createdAt: timestamp("created_at").defaultNow(),
});

export type StoryReaction = typeof storyReactions.$inferSelect;
export type InsertStoryReaction = typeof storyReactions.$inferInsert;
export const createInsertStoryReactionSchema = createInsertSchema(storyReactions).omit({ id: true, createdAt: true });

export const storyComments = pgTable("story_comments", {
  id: serial("id").primaryKey(),
  storyId: integer("story_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Story polls
export const storyPolls = pgTable("story_polls", {
  id: serial("id").primaryKey(),
  storyId: integer("story_id").notNull(),
  question: text("question").notNull(),
  option1: text("option1").notNull(),
  option2: text("option2").notNull(),
  option3: text("option3"),
  option4: text("option4"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type StoryPoll = typeof storyPolls.$inferSelect;
export type InsertStoryPoll = typeof storyPolls.$inferInsert;
export const createInsertStoryPollSchema = createInsertSchema(storyPolls).omit({ id: true, createdAt: true });

// Story poll votes
export const storyPollVotes = pgTable("story_poll_votes", {
  id: serial("id").primaryKey(),
  pollId: integer("poll_id").notNull(),
  userId: integer("user_id").notNull(),
  optionNumber: integer("option_number").notNull(), // 1, 2, 3, or 4
  createdAt: timestamp("created_at").defaultNow(),
});

export type StoryPollVote = typeof storyPollVotes.$inferSelect;
export type InsertStoryPollVote = typeof storyPollVotes.$inferInsert;
export const createInsertStoryPollVoteSchema = createInsertSchema(storyPollVotes).omit({ id: true, createdAt: true });

// Story questions (Q&A)
export const storyQuestions = pgTable("story_questions", {
  id: serial("id").primaryKey(),
  storyId: integer("story_id").notNull(),
  question: text("question").notNull(), // The question prompt
  createdAt: timestamp("created_at").defaultNow(),
});

export type StoryQuestion = typeof storyQuestions.$inferSelect;
export type InsertStoryQuestion = typeof storyQuestions.$inferInsert;
export const createInsertStoryQuestionSchema = createInsertSchema(storyQuestions).omit({ id: true, createdAt: true });

// Story question responses
export const storyQuestionResponses = pgTable("story_question_responses", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull(),
  userId: integer("user_id").notNull(),
  response: text("response").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type StoryQuestionResponse = typeof storyQuestionResponses.$inferSelect;
export type InsertStoryQuestionResponse = typeof storyQuestionResponses.$inferInsert;
export const createInsertStoryQuestionResponseSchema = createInsertSchema(storyQuestionResponses).omit({ id: true, createdAt: true });

export type StoryComment = typeof storyComments.$inferSelect;
export type InsertStoryComment = typeof storyComments.$inferInsert;
export const createInsertStoryCommentSchema = createInsertSchema(storyComments).omit({ id: true, createdAt: true });

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
  status: text("status").notNull().default("upcoming"), // "upcoming", "toss", "live", "completed"
  result: text("result"),
  winner: integer("winner"), // Team ID of the winner
  tossWinner: integer("toss_winner"), // Team ID that won the toss
  tossDecision: text("toss_decision"), // "bat", "bowl"
  currentInnings: integer("current_innings").default(1),
  mainUmpireId: integer("main_umpire_id"), // User ID of main umpire
  secondUmpireId: integer("second_umpire_id"), // User ID of second umpire
  thirdUmpireId: integer("third_umpire_id"), // User ID of third umpire
  matchRefereeId: integer("match_referee_id"), // User ID of match referee
  weatherConditions: text("weather_conditions"), // E.g. sunny, cloudy, rainy
  pitchConditions: text("pitch_conditions"), // E.g. dry, dusty, green
  tossTime: timestamp("toss_time"), // When toss occurred
  matchStartTime: timestamp("match_start_time"), // When match started
  matchEndTime: timestamp("match_end_time"), // When match ended
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
  isCaptain: boolean("is_captain").default(false),
  isViceCaptain: boolean("is_vice_captain").default(false),
  isWicketkeeper: boolean("is_wicketkeeper").default(false),
  battingPosition: integer("batting_position"),
  bowlingPosition: integer("bowling_position"),
  playerMatchNotes: text("player_match_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

// Content categorization and discovery system
export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  type: text("type").notNull(), // "player", "team", "format", "skill", "location", "event", "topic"
  popularityScore: integer("popularity_score").default(0), // dynamically updated based on usage
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const postTags = pgTable("post_tags", {
  postId: integer("post_id").notNull(),
  tagId: integer("tag_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.postId, table.tagId] }),
  };
});

export const contentCategories = pgTable("content_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  iconUrl: text("icon_url"),
  priority: integer("priority").default(0), // for display ordering
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userInterests = pgTable("user_interests", {
  userId: integer("user_id").notNull(),
  tagId: integer("tag_id").notNull(),
  interactionScore: numeric("interaction_score", { precision: 2 }).default("0"), // Weight of user's interest (0-1)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.userId, table.tagId] }),
  };
});

export const contentEngagement = pgTable("content_engagement", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  postId: integer("post_id").notNull(),
  engagementType: text("engagement_type").notNull(), // "view", "like", "comment", "share", "save", "time_spent"
  engagementScore: numeric("engagement_score", { precision: 2 }).default("0"), // Calculated engagement score
  duration: integer("duration"), // Time spent in seconds if applicable
  createdAt: timestamp("created_at").defaultNow(),
});

// Cricket-specific polls and predictions
export const polls = pgTable("polls", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // Poll creator
  question: text("question").notNull(),
  pollType: text("poll_type").notNull(), // "match_prediction", "player_performance", "team_selection", "general"
  matchId: integer("match_id"), // Optional reference to a match
  playerId: integer("player_id"), // Optional reference to a player
  teamId: integer("team_id"), // Optional reference to a team
  endTime: timestamp("end_time"), // When the poll closes
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Poll = typeof polls.$inferSelect;
export type InsertPoll = typeof polls.$inferInsert;
export const createInsertPollSchema = createInsertSchema(polls).omit({ id: true, createdAt: true, updatedAt: true });

export const pollOptions = pgTable("poll_options", {
  id: serial("id").primaryKey(),
  pollId: integer("poll_id").notNull(),
  option: text("option").notNull(),
  imageUrl: text("image_url"), // Optional image for the option
  createdAt: timestamp("created_at").defaultNow(),
});

export type PollOption = typeof pollOptions.$inferSelect;
export type InsertPollOption = typeof pollOptions.$inferInsert;
export const createInsertPollOptionSchema = createInsertSchema(pollOptions).omit({ id: true, createdAt: true });

export const pollVotes = pgTable("poll_votes", {
  id: serial("id").primaryKey(),
  pollId: integer("poll_id").notNull(),
  optionId: integer("option_id").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type PollVote = typeof pollVotes.$inferSelect;
export type InsertPollVote = typeof pollVotes.$inferInsert;
export const createInsertPollVoteSchema = createInsertSchema(pollVotes).omit({ id: true, createdAt: true });

// Content rewards and recognition system
export const contentRewards = pgTable("content_rewards", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  userId: integer("user_id").notNull(),
  rewardType: text("reward_type").notNull(), // "featured", "trending", "editor_pick", "expert_insight", "cricket_moment"
  points: integer("points").default(0),
  description: text("description"),
  awardedBy: integer("awarded_by"), // User ID of admin/moderator who awarded
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Enhanced Social Features Tables

// User relationships tracking all social connections
export const userRelationships = pgTable("user_relationships", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  targetUserId: integer("target_user_id").notNull().references(() => users.id),
  relationshipType: text("relationship_type").notNull(), // "following", "blocked", "restricted", "muted", "close_friend"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    uniqueRelationship: unique().on(table.userId, table.targetUserId),
  };
});

// Follow requests for private accounts
export const followRequests = pgTable("follow_requests", {
  id: serial("id").primaryKey(),
  requesterId: integer("requester_id").notNull().references(() => users.id),
  requestedId: integer("requested_id").notNull().references(() => users.id),
  status: text("status").notNull().default("pending"), // "pending", "accepted", "rejected", "cancelled"
  createdAt: timestamp("created_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
}, (table) => {
  return {
    uniqueRequest: unique().on(table.requesterId, table.requestedId),
  };
});

// Enhanced privacy settings
export const userPrivacySettings = pgTable("user_privacy_settings", {
  userId: integer("user_id").primaryKey().references(() => users.id),
  allowTagging: boolean("allow_tagging").default(true),
  allowMentions: boolean("allow_mentions").default(true),
  showActivityStatus: boolean("show_activity_status").default(true),
  allowMessageRequests: boolean("allow_message_requests").default(true),
  allowStoryReplies: boolean("allow_story_replies").default(true),
  whoCanSeeFollowers: text("who_can_see_followers").default("everyone"), // "everyone", "followers", "no_one"
  whoCanSeeFollowing: text("who_can_see_following").default("everyone"), // "everyone", "followers", "no_one"
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Close friends management
export const closeFriends = pgTable("close_friends", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  friendId: integer("friend_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    uniqueFriendship: unique().on(table.userId, table.friendId),
  };
});

// Post collaborators
export const postCollaborators = pgTable("post_collaborators", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => posts.id),
  userId: integer("user_id").notNull().references(() => users.id),
  status: text("status").default("pending"), // "pending", "accepted", "rejected"
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    uniqueCollaboration: unique().on(table.postId, table.userId),
  };
});

// Post mentions
export const postMentions = pgTable("post_mentions", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => posts.id),
  mentionedUserId: integer("mentioned_user_id").notNull().references(() => users.id),
  mentionedByUserId: integer("mentioned_by_user_id").notNull().references(() => users.id),
  mentionType: text("mention_type").default("post"), // "post", "comment"
  createdAt: timestamp("created_at").defaultNow(),
});

// Enhanced story privacy
export const storyPrivacy = pgTable("story_privacy", {
  id: serial("id").primaryKey(),
  storyId: integer("story_id").notNull().references(() => stories.id),
  visibilityType: text("visibility_type").default("followers"), // "public", "followers", "close_friends", "custom"
  customList: jsonb("custom_list"), // Array of user IDs for custom visibility
  hiddenFrom: jsonb("hidden_from"), // Array of user IDs to hide from
  createdAt: timestamp("created_at").defaultNow(),
});

// Content reports
export const contentReports = pgTable("content_reports", {
  id: serial("id").primaryKey(),
  reporterId: integer("reporter_id").notNull().references(() => users.id),
  contentId: integer("content_id").notNull(),
  contentType: text("content_type").notNull(), // "post", "story", "comment", "user"
  reason: text("reason").notNull(),
  description: text("description"),
  status: text("status").default("pending"), // "pending", "reviewed", "resolved", "dismissed"
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Group chats
export const groupChats = pgTable("group_chats", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  avatarUrl: text("avatar_url"),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Group members
export const groupMembers = pgTable("group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => groupChats.id),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role").default("member"), // "admin", "member"
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
  isActive: boolean("is_active").default(true),
}, (table) => {
  return {
    uniqueMembership: unique().on(table.groupId, table.userId),
  };
});

// Message reactions
export const messageReactions = pgTable("message_reactions", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull().references(() => messages.id),
  userId: integer("user_id").notNull().references(() => users.id),
  reaction: text("reaction").notNull(), // emoji or reaction type
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    uniqueReaction: unique().on(table.messageId, table.userId),
  };
});

// Message requests
export const messageRequests = pgTable("message_requests", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  recipientId: integer("recipient_id").notNull().references(() => users.id),
  messageId: integer("message_id").notNull().references(() => messages.id),
  status: text("status").default("pending"), // "pending", "accepted", "declined"
  createdAt: timestamp("created_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
});

// User restrictions (blocked, muted, restricted users)
export const userRestrictions = pgTable("user_restrictions", {
  id: serial("id").primaryKey(),
  restricterId: integer("restricter_id").notNull().references(() => users.id),
  restrictedId: integer("restricted_id").notNull().references(() => users.id),
  restrictionType: text("restriction_type").notNull(), // "blocked", "muted", "restricted"
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    uniqueRestriction: unique().on(table.restricterId, table.restrictedId, table.restrictionType),
  };
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
  reactionType: true,
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  content: true,
  userId: true,
  postId: true,
  parentId: true,
});

export const insertSavedPostSchema = createInsertSchema(savedPosts).pick({
  userId: true,
  postId: true,
});

export const insertCommentLikeSchema = createInsertSchema(commentLikes).pick({
  userId: true,
  commentId: true,
});

export const insertPostShareSchema = createInsertSchema(postShares).pick({
  userId: true,
  postId: true,
  shareType: true,
  recipientId: true,
  platform: true,
});

export const insertFollowSchema = createInsertSchema(follows).pick({
  followerId: true,
  followingId: true,
  status: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  fromUserId: true,
  type: true,
  title: true,
  message: true,
  entityType: true,
  entityId: true,
  imageUrl: true,
  actionUrl: true,
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
export const createStorySchema = z.object({
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
  isCaptain: true,
  isViceCaptain: true,
  isWicketkeeper: true,
  battingPosition: true,
  bowlingPosition: true,
  playerMatchNotes: true,
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

// New content categorization and discovery system schemas
export const insertTagSchema = createInsertSchema(tags).pick({
  name: true,
  description: true,
  type: true,
  popularityScore: true,
});

export const insertPostTagSchema = createInsertSchema(postTags).pick({
  postId: true,
  tagId: true,
});

export const insertContentCategorySchema = createInsertSchema(contentCategories).pick({
  name: true,
  description: true,
  iconUrl: true,
  priority: true,
});

export const insertUserInterestSchema = createInsertSchema(userInterests).pick({
  userId: true,
  tagId: true,
  interactionScore: true,
});

export const insertContentEngagementSchema = createInsertSchema(contentEngagement).pick({
  userId: true,
  postId: true,
  engagementType: true,
  engagementScore: true,
  duration: true,
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

export type InsertSavedPost = z.infer<typeof insertSavedPostSchema>;
export type SavedPost = typeof savedPosts.$inferSelect;

export type InsertCommentLike = z.infer<typeof insertCommentLikeSchema>;
export type CommentLike = typeof commentLikes.$inferSelect;

export type InsertPostShare = z.infer<typeof insertPostShareSchema>;
export type PostShare = typeof postShares.$inferSelect;

export type InsertFollow = z.infer<typeof insertFollowSchema>;
export type Follow = typeof follows.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export type InsertBlockedUser = z.infer<typeof insertBlockedUserSchema>;
export type BlockedUser = typeof blockedUsers.$inferSelect;

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// These types are already defined above
// export type InsertStory = z.infer<typeof insertStorySchema>;
// export type Story = typeof stories.$inferSelect;

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

// Content categorization and discovery system types
export type InsertTag = z.infer<typeof insertTagSchema>;
export type Tag = typeof tags.$inferSelect;

export type InsertPostTag = z.infer<typeof insertPostTagSchema>;
export type PostTag = typeof postTags.$inferSelect;

export type InsertContentCategory = z.infer<typeof insertContentCategorySchema>;
export type ContentCategory = typeof contentCategories.$inferSelect;

export type InsertUserInterest = z.infer<typeof insertUserInterestSchema>;
export type UserInterest = typeof userInterests.$inferSelect;

export type InsertContentEngagement = z.infer<typeof insertContentEngagementSchema>;
export type ContentEngagement = typeof contentEngagement.$inferSelect;

// Enhanced Social Features Types

export type InsertUserRelationship = z.infer<typeof insertUserRelationshipSchema>;
export type UserRelationship = typeof userRelationships.$inferSelect;

export type InsertFollowRequest = z.infer<typeof insertFollowRequestSchema>;
export type FollowRequest = typeof followRequests.$inferSelect;

export type InsertUserPrivacySettings = z.infer<typeof insertUserPrivacySettingsSchema>;
export type UserPrivacySettings = typeof userPrivacySettings.$inferSelect;

export type InsertCloseFriend = z.infer<typeof insertCloseFriendSchema>;
export type CloseFriend = typeof closeFriends.$inferSelect;

export type InsertPostCollaborator = z.infer<typeof insertPostCollaboratorSchema>;
export type PostCollaborator = typeof postCollaborators.$inferSelect;

export type InsertPostMention = z.infer<typeof insertPostMentionSchema>;
export type PostMention = typeof postMentions.$inferSelect;

export type InsertStoryPrivacy = z.infer<typeof insertStoryPrivacySchema>;
export type StoryPrivacy = typeof storyPrivacy.$inferSelect;

export type InsertContentReport = z.infer<typeof insertContentReportSchema>;
export type ContentReport = typeof contentReports.$inferSelect;

export type InsertGroupChat = z.infer<typeof insertGroupChatSchema>;
export type GroupChat = typeof groupChats.$inferSelect;

export type InsertGroupMember = z.infer<typeof insertGroupMemberSchema>;
export type GroupMember = typeof groupMembers.$inferSelect;

export type InsertMessageReaction = z.infer<typeof insertMessageReactionSchema>;
export type MessageReaction = typeof messageReactions.$inferSelect;

export type InsertMessageRequest = z.infer<typeof insertMessageRequestSchema>;
export type MessageRequest = typeof messageRequests.$inferSelect;

export type InsertUserRestriction = z.infer<typeof insertUserRestrictionSchema>;
export type UserRestriction = typeof userRestrictions.$inferSelect;

// Token schema
export const insertTokenSchema = createInsertSchema(tokens).pick({
  userId: true,
  token: true,
  type: true,
  expiresAt: true,
});

export type InsertToken = z.infer<typeof insertTokenSchema>;
export type Token = typeof tokens.$inferSelect;

// Enhanced Social Features Insert Schemas

export const insertUserRelationshipSchema = createInsertSchema(userRelationships).pick({
  userId: true,
  targetUserId: true,
  relationshipType: true,
});

export const insertFollowRequestSchema = createInsertSchema(followRequests).pick({
  requesterId: true,
  requestedId: true,
  status: true,
});

export const insertUserPrivacySettingsSchema = createInsertSchema(userPrivacySettings).pick({
  userId: true,
  allowTagging: true,
  allowMentions: true,
  showActivityStatus: true,
  allowMessageRequests: true,
  allowStoryReplies: true,
  whoCanSeeFollowers: true,
  whoCanSeeFollowing: true,
});

export const insertCloseFriendSchema = createInsertSchema(closeFriends).pick({
  userId: true,
  friendId: true,
});

export const insertPostCollaboratorSchema = createInsertSchema(postCollaborators).pick({
  postId: true,
  userId: true,
  status: true,
});

export const insertPostMentionSchema = createInsertSchema(postMentions).pick({
  postId: true,
  mentionedUserId: true,
  mentionedByUserId: true,
  mentionType: true,
});

export const insertStoryPrivacySchema = createInsertSchema(storyPrivacy).pick({
  storyId: true,
  visibilityType: true,
  customList: true,
  hiddenFrom: true,
});

export const insertContentReportSchema = createInsertSchema(contentReports).pick({
  reporterId: true,
  contentId: true,
  contentType: true,
  reason: true,
  description: true,
});

export const insertGroupChatSchema = createInsertSchema(groupChats).pick({
  name: true,
  description: true,
  avatarUrl: true,
  creatorId: true,
});

export const insertGroupMemberSchema = createInsertSchema(groupMembers).pick({
  groupId: true,
  userId: true,
  role: true,
});

export const insertMessageReactionSchema = createInsertSchema(messageReactions).pick({
  messageId: true,
  userId: true,
  reaction: true,
});

export const insertMessageRequestSchema = createInsertSchema(messageRequests).pick({
  senderId: true,
  recipientId: true,
  messageId: true,
  status: true,
});

export const insertUserRestrictionSchema = createInsertSchema(userRestrictions).pick({
  restricterId: true,
  restrictedId: true,
  restrictionType: true,
});

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

// Content tagging and categorization validation schemas
export const createTagSchema = insertTagSchema.extend({
  name: z.string().min(1, "Tag name is required"),
  description: z.string().max(200, "Description must be less than 200 characters").optional(),
  type: z.enum([
    "player", "team", "format", "skill", "location", "event", "topic"
  ]),
  popularityScore: z.coerce.number().int().min(0).default(0),
});

export const createContentCategorySchema = insertContentCategorySchema.extend({
  name: z.string().min(1, "Category name is required"),
  description: z.string().max(200, "Description must be less than 200 characters").optional(),
  iconUrl: z.string().url().optional(),
  priority: z.coerce.number().int().min(0).default(0),
});

export const createUserInterestSchema = insertUserInterestSchema.extend({
  userId: z.coerce.number().int().positive(),
  tagId: z.coerce.number().int().positive(),
  interactionScore: z.coerce.number().min(0).max(1).default(0),
});

export const createContentEngagementSchema = insertContentEngagementSchema.extend({
  userId: z.coerce.number().int().positive(),
  postId: z.coerce.number().int().positive(),
  engagementType: z.enum(["view", "like", "comment", "share", "save", "time_spent"]),
  engagementScore: z.coerce.number().min(0).max(1).default(0),
  duration: z.coerce.number().int().min(0).optional(),
});

// Venue Management
export const venues = pgTable("venues", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state"),
  country: text("country").notNull(),
  postalCode: text("postal_code"),
  capacity: integer("capacity"),
  facilities: text("facilities").array(),
  description: text("description"),
  imageUrl: text("image_url"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  pricePerHour: numeric("price_per_hour"),
  isActive: boolean("is_active").default(true),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  latitude: numeric("latitude"),
  longitude: numeric("longitude"),
});

export const venueAvailability = pgTable("venue_availability", {
  id: serial("id").primaryKey(),
  venueId: integer("venue_id").references(() => venues.id).notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 for Sunday-Saturday
  startTime: text("start_time").notNull(), // Format: HH:MM in 24-hour
  endTime: text("end_time").notNull(), // Format: HH:MM in 24-hour
  isAvailable: boolean("is_available").default(true),
});

export const venueBookings = pgTable("venue_bookings", {
  id: serial("id").primaryKey(),
  venueId: integer("venue_id").references(() => venues.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  date: timestamp("date").notNull(),
  startTime: text("start_time").notNull(), // Format: HH:MM in 24-hour
  endTime: text("end_time").notNull(), // Format: HH:MM in 24-hour
  purpose: text("purpose"),
  numberOfPeople: integer("number_of_people"),
  status: text("status").notNull().default("pending"), // pending, confirmed, cancelled, completed
  paymentStatus: text("payment_status").default("unpaid"), // unpaid, partial, paid
  totalAmount: numeric("total_amount"),
  paidAmount: numeric("paid_amount").default("0"),
  transactionId: text("transaction_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  tournamentId: integer("tournament_id"), // Can be null if not for a tournament
});

// Tournament Organization
export const tournaments = pgTable("tournaments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  shortName: text("short_name"), // Short name for display in tables/charts
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  registrationDeadline: timestamp("registration_deadline"),
  maxTeams: integer("max_teams"),
  entryFee: numeric("entry_fee").default("0"),
  prizePool: numeric("prize_pool").default("0"),
  format: text("format").notNull(), // T20, ODI, Test, mixed, other
  tournamentType: text("tournament_type").notNull(), // league, knockout, group_stage_knockout, etc.
  status: text("status").notNull().default("upcoming"), // upcoming, ongoing, completed, cancelled
  organizerId: integer("organizer_id").references(() => users.id).notNull(),
  logoUrl: text("logo_url"),
  bannerUrl: text("banner_url"),
  rules: text("rules"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  isPublic: boolean("is_public").default(true),
  pointsPerWin: integer("points_per_win").default(2), // Points system for league format
  pointsPerLoss: integer("points_per_loss").default(0),
  pointsPerTie: integer("points_per_tie").default(1),
  pointsPerNoResult: integer("points_per_no_result").default(1),
  qualificationRules: text("qualification_rules"), // Rules for advancing to knockout stages
  tiebreakers: text("tiebreakers"), // How to resolve tied standings
  overs: integer("overs"), // Overs per innings if limited overs format
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tournamentTeams = pgTable("tournament_teams", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id").references(() => tournaments.id).notNull(),
  teamId: integer("team_id").references(() => teams.id).notNull(),
  registrationDate: timestamp("registration_date").defaultNow(),
  registrationStatus: text("registration_status").default("pending"), // pending, approved, rejected
  paymentStatus: text("payment_status").default("unpaid"), // unpaid, partial, paid
  paidAmount: numeric("paid_amount").default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tournamentMatches = pgTable("tournament_matches", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id").references(() => tournaments.id).notNull(),
  matchId: integer("match_id").references(() => matches.id).notNull(),
  round: integer("round"), // 1 for first round, 2 for second round, etc.
  matchNumber: integer("match_number"), // Match number in the tournament
  group: text("group"), // For group stage matches
  stage: text("stage"), // group, quarter-final, semi-final, final, etc.
  venueId: integer("venue_id").references(() => venues.id),
  scheduledDate: timestamp("scheduled_date"),
  scheduledTime: text("scheduled_time"), // Format: HH:MM in 24-hour
  status: text("status").default("scheduled"), // scheduled, live, completed, postponed, cancelled
  home_team_id: integer("home_team_id").references(() => teams.id),
  away_team_id: integer("away_team_id").references(() => teams.id),
  home_team_score: text("home_team_score"), // Can be formatted like "156/7" for cricket
  away_team_score: text("away_team_score"),
  result: text("result"), // home_win, away_win, tie, no_result, abandoned
  resultDetails: text("result_details"), // Additional details about result (e.g., "Team A won by 25 runs")
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tournament standings table to track team performance in tournaments
export const tournamentStandings = pgTable("tournament_standings", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id").references(() => tournaments.id).notNull(),
  teamId: integer("team_id").references(() => teams.id).notNull(),
  group: text("group"), // For group-based tournaments
  played: integer("played").default(0),
  won: integer("won").default(0),
  lost: integer("lost").default(0),
  tied: integer("tied").default(0),
  no_result: integer("no_result").default(0),
  points: integer("points").default(0),
  netRunRate: numeric("net_run_rate").default("0"),
  forRuns: integer("for_runs").default(0),
  forOvers: numeric("for_overs").default("0"),
  againstRuns: integer("against_runs").default(0),
  againstOvers: numeric("against_overs").default("0"),
  position: integer("position"), // Current position in group/tournament
  qualified: boolean("qualified"), // Has qualified for next stage
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Player tournament statistics to track individual player performance across a tournament
export const playerTournamentStats = pgTable("player_tournament_stats", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id").references(() => tournaments.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  // Batting stats
  matches: integer("matches").default(0),
  runs: integer("runs").default(0),
  ballsFaced: integer("balls_faced").default(0),
  fours: integer("fours").default(0),
  sixes: integer("sixes").default(0),
  fifties: integer("fifties").default(0),
  hundreds: integer("hundreds").default(0),
  highestScore: integer("highest_score").default(0),
  battingAverage: numeric("batting_average", { precision: 6, scale: 2 }).default("0"),
  strikeRate: numeric("strike_rate", { precision: 6, scale: 2 }).default("0"),
  // Bowling stats
  overs: numeric("overs", { precision: 6, scale: 1 }).default("0"),
  wickets: integer("wickets").default(0),
  runsConceded: integer("runs_conceded").default(0),
  maidens: integer("maidens").default(0),
  fiveWickets: integer("five_wickets").default(0),
  bowlingAverage: numeric("bowling_average", { precision: 6, scale: 2 }).default("0"),
  economyRate: numeric("economy_rate", { precision: 6, scale: 2 }).default("0"),
  // Fielding stats
  catches: integer("catches").default(0),
  runOuts: integer("run_outs").default(0),
  stumpings: integer("stumpings").default(0),
  // Timestamps
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tournament statistics to track outstanding performances
export const tournamentStatistics = pgTable("tournament_statistics", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id").references(() => tournaments.id).notNull(),
  statCategory: text("stat_category").notNull(), // batting, bowling, fielding, allround
  userId: integer("user_id").references(() => users.id).notNull(), // Reference to user who is the player
  teamId: integer("team_id").references(() => teams.id).notNull(),
  runs: integer("runs").default(0),
  ballsFaced: integer("balls_faced").default(0),
  fours: integer("fours").default(0),
  sixes: integer("sixes").default(0),
  highest: integer("highest").default(0),
  fifties: integer("fifties").default(0),
  hundreds: integer("hundreds").default(0),
  strikeRate: numeric("strike_rate").default("0"),
  average: numeric("average").default("0"),
  wickets: integer("wickets").default(0),
  overs: numeric("overs").default("0"),
  maidens: integer("maidens").default(0),
  economy: numeric("economy").default("0"),
  best_bowling: text("best_bowling"),
  catches: integer("catches").default(0),
  stumpings: integer("stumpings").default(0),
  runOuts: integer("run_outs").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schema Definitions
export const insertVenueSchema = createInsertSchema(venues).pick({
  name: true,
  address: true,
  city: true,
  state: true,
  country: true,
  postalCode: true,
  capacity: true,
  facilities: true,
  description: true,
  imageUrl: true,
  contactEmail: true,
  contactPhone: true,
  pricePerHour: true,
  createdBy: true,
  latitude: true,
  longitude: true,
});

export const insertVenueAvailabilitySchema = createInsertSchema(venueAvailability).pick({
  venueId: true,
  dayOfWeek: true,
  startTime: true,
  endTime: true,
  isAvailable: true,
});

export const insertVenueBookingSchema = createInsertSchema(venueBookings).pick({
  venueId: true,
  userId: true,
  date: true,
  startTime: true,
  endTime: true,
  purpose: true,
  numberOfPeople: true,
  status: true,
  paymentStatus: true,
  totalAmount: true,
  paidAmount: true,
  transactionId: true,
  notes: true,
  tournamentId: true,
});

export const insertTournamentSchema = createInsertSchema(tournaments).pick({
  name: true,
  shortName: true,
  description: true,
  startDate: true,
  endDate: true,
  registrationDeadline: true,
  maxTeams: true,
  entryFee: true,
  prizePool: true,
  format: true,
  tournamentType: true,
  status: true,
  organizerId: true,
  logoUrl: true,
  bannerUrl: true,
  rules: true,
  contactEmail: true,
  contactPhone: true,
  isPublic: true,
  pointsPerWin: true,
  pointsPerLoss: true,
  pointsPerTie: true,
  pointsPerNoResult: true,
  qualificationRules: true,
  tiebreakers: true,
  overs: true,
});

export const insertTournamentTeamSchema = createInsertSchema(tournamentTeams).pick({
  tournamentId: true,
  teamId: true,
  registrationStatus: true,
  paymentStatus: true,
  paidAmount: true,
  notes: true,
});

export const insertTournamentMatchSchema = createInsertSchema(tournamentMatches).pick({
  tournamentId: true,
  matchId: true,
  round: true,
  matchNumber: true,
  group: true,
  stage: true,
  venueId: true,
  scheduledDate: true,
  scheduledTime: true,
  status: true,
  home_team_id: true,
  away_team_id: true,
  home_team_score: true,
  away_team_score: true,
  result: true,
  resultDetails: true,
  notes: true,
});

export const insertTournamentStandingsSchema = createInsertSchema(tournamentStandings).pick({
  tournamentId: true,
  teamId: true,
  group: true,
  played: true,
  won: true,
  lost: true,
  tied: true,
  no_result: true,
  points: true,
  netRunRate: true,
  forRuns: true,
  forOvers: true,
  againstRuns: true,
  againstOvers: true,
  position: true,
  qualified: true,
});

export const insertPlayerTournamentStatsSchema = createInsertSchema(playerTournamentStats).pick({
  tournamentId: true,
  userId: true,
  matches: true,
  runs: true,
  ballsFaced: true,
  fours: true,
  sixes: true,
  fifties: true,
  hundreds: true,
  highestScore: true,
  battingAverage: true,
  strikeRate: true,
  overs: true,
  wickets: true,
  runsConceded: true,
  maidens: true,
  fiveWickets: true,
  bowlingAverage: true,
  economyRate: true,
  catches: true,
  runOuts: true,
  stumpings: true,
});

export const insertTournamentStatisticsSchema = createInsertSchema(tournamentStatistics).pick({
  tournamentId: true,
  statCategory: true,
  userId: true,
  teamId: true,
  runs: true,
  ballsFaced: true,
  fours: true,
  sixes: true,
  highest: true,
  fifties: true,
  hundreds: true,
  strikeRate: true,
  average: true,
  wickets: true,
  overs: true,
  maidens: true,
  economy: true,
  best_bowling: true,
  catches: true,
  stumpings: true,
  runOuts: true,
});

// Types
export type InsertVenue = z.infer<typeof insertVenueSchema>;
export type Venue = typeof venues.$inferSelect;

export type InsertVenueAvailability = z.infer<typeof insertVenueAvailabilitySchema>;
export type VenueAvailability = typeof venueAvailability.$inferSelect;

export type InsertVenueBooking = z.infer<typeof insertVenueBookingSchema>;
export type VenueBooking = typeof venueBookings.$inferSelect;

export type InsertTournament = z.infer<typeof insertTournamentSchema>;
export type Tournament = typeof tournaments.$inferSelect;

export type InsertTournamentTeam = z.infer<typeof insertTournamentTeamSchema>;
export type TournamentTeam = typeof tournamentTeams.$inferSelect;

export type InsertTournamentMatch = z.infer<typeof insertTournamentMatchSchema>;
export type TournamentMatch = typeof tournamentMatches.$inferSelect;

export type InsertTournamentStandings = z.infer<typeof insertTournamentStandingsSchema>;
export type TournamentStandings = typeof tournamentStandings.$inferSelect;

export type InsertPlayerTournamentStats = z.infer<typeof insertPlayerTournamentStatsSchema>;
export type PlayerTournamentStats = typeof playerTournamentStats.$inferSelect;

export type InsertTournamentStatistics = z.infer<typeof insertTournamentStatisticsSchema>;
export type TournamentStatistics = typeof tournamentStatistics.$inferSelect;

// Form Schemas
export const createVenueSchema = insertVenueSchema.extend({
  facilities: z.string().array().optional(),
  capacity: z.coerce.number().int().positive().optional(),
  pricePerHour: z.coerce.number().positive().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
});

export const createVenueAvailabilitySchema = insertVenueAvailabilitySchema.extend({
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format. Use HH:MM in 24-hour format"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format. Use HH:MM in 24-hour format"),
});

export const createVenueBookingSchema = insertVenueBookingSchema.extend({
  date: z.coerce.date(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format. Use HH:MM in 24-hour format"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format. Use HH:MM in 24-hour format"),
  totalAmount: z.coerce.number().nonnegative(),
  paidAmount: z.coerce.number().nonnegative().optional(),
  status: z.enum(["pending", "confirmed", "cancelled", "completed"]),
  paymentStatus: z.enum(["unpaid", "partial", "paid"]),
});

export const createTournamentSchema = insertTournamentSchema.extend({
  shortName: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  registrationDeadline: z.coerce.date().optional(),
  maxTeams: z.coerce.number().int().positive().optional(),
  entryFee: z.coerce.number().nonnegative().optional(),
  prizePool: z.coerce.number().nonnegative().optional(),
  format: z.enum(["T20", "ODI", "Test", "mixed", "other"]),
  tournamentType: z.enum(["league", "knockout", "group_stage_knockout", "custom"]),
  status: z.enum(["upcoming", "ongoing", "completed", "cancelled"]),
  isPublic: z.boolean().default(true),
  pointsPerWin: z.coerce.number().int().nonnegative().default(2),
  pointsPerLoss: z.coerce.number().int().nonnegative().default(0),
  pointsPerTie: z.coerce.number().int().nonnegative().default(1),
  pointsPerNoResult: z.coerce.number().int().nonnegative().default(1),
  qualificationRules: z.string().optional(),
  tiebreakers: z.string().optional(),
  overs: z.coerce.number().int().positive().optional(),
});

export const createTournamentTeamSchema = insertTournamentTeamSchema.extend({
  registrationStatus: z.enum(["pending", "approved", "rejected"]),
  paymentStatus: z.enum(["unpaid", "partial", "paid"]),
  paidAmount: z.coerce.number().nonnegative().optional(),
});

export const createTournamentMatchSchema = insertTournamentMatchSchema.extend({
  scheduledDate: z.coerce.date().optional(),
  scheduledTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format. Use HH:MM in 24-hour format").optional(),
  status: z.enum(["scheduled", "live", "completed", "postponed", "cancelled"]),
  round: z.coerce.number().int().positive().optional(),
  matchNumber: z.coerce.number().int().positive().optional(),
  home_team_id: z.coerce.number().int().positive().optional(),
  away_team_id: z.coerce.number().int().positive().optional(),
  home_team_score: z.string().optional(),
  away_team_score: z.string().optional(),
  result: z.enum(["home_win", "away_win", "tie", "no_result", "abandoned"]).optional(),
  resultDetails: z.string().optional(),
});

export const createTournamentStandingsSchema = insertTournamentStandingsSchema.extend({
  played: z.coerce.number().int().nonnegative().default(0),
  won: z.coerce.number().int().nonnegative().default(0),
  lost: z.coerce.number().int().nonnegative().default(0),
  tied: z.coerce.number().int().nonnegative().default(0),
  no_result: z.coerce.number().int().nonnegative().default(0),
  points: z.coerce.number().int().nonnegative(),
  netRunRate: z.coerce.number().default(0),
  forRuns: z.coerce.number().int().nonnegative().default(0),
  forOvers: z.coerce.number().default(0),
  againstRuns: z.coerce.number().int().nonnegative().default(0),
  againstOvers: z.coerce.number().default(0),
  qualified: z.boolean().default(false),
});

export const createPlayerTournamentStatsSchema = insertPlayerTournamentStatsSchema.extend({
  matches: z.coerce.number().int().nonnegative().default(0),
  runs: z.coerce.number().int().nonnegative().default(0),
  ballsFaced: z.coerce.number().int().nonnegative().default(0),
  fours: z.coerce.number().int().nonnegative().default(0),
  sixes: z.coerce.number().int().nonnegative().default(0),
  fifties: z.coerce.number().int().nonnegative().default(0),
  hundreds: z.coerce.number().int().nonnegative().default(0),
  highestScore: z.coerce.number().int().nonnegative().default(0),
  battingAverage: z.coerce.number().default(0),
  strikeRate: z.coerce.number().default(0),
  // Bowling stats
  overs: z.coerce.number().default(0),
  wickets: z.coerce.number().int().nonnegative().default(0),
  runsConceded: z.coerce.number().int().nonnegative().default(0),
  maidens: z.coerce.number().int().nonnegative().default(0),
  fiveWickets: z.coerce.number().int().nonnegative().default(0),
  bowlingAverage: z.coerce.number().default(0),
  economyRate: z.coerce.number().default(0),
  // Fielding stats
  catches: z.coerce.number().int().nonnegative().default(0),
  runOuts: z.coerce.number().int().nonnegative().default(0),
  stumpings: z.coerce.number().int().nonnegative().default(0),
});

export const createTournamentStatisticsSchema = insertTournamentStatisticsSchema.extend({
  statCategory: z.enum(["batting", "bowling", "fielding", "allround"]),
  runs: z.coerce.number().int().nonnegative().default(0),
  ballsFaced: z.coerce.number().int().nonnegative().default(0),
  fours: z.coerce.number().int().nonnegative().default(0),
  sixes: z.coerce.number().int().nonnegative().default(0),
  highest: z.coerce.number().int().nonnegative().default(0),
  fifties: z.coerce.number().int().nonnegative().default(0),
  hundreds: z.coerce.number().int().nonnegative().default(0),
  strikeRate: z.coerce.number().default(0),
  average: z.coerce.number().default(0),
  wickets: z.coerce.number().int().nonnegative().default(0),
  overs: z.coerce.number().default(0),
  maidens: z.coerce.number().int().nonnegative().default(0),
  economy: z.coerce.number().default(0),
  best_bowling: z.string().optional(),
  catches: z.coerce.number().int().nonnegative().default(0),
  stumpings: z.coerce.number().int().nonnegative().default(0),
  runOuts: z.coerce.number().int().nonnegative().default(0),
});

// Types for venue management and tournament forms
export type CreateVenueFormData = z.infer<typeof createVenueSchema>;
export type CreateVenueAvailabilityFormData = z.infer<typeof createVenueAvailabilitySchema>;
export type CreateVenueBookingFormData = z.infer<typeof createVenueBookingSchema>;
export type CreateTournamentFormData = z.infer<typeof createTournamentSchema>;
export type CreateTournamentTeamFormData = z.infer<typeof createTournamentTeamSchema>;
export type CreateTournamentMatchFormData = z.infer<typeof createTournamentMatchSchema>;
export type CreateTournamentStandingsFormData = z.infer<typeof createTournamentStandingsSchema>;
export type CreatePlayerTournamentStatsFormData = z.infer<typeof createPlayerTournamentStatsSchema>;
export type CreateTournamentStatisticsFormData = z.infer<typeof createTournamentStatisticsSchema>;

// Types for content categorization and tagging forms
export type CreateTagFormData = z.infer<typeof createTagSchema>;
export type CreateContentCategoryFormData = z.infer<typeof createContentCategorySchema>;
export type CreateUserInterestFormData = z.infer<typeof createUserInterestSchema>;
export type CreateContentEngagementFormData = z.infer<typeof createContentEngagementSchema>;