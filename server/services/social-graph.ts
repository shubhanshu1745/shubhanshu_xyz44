import { 
  userRelationships, 
  followRequests, 
  userPrivacySettings,
  closeFriends,
  userRestrictions,
  users,
  type FollowRequest,
  type UserPrivacySettings,
  type User
} from "@shared/schema";
import { db } from "../db";
import { eq, and, desc, sql } from "drizzle-orm";

export enum RelationshipStatus {
  NO_RELATION = 'no_relation',
  FOLLOWING = 'following',
  FOLLOWER = 'follower',
  MUTUAL_FOLLOWERS = 'mutual_followers',
  FOLLOW_REQUEST_SENT = 'follow_request_sent',
  FOLLOW_REQUEST_RECEIVED = 'follow_request_received',
  BLOCKED = 'blocked',
  RESTRICTED = 'restricted',
  MUTED = 'muted',
  CLOSE_FRIEND = 'close_friend'
}

export interface FollowResult {
  success: boolean;
  status: RelationshipStatus;
  requiresApproval?: boolean;
  message?: string;
}

export class SocialGraphService {
  
  // Relationship Management
  async followUser(followerId: number, followingId: number): Promise<FollowResult> {
    if (followerId === followingId) {
      return { success: false, status: RelationshipStatus.NO_RELATION, message: "Cannot follow yourself" };
    }

    // Check if user is blocked
    const isBlocked = await this.isUserBlocked(followerId, followingId);
    if (isBlocked) {
      return { success: false, status: RelationshipStatus.BLOCKED, message: "Cannot follow blocked user" };
    }

    // Check if target user has blocked the follower
    const hasBlockedFollower = await this.isUserBlocked(followingId, followerId);
    if (hasBlockedFollower) {
      return { success: false, status: RelationshipStatus.BLOCKED, message: "You are blocked by this user" };
    }

    // Get target user to check if account is private
    const targetUser = await db.select().from(users).where(eq(users.id, followingId)).limit(1);
    if (!targetUser.length) {
      return { success: false, status: RelationshipStatus.NO_RELATION, message: "User not found" };
    }

    const isPrivateAccount = targetUser[0].isPrivate;

    // Check if already following
    const existingRelationship = await this.getRelationshipStatus(followerId, followingId);
    if (existingRelationship === RelationshipStatus.FOLLOWING || existingRelationship === RelationshipStatus.MUTUAL_FOLLOWERS) {
      return { success: false, status: existingRelationship, message: "Already following" };
    }

    // Check if follow request already exists
    if (existingRelationship === RelationshipStatus.FOLLOW_REQUEST_SENT) {
      return { success: false, status: RelationshipStatus.FOLLOW_REQUEST_SENT, message: "Follow request already sent" };
    }

    if (isPrivateAccount) {
      // Create follow request for private account
      await db.insert(followRequests).values({
        requesterId: followerId,
        requestedId: followingId,
        status: 'pending'
      });

      return { 
        success: true, 
        status: RelationshipStatus.FOLLOW_REQUEST_SENT, 
        requiresApproval: true,
        message: "Follow request sent" 
      };
    } else {
      // Immediately create following relationship for public account
      await db.insert(userRelationships).values({
        userId: followerId,
        targetUserId: followingId,
        relationshipType: 'following'
      });

      // Check if this creates a mutual relationship
      const reverseRelationship = await db.select()
        .from(userRelationships)
        .where(
          and(
            eq(userRelationships.userId, followingId),
            eq(userRelationships.targetUserId, followerId),
            eq(userRelationships.relationshipType, 'following')
          )
        )
        .limit(1);

      const status = reverseRelationship.length > 0 ? RelationshipStatus.MUTUAL_FOLLOWERS : RelationshipStatus.FOLLOWING;

      return { 
        success: true, 
        status,
        message: "Now following" 
      };
    }
  }

