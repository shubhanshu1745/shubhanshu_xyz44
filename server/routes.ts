import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import { z } from "zod";
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
  insertPlayerMatchPerformanceSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from "@shared/schema";
import { EmailService } from "./services/email-service";
import { CricketDataService } from "./services/cricket-data";
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
        return res.json(CricketDataService.getMatchesByStatus(status as any));
      }
      
      res.json(CricketDataService.getAllMatches());
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch matches" });
    }
  });

  app.get("/api/cricket/matches/recent", (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 3;
      res.json(CricketDataService.getRecentMatches(limit));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent matches" });
    }
  });

  app.get("/api/cricket/matches/:id", (req, res) => {
    try {
      const matchId = req.params.id;
      const match = CricketDataService.getMatchById(matchId);
      
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
        return res.json(CricketDataService.searchTeams(query));
      }
      
      if (type && ["international", "franchise", "domestic"].includes(type)) {
        return res.json(CricketDataService.getTeamsByType(type as any));
      }
      
      res.json(CricketDataService.getAllTeams());
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  app.get("/api/cricket/teams/:id", (req, res) => {
    try {
      const teamId = req.params.id;
      const team = CricketDataService.getTeamById(teamId);
      
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      res.json(team);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch team" });
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
        return res.status(400).json({ message: "This user is not a player" });
      }
      
      const stats = await storage.getPlayerStats(targetUser.id);
      
      if (!stats) {
        return res.status(404).json({ message: "Player stats not found" });
      }
      
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
      
      res.json(matches);
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
      
      // Create the match
      const matchData = {
        userId: user.id,
        opponent: req.body.opponent,
        venue: req.body.venue,
        matchDate: new Date(req.body.matchDate),
        matchType: req.body.matchType,
        result: req.body.result || "In Progress"
      };
      
      const match = await storage.createPlayerMatch(matchData);
      res.status(201).json(match);
    } catch (error) {
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
      const performanceData = {
        userId: user.id,
        matchId: matchId,
        runs: parseInt(req.body.runs) || 0,
        balls: parseInt(req.body.balls) || 0,
        fours: parseInt(req.body.fours) || 0,
        sixes: parseInt(req.body.sixes) || 0,
        wickets: parseInt(req.body.wickets) || 0,
        oversBowled: req.body.oversBowled?.toString() || "0",
        runsConceded: parseInt(req.body.runsConceded) || 0,
        catches: parseInt(req.body.catches) || 0,
        runOuts: parseInt(req.body.runOuts) || 0
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
      // Get current stats
      const currentStats = await storage.getPlayerStats(userId);
      
      if (!currentStats) {
        // Create new stats if they don't exist
        const newStats = {
          userId: userId,
          position: null,
          battingStyle: null,
          bowlingStyle: null,
          totalMatches: 1,
          totalRuns: performance.runs,
          battingAverage: performance.runs.toString(), // Initially just the runs from first match
          strikeRate: performance.balls > 0 ? ((performance.runs / performance.balls) * 100).toString() : "0",
          totalWickets: performance.wickets,
          economy: performance.oversBowled && parseFloat(performance.oversBowled) > 0 
            ? (performance.runsConceded / parseFloat(performance.oversBowled)).toString() 
            : "0",
          bowlingAverage: performance.wickets > 0 
            ? (performance.runsConceded / performance.wickets).toString() 
            : "0",
          bestBowlingFigures: performance.wickets > 0 
            ? `${performance.wickets}/${performance.runsConceded}` 
            : "0/0",
          highestScore: performance.runs,
          fifties: performance.runs >= 50 && performance.runs < 100 ? 1 : 0,
          hundreds: performance.runs >= 100 ? 1 : 0,
          fours: performance.fours,
          sixes: performance.sixes,
          catches: performance.catches,
          runOuts: performance.runOuts
        };
        
        await storage.createPlayerStats(newStats);
      } else {
        // Update existing stats
        const updatedStats = {
          totalMatches: (currentStats.totalMatches || 0) + 1,
          totalRuns: (currentStats.totalRuns || 0) + performance.runs,
          // Calculate new batting average
          battingAverage: (((currentStats.totalRuns || 0) + performance.runs) / ((currentStats.totalMatches || 0) + 1)).toString(),
          // Update strike rate
          strikeRate: ((currentStats.strikeRate ? parseFloat(currentStats.strikeRate) : 0) * (currentStats.totalMatches || 1) / ((currentStats.totalMatches || 0) + 1)
            + (performance.balls > 0 ? (performance.runs / performance.balls) * 100 : 0) / ((currentStats.totalMatches || 0) + 1)).toString(),
          totalWickets: (currentStats.totalWickets || 0) + performance.wickets,
          // Update bowling figures
          fifties: (currentStats.fifties || 0) + (performance.runs >= 50 && performance.runs < 100 ? 1 : 0),
          hundreds: (currentStats.hundreds || 0) + (performance.runs >= 100 ? 1 : 0),
          fours: (currentStats.fours || 0) + performance.fours,
          sixes: (currentStats.sixes || 0) + performance.sixes,
          catches: (currentStats.catches || 0) + performance.catches,
          runOuts: (currentStats.runOuts || 0) + performance.runOuts,
          // Update highest score if needed
          highestScore: Math.max(currentStats.highestScore || 0, performance.runs)
        };
        
        await storage.updatePlayerStats(userId, updatedStats);
      }
    } catch (error) {
      console.error("Error updating player stats:", error);
    }
  }
  
  app.post("/api/player-matches", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || !user.isPlayer) {
        return res.status(403).json({ message: "Only player accounts can create matches" });
      }
      
      const matchData = insertPlayerMatchSchema.parse({ ...req.body, userId });
      const match = await storage.createPlayerMatch(matchData);
      
      res.status(201).json(match);
    } catch (error) {
      if (error instanceof z.ZodError) {
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
      
      if (!user || !user.isPlayer) {
        return res.status(403).json({ message: "Only player accounts can record performances" });
      }
      
      const { matchId } = req.body;
      
      // Check if match exists
      if (matchId) {
        const match = await storage.getPlayerMatch(parseInt(matchId));
        if (!match) {
          return res.status(404).json({ message: "Match not found" });
        }
      }
      
      // Check if performance for this match already exists
      if (matchId) {
        const existingPerformance = await storage.getPlayerMatchPerformance(userId, parseInt(matchId));
        if (existingPerformance) {
          return res.status(400).json({ message: "Performance record already exists for this match" });
        }
      }
      
      const performanceData = insertPlayerMatchPerformanceSchema.parse({ ...req.body, userId });
      const performance = await storage.createPlayerMatchPerformance(performanceData);
      
      res.status(201).json(performance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
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
  
  return httpServer;
}
