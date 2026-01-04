import { 
  closeFriends,
  userRelationships,
  users,
  type CloseFriend,
  type User
} from "@shared/schema";
import { db } from "../db";
import { eq, and, desc } from "drizzle-orm";

export interface CloseFriendResult {
  success: boolean;
  message: string;
  closeFriend?: CloseFriend;
}

export class CloseFriendsService {
  
  // Add user to close friends list
  async addCloseFriend(userId: number, friendId: number): Promise<CloseFriendResult> {
    if (userId === friendId) {
      return { success: false, message: "Cannot add yourself to close friends" };
    }

    // Check if already a close friend
    const existing = await this.isCloseFriend(userId, friendId);
    if (existing) {
      return { success: false, message: "User is already a close friend" };
    }

    // Check if user is following the friend
    const [followRelation] = await db.select()
      .from(userRelationships)
      .where(
        and(
          eq(userRelationships.userId, userId),
          eq(userRelationships.targetUserId, friendId),
          eq(userRelationships.relationshipType, 'following')
        )
      )
      .limit(1);

    if (!followRelation) {
      return { success: false, message: "Can only add followers to close friends" };
    }

    const [closeFriend] = await db.insert(closeFriends)
      .values({
        userId,
        friendId
      })
      .returning();

    return { success: true, message: "Added to close friends", closeFriend };
  }

  // Remove user from close friends list
  async removeCloseFriend(userId: number, friendId: number): Promise<CloseFriendResult> {
    const result = await db.delete(closeFriends)
      .where(
        and(
          eq(closeFriends.userId, userId),
          eq(closeFriends.friendId, friendId)
        )
      );

    if (result.rowCount === 0) {
      return { success: false, message: "Close friend not found" };
    }

    return { success: true, message: "Removed from close friends" };
  }

  // Check if user is a close friend
  async isCloseFriend(userId: number, friendId: number): Promise<boolean> {
    const [result] = await db.select()
      .from(closeFriends)
      .where(
        and(
          eq(closeFriends.userId, userId),
          eq(closeFriends.friendId, friendId)
        )
      )
      .limit(1);

    return !!result;
  }

  // Get all close friends for a user
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

  // Get close friends count
  async getCloseFriendsCount(userId: number): Promise<number> {
    const friends = await this.getCloseFriends(userId);
    return friends.length;
  }

  // Check if user is in someone's close friends list
  async isInCloseFriendsList(userId: number, targetUserId: number): Promise<boolean> {
    return await this.isCloseFriend(targetUserId, userId);
  }

  // Get users who have added this user to their close friends
  async getAddedByCloseFriends(userId: number): Promise<User[]> {
    const addedBy = await db.select({
      id: users.id,
      username: users.username,
      fullName: users.fullName,
      profileImage: users.profileImage,
      verificationBadge: users.verificationBadge,
      isPrivate: users.isPrivate,
      createdAt: users.createdAt
    })
    .from(closeFriends)
    .innerJoin(users, eq(closeFriends.userId, users.id))
    .where(eq(closeFriends.friendId, userId))
    .orderBy(desc(closeFriends.createdAt));

    return addedBy as User[];
  }

  // Bulk add close friends
  async bulkAddCloseFriends(userId: number, friendIds: number[]): Promise<{
    added: number[];
    failed: { id: number; reason: string }[];
  }> {
    const added: number[] = [];
    const failed: { id: number; reason: string }[] = [];

    for (const friendId of friendIds) {
      const result = await this.addCloseFriend(userId, friendId);
      if (result.success) {
        added.push(friendId);
      } else {
        failed.push({ id: friendId, reason: result.message });
      }
    }

    return { added, failed };
  }

  // Bulk remove close friends
  async bulkRemoveCloseFriends(userId: number, friendIds: number[]): Promise<{
    removed: number[];
    failed: { id: number; reason: string }[];
  }> {
    const removed: number[] = [];
    const failed: { id: number; reason: string }[] = [];

    for (const friendId of friendIds) {
      const result = await this.removeCloseFriend(userId, friendId);
      if (result.success) {
        removed.push(friendId);
      } else {
        failed.push({ id: friendId, reason: result.message });
      }
    }

    return { removed, failed };
  }
}

// Export singleton instance
export const closeFriendsService = new CloseFriendsService();