  async unfollowUser(followerId: number, followingId: number): Promise<void> {
    // Remove following relationship
    await db.delete(userRelationships)
      .where(
        and(
          eq(userRelationships.userId, followerId),
          eq(userRelationships.targetUserId, followingId),
          eq(userRelationships.relationshipType, 'following')
        )
      );

    // Cancel any pending follow request
    await db.delete(followRequests)
      .where(
        and(
          eq(followRequests.requesterId, followerId),
          eq(followRequests.requestedId, followingId),
          eq(followRequests.status, 'pending')
        )
      );
  }

  async acceptFollowRequest(userId: number, requesterId: number): Promise<void> {
    // Update follow request status
    await db.update(followRequests)
      .set({ 
        status: 'accepted',
        respondedAt: new Date()
      })
      .where(
        and(
          eq(followRequests.requesterId, requesterId),
          eq(followRequests.requestedId, userId),
          eq(followRequests.status, 'pending')
        )
      );

    // Create following relationship
    await db.insert(userRelationships).values({
      userId: requesterId,
      targetUserId: userId,
      relationshipType: 'following'
    });
  }

  async rejectFollowRequest(userId: number, requesterId: number): Promise<void> {
    await db.update(followRequests)
      .set({ 
        status: 'rejected',
        respondedAt: new Date()
      })
      .where(
        and(
          eq(followRequests.requesterId, requesterId),
          eq(followRequests.requestedId, userId),
          eq(followRequests.status, 'pending')
        )
      );
  }

  async cancelFollowRequest(requesterId: number, requestedId: number): Promise<void> {
    await db.update(followRequests)
      .set({ 
        status: 'cancelled',
        respondedAt: new Date()
      })
      .where(
        and(
          eq(followRequests.requesterId, requesterId),
          eq(followRequests.requestedId, requestedId),
          eq(followRequests.status, 'pending')
        )
      );
  }

  // Relationship Queries
  async getRelationshipStatus(userId1: number, userId2: number): Promise<RelationshipStatus> {
    if (userId1 === userId2) {
      return RelationshipStatus.NO_RELATION;
    }

    // Check for blocking first
    const isBlocked = await this.isUserBlocked(userId1, userId2);
    if (isBlocked) {
      return RelationshipStatus.BLOCKED;
    }

    // Check for restrictions
    const isRestricted = await this.isUserRestricted(userId1, userId2);
    if (isRestricted) {
      return RelationshipStatus.RESTRICTED;
    }

    // Check for muting
    const isMuted = await this.isUserMuted(userId1, userId2);
    if (isMuted) {
      return RelationshipStatus.MUTED;
    }

    // Check for close friend
    const isCloseFriend = await this.isCloseFriend(userId1, userId2);
    if (isCloseFriend) {
      return RelationshipStatus.CLOSE_FRIEND;
    }

    // Check for pending follow request
    const pendingRequest = await db.select()
      .from(followRequests)
      .where(
        and(
          eq(followRequests.requesterId, userId1),
          eq(followRequests.requestedId, userId2),
          eq(followRequests.status, 'pending')
        )
      )
      .limit(1);

    if (pendingRequest.length > 0) {
      return RelationshipStatus.FOLLOW_REQUEST_SENT;
    }

    // Check for received follow request
    const receivedRequest = await db.select()
      .from(followRequests)
      .where(
        and(
          eq(followRequests.requesterId, userId2),
          eq(followRequests.requestedId, userId1),
          eq(followRequests.status, 'pending')
        )
      )
      .limit(1);

    if (receivedRequest.length > 0) {
      return RelationshipStatus.FOLLOW_REQUEST_RECEIVED;
    }

    // Check following relationships
    const user1FollowsUser2 = await db.select()
      .from(userRelationships)
      .where(
        and(
          eq(userRelationships.userId, userId1),
          eq(userRelationships.targetUserId, userId2),
          eq(userRelationships.relationshipType, 'following')
        )
      )
      .limit(1);

    const user2FollowsUser1 = await db.select()
      .from(userRelationships)
      .where(
        and(
          eq(userRelationships.userId, userId2),
          eq(userRelationships.targetUserId, userId1),
          eq(userRelationships.relationshipType, 'following')
        )
      )
      .limit(1);

    const isFollowing = user1FollowsUser2.length > 0;
    const isFollower = user2FollowsUser1.length > 0;

    if (isFollowing && isFollower) {
      return RelationshipStatus.MUTUAL_FOLLOWERS;
    } else if (isFollowing) {
      return RelationshipStatus.FOLLOWING;
    } else if (isFollower) {
      return RelationshipStatus.FOLLOWER;
    }

    return RelationshipStatus.NO_RELATION;
  }

