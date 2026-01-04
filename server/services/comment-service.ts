import { 
  comments,
  commentLikes,
  users,
  postMentions,
  notifications,
  posts,
  type Comment
} from "@shared/schema";
import { db } from "../db";
import { eq, and, sql, desc, isNull, asc, count } from "drizzle-orm";

const MAX_NESTING_DEPTH = 3;

export interface CommentWithUser extends Comment {
  user: {
    id: number;
    username: string;
    profileImage: string | null;
    verificationBadge: boolean | null;
  };
  likesCount: number;
  isLiked?: boolean;
  replies?: CommentWithUser[];
  replyCount?: number;
  isPinned?: boolean;
  isEdited?: boolean;
  editedAt?: Date | null;
}

export interface CommentResult {
  success: boolean;
  message: string;
  comment?: Comment;
}

export class CommentService {
  
  // Get the nesting depth of a comment
  async getCommentDepth(commentId: number): Promise<number> {
    let depth = 0;
    let currentId: number | null = commentId;
    
    while (currentId !== null) {
      const queryResult: { parentId: number | null }[] = await db.select({ parentId: comments.parentId })
        .from(comments)
        .where(eq(comments.id, currentId))
        .limit(1);
      
      const commentRow: { parentId: number | null } | undefined = queryResult[0];
      if (!commentRow || commentRow.parentId === null) {
        break;
      }
      
      currentId = commentRow.parentId;
      depth++;
    }
    
    return depth;
  }

  // Create a new comment
  async createComment(
    userId: number, 
    postId: number, 
    content: string, 
    parentId?: number
  ): Promise<CommentResult> {
    // Validate nesting depth
    if (parentId) {
      const depth = await this.getCommentDepth(parentId);
      if (depth >= MAX_NESTING_DEPTH - 1) {
        return { 
          success: false, 
          message: `Comments can only be nested up to ${MAX_NESTING_DEPTH} levels deep` 
        };
      }
    }

    // Check if post exists
    const [post] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
    if (!post) {
      return { success: false, message: "Post not found" };
    }

    // If replying to a comment, verify parent exists and belongs to same post
    if (parentId) {
      const [parentComment] = await db.select()
        .from(comments)
        .where(and(eq(comments.id, parentId), eq(comments.postId, postId)))
        .limit(1);
      
      if (!parentComment) {
        return { success: false, message: "Parent comment not found" };
      }
    }

    // Create the comment
    const [comment] = await db.insert(comments)
      .values({
        userId,
        postId,
        content,
        parentId: parentId || null
      })
      .returning();

    // Extract and process mentions from content
    await this.processMentions(content, postId, userId);

    // Create notification for post owner (if not self-comment)
    if (post.userId !== userId) {
      await this.createCommentNotification(userId, post.userId, postId, comment.id);
    }

    // If replying to a comment, notify the parent comment author
    if (parentId) {
      const [parentComment] = await db.select()
        .from(comments)
        .where(eq(comments.id, parentId))
        .limit(1);
      
      if (parentComment && parentComment.userId !== userId) {
        await this.createReplyNotification(userId, parentComment.userId, postId, comment.id);
      }
    }

    return { success: true, message: "Comment created", comment };
  }

  // Process mentions in comment content
  private async processMentions(content: string, postId: number, mentionedByUserId: number): Promise<void> {
    const mentionRegex = /@(\w+)/g;
    const mentions = content.match(mentionRegex);
    
    if (!mentions) return;

    for (const mention of mentions) {
      const username = mention.slice(1); // Remove @ symbol
      
      const [user] = await db.select({ id: users.id })
        .from(users)
        .where(eq(users.username, username))
        .limit(1);
      
      if (user && user.id !== mentionedByUserId) {
        // Create mention record
        await db.insert(postMentions)
          .values({
            postId,
            mentionedUserId: user.id,
            mentionedByUserId,
            mentionType: "comment"
          });

        // Create notification for mentioned user
        await this.createMentionNotification(mentionedByUserId, user.id, postId);
      }
    }
  }

