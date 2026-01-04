import { 
  postMentions,
  users,
  notifications,
  posts,
  comments,
  type User
} from "@shared/schema";
import { db } from "../db";
import { eq, and, desc, inArray } from "drizzle-orm";

export interface MentionResult {
  success: boolean;
  message: string;
  mentions?: { userId: number; username: string }[];
}

export interface MentionNotification {
  mentionedUserId: number;
  mentionedByUserId: number;
  postId: number;
  mentionType: "post" | "comment";
}

export class MentionService {
  
  // Extract mentions from text content
  extractMentions(content: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const matches = content.match(mentionRegex);
    
    if (!matches) return [];
    
    // Remove @ symbol and deduplicate
    return Array.from(new Set(matches.map(m => m.slice(1))));
  }

  // Convert mentions to clickable links (for frontend rendering)
  formatMentionsAsLinks(content: string): string {
    return content.replace(/@(\w+)/g, '[@$1](/profile/$1)');
  }

  // Process mentions in a post
  async processPostMentions(
    postId: number, 
    content: string, 
    authorId: number
  ): Promise<MentionResult> {
    const usernames = this.extractMentions(content);
    
    if (usernames.length === 0) {
      return { success: true, message: "No mentions found", mentions: [] };
    }

    const processedMentions: { userId: number; username: string }[] = [];

    for (const username of usernames) {
      // Find user by username
      const [user] = await db.select({ id: users.id, username: users.username })
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (!user) continue;
      
      // Don't mention yourself
      if (user.id === authorId) continue;

      // Check if user allows mentions
      const canMention = await this.canMentionUser(user.id);
      if (!canMention) continue;

      // Check if mention already exists
      const [existing] = await db.select()
        .from(postMentions)
        .where(and(
          eq(postMentions.postId, postId),
          eq(postMentions.mentionedUserId, user.id),
          eq(postMentions.mentionType, "post")
        ))
        .limit(1);

      if (existing) continue;

      // Create mention record
      await db.insert(postMentions).values({
        postId,
        mentionedUserId: user.id,
        mentionedByUserId: authorId,
        mentionType: "post"
      });

      // Create notification
      await this.createMentionNotification({
        mentionedUserId: user.id,
        mentionedByUserId: authorId,
        postId,
        mentionType: "post"
      });

      processedMentions.push({ userId: user.id, username: user.username });
    }

    return { 
      success: true, 
      message: `Processed ${processedMentions.length} mentions`, 
      mentions: processedMentions 
    };
  }

  // Process mentions in a comment
  async processCommentMentions(
    postId: number,
    commentId: number,
    content: string, 
    authorId: number
  ): Promise<MentionResult> {
    const usernames = this.extractMentions(content);
    
    if (usernames.length === 0) {
      return { success: true, message: "No mentions found", mentions: [] };
    }

    const processedMentions: { userId: number; username: string }[] = [];

    for (const username of usernames) {
      // Find user by username
      const [user] = await db.select({ id: users.id, username: users.username })
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (!user) continue;
      
      // Don't mention yourself
      if (user.id === authorId) continue;

      // Check if user allows mentions
      const canMention = await this.canMentionUser(user.id);
      if (!canMention) continue;

      // Create mention record
      await db.insert(postMentions).values({
        postId,
        mentionedUserId: user.id,
        mentionedByUserId: authorId,
        mentionType: "comment"
      });

      // Create notification
      await this.createMentionNotification({
        mentionedUserId: user.id,
        mentionedByUserId: authorId,
        postId,
        mentionType: "comment"
      });

      processedMentions.push({ userId: user.id, username: user.username });
    }

    return { 
      success: true, 
      message: `Processed ${processedMentions.length} mentions`, 
      mentions: processedMentions 
    };
  }

  // Check if a user allows mentions
  async canMentionUser(userId: number): Promise<boolean> {
    const [user] = await db.select({ allowMentions: users.allowMentions })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user?.allowMentions !== false;
  }

  // Create notification for mention
  private async createMentionNotification(mention: MentionNotification): Promise<void> {
    const [fromUser] = await db.select({ username: users.username, profileImage: users.profileImage })
      .from(users)
      .where(eq(users.id, mention.mentionedByUserId))
      .limit(1);

    const typeText = mention.mentionType === "post" ? "a post" : "a comment";

    await db.insert(notifications).values({
      userId: mention.mentionedUserId,
      fromUserId: mention.mentionedByUserId,
      type: "mention",
      title: "You were mentioned",
      message: `${fromUser?.username || 'Someone'} mentioned you in ${typeText}`,
      entityType: mention.mentionType,
      entityId: mention.postId,
      imageUrl: fromUser?.profileImage,
      actionUrl: `/post/${mention.postId}`
    });
  }