  async getFollowers(userId: number, viewerId: number): Promise<User[]> {
    // Check privacy settings
    const canView = await this.canViewFollowersList(userId, viewerId);
    if (!canView) {
      return [];
    }

    const followers = await db.select({
      id: users.id,
      username: users.username,
      fullName: users.fullName,
      profileImage: users.profileImage,
      verificationBadge: users.verificationBadge,
      isPrivate: users.isPrivate,
      createdAt: users.createdAt
    })
    .from(userRelationships)
    .innerJoin(users, eq(userRelationships.userId, users.id))
    .where(
      and(
        eq(userRelationships.targetUserId, userId),
        eq(userRelationships.relationshipType, 'following')
      )
    )
    .orderBy(desc(userRelationships.createdAt));

    return followers as User[];
  }

  async getFollowing(userId: number, viewerId: number): Promise<User[]> {
    // Check privacy settings
    const canView = await this.canViewFollowingList(userId, viewerId);
    if (!canView) {
      return [];
    }

    const following = await db.select({
      id: users.id,
      username: users.username,
      fullName: users.fullName,
      profileImage: users.profileImage,
      verificationBadge: users.verificationBadge,
      isPrivate: users.isPrivate,
      createdAt: users.createdAt
    })
    .from(userRelationships)
    .innerJoin(users, eq(userRelationships.targetUserId, users.id))
    .where(
      and(
        eq(userRelationships.userId, userId),
        eq(userRelationships.relationshipType, 'following')
      )
    )
    .orderBy(desc(userRelationships.createdAt));

    return following as User[];
  }

  async getMutualFollowers(userId1: number, userId2: number): Promise<User[]> {
    const mutualFollowers = await db.select({
      id: users.id,
      username: users.username,
      fullName: users.fullName,
      profileImage: users.profileImage,
      verificationBadge: users.verificationBadge,
      isPrivate: users.isPrivate,
      createdAt: users.createdAt
    })
    .from(userRelationships)
    .innerJoin(users, eq(userRelationships.userId, users.id))
    .where(
      and(
        eq(userRelationships.targetUserId, userId1),
        eq(userRelationships.relationshipType, 'following'),
        sql`${userRelationships.userId} IN (
          SELECT user_id FROM ${userRelationships} 
          WHERE target_user_id = ${userId2} AND relationship_type = 'following'
        )`
      )
    )
    .orderBy(desc(userRelationships.createdAt));

    return mutualFollowers as User[];
  }

  // Privacy Controls
  async blockUser(blockerId: number, blockedId: number): Promise<void> {
    if (blockerId === blockedId) {
      throw new Error("Cannot block yourself");
    }

    // Remove any existing relationships
    await this.unfollowUser(blockerId, blockedId);
    await this.unfollowUser(blockedId, blockerId);

    // Remove from close friends
    await this.removeFromCloseFriends(blockerId, blockedId);
    await this.removeFromCloseFriends(blockedId, blockerId);

    // Add block relationship
    await db.insert(userRestrictions).values({
      restricterId: blockerId,
      restrictedId: blockedId,
      restrictionType: 'blocked'
    }).onConflictDoNothing();
  }

  async unblockUser(blockerId: number, blockedId: number): Promise<void> {
    await db.delete(userRestrictions)
      .where(
        and(
          eq(userRestrictions.restricterId, blockerId),
          eq(userRestrictions.restrictedId, blockedId),
          eq(userRestrictions.restrictionType, 'blocked')
        )
      );
  }

