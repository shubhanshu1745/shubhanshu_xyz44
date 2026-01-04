import { 
  users,
  posts,
  likes,
  comments,
  follows,
  stories,
  storyViews,
  contentEngagement,
  savedPosts,
  postShares
} from "@shared/schema";
import { db } from "../db";
import { eq, and, desc, sql, gte, lte, count, ne } from "drizzle-orm";

// User Analytics Interfaces
export interface UserAnalytics {
  userId: number;
  profileViews: number;
  followerGrowth: { date: string; count: number }[];
  followerDemographics: { category: string; count: number }[];
  topContent: { postId: number; engagement: number }[];
  engagementRate: number;
  reachEstimate: number;
}

export interface ProfileVisit {
  visitorId: number;
  visitedAt: Date;
}

// Content Analytics Interfaces
export interface ContentAnalytics {
  postId: number;
  impressions: number;
  reach: number;
  engagement: number;
  engagementRate: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  peakEngagementTime: string;
}

export interface StoryAnalytics {
  storyId: number;
  views: number;
  uniqueViewers: number;
  completionRate: number;
  replies: number;
  reactions: number;
  exitRate: number;
}

// Social Graph Analytics Interfaces
export interface SocialGraphAnalytics {
  userId: number;
  followersCount: number;
  followingCount: number;
  mutualConnections: number;
  networkReach: number;
  influenceScore: number;
  communityOverlap: { userId: number; overlap: number }[];
}

// In-memory storage for profile visits (would be database in production)
const profileVisits = new Map<number, ProfileVisit[]>();

export class AnalyticsService {

  // ==================== USER ANALYTICS ====================

  // Record profile visit
  recordProfileVisit(profileUserId: number, visitorId: number): void {
    if (profileUserId === visitorId) return; // Don't count self-visits

    const visits = profileVisits.get(profileUserId) || [];
    visits.push({ visitorId, visitedAt: new Date() });
    
    // Keep only last 1000 visits
    if (visits.length > 1000) {
      visits.shift();
    }
    
    profileVisits.set(profileUserId, visits);
  }

  // Get user analytics
  async getUserAnalytics(userId: number, days: number = 30): Promise<UserAnalytics> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Profile views
    const visits = profileVisits.get(userId) || [];
    const recentVisits = visits.filter(v => v.visitedAt >= startDate);
    const profileViews = recentVisits.length;

    // Follower growth
    const followerGrowth = await this.getFollowerGrowth(userId, days);

    // Follower demographics (by user type)
    const followerDemographics = await this.getFollowerDemographics(userId);

    // Top content
    const topContent = await this.getTopContent(userId, 5);

    // Engagement rate
    const engagementRate = await this.calculateEngagementRate(userId);

    // Reach estimate
    const reachEstimate = await this.estimateReach(userId);

