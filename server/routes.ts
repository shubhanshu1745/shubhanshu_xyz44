import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword, isAuthenticated } from "./auth";
import { z } from "zod";
import * as CoachingService from "./services/coaching";
import * as HighlightService from "./services/highlights";
import * as StoryFiltersService from "./services/story-filters";
import { 
  insertCommentSchema, 
  insertPostSchema, 
  insertFollowSchema,
  insertBlockedUserSchema,
  insertConversationSchema,
  insertMessageSchema,
  insertStorySchema,
  insertPlayerStatsSchema,
  insertPlayerMatchSchema,
  createPlayerMatchSchema,
  insertPlayerMatchPerformanceSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  insertMatchSchema,
  insertTeamSchema,
  insertMatchPlayerSchema,
  insertBallByBallSchema,
  insertTagSchema,
  insertPostTagSchema,
  insertContentCategorySchema,
  insertUserInterestSchema,
  insertContentEngagementSchema,
  // Poll schemas
  createInsertPollSchema,
  createInsertPollOptionSchema,
  createInsertPollVoteSchema
} from "@shared/schema";
import { EmailService } from "./services/email-service";
import { CricketAPIClient } from "./services/cricket-api-client";
import cricketDataService from "./services/cricket-data";
import { Server as SocketServer } from "socket.io";
import session from "express-session";
import multer from "multer";
import { saveFile, FileUploadResult } from "./services/file-upload";

