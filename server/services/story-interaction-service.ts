import { 
  storyViews,
  storyReactions,
  storyComments,
  stories,
  users,
  messages,
  conversations,
  notifications
} from "@shared/schema";
import { db } from "../db";
import { eq, and, desc, count, sql } from "drizzle-orm";

export type StoryReactionType = "like" | "howzat" | "six" | "four" | "clap" | "wow";

export interface StoryViewInfo {
  id: number;
  userId: number;
  username: string;
  profileImage: string | null;
  viewedAt: Date | null;
}

export interface StoryAnalytics {
  totalViews: number;
  uniqueViewers: number;
  totalReactions: number;
  reactionBreakdown: Record<StoryReactionType, number>;
  totalReplies: number;
  viewersList: StoryViewInfo[];
  peakViewTime?: Date;
  averageViewDuration?: number;
}

export interface StoryInteractionResult {
  success: boolean;
  message: string;
}

export class StoryInteractionService {
  
  // Record a story view
  async recordView(storyId: number, viewerId: number): Promise<StoryInteractionResult> {
    // Get story to verify it exists and get owner
    const [story] = await db.select()
      .from(stories)
      .where(eq(stories.id, storyId))
      .limit(1);

    if (!story) {
      return { success: false, message: "Story not found" };
    }

    // Don't record self-views
    if (story.userId === viewerId) {
      return { success: true, message: "Self-view not recorded" };
    }

    // Check if already viewed
    const [existingView] = await db.select()
      .from(storyViews)
      .where(and(
        eq(storyViews.storyId, storyId),
        eq(storyViews.userId, viewerId)
      ))
      .limit(1);

    if (existingView) {
      return { success: true, message: "Already viewed" };
    }

    // Record the view
    await db.insert(storyViews).values({
      storyId,
      userId: viewerId
    });

    // Update view count on story
    await db.update(stories)
      .set({ viewCount: sql`${stories.viewCount} + 1` })
      .where(eq(stories.id, storyId));

    return { success: true, message: "View recorded" };
  }

  // Get all viewers of a story
  async getStoryViewers(
    storyId: number, 
    ownerId: number,
    page: number = 1,
    limit: number = 50
  ): Promise<{ viewers: StoryViewInfo[]; total: number }> {
    // Verify ownership
    const [story] = await db.select()
      .from(stories)
      .where(and(eq(stories.id, storyId), eq(stories.userId, ownerId)))
      .limit(1);

    if (!story) {
      return { viewers: [], total: 0 };
    }

    const offset = (page - 1) * limit;

    const viewers = await db.select({
      id: storyViews.id,
      userId: users.id,
      username: users.username,
      profileImage: users.profileImage,
      viewedAt: storyViews.createdAt
    })
    .from(storyViews)
    .innerJoin(users, eq(storyViews.userId, users.id))
    .where(eq(storyViews.storyId, storyId))
    .orderBy(desc(storyViews.createdAt))
    .limit(limit)
    .offset(offset);

    // Get total count
    const [totalResult] = await db.select({ count: count() })
      .from(storyViews)
      .where(eq(storyViews.storyId, storyId));

    return {
      viewers: viewers as StoryViewInfo[],
      total: totalResult?.count || 0
    };
  }

  // Add reaction to a story
  async addReaction(
    storyId: number, 
    userId: number, 
    reactionType: StoryReactionType
  ): Promise<StoryInteractionResult> {
    // Get story
    const [story] = await db.select()
      .from(stories)
      .where(eq(stories.id, storyId))
      .limit(1);

    if (!story) {
      return { success: false, message: "Story not found" };
    }

    // Check for existing reaction
    const [existing] = await db.select()
      .from(storyReactions)
      .where(and(
        eq(storyReactions.storyId, storyId),
        eq(storyReactions.userId, userId)
      ))
      .limit(1);

    if (existing) {
      // Update existing reaction
      await db.update(storyReactions)
        .set({ reactionType })
        .where(eq(storyReactions.id, existing.id));
    } else {
      // Create new reaction
      await db.insert(storyReactions).values({
        storyId,
        userId,
        reactionType
      });
    }

    // Send reaction as DM to story owner (if not self)
    if (story.userId !== userId) {
      await this.sendReactionAsDM(userId, story.userId, storyId, reactionType);
    }

    return { success: true, message: "Reaction added" };
  }

