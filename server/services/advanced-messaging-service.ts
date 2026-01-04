import { 
  messages,
  messageReactions,
  conversations,
  users,
  notifications,
  type Message
} from "@shared/schema";
import { db } from "../db";
import { eq, and, desc, sql, lt } from "drizzle-orm";

export interface MessageResult {
  success: boolean;
  message: string;
  data?: Message;
}

export interface MessageReactionInfo {
  id: number;
  userId: number;
  username: string;
  reaction: string;
  createdAt: Date | null;
}

export interface MessageWithReactions extends Message {
  reactions: MessageReactionInfo[];
  replyTo?: Message | null;
}

// In-memory storage for disappearing messages (would use scheduled jobs in production)
const disappearingMessages = new Map<number, { expiresAt: Date; conversationId: number }>();

export class AdvancedMessagingService {
  
  // Add reaction to a message
  async addReaction(
    messageId: number, 
    userId: number, 
    reaction: string
  ): Promise<{ success: boolean; message: string }> {
    // Verify message exists
    const [msg] = await db.select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    if (!msg) {
      return { success: false, message: "Message not found" };
    }

    // Check if user already reacted
    const [existing] = await db.select()
      .from(messageReactions)
      .where(and(
        eq(messageReactions.messageId, messageId),
        eq(messageReactions.userId, userId)
      ))
      .limit(1);

    if (existing) {
      // Update existing reaction
      await db.update(messageReactions)
        .set({ reaction })
        .where(eq(messageReactions.id, existing.id));
    } else {
      // Add new reaction
      await db.insert(messageReactions).values({
        messageId,
        userId,
        reaction
      });
    }

    // Notify message sender (if not self)
    if (msg.senderId !== userId) {
      await this.createReactionNotification(userId, msg.senderId, messageId, reaction);
    }

    return { success: true, message: "Reaction added" };
  }

  // Remove reaction from a message
  async removeReaction(
    messageId: number, 
    userId: number
  ): Promise<{ success: boolean; message: string }> {
    const result = await db.delete(messageReactions)
      .where(and(
        eq(messageReactions.messageId, messageId),
        eq(messageReactions.userId, userId)
      ));

    if (result.rowCount === 0) {
      return { success: false, message: "Reaction not found" };
    }

    return { success: true, message: "Reaction removed" };
  }

  // Get reactions for a message
  async getMessageReactions(messageId: number): Promise<MessageReactionInfo[]> {
    const reactions = await db.select({
      id: messageReactions.id,
      userId: users.id,
      username: users.username,
      reaction: messageReactions.reaction,
      createdAt: messageReactions.createdAt
    })
    .from(messageReactions)
    .innerJoin(users, eq(messageReactions.userId, users.id))
    .where(eq(messageReactions.messageId, messageId))
    .orderBy(desc(messageReactions.createdAt));

    return reactions as MessageReactionInfo[];
  }