  async restrictUser(restricterId: number, restrictedId: number): Promise<void> {
    if (restricterId === restrictedId) {
      throw new Error("Cannot restrict yourself");
    }

    await db.insert(userRestrictions).values({
      restricterId: restricterId,
      restrictedId: restrictedId,
      restrictionType: 'restricted'
    }).onConflictDoNothing();
  }

  async unrestrictUser(restricterId: number, restrictedId: number): Promise<void> {
    await db.delete(userRestrictions)
      .where(
        and(
          eq(userRestrictions.restricterId, restricterId),
          eq(userRestrictions.restrictedId, restrictedId),
          eq(userRestrictions.restrictionType, 'restricted')
        )
      );
  }

  async muteUser(muterId: number, mutedId: number): Promise<void> {
    if (muterId === mutedId) {
      throw new Error("Cannot mute yourself");
    }

    await db.insert(userRestrictions).values({
      restricterId: muterId,
      restrictedId: mutedId,
      restrictionType: 'muted'
    }).onConflictDoNothing();
  }

  async unmuteUser(muterId: number, mutedId: number): Promise<void> {
    await db.delete(userRestrictions)
      .where(
        and(
          eq(userRestrictions.restricterId, muterId),
          eq(userRestrictions.restrictedId, mutedId),
          eq(userRestrictions.restrictionType, 'muted')
        )
      );
  }

  // Close Friends Management
  async addToCloseFriends(userId: number, friendId: number): Promise<void> {
    if (userId === friendId) {
      throw new Error("Cannot add yourself to close friends");
    }

    // Check if they are following each other
    const relationship = await this.getRelationshipStatus(userId, friendId);
    if (relationship !== RelationshipStatus.FOLLOWING && relationship !== RelationshipStatus.MUTUAL_FOLLOWERS) {
      throw new Error("Can only add followers to close friends");
    }

    await db.insert(closeFriends).values({
      userId: userId,
      friendId: friendId
    }).onConflictDoNothing();
  }

  async removeFromCloseFriends(userId: number, friendId: number): Promise<void> {
    await db.delete(closeFriends)
      .where(
        and(
          eq(closeFriends.userId, userId),
          eq(closeFriends.friendId, friendId)
        )
      );
  }

  async getCloseFriends(userId: number): Promise<User[]> {
    const friends = await db.select({
      id: users.id,
      username: users.username,
      fullName: users.fullName,
      profileImage: users.profileImage,
      verificationBadge: users.verificationBadge,
      isPrivate: users.isPrivate,
      createdAt: users.createdAt
    })
    .from(closeFriends)
    .innerJoin(users, eq(closeFriends.friendId, users.id))
    .where(eq(closeFriends.userId, userId))
    .orderBy(desc(closeFriends.createdAt));

    return friends as User[];
  }

  // Helper Methods
  private async isUserBlocked(userId: number, targetUserId: number): Promise<boolean> {
    const blocked = await db.select()
      .from(userRestrictions)
      .where(
        and(
          eq(userRestrictions.restricterId, userId),
          eq(userRestrictions.restrictedId, targetUserId),
          eq(userRestrictions.restrictionType, 'blocked')
        )
      )
      .limit(1);

    return blocked.length > 0;
  }

  private async isUserRestricted(userId: number, targetUserId: number): Promise<boolean> {
    const restricted = await db.select()
      .from(userRestrictions)
      .where(
        and(
          eq(userRestrictions.restricterId, userId),
          eq(userRestrictions.restrictedId, targetUserId),
          eq(userRestrictions.restrictionType, 'restricted')
        )
      )
      .limit(1);

    return restricted.length > 0;
  }

  private async isUserMuted(userId: number, targetUserId: number): Promise<boolean> {
    const muted = await db.select()
      .from(userRestrictions)
      .where(
        and(
          eq(userRestrictions.restricterId, userId),
          eq(userRestrictions.restrictedId, targetUserId),
          eq(userRestrictions.restrictionType, 'muted')
        )
      )
      .limit(1);

    return muted.length > 0;
  }

