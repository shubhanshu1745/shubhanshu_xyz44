import { 
  groupChats,
  groupMembers,
  messages,
  users,
  notifications,
  type GroupChat,
  type GroupMember
} from "@shared/schema";
import { db } from "../db";
import { eq, and, desc, ne, count } from "drizzle-orm";

export interface GroupChatResult {
  success: boolean;
  message: string;
  group?: GroupChat;
}

export interface GroupMemberInfo {
  id: number;
  userId: number;
  username: string;
  fullName: string | null;
  profileImage: string | null;
  role: string;
  joinedAt: Date | null;
  isActive: boolean;
}

export interface GroupChatInfo {
  id: number;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  creatorId: number;
  memberCount: number;
  isActive: boolean;
  createdAt: Date | null;
}

export class GroupChatService {
  
  // Create a new group chat
  async createGroup(
    creatorId: number, 
    name: string, 
    memberIds: number[],
    description?: string,
    avatarUrl?: string
  ): Promise<GroupChatResult> {
    if (!name || name.trim().length === 0) {
      return { success: false, message: "Group name is required" };
    }

    if (memberIds.length === 0) {
      return { success: false, message: "At least one member is required" };
    }

    // Create the group
    const [group] = await db.insert(groupChats)
      .values({
        name: name.trim(),
        description: description || null,
        avatarUrl: avatarUrl || null,
        creatorId,
        isActive: true
      })
      .returning();

    // Add creator as admin
    await db.insert(groupMembers).values({
      groupId: group.id,
      userId: creatorId,
      role: "admin",
      isActive: true
    });

    // Add other members
    for (const memberId of memberIds) {
      if (memberId !== creatorId) {
        await db.insert(groupMembers).values({
          groupId: group.id,
          userId: memberId,
          role: "member",
          isActive: true
        });

        // Notify new member
        await this.createGroupNotification(
          creatorId, 
          memberId, 
          group.id, 
          "added",
          group.name
        );
      }
    }

    return { success: true, message: "Group created", group };
  }

