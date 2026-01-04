import { 
  posts,
  likes,
  comments,
  follows,
  stories,
  storyViews,
  users
} from "@shared/schema";
import { db } from "../db";
import { eq, and, desc, sql, gt } from "drizzle-orm";

// In-memory storage for real-time state
const userConnections = new Map<number, Set<string>>(); // userId -> socketIds
const userActivity = new Map<number, { lastActive: Date; status: string }>();
const liveUpdates = new Map<string, Set<number>>(); // entityKey -> subscribedUserIds

export interface RealTimeEvent {
  type: string;
  payload: Record<string, unknown>;
  timestamp: Date;
  targetUsers?: number[];
}

export interface LiveUpdate {
  entityType: "post" | "story" | "user" | "comment";
  entityId: number;
  updateType: "like" | "comment" | "view" | "follow" | "reaction";
  data: Record<string, unknown>;
}

export interface ActivityFeedItem {
  id: string;
  type: string;
  userId: number;
  username: string;
  userImage: string | null;
  action: string;
  targetType?: string;
  targetId?: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export class RealtimeSocialService {

  // ==================== CONNECTION MANAGEMENT ====================

  // Register user connection
  registerConnection(userId: number, socketId: string): void {
    if (!userConnections.has(userId)) {
      userConnections.set(userId, new Set());
    }
    userConnections.get(userId)!.add(socketId);
    
    // Update activity status
    userActivity.set(userId, {
      lastActive: new Date(),
      status: "online"
    });
  }

  // Unregister user connection
  unregisterConnection(userId: number, socketId: string): void {
    const connections = userConnections.get(userId);
    if (connections) {
      connections.delete(socketId);
      if (connections.size === 0) {
        userConnections.delete(userId);
        // Update to offline status
        userActivity.set(userId, {
          lastActive: new Date(),
          status: "offline"
        });
      }
    }
  }

  // Check if user is online
  isUserOnline(userId: number): boolean {
    return userConnections.has(userId) && userConnections.get(userId)!.size > 0;
  }

  // Get user's socket IDs
  getUserSocketIds(userId: number): string[] {
    const connections = userConnections.get(userId);
    return connections ? Array.from(connections) : [];
  }

  // Get user activity status
  getUserActivity(userId: number): { lastActive: Date; status: string } | null {
    return userActivity.get(userId) || null;
  }

  // ==================== REAL-TIME SOCIAL INTERACTIONS ====================

  // Create like update event
  async createLikeUpdate(
    postId: number,
    userId: number,
    isLike: boolean
  ): Promise<RealTimeEvent> {
    // Get post owner
    const [post] = await db.select({ userId: posts.userId })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    // Get current like count
    const [likeData] = await db.select({ count: sql<number>`count(*)` })
      .from(likes)
      .where(eq(likes.postId, postId));

    // Get user info
    const [user] = await db.select({
      username: users.username,
      profileImage: users.profileImage
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

    return {
      type: "post_like",
      payload: {
        postId,
        userId,
        username: user?.username,
        userImage: user?.profileImage,
        isLike,
        likeCount: Number(likeData?.count || 0)
      },
      timestamp: new Date(),
      targetUsers: post ? [post.userId] : []
    };
  }

  // Create comment update event
  async createCommentUpdate(
    postId: number,
    commentId: number,
    userId: number,
    content: string
  ): Promise<RealTimeEvent> {
    // Get post owner
    const [post] = await db.select({ userId: posts.userId })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    // Get comment count
    const [commentData] = await db.select({ count: sql<number>`count(*)` })
      .from(comments)
      .where(eq(comments.postId, postId));

    // Get user info
    const [user] = await db.select({
      username: users.username,
      profileImage: users.profileImage
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

    return {
      type: "post_comment",
      payload: {
        postId,
        commentId,
        userId,
        username: user?.username,
        userImage: user?.profileImage,
        content: content.substring(0, 100),
        commentCount: Number(commentData?.count || 0)
      },
      timestamp: new Date(),
      targetUsers: post ? [post.userId] : []
    };
  }

  // Create follower count update event
  async createFollowerUpdate(
    targetUserId: number,
    followerId: number,
    isFollow: boolean
  ): Promise<RealTimeEvent> {
    // Get follower count
    const [followerData] = await db.select({ count: sql<number>`count(*)` })
      .from(follows)
      .where(and(
        eq(follows.followingId, targetUserId),
        eq(follows.status, "accepted")
      ));

    // Get follower info
    const [follower] = await db.select({
      username: users.username,
      profileImage: users.profileImage
    })
    .from(users)
    .where(eq(users.id, followerId))
    .limit(1);

    return {
      type: "follower_update",
      payload: {
        targetUserId,
        followerId,
        followerUsername: follower?.username,
        followerImage: follower?.profileImage,
        isFollow,
        followerCount: Number(followerData?.count || 0)
      },
      timestamp: new Date(),
      targetUsers: [targetUserId]
    };
  }

  // Create story view notification
  async createStoryViewUpdate(
    storyId: number,
    viewerId: number
  ): Promise<RealTimeEvent> {
    // Get story owner
    const [story] = await db.select({ userId: stories.userId })
      .from(stories)
      .where(eq(stories.id, storyId))
      .limit(1);

    // Get view count
    const [viewData] = await db.select({ count: sql<number>`count(*)` })
      .from(storyViews)
      .where(eq(storyViews.storyId, storyId));

    // Get viewer info
    const [viewer] = await db.select({
      username: users.username,
      profileImage: users.profileImage
    })
    .from(users)
    .where(eq(users.id, viewerId))
    .limit(1);

    return {
      type: "story_view",
      payload: {
        storyId,
        viewerId,
        viewerUsername: viewer?.username,
        viewerImage: viewer?.profileImage,
        viewCount: Number(viewData?.count || 0)
      },
      timestamp: new Date(),
      targetUsers: story ? [story.userId] : []
    };
  }


  // ==================== LIVE ACTIVITY FEED ====================

  // Get live activity feed for a user
  async getLiveActivityFeed(
    userId: number,
    limit: number = 20
  ): Promise<ActivityFeedItem[]> {
    const activities: ActivityFeedItem[] = [];
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Get users this person follows
    const following = await db.select({ followingId: follows.followingId })
      .from(follows)
      .where(and(
        eq(follows.followerId, userId),
        eq(follows.status, "accepted")
      ));

    const followingIds = following.map((f: { followingId: number }) => f.followingId);
    if (followingIds.length === 0) return [];

    // Get recent posts from followed users
    for (const followedId of followingIds.slice(0, 10)) {
      const recentPosts = await db.select({
        id: posts.id,
        content: posts.content,
        createdAt: posts.createdAt
      })
      .from(posts)
      .where(and(
        eq(posts.userId, followedId),
        gt(posts.createdAt, oneHourAgo)
      ))
      .orderBy(desc(posts.createdAt))
      .limit(3);

      const [user] = await db.select({
        username: users.username,
        profileImage: users.profileImage
      })
      .from(users)
      .where(eq(users.id, followedId))
      .limit(1);

      for (const post of recentPosts) {
        activities.push({
          id: `post_${post.id}`,
          type: "new_post",
          userId: followedId,
          username: user?.username || "unknown",
          userImage: user?.profileImage || null,
          action: "shared a new post",
          targetType: "post",
          targetId: post.id,
          timestamp: post.createdAt || new Date(),
          metadata: { preview: post.content?.substring(0, 50) }
        });
      }
    }

    // Get recent stories from followed users
    for (const followedId of followingIds.slice(0, 10)) {
      const recentStories = await db.select({
        id: stories.id,
        createdAt: stories.createdAt
      })
      .from(stories)
      .where(and(
        eq(stories.userId, followedId),
        gt(stories.createdAt, oneHourAgo)
      ))
      .orderBy(desc(stories.createdAt))
      .limit(1);

      if (recentStories.length > 0) {
        const [user] = await db.select({
          username: users.username,
          profileImage: users.profileImage
        })
        .from(users)
        .where(eq(users.id, followedId))
        .limit(1);

        activities.push({
          id: `story_${recentStories[0].id}`,
          type: "new_story",
          userId: followedId,
          username: user?.username || "unknown",
          userImage: user?.profileImage || null,
          action: "added to their story",
          targetType: "story",
          targetId: recentStories[0].id,
          timestamp: recentStories[0].createdAt || new Date()
        });
      }
    }

    // Sort by timestamp and limit
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // ==================== SUBSCRIPTION MANAGEMENT ====================

  // Subscribe to entity updates
  subscribeToEntity(
    entityType: string,
    entityId: number,
    userId: number
  ): void {
    const key = `${entityType}_${entityId}`;
    if (!liveUpdates.has(key)) {
      liveUpdates.set(key, new Set());
    }
    liveUpdates.get(key)!.add(userId);
  }

  // Unsubscribe from entity updates
  unsubscribeFromEntity(
    entityType: string,
    entityId: number,
    userId: number
  ): void {
    const key = `${entityType}_${entityId}`;
    const subscribers = liveUpdates.get(key);
    if (subscribers) {
      subscribers.delete(userId);
      if (subscribers.size === 0) {
        liveUpdates.delete(key);
      }
    }
  }

  // Get subscribers for an entity
  getEntitySubscribers(entityType: string, entityId: number): number[] {
    const key = `${entityType}_${entityId}`;
    const subscribers = liveUpdates.get(key);
    return subscribers ? Array.from(subscribers) : [];
  }

  // ==================== WEBSOCKET OPTIMIZATION ====================

  // Batch events for efficient delivery
  batchEvents(events: RealTimeEvent[]): Map<number, RealTimeEvent[]> {
    const batched = new Map<number, RealTimeEvent[]>();

    for (const event of events) {
      if (event.targetUsers) {
        for (const userId of event.targetUsers) {
          if (!batched.has(userId)) {
            batched.set(userId, []);
          }
          batched.get(userId)!.push(event);
        }
      }
    }

    return batched;
  }

  // Throttle events by type
  private eventThrottles = new Map<string, Date>();
  
  shouldThrottleEvent(eventType: string, userId: number, throttleMs: number = 1000): boolean {
    const key = `${eventType}_${userId}`;
    const lastEvent = this.eventThrottles.get(key);
    const now = new Date();

    if (lastEvent && (now.getTime() - lastEvent.getTime()) < throttleMs) {
      return true;
    }

    this.eventThrottles.set(key, now);
    return false;
  }

  // ==================== STATISTICS ====================

  // Get real-time statistics
  getRealtimeStats(): {
    onlineUsers: number;
    totalConnections: number;
    activeSubscriptions: number;
  } {
    let totalConnections = 0;
    userConnections.forEach(connections => {
      totalConnections += connections.size;
    });

    let activeSubscriptions = 0;
    liveUpdates.forEach(subscribers => {
      activeSubscriptions += subscribers.size;
    });

    return {
      onlineUsers: userConnections.size,
      totalConnections,
      activeSubscriptions
    };
  }

  // Get online friends for a user
  async getOnlineFriends(userId: number): Promise<{
    userId: number;
    username: string;
    profileImage: string | null;
    status: string;
  }[]> {
    // Get users this person follows who also follow back (mutual)
    const following = await db.select({ followingId: follows.followingId })
      .from(follows)
      .where(and(
        eq(follows.followerId, userId),
        eq(follows.status, "accepted")
      ));

    const onlineFriends: {
      userId: number;
      username: string;
      profileImage: string | null;
      status: string;
    }[] = [];

    for (const f of following) {
      if (this.isUserOnline(f.followingId)) {
        const [user] = await db.select({
          id: users.id,
          username: users.username,
          profileImage: users.profileImage
        })
        .from(users)
        .where(eq(users.id, f.followingId))
        .limit(1);

        if (user) {
          const activity = this.getUserActivity(f.followingId);
          onlineFriends.push({
            userId: user.id,
            username: user.username,
            profileImage: user.profileImage,
            status: activity?.status || "online"
          });
        }
      }
    }

    return onlineFriends;
  }

  // Cleanup stale connections
  cleanup(): { removed: number } {
    const staleThreshold = 5 * 60 * 1000; // 5 minutes
    const now = new Date();
    let removed = 0;

    const userIds = Array.from(userActivity.keys());
    for (const odUserId of userIds) {
      const activity = userActivity.get(odUserId);
      if (activity && activity.status === "offline") {
        const timeSinceActive = now.getTime() - activity.lastActive.getTime();
        if (timeSinceActive > staleThreshold) {
          userActivity.delete(odUserId);
          removed++;
        }
      }
    }

    return { removed };
  }
}

// Export singleton instance
export const realtimeSocialService = new RealtimeSocialService();
