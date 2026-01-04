import { 
  postCollaborators,
  posts,
  users,
  notifications,
  likes,
  comments,
  type Post
} from "@shared/schema";
import { db } from "../db";
import { eq, and, desc, count, sql } from "drizzle-orm";

export interface CollaborationResult {
  success: boolean;
  message: string;
  collaboration?: {
    id: number;
    postId: number;
    userId: number;
    status: string;
  };
}

export interface CollaboratorInfo {
  id: number;
  userId: number;
  username: string;
  fullName: string | null;
  profileImage: string | null;
  status: string;
  createdAt: Date | null;
}

export interface SharedEngagementMetrics {
  totalLikes: number;
  totalComments: number;
  collaboratorCount: number;
  engagementPerCollaborator: number;
}

export class CollaborationService {
  
  // Invite a user to collaborate on a post
  async inviteCollaborator(
    postId: number, 
    inviterId: number, 
    inviteeId: number
  ): Promise<CollaborationResult> {
    // Verify post exists and inviter is the owner
    const [post] = await db.select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!post) {
      return { success: false, message: "Post not found" };
    }

    if (post.userId !== inviterId) {
      return { success: false, message: "Only post owner can invite collaborators" };
    }

    // Can't invite yourself
    if (inviterId === inviteeId) {
      return { success: false, message: "Cannot invite yourself as collaborator" };
    }

    // Check if invitee exists
    const [invitee] = await db.select({ id: users.id, username: users.username })
      .from(users)
      .where(eq(users.id, inviteeId))
      .limit(1);

    if (!invitee) {
      return { success: false, message: "User not found" };
    }

    // Check if already invited
    const [existing] = await db.select()
      .from(postCollaborators)
      .where(and(
        eq(postCollaborators.postId, postId),
        eq(postCollaborators.userId, inviteeId)
      ))
      .limit(1);

    if (existing) {
      return { success: false, message: "User already invited" };
    }

    // Create collaboration invitation
    const [collaboration] = await db.insert(postCollaborators)
      .values({
        postId,
        userId: inviteeId,
        status: "pending"
      })
      .returning();

    // Send notification to invitee
    await this.createCollaborationNotification(inviterId, inviteeId, postId, "invite");

