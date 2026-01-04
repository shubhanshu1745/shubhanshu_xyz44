import { 
  users,
  conversations,
  messages
} from "@shared/schema";
import { db } from "../db";
import { eq, and, sql } from "drizzle-orm";

// In-memory storage for real-time state (would use Redis in production)
const typingIndicators = new Map<string, { userId: number; timestamp: Date }>();
const onlineUsers = new Map<number, { lastSeen: Date; socketId?: string }>();
const readReceipts = new Map<string, { messageId: number; readAt: Date }>();

// Typing indicator timeout (5 seconds)
const TYPING_TIMEOUT = 5000;
// Online status timeout (5 minutes)
const ONLINE_TIMEOUT = 5 * 60 * 1000;

export interface TypingStatus {
  userId: number;
  username: string;
  isTyping: boolean;
  conversationId: number;
}

export interface OnlineStatus {
  userId: number;
  isOnline: boolean;
  lastSeen: Date | null;
}

export interface ReadReceipt {
  messageId: number;
  userId: number;
  readAt: Date;
}

export class RealtimeMessagingService {
  
  // Set user as typing in a conversation
  setTyping(conversationId: number, userId: number): void {
    const key = `${conversationId}:${userId}`;
    typingIndicators.set(key, { userId, timestamp: new Date() });

    // Auto-clear typing after timeout
    setTimeout(() => {
      const current = typingIndicators.get(key);
      if (current && Date.now() - current.timestamp.getTime() >= TYPING_TIMEOUT) {
        typingIndicators.delete(key);
      }
    }, TYPING_TIMEOUT);
  }

  // Clear typing indicator
  clearTyping(conversationId: number, userId: number): void {
    const key = `${conversationId}:${userId}`;
    typingIndicators.delete(key);
  }

  // Check if user is typing in a conversation
  isTyping(conversationId: number, userId: number): boolean {
    const key = `${conversationId}:${userId}`;
    const indicator = typingIndicators.get(key);
    
    if (!indicator) return false;
    
    // Check if typing indicator has expired
    if (Date.now() - indicator.timestamp.getTime() >= TYPING_TIMEOUT) {
      typingIndicators.delete(key);
      return false;
    }
    
    return true;
  }

  // Get all users typing in a conversation
  async getTypingUsers(conversationId: number, excludeUserId?: number): Promise<TypingStatus[]> {
    const typingUsers: TypingStatus[] = [];
    
    const entries = Array.from(typingIndicators.entries());
    for (const [key, value] of entries) {
      if (key.startsWith(`${conversationId}:`)) {
        if (excludeUserId && value.userId === excludeUserId) continue;
        
        // Check if still valid
        if (Date.now() - value.timestamp.getTime() >= TYPING_TIMEOUT) {
          typingIndicators.delete(key);
          continue;
        }

        // Get username
        const [user] = await db.select({ username: users.username })
          .from(users)
          .where(eq(users.id, value.userId))
          .limit(1);

        if (user) {
          typingUsers.push({
            userId: value.userId,
            username: user.username,
            isTyping: true,
            conversationId
          });
        }
      }
    }

    return typingUsers;
  }

  // Set user as online
  setOnline(userId: number, socketId?: string): void {
    onlineUsers.set(userId, { lastSeen: new Date(), socketId });
  }

  // Set user as offline
  setOffline(userId: number): void {
    const current = onlineUsers.get(userId);
    if (current) {
      // Keep last seen time but mark as offline
      onlineUsers.set(userId, { lastSeen: current.lastSeen, socketId: undefined });
    }
  }

  // Update last seen time
  updateLastSeen(userId: number): void {
    const current = onlineUsers.get(userId);
    if (current) {
      current.lastSeen = new Date();
    } else {
      onlineUsers.set(userId, { lastSeen: new Date() });
    }
  }

  // Check if user is online
  isOnline(userId: number): boolean {
    const status = onlineUsers.get(userId);
    if (!status || !status.socketId) return false;
    
    // Check if online status has expired
    if (Date.now() - status.lastSeen.getTime() >= ONLINE_TIMEOUT) {
      return false;
    }
    
    return true;
  }

  // Get online status for a user
  async getOnlineStatus(userId: number): Promise<OnlineStatus> {
    // Check if user has activity status enabled
    const [user] = await db.select({ showActivityStatus: users.showActivityStatus })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.showActivityStatus) {
      return { userId, isOnline: false, lastSeen: null };
    }

    const status = onlineUsers.get(userId);
    
