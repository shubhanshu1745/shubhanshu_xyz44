import { 
  notifications,
  users,
  type Notification
} from "@shared/schema";
import { db } from "../db";
import { eq, and, desc, sql, count, inArray, gte } from "drizzle-orm";

export type NotificationType = 
  | "follow_request"
  | "follow_accepted"
  | "like"
  | "comment"
  | "mention"
  | "story_view"
  | "story_reply"
  | "post_share"
  | "message"
  | "message_request"
  | "message_request_accepted"
  | "message_reaction"
  | "collaboration"
  | "group_chat"
  | "tag"
  | "live"
  | "system";

export interface NotificationPreferences {
  followRequests: boolean;
  likes: boolean;
  comments: boolean;
  mentions: boolean;
  storyViews: boolean;
  messages: boolean;
  liveNotifications: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export interface GroupedNotification {
  type: NotificationType;
  count: number;
  latestNotification: Notification;
  users: { id: number; username: string; profileImage: string | null }[];
  message: string;
}

export interface NotificationResult {
  success: boolean;
  message: string;
  notification?: Notification;
}

// In-memory storage for notification preferences (would be a DB table in production)
const notificationPreferences = new Map<number, NotificationPreferences>();

const DEFAULT_PREFERENCES: NotificationPreferences = {
  followRequests: true,
  likes: true,
  comments: true,
  mentions: true,
  storyViews: true,
  messages: true,
  liveNotifications: true,
  emailNotifications: false,
  pushNotifications: true
};

export class EnhancedNotificationService {
  
  // Create a notification
  async createNotification(
    userId: number,
    fromUserId: number | null,
    type: NotificationType,
    title: string,
    message: string,
    entityType?: string,
    entityId?: number,
    actionUrl?: string
  ): Promise<NotificationResult> {
    // Check if user has this notification type enabled
    const prefs = this.getPreferences(userId);
    if (!this.isNotificationEnabled(type, prefs)) {
      return { success: false, message: "Notification type disabled by user" };
    }

    // Get from user's profile image if available
    let imageUrl: string | null = null;
    if (fromUserId) {
      const [fromUser] = await db.select({ profileImage: users.profileImage })
        .from(users)
        .where(eq(users.id, fromUserId))
        .limit(1);
      imageUrl = fromUser?.profileImage || null;
    }

    const [notification] = await db.insert(notifications)
      .values({
        userId,
        fromUserId,
        type,
        title,
        message,
        entityType,
        entityId,
        imageUrl,
        actionUrl,
        isRead: false
      })
      .returning();

    return { success: true, message: "Notification created", notification };
  }

  // Get notifications for a user
  async getNotifications(
    userId: number,
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false
  ): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> {
    const offset = (page - 1) * limit;

    let query = db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId));

