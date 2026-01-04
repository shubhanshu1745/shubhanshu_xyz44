import { 
  notifications,
  users,
  type Notification
} from "@shared/schema";
import { db } from "../db";
import { eq, and, desc } from "drizzle-orm";

// In-memory storage for real-time notification state
const userSockets = new Map<number, Set<string>>(); // userId -> Set of socketIds
const notificationBadges = new Map<number, number>(); // userId -> unread count
const notificationSettings = new Map<number, NotificationSoundSettings>();

export interface NotificationSoundSettings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  soundType: "default" | "subtle" | "none";
}

export interface RealtimeNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  fromUser?: {
    id: number;
    username: string;
    profileImage: string | null;
  };
  entityType?: string;
  entityId?: number;
  actionUrl?: string;
  createdAt: Date;
}

export interface NotificationDeliveryResult {
  success: boolean;
  delivered: boolean;
  socketIds: string[];
}

const DEFAULT_SOUND_SETTINGS: NotificationSoundSettings = {
  soundEnabled: true,
  vibrationEnabled: true,
  soundType: "default"
};

export class RealtimeNotificationService {
  
  // Register a socket connection for a user
  registerSocket(userId: number, socketId: string): void {
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId)!.add(socketId);
  }

  // Unregister a socket connection
  unregisterSocket(userId: number, socketId: string): void {
    const sockets = userSockets.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        userSockets.delete(userId);
      }
    }
  }

  // Check if user has active connections
  isUserConnected(userId: number): boolean {
    const sockets = userSockets.get(userId);
    return sockets !== undefined && sockets.size > 0;
  }

  // Get all socket IDs for a user
  getUserSocketIds(userId: number): string[] {
    const sockets = userSockets.get(userId);
    return sockets ? Array.from(sockets) : [];
  }

  // Prepare notification for real-time delivery
  async prepareNotification(notification: Notification): Promise<RealtimeNotification> {
    let fromUser: { id: number; username: string; profileImage: string | null } | undefined;

    if (notification.fromUserId) {
      const [user] = await db.select({
        id: users.id,
        username: users.username,
        profileImage: users.profileImage
      })
      .from(users)
      .where(eq(users.id, notification.fromUserId))
      .limit(1);

      if (user) {
        fromUser = user;
      }
    }

    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      fromUser,
      entityType: notification.entityType || undefined,
      entityId: notification.entityId || undefined,
      actionUrl: notification.actionUrl || undefined,
      createdAt: notification.createdAt || new Date()
    };
  }

  // Deliver notification to user (returns socket IDs to emit to)
  async deliverNotification(
    userId: number, 
    notification: Notification
  ): Promise<NotificationDeliveryResult> {
    const socketIds = this.getUserSocketIds(userId);
    
    if (socketIds.length === 0) {
      return { success: true, delivered: false, socketIds: [] };
    }

    // Update badge count
    this.incrementBadge(userId);

    return { success: true, delivered: true, socketIds };
  }

  // Get notification badge count
  getBadgeCount(userId: number): number {
    return notificationBadges.get(userId) || 0;
  }

  // Set notification badge count
  setBadgeCount(userId: number, count: number): void {
    notificationBadges.set(userId, Math.max(0, count));
  }

  // Increment badge count
  incrementBadge(userId: number): void {
    const current = this.getBadgeCount(userId);
    notificationBadges.set(userId, current + 1);
  }

  // Decrement badge count
  decrementBadge(userId: number): void {
    const current = this.getBadgeCount(userId);
    notificationBadges.set(userId, Math.max(0, current - 1));
  }

  // Clear badge count
  clearBadge(userId: number): void {
    notificationBadges.set(userId, 0);
  }

  // Sync badge count with database
  async syncBadgeCount(userId: number): Promise<number> {
    const unreadNotifs = await db.select({ id: notifications.id })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));

    const count = unreadNotifs.length;
    this.setBadgeCount(userId, count);
    return count;
  }

  // Get sound settings for a user
  getSoundSettings(userId: number): NotificationSoundSettings {
    return notificationSettings.get(userId) || { ...DEFAULT_SOUND_SETTINGS };
  }

  // Update sound settings
  updateSoundSettings(userId: number, settings: Partial<NotificationSoundSettings>): NotificationSoundSettings {
    const current = this.getSoundSettings(userId);
    const updated = { ...current, ...settings };
    notificationSettings.set(userId, updated);
    return updated;
  }

  // Get notification sound type based on notification type
  getNotificationSound(notificationType: string, settings: NotificationSoundSettings): string | null {
    if (!settings.soundEnabled || settings.soundType === "none") {
      return null;
    }

    // Different sounds for different notification types
    const soundMap: Record<string, string> = {
      message: "message.mp3",
      like: "like.mp3",
      comment: "comment.mp3",
      follow_request: "follow.mp3",
      mention: "mention.mp3",
      default: "notification.mp3"
    };

    if (settings.soundType === "subtle") {
      return "subtle.mp3";
    }

    return soundMap[notificationType] || soundMap.default;
  }

  // Should vibrate for notification
  shouldVibrate(settings: NotificationSoundSettings): boolean {
    return settings.vibrationEnabled;
  }

  // Get recent notifications for initial load
  async getRecentNotifications(userId: number, limit: number = 10): Promise<RealtimeNotification[]> {
    const notifs = await db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

    const prepared: RealtimeNotification[] = [];
    for (const notif of notifs) {
      prepared.push(await this.prepareNotification(notif));
    }

    return prepared;
  }

  // Broadcast notification to multiple users
  async broadcastNotification(
    userIds: number[],
    notification: Omit<Notification, 'id' | 'userId' | 'createdAt'>
  ): Promise<{ delivered: number; failed: number }> {
    let delivered = 0;
    let failed = 0;

    for (const userId of userIds) {
      try {
        // Create notification in database
        const [created] = await db.insert(notifications)
          .values({
            ...notification,
            userId,
            isRead: false
          })
          .returning();

        // Attempt real-time delivery
        const result = await this.deliverNotification(userId, created);
        if (result.delivered) {
          delivered++;
        }
      } catch (error) {
        failed++;
      }
    }

    return { delivered, failed };
  }

  // Get connected user count
  getConnectedUserCount(): number {
    return userSockets.size;
  }

  // Get total connection count
  getTotalConnectionCount(): number {
    let total = 0;
    userSockets.forEach(sockets => {
      total += sockets.size;
    });
    return total;
  }

  // Clean up disconnected sockets
  cleanup(): { usersRemoved: number; socketsRemoved: number } {
    // This would be called periodically to clean up stale connections
    // In a real implementation, this would check socket health
    return { usersRemoved: 0, socketsRemoved: 0 };
  }

  // Create notification payload for Socket.IO emission
  createSocketPayload(notification: RealtimeNotification, settings: NotificationSoundSettings): {
    notification: RealtimeNotification;
    sound: string | null;
    vibrate: boolean;
  } {
    return {
      notification,
      sound: this.getNotificationSound(notification.type, settings),
      vibrate: this.shouldVibrate(settings)
    };
  }

  // Mark notification as delivered (for tracking)
  async markAsDelivered(notificationId: number): Promise<void> {
    // In a production system, you might track delivery status
    // For now, this is a placeholder
  }

  // Get undelivered notifications for a user (for when they reconnect)
  async getUndeliveredNotifications(userId: number): Promise<RealtimeNotification[]> {
    // Get unread notifications that might not have been delivered
    const unread = await db.select()
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ))
      .orderBy(desc(notifications.createdAt))
      .limit(50);

    const prepared: RealtimeNotification[] = [];
    for (const notif of unread) {
      prepared.push(await this.prepareNotification(notif));
    }

    return prepared;
  }

  // Handle user connection (sync state)
  async handleUserConnect(userId: number, socketId: string): Promise<{
    badgeCount: number;
    undelivered: RealtimeNotification[];
    settings: NotificationSoundSettings;
  }> {
    this.registerSocket(userId, socketId);
    
    const badgeCount = await this.syncBadgeCount(userId);
    const undelivered = await this.getUndeliveredNotifications(userId);
    const settings = this.getSoundSettings(userId);

    return { badgeCount, undelivered, settings };
  }

  // Handle user disconnection
  handleUserDisconnect(userId: number, socketId: string): void {
    this.unregisterSocket(userId, socketId);
  }
}

// Export singleton instance
export const realtimeNotificationService = new RealtimeNotificationService();
