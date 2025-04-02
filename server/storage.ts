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
  tokens, type Token, type InsertToken,
  tags, type Tag, type InsertTag,
  postTags, type PostTag, type InsertPostTag,
  contentCategories, type ContentCategory, type InsertContentCategory,
  userInterests, type UserInterest, type InsertUserInterest,
  contentEngagement, type ContentEngagement, type InsertContentEngagement
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
  
  // Content categorization and discovery methods
  createTag(tag: InsertTag): Promise<Tag>;
  getTags(type?: string): Promise<Tag[]>;
  getTagById(id: number): Promise<Tag | undefined>;
  updateTagPopularity(id: number, increment: number): Promise<Tag | undefined>;
  addPostTag(postTag: InsertPostTag): Promise<PostTag>;
  getPostTags(postId: number): Promise<Tag[]>;
  removePostTag(postId: number, tagId: number): Promise<boolean>;
  createContentCategory(category: InsertContentCategory): Promise<ContentCategory>;
  getContentCategories(): Promise<ContentCategory[]>;
  updateUserInterest(interest: InsertUserInterest): Promise<UserInterest>;
  getUserInterests(userId: number): Promise<(UserInterest & { tag: Tag })[]>;
  recordContentEngagement(engagement: InsertContentEngagement): Promise<ContentEngagement>;
  getContentEngagementForUser(userId: number): Promise<ContentEngagement[]>;
  getPersonalizedFeed(userId: number, limit?: number): Promise<(Post & { 
    user: User, 
    likeCount: number, 
    commentCount: number, 
    hasLiked: boolean,
    tags: Tag[],
    relevanceScore: number
  })[]>;
  
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
  
  // Match management methods
  createMatch(match: InsertMatch): Promise<Match>;
  getMatchById(id: number): Promise<Match | undefined>;
  updateMatch(id: number, matchData: Partial<Match>): Promise<Match | undefined>;
  getUserMatches(userId: number): Promise<Match[]>;
  deleteMatch(id: number): Promise<boolean>;
  
  // Team management methods
  createTeam(team: InsertTeam): Promise<Team>;
  getTeamById(id: number): Promise<Team | undefined>;
  getUserTeams(userId: number): Promise<Team[]>;
  updateTeam(id: number, teamData: Partial<Team>): Promise<Team | undefined>;
  deleteTeam(id: number): Promise<boolean>;
  
  // Match player management methods
  addMatchPlayer(player: InsertMatchPlayer): Promise<MatchPlayer>;
  getMatchPlayersByTeam(matchId: number, teamId: number): Promise<MatchPlayer[]>;
  updateMatchPlayer(id: number, playerData: Partial<MatchPlayer>): Promise<MatchPlayer | undefined>;
  removeMatchPlayer(id: number): Promise<boolean>;
  
  // Ball-by-ball data methods
  recordBallByBall(ball: InsertBallByBall): Promise<BallByBall>;
  getMatchBalls(matchId: number): Promise<BallByBall[]>;
  
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
  private matches: Map<number, Match>;
  private teams: Map<number, Team>;
  private matchPlayers: Map<number, MatchPlayer>;
  private ballByBalls: Map<number, BallByBall>;
  private tags: Map<number, Tag>;
  private postTags: Map<string, PostTag>; // Composite key: `${postId}-${tagId}`
  private contentCategories: Map<number, ContentCategory>;
  private userInterests: Map<string, UserInterest>; // Composite key: `${userId}-${tagId}`
  private contentEngagements: Map<number, ContentEngagement>;
  
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
  matchCurrentId: number;
  teamCurrentId: number;
  matchPlayerCurrentId: number;
  ballByBallCurrentId: number;
  tagCurrentId: number;
  contentCategoryCurrentId: number;
  contentEngagementCurrentId: number;
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
    this.matches = new Map();
    this.teams = new Map();
    this.matchPlayers = new Map();
    this.ballByBalls = new Map();
    this.tags = new Map();
    this.postTags = new Map();
    this.contentCategories = new Map();
    this.userInterests = new Map();
    this.contentEngagements = new Map();
    
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
    this.matchCurrentId = 1;
    this.teamCurrentId = 1;
    this.matchPlayerCurrentId = 1;
    this.ballByBallCurrentId = 1;
    this.tagCurrentId = 1;
    this.contentCategoryCurrentId = 1;
    this.contentEngagementCurrentId = 1;
    
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
      // Extended stats for UI display
      innings: insertStats.innings || 0,
      notOuts: insertStats.notOuts || 0,
      ballsFaced: insertStats.ballsFaced || 0,
      oversBowled: insertStats.oversBowled || "0",
      runsConceded: insertStats.runsConceded || 0,
      maidens: insertStats.maidens || 0,
      fifties: insertStats.fifties || 0,
      hundreds: insertStats.hundreds || 0,
      totalRunOuts: insertStats.totalRunOuts || 0,
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
  
  // Match management methods
  async createMatch(insertMatch: InsertMatch): Promise<Match> {
    const id = this.matchCurrentId++;
    const match: Match = {
      id,
      title: insertMatch.title,
      venue: insertMatch.venue,
      date: insertMatch.date,
      overs: insertMatch.overs,
      team1Id: insertMatch.team1Id,
      team2Id: insertMatch.team2Id,
      matchType: insertMatch.matchType || 'friendly',
      status: insertMatch.status || 'upcoming',
      currentInnings: insertMatch.currentInnings || 1,
      team1Score: insertMatch.team1Score || 0,
      team1Wickets: insertMatch.team1Wickets || 0,
      team1Overs: insertMatch.team1Overs || '0.0',
      team2Score: insertMatch.team2Score || 0,
      team2Wickets: insertMatch.team2Wickets || 0,
      team2Overs: insertMatch.team2Overs || '0.0',
      result: insertMatch.result || null,
      winner: insertMatch.winner || null,
      tossWinner: insertMatch.tossWinner || null,
      tossDecision: insertMatch.tossDecision || null,
      createdBy: insertMatch.createdBy,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.matches.set(id, match);
    return match;
  }
  
  async getMatchById(id: number): Promise<Match | undefined> {
    return this.matches.get(id);
  }
  
  async updateMatch(id: number, matchData: Partial<Match>): Promise<Match | undefined> {
    const match = await this.getMatchById(id);
    if (!match) return undefined;
    
    const updatedMatch = { ...match, ...matchData, updatedAt: new Date() };
    this.matches.set(id, updatedMatch);
    return updatedMatch;
  }
  
  async getUserMatches(userId: number): Promise<Match[]> {
    return Array.from(this.matches.values())
      .filter(match => match.createdBy === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }
  
  async deleteMatch(id: number): Promise<boolean> {
    // Also delete related data
    const ballsToDelete = Array.from(this.ballByBalls.values())
      .filter(ball => ball.matchId === id)
      .map(ball => ball.id);
    
    ballsToDelete.forEach(ballId => this.ballByBalls.delete(ballId));
    
    const playersToDelete = Array.from(this.matchPlayers.values())
      .filter(player => player.matchId === id)
      .map(player => player.id);
    
    playersToDelete.forEach(playerId => this.matchPlayers.delete(playerId));
    
    return this.matches.delete(id);
  }
  
  // Team management methods
  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const id = this.teamCurrentId++;
    const team: Team = {
      id,
      name: insertTeam.name,
      location: insertTeam.location || null,
      description: insertTeam.description || null,
      logoUrl: insertTeam.logoUrl || null,
      captainId: insertTeam.captainId || null,
      viceCaptainId: insertTeam.viceCaptainId || null,
      createdBy: insertTeam.createdBy,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.teams.set(id, team);
    return team;
  }
  
  async getTeamById(id: number): Promise<Team | undefined> {
    return this.teams.get(id);
  }
  
  async getUserTeams(userId: number): Promise<Team[]> {
    return Array.from(this.teams.values())
      .filter(team => team.createdBy === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }
  
  async updateTeam(id: number, teamData: Partial<Team>): Promise<Team | undefined> {
    const team = await this.getTeamById(id);
    if (!team) return undefined;
    
    const updatedTeam = { ...team, ...teamData, updatedAt: new Date() };
    this.teams.set(id, updatedTeam);
    return updatedTeam;
  }
  
  async deleteTeam(id: number): Promise<boolean> {
    return this.teams.delete(id);
  }
  
  // Match player management methods
  async addMatchPlayer(insertPlayer: InsertMatchPlayer): Promise<MatchPlayer> {
    // Check if player already exists for this match and team
    const existingPlayer = Array.from(this.matchPlayers.values()).find(
      p => p.matchId === insertPlayer.matchId && 
           p.teamId === insertPlayer.teamId && 
           p.userId === insertPlayer.userId
    );
    
    if (existingPlayer) {
      // Update existing player instead of creating a new one
      const updatedPlayer = { 
        ...existingPlayer,
        isPlaying: insertPlayer.isPlaying !== undefined ? insertPlayer.isPlaying : existingPlayer.isPlaying,
        isCaptain: insertPlayer.isCaptain !== undefined ? insertPlayer.isCaptain : existingPlayer.isCaptain,
        isViceCaptain: insertPlayer.isViceCaptain !== undefined ? insertPlayer.isViceCaptain : existingPlayer.isViceCaptain,
        isWicketkeeper: insertPlayer.isWicketkeeper !== undefined ? insertPlayer.isWicketkeeper : existingPlayer.isWicketkeeper,
        battingPosition: insertPlayer.battingPosition !== undefined ? insertPlayer.battingPosition : existingPlayer.battingPosition,
        bowlingPosition: insertPlayer.bowlingPosition !== undefined ? insertPlayer.bowlingPosition : existingPlayer.bowlingPosition,
        playerMatchNotes: insertPlayer.playerMatchNotes !== undefined ? insertPlayer.playerMatchNotes : existingPlayer.playerMatchNotes,
        updatedAt: new Date()
      };
      
      this.matchPlayers.set(existingPlayer.id, updatedPlayer);
      return updatedPlayer;
    }
    
    // Create new player
    const id = this.matchPlayerCurrentId++;
    const player: MatchPlayer = {
      id,
      matchId: insertPlayer.matchId,
      teamId: insertPlayer.teamId,
      userId: insertPlayer.userId,
      isPlaying: insertPlayer.isPlaying !== undefined ? insertPlayer.isPlaying : true,
      isCaptain: insertPlayer.isCaptain || false,
      isViceCaptain: insertPlayer.isViceCaptain || false,
      isWicketkeeper: insertPlayer.isWicketkeeper || false,
      battingPosition: insertPlayer.battingPosition || null,
      bowlingPosition: insertPlayer.bowlingPosition || null,
      playerMatchNotes: insertPlayer.playerMatchNotes || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.matchPlayers.set(id, player);
    return player;
  }
  
  async getMatchPlayersByTeam(matchId: number, teamId: number): Promise<MatchPlayer[]> {
    const matchPlayers = Array.from(this.matchPlayers.values())
      .filter(player => player.matchId === matchId && player.teamId === teamId);
    
    // Enrich with user data
    return Promise.all(matchPlayers.map(async player => {
      const user = await this.getUser(player.userId);
      return {
        ...player,
        user
      };
    }));
  }
  
  async updateMatchPlayer(id: number, playerData: Partial<MatchPlayer>): Promise<MatchPlayer | undefined> {
    const player = this.matchPlayers.get(id);
    if (!player) return undefined;
    
    const updatedPlayer = { ...player, ...playerData, updatedAt: new Date() };
    this.matchPlayers.set(id, updatedPlayer);
    return updatedPlayer;
  }
  
  async removeMatchPlayer(id: number): Promise<boolean> {
    return this.matchPlayers.delete(id);
  }
  
  // Ball-by-ball data methods
  async recordBallByBall(insertBall: InsertBallByBall): Promise<BallByBall> {
    const id = this.ballByBallCurrentId++;
    const ball: BallByBall = {
      id,
      matchId: insertBall.matchId,
      innings: insertBall.innings,
      over: insertBall.over,
      ball: insertBall.ball,
      batsmanId: insertBall.batsmanId,
      bowlerId: insertBall.bowlerId,
      runsScored: insertBall.runsScored || 0,
      extras: insertBall.extras || 0,
      extrasType: insertBall.extrasType || null,
      isWicket: insertBall.isWicket || false,
      wicketType: insertBall.wicketType || null,
      playerOutId: insertBall.playerOutId || null,
      fielderId: insertBall.fielderId || null,
      commentary: insertBall.commentary || null,
      shotType: insertBall.shotType || null,
      shotDirection: insertBall.shotDirection || null,
      shotDistance: insertBall.shotDistance || null,
      ballType: insertBall.ballType || null,
      ballSpeed: insertBall.ballSpeed || null,
      createdAt: new Date()
    };
    
    this.ballByBalls.set(id, ball);
    return ball;
  }
  
  async getMatchBalls(matchId: number): Promise<BallByBall[]> {
    return Array.from(this.ballByBalls.values())
      .filter(ball => ball.matchId === matchId)
      .sort((a, b) => {
        // Sort by innings, over, and ball
        if (a.innings !== b.innings) {
          return a.innings - b.innings;
        }
        if (a.over !== b.over) {
          return a.over - b.over;
        }
        return a.ball - b.ball;
      });
  }
  
  // Content categorization and discovery system methods
  async createTag(insertTag: InsertTag): Promise<Tag> {
    const id = this.tagCurrentId++;
    const tag: Tag = {
      id,
      name: insertTag.name,
      description: insertTag.description || null,
      type: insertTag.type,
      popularityScore: insertTag.popularityScore || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.tags.set(id, tag);
    return tag;
  }
  
  async getTags(type?: string): Promise<Tag[]> {
    const allTags = Array.from(this.tags.values());
    if (type) {
      return allTags.filter(tag => tag.type === type);
    }
    return allTags;
  }
  
  async getTagById(id: number): Promise<Tag | undefined> {
    return this.tags.get(id);
  }
  
  async updateTagPopularity(id: number, increment: number): Promise<Tag | undefined> {
    const tag = await this.getTagById(id);
    if (!tag) return undefined;
    
    const updatedTag = { 
      ...tag, 
      popularityScore: tag.popularityScore + increment,
      updatedAt: new Date()
    };
    this.tags.set(id, updatedTag);
    return updatedTag;
  }
  
  async addPostTag(insertPostTag: InsertPostTag): Promise<PostTag> {
    const compositeKey = `${insertPostTag.postId}-${insertPostTag.tagId}`;
    
    // Check if tag association already exists
    const existingPostTag = this.postTags.get(compositeKey);
    if (existingPostTag) return existingPostTag;
    
    const postTag: PostTag = {
      postId: insertPostTag.postId,
      tagId: insertPostTag.tagId,
      createdAt: new Date()
    };
    
    this.postTags.set(compositeKey, postTag);
    
    // Increment the tag's popularity
    await this.updateTagPopularity(insertPostTag.tagId, 1);
    
    return postTag;
  }
  
  async getPostTags(postId: number): Promise<Tag[]> {
    const tagIds = Array.from(this.postTags.values())
      .filter(postTag => postTag.postId === postId)
      .map(postTag => postTag.tagId);
    
    return Promise.all(tagIds.map(id => this.getTagById(id))) as Promise<Tag[]>;
  }
  
  async removePostTag(postId: number, tagId: number): Promise<boolean> {
    const compositeKey = `${postId}-${tagId}`;
    const success = this.postTags.delete(compositeKey);
    
    if (success) {
      // Decrement the tag's popularity
      await this.updateTagPopularity(tagId, -1);
    }
    
    return success;
  }
  
  async createContentCategory(insertCategory: InsertContentCategory): Promise<ContentCategory> {
    const id = this.contentCategoryCurrentId++;
    const category: ContentCategory = {
      id,
      name: insertCategory.name,
      description: insertCategory.description || null,
      iconUrl: insertCategory.iconUrl || null,
      priority: insertCategory.priority || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.contentCategories.set(id, category);
    return category;
  }
  
  async getContentCategories(): Promise<ContentCategory[]> {
    return Array.from(this.contentCategories.values())
      .sort((a, b) => b.priority - a.priority);
  }
  
  async updateUserInterest(insertInterest: InsertUserInterest): Promise<UserInterest> {
    const compositeKey = `${insertInterest.userId}-${insertInterest.tagId}`;
    
    // Check if interest already exists
    const existingInterest = this.userInterests.get(compositeKey);
    
    const interest: UserInterest = existingInterest ? {
      ...existingInterest,
      interactionScore: insertInterest.interactionScore || existingInterest.interactionScore,
      updatedAt: new Date()
    } : {
      userId: insertInterest.userId,
      tagId: insertInterest.tagId,
      interactionScore: insertInterest.interactionScore || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.userInterests.set(compositeKey, interest);
    return interest;
  }
  
  async getUserInterests(userId: number): Promise<(UserInterest & { tag: Tag })[]> {
    const interests = Array.from(this.userInterests.values())
      .filter(interest => interest.userId === userId);
    
    return Promise.all(interests.map(async interest => {
      const tag = await this.getTagById(interest.tagId) as Tag;
      return { ...interest, tag };
    }));
  }
  
  async recordContentEngagement(insertEngagement: InsertContentEngagement): Promise<ContentEngagement> {
    const id = this.contentEngagementCurrentId++;
    const engagement: ContentEngagement = {
      id,
      userId: insertEngagement.userId,
      postId: insertEngagement.postId,
      engagementType: insertEngagement.engagementType,
      engagementScore: insertEngagement.engagementScore || 0,
      duration: insertEngagement.duration || null,
      createdAt: new Date()
    };
    this.contentEngagements.set(id, engagement);
    
    // Update user interests based on post tags
    const postTags = await this.getPostTags(insertEngagement.postId);
    
    for (const tag of postTags) {
      // Calculate an interaction score based on engagement type
      let interactionScore = 0;
      switch (insertEngagement.engagementType) {
        case 'view':
          interactionScore = 0.1;
          break;
        case 'like':
          interactionScore = 0.3;
          break;
        case 'comment':
          interactionScore = 0.5;
          break;
        case 'share':
          interactionScore = 0.7;
          break;
        case 'save':
          interactionScore = 0.8;
          break;
        case 'time_spent':
          // Calculate based on duration (0-1 range)
          const durationMinutes = (insertEngagement.duration || 0) / 60;
          interactionScore = Math.min(durationMinutes / 5, 1) * 0.6; // Max score at 5 minutes
          break;
      }
      
      // Get existing interest or create new one
      const existingInterest = Array.from(this.userInterests.values())
        .find(i => i.userId === insertEngagement.userId && i.tagId === tag.id);
      
      if (existingInterest) {
        // Smooth update with more weight for new interaction
        const newScore = existingInterest.interactionScore * 0.7 + interactionScore * 0.3;
        await this.updateUserInterest({
          userId: insertEngagement.userId,
          tagId: tag.id,
          interactionScore: newScore
        });
      } else {
        // Create new interest
        await this.updateUserInterest({
          userId: insertEngagement.userId,
          tagId: tag.id,
          interactionScore
        });
      }
    }
    
    return engagement;
  }
  
  async getContentEngagementForUser(userId: number): Promise<ContentEngagement[]> {
    return Array.from(this.contentEngagements.values())
      .filter(engagement => engagement.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }
  
  async getPersonalizedFeed(userId: number, limit: number = 20): Promise<(Post & { 
    user: User, 
    likeCount: number, 
    commentCount: number, 
    hasLiked: boolean,
    tags: Tag[],
    relevanceScore: number
  })[]> {
    // Get all user interests
    const userInterests = await this.getUserInterests(userId);
    
    // Get following IDs
    const followingIds = Array.from(this.follows.values())
      .filter(follow => follow.followerId === userId)
      .map(follow => follow.followingId);
    
    // Include user's own posts
    followingIds.push(userId);
    
    // Get recent posts from all users (not just following, to expand discovery)
    const allRecentPosts = Array.from(this.posts.values())
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, 100); // Start with a larger pool to apply personalization
    
    // Calculate relevance score for each post
    const postsWithScore = await Promise.all(allRecentPosts.map(async post => {
      const user = await this.getUser(post.userId) as User;
      const likes = await this.getLikesForPost(post.id);
      const comments = await this.getCommentsForPost(post.id);
      const hasLiked = !!(await this.getLike(userId, post.id));
      const tags = await this.getPostTags(post.id);
      
      // Calculate relevance score based on:
      // 1. Creator follows (higher if you follow the creator)
      // 2. Interest matching (based on tags)
      // 3. Popularity (likes, comments)
      // 4. Recency
      
      let relevanceScore = 0;
      
      // Creator follow boost (0-30 points)
      if (followingIds.includes(post.userId)) {
        relevanceScore += 30;
      }
      
      // Interest matching (0-40 points)
      const tagInterestScore = tags.reduce((score, tag) => {
        const matchingInterest = userInterests.find(i => i.tagId === tag.id);
        return score + (matchingInterest ? matchingInterest.interactionScore * 40 : 0);
      }, 0);
      relevanceScore += Math.min(tagInterestScore, 40); // Cap at 40
      
      // Popularity score (0-20 points)
      const popularityScore = (likes.length * 2 + comments.length * 3) / 10;
      relevanceScore += Math.min(popularityScore, 20); // Cap at 20
      
      // Recency score (0-10 points)
      const ageInHours = ((new Date()).getTime() - (post.createdAt?.getTime() || 0)) / (1000 * 60 * 60);
      const recencyScore = Math.max(0, 10 - ageInHours / 12); // Decrease score over time, lowest after 5 days
      relevanceScore += recencyScore;
      
      return {
        ...post,
        user,
        likeCount: likes.length,
        commentCount: comments.length,
        hasLiked,
        tags,
        relevanceScore
      };
    }));
    
    // Sort by relevance score and take the top 'limit' posts
    return postsWithScore
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