    if (unreadOnly) {
      query = db.select()
        .from(notifications)
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        ));
    }

    const notifs = await query
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [totalResult] = await db.select({ count: count() })
      .from(notifications)
      .where(eq(notifications.userId, userId));

    // Get unread count
    const [unreadResult] = await db.select({ count: count() })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));

    return {
      notifications: notifs,
      total: totalResult?.count || 0,
      unreadCount: unreadResult?.count || 0
    };
  }

  // Get grouped notifications (smart batching)
  async getGroupedNotifications(
    userId: number,
    limit: number = 20
  ): Promise<GroupedNotification[]> {
    // Get recent notifications
    const recentNotifs = await db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(100);

    // Group by type and entity
    const groups = new Map<string, Notification[]>();

    for (const notif of recentNotifs) {
      const key = `${notif.type}:${notif.entityType}:${notif.entityId}`;
      const existing = groups.get(key) || [];
      existing.push(notif);
      groups.set(key, existing);
    }

    // Convert to grouped notifications
    const grouped: GroupedNotification[] = [];

    const entries = Array.from(groups.entries());
    for (const [key, notifs] of entries) {
      if (notifs.length === 0) continue;

      const latest = notifs[0];
      const userIds = notifs
        .filter(n => n.fromUserId)
        .map(n => n.fromUserId as number)
        .filter((id, index, self) => self.indexOf(id) === index)
        .slice(0, 3);

      // Get user info
      const userInfos: { id: number; username: string; profileImage: string | null }[] = [];
      if (userIds.length > 0) {
        const usersData = await db.select({
          id: users.id,
          username: users.username,
          profileImage: users.profileImage
        })
        .from(users)
        .where(inArray(users.id, userIds));
        userInfos.push(...usersData);
      }

      // Generate grouped message
      let message = latest.message;
      if (notifs.length > 1) {
        const otherCount = notifs.length - 1;
        if (userInfos.length > 0) {
          message = `${userInfos[0].username} and ${otherCount} others ${this.getActionText(latest.type as NotificationType)}`;
        }
      }

      grouped.push({
        type: latest.type as NotificationType,
        count: notifs.length,
        latestNotification: latest,
        users: userInfos,
        message
      });
    }

    // Sort by latest notification time and limit
    return grouped
      .sort((a, b) => {
        const aTime = a.latestNotification.createdAt?.getTime() || 0;
        const bTime = b.latestNotification.createdAt?.getTime() || 0;
        return bTime - aTime;
      })
      .slice(0, limit);
  }

  // Get action text for notification type
  private getActionText(type: NotificationType): string {
    const actions: Record<NotificationType, string> = {
      follow_request: "requested to follow you",
      follow_accepted: "accepted your follow request",
      like: "liked your post",
      comment: "commented on your post",
      mention: "mentioned you",
      story_view: "viewed your story",
      story_reply: "replied to your story",
      post_share: "shared your post",
      message: "sent you a message",
      message_request: "wants to send you a message",
      message_request_accepted: "accepted your message request",
      message_reaction: "reacted to your message",
      collaboration: "invited you to collaborate",
      group_chat: "added you to a group",
      tag: "tagged you in a post",
      live: "started a live video",
      system: "sent you a notification"
    };
    return actions[type] || "interacted with you";
  }

  // Mark notification as read
  async markAsRead(notificationId: number, userId: number): Promise<{ success: boolean }> {
    await db.update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      ));

    return { success: true };
  }

  // Mark all notifications as read
  async markAllAsRead(userId: number): Promise<{ success: boolean; count: number }> {
    const result = await db.update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));

    return { success: true, count: result.rowCount || 0 };
  }

  // Delete a notification
  async deleteNotification(notificationId: number, userId: number): Promise<{ success: boolean }> {
    await db.delete(notifications)
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      ));

    return { success: true };
  }

  // Delete all notifications
  async deleteAllNotifications(userId: number): Promise<{ success: boolean; count: number }> {
    const result = await db.delete(notifications)
      .where(eq(notifications.userId, userId));

    return { success: true, count: result.rowCount || 0 };
  }

  // Get unread count
  async getUnreadCount(userId: number): Promise<number> {
    const [result] = await db.select({ count: count() })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));

    return result?.count || 0;
  }

  // Get notification preferences
  getPreferences(userId: number): NotificationPreferences {
    return notificationPreferences.get(userId) || { ...DEFAULT_PREFERENCES };
  }

  // Update notification preferences
  updatePreferences(userId: number, prefs: Partial<NotificationPreferences>): NotificationPreferences {
    const current = this.getPreferences(userId);
    const updated = { ...current, ...prefs };
    notificationPreferences.set(userId, updated);
    return updated;
  }

  // Check if notification type is enabled
  private isNotificationEnabled(type: NotificationType, prefs: NotificationPreferences): boolean {
    switch (type) {
      case "follow_request":
      case "follow_accepted":
        return prefs.followRequests;
      case "like":
        return prefs.likes;
      case "comment":
        return prefs.comments;
      case "mention":
      case "tag":
        return prefs.mentions;
      case "story_view":
      case "story_reply":
        return prefs.storyViews;
      case "message":
      case "message_request":
      case "message_request_accepted":
      case "message_reaction":
        return prefs.messages;
      case "live":
        return prefs.liveNotifications;
      default:
        return true;
    }
  }

  // Get notifications by type
  async getNotificationsByType(
    userId: number,
    type: NotificationType,
    limit: number = 20
  ): Promise<Notification[]> {
    return await db.select()
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.type, type)
      ))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  // Get recent activity (last 24 hours)
  async getRecentActivity(userId: number): Promise<{
    followRequests: number;
    likes: number;
    comments: number;
    mentions: number;
    messages: number;
  }> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const recentNotifs = await db.select()
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        gte(notifications.createdAt, oneDayAgo)
      ));

    const activity = {
      followRequests: 0,
      likes: 0,
      comments: 0,
      mentions: 0,
      messages: 0
    };

    for (const notif of recentNotifs) {
      switch (notif.type) {
        case "follow_request":
          activity.followRequests++;
          break;
        case "like":
          activity.likes++;
          break;
        case "comment":
          activity.comments++;
          break;
        case "mention":
        case "tag":
          activity.mentions++;
          break;
        case "message":
        case "message_request":
          activity.messages++;
          break;
      }
    }

    return activity;
  }

  // Create bulk notifications (for broadcasting)
  async createBulkNotifications(
    userIds: number[],
    fromUserId: number | null,
    type: NotificationType,
    title: string,
    message: string,
    entityType?: string,
    entityId?: number,
    actionUrl?: string
  ): Promise<{ success: boolean; count: number }> {
    let created = 0;

    for (const userId of userIds) {
      const result = await this.createNotification(
        userId,
        fromUserId,
        type,
        title,
        message,
        entityType,
        entityId,
        actionUrl
      );

      if (result.success) created++;
    }

    return { success: true, count: created };
  }

  // Clean up old notifications (older than 30 days)
  async cleanupOldNotifications(): Promise<{ deleted: number }> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const result = await db.delete(notifications)
      .where(sql`${notifications.createdAt} < ${thirtyDaysAgo} AND ${notifications.isRead} = true`);

    return { deleted: result.rowCount || 0 };
  }

  // Get notification statistics
  async getNotificationStats(userId: number): Promise<{
    total: number;
    unread: number;
    byType: Record<string, number>;
    lastWeek: number;
  }> {
    const allNotifs = await db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId));

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const byType: Record<string, number> = {};
    let unread = 0;
    let lastWeek = 0;

    for (const notif of allNotifs) {
      // Count by type
      byType[notif.type] = (byType[notif.type] || 0) + 1;

      // Count unread
      if (!notif.isRead) unread++;

      // Count last week
      if (notif.createdAt && notif.createdAt >= oneWeekAgo) lastWeek++;
    }

    return {
      total: allNotifs.length,
      unread,
      byType,
      lastWeek
    };
  }
}

// Export singleton instance
export const enhancedNotificationService = new EnhancedNotificationService();
