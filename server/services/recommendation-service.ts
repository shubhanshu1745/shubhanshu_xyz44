import { 
  users,
  posts,
  likes,
  comments,
  follows,
  savedPosts,
  contentEngagement,
  userInterests,
  tags,
  postTags,
  blockedUsers,
  type Post
} from "@shared/schema";
import { db } from "../db";
import { eq, and, or, desc, sql, ne, notInArray, inArray, gt } from "drizzle-orm";

export interface RecommendedPost {
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
    isVerified: boolean;
  };
  engagementScore: number;
  relevanceScore: number;
  recommendationReason: string;
}

export interface RecommendedUser {
  id: number;
  username: string;
  fullName: string | null;
  profileImage: string | null;
  bio: string | null;
  isVerified: boolean;
  mutualFollowers: number;
  relevanceScore: number;
  recommendationReason: string;
}

export interface ExploreContent {
  trending: RecommendedPost[];
  forYou: RecommendedPost[];
  categories: { name: string; posts: RecommendedPost[] }[];
  suggestedUsers: RecommendedUser[];
}

export class RecommendationService {

  // Get personalized feed for a user
  async getPersonalizedFeed(
    userId: number,
    limit: number = 20,
    offset: number = 0
  ): Promise<RecommendedPost[]> {
    const blockedUserIds = await this.getBlockedUserIds(userId);
    const followingIds = await this.getFollowingIds(userId);
    const userInterestTags = await this.getUserInterestTags(userId);

    // Get posts from followed users (primary source)
    const followedPosts = await this.getPostsFromFollowing(
      followingIds,
      blockedUserIds,
      Math.floor(limit * 0.6),
      offset
    );

    // Get recommended posts based on interests
    const interestPosts = await this.getPostsByInterests(
      userId,
      userInterestTags,
      blockedUserIds,
      followingIds,
      Math.floor(limit * 0.3),
      0
    );

    // Get trending posts
    const trendingPosts = await this.getTrendingPosts(
      blockedUserIds,
      [...followingIds, userId],
      Math.floor(limit * 0.1),
      0
    );

    // Combine and deduplicate
    const allPosts = [...followedPosts, ...interestPosts, ...trendingPosts];
    const uniquePosts = this.deduplicatePosts(allPosts);

    // Sort by combined score
    return uniquePosts
      .sort((a, b) => (b.engagementScore + b.relevanceScore) - (a.engagementScore + a.relevanceScore))
      .slice(0, limit);
  }

  // Get explore page content
  async getExploreContent(userId: number): Promise<ExploreContent> {
    const blockedUserIds = await this.getBlockedUserIds(userId);
    const followingIds = await this.getFollowingIds(userId);
    const excludeIds = [...followingIds, userId];

    // Get trending posts
    const trending = await this.getTrendingPosts(blockedUserIds, excludeIds, 10, 0);

    // Get personalized "For You" posts
    const forYou = await this.getForYouPosts(userId, blockedUserIds, excludeIds, 20, 0);

    // Get posts by category
    const categories = await this.getPostsByCategories(blockedUserIds, 5);

    // Get suggested users
    const suggestedUsers = await this.getSuggestedUsers(userId, blockedUserIds, followingIds, 10);

    return { trending, forYou, categories, suggestedUsers };
  }

  // Get posts from users the current user follows
  private async getPostsFromFollowing(
    followingIds: number[],
    blockedUserIds: number[],
    limit: number,
    offset: number
  ): Promise<RecommendedPost[]> {
    if (followingIds.length === 0) return [];

    const conditions = [inArray(posts.userId, followingIds)];
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

    return this.enrichPosts(postResults, "From people you follow");
  }


  // Get posts based on user interests
  private async getPostsByInterests(
    userId: number,
    interestTagIds: number[],
    blockedUserIds: number[],
    excludeUserIds: number[],
    limit: number,
    offset: number
  ): Promise<RecommendedPost[]> {
    if (interestTagIds.length === 0) return [];

    // Get posts with matching tags
    const taggedPostIds = await db.select({ postId: postTags.postId })
      .from(postTags)
      .where(inArray(postTags.tagId, interestTagIds));

    if (taggedPostIds.length === 0) return [];

    const postIds = taggedPostIds.map((p: { postId: number }) => p.postId);
    const allExcludeIds = [...excludeUserIds, userId];

    const conditions = [
      inArray(posts.id, postIds),
      notInArray(posts.userId, allExcludeIds)
    ];
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

    return this.enrichPosts(postResults, "Based on your interests");
  }

