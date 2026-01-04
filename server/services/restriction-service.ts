import { 
  userRestrictions,
  userRelationships,
  followRequests,
  closeFriends,
  users,
  type UserRestriction,
  type User
} from "@shared/schema";
import { db } from "../db";
import { eq, and, desc } from "drizzle-orm";

export type RestrictionType = 'blocked' | 'restricted' | 'muted';

export interface RestrictionResult {
  success: boolean;
  message: string;
  restriction?: UserRestriction;
}

export class RestrictionService {
  
  // Block a user - removes all relationships and prevents future interactions
  async blockUser(blockerId: number, blockedId: number): Promise<RestrictionResult> {
    if (blockerId === blockedId) {
      return { success: false, message: "Cannot block yourself" };
    }

    // Check if already blocked
    const existingBlock = await this.isBlocked(blockerId, blockedId);
    if (existingBlock) {
      return { success: false, message: "User is already blocked" };
    }

    // Remove any existing following relationships
    await db.delete(userRelationships)
      .where(
        and(
          eq(userRelationships.userId, blockerId),
          eq(userRelationships.targetUserId, blockedId)
        )
      );
    
    await db.delete(userRelationships)
      .where(
        and(
          eq(userRelationships.userId, blockedId),
          eq(userRelationships.targetUserId, blockerId)
        )
      );

    // Cancel any pending follow requests
    await db.delete(followRequests)
      .where(
        and(
          eq(followRequests.requesterId, blockerId),
          eq(followRequests.requestedId, blockedId)
        )
      );
    
    await db.delete(followRequests)
      .where(
        and(
          eq(followRequests.requesterId, blockedId),
          eq(followRequests.requestedId, blockerId)
        )
      );

    // Remove from close friends
    await db.delete(closeFriends)
      .where(
        and(
          eq(closeFriends.userId, blockerId),
          eq(closeFriends.friendId, blockedId)
        )
      );
    
    await db.delete(closeFriends)
      .where(
        and(
          eq(closeFriends.userId, blockedId),
          eq(closeFriends.friendId, blockerId)
        )
      );

    // Create block restriction
    const [restriction] = await db.insert(userRestrictions)
      .values({
        restricterId: blockerId,
        restrictedId: blockedId,
        restrictionType: 'blocked'
      })
      .returning();

    return { success: true, message: "User blocked successfully", restriction };
  }

  // Unblock a user
  async unblockUser(blockerId: number, blockedId: number): Promise<RestrictionResult> {
    const result = await db.delete(userRestrictions)
      .where(
        and(
          eq(userRestrictions.restricterId, blockerId),
          eq(userRestrictions.restrictedId, blockedId),
          eq(userRestrictions.restrictionType, 'blocked')
        )
      );

    if (result.rowCount === 0) {
      return { success: false, message: "Block not found" };
    }

    return { success: true, message: "User unblocked successfully" };
  }

  // Restrict a user - limits their interactions (comments only visible to them)
  async restrictUser(restricterId: number, restrictedId: number): Promise<RestrictionResult> {
    if (restricterId === restrictedId) {
      return { success: false, message: "Cannot restrict yourself" };
    }

    const existingRestriction = await this.isRestricted(restricterId, restrictedId);
    if (existingRestriction) {
      return { success: false, message: "User is already restricted" };
    }

    const [restriction] = await db.insert(userRestrictions)
      .values({
        restricterId,
        restrictedId,
        restrictionType: 'restricted'
      })
      .returning();

    return { success: true, message: "User restricted successfully", restriction };
  }

  // Unrestrict a user
  async unrestrictUser(restricterId: number, restrictedId: number): Promise<RestrictionResult> {
    const result = await db.delete(userRestrictions)
      .where(
        and(
          eq(userRestrictions.restricterId, restricterId),
          eq(userRestrictions.restrictedId, restrictedId),
          eq(userRestrictions.restrictionType, 'restricted')
        )
      );

    if (result.rowCount === 0) {
      return { success: false, message: "Restriction not found" };
    }

    return { success: true, message: "User unrestricted successfully" };
  }

  // Mute a user - hide their posts and stories from feed
  async muteUser(muterId: number, mutedId: number, muteType?: 'posts' | 'stories' | 'all'): Promise<RestrictionResult> {
    if (muterId === mutedId) {
      return { success: false, message: "Cannot mute yourself" };
    }

    const existingMute = await this.isMuted(muterId, mutedId);
    if (existingMute) {
      return { success: false, message: "User is already muted" };
    }

    const [restriction] = await db.insert(userRestrictions)
      .values({
        restricterId: muterId,
        restrictedId: mutedId,
        restrictionType: 'muted'
      })
      .returning();

    return { success: true, message: "User muted successfully", restriction };
  }

