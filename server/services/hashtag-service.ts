import { 
  tags,
  postTags,
  posts,
  users,
  likes,
  comments,
  follows
} from "@shared/schema";
import { db } from "../db";
import { eq, and, desc, sql, inArray, gt, gte, lte } from "drizzle-orm";

export interface Hashtag {
  id: number;
  name: string;
  description: string | null;
  type: string;
  postCount: number;
  popularityScore: number;
  isFollowing?: boolean;
}

export interface TrendingHashtag extends Hashtag {
  trendingScore: number;
  growthRate: number;
  recentPostCount: number;
}

export interface HashtagPost {
  id: number;
  content: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  createdAt: Date | null;
  user: {
    id: number;
    username: string;
    profileImage: string | null;
  };
  likeCount: number;
  commentCount: number;
}

export interface HashtagAnalytics {
  totalPosts: number;
  postsToday: number;
  postsThisWeek: number;
  topContributors: { userId: number; username: string; postCount: number }[];
  peakHours: { hour: number; postCount: number }[];
  relatedHashtags: Hashtag[];
}

export class HashtagService {

  // Create or get a hashtag
  async createOrGetHashtag(
    name: string,
    type: string = "topic",
    description?: string
  ): Promise<Hashtag> {
    const cleanName = name.replace(/^#/, "").toLowerCase().trim();

    // Check if exists
    const [existing] = await db.select()
      .from(tags)
      .where(eq(tags.name, cleanName))
      .limit(1);

    if (existing) {
      const postCount = await this.getHashtagPostCount(existing.id);
      return {
        id: existing.id,
        name: existing.name,
        description: existing.description,
        type: existing.type,
        postCount,
        popularityScore: existing.popularityScore || 0
      };
    }

    // Create new hashtag
    const [created] = await db.insert(tags)
      .values({
        name: cleanName,
        type,
        description: description || null,
        popularityScore: 0
      })
      .returning();

    return {
      id: created.id,
      name: created.name,
      description: created.description,
      type: created.type,
      postCount: 0,
      popularityScore: 0
    };
  }

  // Get hashtag by name
  async getHashtagByName(name: string): Promise<Hashtag | null> {
    const cleanName = name.replace(/^#/, "").toLowerCase().trim();

    const [hashtag] = await db.select()
      .from(tags)
      .where(eq(tags.name, cleanName))
      .limit(1);

    if (!hashtag) return null;

    const postCount = await this.getHashtagPostCount(hashtag.id);

    return {
      id: hashtag.id,
      name: hashtag.name,
      description: hashtag.description,
      type: hashtag.type,
      postCount,
      popularityScore: hashtag.popularityScore || 0
    };
  }

  // Get hashtag by ID
  async getHashtagById(id: number): Promise<Hashtag | null> {
    const [hashtag] = await db.select()
      .from(tags)
      .where(eq(tags.id, id))
      .limit(1);

    if (!hashtag) return null;

    const postCount = await this.getHashtagPostCount(hashtag.id);

    return {
      id: hashtag.id,
      name: hashtag.name,
      description: hashtag.description,
      type: hashtag.type,
      postCount,
      popularityScore: hashtag.popularityScore || 0
    };
  }

  // Add hashtag to a post
  async addHashtagToPost(postId: number, hashtagName: string): Promise<void> {
    const hashtag = await this.createOrGetHashtag(hashtagName);

    // Check if already added
    const [existing] = await db.select()
      .from(postTags)
      .where(and(
        eq(postTags.postId, postId),
        eq(postTags.tagId, hashtag.id)
      ))
      .limit(1);

    if (!existing) {
      await db.insert(postTags).values({
        postId,
        tagId: hashtag.id
      });

      // Update popularity score
      await this.updatePopularityScore(hashtag.id);
    }
  }

  // Remove hashtag from a post
  async removeHashtagFromPost(postId: number, hashtagId: number): Promise<void> {
    await db.delete(postTags)
      .where(and(
        eq(postTags.postId, postId),
        eq(postTags.tagId, hashtagId)
      ));

    // Update popularity score
    await this.updatePopularityScore(hashtagId);
  }

  // Extract and add hashtags from post content
  async extractAndAddHashtags(postId: number, content: string): Promise<Hashtag[]> {
    const hashtagRegex = /#(\w+)/g;
    const matches = content.match(hashtagRegex) || [];
    const hashtags: Hashtag[] = [];

    for (const match of matches) {
      const name = match.replace("#", "");
      await this.addHashtagToPost(postId, name);
      const hashtag = await this.getHashtagByName(name);
      if (hashtag) {
        hashtags.push(hashtag);
      }
    }

    return hashtags;
  }

  // Get hashtags for a post
  async getPostHashtags(postId: number): Promise<Hashtag[]> {
    const postTagsResult = await db.select({ tagId: postTags.tagId })
      .from(postTags)
      .where(eq(postTags.postId, postId));

    const hashtags: Hashtag[] = [];

    for (const pt of postTagsResult) {
      const hashtag = await this.getHashtagById(pt.tagId);
      if (hashtag) {
        hashtags.push(hashtag);
      }
    }

    return hashtags;
  }


  // Get trending hashtags
  async getTrendingHashtags(limit: number = 10): Promise<TrendingHashtag[]> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Get hashtags with recent activity
    const recentActivity = await db.select({
      tagId: postTags.tagId,
      recentCount: sql<number>`count(*)`
    })
    .from(postTags)
    .innerJoin(posts, eq(postTags.postId, posts.id))
    .where(gt(posts.createdAt, oneDayAgo))
    .groupBy(postTags.tagId)
    .orderBy(desc(sql`count(*)`))
    .limit(limit * 2);

    const trending: TrendingHashtag[] = [];

    for (const activity of recentActivity) {
      const hashtag = await this.getHashtagById(activity.tagId);
      if (!hashtag) continue;

      // Get weekly count for growth rate
      const [weeklyData] = await db.select({ count: sql<number>`count(*)` })
        .from(postTags)
        .innerJoin(posts, eq(postTags.postId, posts.id))
        .where(and(
          eq(postTags.tagId, activity.tagId),
          gt(posts.createdAt, oneWeekAgo)
        ));

      const weeklyCount = Number(weeklyData?.count || 0);
      const dailyCount = Number(activity.recentCount);
      const growthRate = weeklyCount > 0 ? (dailyCount / (weeklyCount / 7)) : dailyCount;

      // Calculate trending score
      const trendingScore = dailyCount * 10 + growthRate * 5 + hashtag.popularityScore;

      trending.push({
        ...hashtag,
        trendingScore,
        growthRate,
        recentPostCount: dailyCount
      });
    }

    // Sort by trending score
    return trending
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, limit);
  }