  // Get trending posts
  private async getTrendingPosts(
    blockedUserIds: number[],
    excludeUserIds: number[],
    limit: number,
    offset: number
  ): Promise<RecommendedPost[]> {
    // Get posts from last 24 hours with high engagement
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const conditions = [gt(posts.createdAt, oneDayAgo)];
    if (blockedUserIds.length > 0) {
      conditions.push(notInArray(posts.userId, blockedUserIds));
    }
    if (excludeUserIds.length > 0) {
      conditions.push(notInArray(posts.userId, excludeUserIds));
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
    .limit(limit * 3) // Get more to filter by engagement
    .offset(offset);

    const enriched = await this.enrichPosts(postResults, "Trending");
    
    // Sort by engagement and return top results
    return enriched
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, limit);
  }

  // Get "For You" personalized posts
  private async getForYouPosts(
    userId: number,
    blockedUserIds: number[],
    excludeUserIds: number[],
    limit: number,
    offset: number
  ): Promise<RecommendedPost[]> {
    // Get user's engagement history to understand preferences
    const engagementHistory = await db.select({
      postId: contentEngagement.postId,
      engagementType: contentEngagement.engagementType
    })
    .from(contentEngagement)
    .where(eq(contentEngagement.userId, userId))
    .orderBy(desc(contentEngagement.createdAt))
    .limit(50);

    // Get categories from engaged posts
    const engagedPostIds = engagementHistory.map((e: { postId: number }) => e.postId);
    
    let preferredCategories: string[] = [];
    if (engagedPostIds.length > 0) {
      const engagedPosts = await db.select({ category: posts.category })
        .from(posts)
        .where(inArray(posts.id, engagedPostIds));
      
      preferredCategories = engagedPosts
        .map((p: { category: string | null }) => p.category)
        .filter((c: string | null): c is string => c !== null);
    }

    // Build query for similar content
    const conditions = [];
    if (preferredCategories.length > 0) {
      conditions.push(inArray(posts.category, preferredCategories));
    }
    if (blockedUserIds.length > 0) {
      conditions.push(notInArray(posts.userId, blockedUserIds));
    }
    if (excludeUserIds.length > 0) {
      conditions.push(notInArray(posts.userId, excludeUserIds));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : sql`1=1`;

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
    .where(whereClause)
    .orderBy(desc(posts.createdAt))
    .limit(limit)
    .offset(offset);

    return this.enrichPosts(postResults, "For you");
  }


  // Get posts organized by categories
  private async getPostsByCategories(
    blockedUserIds: number[],
    postsPerCategory: number
  ): Promise<{ name: string; posts: RecommendedPost[] }[]> {
    const categories = ["match_discussion", "player_highlight", "news", "opinion", "meme", "reel"];
    const result: { name: string; posts: RecommendedPost[] }[] = [];

    for (const category of categories) {
      const conditions = [eq(posts.category, category)];
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
      .limit(postsPerCategory);

      const enriched = await this.enrichPosts(postResults, `Popular in ${category}`);
      
      if (enriched.length > 0) {
        result.push({ name: category, posts: enriched });
      }
    }

    return result;
  }

  // Get suggested users to follow
  async getSuggestedUsers(
    userId: number,
    blockedUserIds: number[],
    followingIds: number[],
    limit: number
  ): Promise<RecommendedUser[]> {
    const excludeIds = [...blockedUserIds, ...followingIds, userId];

    // Get users followed by people you follow (mutual connections)
    const mutualSuggestions = await this.getMutualFollowSuggestions(
      userId,
      followingIds,
      excludeIds,
      Math.floor(limit * 0.6)
    );

    // Get popular users
    const popularUsers = await this.getPopularUsers(
      excludeIds,
      Math.floor(limit * 0.4)
    );

    // Combine and deduplicate
    const allUsers = [...mutualSuggestions, ...popularUsers];
    const seen = new Set<number>();
    const uniqueUsers: RecommendedUser[] = [];

    for (const user of allUsers) {
      if (!seen.has(user.id)) {
        seen.add(user.id);
        uniqueUsers.push(user);
      }
    }

    return uniqueUsers.slice(0, limit);
  }

  // Get suggestions based on mutual follows
  private async getMutualFollowSuggestions(
    userId: number,
    followingIds: number[],
    excludeIds: number[],
    limit: number
  ): Promise<RecommendedUser[]> {
    if (followingIds.length === 0) return [];

    // Get users that your friends follow
    const friendsFollowing = await db.select({
      followingId: follows.followingId,
      count: sql<number>`count(*)`
    })
    .from(follows)
    .where(and(
      inArray(follows.followerId, followingIds),
      eq(follows.status, "accepted"),
      excludeIds.length > 0 ? notInArray(follows.followingId, excludeIds) : sql`1=1`
    ))
    .groupBy(follows.followingId)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);

    const suggestions: RecommendedUser[] = [];

    for (const suggestion of friendsFollowing) {
      const [user] = await db.select({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        profileImage: users.profileImage,
        bio: users.bio,
        isVerified: users.verificationBadge
      })
      .from(users)
      .where(eq(users.id, suggestion.followingId))
      .limit(1);

      if (user) {
        suggestions.push({
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          profileImage: user.profileImage,
          bio: user.bio,
          isVerified: user.isVerified || false,
          mutualFollowers: Number(suggestion.count),
          relevanceScore: Number(suggestion.count) * 10,
          recommendationReason: `Followed by ${suggestion.count} people you follow`
        });
      }
    }

    return suggestions;
  }