  // Get group by ID
  async getGroup(groupId: number): Promise<GroupChatInfo | null> {
    const [group] = await db.select()
      .from(groupChats)
      .where(eq(groupChats.id, groupId))
      .limit(1);

    if (!group) return null;

    const memberCount = await this.getMemberCount(groupId);

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      avatarUrl: group.avatarUrl,
      creatorId: group.creatorId,
      memberCount,
      isActive: group.isActive || false,
      createdAt: group.createdAt
    };
  }

  // Update group settings
  async updateGroup(
    groupId: number, 
    adminId: number, 
    updates: { name?: string; description?: string; avatarUrl?: string }
  ): Promise<GroupChatResult> {
    // Verify admin status
    const isAdmin = await this.isAdmin(groupId, adminId);
    if (!isAdmin) {
      return { success: false, message: "Only admins can update group settings" };
    }

    const updateData: Partial<GroupChat> = {};
    if (updates.name) updateData.name = updates.name.trim();
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.avatarUrl !== undefined) updateData.avatarUrl = updates.avatarUrl;
    updateData.updatedAt = new Date();

    const [updated] = await db.update(groupChats)
      .set(updateData)
      .where(eq(groupChats.id, groupId))
      .returning();

    return { success: true, message: "Group updated", group: updated };
  }

  // Add members to group
  async addMembers(
    groupId: number, 
    adminId: number, 
    memberIds: number[]
  ): Promise<{ success: boolean; message: string; added: number[] }> {
    // Verify admin status
    const isAdmin = await this.isAdmin(groupId, adminId);
    if (!isAdmin) {
      return { success: false, message: "Only admins can add members", added: [] };
    }

    const [group] = await db.select({ name: groupChats.name })
      .from(groupChats)
      .where(eq(groupChats.id, groupId))
      .limit(1);

    if (!group) {
      return { success: false, message: "Group not found", added: [] };
    }

    const added: number[] = [];

    for (const memberId of memberIds) {
      // Check if already a member
      const [existing] = await db.select()
        .from(groupMembers)
        .where(and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, memberId)
        ))
        .limit(1);

      if (existing) {
        // Reactivate if inactive
        if (!existing.isActive) {
          await db.update(groupMembers)
            .set({ isActive: true, leftAt: null })
            .where(eq(groupMembers.id, existing.id));
          added.push(memberId);
        }
        continue;
      }

      // Add new member
      await db.insert(groupMembers).values({
        groupId,
        userId: memberId,
        role: "member",
        isActive: true
      });

      added.push(memberId);

      // Notify new member
      await this.createGroupNotification(adminId, memberId, groupId, "added", group.name);
    }

    return { success: true, message: `Added ${added.length} members`, added };
  }

  // Remove a member from group
  async removeMember(
    groupId: number, 
    adminId: number, 
    memberId: number
  ): Promise<{ success: boolean; message: string }> {
    // Verify admin status
    const isAdmin = await this.isAdmin(groupId, adminId);
    if (!isAdmin) {
      return { success: false, message: "Only admins can remove members" };
    }

    // Can't remove the creator
    const [group] = await db.select({ creatorId: groupChats.creatorId, name: groupChats.name })
      .from(groupChats)
      .where(eq(groupChats.id, groupId))
      .limit(1);

    if (group?.creatorId === memberId) {
      return { success: false, message: "Cannot remove the group creator" };
    }

    // Mark member as inactive
    await db.update(groupMembers)
      .set({ isActive: false, leftAt: new Date() })
      .where(and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, memberId)
      ));

    // Notify removed member
    await this.createGroupNotification(adminId, memberId, groupId, "removed", group?.name || "");

    return { success: true, message: "Member removed" };
  }

  // Leave a group
  async leaveGroup(groupId: number, userId: number): Promise<{ success: boolean; message: string }> {
    // Check if user is the creator
    const [group] = await db.select({ creatorId: groupChats.creatorId })
      .from(groupChats)
      .where(eq(groupChats.id, groupId))
      .limit(1);

    if (!group) {
      return { success: false, message: "Group not found" };
    }

    if (group.creatorId === userId) {
      // Transfer ownership to another admin or oldest member
      const [newAdmin] = await db.select({ userId: groupMembers.userId })
        .from(groupMembers)
        .where(and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.isActive, true),
          ne(groupMembers.userId, userId)
        ))
        .orderBy(groupMembers.joinedAt)
        .limit(1);

      if (newAdmin) {
        // Transfer ownership
        await db.update(groupChats)
          .set({ creatorId: newAdmin.userId })
          .where(eq(groupChats.id, groupId));

        // Make new owner an admin
        await db.update(groupMembers)
          .set({ role: "admin" })
          .where(and(
            eq(groupMembers.groupId, groupId),
            eq(groupMembers.userId, newAdmin.userId)
          ));
      } else {
        // No other members, deactivate group
        await db.update(groupChats)
          .set({ isActive: false })
          .where(eq(groupChats.id, groupId));
      }
    }

    // Mark user as inactive in group
    await db.update(groupMembers)
      .set({ isActive: false, leftAt: new Date() })
      .where(and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, userId)
      ));

    return { success: true, message: "Left group" };
  }

  // Get group members
  async getMembers(groupId: number): Promise<GroupMemberInfo[]> {
    const members = await db.select({
      id: groupMembers.id,
      userId: users.id,
      username: users.username,
      fullName: users.fullName,
      profileImage: users.profileImage,
      role: groupMembers.role,
      joinedAt: groupMembers.joinedAt,
      isActive: groupMembers.isActive
    })
    .from(groupMembers)
    .innerJoin(users, eq(groupMembers.userId, users.id))
    .where(and(
      eq(groupMembers.groupId, groupId),
      eq(groupMembers.isActive, true)
    ))
    .orderBy(groupMembers.joinedAt);

    return members as GroupMemberInfo[];
  }

  // Get member count
  async getMemberCount(groupId: number): Promise<number> {
    const [result] = await db.select({ count: count() })
      .from(groupMembers)
      .where(and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.isActive, true)
      ));

    return result?.count || 0;
  }

  // Promote member to admin
  async promoteToAdmin(
    groupId: number, 
    adminId: number, 
    memberId: number
  ): Promise<{ success: boolean; message: string }> {
    // Verify admin status
    const isAdmin = await this.isAdmin(groupId, adminId);
    if (!isAdmin) {
      return { success: false, message: "Only admins can promote members" };
    }

    await db.update(groupMembers)
      .set({ role: "admin" })
      .where(and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, memberId)
      ));

    return { success: true, message: "Member promoted to admin" };
  }

  // Demote admin to member
  async demoteToMember(
    groupId: number, 
    adminId: number, 
    memberId: number
  ): Promise<{ success: boolean; message: string }> {
    // Verify admin status
    const isAdmin = await this.isAdmin(groupId, adminId);
    if (!isAdmin) {
      return { success: false, message: "Only admins can demote members" };
    }

    // Can't demote the creator
    const [group] = await db.select({ creatorId: groupChats.creatorId })
      .from(groupChats)
      .where(eq(groupChats.id, groupId))
      .limit(1);

    if (group?.creatorId === memberId) {
      return { success: false, message: "Cannot demote the group creator" };
    }

    await db.update(groupMembers)
      .set({ role: "member" })
      .where(and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, memberId)
      ));

    return { success: true, message: "Admin demoted to member" };
  }

  // Check if user is admin
  async isAdmin(groupId: number, userId: number): Promise<boolean> {
    const [member] = await db.select({ role: groupMembers.role })
      .from(groupMembers)
      .where(and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, userId),
        eq(groupMembers.isActive, true)
      ))
      .limit(1);

    return member?.role === "admin";
  }

  // Check if user is member
  async isMember(groupId: number, userId: number): Promise<boolean> {
    const [member] = await db.select()
      .from(groupMembers)
      .where(and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, userId),
        eq(groupMembers.isActive, true)
      ))
      .limit(1);

    return !!member;
  }

  // Get user's groups
  async getUserGroups(userId: number): Promise<GroupChatInfo[]> {
    const memberships = await db.select({
      groupId: groupMembers.groupId
    })
    .from(groupMembers)
    .where(and(
      eq(groupMembers.userId, userId),
      eq(groupMembers.isActive, true)
    ));

    const groups: GroupChatInfo[] = [];

    for (const membership of memberships) {
      const group = await this.getGroup(membership.groupId);
      if (group && group.isActive) {
        groups.push(group);
      }
    }

    return groups;
  }

  // Delete group (creator only)
  async deleteGroup(groupId: number, userId: number): Promise<{ success: boolean; message: string }> {
    const [group] = await db.select({ creatorId: groupChats.creatorId })
      .from(groupChats)
      .where(eq(groupChats.id, groupId))
      .limit(1);

    if (!group) {
      return { success: false, message: "Group not found" };
    }

    if (group.creatorId !== userId) {
      return { success: false, message: "Only the creator can delete the group" };
    }

    // Deactivate group
    await db.update(groupChats)
      .set({ isActive: false })
      .where(eq(groupChats.id, groupId));

    // Deactivate all memberships
    await db.update(groupMembers)
      .set({ isActive: false, leftAt: new Date() })
      .where(eq(groupMembers.groupId, groupId));

    return { success: true, message: "Group deleted" };
  }

  // Create group notification
  private async createGroupNotification(
    fromUserId: number, 
    toUserId: number, 
    groupId: number,
    action: "added" | "removed" | "promoted" | "demoted",
    groupName: string
  ): Promise<void> {
    const [fromUser] = await db.select({ username: users.username })
      .from(users)
      .where(eq(users.id, fromUserId))
      .limit(1);

    let title: string;
    let message: string;

    switch (action) {
      case "added":
        title = "Added to Group";
        message = `${fromUser?.username || 'Someone'} added you to "${groupName}"`;
        break;
      case "removed":
        title = "Removed from Group";
        message = `You were removed from "${groupName}"`;
        break;
      case "promoted":
        title = "Promoted to Admin";
        message = `You are now an admin in "${groupName}"`;
        break;
      case "demoted":
        title = "Role Changed";
        message = `You are no longer an admin in "${groupName}"`;
        break;
    }

    await db.insert(notifications).values({
      userId: toUserId,
      fromUserId,
      type: "group_chat",
      title,
      message,
      entityType: "group",
      entityId: groupId,
      actionUrl: `/messages/group/${groupId}`
    });
  }

  // Get group admins
  async getAdmins(groupId: number): Promise<GroupMemberInfo[]> {
    const members = await this.getMembers(groupId);
    return members.filter(m => m.role === "admin");
  }

  // Search groups by name
  async searchGroups(userId: number, query: string): Promise<GroupChatInfo[]> {
    const userGroups = await this.getUserGroups(userId);
    
    if (!query) return userGroups;

    const lowerQuery = query.toLowerCase();
    return userGroups.filter(g => 
      g.name.toLowerCase().includes(lowerQuery) ||
      (g.description && g.description.toLowerCase().includes(lowerQuery))
    );
  }
}

// Export singleton instance
export const groupChatService = new GroupChatService();