  // Get popular hashtags
  async getPopularHashtags(limit: number = 20): Promise<Hashtag[]> {
    const popularTags = await db.select()
      .from(tags)
      .orderBy(desc(tags.popularityScore))
      .limit(limit);

    const hashtags: Hashtag[] = [];

    for (const tag of popularTags) {
      const postCount = await this.getHashtagPostCount(tag.id);
      hashtags.push({
        id: tag.id,
        name: tag.name,
        description: tag.description,
        type: tag.type,
        postCount,
        popularityScore: tag.popularityScore || 0
      });
    }

    return hashtags;
  }

  // Get hashtags by type
  async getHashtagsByType(type: string, limit: number = 20): Promise<Hashtag[]> {
    const typeTags = await db.select()
      .from(tags)
      .where(eq(tags.type, type))
      .orderBy(desc(tags.popularityScore))
      .limit(limit);

    const hashtags: Hashtag[] = [];

    for (const tag of typeTags) {
      const postCount = await this.getHashtagPostCount(tag.id);
      hashtags.push({
        id: tag.id,
        name: tag.name,
        description: tag.description,
        type: tag.type,
        postCount,
        popularityScore: tag.popularityScore || 0
      });
    }

    return hashtags;
  }

  // Search hashtags
  async searchHashtags(query: string, limit: number = 10): Promise<Hashtag[]> {
    const searchPattern = `%${query.toLowerCase()}%`;

    const matchingTags = await db.select()
      .from(tags)
      .where(sql`lower(${tags.name}) LIKE ${searchPattern}`)
      .orderBy(desc(tags.popularityScore))
      .limit(limit);

    const hashtags: Hashtag[] = [];

    for (const tag of matchingTags) {
      const postCount = await this.getHashtagPostCount(tag.id);
      hashtags.push({
        id: tag.id,
        name: tag.name,
        description: tag.description,
        type: tag.type,
        postCount,
        popularityScore: tag.popularityScore || 0
      });
    }

    return hashtags;
  }


