import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
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
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  content: text("content"),
  imageUrl: text("image_url"),
  location: text("location"),
  category: text("category"), // E.g., "match_discussion", "player_highlight", "news", "opinion", "meme"
  matchId: text("match_id"), // Reference to a cricket match (could be an external API ID)
  teamId: text("team_id"), // Reference to a cricket team (could be an external API ID)
  playerId: text("player_id"), // Reference to a cricket player (could be an external API ID)
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
  read: boolean("read").default(false).notNull(),
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
});

export const insertPostSchema = createInsertSchema(posts).pick({
  userId: true,
  content: true,
  imageUrl: true,
  location: true,
  category: true,
  matchId: true,
  teamId: true,
  playerId: true,
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

export const insertConversationSchema = createInsertSchema(conversations).pick({
  user1Id: true,
  user2Id: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  conversationId: true,
  senderId: true,
  content: true,
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

export const createPostSchema = insertPostSchema.omit({ userId: true }).extend({
  content: z.string().max(500, "Caption must be less than 500 characters"),
  imageUrl: z.string().optional(),
  location: z.string().optional(),
  category: z.enum([
    "match_discussion", 
    "player_highlight", 
    "team_news", 
    "opinion", 
    "meme", 
    "highlights"
  ]).optional(),
  matchId: z.string().optional(),
  teamId: z.string().optional(),
  playerId: z.string().optional(),
});

export type CreatePostFormData = z.infer<typeof createPostSchema>;
