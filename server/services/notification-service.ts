import { storage } from "../storage";
import { InsertNotification, Notification } from "@shared/schema";

declare global {
  var notificationStreams: Map<number, any> | undefined;
}

export class NotificationService {
  static async sendNotification(notification: InsertNotification): Promise<Notification> {
    // Create notification in database
    const createdNotification = await storage.createNotification(notification);
    
    // Get fromUser data for real-time notification
    let fromUser = null;
    if (createdNotification.fromUserId) {
      fromUser = await storage.getUser(createdNotification.fromUserId);
      if (fromUser) {
        // Remove password from user data
        const { password, ...userWithoutPassword } = fromUser;
        fromUser = userWithoutPassword;
      }
    }
    
    // Send real-time notification via SSE with fromUser data
    this.sendRealTimeNotification(notification.userId, { ...createdNotification, fromUser });
    
    return createdNotification;
  }
  
  static sendRealTimeNotification(userId: number, notification: Notification & { fromUser?: any }) {
    if (!global.notificationStreams) {
      return;
    }
    
    const userStream = global.notificationStreams.get(userId);
    if (userStream) {
      try {
        const data = {
          type: 'notification',
          notification: notification
        };
        userStream.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch (error) {
        console.error('Error sending real-time notification:', error);
        // Remove broken connection
        global.notificationStreams.delete(userId);
      }
    }
  }
  
  static async sendFollowNotification(fromUserId: number, toUserId: number, type: 'follow_request' | 'follow_accepted' | 'new_follower', fromUser: any) {
    const notification: InsertNotification = {
      userId: toUserId,
      fromUserId: fromUserId,
      type: type,
      title: type === 'follow_request' 
        ? 'New Follow Request' 
        : type === 'follow_accepted' 
        ? 'Follow Request Accepted'
        : 'New Follower',
      message: type === 'follow_request' 
        ? `${fromUser.username} wants to follow you`
        : type === 'follow_accepted'
        ? `${fromUser.username} accepted your follow request`
        : `${fromUser.username} started following you`,
      actionUrl: `/profile/${fromUser.username}`,
      imageUrl: fromUser.profileImage
    };
    
    return this.sendNotification(notification);
  }
  
  static async sendLikeNotification(fromUserId: number, toUserId: number, postId: number, fromUser: any) {
    if (fromUserId === toUserId) return; // Don't notify self
    
    const notification: InsertNotification = {
      userId: toUserId,
      fromUserId: fromUserId,
      type: 'like',
      title: 'New Like',
      message: `${fromUser.username} liked your post`,
      entityType: 'post',
      entityId: postId,
      actionUrl: `/posts/${postId}`,
      imageUrl: fromUser.profileImage
    };
    
    return this.sendNotification(notification);
  }
  
  static async sendCommentNotification(fromUserId: number, toUserId: number, postId: number, fromUser: any) {
    if (fromUserId === toUserId) return; // Don't notify self
    
    const notification: InsertNotification = {
      userId: toUserId,
      fromUserId: fromUserId,
      type: 'comment',
      title: 'New Comment',
      message: `${fromUser.username} commented on your post`,
      entityType: 'post',
      entityId: postId,
      actionUrl: `/posts/${postId}`,
      imageUrl: fromUser.profileImage
    };
    
    return this.sendNotification(notification);
  }
  
  static async sendStoryViewNotification(fromUserId: number, toUserId: number, storyId: number, fromUser: any) {
    if (fromUserId === toUserId) return; // Don't notify self
    
    const notification: InsertNotification = {
      userId: toUserId,
      fromUserId: fromUserId,
      type: 'story_view',
      title: 'Story View',
      message: `${fromUser.username} viewed your story`,
      entityType: 'story',
      entityId: storyId,
      actionUrl: `/stories`,
      imageUrl: fromUser.profileImage
    };
    
    return this.sendNotification(notification);
  }

  static async sendMentionNotification(fromUserId: number, toUserId: number, postId: number, fromUser: any, mentionType: 'post' | 'comment' = 'post') {
    if (fromUserId === toUserId) return; // Don't notify self
    
    const notification: InsertNotification = {
      userId: toUserId,
      fromUserId: fromUserId,
      type: 'mention',
      title: 'New Mention',
      message: mentionType === 'post' 
        ? `${fromUser.username} mentioned you in a post`
        : `${fromUser.username} mentioned you in a comment`,
      entityType: 'post',
      entityId: postId,
      actionUrl: `/posts/${postId}`,
      imageUrl: fromUser.profileImage
    };
    
    return this.sendNotification(notification);
  }

  static async sendShareNotification(fromUserId: number, toUserId: number, postId: number, fromUser: any) {
    if (fromUserId === toUserId) return; // Don't notify self
    
    const notification: InsertNotification = {
      userId: toUserId,
      fromUserId: fromUserId,
      type: 'post_share',
      title: 'Post Shared',
      message: `${fromUser.username} shared your post`,
      entityType: 'post',
      entityId: postId,
      actionUrl: `/posts/${postId}`,
      imageUrl: fromUser.profileImage
    };
    
    return this.sendNotification(notification);
  }

  // Helper to extract mentions from text content
  static extractMentions(content: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }
    
    return [...new Set(mentions)]; // Remove duplicates
  }
}