  // Get posts for a hashtag
  async getHashtagPosts(
    hashtagId: number,
    limit: number = 20,
    offset: number = 0,
    sortBy: "recent" | "popular" = "recent"
  ): Promise<HashtagPost[]> {
    const taggedPostIds = await db.select({ postId: postTags.postId })
      .from(postTags)
      .where(eq(postTags.tagId, hashtagId));

    if (taggedPostIds.length === 0) return [];

    const postIds = taggedPostIds.map((p: { postId: number }) => p.postId);

    const postResults = await db.select({
      id: posts.id,
      content: posts.content,
      imageUrl: posts.imageUrl,
      videoUrl: posts.videoUrl,
      createdAt: posts.createdAt,
      userId: posts.userId
    })
    .from(posts)
    .where(inArray(posts.id, postIds))
    .orderBy(desc(posts.createdAt))
    .limit(limit)
    .offset(offset);

    const enrichedPosts: HashtagPost[] = [];

    for (const post of postResults) {
      const [user] = await db.select({
        id: users.id,
        username: users.username,
        profileImage: users.profileImage
      })
      .from(users)
      .where(eq(users.id, post.userId))
      .limit(1);

      const [likeData] = await db.select({ count: sql<number>`count(*)` })
        .from(likes)
        .where(eq(likes.postId, post.id));

      const [commentData] = await db.select({ count: sql<number>`count(*)` })
        .from(comments)
        .where(eq(comments.postId, post.id));

      enrichedPosts.push({
        id: post.id,
        content: post.content,
        imageUrl: post.imageUrl,
        videoUrl: post.videoUrl,
        createdAt: post.createdAt,
        user: user || { id: 0, username: "unknown", profileImage: null },
        likeCount: Number(likeData?.count || 0),
        commentCount: Number(commentData?.count || 0)
      });
    }

    // Sort by popularity if requested
    if (sortBy === "popular") {
      return enrichedPosts.sort((a, b) => 
        (b.likeCount + b.commentCount) - (a.likeCount + a.commentCount)
      );
    }

    return enrichedPosts;
  }

  // Get hashtag analytics
  async getHashtagAnalytics(hashtagId: number): Promise<HashtagAnalytics> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Total posts
    const [totalData] = await db.select({ count: sql<number>`count(*)` })
      .from(postTags)
      .where(eq(postTags.tagId, hashtagId));

    // Posts today
    const [todayData] = await db.select({ count: sql<number>`count(*)` })
      .from(postTags)
      .innerJoin(posts, eq(postTags.postId, posts.id))
      .where(and(
        eq(postTags.tagId, hashtagId),
        gte(posts.createdAt, today)
      ));

    // Posts this week
    const [weekData] = await db.select({ count: sql<number>`count(*)` })
      .from(postTags)
      .innerJoin(posts, eq(postTags.postId, posts.id))
      .where(and(
        eq(postTags.tagId, hashtagId),
        gte(posts.createdAt, oneWeekAgo)
      ));

    // Top contributors
    const topContributorsData = await db.select({
      userId: posts.userId,
      count: sql<number>`count(*)`
    })
    .from(postTags)
    .innerJoin(posts, eq(postTags.postId, posts.id))
    .where(eq(postTags.tagId, hashtagId))
    .groupBy(posts.userId)
    .orderBy(desc(sql`count(*)`))
    .limit(5);

    const topContributors: { userId: number; username: string; postCount: number }[] = [];
    for (const contributor of topContributorsData) {
      const [user] = await db.select({ username: users.username })
        .from(users)
        .where(eq(users.id, contributor.userId))
        .limit(1);

      topContributors.push({
        userId: contributor.userId,
        username: user?.username || "unknown",
        postCount: Number(contributor.count)
      });
    }

    // Related hashtags (hashtags that appear together with this one)
    const relatedTagIds = await db.select({
      tagId: postTags.tagId,
      count: sql<number>`count(*)`
    })
    .from(postTags)
    .where(and(
      inArray(postTags.postId, 
        db.select({ postId: postTags.postId })
          .from(postTags)
          .where(eq(postTags.tagId, hashtagId))
      ),
      sql`${postTags.tagId} != ${hashtagId}`
    ))
    .groupBy(postTags.tagId)
    .orderBy(desc(sql`count(*)`))
    .limit(5);