  // Get popular users
  private async getPopularUsers(
    excludeIds: number[],
    limit: number
  ): Promise<RecommendedUser[]> {
    // Get users with most followers
    const popularUserIds = await db.select({
      followingId: follows.followingId,
      count: sql<number>`count(*)`
    })
    .from(follows)
    .where(and(
      eq(follows.status, "accepted"),
      excludeIds.length > 0 ? notInArray(follows.followingId, excludeIds) : sql`1=1`
    ))
    .groupBy(follows.followingId)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);

    const suggestions: RecommendedUser[] = [];

    for (const popular of popularUserIds) {
      const [user] = await db.select({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        profileImage: users.profileImage,
        bio: users.bio,
        isVerified: users.verificationBadge
      })
      .from(users)
      .where(eq(users.id, popular.followingId))
      .limit(1);

      if (user) {
        suggestions.push({
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          profileImage: user.profileImage,
          bio: user.bio,
          isVerified: user.isVerified || false,
          mutualFollowers: 0,
          relevanceScore: Number(popular.count),
          recommendationReason: "Popular on CricStagram"
        });
      }
    }

    return suggestions;
  }


  // Enrich posts with user data and engagement metrics
  private async enrichPosts(
    postResults: {
      id: number;
      content: string | null;
      imageUrl: string | null;
      videoUrl: string | null;
      category: string | null;
      location: string | null;
      createdAt: Date | null;
      userId: number;
    }[],
    reason: string
  ): Promise<RecommendedPost[]> {
    const enriched: RecommendedPost[] = [];

    for (const post of postResults) {
      const [user] = await db.select({
        id: users.id,
        username: users.username,
        profileImage: users.profileImage,
        isVerified: users.verificationBadge
      })
      .from(users)
      .where(eq(users.id, post.userId))
      .limit(1);

      // Get engagement metrics
      const [likeData] = await db.select({ count: sql<number>`count(*)` })
        .from(likes)
        .where(eq(likes.postId, post.id));

      const [commentData] = await db.select({ count: sql<number>`count(*)` })
        .from(comments)
        .where(eq(comments.postId, post.id));

      const likeCount = Number(likeData?.count || 0);
      const commentCount = Number(commentData?.count || 0);
      const engagementScore = likeCount * 1 + commentCount * 2;

      // Calculate recency score
      const ageInHours = post.createdAt 
        ? (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60)
        : 0;
      const recencyScore = Math.max(0, 100 - ageInHours);

      enriched.push({
        id: post.id,
        content: post.content,
        imageUrl: post.imageUrl,
        videoUrl: post.videoUrl,
        category: post.category,
        location: post.location,
        createdAt: post.createdAt,
        user: user ? {
          id: user.id,
          username: user.username,
          profileImage: user.profileImage,
          isVerified: user.isVerified || false
        } : { id: 0, username: "unknown", profileImage: null, isVerified: false },
        engagementScore,
        relevanceScore: recencyScore,
        recommendationReason: reason
      });
    }

    return enriched;
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

  // Helper: Get following IDs
  private async getFollowingIds(userId: number): Promise<number[]> {
    const following = await db.select({ followingId: follows.followingId })
      .from(follows)
      .where(and(
        eq(follows.followerId, userId),
        eq(follows.status, "accepted")
      ));

    return following.map((f: { followingId: number }) => f.followingId);
  }

  // Helper: Get user interest tag IDs
  private async getUserInterestTags(userId: number): Promise<number[]> {
    const interests = await db.select({ tagId: userInterests.tagId })
      .from(userInterests)
      .where(eq(userInterests.userId, userId))
      .orderBy(desc(userInterests.interactionScore))
      .limit(20);

    return interests.map((i: { tagId: number }) => i.tagId);
  }

  // Helper: Deduplicate posts
  private deduplicatePosts(posts: RecommendedPost[]): RecommendedPost[] {
    const seen = new Set<number>();
    const unique: RecommendedPost[] = [];

    for (const post of posts) {
      if (!seen.has(post.id)) {
        seen.add(post.id);
        unique.push(post);
      }
    }

    return unique;
  }

  // Record user engagement for improving recommendations
  async recordEngagement(
    userId: number,
    postId: number,
    engagementType: "view" | "like" | "comment" | "share" | "save" | "time_spent",
    duration?: number
  ): Promise<void> {
    // Calculate engagement score based on type
    const scoreMap: Record<string, number> = {
      view: 0.1,
      like: 0.5,
      comment: 0.8,
      share: 1.0,
      save: 0.7,
      time_spent: 0.3
    };

    await db.insert(contentEngagement).values({
      userId,
      postId,
      engagementType,
      engagementScore: String(scoreMap[engagementType] || 0),
      duration: duration || null
    });

    // Update user interests based on post tags
    await this.updateUserInterests(userId, postId, scoreMap[engagementType] || 0);
  }

  // Update user interests based on engagement
  private async updateUserInterests(
    userId: number,
    postId: number,
    score: number
  ): Promise<void> {
    // Get tags for the post
    const postTagsResult = await db.select({ tagId: postTags.tagId })
      .from(postTags)
      .where(eq(postTags.postId, postId));

    for (const tag of postTagsResult) {
      // Check if interest exists
      const [existing] = await db.select()
        .from(userInterests)
        .where(and(
          eq(userInterests.userId, userId),
          eq(userInterests.tagId, tag.tagId)
        ))
        .limit(1);

      if (existing) {
        // Update existing interest score
        const newScore = Math.min(1, Number(existing.interactionScore || 0) + score * 0.1);
        await db.update(userInterests)
          .set({ 
            interactionScore: String(newScore),
            updatedAt: new Date()
          })
          .where(and(
            eq(userInterests.userId, userId),
            eq(userInterests.tagId, tag.tagId)
          ));
      } else {
        // Create new interest
        await db.insert(userInterests).values({
          userId,
          tagId: tag.tagId,
          interactionScore: String(score * 0.1)
        });
      }
    }
  }

  // Get similar posts to a given post
  async getSimilarPosts(
    postId: number,
    userId: number,
    limit: number = 10
  ): Promise<RecommendedPost[]> {
    const blockedUserIds = await this.getBlockedUserIds(userId);

    // Get the original post
    const [originalPost] = await db.select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!originalPost) return [];

    // Get posts with same category or tags
    const conditions = [
      ne(posts.id, postId),
      originalPost.category ? eq(posts.category, originalPost.category) : sql`1=1`
    ];
    if (blockedUserIds.length > 0) {
      conditions.push(notInArray(posts.userId, blockedUserIds));
    }

    const similarPosts = await db.select({
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
    .limit(limit);

    return this.enrichPosts(similarPosts, "Similar posts");
  }
}

// Export singleton instance
export const recommendationService = new RecommendationService();