  // Get all mentions for a user
  async getUserMentions(
    userId: number, 
    page: number = 1, 
    limit: number = 20
  ): Promise<{
    mentions: {
      id: number;
      postId: number;
      mentionedByUser: { id: number; username: string; profileImage: string | null };
      mentionType: string;
      createdAt: Date | null;
    }[];
    total: number;
  }> {
    const offset = (page - 1) * limit;

    const mentions = await db.select({
      id: postMentions.id,
      postId: postMentions.postId,
      mentionType: postMentions.mentionType,
      createdAt: postMentions.createdAt,
      mentionedByUser: {
        id: users.id,
        username: users.username,
        profileImage: users.profileImage
      }
    })
    .from(postMentions)
    .innerJoin(users, eq(postMentions.mentionedByUserId, users.id))
    .where(eq(postMentions.mentionedUserId, userId))
    .orderBy(desc(postMentions.createdAt))
    .limit(limit)
    .offset(offset);

    // Get total count
    const allMentions = await db.select({ id: postMentions.id })
      .from(postMentions)
      .where(eq(postMentions.mentionedUserId, userId));

    return {
      mentions: mentions as any,
      total: allMentions.length
    };
  }

  // Get mentions in a specific post
  async getPostMentions(postId: number): Promise<{
    userId: number;
    username: string;
    profileImage: string | null;
    mentionType: string;
  }[]> {
    const mentions = await db.select({
      userId: users.id,
      username: users.username,
      profileImage: users.profileImage,
      mentionType: postMentions.mentionType
    })
    .from(postMentions)
    .innerJoin(users, eq(postMentions.mentionedUserId, users.id))
    .where(eq(postMentions.postId, postId));

    return mentions;
  }

  // Remove a mention
  async removeMention(mentionId: number, userId: number): Promise<{ success: boolean; message: string }> {
    // Verify the mention belongs to the user (either mentioned or mentioner)
    const [mention] = await db.select()
      .from(postMentions)
      .where(eq(postMentions.id, mentionId))
      .limit(1);

    if (!mention) {
      return { success: false, message: "Mention not found" };
    }

    if (mention.mentionedUserId !== userId && mention.mentionedByUserId !== userId) {
      return { success: false, message: "Unauthorized" };
    }

    await db.delete(postMentions).where(eq(postMentions.id, mentionId));

    return { success: true, message: "Mention removed" };
  }

  // Search users for mention autocomplete
  async searchUsersForMention(
    query: string, 
    currentUserId: number, 
    limit: number = 10
  ): Promise<{ id: number; username: string; fullName: string | null; profileImage: string | null }[]> {
    if (!query || query.length < 1) {
      return [];
    }

    const searchResults = await db.select({
      id: users.id,
      username: users.username,
      fullName: users.fullName,
      profileImage: users.profileImage
    })
    .from(users)
    .where(
      and(
        eq(users.allowMentions, true)
      )
    )
    .limit(limit * 2); // Get more to filter

    const filtered = searchResults.filter((user: { id: number; username: string; fullName: string | null; profileImage: string | null }) => 
      user.id !== currentUserId &&
      (user.username.toLowerCase().includes(query.toLowerCase()) ||
       (user.fullName && user.fullName.toLowerCase().includes(query.toLowerCase())))
    ).slice(0, limit);

    return filtered;
  }

  // Validate mentions in content before posting
  async validateMentions(content: string): Promise<{
    valid: string[];
    invalid: string[];
  }> {
    const usernames = this.extractMentions(content);
    const valid: string[] = [];
    const invalid: string[] = [];

    for (const username of usernames) {
      const [user] = await db.select({ id: users.id })
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (user) {
        valid.push(username);
      } else {
        invalid.push(username);
      }
    }

    return { valid, invalid };
  }

  // Get mention statistics for a user
  async getMentionStats(userId: number): Promise<{
    totalMentions: number;
    mentionsThisWeek: number;
    topMentioners: { userId: number; username: string; count: number }[];
  }> {
    // Get total mentions
    const allMentions = await db.select()
      .from(postMentions)
      .where(eq(postMentions.mentionedUserId, userId));

    const totalMentions = allMentions.length;

    // Get mentions this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentMentions = allMentions.filter((m: { createdAt: Date | null }) => 
      m.createdAt && new Date(m.createdAt) >= oneWeekAgo
    );

    // Get top mentioners
    const mentionerCounts = new Map<number, number>();
    for (const mention of allMentions) {
      const count = mentionerCounts.get(mention.mentionedByUserId) || 0;
      mentionerCounts.set(mention.mentionedByUserId, count + 1);
    }

    const topMentionerIds = Array.from(mentionerCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);

    const topMentioners: { userId: number; username: string; count: number }[] = [];

    if (topMentionerIds.length > 0) {
      const mentionerUsers = await db.select({ id: users.id, username: users.username })
        .from(users)
        .where(inArray(users.id, topMentionerIds));

      for (const user of mentionerUsers) {
        topMentioners.push({
          userId: user.id,
          username: user.username,
          count: mentionerCounts.get(user.id) || 0
        });
      }

      topMentioners.sort((a, b) => b.count - a.count);
    }

    return {
      totalMentions,
      mentionsThisWeek: recentMentions.length,
      topMentioners
    };
  }
}

// Export singleton instance
export const mentionService = new MentionService();