    return {
      userId,
      profileViews,
      followerGrowth,
      followerDemographics,
      topContent,
      engagementRate,
      reachEstimate
    };
  }

  // Get follower growth over time
  private async getFollowerGrowth(
    userId: number,
    days: number
  ): Promise<{ date: string; count: number }[]> {
    const growth: { date: string; count: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(23, 59, 59, 999);

      const [data] = await db.select({ count: sql<number>`count(*)` })
        .from(follows)
        .where(and(
          eq(follows.followingId, userId),
          eq(follows.status, "accepted"),
          lte(follows.createdAt, date)
        ));

      growth.push({
        date: date.toISOString().split("T")[0],
        count: Number(data?.count || 0)
      });
    }

    return growth;
  }

  // Get follower demographics
  private async getFollowerDemographics(
    userId: number
  ): Promise<{ category: string; count: number }[]> {
    // Get follower IDs
    const followerIds = await db.select({ followerId: follows.followerId })
      .from(follows)
      .where(and(
        eq(follows.followingId, userId),
        eq(follows.status, "accepted")
      ));

    if (followerIds.length === 0) {
      return [];
    }

    const ids = followerIds.map((f: { followerId: number }) => f.followerId);

    // Count by user type
    const demographics: { category: string; count: number }[] = [];

    const [players] = await db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(
        sql`${users.id} = ANY(${ids})`,
        eq(users.isPlayer, true)
      ));
    if (Number(players?.count || 0) > 0) {
      demographics.push({ category: "Players", count: Number(players.count) });
    }

    const [coaches] = await db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(
        sql`${users.id} = ANY(${ids})`,
        eq(users.isCoach, true)
      ));
    if (Number(coaches?.count || 0) > 0) {
      demographics.push({ category: "Coaches", count: Number(coaches.count) });
    }

    const [fans] = await db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(
        sql`${users.id} = ANY(${ids})`,
        eq(users.isFan, true)
      ));
    if (Number(fans?.count || 0) > 0) {
      demographics.push({ category: "Fans", count: Number(fans.count) });
    }

    return demographics;
  }

  // Get top performing content
  private async getTopContent(
    userId: number,
    limit: number
  ): Promise<{ postId: number; engagement: number }[]> {
    const userPosts = await db.select({ id: posts.id })
      .from(posts)
      .where(eq(posts.userId, userId));

    const postEngagement: { postId: number; engagement: number }[] = [];

    for (const post of userPosts) {
      const [likeData] = await db.select({ count: sql<number>`count(*)` })
        .from(likes)
        .where(eq(likes.postId, post.id));

      const [commentData] = await db.select({ count: sql<number>`count(*)` })
        .from(comments)
        .where(eq(comments.postId, post.id));

      const engagement = Number(likeData?.count || 0) + Number(commentData?.count || 0) * 2;
      postEngagement.push({ postId: post.id, engagement });
    }

    return postEngagement
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, limit);
  }

  // Calculate engagement rate
  private async calculateEngagementRate(userId: number): Promise<number> {
    // Get follower count
    const [followerData] = await db.select({ count: sql<number>`count(*)` })
      .from(follows)
      .where(and(
        eq(follows.followingId, userId),
        eq(follows.status, "accepted")
      ));

    const followers = Number(followerData?.count || 0);
    if (followers === 0) return 0;

    // Get recent posts engagement
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const recentPosts = await db.select({ id: posts.id })
      .from(posts)
      .where(and(
        eq(posts.userId, userId),
        gte(posts.createdAt, thirtyDaysAgo)
      ));

    if (recentPosts.length === 0) return 0;

    let totalEngagement = 0;
    for (const post of recentPosts) {
      const [likeData] = await db.select({ count: sql<number>`count(*)` })
        .from(likes)
        .where(eq(likes.postId, post.id));

      const [commentData] = await db.select({ count: sql<number>`count(*)` })
        .from(comments)
        .where(eq(comments.postId, post.id));

      totalEngagement += Number(likeData?.count || 0) + Number(commentData?.count || 0);
    }

    const avgEngagement = totalEngagement / recentPosts.length;
    return Math.round((avgEngagement / followers) * 100 * 100) / 100;
  }

  // Estimate reach
  private async estimateReach(userId: number): Promise<number> {
    // Get follower count
    const [followerData] = await db.select({ count: sql<number>`count(*)` })
      .from(follows)
      .where(and(
        eq(follows.followingId, userId),
        eq(follows.status, "accepted")
      ));

    const followers = Number(followerData?.count || 0);
    
    // Estimate reach as followers + average shares * their followers
    // Simplified calculation
    return Math.round(followers * 1.2);
  }


  // ==================== CONTENT ANALYTICS ====================

  // Get post analytics
  async getPostAnalytics(postId: number): Promise<ContentAnalytics> {
    // Get engagement counts
    const [likeData] = await db.select({ count: sql<number>`count(*)` })
      .from(likes)
      .where(eq(likes.postId, postId));

    const [commentData] = await db.select({ count: sql<number>`count(*)` })
      .from(comments)
      .where(eq(comments.postId, postId));

    const [shareData] = await db.select({ count: sql<number>`count(*)` })
      .from(postShares)
      .where(eq(postShares.postId, postId));

    const [saveData] = await db.select({ count: sql<number>`count(*)` })
      .from(savedPosts)
      .where(eq(savedPosts.postId, postId));

    const likesCount = Number(likeData?.count || 0);
    const commentsCount = Number(commentData?.count || 0);
    const sharesCount = Number(shareData?.count || 0);
    const savesCount = Number(saveData?.count || 0);

    const engagement = likesCount + commentsCount + sharesCount + savesCount;

    // Get post owner's follower count for engagement rate
    const [post] = await db.select({ userId: posts.userId })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    let engagementRate = 0;
    if (post) {
      const [followerData] = await db.select({ count: sql<number>`count(*)` })
        .from(follows)
        .where(and(
          eq(follows.followingId, post.userId),
          eq(follows.status, "accepted")
        ));

      const followers = Number(followerData?.count || 0);
      if (followers > 0) {
        engagementRate = Math.round((engagement / followers) * 100 * 100) / 100;
      }
    }

    // Estimate impressions and reach
    const impressions = engagement * 3; // Simplified estimate
    const reach = Math.round(impressions * 0.7);

    return {
      postId,
      impressions,
      reach,
      engagement,
      engagementRate,
      likes: likesCount,
      comments: commentsCount,
      shares: sharesCount,
      saves: savesCount,
      peakEngagementTime: "18:00" // Would calculate from actual data
    };
  }

  // Get story analytics
  async getStoryAnalytics(storyId: number): Promise<StoryAnalytics> {
    // Get view count
    const [viewData] = await db.select({ count: sql<number>`count(*)` })
      .from(storyViews)
      .where(eq(storyViews.storyId, storyId));

    // Get unique viewers
    const uniqueViewers = await db.select({ userId: storyViews.userId })
      .from(storyViews)
      .where(eq(storyViews.storyId, storyId))
      .groupBy(storyViews.userId);

    const views = Number(viewData?.count || 0);
    const uniqueCount = uniqueViewers.length;

    // Simplified metrics
    return {
      storyId,
      views,
      uniqueViewers: uniqueCount,
      completionRate: 0.75, // Would calculate from actual view duration
      replies: 0,
      reactions: 0,
      exitRate: 0.25
    };
  }

  // Get content performance over time
  async getContentPerformance(
    userId: number,
    days: number = 30
  ): Promise<{ date: string; posts: number; engagement: number }[]> {
    const performance: { date: string; posts: number; engagement: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      // Posts on this day
      const dayPosts = await db.select({ id: posts.id })
        .from(posts)
        .where(and(
          eq(posts.userId, userId),
          gte(posts.createdAt, date),
          lte(posts.createdAt, nextDate)
        ));

      // Engagement on this day
      let dayEngagement = 0;
      for (const post of dayPosts) {
        const [likeData] = await db.select({ count: sql<number>`count(*)` })
          .from(likes)
          .where(eq(likes.postId, post.id));

        const [commentData] = await db.select({ count: sql<number>`count(*)` })
          .from(comments)
          .where(eq(comments.postId, post.id));

        dayEngagement += Number(likeData?.count || 0) + Number(commentData?.count || 0);
      }

      performance.push({
        date: date.toISOString().split("T")[0],
        posts: dayPosts.length,
        engagement: dayEngagement
      });
    }

    return performance;
  }


  // ==================== SOCIAL GRAPH ANALYTICS ====================

  // Get social graph analytics
  async getSocialGraphAnalytics(userId: number): Promise<SocialGraphAnalytics> {
    // Followers count
    const [followerData] = await db.select({ count: sql<number>`count(*)` })
      .from(follows)
      .where(and(
        eq(follows.followingId, userId),
        eq(follows.status, "accepted")
      ));

    // Following count
    const [followingData] = await db.select({ count: sql<number>`count(*)` })
      .from(follows)
      .where(and(
        eq(follows.followerId, userId),
        eq(follows.status, "accepted")
      ));

    const followersCount = Number(followerData?.count || 0);
    const followingCount = Number(followingData?.count || 0);

    // Mutual connections
    const mutualConnections = await this.getMutualConnectionsCount(userId);

    // Network reach (followers + their followers)
    const networkReach = await this.calculateNetworkReach(userId);

    // Influence score
    const influenceScore = this.calculateInfluenceScore(
      followersCount,
      followingCount,
      mutualConnections
    );

    // Community overlap
    const communityOverlap = await this.getCommunityOverlap(userId, 5);

    return {
      userId,
      followersCount,
      followingCount,
      mutualConnections,
      networkReach,
      influenceScore,
      communityOverlap
    };
  }

  // Get mutual connections count
  private async getMutualConnectionsCount(userId: number): Promise<number> {
    // Get users who follow this user
    const followers = await db.select({ followerId: follows.followerId })
      .from(follows)
      .where(and(
        eq(follows.followingId, userId),
        eq(follows.status, "accepted")
      ));

    // Get users this user follows
    const following = await db.select({ followingId: follows.followingId })
      .from(follows)
      .where(and(
        eq(follows.followerId, userId),
        eq(follows.status, "accepted")
      ));

    const followerIds = new Set(followers.map((f: { followerId: number }) => f.followerId));
    const followingIds = following.map((f: { followingId: number }) => f.followingId);

    // Count mutual (both follow each other)
    let mutual = 0;
    for (const id of followingIds) {
      if (followerIds.has(id)) {
        mutual++;
      }
    }

    return mutual;
  }

  // Calculate network reach
  private async calculateNetworkReach(userId: number): Promise<number> {
    // Get direct followers
    const [directData] = await db.select({ count: sql<number>`count(*)` })
      .from(follows)
      .where(and(
        eq(follows.followingId, userId),
        eq(follows.status, "accepted")
      ));

    const directFollowers = Number(directData?.count || 0);

    // Estimate second-degree reach (simplified)
    // In production, would calculate actual second-degree connections
    const secondDegreeMultiplier = 10;
    
    return directFollowers + (directFollowers * secondDegreeMultiplier);
  }

  // Calculate influence score (0-100)
  private calculateInfluenceScore(
    followers: number,
    following: number,
    mutual: number
  ): number {
    // Factors:
    // - Follower count (weighted)
    // - Follower/following ratio
    // - Mutual connections percentage

    let score = 0;

    // Follower count contribution (max 40 points)
    score += Math.min(40, Math.log10(followers + 1) * 10);

    // Ratio contribution (max 30 points)
    const ratio = following > 0 ? followers / following : followers;
    score += Math.min(30, ratio * 5);

    // Mutual connections contribution (max 30 points)
    const mutualPercentage = followers > 0 ? (mutual / followers) * 100 : 0;
    score += Math.min(30, mutualPercentage * 0.3);

    return Math.round(Math.min(100, score));
  }

  // Get community overlap with other users
  private async getCommunityOverlap(
    userId: number,
    limit: number
  ): Promise<{ userId: number; overlap: number }[]> {
    // Get this user's followers
    const userFollowers = await db.select({ followerId: follows.followerId })
      .from(follows)
      .where(and(
        eq(follows.followingId, userId),
        eq(follows.status, "accepted")
      ));

    const userFollowerIds = new Set(
      userFollowers.map((f: { followerId: number }) => f.followerId)
    );

    if (userFollowerIds.size === 0) return [];

    // Get users this user follows
    const following = await db.select({ followingId: follows.followingId })
      .from(follows)
      .where(and(
        eq(follows.followerId, userId),
        eq(follows.status, "accepted")
      ));

    const overlaps: { userId: number; overlap: number }[] = [];

    for (const f of following) {
      // Get followers of this followed user
      const theirFollowers = await db.select({ followerId: follows.followerId })
        .from(follows)
        .where(and(
          eq(follows.followingId, f.followingId),
          eq(follows.status, "accepted")
        ));

      // Calculate overlap
      let overlapCount = 0;
      for (const tf of theirFollowers) {
        if (userFollowerIds.has(tf.followerId)) {
          overlapCount++;
        }
      }

      if (overlapCount > 0) {
        overlaps.push({
          userId: f.followingId,
          overlap: overlapCount
        });
      }
    }

    return overlaps
      .sort((a, b) => b.overlap - a.overlap)
      .slice(0, limit);
  }

  // Get relationship growth
  async getRelationshipGrowth(
    userId: number,
    days: number = 30
  ): Promise<{ date: string; followers: number; following: number }[]> {
    const growth: { date: string; followers: number; following: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(23, 59, 59, 999);

      const [followerData] = await db.select({ count: sql<number>`count(*)` })
        .from(follows)
        .where(and(
          eq(follows.followingId, userId),
          eq(follows.status, "accepted"),
          lte(follows.createdAt, date)
        ));

      const [followingData] = await db.select({ count: sql<number>`count(*)` })
        .from(follows)
        .where(and(
          eq(follows.followerId, userId),
          eq(follows.status, "accepted"),
          lte(follows.createdAt, date)
        ));

      growth.push({
        date: date.toISOString().split("T")[0],
        followers: Number(followerData?.count || 0),
        following: Number(followingData?.count || 0)
      });
    }

    return growth;
  }

  // Get suggested connections based on network analysis
  async getSuggestedConnections(
    userId: number,
    limit: number = 10
  ): Promise<{ userId: number; mutualCount: number; reason: string }[]> {
    // Get users this user follows
    const following = await db.select({ followingId: follows.followingId })
      .from(follows)
      .where(and(
        eq(follows.followerId, userId),
        eq(follows.status, "accepted")
      ));

    const followingIds = following.map((f: { followingId: number }) => f.followingId);
    if (followingIds.length === 0) return [];

    // Find users followed by people this user follows
    const suggestions = new Map<number, number>();

    for (const followedId of followingIds) {
      const theirFollowing = await db.select({ followingId: follows.followingId })
        .from(follows)
        .where(and(
          eq(follows.followerId, followedId),
          eq(follows.status, "accepted"),
          ne(follows.followingId, userId)
        ))
        .limit(20);

      for (const tf of theirFollowing) {
        if (!followingIds.includes(tf.followingId)) {
          suggestions.set(
            tf.followingId,
            (suggestions.get(tf.followingId) || 0) + 1
          );
        }
      }
    }

    // Convert to array and sort
    const result: { userId: number; mutualCount: number; reason: string }[] = [];
    
    const entries = Array.from(suggestions.entries());
    for (const [suggestedUserId, mutualCount] of entries) {
      result.push({
        userId: suggestedUserId,
        mutualCount,
        reason: `Followed by ${mutualCount} people you follow`
      });
    }

    return result
      .sort((a, b) => b.mutualCount - a.mutualCount)
      .slice(0, limit);
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
