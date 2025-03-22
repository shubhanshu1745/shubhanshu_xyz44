import { 
  users, type User, type InsertUser,
  posts, type Post, type InsertPost,
  likes, type Like, type InsertLike,
  comments, type Comment, type InsertComment,
  follows, type Follow, type InsertFollow,
  blockedUsers, type BlockedUser, type InsertBlockedUser,
  conversations, type Conversation, type InsertConversation,
  messages, type Message, type InsertMessage,
  stories, type Story, type InsertStory,
  playerStats, type PlayerStats, type InsertPlayerStats,
  playerMatches, type PlayerMatch, type InsertPlayerMatch,
  playerMatchPerformance, type PlayerMatchPerformance, type InsertPlayerMatchPerformance,
  tokens, type Token, type InsertToken
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  searchUsers(query: string, limit?: number): Promise<User[]>;
  
  // Token methods
  createToken(token: InsertToken): Promise<Token>;
  getTokenByToken(token: string): Promise<Token | undefined>;
  deleteToken(id: number): Promise<boolean>;
  
  // Post methods
  createPost(post: InsertPost): Promise<Post>;
  getPost(id: number): Promise<Post | undefined>;
  getUserPosts(userId: number): Promise<Post[]>;
  getFeed(userId: number, limit?: number): Promise<(Post & { user: User, likeCount: number, commentCount: number, hasLiked: boolean })[]>;
  deletePost(id: number): Promise<boolean>;
  getReels(userId: number, limit?: number): Promise<(Post & { user: User, likeCount: number, commentCount: number, hasLiked: boolean })[]>;
  
  // Like methods
  likePost(like: InsertLike): Promise<Like>;
  unlikePost(userId: number, postId: number): Promise<boolean>;
  getLike(userId: number, postId: number): Promise<Like | undefined>;
  getLikesForPost(postId: number): Promise<Like[]>;
  
  // Comment methods
  createComment(comment: InsertComment): Promise<Comment>;
  getCommentsForPost(postId: number): Promise<(Comment & { user: User })[]>;
  deleteComment(id: number): Promise<boolean>;
  
  // Follow methods
  followUser(follow: InsertFollow): Promise<Follow>;
  unfollowUser(followerId: number, followingId: number): Promise<boolean>;
  getFollowers(userId: number): Promise<User[]>;
  getFollowing(userId: number): Promise<User[]>;
  isFollowing(followerId: number, followingId: number): Promise<boolean>;
  getSuggestedUsers(userId: number, limit?: number): Promise<User[]>;

  // Block methods
  blockUser(block: InsertBlockedUser): Promise<BlockedUser>;
  unblockUser(blockerId: number, blockedId: number): Promise<boolean>;
  isBlocked(blockerId: number, blockedId: number): Promise<boolean>;
  getBlockedUsers(userId: number): Promise<User[]>;

  // Chat methods
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversation(user1Id: number, user2Id: number): Promise<Conversation | undefined>;
  getConversationById(id: number): Promise<Conversation | undefined>;
  getUserConversations(userId: number): Promise<(Conversation & { 
    otherUser: Omit<User, 'password'>, 
    lastMessage: Message | null,
    unreadCount: number 
  })[]>;
  
  // Message methods
  createMessage(message: InsertMessage): Promise<Message>;
  getConversationMessages(conversationId: number): Promise<(Message & { sender: Omit<User, 'password'> })[]>;
  markMessagesAsRead(conversationId: number, userId: number): Promise<boolean>;
  deleteMessage(id: number, userId: number): Promise<boolean>;
  
  // Story methods
  createStory(story: InsertStory): Promise<Story>;
  getUserStories(userId: number): Promise<Story[]>;
  getStoriesForFeed(userId: number): Promise<(Story & { user: User })[]>;
  deleteExpiredStories(): Promise<void>;
  
  // Player Stats methods
  createPlayerStats(stats: InsertPlayerStats): Promise<PlayerStats>;
  getPlayerStats(userId: number): Promise<PlayerStats | undefined>;
  updatePlayerStats(userId: number, stats: Partial<PlayerStats>): Promise<PlayerStats | undefined>;
  
  // Player Match methods
  createPlayerMatch(match: InsertPlayerMatch): Promise<PlayerMatch>;
  getPlayerMatch(id: number): Promise<PlayerMatch | undefined>;
  getUserMatches(userId: number): Promise<PlayerMatch[]>;
  
  // Player Match Performance methods
  createPlayerMatchPerformance(performance: InsertPlayerMatchPerformance): Promise<PlayerMatchPerformance>;
  getPlayerMatchPerformance(userId: number, matchId: number): Promise<PlayerMatchPerformance | undefined>;
  getMatchPerformances(matchId: number): Promise<(PlayerMatchPerformance & { user: User })[]>;
  
  // Session store for authentication
  sessionStore: any; // Fixed to work with various session store types
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private posts: Map<number, Post>;
  private likes: Map<number, Like>;
  private comments: Map<number, Comment>;
  private follows: Map<number, Follow>;
  private blockedUsers: Map<number, BlockedUser>;
  private conversations: Map<number, Conversation>;
  private messages: Map<number, Message>;
  private stories: Map<number, Story>;
  private playerStats: Map<number, PlayerStats>;
  private playerMatches: Map<number, PlayerMatch>;
  private playerMatchPerformances: Map<number, PlayerMatchPerformance>;
  private tokens: Map<number, Token>;
  
  userCurrentId: number;
  postCurrentId: number;
  likeCurrentId: number;
  commentCurrentId: number;
  followCurrentId: number;
  blockedUserCurrentId: number;
  conversationCurrentId: number;
  messageCurrentId: number;
  storyCurrentId: number;
  playerStatsCurrentId: number;
  playerMatchCurrentId: number;
  playerMatchPerformanceCurrentId: number;
  tokenCurrentId: number;
  sessionStore: any;

  constructor() {
    this.users = new Map();
    this.posts = new Map();
    this.likes = new Map();
    this.comments = new Map();
    this.follows = new Map();
    this.blockedUsers = new Map();
    this.conversations = new Map();
    this.messages = new Map();
    this.stories = new Map();
    this.playerStats = new Map();
    this.playerMatches = new Map();
    this.playerMatchPerformances = new Map();
    this.tokens = new Map();
    
    this.userCurrentId = 1;
    this.postCurrentId = 1;
    this.likeCurrentId = 1;
    this.commentCurrentId = 1;
    this.followCurrentId = 1;
    this.blockedUserCurrentId = 1;
    this.conversationCurrentId = 1;
    this.messageCurrentId = 1;
    this.storyCurrentId = 1;
    this.playerStatsCurrentId = 1;
    this.playerMatchCurrentId = 1;
    this.playerMatchPerformanceCurrentId = 1;
    this.tokenCurrentId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }
  
  // Token methods
  async createToken(insertToken: InsertToken): Promise<Token> {
    const id = this.tokenCurrentId++;
    const token: Token = {
      id,
      userId: insertToken.userId,
      token: insertToken.token,
      type: insertToken.type,
      expiresAt: insertToken.expiresAt,
      createdAt: new Date()
    };
    this.tokens.set(id, token);
    return token;
  }
  
  async getTokenByToken(tokenString: string): Promise<Token | undefined> {
    return Array.from(this.tokens.values()).find(
      token => token.token === tokenString
    );
  }
  
  async deleteToken(id: number): Promise<boolean> {
    return this.tokens.delete(id);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { 
      id,
      username: insertUser.username,
      email: insertUser.email,
      password: insertUser.password,
      fullName: insertUser.fullName || null,
      bio: insertUser.bio || null,
      location: insertUser.location || null,
      profileImage: insertUser.profileImage || null,
      isPlayer: insertUser.isPlayer || false,
      emailVerified: false,
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Post methods
  async createPost(insertPost: InsertPost): Promise<Post> {
    const id = this.postCurrentId++;
    const post: Post = {
      id,
      userId: insertPost.userId,
      content: insertPost.content || null,
      imageUrl: insertPost.imageUrl || null,
      videoUrl: insertPost.videoUrl || null,
      thumbnailUrl: insertPost.thumbnailUrl || null,
      duration: insertPost.duration || null,
      location: insertPost.location || null,
      category: insertPost.category || null,
      matchId: insertPost.matchId || null,
      teamId: insertPost.teamId || null,
      playerId: insertPost.playerId || null,
      createdAt: new Date()
    };
    this.posts.set(id, post);
    return post;
  }
  
  async getPost(id: number): Promise<Post | undefined> {
    return this.posts.get(id);
  }
  
  async getUserPosts(userId: number): Promise<Post[]> {
    return Array.from(this.posts.values())
      .filter(post => post.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }
  
  async getFeed(userId: number, limit: number = 10): Promise<(Post & { user: User, likeCount: number, commentCount: number, hasLiked: boolean })[]> {
    // Get following IDs
    const followingIds = Array.from(this.follows.values())
      .filter(follow => follow.followerId === userId)
      .map(follow => follow.followingId);
    
    // Include user's own posts
    followingIds.push(userId);
    
    // Get posts from following users
    const feedPosts = Array.from(this.posts.values())
      .filter(post => followingIds.includes(post.userId))
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, limit);
    
    // Enrich post data
    return Promise.all(feedPosts.map(async post => {
      const user = await this.getUser(post.userId) as User;
      const likes = await this.getLikesForPost(post.id);
      const comments = await this.getCommentsForPost(post.id);
      const hasLiked = !!(await this.getLike(userId, post.id));
      
      return {
        ...post,
        user,
        likeCount: likes.length,
        commentCount: comments.length,
        hasLiked
      };
    }));
  }
  
  async deletePost(id: number): Promise<boolean> {
    return this.posts.delete(id);
  }

  async getReels(userId: number, limit: number = 20): Promise<(Post & { user: User, likeCount: number, commentCount: number, hasLiked: boolean })[]> {
    // Get following IDs
    const followingIds = Array.from(this.follows.values())
      .filter(follow => follow.followerId === userId)
      .map(follow => follow.followingId);
    
    // Include user's own reels
    followingIds.push(userId);
    
    // Get reels (posts with videoUrl)
    const reelPosts = Array.from(this.posts.values())
      .filter(post => 
        post.videoUrl !== null && 
        post.category === 'reel' && 
        followingIds.includes(post.userId)
      )
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, limit);
    
    // Enrich post data
    return Promise.all(reelPosts.map(async post => {
      const user = await this.getUser(post.userId) as User;
      const likes = await this.getLikesForPost(post.id);
      const comments = await this.getCommentsForPost(post.id);
      const hasLiked = !!(await this.getLike(userId, post.id));
      
      return {
        ...post,
        user,
        likeCount: likes.length,
        commentCount: comments.length,
        hasLiked
      };
    }));
  }

  // Like methods
  async likePost(insertLike: InsertLike): Promise<Like> {
    // Check if like already exists
    const existingLike = await this.getLike(insertLike.userId, insertLike.postId);
    if (existingLike) return existingLike;
    
    const id = this.likeCurrentId++;
    const like: Like = {
      ...insertLike,
      id,
      createdAt: new Date()
    };
    this.likes.set(id, like);
    return like;
  }
  
  async unlikePost(userId: number, postId: number): Promise<boolean> {
    const like = await this.getLike(userId, postId);
    if (!like) return false;
    
    return this.likes.delete(like.id);
  }
  
  async getLike(userId: number, postId: number): Promise<Like | undefined> {
    return Array.from(this.likes.values()).find(
      like => like.userId === userId && like.postId === postId
    );
  }
  
  async getLikesForPost(postId: number): Promise<Like[]> {
    return Array.from(this.likes.values()).filter(like => like.postId === postId);
  }

  // Comment methods
  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = this.commentCurrentId++;
    const comment: Comment = {
      id,
      userId: insertComment.userId,
      postId: insertComment.postId,
      content: insertComment.content,
      createdAt: new Date()
    };
    this.comments.set(id, comment);
    return comment;
  }
  
  async getCommentsForPost(postId: number): Promise<(Comment & { user: User })[]> {
    const postComments = Array.from(this.comments.values())
      .filter(comment => comment.postId === postId)
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
    
    return Promise.all(postComments.map(async comment => {
      const user = await this.getUser(comment.userId) as User;
      return { ...comment, user };
    }));
  }
  
  async deleteComment(id: number): Promise<boolean> {
    return this.comments.delete(id);
  }

  // Follow methods
  async followUser(insertFollow: InsertFollow): Promise<Follow> {
    // Check if already following
    const isAlreadyFollowing = await this.isFollowing(
      insertFollow.followerId, 
      insertFollow.followingId
    );
    
    if (isAlreadyFollowing) {
      return Array.from(this.follows.values()).find(
        f => f.followerId === insertFollow.followerId && f.followingId === insertFollow.followingId
      ) as Follow;
    }
    
    const id = this.followCurrentId++;
    const follow: Follow = {
      id,
      followerId: insertFollow.followerId,
      followingId: insertFollow.followingId,
      createdAt: new Date()
    };
    this.follows.set(id, follow);
    return follow;
  }
  
  async unfollowUser(followerId: number, followingId: number): Promise<boolean> {
    const follow = Array.from(this.follows.values()).find(
      f => f.followerId === followerId && f.followingId === followingId
    );
    
    if (!follow) return false;
    return this.follows.delete(follow.id);
  }
  
  async getFollowers(userId: number): Promise<User[]> {
    const followerIds = Array.from(this.follows.values())
      .filter(follow => follow.followingId === userId)
      .map(follow => follow.followerId);
    
    return Promise.all(followerIds.map(id => this.getUser(id))) as Promise<User[]>;
  }
  
  async getFollowing(userId: number): Promise<User[]> {
    const followingIds = Array.from(this.follows.values())
      .filter(follow => follow.followerId === userId)
      .map(follow => follow.followingId);
    
    return Promise.all(followingIds.map(id => this.getUser(id))) as Promise<User[]>;
  }
  
  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    return !!Array.from(this.follows.values()).find(
      follow => follow.followerId === followerId && follow.followingId === followingId
    );
  }
  
  async getSuggestedUsers(userId: number, limit: number = 5): Promise<User[]> {
    // Get users that the current user is not already following
    const followingIds = Array.from(this.follows.values())
      .filter(follow => follow.followerId === userId)
      .map(follow => follow.followingId);
    
    // Don't suggest the current user
    followingIds.push(userId);
    
    const suggestedUsers = Array.from(this.users.values())
      .filter(user => !followingIds.includes(user.id))
      .slice(0, limit);
    
    return suggestedUsers;
  }
  
  async searchUsers(query: string, limit: number = 10): Promise<User[]> {
    if (!query) return [];
    
    const lowerCaseQuery = query.toLowerCase();
    
    return Array.from(this.users.values())
      .filter(user => 
        user.username.toLowerCase().includes(lowerCaseQuery) || 
        (user.fullName && user.fullName.toLowerCase().includes(lowerCaseQuery)) ||
        (user.bio && user.bio.toLowerCase().includes(lowerCaseQuery)) ||
        (user.location && user.location.toLowerCase().includes(lowerCaseQuery))
      )
      .slice(0, limit);
  }
  
  // Block methods
  async blockUser(insertBlock: InsertBlockedUser): Promise<BlockedUser> {
    // Check if already blocked
    const isAlreadyBlocked = await this.isBlocked(
      insertBlock.blockerId, 
      insertBlock.blockedId
    );
    
    if (isAlreadyBlocked) {
      return Array.from(this.blockedUsers.values()).find(
        b => b.blockerId === insertBlock.blockerId && b.blockedId === insertBlock.blockedId
      ) as BlockedUser;
    }
    
    const id = this.blockedUserCurrentId++;
    const block: BlockedUser = {
      id,
      blockerId: insertBlock.blockerId,
      blockedId: insertBlock.blockedId,
      createdAt: new Date()
    };
    this.blockedUsers.set(id, block);
    
    // When a user blocks someone, they should automatically unfollow them
    this.unfollowUser(insertBlock.blockerId, insertBlock.blockedId);
    
    // And the blocked user should be unfollowed from the blocker
    this.unfollowUser(insertBlock.blockedId, insertBlock.blockerId);
    
    return block;
  }
  
  async unblockUser(blockerId: number, blockedId: number): Promise<boolean> {
    const block = Array.from(this.blockedUsers.values()).find(
      b => b.blockerId === blockerId && b.blockedId === blockedId
    );
    
    if (!block) return false;
    return this.blockedUsers.delete(block.id);
  }
  
  async isBlocked(blockerId: number, blockedId: number): Promise<boolean> {
    return !!Array.from(this.blockedUsers.values()).find(
      block => block.blockerId === blockerId && block.blockedId === blockedId
    );
  }
  
  async getBlockedUsers(userId: number): Promise<User[]> {
    const blockedIds = Array.from(this.blockedUsers.values())
      .filter(block => block.blockerId === userId)
      .map(block => block.blockedId);
    
    return Promise.all(blockedIds.map(id => this.getUser(id))) as Promise<User[]>;
  }

  // Chat methods
  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    // Check if a conversation already exists between these users
    const existingConversation = await this.getConversation(
      insertConversation.user1Id,
      insertConversation.user2Id
    );
    
    if (existingConversation) {
      return existingConversation;
    }
    
    const id = this.conversationCurrentId++;
    const conversation: Conversation = {
      id,
      user1Id: insertConversation.user1Id,
      user2Id: insertConversation.user2Id,
      lastMessageAt: new Date(),
      createdAt: new Date()
    };
    
    this.conversations.set(id, conversation);
    return conversation;
  }
  
  async getConversation(user1Id: number, user2Id: number): Promise<Conversation | undefined> {
    return Array.from(this.conversations.values()).find(
      conv => 
        (conv.user1Id === user1Id && conv.user2Id === user2Id) ||
        (conv.user1Id === user2Id && conv.user2Id === user1Id)
    );
  }
  
  async getConversationById(id: number): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }
  
  async getUserConversations(userId: number): Promise<(Conversation & { 
    otherUser: Omit<User, 'password'>, 
    lastMessage: Message | null,
    unreadCount: number 
  })[]> {
    const userConversations = Array.from(this.conversations.values())
      .filter(conv => conv.user1Id === userId || conv.user2Id === userId)
      .sort((a, b) => 
        (b.lastMessageAt?.getTime() || 0) - (a.lastMessageAt?.getTime() || 0)
      );
      
    return Promise.all(userConversations.map(async conv => {
      // Get the other user in the conversation
      const otherUserId = conv.user1Id === userId ? conv.user2Id : conv.user1Id;
      const otherUser = await this.getUser(otherUserId) as User;
      const { password, ...otherUserWithoutPassword } = otherUser;
      
      // Get latest message
      const conversationMessages = Array.from(this.messages.values())
        .filter(msg => msg.conversationId === conv.id)
        .sort((a, b) => 
          (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
        );
        
      const lastMessage = conversationMessages.length > 0 ? conversationMessages[0] : null;
      
      // Count unread messages
      const unreadCount = conversationMessages.filter(
        msg => msg.senderId !== userId && !msg.read
      ).length;
      
      return {
        ...conv,
        otherUser: otherUserWithoutPassword,
        lastMessage,
        unreadCount
      };
    }));
  }
  
  // Message methods
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageCurrentId++;
    const message: Message = {
      id,
      conversationId: insertMessage.conversationId,
      senderId: insertMessage.senderId,
      content: insertMessage.content,
      messageType: insertMessage.messageType || "text",
      mediaUrl: insertMessage.mediaUrl || null,
      read: insertMessage.read || false,
      createdAt: new Date()
    };
    
    this.messages.set(id, message);
    
    // Update conversation's lastMessageAt
    const conversation = await this.getConversationById(insertMessage.conversationId);
    if (conversation) {
      conversation.lastMessageAt = new Date();
      this.conversations.set(conversation.id, conversation);
    }
    
    return message;
  }
  
  async getConversationMessages(conversationId: number): Promise<(Message & { sender: Omit<User, 'password'> })[]> {
    const conversationMessages = Array.from(this.messages.values())
      .filter(msg => msg.conversationId === conversationId)
      .sort((a, b) => 
        (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0)
      );
      
    return Promise.all(conversationMessages.map(async message => {
      const sender = await this.getUser(message.senderId) as User;
      const { password, ...senderWithoutPassword } = sender;
      
      return {
        ...message,
        sender: senderWithoutPassword
      };
    }));
  }
  
  async markMessagesAsRead(conversationId: number, userId: number): Promise<boolean> {
    let updated = false;
    
    // Get all unread messages in the conversation that were not sent by the user
    const unreadMessages = Array.from(this.messages.values())
      .filter(msg => 
        msg.conversationId === conversationId && 
        msg.senderId !== userId && 
        !msg.read
      );
      
    // Mark each message as read
    unreadMessages.forEach(message => {
      message.read = true;
      this.messages.set(message.id, message);
      updated = true;
    });
    
    return updated;
  }
  
  async deleteMessage(id: number, userId: number): Promise<boolean> {
    // Fetch the message to verify ownership
    const message = Array.from(this.messages.values()).find(msg => msg.id === id);
    
    // If message not found or user is not the sender, return false
    if (!message || message.senderId !== userId) {
      return false;
    }
    
    // Delete the message
    return this.messages.delete(id);
  }

  // Story methods
  async createStory(insertStory: InsertStory): Promise<Story> {
    const id = this.storyCurrentId++;
    const expiresAt = insertStory.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    
    const story: Story = {
      id,
      userId: insertStory.userId,
      imageUrl: insertStory.imageUrl || "",
      caption: insertStory.caption || null,
      createdAt: new Date(),
      expiresAt
    };
    
    this.stories.set(id, story);
    return story;
  }
  
  async getUserStories(userId: number): Promise<Story[]> {
    // Get unexpired stories
    const now = new Date();
    return Array.from(this.stories.values())
      .filter(story => 
        story.userId === userId && 
        story.expiresAt && 
        new Date(story.expiresAt) > now
      )
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }
  
  async getStoriesForFeed(userId: number): Promise<(Story & { user: User })[]> {
    // Get following IDs
    const followingIds = Array.from(this.follows.values())
      .filter(follow => follow.followerId === userId)
      .map(follow => follow.followingId);
    
    // Get unexpired stories from following users
    const now = new Date();
    const feedStories = Array.from(this.stories.values())
      .filter(story => 
        followingIds.includes(story.userId) && 
        story.expiresAt && 
        new Date(story.expiresAt) > now
      )
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
    
    // Enrich story data with user info
    return Promise.all(feedStories.map(async story => {
      const user = await this.getUser(story.userId) as User;
      return { ...story, user };
    }));
  }
  
  async deleteExpiredStories(): Promise<void> {
    const now = new Date();
    const expiredStories = Array.from(this.stories.values())
      .filter(story => story.expiresAt && new Date(story.expiresAt) <= now);
    
    expiredStories.forEach(story => this.stories.delete(story.id));
  }

  // Player Stats methods
  async createPlayerStats(insertStats: InsertPlayerStats): Promise<PlayerStats> {
    const id = this.playerStatsCurrentId++;
    const stats: PlayerStats = {
      id,
      userId: insertStats.userId,
      position: insertStats.position || null,
      battingStyle: insertStats.battingStyle || null,
      bowlingStyle: insertStats.bowlingStyle || null,
      totalMatches: insertStats.totalMatches || 0,
      totalRuns: insertStats.totalRuns || 0,
      totalWickets: insertStats.totalWickets || 0,
      totalCatches: insertStats.totalCatches || 0,
      totalSixes: insertStats.totalSixes || 0,
      totalFours: insertStats.totalFours || 0,
      highestScore: insertStats.highestScore || 0,
      bestBowling: insertStats.bestBowling || null,
      battingAverage: insertStats.battingAverage || "0",
      bowlingAverage: insertStats.bowlingAverage || "0",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.playerStats.set(id, stats);
    return stats;
  }
  
  async getPlayerStats(userId: number): Promise<PlayerStats | undefined> {
    return Array.from(this.playerStats.values()).find(stats => stats.userId === userId);
  }
  
  async updatePlayerStats(userId: number, statsData: Partial<PlayerStats>): Promise<PlayerStats | undefined> {
    const stats = await this.getPlayerStats(userId);
    if (!stats) return undefined;
    
    const updatedStats = { 
      ...stats, 
      ...statsData,
      updatedAt: new Date()
    };
    this.playerStats.set(stats.id, updatedStats);
    return updatedStats;
  }

  // Player Match methods
  async createPlayerMatch(insertMatch: InsertPlayerMatch): Promise<PlayerMatch> {
    const id = this.playerMatchCurrentId++;
    const match: PlayerMatch = {
      id,
      userId: insertMatch.userId,
      matchName: insertMatch.matchName,
      matchDate: insertMatch.matchDate,
      venue: insertMatch.venue || null,
      opponent: insertMatch.opponent,
      matchType: insertMatch.matchType || null,
      teamScore: insertMatch.teamScore || null,
      opponentScore: insertMatch.opponentScore || null,
      result: insertMatch.result || null,
      createdAt: new Date()
    };
    
    this.playerMatches.set(id, match);
    return match;
  }
  
  async getPlayerMatch(id: number): Promise<PlayerMatch | undefined> {
    return this.playerMatches.get(id);
  }
  
  async getUserMatches(userId: number): Promise<PlayerMatch[]> {
    return Array.from(this.playerMatches.values())
      .filter(match => match.userId === userId)
      .sort((a, b) => (b.matchDate?.getTime() || 0) - (a.matchDate?.getTime() || 0));
  }

  // Player Match Performance methods
  async createPlayerMatchPerformance(insertPerformance: InsertPlayerMatchPerformance): Promise<PlayerMatchPerformance> {
    const id = this.playerMatchPerformanceCurrentId++;
    const performance: PlayerMatchPerformance = {
      id,
      userId: insertPerformance.userId,
      matchId: insertPerformance.matchId,
      runsScored: insertPerformance.runsScored || 0,
      ballsFaced: insertPerformance.ballsFaced || 0,
      fours: insertPerformance.fours || 0,
      sixes: insertPerformance.sixes || 0,
      battingStatus: insertPerformance.battingStatus || null,
      oversBowled: insertPerformance.oversBowled || "0",
      runsConceded: insertPerformance.runsConceded || 0,
      wicketsTaken: insertPerformance.wicketsTaken || 0,
      maidens: insertPerformance.maidens || 0,
      catches: insertPerformance.catches || 0,
      runOuts: insertPerformance.runOuts || 0,
      stumpings: insertPerformance.stumpings || 0,
      createdAt: new Date()
    };
    
    this.playerMatchPerformances.set(id, performance);
    return performance;
  }
  
  async getPlayerMatchPerformance(userId: number, matchId: number): Promise<PlayerMatchPerformance | undefined> {
    return Array.from(this.playerMatchPerformances.values())
      .find(perf => perf.userId === userId && perf.matchId === matchId);
  }
  
  async getMatchPerformances(matchId: number): Promise<(PlayerMatchPerformance & { user: User })[]> {
    const performances = Array.from(this.playerMatchPerformances.values())
      .filter(perf => perf.matchId === matchId);
    
    return Promise.all(performances.map(async perf => {
      const user = await this.getUser(perf.userId) as User;
      return { ...perf, user };
    }));
  }
}

export const storage = new MemStorage();
