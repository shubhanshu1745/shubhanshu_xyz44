import { 
  users, type User, type InsertUser,
  posts, type Post, type InsertPost,
  likes, type Like, type InsertLike,
  comments, type Comment, type InsertComment,
  follows, type Follow, type InsertFollow
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
  
  // Post methods
  createPost(post: InsertPost): Promise<Post>;
  getPost(id: number): Promise<Post | undefined>;
  getUserPosts(userId: number): Promise<Post[]>;
  getFeed(userId: number, limit?: number): Promise<(Post & { user: User, likeCount: number, commentCount: number, hasLiked: boolean })[]>;
  deletePost(id: number): Promise<boolean>;
  
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

  // Session store for authentication
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private posts: Map<number, Post>;
  private likes: Map<number, Like>;
  private comments: Map<number, Comment>;
  private follows: Map<number, Follow>;
  
  userCurrentId: number;
  postCurrentId: number;
  likeCurrentId: number;
  commentCurrentId: number;
  followCurrentId: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.posts = new Map();
    this.likes = new Map();
    this.comments = new Map();
    this.follows = new Map();
    
    this.userCurrentId = 1;
    this.postCurrentId = 1;
    this.likeCurrentId = 1;
    this.commentCurrentId = 1;
    this.followCurrentId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
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
      content: insertComment.content || null,
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
}

export const storage = new MemStorage();