    const relatedHashtags: Hashtag[] = [];
    for (const related of relatedTagIds) {
      const hashtag = await this.getHashtagById(related.tagId);
      if (hashtag) {
        relatedHashtags.push(hashtag);
      }
    }

    return {
      totalPosts: Number(totalData?.count || 0),
      postsToday: Number(todayData?.count || 0),
      postsThisWeek: Number(weekData?.count || 0),
      topContributors,
      peakHours: [], // Would require more complex time-based analysis
      relatedHashtags
    };
  }


  // Get suggested hashtags based on content
  async getSuggestedHashtags(content: string, limit: number = 5): Promise<Hashtag[]> {
    // Extract words from content
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((w: string) => w.length > 3);

    if (words.length === 0) return [];

    // Search for matching hashtags
    const suggestions: Hashtag[] = [];
    const seen = new Set<number>();

    for (const word of words) {
      const matches = await this.searchHashtags(word, 2);
      for (const match of matches) {
        if (!seen.has(match.id)) {
          seen.add(match.id);
          suggestions.push(match);
        }
      }
      if (suggestions.length >= limit) break;
    }

    return suggestions.slice(0, limit);
  }

  // Update hashtag popularity score
  private async updatePopularityScore(hashtagId: number): Promise<void> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Get total posts
    const [totalData] = await db.select({ count: sql<number>`count(*)` })
      .from(postTags)
      .where(eq(postTags.tagId, hashtagId));

    // Get recent posts (last 24h)
    const [recentData] = await db.select({ count: sql<number>`count(*)` })
      .from(postTags)
      .innerJoin(posts, eq(postTags.postId, posts.id))
      .where(and(
        eq(postTags.tagId, hashtagId),
        gt(posts.createdAt, oneDayAgo)
      ));

    // Get weekly posts
    const [weeklyData] = await db.select({ count: sql<number>`count(*)` })
      .from(postTags)
      .innerJoin(posts, eq(postTags.postId, posts.id))
      .where(and(
        eq(postTags.tagId, hashtagId),
        gt(posts.createdAt, oneWeekAgo)
      ));

    // Calculate popularity score
    const totalPosts = Number(totalData?.count || 0);
    const recentPosts = Number(recentData?.count || 0);
    const weeklyPosts = Number(weeklyData?.count || 0);

    const popularityScore = Math.floor(
      totalPosts * 0.1 + 
      weeklyPosts * 0.3 + 
      recentPosts * 0.6
    );

    await db.update(tags)
      .set({ 
        popularityScore,
        updatedAt: new Date()
      })
      .where(eq(tags.id, hashtagId));
  }

  // Get hashtag post count
  private async getHashtagPostCount(hashtagId: number): Promise<number> {
    const [data] = await db.select({ count: sql<number>`count(*)` })
      .from(postTags)
      .where(eq(postTags.tagId, hashtagId));

    return Number(data?.count || 0);
  }

  // Get cricket-specific trending topics
  async getCricketTrending(): Promise<TrendingHashtag[]> {
    const cricketTypes = ["player", "team", "format", "event"];
    
    const allTrending: TrendingHashtag[] = [];

    for (const type of cricketTypes) {
      const typeTags = await db.select()
        .from(tags)
        .where(eq(tags.type, type))
        .orderBy(desc(tags.popularityScore))
        .limit(5);

      for (const tag of typeTags) {
        const postCount = await this.getHashtagPostCount(tag.id);
        allTrending.push({
          id: tag.id,
          name: tag.name,
          description: tag.description,
          type: tag.type,
          postCount,
          popularityScore: tag.popularityScore || 0,
          trendingScore: tag.popularityScore || 0,
          growthRate: 0,
          recentPostCount: 0
        });
      }
    }

    return allTrending.sort((a, b) => b.trendingScore - a.trendingScore);
  }

  // Batch update popularity scores (for scheduled job)
  async batchUpdatePopularityScores(): Promise<{ updated: number }> {
    const allTags = await db.select({ id: tags.id })
      .from(tags);

    let updated = 0;
    for (const tag of allTags) {
      await this.updatePopularityScore(tag.id);
      updated++;
    }

    return { updated };
  }
}

// Export singleton instance
export const hashtagService = new HashtagService();
