import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import { z } from "zod";
import { 
  insertCommentSchema, 
  insertPostSchema, 
  insertFollowSchema,
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
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
      
      // Redirect to frontend with success message
      res.redirect(`${process.env.APP_URL || 'http://localhost:5000'}?verified=true`);
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
      
      // Don't send password to client
      const { password, ...userWithoutPassword } = user;
      
      res.json({
        ...userWithoutPassword,
        postCount: posts.length,
        followerCount: followers.length,
        followingCount: following.length,
        isFollowing
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
        return res.status(400).json({ message: "This user is not a player" });
      }
      
      const matches = await storage.getUserMatches(targetUser.id);
      
      res.json(matches);
    } catch (error) {
      console.error("Error fetching player matches:", error);
      res.status(500).json({ message: "Failed to fetch player matches" });
    }
  });
  
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
  return httpServer;
}