  // Create notification for comment
  private async createCommentNotification(
    fromUserId: number, 
    toUserId: number, 
    postId: number, 
    commentId: number
  ): Promise<void> {
    const [fromUser] = await db.select({ username: users.username })
      .from(users)
      .where(eq(users.id, fromUserId))
      .limit(1);

    await db.insert(notifications).values({
      userId: toUserId,
      fromUserId,
      type: "comment",
      title: "New Comment",
      message: `${fromUser?.username || 'Someone'} commented on your post`,
      entityType: "comment",
      entityId: commentId,
      actionUrl: `/post/${postId}`
    });
  }

  // Create notification for reply
  private async createReplyNotification(
    fromUserId: number, 
    toUserId: number, 
    postId: number, 
    commentId: number
  ): Promise<void> {
    const [fromUser] = await db.select({ username: users.username })
      .from(users)
      .where(eq(users.id, fromUserId))
      .limit(1);

    await db.insert(notifications).values({
      userId: toUserId,
      fromUserId,
      type: "comment",
      title: "New Reply",
      message: `${fromUser?.username || 'Someone'} replied to your comment`,
      entityType: "comment",
      entityId: commentId,
      actionUrl: `/post/${postId}`
    });
  }

  // Create notification for mention
  private async createMentionNotification(
    fromUserId: number, 
    toUserId: number, 
    postId: number
  ): Promise<void> {
    const [fromUser] = await db.select({ username: users.username })
      .from(users)
      .where(eq(users.id, fromUserId))
      .limit(1);

    await db.insert(notifications).values({
      userId: toUserId,
      fromUserId,
      type: "mention",
      title: "You were mentioned",
      message: `${fromUser?.username || 'Someone'} mentioned you in a comment`,
      entityType: "post",
      entityId: postId,
      actionUrl: `/post/${postId}`
    });
  }

