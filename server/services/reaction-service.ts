import { 
  likes,
  posts,
  users,
  type Like
} from "@shared/schema";
import { db } from "../db";
import { eq, and, sql, desc } from "drizzle-orm";

// Cricket-specific reaction types
export const REACTION_TYPES = [
  "like",
  "howzat",
  "six",
  "four",
  "clap",
  "wow"
] as const;

export type ReactionType = typeof REACTION_TYPES[number];

export interface ReactionResult {
  success: boolean;
  message: string;
  reaction?: Like;
}

export interface ReactionAnalytics {
  totalReactions: number;
  reactionBreakdown: Record<ReactionType, number>;
  topReactors: { userId: number; username: string; count: number }[];
}

export class ReactionService {
  
  // Add or update reaction on a post
  async addReaction(userId: number, postId: number, reactionType: ReactionType = "like"): Promise<ReactionResult> {
    // Validate reaction type
    if (!REACTION_TYPES.includes(reactionType)) {
      return { success: false, message: "Invalid reaction type" };
    }

    // Check if post exists
    const [post] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
    if (!post) {
      return { success: false, message: "Post not found" };
    }

    // Check for existing reaction
    const [existing] = await db.select()
      .from(likes)
      .where(and(eq(likes.userId, userId), eq(likes.postId, postId)))
      .limit(1);

    if (existing) {
      // Update existing reaction
      const [updated] = await db.update(likes)
        .set({ reactionType })
        .where(eq(likes.id, existing.id))
        .returning();
      return { success: true, message: "Reaction updated", reaction: updated };
    }

    // Create new reaction
    const [reaction] = await db.insert(likes)
      .values({ userId, postId, reactionType })
      .returning();

    return { success: true, message: "Reaction added", reaction };
  }

  // Remove reaction from a post
  async removeReaction(userId: number, postId: number): Promise<ReactionResult> {
    const result = await db.delete(likes)
      .where(and(eq(likes.userId, userId), eq(likes.postId, postId)));

    if (result.rowCount === 0) {
      return { success: false, message: "Reaction not found" };
    }

    return { success: true, message: "Reaction removed" };
  }

  // Get user's reaction on a post
  async getUserReaction(userId: number, postId: number): Promise<Like | null> {
    const [reaction] = await db.select()
      .from(likes)
      .where(and(eq(likes.userId, userId), eq(likes.postId, postId)))
      .limit(1);

    return reaction || null;
  }

  // Get all reactions for a post
  async getPostReactions(postId: number): Promise<{
    reactions: (Like & { user: { id: number; username: string; profileImage: string | null } })[];
    counts: Record<ReactionType, number>;
    total: number;
  }> {
    const reactions = await db.select({
      id: likes.id,
      userId: likes.userId,
      postId: likes.postId,
      reactionType: likes.reactionType,
      createdAt: likes.createdAt,
      user: {
        id: users.id,
        username: users.username,
        profileImage: users.profileImage
      }
    })
    .from(likes)
    .innerJoin(users, eq(likes.userId, users.id))
    .where(eq(likes.postId, postId))
    .orderBy(desc(likes.createdAt));

    // Calculate counts per reaction type
    const counts: Record<ReactionType, number> = {
      like: 0, howzat: 0, six: 0, four: 0, clap: 0, wow: 0
    };

    reactions.forEach((r: { reactionType: string; }) => {
      const type = r.reactionType as ReactionType;
      if (counts[type] !== undefined) {
        counts[type]++;
      }
    });

    return {
      reactions: reactions as any,
      counts,
      total: reactions.length
    };
  }

  // Get reaction analytics for a post
  async getReactionAnalytics(postId: number): Promise<ReactionAnalytics> {
    const { reactions, counts, total } = await this.getPostReactions(postId);

    // Get top reactors (users who react most to this post's author's content)
    const [post] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
    
    const topReactors: { userId: number; username: string; count: number }[] = [];
    
    if (post) {
      const reactorCounts = await db.select({
        userId: likes.userId,
        username: users.username,
        count: sql<number>`count(*)::int`
      })
      .from(likes)
      .innerJoin(posts, eq(likes.postId, posts.id))
      .innerJoin(users, eq(likes.userId, users.id))
      .where(eq(posts.userId, post.userId))
      .groupBy(likes.userId, users.username)
      .orderBy(sql`count(*) desc`)
      .limit(10);

      topReactors.push(...reactorCounts);
    }

    return {
      totalReactions: total,
      reactionBreakdown: counts,
      topReactors
    };
  }

  // Get posts by reaction type
  async getPostsByReactionType(reactionType: ReactionType, limit: number = 20): Promise<number[]> {
    const results = await db.select({
      postId: likes.postId,
      count: sql<number>`count(*)::int`
    })
    .from(likes)
    .where(eq(likes.reactionType, reactionType))
    .groupBy(likes.postId)
    .orderBy(sql`count(*) desc`)
    .limit(limit);

    return results.map((r: { postId: any; }) => r.postId);
  }

  // Get user's reaction history
  async getUserReactionHistory(userId: number, limit: number = 50): Promise<Like[]> {
    return await db.select()
      .from(likes)
      .where(eq(likes.userId, userId))
      .orderBy(desc(likes.createdAt))
      .limit(limit);
  }

  // Check if user has reacted to a post
  async hasReacted(userId: number, postId: number): Promise<boolean> {
    const reaction = await this.getUserReaction(userId, postId);
    return !!reaction;
  }

  // Bulk get reactions for multiple posts
  async getBulkPostReactions(postIds: number[], userId?: number): Promise<Map<number, {
    total: number;
    userReaction: ReactionType | null;
    topReaction: ReactionType | null;
  }>> {
    const result = new Map();

    for (const postId of postIds) {
      const { counts, total } = await this.getPostReactions(postId);
      
      let userReaction: ReactionType | null = null;
      if (userId) {
        const reaction = await this.getUserReaction(userId, postId);
        userReaction = reaction?.reactionType as ReactionType || null;
      }

      // Find top reaction type
      let topReaction: ReactionType | null = null;
      let maxCount = 0;
      for (const [type, count] of Object.entries(counts)) {
        if (count > maxCount) {
          maxCount = count;
          topReaction = type as ReactionType;
        }
      }

      result.set(postId, { total, userReaction, topReaction });
    }

    return result;
  }
}

export const reactionService = new ReactionService();