    return {
      userId,
      isOnline: this.isOnline(userId),
      lastSeen: status?.lastSeen || null
    };
  }

  // Get online status for multiple users
  async getBulkOnlineStatus(userIds: number[]): Promise<Map<number, OnlineStatus>> {
    const result = new Map<number, OnlineStatus>();

    for (const userId of userIds) {
      const status = await this.getOnlineStatus(userId);
      result.set(userId, status);
    }

    return result;
  }

  // Record read receipt
  recordReadReceipt(conversationId: number, messageId: number, userId: number): void {
    const key = `${conversationId}:${messageId}:${userId}`;
    readReceipts.set(key, { messageId, readAt: new Date() });
  }

  // Get read receipt for a message
  getReadReceipt(conversationId: number, messageId: number, userId: number): ReadReceipt | null {
    const key = `${conversationId}:${messageId}:${userId}`;
    const receipt = readReceipts.get(key);
    
    if (!receipt) return null;
    
    return {
      messageId: receipt.messageId,
      userId,
      readAt: receipt.readAt
    };
  }

  // Check if message has been read by user
  hasBeenRead(conversationId: number, messageId: number, userId: number): boolean {
    const key = `${conversationId}:${messageId}:${userId}`;
    return readReceipts.has(key);
  }

  // Get all read receipts for a message
  async getMessageReadReceipts(
    conversationId: number, 
    messageId: number
  ): Promise<ReadReceipt[]> {
    const receipts: ReadReceipt[] = [];
    
    const entries = Array.from(readReceipts.entries());
    for (const [key, value] of entries) {
      if (key.startsWith(`${conversationId}:${messageId}:`)) {
        const parts = key.split(':');
        const userId = parseInt(parts[2], 10);
        
        receipts.push({
          messageId: value.messageId,
          userId,
          readAt: value.readAt
        });
      }
    }

    return receipts;
  }

  // Get conversation participants' online status
  async getConversationOnlineStatus(conversationId: number): Promise<OnlineStatus[]> {
    const [conv] = await db.select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (!conv) return [];

    const statuses: OnlineStatus[] = [];
    
    const status1 = await this.getOnlineStatus(conv.user1Id);
    const status2 = await this.getOnlineStatus(conv.user2Id);
    
    statuses.push(status1, status2);

    return statuses;
  }

  // Format last seen time
  formatLastSeen(lastSeen: Date | null): string {
    if (!lastSeen) return "Unknown";

    const now = new Date();
    const diff = now.getTime() - lastSeen.getTime();

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} days ago`;
    
    return lastSeen.toLocaleDateString();
  }

  // Get active conversations (with online users)
  async getActiveConversations(userId: number): Promise<{
    conversationId: number;
    otherUserId: number;
    isOnline: boolean;
    isTyping: boolean;
  }[]> {
    const convs = await db.select()
      .from(conversations)
      .where(sql`${conversations.user1Id} = ${userId} OR ${conversations.user2Id} = ${userId}`);

    const activeConvs: {
      conversationId: number;
      otherUserId: number;
      isOnline: boolean;
      isTyping: boolean;
    }[] = [];

    for (const conv of convs) {
      const otherUserId = conv.user1Id === userId ? conv.user2Id : conv.user1Id;
      
      activeConvs.push({
        conversationId: conv.id,
        otherUserId,
        isOnline: this.isOnline(otherUserId),
        isTyping: this.isTyping(conv.id, otherUserId)
      });
    }

    return activeConvs;
  }

  // Clean up stale data
  cleanup(): { typingCleared: number; offlineMarked: number } {
    const now = Date.now();
    let typingCleared = 0;
    let offlineMarked = 0;

    // Clear stale typing indicators
    const typingEntries = Array.from(typingIndicators.entries());
    for (const [key, value] of typingEntries) {
      if (now - value.timestamp.getTime() >= TYPING_TIMEOUT) {
        typingIndicators.delete(key);
        typingCleared++;
      }
    }

    // Mark stale users as offline
    const onlineEntries = Array.from(onlineUsers.entries());
    for (const [userId, status] of onlineEntries) {
      if (status.socketId && now - status.lastSeen.getTime() >= ONLINE_TIMEOUT) {
        status.socketId = undefined;
        offlineMarked++;
      }
    }

    return { typingCleared, offlineMarked };
  }

  // Get online user count
  getOnlineUserCount(): number {
    let count = 0;
    const now = Date.now();

    onlineUsers.forEach((status) => {
      if (status.socketId && now - status.lastSeen.getTime() < ONLINE_TIMEOUT) {
        count++;
      }
    });

    return count;
  }

  // Broadcast typing status (would integrate with Socket.IO)
  async broadcastTypingStatus(
    conversationId: number, 
    userId: number, 
    isTyping: boolean
  ): Promise<{ recipientId: number; status: TypingStatus } | null> {
    // Get conversation to find recipient
    const [conv] = await db.select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (!conv) return null;

    const recipientId = conv.user1Id === userId ? conv.user2Id : conv.user1Id;

    // Get username
    const [user] = await db.select({ username: users.username })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return {
      recipientId,
      status: {
        userId,
        username: user?.username || "Unknown",
        isTyping,
        conversationId
      }
    };
  }

  // Broadcast online status change (would integrate with Socket.IO)
  async broadcastOnlineStatus(userId: number, isOnline: boolean): Promise<number[]> {
    // Get all users who have conversations with this user
    const convs = await db.select()
      .from(conversations)
      .where(sql`${conversations.user1Id} = ${userId} OR ${conversations.user2Id} = ${userId}`);

    const recipientIds: number[] = [];

    for (const conv of convs) {
      const otherUserId = conv.user1Id === userId ? conv.user2Id : conv.user1Id;
      recipientIds.push(otherUserId);
    }

    return recipientIds;
  }
}

// Export singleton instance
export const realtimeMessagingService = new RealtimeMessagingService();