  // Remove reaction from a story
  async removeReaction(storyId: number, userId: number): Promise<StoryInteractionResult> {
    const result = await db.delete(storyReactions)
      .where(and(
        eq(storyReactions.storyId, storyId),
        eq(storyReactions.userId, userId)
      ));

    if (result.rowCount === 0) {
      return { success: false, message: "Reaction not found" };
    }

    return { success: true, message: "Reaction removed" };
  }

  // Get reactions for a story
  async getStoryReactions(storyId: number): Promise<{
    reactions: { userId: number; username: string; reactionType: string; createdAt: Date | null }[];
    counts: Record<StoryReactionType, number>;
    total: number;
  }> {
    const reactions = await db.select({
      userId: users.id,
      username: users.username,
      reactionType: storyReactions.reactionType,
      createdAt: storyReactions.createdAt
    })
    .from(storyReactions)
    .innerJoin(users, eq(storyReactions.userId, users.id))
    .where(eq(storyReactions.storyId, storyId))
    .orderBy(desc(storyReactions.createdAt));

    // Calculate counts
    const counts: Record<StoryReactionType, number> = {
      like: 0, howzat: 0, six: 0, four: 0, clap: 0, wow: 0
    };

    reactions.forEach((r: { reactionType: string }) => {
      const type = r.reactionType as StoryReactionType;
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

  // Reply to a story (creates a DM)
  async replyToStory(
    storyId: number, 
    userId: number, 
    content: string
  ): Promise<StoryInteractionResult> {
    // Get story
    const [story] = await db.select()
      .from(stories)
      .where(eq(stories.id, storyId))
      .limit(1);

    if (!story) {
      return { success: false, message: "Story not found" };
    }

    // Can't reply to own story
    if (story.userId === userId) {
      return { success: false, message: "Cannot reply to your own story" };
    }

    // Find or create conversation
    const conversationId = await this.getOrCreateConversation(userId, story.userId);

    // Create message with story reference
    await db.insert(messages).values({
      conversationId,
      senderId: userId,
      content: `[Story Reply] ${content}`,
      messageType: "text"
    });

    // Update conversation last message time
    await db.update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, conversationId));

    // Create notification
    await this.createStoryReplyNotification(userId, story.userId, storyId);

    return { success: true, message: "Reply sent" };
  }

  // Get or create conversation between two users
  private async getOrCreateConversation(user1Id: number, user2Id: number): Promise<number> {
    // Check for existing conversation
    const [existing] = await db.select()
      .from(conversations)
      .where(
        sql`(${conversations.user1Id} = ${user1Id} AND ${conversations.user2Id} = ${user2Id}) OR 
            (${conversations.user1Id} = ${user2Id} AND ${conversations.user2Id} = ${user1Id})`
      )
      .limit(1);

    if (existing) {
      return existing.id;
    }

    // Create new conversation
    const [newConversation] = await db.insert(conversations)
      .values({
        user1Id,
        user2Id
      })
      .returning();

    return newConversation.id;
  }

  // Send reaction as DM
  private async sendReactionAsDM(
    senderId: number, 
    recipientId: number, 
    storyId: number,
    reactionType: StoryReactionType
  ): Promise<void> {
    const conversationId = await this.getOrCreateConversation(senderId, recipientId);

    const reactionEmoji = this.getReactionEmoji(reactionType);

    await db.insert(messages).values({
      conversationId,
      senderId,
      content: `[Story Reaction] ${reactionEmoji}`,
      messageType: "text"
    });

    await db.update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, conversationId));
  }

  // Get emoji for reaction type
  private getReactionEmoji(reactionType: StoryReactionType): string {
    const emojis: Record<StoryReactionType, string> = {
      like: "❤️",
      howzat: "🏏",
      six: "6️⃣",
      four: "4️⃣",
      clap: "👏",
      wow: "😮"
    };
    return emojis[reactionType] || "❤️";
  }

  // Create notification for story reply
  private async createStoryReplyNotification(
    fromUserId: number, 
    toUserId: number, 
    storyId: number
  ): Promise<void> {
    const [fromUser] = await db.select({ username: users.username, profileImage: users.profileImage })
      .from(users)
      .where(eq(users.id, fromUserId))
      .limit(1);

    await db.insert(notifications).values({
      userId: toUserId,
      fromUserId,
      type: "story_reply",
      title: "Story Reply",
      message: `${fromUser?.username || 'Someone'} replied to your story`,
      entityType: "story",
      entityId: storyId,
      imageUrl: fromUser?.profileImage,
      actionUrl: `/messages`
    });
  }

  // Get comprehensive analytics for a story
  async getStoryAnalytics(storyId: number, ownerId: number): Promise<StoryAnalytics | null> {
    // Verify ownership
    const [story] = await db.select()
      .from(stories)
      .where(and(eq(stories.id, storyId), eq(stories.userId, ownerId)))
      .limit(1);

    if (!story) return null;

    // Get views
    const { viewers, total: totalViews } = await this.getStoryViewers(storyId, ownerId, 1, 100);

    // Get reactions
    const { counts: reactionBreakdown, total: totalReactions } = await this.getStoryReactions(storyId);

    // Get reply count (approximate - count messages that reference this story)
    // This is simplified - in production you'd have a proper story_replies table
    const totalReplies = 0; // Placeholder

    return {
      totalViews,
      uniqueViewers: viewers.length,
      totalReactions,
      reactionBreakdown,
      totalReplies,
      viewersList: viewers
    };
  }

  // Check if user has viewed a story
  async hasViewed(storyId: number, userId: number): Promise<boolean> {
    const [view] = await db.select()
      .from(storyViews)
      .where(and(
        eq(storyViews.storyId, storyId),
        eq(storyViews.userId, userId)
      ))
      .limit(1);

    return !!view;
  }

  // Get user's reaction on a story
  async getUserReaction(storyId: number, userId: number): Promise<StoryReactionType | null> {
    const [reaction] = await db.select({ reactionType: storyReactions.reactionType })
      .from(storyReactions)
      .where(and(
        eq(storyReactions.storyId, storyId),
        eq(storyReactions.userId, userId)
      ))
      .limit(1);

    return reaction?.reactionType as StoryReactionType | null;
  }

  // Get stories viewed by a user
  async getViewedStories(userId: number, limit: number = 50): Promise<number[]> {
    const views = await db.select({ storyId: storyViews.storyId })
      .from(storyViews)
      .where(eq(storyViews.userId, userId))
      .orderBy(desc(storyViews.createdAt))
      .limit(limit);

    return views.map((v: { storyId: number }) => v.storyId);
  }

  // Get view count for a story
  async getViewCount(storyId: number): Promise<number> {
    const [result] = await db.select({ count: count() })
      .from(storyViews)
      .where(eq(storyViews.storyId, storyId));

    return result?.count || 0;
  }

  // Bulk check if user has viewed multiple stories
  async bulkHasViewed(storyIds: number[], userId: number): Promise<Map<number, boolean>> {
    const views = await db.select({ storyId: storyViews.storyId })
      .from(storyViews)
      .where(eq(storyViews.userId, userId));

    const viewedSet = new Set(views.map((v: { storyId: number }) => v.storyId));
    const result = new Map<number, boolean>();

    for (const storyId of storyIds) {
      result.set(storyId, viewedSet.has(storyId));
    }

    return result;
  }
}

// Export singleton instance
export const storyInteractionService = new StoryInteractionService();
