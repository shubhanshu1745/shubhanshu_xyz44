import { 
  users,
  posts,
  tags,
  postTags,
  follows,
  blockedUsers,
  type User,
  type Post
} from "@shared/schema";
import { db } from "../db";
import { eq, and, or, ilike, desc, sql, ne, notInArray, inArray } from "drizzle-orm";

export interface SearchFilters {
  contentType?: "all" | "posts" | "users" | "hashtags" | "reels";
  category?: string;
  location?: string;
  dateRange?: { start: Date; end: Date };
  hasMedia?: boolean;
  verified?: boolean;
  sortBy?: "relevance" | "recent" | "popular";
}

export interface UserSearchResult {
  id: number;
  username: string;
  fullName: string | null;
  profileImage: string | null;
  bio: string | null;
  isVerified: boolean;
  isFollowing: boolean;
  followerCount: number;
  relevanceScore: number;
}

export interface PostSearchResult {
  id: number;
  content: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  category: string | null;
  location: string | null;
  createdAt: Date | null;
  user: {
    id: number;
    username: string;
    profileImage: string | null;
  };
  likeCount: number;
  commentCount: number;
  relevanceScore: number;
}

export interface HashtagSearchResult {
  id: number;
  name: string;
  postCount: number;
  trendingScore: number;
}

export interface SearchResults {
  users: UserSearchResult[];
  posts: PostSearchResult[];
  hashtags: HashtagSearchResult[];
  totalResults: number;
  hasMore: boolean;
}

export interface SearchSuggestion {
  type: "user" | "hashtag" | "keyword";
  value: string;
  displayText: string;
  metadata?: Record<string, unknown>;
}

export class SearchService {
  
  // Main search function with comprehensive filtering
  async search(
    query: string,
    currentUserId: number,
    filters: SearchFilters = {},
    limit: number = 20,
    offset: number = 0
  ): Promise<SearchResults> {
    const searchTerm = query.trim().toLowerCase();
    const blockedUserIds = await this.getBlockedUserIds(currentUserId);
    
    const results: SearchResults = {
      users: [],
      posts: [],
      hashtags: [],
      totalResults: 0,
      hasMore: false
    };

    // Search based on content type filter
    const contentType = filters.contentType || "all";

    if (contentType === "all" || contentType === "users") {
      results.users = await this.searchUsers(searchTerm, currentUserId, blockedUserIds, filters, limit, offset);
    }

    if (contentType === "all" || contentType === "posts" || contentType === "reels") {
      results.posts = await this.searchPosts(searchTerm, currentUserId, blockedUserIds, filters, limit, offset);
    }

    if (contentType === "all" || contentType === "hashtags") {
      results.hashtags = await this.searchHashtags(searchTerm, limit, offset);
    }

    results.totalResults = results.users.length + results.posts.length + results.hashtags.length;
    results.hasMore = results.totalResults >= limit;

    return results;
  }

  // Search users with relevance ranking
  async searchUsers(
    query: string,
    currentUserId: number,
    blockedUserIds: number[],
    filters: SearchFilters,
    limit: number,
    offset: number
  ): Promise<UserSearchResult[]> {
    const searchPattern = `%${query}%`;

    // Build base query
    let baseConditions = or(
      ilike(users.username, searchPattern),
      ilike(users.fullName, searchPattern),
      ilike(users.bio, searchPattern)
    );

    // Exclude blocked users and self
    const excludeIds = [...blockedUserIds, currentUserId];

    const userResults = await db.select({
      id: users.id,
      username: users.username,
      fullName: users.fullName,
      profileImage: users.profileImage,
      bio: users.bio,
      isVerified: users.verificationBadge
    })
    .from(users)
    .where(and(
      baseConditions,
      excludeIds.length > 0 ? notInArray(users.id, excludeIds) : sql`1=1`,
      filters.verified ? eq(users.verificationBadge, true) : sql`1=1`
    ))
    .limit(limit)
    .offset(offset);

    // Enrich with follower data and following status
    const enrichedResults: UserSearchResult[] = [];
    
    for (const user of userResults) {
      const [followerData] = await db.select({ count: sql<number>`count(*)` })
        .from(follows)
        .where(and(
          eq(follows.followingId, user.id),
          eq(follows.status, "accepted")
        ));

      const [followingStatus] = await db.select({ id: follows.id })
        .from(follows)
        .where(and(
          eq(follows.followerId, currentUserId),
          eq(follows.followingId, user.id),
          eq(follows.status, "accepted")
        ))
        .limit(1);

      // Calculate relevance score
      const relevanceScore = this.calculateUserRelevance(user, query);

      enrichedResults.push({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        profileImage: user.profileImage,
        bio: user.bio,
        isVerified: user.isVerified || false,
        isFollowing: !!followingStatus,
        followerCount: Number(followerData?.count || 0),
        relevanceScore
      });
    }

    // Sort by relevance
    return enrichedResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }


  // Search posts with filtering
  async searchPosts(
    query: string,
    currentUserId: number,
    blockedUserIds: number[],
    filters: SearchFilters,
    limit: number,
    offset: number
  ): Promise<PostSearchResult[]> {
    const searchPattern = `%${query}%`;

    // Build conditions
    const conditions = [
      or(
        ilike(posts.content, searchPattern),
        ilike(posts.location, searchPattern),
        ilike(posts.category, searchPattern)
      )
    ];

    // Exclude posts from blocked users
    if (blockedUserIds.length > 0) {
      conditions.push(notInArray(posts.userId, blockedUserIds));
    }

    // Filter by category
    if (filters.category) {
      conditions.push(eq(posts.category, filters.category));
    }

    // Filter by location
    if (filters.location) {
      conditions.push(ilike(posts.location, `%${filters.location}%`));
    }

    // Filter by media type (reels)
    if (filters.contentType === "reels") {
      conditions.push(sql`${posts.videoUrl} IS NOT NULL`);
    }

    // Filter by has media
    if (filters.hasMedia) {
      conditions.push(or(
        sql`${posts.imageUrl} IS NOT NULL`,
        sql`${posts.videoUrl} IS NOT NULL`
      ));
    }

    // Filter by date range
    if (filters.dateRange) {
      conditions.push(sql`${posts.createdAt} >= ${filters.dateRange.start}`);
      conditions.push(sql`${posts.createdAt} <= ${filters.dateRange.end}`);
    }

    // Determine sort order
    let orderBy = desc(posts.createdAt);
    if (filters.sortBy === "popular") {
      // Will sort by engagement after fetching
    }

    const postResults = await db.select({
      id: posts.id,
      content: posts.content,
      imageUrl: posts.imageUrl,
      videoUrl: posts.videoUrl,
      category: posts.category,
      location: posts.location,
      createdAt: posts.createdAt,
      userId: posts.userId
    })
    .from(posts)
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

    // Enrich with user data and engagement metrics
    const enrichedResults: PostSearchResult[] = [];

    for (const post of postResults) {
      const [user] = await db.select({
        id: users.id,
        username: users.username,
        profileImage: users.profileImage
      })
      .from(users)
      .where(eq(users.id, post.userId))
      .limit(1);

      // Get engagement counts (simplified - in production use aggregates)
      const likeCount = 0; // Would query likes table
      const commentCount = 0; // Would query comments table

      const relevanceScore = this.calculatePostRelevance(post, query);

      enrichedResults.push({
        id: post.id,
        content: post.content,
        imageUrl: post.imageUrl,
        videoUrl: post.videoUrl,
        category: post.category,
        location: post.location,
        createdAt: post.createdAt,
        user: user || { id: 0, username: "unknown", profileImage: null },
        likeCount,
        commentCount,
        relevanceScore
      });
    }

    // Sort by relevance or popularity
    if (filters.sortBy === "popular") {
      return enrichedResults.sort((a, b) => (b.likeCount + b.commentCount) - (a.likeCount + a.commentCount));
    }
    
    return enrichedResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }


  // Search hashtags/tags
  async searchHashtags(
    query: string,
    limit: number,
    offset: number
  ): Promise<HashtagSearchResult[]> {
    const searchPattern = `%${query}%`;

    const tagResults = await db.select({
      id: tags.id,
      name: tags.name,
      popularityScore: tags.popularityScore
    })
    .from(tags)
    .where(ilike(tags.name, searchPattern))
    .orderBy(desc(tags.popularityScore))
    .limit(limit)
    .offset(offset);

    // Get post counts for each tag
    const enrichedResults: HashtagSearchResult[] = [];

    for (const tag of tagResults) {
      const [postCount] = await db.select({ count: sql<number>`count(*)` })
        .from(postTags)
        .where(eq(postTags.tagId, tag.id));

      enrichedResults.push({
        id: tag.id,
        name: tag.name,
        postCount: Number(postCount?.count || 0),
        trendingScore: tag.popularityScore || 0
      });
    }

    return enrichedResults;
  }

  // Get search suggestions for autocomplete
  async getSearchSuggestions(
    query: string,
    currentUserId: number,
    limit: number = 10
  ): Promise<SearchSuggestion[]> {
    const searchPattern = `%${query}%`;
    const suggestions: SearchSuggestion[] = [];
    const blockedUserIds = await this.getBlockedUserIds(currentUserId);
    const excludeIds = [...blockedUserIds, currentUserId];

    // Get user suggestions
    const userSuggestions = await db.select({
      id: users.id,
      username: users.username,
      fullName: users.fullName,
      profileImage: users.profileImage
    })
    .from(users)
    .where(and(
      or(
        ilike(users.username, searchPattern),
        ilike(users.fullName, searchPattern)
      ),
      excludeIds.length > 0 ? notInArray(users.id, excludeIds) : sql`1=1`
    ))
    .limit(Math.floor(limit / 2));

    for (const user of userSuggestions) {
      suggestions.push({
        type: "user",
        value: user.username,
        displayText: user.fullName ? `${user.username} (${user.fullName})` : user.username,
        metadata: { id: user.id, profileImage: user.profileImage }
      });
    }

    // Get hashtag suggestions
    const hashtagSuggestions = await db.select({
      id: tags.id,
      name: tags.name,
      popularityScore: tags.popularityScore
    })
    .from(tags)
    .where(ilike(tags.name, searchPattern))
    .orderBy(desc(tags.popularityScore))
    .limit(Math.floor(limit / 2));

    for (const tag of hashtagSuggestions) {
      suggestions.push({
        type: "hashtag",
        value: tag.name,
        displayText: `#${tag.name}`,
        metadata: { id: tag.id, popularity: tag.popularityScore }
      });
    }

    return suggestions;
  }

  // Get recent searches for a user
  async getRecentSearches(userId: number, limit: number = 10): Promise<SearchSuggestion[]> {
    // In a production system, this would query a search_history table
    // For now, return empty array as placeholder
    return [];
  }

  // Save a search to history
  async saveSearchHistory(userId: number, query: string, resultType: string): Promise<void> {
    // In a production system, this would insert into a search_history table
    // Placeholder for now
  }

  // Clear search history
  async clearSearchHistory(userId: number): Promise<void> {
    // In a production system, this would delete from search_history table
    // Placeholder for now
  }


  // Get trending searches
  async getTrendingSearches(limit: number = 10): Promise<string[]> {
    // Get most popular tags as trending
    const trendingTags = await db.select({ name: tags.name })
      .from(tags)
      .orderBy(desc(tags.popularityScore))
      .limit(limit);

    return trendingTags.map((t: { name: string }) => t.name);
  }