  private async isCloseFriend(userId: number, friendId: number): Promise<boolean> {
    const friend = await db.select()
      .from(closeFriends)
      .where(
        and(
          eq(closeFriends.userId, userId),
          eq(closeFriends.friendId, friendId)
        )
      )
      .limit(1);

    return friend.length > 0;
  }

  private async canViewFollowersList(userId: number, viewerId: number): Promise<boolean> {
    if (userId === viewerId) {
      return true; // Can always view own followers
    }

    const privacySettings = await this.getUserPrivacySettings(userId);
    
    switch (privacySettings.whoCanSeeFollowers) {
      case 'everyone':
        return true;
      case 'followers':
        const relationship = await this.getRelationshipStatus(viewerId, userId);
        return relationship === RelationshipStatus.FOLLOWING || relationship === RelationshipStatus.MUTUAL_FOLLOWERS;
      case 'no_one':
        return false;
      default:
        return false;
    }
  }

  private async canViewFollowingList(userId: number, viewerId: number): Promise<boolean> {
    if (userId === viewerId) {
      return true; // Can always view own following
    }

    const privacySettings = await this.getUserPrivacySettings(userId);
    
    switch (privacySettings.whoCanSeeFollowing) {
      case 'everyone':
        return true;
      case 'followers':
        const relationship = await this.getRelationshipStatus(viewerId, userId);
        return relationship === RelationshipStatus.FOLLOWING || relationship === RelationshipStatus.MUTUAL_FOLLOWERS;
      case 'no_one':
        return false;
      default:
        return false;
    }
  }

  private async getUserPrivacySettings(userId: number): Promise<UserPrivacySettings> {
    const settings = await db.select()
      .from(userPrivacySettings)
      .where(eq(userPrivacySettings.userId, userId))
      .limit(1);

    if (settings.length === 0) {
      // Create default privacy settings if they don't exist
      const defaultSettings = {
        userId,
        allowTagging: true,
        allowMentions: true,
        showActivityStatus: true,
        allowMessageRequests: true,
        allowStoryReplies: true,
        whoCanSeeFollowers: 'everyone' as const,
        whoCanSeeFollowing: 'everyone' as const,
        updatedAt: new Date()
      };

      await db.insert(userPrivacySettings).values(defaultSettings);
      return defaultSettings;
    }

    return settings[0];
  }

  // Follow Request Management
  async getPendingFollowRequests(userId: number): Promise<(FollowRequest & { requester: User })[]> {
    const requests = await db.select({
      id: followRequests.id,
      requesterId: followRequests.requesterId,
      requestedId: followRequests.requestedId,
      status: followRequests.status,
      createdAt: followRequests.createdAt,
      respondedAt: followRequests.respondedAt,
      requester: {
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        profileImage: users.profileImage,
        verificationBadge: users.verificationBadge,
        isPrivate: users.isPrivate
      }
    })
    .from(followRequests)
    .innerJoin(users, eq(followRequests.requesterId, users.id))
    .where(
      and(
        eq(followRequests.requestedId, userId),
        eq(followRequests.status, 'pending')
      )
    )
    .orderBy(desc(followRequests.createdAt));

    return requests as (FollowRequest & { requester: User })[];
  }

  async getSentFollowRequests(userId: number): Promise<(FollowRequest & { requested: User })[]> {
    const requests = await db.select({
      id: followRequests.id,
      requesterId: followRequests.requesterId,
      requestedId: followRequests.requestedId,
      status: followRequests.status,
      createdAt: followRequests.createdAt,
      respondedAt: followRequests.respondedAt,
      requested: {
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        profileImage: users.profileImage,
        verificationBadge: users.verificationBadge,
        isPrivate: users.isPrivate
      }
    })
    .from(followRequests)
    .innerJoin(users, eq(followRequests.requestedId, users.id))
    .where(
      and(
        eq(followRequests.requesterId, userId),
        eq(followRequests.status, 'pending')
      )
    )
    .orderBy(desc(followRequests.createdAt));

    return requests as (FollowRequest & { requested: User })[];
  }
}

// Export singleton instance
export const socialGraphService = new SocialGraphService();