    return { 
      success: true, 
      message: "Collaboration invitation sent",
      collaboration: {
        id: collaboration.id,
        postId: collaboration.postId,
        userId: collaboration.userId,
        status: collaboration.status || "pending"
      }
    };
  }

  // Accept collaboration invitation
  async acceptCollaboration(
    postId: number, 
    userId: number
  ): Promise<CollaborationResult> {
    const [collaboration] = await db.select()
      .from(postCollaborators)
      .where(and(
        eq(postCollaborators.postId, postId),
        eq(postCollaborators.userId, userId),
        eq(postCollaborators.status, "pending")
      ))
      .limit(1);

    if (!collaboration) {
      return { success: false, message: "Collaboration invitation not found" };
    }

    const [updated] = await db.update(postCollaborators)
      .set({ status: "accepted" })
      .where(eq(postCollaborators.id, collaboration.id))
      .returning();

    // Notify post owner
    const [post] = await db.select({ userId: posts.userId })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (post) {
      await this.createCollaborationNotification(userId, post.userId, postId, "accept");
    }

    return { 
      success: true, 
      message: "Collaboration accepted",
      collaboration: {
        id: updated.id,
        postId: updated.postId,
        userId: updated.userId,
        status: updated.status || "accepted"
      }
    };
  }

  // Reject collaboration invitation
  async rejectCollaboration(
    postId: number, 
    userId: number
  ): Promise<CollaborationResult> {
    const [collaboration] = await db.select()
      .from(postCollaborators)
      .where(and(
        eq(postCollaborators.postId, postId),
        eq(postCollaborators.userId, userId),
        eq(postCollaborators.status, "pending")
      ))
      .limit(1);

    if (!collaboration) {
      return { success: false, message: "Collaboration invitation not found" };
    }

    const [updated] = await db.update(postCollaborators)
      .set({ status: "rejected" })
      .where(eq(postCollaborators.id, collaboration.id))
      .returning();

    return { 
      success: true, 
      message: "Collaboration rejected",
      collaboration: {
        id: updated.id,
        postId: updated.postId,
        userId: updated.userId,
        status: updated.status || "rejected"
      }
    };
  }

  // Remove a collaborator from a post
  async removeCollaborator(
    postId: number, 
    ownerId: number, 
    collaboratorId: number
  ): Promise<CollaborationResult> {
    // Verify post ownership
    const [post] = await db.select()
      .from(posts)
      .where(and(eq(posts.id, postId), eq(posts.userId, ownerId)))
      .limit(1);

    if (!post) {
      return { success: false, message: "Post not found or unauthorized" };
    }

    const result = await db.delete(postCollaborators)
      .where(and(
        eq(postCollaborators.postId, postId),
        eq(postCollaborators.userId, collaboratorId)
      ));

    if (result.rowCount === 0) {
      return { success: false, message: "Collaborator not found" };
    }

    return { success: true, message: "Collaborator removed" };
  }

  // Leave a collaboration
  async leaveCollaboration(
    postId: number, 
    userId: number
  ): Promise<CollaborationResult> {
    const result = await db.delete(postCollaborators)
      .where(and(
        eq(postCollaborators.postId, postId),
        eq(postCollaborators.userId, userId)
      ));

    if (result.rowCount === 0) {
      return { success: false, message: "Collaboration not found" };
    }

    return { success: true, message: "Left collaboration" };
  }

  // Get all collaborators for a post
  async getPostCollaborators(postId: number): Promise<CollaboratorInfo[]> {
    const collaborators = await db.select({
      id: postCollaborators.id,
      userId: users.id,
      username: users.username,
      fullName: users.fullName,
      profileImage: users.profileImage,
      status: postCollaborators.status,
      createdAt: postCollaborators.createdAt
    })
    .from(postCollaborators)
    .innerJoin(users, eq(postCollaborators.userId, users.id))
    .where(eq(postCollaborators.postId, postId))
    .orderBy(desc(postCollaborators.createdAt));

    return collaborators as CollaboratorInfo[];
  }

  // Get accepted collaborators only
  async getAcceptedCollaborators(postId: number): Promise<CollaboratorInfo[]> {
    const collaborators = await db.select({
      id: postCollaborators.id,
      userId: users.id,
      username: users.username,
      fullName: users.fullName,
      profileImage: users.profileImage,
      status: postCollaborators.status,
      createdAt: postCollaborators.createdAt
    })
    .from(postCollaborators)
    .innerJoin(users, eq(postCollaborators.userId, users.id))
    .where(and(
      eq(postCollaborators.postId, postId),
      eq(postCollaborators.status, "accepted")
    ))
    .orderBy(desc(postCollaborators.createdAt));

    return collaborators as CollaboratorInfo[];
  }

  // Get pending collaboration invitations for a user
  async getPendingInvitations(userId: number): Promise<{
    id: number;
    postId: number;
    post: { id: number; content: string | null; imageUrl: string | null };
    inviter: { id: number; username: string; profileImage: string | null };
    createdAt: Date | null;
  }[]> {
    const invitations = await db.select({
      id: postCollaborators.id,
      postId: postCollaborators.postId,
      createdAt: postCollaborators.createdAt,
      post: {
        id: posts.id,
        content: posts.content,
        imageUrl: posts.imageUrl
      },
      inviter: {
        id: users.id,
        username: users.username,
        profileImage: users.profileImage
      }
    })
    .from(postCollaborators)
    .innerJoin(posts, eq(postCollaborators.postId, posts.id))
    .innerJoin(users, eq(posts.userId, users.id))
    .where(and(
      eq(postCollaborators.userId, userId),
      eq(postCollaborators.status, "pending")
    ))
    .orderBy(desc(postCollaborators.createdAt));

    return invitations as any;
  }

  // Get posts where user is a collaborator
  async getCollaborativePosts(userId: number): Promise<Post[]> {
    const collaborations = await db.select({
      post: posts
    })
    .from(postCollaborators)
    .innerJoin(posts, eq(postCollaborators.postId, posts.id))
    .where(and(
      eq(postCollaborators.userId, userId),
      eq(postCollaborators.status, "accepted")
    ))
    .orderBy(desc(posts.createdAt));

    return collaborations.map((c: { post: Post }) => c.post);
  }

  // Check if user is a collaborator on a post
  async isCollaborator(postId: number, userId: number): Promise<boolean> {
    const [collaboration] = await db.select()
      .from(postCollaborators)
      .where(and(
        eq(postCollaborators.postId, postId),
        eq(postCollaborators.userId, userId),
        eq(postCollaborators.status, "accepted")
      ))
      .limit(1);

    return !!collaboration;
  }

  // Get shared engagement metrics for a collaborative post
  async getSharedEngagementMetrics(postId: number): Promise<SharedEngagementMetrics> {
    // Get total likes
    const [likesResult] = await db.select({ count: count() })
      .from(likes)
      .where(eq(likes.postId, postId));

    // Get total comments
    const [commentsResult] = await db.select({ count: count() })
      .from(comments)
      .where(eq(comments.postId, postId));

    // Get collaborator count (including owner)
    const collaborators = await this.getAcceptedCollaborators(postId);
    const collaboratorCount = collaborators.length + 1; // +1 for owner

    const totalLikes = likesResult?.count || 0;
    const totalComments = commentsResult?.count || 0;
    const totalEngagement = totalLikes + totalComments;

    return {
      totalLikes,
      totalComments,
      collaboratorCount,
      engagementPerCollaborator: collaboratorCount > 0 
        ? Math.round(totalEngagement / collaboratorCount) 
        : 0
    };
  }

  // Create notification for collaboration events
  private async createCollaborationNotification(
    fromUserId: number, 
    toUserId: number, 
    postId: number,
    type: "invite" | "accept" | "reject"
  ): Promise<void> {
    const [fromUser] = await db.select({ username: users.username, profileImage: users.profileImage })
      .from(users)
      .where(eq(users.id, fromUserId))
      .limit(1);

    let title: string;
    let message: string;

    switch (type) {
      case "invite":
        title = "Collaboration Invitation";
        message = `${fromUser?.username || 'Someone'} invited you to collaborate on a post`;
        break;
      case "accept":
        title = "Collaboration Accepted";
        message = `${fromUser?.username || 'Someone'} accepted your collaboration invitation`;
        break;
      case "reject":
        title = "Collaboration Declined";
        message = `${fromUser?.username || 'Someone'} declined your collaboration invitation`;
        break;
    }

    await db.insert(notifications).values({
      userId: toUserId,
      fromUserId,
      type: "collaboration",
      title,
      message,
      entityType: "post",
      entityId: postId,
      imageUrl: fromUser?.profileImage,
      actionUrl: `/post/${postId}`
    });
  }

  // Get collaboration status for a user on a post
  async getCollaborationStatus(
    postId: number, 
    userId: number
  ): Promise<"none" | "pending" | "accepted" | "rejected"> {
    const [collaboration] = await db.select({ status: postCollaborators.status })
      .from(postCollaborators)
      .where(and(
        eq(postCollaborators.postId, postId),
        eq(postCollaborators.userId, userId)
      ))
      .limit(1);

    if (!collaboration) return "none";
    return (collaboration.status as "pending" | "accepted" | "rejected") || "none";
  }

  // Get all authors of a post (owner + accepted collaborators)
  async getPostAuthors(postId: number): Promise<{
    id: number;
    username: string;
    fullName: string | null;
    profileImage: string | null;
    isOwner: boolean;
  }[]> {
    // Get post owner
    const [post] = await db.select({
      userId: posts.userId
    })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);

    if (!post) return [];

    const [owner] = await db.select({
      id: users.id,
      username: users.username,
      fullName: users.fullName,
      profileImage: users.profileImage
    })
    .from(users)
    .where(eq(users.id, post.userId))
    .limit(1);

    const authors: {
      id: number;
      username: string;
      fullName: string | null;
      profileImage: string | null;
      isOwner: boolean;
    }[] = [];

    if (owner) {
      authors.push({ ...owner, isOwner: true });
    }

    // Get accepted collaborators
    const collaborators = await this.getAcceptedCollaborators(postId);
    for (const collab of collaborators) {
      authors.push({
        id: collab.userId,
        username: collab.username,
        fullName: collab.fullName,
        profileImage: collab.profileImage,
        isOwner: false
      });
    }

    return authors;
  }
}

// Export singleton instance
export const collaborationService = new CollaborationService();