// Setup multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Current user endpoint
  app.get("/api/user", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send password to client
      const { password, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ message: "Failed to fetch user data" });
    }
  });
  
  // Update current user
  app.patch("/api/user", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      const userData = req.body;
      
      // Validate and sanitize user data
      const allowedFields = ['fullName', 'bio', 'location', 'profileImage', 'website', 'username', 'email'];
      const sanitizedData: Partial<any> = {};
      
      allowedFields.forEach(field => {
        if (userData[field] !== undefined) {
          sanitizedData[field] = userData[field];
        }
      });
      
      if (Object.keys(sanitizedData).length === 0) {
        return res.status(400).json({ message: "No valid fields to update" });
      }
      
      // If username or email is being changed, check for uniqueness
      if (sanitizedData.username) {
        const existingUser = await storage.getUserByUsername(sanitizedData.username);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: "Username already taken" });
        }
      }
      
      if (sanitizedData.email) {
        const existingUser = await storage.getUserByEmail(sanitizedData.email);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: "Email already registered" });
        }
        
        // If email is changed, set emailVerified to false and send a new verification email
        sanitizedData.emailVerified = false;
      }
      
      const updatedUser = await storage.updateUser(userId, sanitizedData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Send verification email if email was changed
      if (sanitizedData.email) {
        await EmailService.sendVerificationEmail(sanitizedData.email, userId);
      }
      
      // Don't send password to client
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });
  
  // Update privacy settings
  app.patch("/api/user/privacy", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      const { privateAccount, activityStatus, tagSettings, mentionSettings } = req.body;
      
      // Validate the settings
      const privacySettings: any = {};
      
      if (privateAccount !== undefined) privacySettings.privateAccount = !!privateAccount;
      if (activityStatus !== undefined) privacySettings.activityStatus = !!activityStatus;
      if (tagSettings) privacySettings.tagSettings = tagSettings;
      if (mentionSettings) privacySettings.mentionSettings = mentionSettings;
      
      if (Object.keys(privacySettings).length === 0) {
        return res.status(400).json({ message: "No valid privacy settings to update" });
      }
      
      const updatedUser = await storage.updateUser(userId, privacySettings);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send password to client
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json({ message: "Privacy settings updated successfully", user: userWithoutPassword });
    } catch (error) {
      console.error("Error updating privacy settings:", error);
      res.status(500).json({ message: "Failed to update privacy settings" });
    }
  });
  
  // Update notification settings
  app.patch("/api/user/notifications", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      const { 
        postNotifications, 
        commentNotifications, 
        followNotifications, 
        messageNotifications,
        cricketUpdates
      } = req.body;
      
      // Validate the settings
      const notificationSettings: any = {};
      
      if (postNotifications !== undefined) notificationSettings.postNotifications = !!postNotifications;
      if (commentNotifications !== undefined) notificationSettings.commentNotifications = !!commentNotifications;
      if (followNotifications !== undefined) notificationSettings.followNotifications = !!followNotifications;
      if (messageNotifications !== undefined) notificationSettings.messageNotifications = !!messageNotifications;
      if (cricketUpdates !== undefined) notificationSettings.cricketUpdates = !!cricketUpdates;
      
      if (Object.keys(notificationSettings).length === 0) {
        return res.status(400).json({ message: "No valid notification settings to update" });
      }
      
      const updatedUser = await storage.updateUser(userId, notificationSettings);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send password to client
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json({ message: "Notification settings updated successfully", user: userWithoutPassword });
    } catch (error) {
      console.error("Error updating notification settings:", error);
      res.status(500).json({ message: "Failed to update notification settings" });
    }
  });
  
  // Update language settings
  app.patch("/api/user/language", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      const { language } = req.body;
      
      // Validate the language setting
      if (!language) {
        return res.status(400).json({ message: "Language is required" });
      }
      
      // For this demo, we'll simulate storing language preference, but not actually
      // update the database since the schema doesn't have this field
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send password to client
      const { password, ...userWithoutPassword } = user;
      
      res.json({ 
        message: "Language setting updated successfully", 
        user: {
          ...userWithoutPassword,
          language // Add the language preference in the response
        }
      });
    } catch (error) {
      console.error("Error updating language setting:", error);
      res.status(500).json({ message: "Failed to update language setting" });
    }
  });
  
  // Change password
  app.post("/api/change-password", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      const { oldPassword, newPassword } = req.body;
      
      // Validate the request
      if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: "Old password and new password are required" });
      }
      
      // Get the user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Verify old password
      const isPasswordValid = await require('bcrypt').compare(oldPassword, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // Hash and update new password
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUser(userId, { password: hashedPassword });
      
      res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });
  
  // Email verification and password reset endpoints
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);
      const user = await storage.getUserByEmail(email);
      
      if (user) {
        // Send password reset email
        await EmailService.sendPasswordResetEmail(email, user.id);
      }
      
      // Always return success even if email doesn't exist for security reasons
      res.status(200).json({ 
        message: "If an account with that email exists, we've sent a password reset link" 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Password reset error:", error);
      res.status(500).json({ message: "Failed to process request" });
    }
  });
  
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, password } = resetPasswordSchema.parse(req.body);
      
      // Verify token
      const userId = await EmailService.verifyToken(token, 'password_reset');
      if (!userId) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }
      
      // Get user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Hash new password and update user
      const hashedPassword = await hashPassword(password);
      await storage.updateUser(userId, { password: hashedPassword });
      
      // Delete token (consume it)
      await EmailService.consumeToken(token);
      
      res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });
  
  app.get("/api/verify-email", async (req, res) => {
    try {
      const token = req.query.token as string;
      if (!token) {
        return res.status(400).json({ message: "Token is required" });
      }
      
      // Verify token
      const userId = await EmailService.verifyToken(token, 'email_verification');
      if (!userId) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }
      
      // Update user's email verification status
      await storage.updateUser(userId, { emailVerified: true });
      
      // Delete token (consume it)
      await EmailService.consumeToken(token);
      
      // Log success in development
      console.log(`Email verified successfully for user ID: ${userId}`);
      
      // Redirect to frontend with success message
      const clientUrl = process.env.APP_URL || 'http://localhost:5000';
      res.redirect(`${clientUrl}?verified=true`);
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ message: "Failed to verify email" });
    }
  });
  
  app.post("/api/resend-verification", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.emailVerified) {
        return res.status(400).json({ message: "Email already verified" });
      }
      
      // Send verification email
      await EmailService.sendVerificationEmail(user.email, userId);
      
      res.status(200).json({ message: "Verification email sent" });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ message: "Failed to send verification email" });
    }
  });

  // File upload endpoints
  app.post("/api/upload/profile", upload.single("file"), async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Save the file to disk
      const uploadResult = await saveFile(req.file, "profiles");
      
      // Return the file URL to the client
      res.status(200).json(uploadResult);
    } catch (error) {
      console.error("Error uploading profile image:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });
  
  app.post("/api/upload/post", upload.single("file"), async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Save the file to disk
      const uploadResult = await saveFile(req.file, "posts");
      
      // Return the file URL to the client
      res.status(200).json(uploadResult);
    } catch (error) {
      console.error("Error uploading post image:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });
  
  app.post("/api/upload/story", upload.single("file"), async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Ensure upload directory exists
      const fs = require('fs');
      const path = require('path');
      const uploadDir = path.join(__dirname, '../public/uploads/stories');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      // Save the file to disk
      const uploadResult = await saveFile(req.file, "stories");
      
      // Return the file URL to the client
      res.status(200).json(uploadResult);
    } catch (error) {
      console.error("Error uploading story image:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });
  
  app.post("/api/upload/reel", upload.single("file"), async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Save the file to disk
      const uploadResult = await saveFile(req.file, "reels");
      
      // Return the file URL to the client
      res.status(200).json(uploadResult);
    } catch (error) {
      console.error("Error uploading reel video:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });
  
  app.post("/api/upload/thumbnail", upload.single("file"), async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Save the file to disk
      const uploadResult = await saveFile(req.file, "thumbnails");
      
      // Return the file URL to the client
      res.status(200).json(uploadResult);
    } catch (error) {
      console.error("Error uploading thumbnail image:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });
  
  // Posts endpoints
  app.get("/api/posts", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const posts = await storage.getFeed(userId, limit);
      
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.post("/api/posts", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      const postData = insertPostSchema.parse({ ...req.body, userId });
      
      const post = await storage.createPost(postData);
      res.status(201).json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.get("/api/posts/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const postId = parseInt(req.params.id);
      const post = await storage.getPost(postId);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      const user = await storage.getUser(post.userId);
      const likes = await storage.getLikesForPost(postId);
      const comments = await storage.getCommentsForPost(postId);
      const hasLiked = !!(await storage.getLike(req.user.id, postId));
      
      res.json({
        ...post,
        user,
        likeCount: likes.length,
        commentCount: comments.length,
        hasLiked
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch post" });
    }
  });

  app.delete("/api/posts/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const postId = parseInt(req.params.id);
      const post = await storage.getPost(postId);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      if (post.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.deletePost(postId);
      res.status(200).json({ message: "Post deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  // Suggested users
  app.get("/api/users/suggested", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      
      const suggestedUsers = await storage.getSuggestedUsers(userId, limit);
      
      // Remove passwords from response
      const safeUsers = suggestedUsers.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch suggested users" });
    }
  });
  
  // Search
  app.get("/api/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      // Search users
      const users = await storage.searchUsers(query, limit);
      const safeUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      // In a real app, we would also search for posts, hashtags, etc.
      // For now, we'll just return users
      
      res.json({
        users: safeUsers,
        // posts: [],
        // hashtags: []
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to search" });
    }
  });
  
  // User profile endpoints
  app.get("/api/users/:username", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const username = req.params.username;
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const posts = await storage.getUserPosts(user.id);
      const followers = await storage.getFollowers(user.id);
      const following = await storage.getFollowing(user.id);
      const isFollowing = await storage.isFollowing(req.user.id, user.id);
      const isBlocked = await storage.isBlocked(req.user.id, user.id);
      
      // Don't send password to client
      const { password, ...userWithoutPassword } = user;
      
      res.json({
        ...userWithoutPassword,
        postCount: posts.length,
        followerCount: followers.length,
        followingCount: following.length,
        isFollowing,
        isBlocked
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  app.get("/api/users/:username/posts", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const username = req.params.username;
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const posts = await storage.getUserPosts(user.id);
      
      // Enrich posts with additional data
      const enrichedPosts = await Promise.all(posts.map(async post => {
        const likes = await storage.getLikesForPost(post.id);
        const comments = await storage.getCommentsForPost(post.id);
        const hasLiked = !!(await storage.getLike(req.user.id, post.id));
        
        return {
          ...post,
          user,
          likeCount: likes.length,
          commentCount: comments.length,
          hasLiked
        };
      }));
      
      res.json(enrichedPosts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user posts" });
    }
  });

  // Followers and Following endpoints
  app.get("/api/users/:username/followers", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const username = req.params.username;
      const targetUser = await storage.getUserByUsername(username);
      
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const currentUserId = req.user.id;
      const followers = await storage.getFollowers(targetUser.id);
      
      // Enrich followers with isFollowing property
      const enrichedFollowers = await Promise.all(
        followers.map(async follower => {
          // Don't include passwords
          const { password, ...followerWithoutPassword } = follower;
          
          // Check if the current user is following this follower
          const isFollowing = await storage.isFollowing(currentUserId, follower.id);
          
          return {
            ...followerWithoutPassword,
            isFollowing
          };
        })
      );
      
      res.json(enrichedFollowers);
    } catch (error) {
      console.error("Error fetching followers:", error);
      res.status(500).json({ message: "Failed to fetch followers" });
    }
  });
  
  app.get("/api/users/:username/following", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const username = req.params.username;
      const targetUser = await storage.getUserByUsername(username);
      
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const currentUserId = req.user.id;
      const following = await storage.getFollowing(targetUser.id);
      
      // Enrich following users with isFollowing property
      const enrichedFollowing = await Promise.all(
        following.map(async followedUser => {
          // Don't include passwords
          const { password, ...userWithoutPassword } = followedUser;
          
          // The current user is always following users in this list if it's the current user's list
          // Otherwise, check if the current user is following each user
          const isFollowing = targetUser.id === currentUserId ? 
            true : 
            await storage.isFollowing(currentUserId, followedUser.id);
          
          return {
            ...userWithoutPassword,
            isFollowing
          };
        })
      );
      
      res.json(enrichedFollowing);
    } catch (error) {
      console.error("Error fetching following:", error);
      res.status(500).json({ message: "Failed to fetch following users" });
    }
  });

  // Like endpoints
  app.post("/api/posts/:id/like", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const postId = parseInt(req.params.id);
      const userId = req.user.id;
      
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      const like = await storage.likePost({ userId, postId });
      res.status(201).json(like);
    } catch (error) {
      res.status(500).json({ message: "Failed to like post" });
    }
  });

  app.delete("/api/posts/:id/like", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const postId = parseInt(req.params.id);
      const userId = req.user.id;
      
      const result = await storage.unlikePost(userId, postId);
      if (!result) {
        return res.status(404).json({ message: "Like not found" });
      }
      
      res.status(200).json({ message: "Post unliked successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to unlike post" });
    }
  });

  // Comment endpoints
  app.get("/api/posts/:id/comments", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const postId = parseInt(req.params.id);
      
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      const comments = await storage.getCommentsForPost(postId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/posts/:id/comments", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const postId = parseInt(req.params.id);
      const userId = req.user.id;
      
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      const commentData = insertCommentSchema.parse({
        ...req.body,
        userId,
        postId
      });
      
      const comment = await storage.createComment(commentData);
      const user = await storage.getUser(userId);
      
      res.status(201).json({ ...comment, user });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Poll endpoints
  app.get("/api/polls", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const type = req.query.type as string | undefined;
      
      const polls = await storage.getPolls(limit, type);
      res.json(polls);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch polls" });
    }
  });

  app.post("/api/polls", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      
      const pollData = createInsertPollSchema.parse({
        ...req.body,
        userId
      });
      
      const poll = await storage.createPoll(pollData);
      
      // Create options if provided
      if (req.body.options && Array.isArray(req.body.options)) {
        for (const optionText of req.body.options) {
          await storage.createPollOption({
            pollId: poll.id,
            option: optionText
          });
        }
      }
      
      const createdPoll = await storage.getPoll(poll.id);
      res.status(201).json(createdPoll);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create poll" });
    }
  });

  app.get("/api/polls/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const pollId = parseInt(req.params.id);
      const poll = await storage.getPoll(pollId);
      
      if (!poll) {
        return res.status(404).json({ message: "Poll not found" });
      }
      
      res.json(poll);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch poll" });
    }
  });

  app.get("/api/polls/:id/results", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const pollId = parseInt(req.params.id);
      const poll = await storage.getPoll(pollId);
      
      if (!poll) {
        return res.status(404).json({ message: "Poll not found" });
      }
      
      const results = await storage.getPollResults(pollId);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch poll results" });
    }
  });

  app.get("/api/users/:id/polls", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = parseInt(req.params.id);
      const polls = await storage.getUserPolls(userId);
      
      res.json(polls);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user polls" });
    }
  });

  app.post("/api/polls/:id/vote", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const pollId = parseInt(req.params.id);
      const userId = req.user.id;
      const { optionId } = req.body;
      
      if (!optionId) {
        return res.status(400).json({ message: "Option ID is required" });
      }
      
      const poll = await storage.getPoll(pollId);
      if (!poll) {
        return res.status(404).json({ message: "Poll not found" });
      }
      
      if (!poll.isActive) {
        return res.status(400).json({ message: "Poll is no longer active" });
      }
      
      if (poll.endTime && new Date(poll.endTime) < new Date()) {
        return res.status(400).json({ message: "Poll has ended" });
      }
      
      const option = await storage.getPollOption(optionId);
      if (!option || option.pollId !== pollId) {
        return res.status(404).json({ message: "Option not found for this poll" });
      }
      
      const voteData = createInsertPollVoteSchema.parse({
        pollId,
        optionId,
        userId
      });
      
      const vote = await storage.createPollVote(voteData);
      res.status(201).json(vote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to vote on poll" });
    }
  });

  app.delete("/api/polls/:id/vote", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const pollId = parseInt(req.params.id);
      const userId = req.user.id;
      
      const poll = await storage.getPoll(pollId);
      if (!poll) {
        return res.status(404).json({ message: "Poll not found" });
      }
      
      if (!poll.isActive) {
        return res.status(400).json({ message: "Poll is no longer active" });
      }
      
      const success = await storage.deletePollVote(userId, pollId);
      if (!success) {
        return res.status(404).json({ message: "Vote not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove vote" });
    }
  });

  app.get("/api/polls/:id/user-vote", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const pollId = parseInt(req.params.id);
      const userId = req.user.id;
      
      const vote = await storage.getUserVote(userId, pollId);
      if (!vote) {
        return res.status(404).json({ message: "No vote found" });
      }
      
      res.json(vote);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user vote" });
    }
  });

  // Poll option endpoints
  app.post("/api/polls/:id/options", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const pollId = parseInt(req.params.id);
      const userId = req.user.id;
      
      const poll = await storage.getPoll(pollId);
      if (!poll) {
        return res.status(404).json({ message: "Poll not found" });
      }
      
      // Only poll creator can add options
      if (poll.userId !== userId) {
        return res.status(403).json({ message: "Only poll creator can add options" });
      }
      
      const optionData = createInsertPollOptionSchema.parse({
        ...req.body,
        pollId
      });
      
      const option = await storage.createPollOption(optionData);
      res.status(201).json(option);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create poll option" });
    }
  });

  app.delete("/api/polls/options/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const optionId = parseInt(req.params.id);
      const userId = req.user.id;
      
      const option = await storage.getPollOption(optionId);
      if (!option) {
        return res.status(404).json({ message: "Option not found" });
      }
      
      const poll = await storage.getPoll(option.pollId);
      if (!poll) {
        return res.status(404).json({ message: "Poll not found" });
      }
      
      // Only poll creator can delete options
      if (poll.userId !== userId) {
        return res.status(403).json({ message: "Only poll creator can delete options" });
      }
      
      // Don't allow deleting if votes exist for this option
      const votes = await storage.getPollVotes(poll.id);
      if (votes.some(vote => vote.optionId === optionId)) {
        return res.status(400).json({ message: "Cannot delete option with existing votes" });
      }
      
      const success = await storage.deletePollOption(optionId);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete option" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete poll option" });
    }
  });

  // Follow endpoints
  app.post("/api/users/:username/follow", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const followerId = req.user.id;
      const username = req.params.username;
      
      const userToFollow = await storage.getUserByUsername(username);
      if (!userToFollow) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (followerId === userToFollow.id) {
        return res.status(400).json({ message: "You cannot follow yourself" });
      }
      
      const followData = insertFollowSchema.parse({
        followerId,
        followingId: userToFollow.id
      });
      
      const follow = await storage.followUser(followData);
      res.status(201).json(follow);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to follow user" });
    }
  });

  app.delete("/api/users/:username/follow", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const followerId = req.user.id;
      const username = req.params.username;
      
      const userToUnfollow = await storage.getUserByUsername(username);
      if (!userToUnfollow) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const result = await storage.unfollowUser(followerId, userToUnfollow.id);
      if (!result) {
        return res.status(404).json({ message: "Follow relationship not found" });
      }
      
      res.status(200).json({ message: "User unfollowed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to unfollow user" });
    }
  });

  // Block/Unblock endpoints
  app.post("/api/users/:username/block", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const blockerId = req.user.id;
      const username = req.params.username;
      
      const userToBlock = await storage.getUserByUsername(username);
      if (!userToBlock) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (blockerId === userToBlock.id) {
        return res.status(400).json({ message: "You cannot block yourself" });
      }
      
      const blockData = insertBlockedUserSchema.parse({
        blockerId,
        blockedId: userToBlock.id
      });
      
      const block = await storage.blockUser(blockData);
      res.status(201).json({ message: "User blocked successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to block user" });
    }
  });

  app.delete("/api/users/:username/block", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const blockerId = req.user.id;
      const username = req.params.username;
      
      const userToUnblock = await storage.getUserByUsername(username);
      if (!userToUnblock) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const result = await storage.unblockUser(blockerId, userToUnblock.id);
      if (!result) {
        return res.status(404).json({ message: "Block relationship not found" });
      }
      
      res.status(200).json({ message: "User unblocked successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to unblock user" });
    }
  });
  
  app.get("/api/users/blocked", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      const blockedUsers = await storage.getBlockedUsers(userId);
      
      // Remove passwords from response
      const safeUsers = blockedUsers.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blocked users" });
    }
  });

  // Cricket Match endpoints
  app.get("/api/cricket/matches", (req, res) => {
    try {
      const status = req.query.status as string;
      
      if (status && ["live", "upcoming", "completed"].includes(status)) {
        return res.json(cricketDataService.getMatchesByStatus(status as any));
      }
      
      res.json(cricketDataService.getAllMatches());
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch matches" });
    }
  });

  app.get("/api/cricket/matches/recent", (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 3;
      res.json(cricketDataService.getRecentMatches(limit));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent matches" });
    }
  });

  app.get("/api/cricket/matches/:id", (req, res) => {
    try {
      const matchId = req.params.id;
      const match = cricketDataService.getMatchById(matchId);
      
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      
      res.json(match);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch match" });
    }
  });

  // Cricket Team endpoints
  app.get("/api/cricket/teams", (req, res) => {
    try {
      const type = req.query.type as string;
      const query = req.query.query as string;
      
      if (query) {
        return res.json(cricketDataService.searchTeams(query));
      }
      
      if (type && ["international", "franchise", "domestic"].includes(type)) {
        return res.json(cricketDataService.getTeamsByType(type as any));
      }
      
      res.json(cricketDataService.getAllTeams());
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  app.get("/api/cricket/teams/:id", (req, res) => {
    try {
      const teamId = req.params.id;
      const team = cricketDataService.getTeamById(teamId);
      
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      res.json(team);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch team" });
    }
  });
  
  // New advanced match management endpoints
  
  // Create a new match
  app.post("/api/matches", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      const matchData = insertMatchSchema.parse({
        ...req.body,
        createdBy: userId
      });
      
      const match = await storage.createMatch(matchData);
      res.status(201).json(match);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating match:", error);
      res.status(500).json({ message: "Failed to create match" });
    }
  });
  
  // Get match details with teams and players
  app.get("/api/matches/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const match = await storage.getMatchById(parseInt(id));
      
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      
      // Get teams and players
      if (match.team1Id && match.team2Id) {
        const team1 = await storage.getTeamById(match.team1Id);
        const team2 = await storage.getTeamById(match.team2Id);
        
        if (team1) {
          const team1Players = await storage.getMatchPlayersByTeam(match.id, match.team1Id);
          match.team1 = { ...team1, players: team1Players };
        }
        
        if (team2) {
          const team2Players = await storage.getMatchPlayersByTeam(match.id, match.team2Id);
          match.team2 = { ...team2, players: team2Players };
        }
      }
      
      res.json(match);
    } catch (error) {
      console.error("Error getting match details:", error);
      res.status(500).json({ message: "Failed to get match details" });
    }
  });
  
  // Update match details (toss, status, officials, etc.)
  app.patch("/api/matches/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { id } = req.params;
      const userId = req.user.id;
      
      // Get the match
      const match = await storage.getMatchById(parseInt(id));
      
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      
      // Only the creator can update the match
      if (match.createdBy !== userId) {
        return res.status(403).json({ message: "You don't have permission to update this match" });
      }
      
      // Allowable fields to update
      const allowedFields = [
        'status', 'tossWinner', 'tossDecision', 'tossTime', 
        'matchStartTime', 'matchEndTime', 'currentInnings', 
        'team1Score', 'team1Wickets', 'team1Overs',
        'team2Score', 'team2Wickets', 'team2Overs',
        'mainUmpireId', 'secondUmpireId', 'thirdUmpireId', 'matchRefereeId',
        'weatherConditions', 'pitchConditions', 'result', 'winner'
      ];
      
      // Filter the request body
      const updateData: Record<string, any> = {};
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });
      
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "No valid fields to update" });
      }
      
      const updatedMatch = await storage.updateMatch(parseInt(id), updateData);
      res.json(updatedMatch);
    } catch (error) {
      console.error("Error updating match:", error);
      res.status(500).json({ message: "Failed to update match" });
    }
  });
  
  // Create or update a team
  app.post("/api/teams", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      const teamData = insertTeamSchema.parse({
        ...req.body,
        createdBy: userId
      });
      
      const team = await storage.createTeam(teamData);
      res.status(201).json(team);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating team:", error);
      res.status(500).json({ message: "Failed to create team" });
    }
  });
  
  // Assign players to a match
  app.post("/api/matches/:matchId/players", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { matchId } = req.params;
      const { teamId, players } = req.body;
      
      if (!teamId || !players || !Array.isArray(players)) {
        return res.status(400).json({ message: "Team ID and players array are required" });
      }
      
      // Verify match exists and user has permission
      const match = await storage.getMatchById(parseInt(matchId));
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      
      if (match.createdBy !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to modify this match" });
      }
      
      // Add each player to the match
      const addedPlayers = [];
      for (const player of players) {
        const playerData = insertMatchPlayerSchema.parse({
          matchId: parseInt(matchId),
          teamId,
          userId: player.userId,
          isPlaying: player.isPlaying !== false, // Default to true
          isCaptain: player.isCaptain || false,
          isViceCaptain: player.isViceCaptain || false,
          isWicketkeeper: player.isWicketkeeper || false,
          battingPosition: player.battingPosition,
          bowlingPosition: player.bowlingPosition,
          playerMatchNotes: player.playerMatchNotes,
        });
        
        const addedPlayer = await storage.addMatchPlayer(playerData);
        addedPlayers.push(addedPlayer);
      }
      
      res.status(201).json(addedPlayers);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error adding match players:", error);
      res.status(500).json({ message: "Failed to add players to match" });
    }
  });
  
  // Record ball-by-ball data
  app.post("/api/matches/:matchId/balls", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { matchId } = req.params;
      
      // Verify match exists and user has permission
      const match = await storage.getMatchById(parseInt(matchId));
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      
      if (match.createdBy !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to modify this match" });
      }
      
      // Parse and validate ball data
      const ballData = insertBallByBallSchema.parse({
        ...req.body,
        matchId: parseInt(matchId)
      });
      
      // Add the ball record
      const ball = await storage.recordBallByBall(ballData);
      
      // Update match score based on the ball
      const updateData: Record<string, any> = {};
      const innings = ballData.innings;
      
      if (innings === 1) {
        // Update team1 score
        updateData.team1Score = match.team1Score + (ballData.runsScored || 0) + (ballData.extras || 0);
        
        // Update wickets if it's a wicket
        if (ballData.isWicket) {
          updateData.team1Wickets = match.team1Wickets + 1;
        }
        
        // Update overs
        const currentOvers = match.team1Overs || '0.0';
        const [whole, fraction] = currentOvers.split('.');
        let newWhole = parseInt(whole);
        let newFraction = parseInt(fraction || '0');
        
        // Only count legal deliveries for overs
        if (!ballData.extrasType || (ballData.extrasType !== 'wide' && ballData.extrasType !== 'no_ball')) {
          newFraction += 1;
          if (newFraction >= 6) {
            newWhole += 1;
            newFraction = 0;
          }
        }
        
        updateData.team1Overs = `${newWhole}.${newFraction}`;
      } else if (innings === 2) {
        // Update team2 score
        updateData.team2Score = match.team2Score + (ballData.runsScored || 0) + (ballData.extras || 0);
        
        // Update wickets if it's a wicket
        if (ballData.isWicket) {
          updateData.team2Wickets = match.team2Wickets + 1;
        }
        
        // Update overs
        const currentOvers = match.team2Overs || '0.0';
        const [whole, fraction] = currentOvers.split('.');
        let newWhole = parseInt(whole);
        let newFraction = parseInt(fraction || '0');
        
        // Only count legal deliveries for overs
        if (!ballData.extrasType || (ballData.extrasType !== 'wide' && ballData.extrasType !== 'no_ball')) {
          newFraction += 1;
          if (newFraction >= 6) {
            newWhole += 1;
            newFraction = 0;
          }
        }
        
        updateData.team2Overs = `${newWhole}.${newFraction}`;
      }
      
      // Check if match is completed
      if (innings === 2) {
        // Check if team2 has won
        if (match.team1Score && updateData.team2Score > match.team1Score) {
          updateData.status = 'completed';
          updateData.result = `${match.team2Id} won by ${10 - (updateData.team2Wickets || 0)} wickets`;
          updateData.winner = match.team2Id;
          updateData.matchEndTime = new Date();
        }
        
        // Check if all overs completed or all wickets fallen
        const [overs] = (updateData.team2Overs || match.team2Overs || '0.0').split('.');
        if (parseInt(overs) >= match.overs || (updateData.team2Wickets || match.team2Wickets) >= 10) {
          updateData.status = 'completed';
          
          if (match.team1Score && updateData.team2Score < match.team1Score) {
            updateData.result = `${match.team1Id} won by ${match.team1Score - (updateData.team2Score || 0)} runs`;
            updateData.winner = match.team1Id;
          } else if (match.team1Score && updateData.team2Score === match.team1Score) {
            updateData.result = 'Match tied';
          }
          
          updateData.matchEndTime = new Date();
        }
      } else if (innings === 1) {
        // Check if first innings is completed
        const [overs] = (updateData.team1Overs || match.team1Overs || '0.0').split('.');
        if (parseInt(overs) >= match.overs || (updateData.team1Wickets || match.team1Wickets) >= 10) {
          updateData.currentInnings = 2;
        }
      }
      
      // Update match with new scores and status
      if (Object.keys(updateData).length > 0) {
        await storage.updateMatch(parseInt(matchId), updateData);
      }
      
      res.status(201).json({
        ball,
        matchUpdate: updateData
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error recording ball:", error);
      res.status(500).json({ message: "Failed to record ball" });
    }
  });

  // Chat endpoints
  app.get("/api/conversations", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      const conversations = await storage.getUserConversations(userId);
      
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });
  
  app.post("/api/conversations", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      const { username } = req.body;
      
      if (!username) {
        return res.status(400).json({ message: "Username is required" });
      }
      
      const otherUser = await storage.getUserByUsername(username);
      if (!otherUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (userId === otherUser.id) {
        return res.status(400).json({ message: "Cannot create conversation with yourself" });
      }
      
      const conversationData = insertConversationSchema.parse({
        user1Id: userId,
        user2Id: otherUser.id
      });
      
      const conversation = await storage.createConversation(conversationData);
      
      // Get other user details to send back in response
      const { password, ...otherUserWithoutPassword } = otherUser;
      
      res.status(201).json({
        ...conversation,
        otherUser: otherUserWithoutPassword,
        lastMessage: null,
        unreadCount: 0
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });
  
  app.get("/api/conversations/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      const conversationId = parseInt(req.params.id);
      
      const conversation = await storage.getConversationById(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      // Check if user is part of this conversation
      if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Get the other user in the conversation
      const otherUserId = conversation.user1Id === userId ? conversation.user2Id : conversation.user1Id;
      const otherUser = await storage.getUser(otherUserId);
      
      if (!otherUser) {
        return res.status(404).json({ message: "Other user not found" });
      }
      
      const { password, ...otherUserWithoutPassword } = otherUser;
      
      // Get messages
      const messages = await storage.getConversationMessages(conversationId);
      
      // Mark messages as read
      await storage.markMessagesAsRead(conversationId, userId);
      
      res.json({
        conversation,
        otherUser: otherUserWithoutPassword,
        messages
      });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });
  
  // File upload for messages
  app.post("/api/upload/message", upload.single('file'), async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const result = await saveFile(req.file, 'uploads/messages');
      
      res.status(201).json(result);
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  app.post("/api/conversations/:id/messages", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      const conversationId = parseInt(req.params.id);
      
      const conversation = await storage.getConversationById(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      // Check if user is part of this conversation
      if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const messageData = insertMessageSchema.parse({
        ...req.body,
        conversationId,
        senderId: userId
      });
      
      const message = await storage.createMessage(messageData);
      const sender = await storage.getUser(userId);
      
      if (!sender) {
        return res.status(404).json({ message: "Sender not found" });
      }
      
      const { password, ...senderWithoutPassword } = sender;
      
      res.status(201).json({
        ...message,
        sender: senderWithoutPassword
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });
  
  app.post("/api/conversations/:id/read", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      const conversationId = parseInt(req.params.id);
      
      const conversation = await storage.getConversationById(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      // Check if user is part of this conversation
      if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const result = await storage.markMessagesAsRead(conversationId, userId);
      
      res.json({ success: result });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      res.status(500).json({ message: "Failed to mark messages as read" });
    }
  });
  
  // Message delete endpoint
  app.delete("/api/messages/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      const messageId = parseInt(req.params.id);
      
      if (isNaN(messageId)) {
        return res.status(400).json({ message: "Invalid message ID" });
      }
      
      const result = await storage.deleteMessage(messageId, userId);
      
      if (!result) {
        return res.status(404).json({ 
          message: "Message not found or you don't have permission to delete it" 
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({ message: "Failed to delete message" });
    }
  });
  
  // Reels endpoints
  app.get("/api/reels", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const reels = await storage.getReels(userId, limit);
      
      res.json(reels);
    } catch (error) {
      console.error("Error fetching reels:", error);
      res.status(500).json({ message: "Failed to fetch reels" });
    }
  });
  
  // Stories endpoints
  app.get("/api/stories", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      const stories = await storage.getStoriesForFeed(userId);
      
      res.json(stories);
    } catch (error) {
      console.error("Error fetching stories:", error);
      res.status(500).json({ message: "Failed to fetch stories" });
    }
  });
  
  app.post("/api/stories", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      const storyData = insertStorySchema.parse({ ...req.body, userId });
      
      const story = await storage.createStory(storyData);
      const user = await storage.getUser(userId);
      
      res.status(201).json({ ...story, user });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating story:", error);
      res.status(500).json({ message: "Failed to create story" });
    }
  });
  
  app.get("/api/users/:username/stories", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const username = req.params.username;
      const targetUser = await storage.getUserByUsername(username);
      
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Only return stories if the current user follows the target user
      // or if the target user is the current user
      if (targetUser.id !== req.user.id) {
        const isFollowing = await storage.isFollowing(req.user.id, targetUser.id);
        if (!isFollowing) {
          return res.status(403).json({ message: "You must follow this user to see their stories" });
        }
      }
      
      const stories = await storage.getUserStories(targetUser.id);
      
      // Add user info to stories
      const storiesWithUser = stories.map(story => ({
        ...story,
        user: {
          id: targetUser.id,
          username: targetUser.username,
          fullName: targetUser.fullName,
          profileImage: targetUser.profileImage
        }
      }));
      
      res.json(storiesWithUser);
    } catch (error) {
      console.error("Error fetching user stories:", error);
      res.status(500).json({ message: "Failed to fetch user stories" });
    }
  });
  
  // Player Stats endpoints
  app.get("/api/users/:username/player-stats", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const username = req.params.username;
      const targetUser = await storage.getUserByUsername(username);
      
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Only player accounts should have stats
      if (!targetUser.isPlayer) {
        // Allow non-player accounts too, simply for better UI experience
        // Just log a warning instead of returning an error
        console.log(`Warning: Fetching stats for non-player account: ${username}`);
      }
      
      const stats = await storage.getPlayerStats(targetUser.id);
      
      if (!stats) {
        // Create empty stats object for users that don't have stats yet
        console.log(`No stats found for user ${username}, returning empty stats`);
        return res.json({
          userId: targetUser.id,
          totalMatches: 0,
          totalRuns: 0,
          battingAverage: "0",
          totalWickets: 0,
          totalCatches: 0,
          totalSixes: 0,
          totalFours: 0,
          highestScore: 0,
          bestBowling: "0/0",
          // Extra fields for UI display
          innings: 0,
          notOuts: 0,
          ballsFaced: 0,
          oversBowled: "0",
          runsConceded: 0,
          maidens: 0,
          fifties: 0,
          hundreds: 0,
          totalRunOuts: 0
        });
      }
      
      console.log("Found player stats for user", username, ":", stats);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching player stats:", error);
      res.status(500).json({ message: "Failed to fetch player stats" });
    }
  });
  
  app.post("/api/player-stats", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || !user.isPlayer) {
        return res.status(403).json({ message: "Only player accounts can create stats" });
      }
      
      // Check if stats already exist for this user
      const existingStats = await storage.getPlayerStats(userId);
      if (existingStats) {
        return res.status(400).json({ message: "Player stats already exist for this user" });
      }
      
      const statsData = insertPlayerStatsSchema.parse({ ...req.body, userId });
      const stats = await storage.createPlayerStats(statsData);
      
      res.status(201).json(stats);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating player stats:", error);
      res.status(500).json({ message: "Failed to create player stats" });
    }
  });
  
  app.patch("/api/player-stats", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || !user.isPlayer) {
        return res.status(403).json({ message: "Only player accounts can update stats" });
      }
      
      // Ensure stats exist for this user
      const existingStats = await storage.getPlayerStats(userId);
      if (!existingStats) {
        return res.status(404).json({ message: "Player stats not found for this user" });
      }
      
      const updatedStats = await storage.updatePlayerStats(userId, req.body);
      
      if (!updatedStats) {
        return res.status(404).json({ message: "Failed to update player stats" });
      }
      
      res.json(updatedStats);
    } catch (error) {
      console.error("Error updating player stats:", error);
      res.status(500).json({ message: "Failed to update player stats" });
    }
  });
  
  // Player Match endpoints
  app.get("/api/users/:username/matches", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const username = req.params.username;
      const targetUser = await storage.getUserByUsername(username);
      
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Only player accounts should have matches
      if (!targetUser.isPlayer) {
        return res.json([]); // Return empty array instead of error for better UX
      }
      
      const matches = await storage.getUserMatches(targetUser.id);
      
      // Fetch performances for each match and add them to the match object
      const matchesWithPerformances = await Promise.all(matches.map(async (match) => {
        const performance = await storage.getPlayerMatchPerformance(targetUser.id, match.id);
        return {
          ...match,
          performance: performance || undefined
        };
      }));
      
      res.json(matchesWithPerformances);
    } catch (error) {
      console.error("Error fetching player matches:", error);
      res.status(500).json({ message: "Failed to fetch player matches" });
    }
  });
  
  // Add a new match for a user
  app.post("/api/users/:username/matches", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      const username = req.params.username;
      const user = await storage.getUserByUsername(username);
      
      // Check if this is the logged-in user
      if (!user || user.id !== userId) {
        return res.status(403).json({ message: "You can only add matches to your own account" });
      }
      
      // Make all users players for demo purposes
      const userData = { isPlayer: true };
      await storage.updateUser(userId, userData);
      
      // Use createPlayerMatchSchema to handle date conversion
      const matchData = createPlayerMatchSchema.parse({
        userId: user.id,
        matchName: `vs ${req.body.opponent}`,
        opponent: req.body.opponent,
        venue: req.body.venue,
        matchDate: req.body.matchDate,
        matchType: req.body.matchType,
        result: req.body.result || "In Progress"
      });
      
      const match = await storage.createPlayerMatch(matchData);
      res.status(201).json(match);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error:", JSON.stringify(error.errors));
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating match:", error);
      res.status(500).json({ message: "Failed to create match" });
    }
  });
  
  // Add performance for a specific match
  app.post("/api/users/:username/matches/:matchId/performance", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      const username = req.params.username;
      const matchId = parseInt(req.params.matchId);
      const user = await storage.getUserByUsername(username);
      
      // Check if this is the logged-in user
      if (!user || user.id !== userId) {
        return res.status(403).json({ message: "You can only add performance to your own matches" });
      }
      
      // Check if the match exists and belongs to the user
      const match = await storage.getPlayerMatch(matchId);
      if (!match || match.userId !== userId) {
        return res.status(404).json({ message: "Match not found or doesn't belong to you" });
      }
      
      // Create the performance
      console.log("Received performance data:", req.body);
      
      // Parse and validate fields from the request body
      const parseNumber = (value: any): number => {
        if (value === null || value === undefined || value === '') return 0;
        const parsed = Number(value);
        return isNaN(parsed) ? 0 : parsed;
      };
      
      // Ensure consistent user and match IDs
      // This handles cases where the client sent different IDs in the body than in the URL
      const performanceData = {
        // Always use the authenticated user ID and URL matchId
        userId: userId,
        matchId: matchId,
        // Use the request body for all other fields with proper type conversion
        runsScored: parseNumber(req.body.runsScored),
        ballsFaced: parseNumber(req.body.ballsFaced),
        fours: parseNumber(req.body.fours),
        sixes: parseNumber(req.body.sixes),
        battingStatus: req.body.battingStatus || "Not Out",
        // Special handling for overs bowled as a string in format "X.Y"
        oversBowled: req.body.oversBowled?.toString() || "0",
        runsConceded: parseNumber(req.body.runsConceded),
        wicketsTaken: parseNumber(req.body.wicketsTaken),
        maidens: parseNumber(req.body.maidens),
        catches: parseNumber(req.body.catches),
        runOuts: parseNumber(req.body.runOuts),
        stumpings: parseNumber(req.body.stumpings), 
        playerOfMatch: req.body.playerOfMatch === true,
        // Handle optional fields
        battingPosition: req.body.battingPosition ? parseNumber(req.body.battingPosition) : undefined,
        bowlingPosition: req.body.bowlingPosition ? parseNumber(req.body.bowlingPosition) : undefined,
        battingStyle: req.body.battingStyle || undefined,
        bowlingStyle: req.body.bowlingStyle || undefined,
        economyRate: req.body.economyRate ? parseNumber(req.body.economyRate) : undefined,
        strikeRate: req.body.strikeRate ? parseNumber(req.body.strikeRate) : undefined
      };
      
      const performance = await storage.createPlayerMatchPerformance(performanceData);
      
      // Update player stats with this new performance
      await updatePlayerStatsFromPerformance(userId, performanceData);
      
      res.status(201).json(performance);
    } catch (error) {
      console.error("Error adding performance:", error);
      res.status(500).json({ message: "Failed to add performance" });
    }
  });
  
  // Helper function to update player stats after a new performance
  async function updatePlayerStatsFromPerformance(userId: number, performance: any) {
    try {
      console.log("Updating player stats for user", userId, "with performance:", performance);
      
      // Get current stats
      const currentStats = await storage.getPlayerStats(userId);
      
      // Helper function to safely parse numbers from various formats
      const parseNumber = (value: any): number => {
        if (value === null || value === undefined || value === '') return 0;
        const parsed = Number(value);
        return isNaN(parsed) ? 0 : parsed;
      };
      
      // Make sure we have numbers for all relevant fields
      const runsScored = parseNumber(performance.runsScored);
      const ballsFaced = parseNumber(performance.ballsFaced);
      const fours = parseNumber(performance.fours);
      const sixes = parseNumber(performance.sixes);
      const wicketsTaken = parseNumber(performance.wicketsTaken);
      const runsConceded = parseNumber(performance.runsConceded);
      const catches = parseNumber(performance.catches);
      const runOuts = parseNumber(performance.runOuts);
      const maidens = parseNumber(performance.maidens);
      const stumpings = parseNumber(performance.stumpings);
      const isNotOut = performance.battingStatus === 'Not Out' || performance.notOut === true;
      
      // Calculate best bowling figures
      const bestBowlingNew = wicketsTaken > 0 ? `${wicketsTaken}/${runsConceded}` : "0/0";
      
      if (!currentStats) {
        // Create new stats if they don't exist
        const newStats = {
          userId: userId,
          position: null,
          battingStyle: null,
          bowlingStyle: null,
          totalMatches: 1,
          totalRuns: runsScored,
          battingAverage: isNotOut ? runsScored.toString() : runsScored.toString(), // Will be updated as more matches are played
          totalWickets: wicketsTaken,
          totalCatches: catches,
          totalRunOuts: runOuts,
          totalSixes: sixes,
          totalFours: fours,
          highestScore: runsScored,
          bestBowling: bestBowlingNew,
          // Extra fields for UI display
          innings: 1,
          notOuts: isNotOut ? 1 : 0,
          ballsFaced: ballsFaced,
          oversBowled: performance.oversBowled || "0",
          runsConceded: runsConceded,
          maidens: maidens,
          stumpings: stumpings
        };
        
        console.log("Creating new player stats:", newStats);
        await storage.createPlayerStats(newStats);
      } else {
        // Calculate innings (each match counts as one inning for now)
        const innings = (currentStats.innings || 0) + 1;
        const notOuts = (currentStats.notOuts || 0) + (isNotOut ? 1 : 0);
        const totalRuns = (currentStats.totalRuns || 0) + runsScored;
        
        // Calculate batting average (runs / (innings - not outs))
        const battingAverage = ((innings - notOuts) > 0)
          ? (totalRuns / (innings - notOuts)).toFixed(2).toString()
          : totalRuns.toString();
        
        // Calculate bowling average (runs conceded / wickets)
        const totalWickets = (currentStats.totalWickets || 0) + wicketsTaken;
        const totalRunsConceded = (currentStats.runsConceded || 0) + runsConceded;
        const bowlingAverage = (totalWickets > 0)
          ? (totalRunsConceded / totalWickets).toFixed(2).toString()
          : "0";
        
        // Determine best bowling (more wickets is better, or same wickets with fewer runs)
        let bestBowling = currentStats.bestBowling || "0/0";
        if (bestBowling === "0/0" && wicketsTaken > 0) {
          bestBowling = bestBowlingNew;
        } else if (wicketsTaken > 0) {
          const [currentWickets, currentRuns] = (currentStats.bestBowling || "0/0").split('/').map(Number);
          if (wicketsTaken > currentWickets || (wicketsTaken === currentWickets && runsConceded < currentRuns)) {
            bestBowling = bestBowlingNew;
          }
        }
        
        // Track if this is a fifty or century
        const fifties = (currentStats.fifties || 0) + (runsScored >= 50 && runsScored < 100 ? 1 : 0);
        const hundreds = (currentStats.hundreds || 0) + (runsScored >= 100 ? 1 : 0);
        
        // Update existing stats with all needed fields for UI
        const updatedStats = {
          totalMatches: (currentStats.totalMatches || 0) + 1,
          totalRuns: totalRuns,
          battingAverage: battingAverage,
          bowlingAverage: bowlingAverage,
          totalWickets: totalWickets,
          totalCatches: (currentStats.totalCatches || 0) + catches,
          totalRunOuts: (currentStats.totalRunOuts || 0) + runOuts,
          totalSixes: (currentStats.totalSixes || 0) + sixes,
          totalFours: (currentStats.totalFours || 0) + fours,
          highestScore: Math.max(currentStats.highestScore || 0, runsScored),
          bestBowling: bestBowling,
          // Additional fields for UI display
          innings: innings,
          notOuts: notOuts,
          ballsFaced: (currentStats.ballsFaced || 0) + ballsFaced,
          oversBowled: (parseFloat(currentStats.oversBowled || "0") + parseFloat(performance.oversBowled || "0")).toString(),
          runsConceded: totalRunsConceded,
          maidens: (currentStats.maidens || 0) + maidens,
          // Only include stumpings if it exists in the schema 
          // (for backward compatibility with existing accounts)
          ...(currentStats.stumpings !== undefined ? { stumpings: (currentStats.stumpings || 0) + stumpings } : {}),
          fifties: fifties,
          hundreds: hundreds
        };
        
        console.log("Updating player stats to:", updatedStats);
        await storage.updatePlayerStats(userId, updatedStats);
      }
    } catch (error) {
      console.error("Error updating player stats:", error);
      throw error; // Re-throw to allow caller to handle
    }
  }
  
  app.post("/api/player-matches", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Allow any authenticated user to create matches
      // Use createPlayerMatchSchema instead of insertPlayerMatchSchema to handle date conversion
      const matchData = createPlayerMatchSchema.parse({ ...req.body, userId });
      const match = await storage.createPlayerMatch(matchData);
      
      res.status(201).json(match);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error:", JSON.stringify(error.errors));
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating player match:", error);
      res.status(500).json({ message: "Failed to create player match" });
    }
  });
  
  app.get("/api/player-matches/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const matchId = parseInt(req.params.id);
      const match = await storage.getPlayerMatch(matchId);
      
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      
      res.json(match);
    } catch (error) {
      console.error("Error fetching player match:", error);
      res.status(500).json({ message: "Failed to fetch player match" });
    }
  });
  
  // Player Match Performance endpoints
  app.get("/api/player-matches/:id/performances", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const matchId = parseInt(req.params.id);
      const match = await storage.getPlayerMatch(matchId);
      
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      
      const performances = await storage.getMatchPerformances(matchId);
      
      res.json(performances);
    } catch (error) {
      console.error("Error fetching match performances:", error);
      res.status(500).json({ message: "Failed to fetch match performances" });
    }
  });
  
  app.post("/api/player-match-performances", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Make all users players for demo purposes
      if (!user.isPlayer) {
        await storage.updateUser(userId, { isPlayer: true });
      }
      
      const { matchId } = req.body;
      
      // Convert matchId to number and validate
      const matchIdNum = parseInt(matchId);
      if (isNaN(matchIdNum)) {
        return res.status(400).json({ message: "Invalid match ID" });
      }
      
      // Check if match exists
      const match = await storage.getPlayerMatch(matchIdNum);
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      
      // Check if performance for this match already exists
      const existingPerformance = await storage.getPlayerMatchPerformance(userId, matchIdNum);
      if (existingPerformance) {
        return res.status(400).json({ message: "Performance record already exists for this match" });
      }
      
      // Log the incoming performance data
      console.log("Received performance data:", req.body);
      
      // Create the performance record
      const performanceData = insertPlayerMatchPerformanceSchema.parse({ 
        ...req.body, 
        userId, 
        matchId: matchIdNum 
      });
      
      // Log performance data after validation
      console.log("Validated performance data:", performanceData);
      
      // Calculate additional analytics metrics with null safety
      const runsScored = performanceData.runsScored || 0;
      const ballsFaced = performanceData.ballsFaced || 0;
      const fours = performanceData.fours || 0;
      const sixes = performanceData.sixes || 0;
      const wicketsTaken = performanceData.wicketsTaken || 0;
      const runsConceded = performanceData.runsConceded || 0;
      const maidens = performanceData.maidens || 0;
      
      const strikeRate = ballsFaced > 0 
        ? (runsScored / ballsFaced * 100).toFixed(2) 
        : "0.00";
        
      // Parse overs bowled and calculate balls bowled
      let totalBallsBowled = 0;
      if (performanceData.oversBowled) {
        const [fullOvers, partialBalls] = performanceData.oversBowled.split('.').map(num => parseInt(num || '0'));
        totalBallsBowled = (fullOvers * 6) + (partialBalls || 0);
      }
      
      // Calculate economy rate (runs conceded per over)
      const economyRate = totalBallsBowled > 0 
        ? (runsConceded / (totalBallsBowled / 6)).toFixed(2) 
        : "0.00";
      
      // Calculate bowling strike rate (balls per wicket)
      const bowlingStrikeRate = wicketsTaken > 0 && totalBallsBowled > 0
        ? (totalBallsBowled / wicketsTaken).toFixed(2) 
        : "0.00";
        
      // Calculate match impact score (custom formula)
      const battingImpact = runsScored * 1 + 
                          fours * 1 + 
                          sixes * 2;
                          
      const bowlingImpact = wicketsTaken * 20 + 
                          maidens * 5;
                          
      const fieldingImpact = (performanceData.catches || 0) * 10 + 
                          (performanceData.runOuts || 0) * 15;
                          
      const matchImpactScore = battingImpact + bowlingImpact + fieldingImpact;
      
      const performance = await storage.createPlayerMatchPerformance(performanceData);
      
      // Update player stats with this new performance
      await updatePlayerStatsFromPerformance(userId, performanceData);
      
      // Return the created performance with analytics and a 201 Created status
      res.status(201).json({
        success: true,
        performance: {
          ...performance,
          analytics: {
            strikeRate,
            economyRate,
            bowlingStrikeRate,
            matchImpactScore,
            battingContribution: battingImpact,
            bowlingContribution: bowlingImpact,
            fieldingContribution: fieldingImpact
          }
        },
        message: "Performance saved and stats updated successfully"
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error:", error.errors);
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      console.error("Error creating match performance:", error);
      res.status(500).json({ message: "Failed to create match performance" });
    }
  });

  const httpServer = createServer(app);
  
  // Initialize Socket.IO server
  const io = new SocketServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  
  // Store online users
  const onlineUsers = new Map(); // userId -> socketId
  
  // Socket.IO connection handling
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    
    // Authenticate socket connection
    socket.on("authenticate", async (userId) => {
      // Store user's socket for real-time communication
      onlineUsers.set(parseInt(userId), socket.id);
      console.log(`User ${userId} authenticated with socket ${socket.id}`);
      
      // Emit user's online status to their followers
      try {
        const user = await storage.getUser(parseInt(userId));
        if (user) {
          const followers = await storage.getFollowers(user.id);
          followers.forEach((follower) => {
            const followerSocketId = onlineUsers.get(follower.id);
            if (followerSocketId) {
              io.to(followerSocketId).emit("user_online", { userId: user.id, username: user.username });
            }
          });
        }
      } catch (error) {
        console.error("Error handling socket authentication:", error);
      }
    });
    
    // Handle real-time messaging
    socket.on("send_message", async (messageData) => {
      try {
        const { conversationId, senderId, content, messageType = "text", mediaUrl } = messageData;
        
        // Validate required fields
        if (!conversationId || !senderId || !content) {
          return socket.emit("error", { message: "Missing required fields" });
        }
        
        // Create message in database
        const message = await storage.createMessage({
          conversationId: parseInt(conversationId),
          senderId: parseInt(senderId),
          content: content,
          messageType: messageType,
          mediaUrl: mediaUrl,
          read: false,
          createdAt: new Date()
        });
        
        // Get conversation to find receiver
        const conversation = await storage.getConversationById(parseInt(conversationId));
        if (!conversation) {
          return socket.emit("error", { message: "Conversation not found" });
        }
        
        // Determine the receiver ID
        const receiverId = conversation.user1Id === parseInt(senderId) 
          ? conversation.user2Id 
          : conversation.user1Id;
        
        // Get sender information for the response
        const sender = await storage.getUser(parseInt(senderId));
        if (!sender) {
          return socket.emit("error", { message: "Sender not found" });
        }
        
        // Prepare message with sender information
        const messageWithSender = {
          ...message,
          sender: {
            id: sender.id,
            username: sender.username,
            profileImage: sender.profileImage
          }
        };
        
        // Send to the message sender for instant feedback
        socket.emit("receive_message", messageWithSender);
        
        // Check if receiver is online and send message
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receive_message", messageWithSender);
        }
      } catch (error) {
        console.error("Error handling message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });
    
    // Handle typing indicators
    socket.on("typing", ({ conversationId, userId }) => {
      try {
        // Get conversation to find receiver
        storage.getConversationById(parseInt(conversationId))
          .then(conversation => {
            if (!conversation) return;
            
            // Determine the receiver ID
            const receiverId = conversation.user1Id === parseInt(userId) 
              ? conversation.user2Id 
              : conversation.user1Id;
            
            // Send typing indicator to receiver if online
            const receiverSocketId = onlineUsers.get(receiverId);
            if (receiverSocketId) {
              io.to(receiverSocketId).emit("user_typing", { 
                conversationId: parseInt(conversationId), 
                userId: parseInt(userId) 
              });
            }
          })
          .catch(error => {
            console.error("Error handling typing indicator:", error);
          });
      } catch (error) {
        console.error("Error in typing event:", error);
      }
    });
    
    // Handle read receipts
    socket.on("mark_read", async ({ conversationId, userId }) => {
      try {
        await storage.markMessagesAsRead(parseInt(conversationId), parseInt(userId));
        
        // Get conversation to find sender
        const conversation = await storage.getConversationById(parseInt(conversationId));
        if (!conversation) return;
        
        // Determine the sender ID (the other user in the conversation)
        const senderId = conversation.user1Id === parseInt(userId) 
          ? conversation.user2Id 
          : conversation.user1Id;
        
        // Notify sender that messages were read if they're online
        const senderSocketId = onlineUsers.get(senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit("messages_read", { 
            conversationId: parseInt(conversationId),
            userId: parseInt(userId)
          });
        }
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    });
    
    // Handle message deletion
    socket.on("delete_message", async ({ messageId, userId, conversationId }) => {
      try {
        // Delete the message
        const result = await storage.deleteMessage(parseInt(messageId), parseInt(userId));
        
        if (!result) {
          return socket.emit("error", { 
            message: "Failed to delete message. Message not found or you don't have permission" 
          });
        }
        
        // First notify the user who deleted the message (for immediate feedback)
        socket.emit("message_deleted", { messageId: parseInt(messageId) });
        
        // Get conversation to find the other user
        const conversation = await storage.getConversationById(parseInt(conversationId));
        if (!conversation) return;
        
        // Determine the other user's ID
        const otherUserId = conversation.user1Id === parseInt(userId) 
          ? conversation.user2Id 
          : conversation.user1Id;
        
        // Notify the other user that a message was deleted if they're online
        const otherUserSocketId = onlineUsers.get(otherUserId);
        if (otherUserSocketId) {
          io.to(otherUserSocketId).emit("message_deleted", { 
            messageId: parseInt(messageId)
          });
        }
      } catch (error) {
        console.error("Error deleting message:", error);
        socket.emit("error", { message: "Failed to delete message" });
      }
    });
    
    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
      
      // Find and remove the user from onlineUsers
      Array.from(onlineUsers.entries()).forEach(([userId, socketId]) => {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          
          // Notify followers that user is offline
          storage.getUser(userId)
            .then(user => {
              if (!user) return;
              
              return storage.getFollowers(user.id)
                .then(followers => {
                  followers.forEach(follower => {
                    const followerSocketId = onlineUsers.get(follower.id);
                    if (followerSocketId) {
                      io.to(followerSocketId).emit("user_offline", { 
                        userId: user.id, 
                        username: user.username 
                      });
                    }
                  });
                });
            })
            .catch(error => {
              console.error("Error handling disconnect notification:", error);
            });
        }
      });
    });
  });
  
  // Initialize new services
  // These are imported as modules with functions, not as classes
  const coachingService = CoachingService;
  const highlightService = HighlightService;
  const storyFiltersService = StoryFiltersService;

  // COACHING SERVICE ROUTES
  app.get("/api/coaching/tips", async (req, res) => {
    try {
      const { category, difficulty } = req.query;
      const tips = await coachingService.getTips(
        category as string, 
        difficulty as string
      );
      res.json(tips);
    } catch (error) {
      console.error("Error fetching coaching tips:", error);
      res.status(500).json({ message: "Failed to fetch coaching tips" });
    }
  });

  app.get("/api/coaching/drills", async (req, res) => {
    try {
      const { category, difficulty } = req.query;
      const drills = await coachingService.getDrills(
        category as string, 
        difficulty as string
      );
      res.json(drills);
    } catch (error) {
      console.error("Error fetching coaching drills:", error);
      res.status(500).json({ message: "Failed to fetch coaching drills" });
    }
  });

  app.post("/api/coaching/analyze", upload.single("video"), async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: "No video uploaded" });
      }

      const { techniqueType } = req.body;
      if (!techniqueType) {
        return res.status(400).json({ message: "Technique type is required" });
      }
      
      // Save the video file
      const uploadResult = await saveFile(req.file, "coaching-videos");
      
      // Analyze the technique
      const analysis = await coachingService.analyzeTechnique(
        uploadResult.url,
        techniqueType
      );
      
      res.json({
        videoUrl: uploadResult.url,
        analysis
      });
    } catch (error) {
      console.error("Error analyzing technique:", error);
      res.status(500).json({ message: "Failed to analyze technique" });
    }
  });

  app.post("/api/coaching/sessions", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      const { title, description, videoUrl, techniques, areas } = req.body;
      
      if (!title || !description || !videoUrl || !techniques || !areas) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const session = await coachingService.createCoachingSession(userId, {
        title,
        description,
        videoUrl,
        techniques,
        areas
      });
      
      res.status(201).json(session);
    } catch (error) {
      console.error("Error creating coaching session:", error);
      res.status(500).json({ message: "Failed to create coaching session" });
    }
  });

  app.get("/api/coaching/sessions", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      const sessions = await coachingService.getCoachingSessionsForUser(userId);
      
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching coaching sessions:", error);
      res.status(500).json({ message: "Failed to fetch coaching sessions" });
    }
  });

  // HIGHLIGHTS SERVICE ROUTES
  app.get("/api/highlights/match/:matchId", async (req, res) => {
    try {
      const matchId = parseInt(req.params.matchId, 10);
      if (isNaN(matchId)) {
        return res.status(400).json({ message: "Invalid match ID" });
      }
      
      const highlights = await highlightService.getMatchHighlights(matchId);
      
      if (!highlights) {
        return res.status(404).json({ message: "Highlights not found for this match" });
      }
      
      res.json(highlights);
    } catch (error) {
      console.error("Error fetching match highlights:", error);
      res.status(500).json({ message: "Failed to fetch match highlights" });
    }
  });

  app.get("/api/highlights/clips/:matchId", async (req, res) => {
    try {
      const matchId = parseInt(req.params.matchId, 10);
      if (isNaN(matchId)) {
        return res.status(400).json({ message: "Invalid match ID" });
      }
      
      const { clipType } = req.query;
      const clips = await highlightService.getHighlightClips(
        matchId, 
        clipType as string
      );
      
      res.json(clips);
    } catch (error) {
      console.error("Error fetching highlight clips:", error);
      res.status(500).json({ message: "Failed to fetch highlight clips" });
    }
  });

  app.get("/api/highlights/player/:playerId", async (req, res) => {
    try {
      const playerId = parseInt(req.params.playerId, 10);
      if (isNaN(playerId)) {
        return res.status(400).json({ message: "Invalid player ID" });
      }
      
      const clips = await highlightService.getHighlightClipsByPlayer(playerId);
      
      res.json(clips);
    } catch (error) {
      console.error("Error fetching player highlights:", error);
      res.status(500).json({ message: "Failed to fetch player highlights" });
    }
  });

  app.post("/api/highlights/generate/:matchId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const matchId = parseInt(req.params.matchId, 10);
      if (isNaN(matchId)) {
        return res.status(400).json({ message: "Invalid match ID" });
      }
      
      const { title, description } = req.body;
      
      if (!title || !description) {
        return res.status(400).json({ message: "Title and description are required" });
      }
      
      const highlightPackage = await highlightService.createHighlightPackage(
        matchId,
        title,
        description
      );
      
      res.status(201).json(highlightPackage);
    } catch (error) {
      console.error("Error generating highlights:", error);
      res.status(500).json({ message: "Failed to generate highlights" });
    }
  });

  app.post("/api/highlights/clips", upload.single("video"), async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: "No video uploaded" });
      }
      
      const { 
        matchId, 
        title, 
        description, 
        startTime, 
        endTime, 
        tags,
        clipType,
        playerId
      } = req.body;
      
      if (!matchId || !title || !description || !startTime || !endTime || !clipType) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Save the video file
      const videoUpload = await saveFile(req.file, "highlights");
      
      // Create a thumbnail (in a real app, this would generate a thumbnail from the video)
      const thumbnailUrl = `/assets/highlights/thumbnails/default.jpg`;
      
      const clip = await highlightService.addClipToHighlights(parseInt(matchId, 10), {
        title,
        description,
        videoUrl: videoUpload.url,
        thumbnailUrl,
        startTime: parseFloat(startTime),
        endTime: parseFloat(endTime),
        tags: tags ? JSON.parse(tags) : [],
        clipType,
        playerId: playerId ? parseInt(playerId, 10) : undefined
      });
      
      res.status(201).json(clip);
    } catch (error) {
      console.error("Error creating highlight clip:", error);
      res.status(500).json({ message: "Failed to create highlight clip" });
    }
  });

  // STORY FILTERS SERVICE ROUTES
  app.get("/api/stories/filters", async (req, res) => {
    try {
      const { category } = req.query;
      const filters = await storyFiltersService.getAllFilters(category as string);
      
      res.json(filters);
    } catch (error) {
      console.error("Error fetching story filters:", error);
      res.status(500).json({ message: "Failed to fetch story filters" });
    }
  });

  app.get("/api/stories/effects", async (req, res) => {
    try {
      const { category } = req.query;
      const effects = await storyFiltersService.getAllEffects(category as string);
      
      res.json(effects);
    } catch (error) {
      console.error("Error fetching story effects:", error);
      res.status(500).json({ message: "Failed to fetch story effects" });
    }
  });

  app.get("/api/stories/filters/team/:teamId", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId, 10);
      if (isNaN(teamId)) {
        return res.status(400).json({ message: "Invalid team ID" });
      }
      
      const filters = await storyFiltersService.getTeamFilters(teamId);
      
      res.json(filters);
    } catch (error) {
      console.error("Error fetching team filters:", error);
      res.status(500).json({ message: "Failed to fetch team filters" });
    }
  });

  app.get("/api/stories/live-scores", async (req, res) => {
    try {
      const { matchId } = req.query;
      const templates = await storyFiltersService.getLiveScoreTemplates(
        matchId ? parseInt(matchId as string, 10) : undefined
      );
      
      res.json(templates);
    } catch (error) {
      console.error("Error fetching live score templates:", error);
      res.status(500).json({ message: "Failed to fetch live score templates" });
    }
  });

  app.post("/api/stories/apply-filter", upload.single("image"), async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: "No image uploaded" });
      }
      
      const { filterId } = req.body;
      if (!filterId) {
        return res.status(400).json({ message: "Filter ID is required" });
      }
      
      // Save the original image
      const uploadResult = await saveFile(req.file, "story-uploads");
      
      // Apply the filter (in a real app, this would process the image)
      const filteredImage = await storyFiltersService.applyFilterToImage(
        uploadResult.url,
        filterId
      );
      
      // Track filter usage
      await storyFiltersService.incrementFilterUsage(filterId);
      
      res.json({
        originalUrl: uploadResult.url,
        filteredUrl: filteredImage
      });
    } catch (error) {
      console.error("Error applying filter:", error);
      res.status(500).json({ message: "Failed to apply filter" });
    }
  });

  app.post("/api/stories/custom-filter", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { 
        name, 
        description, 
        imageUrl, 
        previewUrl, 
        category,
        settings,
        teamId
      } = req.body;
      
      if (!name || !description || !imageUrl || !previewUrl || !category) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const filter = await storyFiltersService.createCustomFilter({
        name,
        description,
        imageUrl,
        previewUrl,
        category,
        settings,
        teamId: teamId ? parseInt(teamId, 10) : undefined
      });
      
      res.status(201).json(filter);
    } catch (error) {
      console.error("Error creating custom filter:", error);
      res.status(500).json({ message: "Failed to create custom filter" });
    }
  });

  // Coaching API routes
  // Get coaches 
  app.get("/api/coaching/coaches", CoachingService.getCoachesHandler);
  
  // Get coach by ID
  app.get("/api/coaching/coaches/:id", CoachingService.getCoachByIdHandler);
  
  // Apply to be a coach
  app.post("/api/coaching/apply", CoachingService.applyToBeCoach);
  
  // Get coach application status
  app.get("/api/coaching/application", CoachingService.getCoachApplication);
  
  // Book coaching session
  app.post("/api/coaching/sessions", CoachingService.bookSession);
  
  // Get user's coaching sessions
  app.get("/api/coaching/sessions", CoachingService.getSessions);
  
  // Get session by ID
  app.get("/api/coaching/sessions/:id", CoachingService.getSessionById);
  
  // Update session
  app.patch("/api/coaching/sessions/:id", CoachingService.updateSession);
  
  // Get user's training plans
  app.get("/api/coaching/training-plans", CoachingService.getTrainingPlansHandler);
  
  // Create training plan
  app.post("/api/coaching/training-plans", CoachingService.createTrainingPlanHandler);
  
  // Get analysis videos
  app.get("/api/coaching/analysis-videos", CoachingService.getAnalysisVideosHandler);
  
  // Analyze video
  app.post("/api/coaching/analyze-video", upload.single("video"), CoachingService.analyzeVideoHandler);

  // Content categorization and discovery system endpoints
  
  // Tags endpoints
  app.get("/api/tags", async (req, res) => {
    try {
      const type = req.query.type as string;
      const tags = await storage.getTags(type);
      res.json(tags);
    } catch (error) {
      console.error("Error fetching tags:", error);
      res.status(500).json({ message: "Failed to fetch tags" });
    }
  });
  
  app.get("/api/tags/:id", async (req, res) => {
    try {
      const tagId = parseInt(req.params.id);
      if (isNaN(tagId)) {
        return res.status(400).json({ message: "Invalid tag ID" });
      }
      
      const tag = await storage.getTagById(tagId);
      if (!tag) {
        return res.status(404).json({ message: "Tag not found" });
      }
      
      res.json(tag);
    } catch (error) {
      console.error("Error fetching tag:", error);
      res.status(500).json({ message: "Failed to fetch tag" });
    }
  });
  
  app.post("/api/tags", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Ensure only admins can create new tags (simplified for demo)
      // In a real app, you would have proper role-based access control
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      const tagData = insertTagSchema.parse(req.body);
      const tag = await storage.createTag(tagData);
      
      res.status(201).json(tag);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating tag:", error);
      res.status(500).json({ message: "Failed to create tag" });
    }
  });
  
  // Post tags endpoints
  app.get("/api/posts/:postId/tags", async (req, res) => {
    try {
      const postId = parseInt(req.params.postId);
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      const tags = await storage.getPostTags(postId);
      res.json(tags);
    } catch (error) {
      console.error("Error fetching post tags:", error);
      res.status(500).json({ message: "Failed to fetch post tags" });
    }
  });
  
  app.post("/api/posts/:postId/tags", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const postId = parseInt(req.params.postId);
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      
      // Verify post exists and user has permission
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Only post owner can add tags to their posts
      if (post.userId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to add tags to this post" });
      }
      
      const tagId = parseInt(req.body.tagId);
      if (isNaN(tagId)) {
        return res.status(400).json({ message: "Invalid tag ID" });
      }
      
      // Verify tag exists
      const tag = await storage.getTagById(tagId);
      if (!tag) {
        return res.status(404).json({ message: "Tag not found" });
      }
      
      const postTag = await storage.addPostTag({
        postId,
        tagId
      });
      
      res.status(201).json(postTag);
    } catch (error) {
      console.error("Error adding tag to post:", error);
      res.status(500).json({ message: "Failed to add tag to post" });
    }
  });
  
  app.delete("/api/posts/:postId/tags/:tagId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const postId = parseInt(req.params.postId);
      const tagId = parseInt(req.params.tagId);
      
      if (isNaN(postId) || isNaN(tagId)) {
        return res.status(400).json({ message: "Invalid post ID or tag ID" });
      }
      
      // Verify post exists and user has permission
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Only post owner can remove tags from their posts
      if (post.userId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to remove tags from this post" });
      }
      
      const success = await storage.removePostTag(postId, tagId);
      if (!success) {
        return res.status(404).json({ message: "Tag not found on post" });
      }
      
      res.status(200).json({ message: "Tag removed from post" });
    } catch (error) {
      console.error("Error removing tag from post:", error);
      res.status(500).json({ message: "Failed to remove tag from post" });
    }
  });
  
  // Content categories endpoints
  app.get("/api/content-categories", async (req, res) => {
    try {
      const categories = await storage.getContentCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching content categories:", error);
      res.status(500).json({ message: "Failed to fetch content categories" });
    }
  });
  
  app.post("/api/content-categories", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Admin only operation (simplified for demo)
      const categoryData = insertContentCategorySchema.parse(req.body);
      const category = await storage.createContentCategory(categoryData);
      
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating content category:", error);
      res.status(500).json({ message: "Failed to create content category" });
    }
  });
  
  // User interests endpoints
  app.get("/api/user/interests", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      const interests = await storage.getUserInterests(userId);
      
      res.json(interests);
    } catch (error) {
      console.error("Error fetching user interests:", error);
      res.status(500).json({ message: "Failed to fetch user interests" });
    }
  });
  
  app.post("/api/user/interests", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      const tagId = parseInt(req.body.tagId);
      const interactionScore = parseFloat(req.body.interactionScore) || 0;
      
      if (isNaN(tagId)) {
        return res.status(400).json({ message: "Invalid tag ID" });
      }
      
      // Verify tag exists
      const tag = await storage.getTagById(tagId);
      if (!tag) {
        return res.status(404).json({ message: "Tag not found" });
      }
      
      const interest = await storage.updateUserInterest({
        userId,
        tagId,
        interactionScore
      });
      
      res.status(200).json(interest);
    } catch (error) {
      console.error("Error updating user interest:", error);
      res.status(500).json({ message: "Failed to update user interest" });
    }
  });
  
  // Content engagement endpoints
  app.post("/api/content-engagement", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      const { postId, engagementType, duration } = req.body;
      
      if (!postId || !engagementType) {
        return res.status(400).json({ message: "Post ID and engagement type are required" });
      }
      
      // Validate engagement type
      const validEngagementTypes = ['view', 'like', 'comment', 'share', 'save', 'time_spent'];
      if (!validEngagementTypes.includes(engagementType)) {
        return res.status(400).json({ message: "Invalid engagement type" });
      }
      
      // Verify post exists
      const post = await storage.getPost(parseInt(postId));
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      const engagement = await storage.recordContentEngagement({
        userId,
        postId: parseInt(postId),
        engagementType,
        duration: duration ? parseInt(duration) : null
      });
      
      res.status(201).json(engagement);
    } catch (error) {
      console.error("Error recording content engagement:", error);
      res.status(500).json({ message: "Failed to record content engagement" });
    }
  });
  
  // Personalized feed endpoint
  app.get("/api/feed/personalized", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      
      const personalizedFeed = await storage.getPersonalizedFeed(userId, limit);
      
      res.json(personalizedFeed);
    } catch (error) {
      console.error("Error fetching personalized feed:", error);
      res.status(500).json({ message: "Failed to fetch personalized feed" });
    }
  });

  // Venue Management API Routes
  app.get("/api/venues", async (req, res) => {
    try {
      const query = req.query.q as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const venues = await storage.getVenues(query, limit);
      res.json(venues);
    } catch (error) {
      console.error("Error getting venues:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.get("/api/venues/nearby", async (req, res) => {
    try {
      const { lat, lng, radius } = req.query;
      
      if (!lat || !lng || !radius) {
        return res.status(400).json({ error: "Missing required parameters (lat, lng, radius)" });
      }
      
      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);
      const radiusKm = parseFloat(radius as string);
      
      if (isNaN(latitude) || isNaN(longitude) || isNaN(radiusKm)) {
        return res.status(400).json({ error: "Invalid parameters format" });
      }
      
      const venues = await storage.getNearbyVenues(latitude, longitude, radiusKm);
      res.json(venues);
    } catch (error) {
      console.error("Error getting nearby venues:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.get("/api/venues/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const venue = await storage.getVenue(id);
      
      if (!venue) {
        return res.status(404).json({ error: "Venue not found" });
      }
      
      res.json(venue);
    } catch (error) {
      console.error("Error getting venue:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.post("/api/venues", isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      const venueData = { ...req.body, createdBy: user.id };
      
      const newVenue = await storage.createVenue(venueData);
      res.status(201).json(newVenue);
    } catch (error) {
      console.error("Error creating venue:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.put("/api/venues/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = req.user;
      const venue = await storage.getVenue(id);
      
      if (!venue) {
        return res.status(404).json({ error: "Venue not found" });
      }
      
      // Check if user owns venue
      if (venue.createdBy !== user.id) {
        return res.status(403).json({ error: "Unauthorized to edit this venue" });
      }
      
      const updatedVenue = await storage.updateVenue(id, req.body);
      res.json(updatedVenue);
    } catch (error) {
      console.error("Error updating venue:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.delete("/api/venues/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = req.user;
      const venue = await storage.getVenue(id);
      
      if (!venue) {
        return res.status(404).json({ error: "Venue not found" });
      }
      
      // Check if user owns venue
      if (venue.createdBy !== user.id) {
        return res.status(403).json({ error: "Unauthorized to delete this venue" });
      }
      
      await storage.deleteVenue(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting venue:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.get("/api/venues/:id/availability", async (req, res) => {
    try {
      const venueId = parseInt(req.params.id);
      const availabilities = await storage.getVenueAvailabilities(venueId);
      res.json(availabilities);
    } catch (error) {
      console.error("Error getting venue availabilities:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.post("/api/venues/:id/availability", isAuthenticated, async (req, res) => {
    try {
      const venueId = parseInt(req.params.id);
      const user = req.user;
      const venue = await storage.getVenue(venueId);
      
      if (!venue) {
        return res.status(404).json({ error: "Venue not found" });
      }
      
      // Check if user owns venue
      if (venue.createdBy !== user.id) {
        return res.status(403).json({ error: "Unauthorized to manage this venue" });
      }
      
      const availabilityData = { ...req.body, venueId };
      const newAvailability = await storage.createVenueAvailability(availabilityData);
      res.status(201).json(newAvailability);
    } catch (error) {
      console.error("Error creating venue availability:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.get("/api/venues/:id/bookings", async (req, res) => {
    try {
      const venueId = parseInt(req.params.id);
      let startDate: Date | undefined;
      let endDate: Date | undefined;
      
      if (req.query.startDate) {
        startDate = new Date(req.query.startDate as string);
      }
      
      if (req.query.endDate) {
        endDate = new Date(req.query.endDate as string);
      }
      
      const bookings = await storage.getVenueBookings(venueId, startDate, endDate);
      res.json(bookings);
    } catch (error) {
      console.error("Error getting venue bookings:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.post("/api/venues/:id/bookings", isAuthenticated, async (req, res) => {
    try {
      const venueId = parseInt(req.params.id);
      const user = req.user;
      const venue = await storage.getVenue(venueId);
      
      if (!venue) {
        return res.status(404).json({ error: "Venue not found" });
      }
      
      const { date, startTime, endTime } = req.body;
      
      if (!date || !startTime || !endTime) {
        return res.status(400).json({ error: "Missing required booking details" });
      }
      
      const bookingDate = new Date(date);
      
      // Check if the venue is available
      const isAvailable = await storage.checkVenueAvailability(
        venueId, 
        bookingDate, 
        startTime, 
        endTime
      );
      
      if (!isAvailable) {
        return res.status(400).json({ error: "Venue is not available for the requested time" });
      }
      
      const bookingData = { 
        ...req.body, 
        venueId, 
        userId: user.id,
        date: bookingDate
      };
      
      const newBooking = await storage.createVenueBooking(bookingData);
      res.status(201).json(newBooking);
    } catch (error) {
      console.error("Error booking venue:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.get("/api/users/me/bookings", isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      const status = req.query.status as string;
      const now = new Date();
      
      const allBookings = await storage.getUserBookings(user.id);
      
      // Filter bookings based on status
      let bookings = [...allBookings];
      if (status === 'upcoming') {
        bookings = allBookings.filter(b => {
          const bookingDate = new Date(b.date);
          return bookingDate >= now && b.status !== 'cancelled';
        });
      } else if (status === 'past') {
        bookings = allBookings.filter(b => {
          const bookingDate = new Date(b.date);
          return bookingDate < now || b.status === 'completed';
        });
      }
      
      res.json(bookings);
    } catch (error) {
      console.error("Error getting user bookings:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.get("/api/users/me/venues", isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      const venues = await storage.getUserVenues(user.id);
      res.json(venues);
    } catch (error) {
      console.error("Error getting user venues:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.post("/api/bookings/:id/cancel", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = req.user;
      const booking = await storage.getVenueBooking(id);
      
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      
      // Check if user owns booking
      if (booking.userId !== user.id) {
        return res.status(403).json({ error: "Unauthorized to cancel this booking" });
      }
      
      await storage.cancelVenueBooking(id);
      res.status(200).json({ message: "Booking cancelled successfully" });
    } catch (error) {
      console.error("Error cancelling booking:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Tournament Management API Routes
  app.get("/api/tournaments", async (req, res) => {
    try {
      const query = req.query.q as string | undefined;
      const status = req.query.status as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const tournaments = await storage.getTournaments(query, status, limit);
      res.json(tournaments);
    } catch (error) {
      console.error("Error getting tournaments:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.get("/api/tournaments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const tournament = await storage.getTournament(id);
      
      if (!tournament) {
        return res.status(404).json({ error: "Tournament not found" });
      }
      
      res.json(tournament);
    } catch (error) {
      console.error("Error getting tournament:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.post("/api/tournaments", isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      const tournamentData = { ...req.body, organizerId: user.id };
      
      const newTournament = await storage.createTournament(tournamentData);
      res.status(201).json(newTournament);
    } catch (error) {
      console.error("Error creating tournament:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.put("/api/tournaments/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = req.user;
      const tournament = await storage.getTournament(id);
      
      if (!tournament) {
        return res.status(404).json({ error: "Tournament not found" });
      }
      
      // Check if user owns tournament
      if (tournament.organizerId !== user.id) {
        return res.status(403).json({ error: "Unauthorized to edit this tournament" });
      }
      
      const updatedTournament = await storage.updateTournament(id, req.body);
      res.json(updatedTournament);
    } catch (error) {
      console.error("Error updating tournament:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.delete("/api/tournaments/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = req.user;
      const tournament = await storage.getTournament(id);
      
      if (!tournament) {
        return res.status(404).json({ error: "Tournament not found" });
      }
      
      // Check if user owns tournament
      if (tournament.organizerId !== user.id) {
        return res.status(403).json({ error: "Unauthorized to delete this tournament" });
      }
      
      await storage.deleteTournament(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting tournament:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.get("/api/tournaments/:id/teams", async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.id);
      const teams = await storage.getTournamentTeams(tournamentId);
      res.json(teams);
    } catch (error) {
      console.error("Error getting tournament teams:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.post("/api/tournaments/:id/teams", isAuthenticated, async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.id);
      const teamId = req.body.teamId;
      
      if (!teamId) {
        return res.status(400).json({ error: "Missing team ID" });
      }
      
      const user = req.user;
      const tournament = await storage.getTournament(tournamentId);
      
      if (!tournament) {
        return res.status(404).json({ error: "Tournament not found" });
      }
      
      // Check if user owns tournament or team
      const team = await storage.getTeamById(teamId);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      
      if (tournament.organizerId !== user.id && team.ownerId !== user.id) {
        return res.status(403).json({ error: "Unauthorized to add team to this tournament" });
      }
      
      const teamData = { 
        tournamentId, 
        teamId,
        ...req.body
      };
      
      const tournamentTeam = await storage.addTeamToTournament(teamData);
      res.status(201).json(tournamentTeam);
    } catch (error) {
      console.error("Error adding team to tournament:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.get("/api/tournaments/:id/matches", async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.id);
      const matches = await storage.getTournamentMatches(tournamentId);
      res.json(matches);
    } catch (error) {
      console.error("Error getting tournament matches:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.post("/api/tournaments/:id/matches", isAuthenticated, async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.id);
      const matchId = req.body.matchId;
      
      if (!matchId) {
        return res.status(400).json({ error: "Missing match ID" });
      }
      
      const user = req.user;
      const tournament = await storage.getTournament(tournamentId);
      
      if (!tournament) {
        return res.status(404).json({ error: "Tournament not found" });
      }
      
      // Check if user owns tournament
      if (tournament.organizerId !== user.id) {
        return res.status(403).json({ error: "Unauthorized to add match to this tournament" });
      }
      
      const matchData = { 
        tournamentId, 
        matchId,
        ...req.body
      };
      
      const tournamentMatch = await storage.createTournamentMatch(matchData);
      res.status(201).json(tournamentMatch);
    } catch (error) {
      console.error("Error adding match to tournament:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Cricket API routes  
  // Initialize Cricket API client
  const cricketAPIClient = new CricketAPIClient();
  
  // Cricket data service is imported at the top of the file
  
  // Get live matches
  app.get("/api/match/live", async (req, res) => {
    try {
      const liveMatches = await cricketAPIClient.getLiveMatches();
      res.json(liveMatches);
    } catch (error) {
      console.error("Error fetching live matches:", error);
      res.status(500).json({ error: "Failed to fetch live matches", message: error.message });
    }
  });
  
  // Get match highlights
  app.get("/api/match/highlights", async (req, res) => {
    try {
      const highlights = await cricketAPIClient.getMatchHighlights();
      res.json(highlights);
    } catch (error) {
      console.error("Error fetching match highlights:", error);
      res.status(500).json({ error: "Failed to fetch match highlights", message: error.message });
    }
  });
  
  // Get match details
  app.get("/api/match/details/:id", async (req, res) => {
    try {
      const matchId = req.params.id;
      const matchDetails = await cricketAPIClient.getMatchDetails(matchId);
      
      if (!matchDetails) {
        return res.status(404).json({ error: "Match not found" });
      }
      
      res.json(matchDetails);
    } catch (error) {
      console.error(`Error fetching match details for ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to fetch match details", message: error.message });
    }
  });
  
  // Get all cricket matches (using RapidAPI)
  app.get("/api/cricket/matches", async (req, res) => {
    try {
      const matchesData = await cricketDataService.getAllMatches();
      res.json(matchesData);
    } catch (error) {
      console.error("Failed to fetch matches:", error);
      res.status(500).json({ error: "Failed to fetch matches", message: error.message });
    }
  });
  
  // Get recent matches
  app.get("/api/match/recent", async (req, res) => {
    try {
      const recentMatches = await cricketAPIClient.getRecentMatches();
      res.json(recentMatches);
    } catch (error) {
      console.error("Error fetching recent matches:", error);
      res.status(500).json({ error: "Failed to fetch recent matches", message: error.message });
    }
  });

  return httpServer;
}