  // Search by hashtag
  async searchByHashtag(
    hashtag: string,
    currentUserId: number,
    limit: number = 20,
    offset: number = 0
  ): Promise<PostSearchResult[]> {
    const blockedUserIds = await this.getBlockedUserIds(currentUserId);
    const cleanHashtag = hashtag.replace(/^#/, "").toLowerCase();

    // Find the tag
    const [tag] = await db.select({ id: tags.id })
      .from(tags)
      .where(ilike(tags.name, cleanHashtag))
      .limit(1);

    if (!tag) {
      return [];
    }

    // Get posts with this tag
    const taggedPostIds = await db.select({ postId: postTags.postId })
      .from(postTags)
      .where(eq(postTags.tagId, tag.id));

    if (taggedPostIds.length === 0) {
      return [];
    }

    const postIds = taggedPostIds.map((p: { postId: number }) => p.postId);

    // Build conditions
    const conditions = [inArray(posts.id, postIds)];
    if (blockedUserIds.length > 0) {
      conditions.push(notInArray(posts.userId, blockedUserIds));
    }

    const postResults = await db.select({
      id: posts.id,
      content: posts.content,
      imageUrl: posts.imageUrl,
      videoUrl: posts.videoUrl,
      category: posts.category,
      location: posts.location,
      createdAt: posts.createdAt,
      userId: posts.userId
    })
    .from(posts)
    .where(and(...conditions))
    .orderBy(desc(posts.createdAt))
    .limit(limit)
    .offset(offset);

    // Enrich results
    const enrichedResults: PostSearchResult[] = [];

    for (const post of postResults) {
      const [user] = await db.select({
        id: users.id,
        username: users.username,
        profileImage: users.profileImage
      })
      .from(users)
      .where(eq(users.id, post.userId))
      .limit(1);

      enrichedResults.push({
        id: post.id,
        content: post.content,
        imageUrl: post.imageUrl,
        videoUrl: post.videoUrl,
        category: post.category,
        location: post.location,
        createdAt: post.createdAt,
        user: user || { id: 0, username: "unknown", profileImage: null },
        likeCount: 0,
        commentCount: 0,
        relevanceScore: 1
      });
    }

    return enrichedResults;
  }

  // Search by location
  async searchByLocation(
    location: string,
    currentUserId: number,
    limit: number = 20,
    offset: number = 0
  ): Promise<PostSearchResult[]> {
    const blockedUserIds = await this.getBlockedUserIds(currentUserId);
    const searchPattern = `%${location}%`;

    const conditions = [ilike(posts.location, searchPattern)];
    if (blockedUserIds.length > 0) {
      conditions.push(notInArray(posts.userId, blockedUserIds));
    }

    const postResults = await db.select({
      id: posts.id,
      content: posts.content,
      imageUrl: posts.imageUrl,
      videoUrl: posts.videoUrl,
      category: posts.category,
      location: posts.location,
      createdAt: posts.createdAt,
      userId: posts.userId
    })
    .from(posts)
    .where(and(...conditions))
    .orderBy(desc(posts.createdAt))
    .limit(limit)
    .offset(offset);

    const enrichedResults: PostSearchResult[] = [];

    for (const post of postResults) {
      const [user] = await db.select({
        id: users.id,
        username: users.username,
        profileImage: users.profileImage
      })
      .from(users)
      .where(eq(users.id, post.userId))
      .limit(1);

      enrichedResults.push({
        id: post.id,
        content: post.content,
        imageUrl: post.imageUrl,
        videoUrl: post.videoUrl,
        category: post.category,
        location: post.location,
        createdAt: post.createdAt,
        user: user || { id: 0, username: "unknown", profileImage: null },
        likeCount: 0,
        commentCount: 0,
        relevanceScore: 1
      });
    }

    return enrichedResults;
  }


  // Helper: Get blocked user IDs
  private async getBlockedUserIds(userId: number): Promise<number[]> {
    const blocked = await db.select({ blockedId: blockedUsers.blockedId })
      .from(blockedUsers)
      .where(eq(blockedUsers.blockerId, userId));

    const blockedBy = await db.select({ blockerId: blockedUsers.blockerId })
      .from(blockedUsers)
      .where(eq(blockedUsers.blockedId, userId));

    return [
      ...blocked.map((b: { blockedId: number }) => b.blockedId),
      ...blockedBy.map((b: { blockerId: number }) => b.blockerId)
    ];
  }

  // Helper: Calculate user relevance score
  private calculateUserRelevance(
    user: { username: string; fullName: string | null; bio: string | null },
    query: string
  ): number {
    let score = 0;
    const lowerQuery = query.toLowerCase();

    // Exact username match
    if (user.username.toLowerCase() === lowerQuery) {
      score += 100;
    }
    // Username starts with query
    else if (user.username.toLowerCase().startsWith(lowerQuery)) {
      score += 75;
    }
    // Username contains query
    else if (user.username.toLowerCase().includes(lowerQuery)) {
      score += 50;
    }

    // Full name match
    if (user.fullName) {
      if (user.fullName.toLowerCase() === lowerQuery) {
        score += 80;
      } else if (user.fullName.toLowerCase().includes(lowerQuery)) {
        score += 30;
      }
    }

    // Bio contains query
    if (user.bio && user.bio.toLowerCase().includes(lowerQuery)) {
      score += 10;
    }

    return score;
  }

  // Helper: Calculate post relevance score
  private calculatePostRelevance(
    post: { content: string | null; location: string | null; category: string | null },
    query: string
  ): number {
    let score = 0;
    const lowerQuery = query.toLowerCase();

    // Content relevance
    if (post.content) {
      const content = post.content.toLowerCase();
      // Count occurrences
      const occurrences = (content.match(new RegExp(lowerQuery, "g")) || []).length;
      score += occurrences * 10;

      // Bonus for query at start
      if (content.startsWith(lowerQuery)) {
        score += 20;
      }
    }

    // Location match
    if (post.location && post.location.toLowerCase().includes(lowerQuery)) {
      score += 15;
    }

    // Category match
    if (post.category && post.category.toLowerCase().includes(lowerQuery)) {
      score += 25;
    }

    return score;
  }

  // Advanced search with multiple criteria
  async advancedSearch(
    currentUserId: number,
    options: {
      query?: string;
      username?: string;
      hashtags?: string[];
      location?: string;
      category?: string;
      dateFrom?: Date;
      dateTo?: Date;
      hasImage?: boolean;
      hasVideo?: boolean;
      minLikes?: number;
      verified?: boolean;
    },
    limit: number = 20,
    offset: number = 0
  ): Promise<SearchResults> {
    const blockedUserIds = await this.getBlockedUserIds(currentUserId);
    
    const results: SearchResults = {
      users: [],
      posts: [],
      hashtags: [],
      totalResults: 0,
      hasMore: false
    };

    // Search users if username provided
    if (options.username) {
      results.users = await this.searchUsers(
        options.username,
        currentUserId,
        blockedUserIds,
        { verified: options.verified },
        limit,
        offset
      );
    }

    // Build post search conditions
    const postConditions: ReturnType<typeof sql>[] = [];

    if (options.query) {
      postConditions.push(ilike(posts.content, `%${options.query}%`));
    }

    if (options.location) {
      postConditions.push(ilike(posts.location, `%${options.location}%`));
    }

    if (options.category) {
      postConditions.push(eq(posts.category, options.category));
    }

    if (options.dateFrom) {
      postConditions.push(sql`${posts.createdAt} >= ${options.dateFrom}`);
    }

    if (options.dateTo) {
      postConditions.push(sql`${posts.createdAt} <= ${options.dateTo}`);
    }

    if (options.hasImage) {
      postConditions.push(sql`${posts.imageUrl} IS NOT NULL`);
    }

    if (options.hasVideo) {
      postConditions.push(sql`${posts.videoUrl} IS NOT NULL`);
    }

    if (blockedUserIds.length > 0) {
      postConditions.push(notInArray(posts.userId, blockedUserIds));
    }

    if (postConditions.length > 0) {
      const postResults = await db.select({
        id: posts.id,
        content: posts.content,
        imageUrl: posts.imageUrl,
        videoUrl: posts.videoUrl,
        category: posts.category,
        location: posts.location,
        createdAt: posts.createdAt,
        userId: posts.userId
      })
      .from(posts)
      .where(and(...postConditions))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

      for (const post of postResults) {
        const [user] = await db.select({
          id: users.id,
          username: users.username,
          profileImage: users.profileImage
        })
        .from(users)
        .where(eq(users.id, post.userId))
        .limit(1);

        results.posts.push({
          id: post.id,
          content: post.content,
          imageUrl: post.imageUrl,
          videoUrl: post.videoUrl,
          category: post.category,
          location: post.location,
          createdAt: post.createdAt,
          user: user || { id: 0, username: "unknown", profileImage: null },
          likeCount: 0,
          commentCount: 0,
          relevanceScore: 1
        });
      }
    }

    // Search hashtags if provided
    if (options.hashtags && options.hashtags.length > 0) {
      for (const hashtag of options.hashtags) {
        const hashtagResults = await this.searchHashtags(hashtag, 5, 0);
        results.hashtags.push(...hashtagResults);
      }
    }

    results.totalResults = results.users.length + results.posts.length + results.hashtags.length;
    results.hasMore = results.totalResults >= limit;

    return results;
  }
}

// Export singleton instance
export const searchService = new SearchService();