  // Unmute a user
  async unmuteUser(muterId: number, mutedId: number): Promise<RestrictionResult> {
    const result = await db.delete(userRestrictions)
      .where(
        and(
          eq(userRestrictions.restricterId, muterId),
          eq(userRestrictions.restrictedId, mutedId),
          eq(userRestrictions.restrictionType, 'muted')
        )
      );

    if (result.rowCount === 0) {
      return { success: false, message: "Mute not found" };
    }

    return { success: true, message: "User unmuted successfully" };
  }

  // Check if user is blocked
  async isBlocked(blockerId: number, blockedId: number): Promise<boolean> {
    const [result] = await db.select()
      .from(userRestrictions)
      .where(
        and(
          eq(userRestrictions.restricterId, blockerId),
          eq(userRestrictions.restrictedId, blockedId),
          eq(userRestrictions.restrictionType, 'blocked')
        )
      )
      .limit(1);

    return !!result;
  }

  // Check if either user has blocked the other
  async isBlockedEitherWay(userId1: number, userId2: number): Promise<boolean> {
    const blocked1 = await this.isBlocked(userId1, userId2);
    const blocked2 = await this.isBlocked(userId2, userId1);
    return blocked1 || blocked2;
  }

  // Check if user is restricted
  async isRestricted(restricterId: number, restrictedId: number): Promise<boolean> {
    const [result] = await db.select()
      .from(userRestrictions)
      .where(
        and(
          eq(userRestrictions.restricterId, restricterId),
          eq(userRestrictions.restrictedId, restrictedId),
          eq(userRestrictions.restrictionType, 'restricted')
        )
      )
      .limit(1);

    return !!result;
  }

  // Check if user is muted
  async isMuted(muterId: number, mutedId: number): Promise<boolean> {
    const [result] = await db.select()
      .from(userRestrictions)
      .where(
        and(
          eq(userRestrictions.restricterId, muterId),
          eq(userRestrictions.restrictedId, mutedId),
          eq(userRestrictions.restrictionType, 'muted')
        )
      )
      .limit(1);

    return !!result;
  }

  // Get all blocked users
  async getBlockedUsers(userId: number): Promise<User[]> {
    const blockedUsers = await db.select({
      id: users.id,
      username: users.username,
      fullName: users.fullName,
      profileImage: users.profileImage,
      verificationBadge: users.verificationBadge,
      isPrivate: users.isPrivate,
      createdAt: users.createdAt
    })
    .from(userRestrictions)
    .innerJoin(users, eq(userRestrictions.restrictedId, users.id))
    .where(
      and(
        eq(userRestrictions.restricterId, userId),
        eq(userRestrictions.restrictionType, 'blocked')
      )
    )
    .orderBy(desc(userRestrictions.createdAt));

    return blockedUsers as User[];
  }

  // Get all restricted users
  async getRestrictedUsers(userId: number): Promise<User[]> {
    const restrictedUsers = await db.select({
      id: users.id,
      username: users.username,
      fullName: users.fullName,
      profileImage: users.profileImage,
      verificationBadge: users.verificationBadge,
      isPrivate: users.isPrivate,
      createdAt: users.createdAt
    })
    .from(userRestrictions)
    .innerJoin(users, eq(userRestrictions.restrictedId, users.id))
    .where(
      and(
        eq(userRestrictions.restricterId, userId),
        eq(userRestrictions.restrictionType, 'restricted')
      )
    )
    .orderBy(desc(userRestrictions.createdAt));

    return restrictedUsers as User[];
  }

  // Get all muted users
  async getMutedUsers(userId: number): Promise<User[]> {
    const mutedUsers = await db.select({
      id: users.id,
      username: users.username,
      fullName: users.fullName,
      profileImage: users.profileImage,
      verificationBadge: users.verificationBadge,
      isPrivate: users.isPrivate,
      createdAt: users.createdAt
    })
    .from(userRestrictions)
    .innerJoin(users, eq(userRestrictions.restrictedId, users.id))
    .where(
      and(
        eq(userRestrictions.restricterId, userId),
        eq(userRestrictions.restrictionType, 'muted')
      )
    )
    .orderBy(desc(userRestrictions.createdAt));

    return mutedUsers as User[];
  }

  // Get all restrictions for a user
  async getAllRestrictions(userId: number): Promise<{
    blocked: User[];
    restricted: User[];
    muted: User[];
  }> {
    const [blocked, restricted, muted] = await Promise.all([
      this.getBlockedUsers(userId),
      this.getRestrictedUsers(userId),
      this.getMutedUsers(userId)
    ]);

    return { blocked, restricted, muted };
  }
}

// Export singleton instance
export const restrictionService = new RestrictionService();