  // Get comments for a post with nested replies
  async getPostComments(
    postId: number, 
    viewerId?: number,
    page: number = 1,
    limit: number = 20
  ): Promise<CommentWithUser[]> {
    const offset = (page - 1) * limit;

    // Get top-level comments
    const topLevelComments = await db.select({
      id: comments.id,
      content: comments.content,
      userId: comments.userId,
      postId: comments.postId,
      parentId: comments.parentId,
      createdAt: comments.createdAt,
      user: {
        id: users.id,
        username: users.username,
        profileImage: users.profileImage,
        verificationBadge: users.verificationBadge
      }
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(and(eq(comments.postId, postId), isNull(comments.parentId)))
    .orderBy(desc(comments.createdAt))
    .limit(limit)
    .offset(offset);

    // Enrich comments with likes and replies
    const enrichedComments: CommentWithUser[] = [];
    
    for (const comment of topLevelComments) {
      const enriched = await this.enrichComment(comment as any, viewerId);
      enrichedComments.push(enriched);
    }

    return enrichedComments;
  }

  // Enrich a comment with likes count, user like status, and replies
  private async enrichComment(
    comment: CommentWithUser, 
    viewerId?: number
  ): Promise<CommentWithUser> {
    // Get likes count
    const [likesResult] = await db.select({ count: count() })
      .from(commentLikes)
      .where(eq(commentLikes.commentId, comment.id));
    
    comment.likesCount = likesResult?.count || 0;

    // Check if viewer has liked
    if (viewerId) {
      const [userLike] = await db.select()
        .from(commentLikes)
        .where(and(
          eq(commentLikes.commentId, comment.id),
          eq(commentLikes.userId, viewerId)
        ))
        .limit(1);
      
      comment.isLiked = !!userLike;
    }

    // Get reply count
    const [replyCountResult] = await db.select({ count: count() })
      .from(comments)
      .where(eq(comments.parentId, comment.id));
    
    comment.replyCount = replyCountResult?.count || 0;

    // Get nested replies (up to 3 levels)
    const replies = await this.getReplies(comment.id, viewerId);
    comment.replies = replies;

    return comment;
  }

  // Get replies for a comment
  async getReplies(
    parentId: number, 
    viewerId?: number,
    limit: number = 10
  ): Promise<CommentWithUser[]> {
    const replies = await db.select({
      id: comments.id,
      content: comments.content,
      userId: comments.userId,
      postId: comments.postId,
      parentId: comments.parentId,
      createdAt: comments.createdAt,
      user: {
        id: users.id,
        username: users.username,
        profileImage: users.profileImage,
        verificationBadge: users.verificationBadge
      }
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.parentId, parentId))
    .orderBy(asc(comments.createdAt))
    .limit(limit);

    const enrichedReplies: CommentWithUser[] = [];
    
    for (const reply of replies) {
      const enriched = await this.enrichComment(reply as any, viewerId);
      enrichedReplies.push(enriched);
    }

    return enrichedReplies;
  }

  // Update a comment (only owner can edit)
  async updateComment(
    commentId: number, 
    userId: number, 
    content: string
  ): Promise<CommentResult> {
    // Verify ownership - only comment owner can edit
    const [existing] = await db.select()
      .from(comments)
      .where(and(eq(comments.id, commentId), eq(comments.userId, userId)))
      .limit(1);

    if (!existing) {
      return { success: false, message: "Comment not found or unauthorized" };
    }

    const [updated] = await db.update(comments)
      .set({ 
        content,
        isEdited: true,
        editedAt: new Date()
      })
      .where(eq(comments.id, commentId))
      .returning();

    return { success: true, message: "Comment updated", comment: updated };
  }

  // Delete a comment (owner or post owner can delete)
  async deleteComment(commentId: number, userId: number, postOwnerId?: number): Promise<CommentResult> {
    // Get the comment
    const [existing] = await db.select()
      .from(comments)
      .where(eq(comments.id, commentId))
      .limit(1);

    if (!existing) {
      return { success: false, message: "Comment not found" };
    }

    // Check if user is comment owner or post owner
    const isCommentOwner = existing.userId === userId;
    const isPostOwner = postOwnerId !== undefined && postOwnerId === userId;
    
    // If postOwnerId not provided, fetch it
    if (!isCommentOwner && postOwnerId === undefined) {
      const [post] = await db.select({ userId: posts.userId })
        .from(posts)
        .where(eq(posts.id, existing.postId))
        .limit(1);
      
      if (post && post.userId === userId) {
        // User is post owner, allow deletion
      } else {
        return { success: false, message: "Unauthorized - only comment owner or post owner can delete" };
      }
    } else if (!isCommentOwner && !isPostOwner) {
      return { success: false, message: "Unauthorized - only comment owner or post owner can delete" };
    }

    // Delete all nested replies first
    await this.deleteNestedReplies(commentId);

    // Delete the comment
    await db.delete(comments).where(eq(comments.id, commentId));

    return { success: true, message: "Comment deleted" };
  }

  // Recursively delete nested replies
  private async deleteNestedReplies(parentId: number): Promise<void> {
    const childComments = await db.select({ id: comments.id })
      .from(comments)
      .where(eq(comments.parentId, parentId));

    for (const child of childComments) {
      await this.deleteNestedReplies(child.id);
      await db.delete(commentLikes).where(eq(commentLikes.commentId, child.id));
      await db.delete(comments).where(eq(comments.id, child.id));
    }
  }

  // Like a comment
  async likeComment(commentId: number, userId: number): Promise<{ success: boolean; message: string }> {
    // Check if comment exists
    const [comment] = await db.select()
      .from(comments)
      .where(eq(comments.id, commentId))
      .limit(1);

    if (!comment) {
      return { success: false, message: "Comment not found" };
    }

    // Check if already liked
    const [existing] = await db.select()
      .from(commentLikes)
      .where(and(
        eq(commentLikes.commentId, commentId),
        eq(commentLikes.userId, userId)
      ))
      .limit(1);

    if (existing) {
      return { success: false, message: "Already liked" };
    }

    await db.insert(commentLikes).values({ commentId, userId });

    return { success: true, message: "Comment liked" };
  }

  // Unlike a comment
  async unlikeComment(commentId: number, userId: number): Promise<{ success: boolean; message: string }> {
    const result = await db.delete(commentLikes)
      .where(and(
        eq(commentLikes.commentId, commentId),
        eq(commentLikes.userId, userId)
      ));

    if (result.rowCount === 0) {
      return { success: false, message: "Like not found" };
    }

    return { success: true, message: "Comment unliked" };
  }

  // Get comment by ID
  async getCommentById(commentId: number, viewerId?: number): Promise<CommentWithUser | null> {
    const [comment] = await db.select({
      id: comments.id,
      content: comments.content,
      userId: comments.userId,
      postId: comments.postId,
      parentId: comments.parentId,
      createdAt: comments.createdAt,
      user: {
        id: users.id,
        username: users.username,
        profileImage: users.profileImage,
        verificationBadge: users.verificationBadge
      }
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.id, commentId))
    .limit(1);

    if (!comment) return null;

    return await this.enrichComment(comment as any, viewerId);
  }

  // Get comment count for a post
  async getCommentCount(postId: number): Promise<number> {
    const [result] = await db.select({ count: count() })
      .from(comments)
      .where(eq(comments.postId, postId));

    return result?.count || 0;
  }

  // Pin a comment (only post owner can pin)
  async pinComment(
    commentId: number, 
    postOwnerId: number
  ): Promise<{ success: boolean; message: string }> {
    // Get the comment
    const [comment] = await db.select({
      id: comments.id,
      postId: comments.postId,
      isPinned: comments.isPinned
    })
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);

    if (!comment) {
      return { success: false, message: "Comment not found" };
    }

    // Verify the user owns the post
    const [post] = await db.select()
      .from(posts)
      .where(and(eq(posts.id, comment.postId), eq(posts.userId, postOwnerId)))
      .limit(1);

    if (!post) {
      return { success: false, message: "Unauthorized - only post owner can pin comments" };
    }

    // Unpin any existing pinned comment on this post first
    await db.update(comments)
      .set({ isPinned: false })
      .where(and(eq(comments.postId, comment.postId), eq(comments.isPinned, true)));

    // Pin the new comment
    await db.update(comments)
      .set({ isPinned: true })
      .where(eq(comments.id, commentId));

    return { success: true, message: "Comment pinned" };
  }

  // Unpin a comment (only post owner can unpin)
  async unpinComment(
    commentId: number, 
    postOwnerId: number
  ): Promise<{ success: boolean; message: string }> {
    // Get the comment
    const [comment] = await db.select({
      id: comments.id,
      postId: comments.postId
    })
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);

    if (!comment) {
      return { success: false, message: "Comment not found" };
    }

    // Verify the user owns the post
    const [post] = await db.select()
      .from(posts)
      .where(and(eq(posts.id, comment.postId), eq(posts.userId, postOwnerId)))
      .limit(1);

    if (!post) {
      return { success: false, message: "Unauthorized - only post owner can unpin comments" };
    }

    await db.update(comments)
      .set({ isPinned: false })
      .where(eq(comments.id, commentId));

    return { success: true, message: "Comment unpinned" };
  }

  // Get user's comments
  async getUserComments(
    userId: number, 
    page: number = 1, 
    limit: number = 20
  ): Promise<Comment[]> {
    const offset = (page - 1) * limit;

    return await db.select()
      .from(comments)
      .where(eq(comments.userId, userId))
      .orderBy(desc(comments.createdAt))
      .limit(limit)
      .offset(offset);
  }
}

// Export singleton instance
export const commentService = new CommentService();