  // Reply to a message
  async replyToMessage(
    conversationId: number,
    senderId: number,
    content: string,
    replyToMessageId: number,
    messageType: string = "text"
  ): Promise<MessageResult> {
    // Verify original message exists
    const [originalMsg] = await db.select()
      .from(messages)
      .where(and(
        eq(messages.id, replyToMessageId),
        eq(messages.conversationId, conversationId)
      ))
      .limit(1);

    if (!originalMsg) {
      return { success: false, message: "Original message not found" };
    }

    // Create reply message with reference to original
    // Note: This assumes a replyToId field exists or we store it in content
    const replyContent = `[Reply to: ${replyToMessageId}] ${content}`;

    const [newMessage] = await db.insert(messages)
      .values({
        conversationId,
        senderId,
        content: replyContent,
        messageType
      })
      .returning();

    // Update conversation last message time
    await db.update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, conversationId));

    return { success: true, message: "Reply sent", data: newMessage };
  }

  // Send disappearing message
  async sendDisappearingMessage(
    conversationId: number,
    senderId: number,
    content: string,
    expiresInSeconds: number,
    messageType: string = "text"
  ): Promise<MessageResult> {
    // Create the message
    const [newMessage] = await db.insert(messages)
      .values({
        conversationId,
        senderId,
        content: `[Disappearing] ${content}`,
        messageType
      })
      .returning();

    // Schedule deletion
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
    disappearingMessages.set(newMessage.id, { expiresAt, conversationId });

    // Set timeout to delete message
    setTimeout(async () => {
      await this.deleteMessage(newMessage.id, senderId, true);
      disappearingMessages.delete(newMessage.id);
    }, expiresInSeconds * 1000);

    // Update conversation last message time
    await db.update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, conversationId));

    return { success: true, message: "Disappearing message sent", data: newMessage };
  }

  // Unsend/delete a message
  async deleteMessage(
    messageId: number, 
    userId: number, 
    deleteForEveryone: boolean
  ): Promise<{ success: boolean; message: string }> {
    // Verify message ownership
    const [msg] = await db.select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    if (!msg) {
      return { success: false, message: "Message not found" };
    }

    if (msg.senderId !== userId && !deleteForEveryone) {
      return { success: false, message: "Can only delete your own messages" };
    }

    if (deleteForEveryone) {
      // Delete message completely
      await db.delete(messageReactions).where(eq(messageReactions.messageId, messageId));
      await db.delete(messages).where(eq(messages.id, messageId));
    } else {
      // Mark as deleted for sender only (would need a deletedFor field)
      // For now, we'll update content to indicate deletion
      await db.update(messages)
        .set({ content: "[Message deleted]" })
        .where(eq(messages.id, messageId));
    }

    return { success: true, message: "Message deleted" };
  }

  // Forward a message
  async forwardMessage(
    messageId: number,
    senderId: number,
    targetConversationId: number
  ): Promise<MessageResult> {
    // Get original message
    const [originalMsg] = await db.select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    if (!originalMsg) {
      return { success: false, message: "Message not found" };
    }

    // Create forwarded message
    const [newMessage] = await db.insert(messages)
      .values({
        conversationId: targetConversationId,
        senderId,
        content: `[Forwarded] ${originalMsg.content}`,
        messageType: originalMsg.messageType,
        mediaUrl: originalMsg.mediaUrl
      })
      .returning();

    // Update conversation last message time
    await db.update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, targetConversationId));

    return { success: true, message: "Message forwarded", data: newMessage };
  }

  // Share a post via message
  async sharePost(
    senderId: number,
    recipientId: number,
    postId: number,
    additionalMessage?: string
  ): Promise<MessageResult> {
    // Get or create conversation
    const conversationId = await this.getOrCreateConversation(senderId, recipientId);

    const content = additionalMessage 
      ? `[Shared Post: ${postId}] ${additionalMessage}`
      : `[Shared Post: ${postId}]`;

    const [newMessage] = await db.insert(messages)
      .values({
        conversationId,
        senderId,
        content,
        messageType: "post_share"
      })
      .returning();

    // Update conversation last message time
    await db.update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, conversationId));

    return { success: true, message: "Post shared", data: newMessage };
  }

  // Share a story via message
  async shareStory(
    senderId: number,
    recipientId: number,
    storyId: number,
    additionalMessage?: string
  ): Promise<MessageResult> {
    // Get or create conversation
    const conversationId = await this.getOrCreateConversation(senderId, recipientId);

    const content = additionalMessage 
      ? `[Shared Story: ${storyId}] ${additionalMessage}`
      : `[Shared Story: ${storyId}]`;

    const [newMessage] = await db.insert(messages)
      .values({
        conversationId,
        senderId,
        content,
        messageType: "story_share"
      })
      .returning();

    // Update conversation last message time
    await db.update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, conversationId));

    return { success: true, message: "Story shared", data: newMessage };
  }

  // Share a reel via message
  async shareReel(
    senderId: number,
    recipientId: number,
    reelId: number,
    additionalMessage?: string
  ): Promise<MessageResult> {
    // Get or create conversation
    const conversationId = await this.getOrCreateConversation(senderId, recipientId);

    const content = additionalMessage 
      ? `[Shared Reel: ${reelId}] ${additionalMessage}`
      : `[Shared Reel: ${reelId}]`;

    const [newMessage] = await db.insert(messages)
      .values({
        conversationId,
        senderId,
        content,
        messageType: "reel_share"
      })
      .returning();

    // Update conversation last message time
    await db.update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, conversationId));

    return { success: true, message: "Reel shared", data: newMessage };
  }

  // Get message with reactions
  async getMessageWithReactions(messageId: number): Promise<MessageWithReactions | null> {
    const [msg] = await db.select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    if (!msg) return null;

    const reactions = await this.getMessageReactions(messageId);

    return {
      ...msg,
      reactions
    };
  }

  // Mark message as read
  async markAsRead(messageId: number, userId: number): Promise<{ success: boolean }> {
    await db.update(messages)
      .set({ read: true })
      .where(eq(messages.id, messageId));

    return { success: true };
  }

  // Mark all messages in conversation as read
  async markConversationAsRead(
    conversationId: number, 
    userId: number
  ): Promise<{ success: boolean; count: number }> {
    // Get conversation to verify user is part of it
    const [conv] = await db.select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (!conv) {
      return { success: false, count: 0 };
    }

    if (conv.user1Id !== userId && conv.user2Id !== userId) {
      return { success: false, count: 0 };
    }

    // Mark all unread messages from other user as read
    const otherUserId = conv.user1Id === userId ? conv.user2Id : conv.user1Id;

    const result = await db.update(messages)
      .set({ read: true })
      .where(and(
        eq(messages.conversationId, conversationId),
        eq(messages.senderId, otherUserId),
        eq(messages.read, false)
      ));

    return { success: true, count: result.rowCount || 0 };
  }

  // Get unread message count
  async getUnreadCount(userId: number): Promise<number> {
    // Get all conversations for user
    const convs = await db.select({ id: conversations.id, user1Id: conversations.user1Id, user2Id: conversations.user2Id })
      .from(conversations)
      .where(sql`${conversations.user1Id} = ${userId} OR ${conversations.user2Id} = ${userId}`);

    let totalUnread = 0;

    for (const conv of convs) {
      const otherUserId = conv.user1Id === userId ? conv.user2Id : conv.user1Id;
      
      const unreadMessages = await db.select({ id: messages.id })
        .from(messages)
        .where(and(
          eq(messages.conversationId, conv.id),
          eq(messages.senderId, otherUserId),
          eq(messages.read, false)
        ));

      totalUnread += unreadMessages.length;
    }

    return totalUnread;
  }

  // Get or create conversation
  private async getOrCreateConversation(user1Id: number, user2Id: number): Promise<number> {
    const [existing] = await db.select()
      .from(conversations)
      .where(sql`(${conversations.user1Id} = ${user1Id} AND ${conversations.user2Id} = ${user2Id}) OR 
                 (${conversations.user1Id} = ${user2Id} AND ${conversations.user2Id} = ${user1Id})`)
      .limit(1);

    if (existing) {
      return existing.id;
    }

    const [newConv] = await db.insert(conversations)
      .values({ user1Id, user2Id })
      .returning();

    return newConv.id;
  }

  // Create reaction notification
  private async createReactionNotification(
    fromUserId: number, 
    toUserId: number, 
    messageId: number,
    reaction: string
  ): Promise<void> {
    const [fromUser] = await db.select({ username: users.username, profileImage: users.profileImage })
      .from(users)
      .where(eq(users.id, fromUserId))
      .limit(1);

    await db.insert(notifications).values({
      userId: toUserId,
      fromUserId,
      type: "message_reaction",
      title: "Message Reaction",
      message: `${fromUser?.username || 'Someone'} reacted ${reaction} to your message`,
      entityType: "message",
      entityId: messageId,
      imageUrl: fromUser?.profileImage,
      actionUrl: "/messages"
    });
  }

  // Clean up expired disappearing messages
  async cleanupExpiredMessages(): Promise<number> {
    const now = new Date();
    let cleaned = 0;

    const entries = Array.from(disappearingMessages.entries());
    for (const [messageId, info] of entries) {
      if (info.expiresAt <= now) {
        await db.delete(messageReactions).where(eq(messageReactions.messageId, messageId));
        await db.delete(messages).where(eq(messages.id, messageId));
        disappearingMessages.delete(messageId);
        cleaned++;
      }
    }

    return cleaned;
  }

  // Get conversation messages with reactions
  async getConversationMessagesWithReactions(
    conversationId: number,
    page: number = 1,
    limit: number = 50
  ): Promise<MessageWithReactions[]> {
    const offset = (page - 1) * limit;

    const msgs = await db.select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);

    const messagesWithReactions: MessageWithReactions[] = [];

    for (const msg of msgs) {
      const reactions = await this.getMessageReactions(msg.id);
      messagesWithReactions.push({
        ...msg,
        reactions
      });
    }

    return messagesWithReactions;
  }
}

// Export singleton instance
export const advancedMessagingService = new AdvancedMessagingService();
