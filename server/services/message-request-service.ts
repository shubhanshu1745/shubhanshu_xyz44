import { 
  messageRequests,
  messages,
  conversations,
  users,
  userRelationships,
  notifications,
  type MessageRequest,
  type Message
} from "@shared/schema";
import { db } from "../db";
import { eq, and, desc, or, sql } from "drizzle-orm";
import { privacyService } from "./privacy-service";

export interface MessageRequestResult {
  success: boolean;
  message: string;
  request?: MessageRequest;
}

export interface MessageRequestInfo {
  id: number;
  senderId: number;
  sender: {
    id: number;
    username: string;
    fullName: string | null;
    profileImage: string | null;
  };
  messagePreview: string;
  createdAt: Date | null;
}

export class MessageRequestService {
  
  // Send a message (creates request if not following)
  async sendMessage(
    senderId: number, 
    recipientId: number, 
    content: string,
    messageType: string = "text"
  ): Promise<{ success: boolean; message: string; isRequest: boolean; messageId?: number }> {
    // Check if sender is following recipient
    const isFollowing = await this.isFollowing(senderId, recipientId);
    
    // Check if recipient allows message requests
    const canSendRequest = await privacyService.canSendMessageRequest(senderId, recipientId);
    
    if (!isFollowing && !canSendRequest) {
      return { success: false, message: "User does not accept message requests", isRequest: false };
    }

    // Check if blocked
    const isBlocked = await this.isBlocked(senderId, recipientId);
    if (isBlocked) {
      return { success: false, message: "Cannot send message to this user", isRequest: false };
    }

    // Get or create conversation
    const conversationId = await this.getOrCreateConversation(senderId, recipientId);

    // Create the message
    const [newMessage] = await db.insert(messages)
      .values({
        conversationId,
        senderId,
        content,
        messageType
      })
      .returning();

    // Update conversation last message time
    await db.update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, conversationId));

    // If not following, create a message request
    if (!isFollowing) {
      // Check if request already exists
      const [existingRequest] = await db.select()
        .from(messageRequests)
        .where(and(
          eq(messageRequests.senderId, senderId),
          eq(messageRequests.recipientId, recipientId),
          eq(messageRequests.status, "pending")
        ))
        .limit(1);

      if (!existingRequest) {
        await db.insert(messageRequests)
          .values({
            senderId,
            recipientId,
            messageId: newMessage.id,
            status: "pending"
          });

        // Create notification for message request
        await this.createMessageRequestNotification(senderId, recipientId);
      }

      return { 
        success: true, 
        message: "Message sent as request", 
        isRequest: true,
        messageId: newMessage.id
      };
    }

    // Create notification for regular message
    await this.createMessageNotification(senderId, recipientId);

    return { 
      success: true, 
      message: "Message sent", 
      isRequest: false,
      messageId: newMessage.id
    };
  }

  // Get pending message requests for a user
  async getMessageRequests(
    userId: number,
    page: number = 1,
    limit: number = 20
  ): Promise<{ requests: MessageRequestInfo[]; total: number }> {
    const offset = (page - 1) * limit;

    const requests = await db.select({
      id: messageRequests.id,
      senderId: messageRequests.senderId,
      messageId: messageRequests.messageId,
      createdAt: messageRequests.createdAt,
      sender: {
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        profileImage: users.profileImage
      }
    })
    .from(messageRequests)
    .innerJoin(users, eq(messageRequests.senderId, users.id))
    .where(and(
      eq(messageRequests.recipientId, userId),
      eq(messageRequests.status, "pending")
    ))
    .orderBy(desc(messageRequests.createdAt))
    .limit(limit)
    .offset(offset);

    // Get message previews
    const requestsWithPreviews: MessageRequestInfo[] = [];
    for (const req of requests) {
      let messagePreview = "";
      if (req.messageId) {
        const [msg] = await db.select({ content: messages.content })
          .from(messages)
          .where(eq(messages.id, req.messageId))
          .limit(1);
        messagePreview = msg?.content?.substring(0, 50) || "";
      }

      requestsWithPreviews.push({
        id: req.id,
        senderId: req.senderId,
        sender: req.sender,
        messagePreview,
        createdAt: req.createdAt
      });
    }

    // Get total count
    const allRequests = await db.select({ id: messageRequests.id })
      .from(messageRequests)
      .where(and(
        eq(messageRequests.recipientId, userId),
        eq(messageRequests.status, "pending")
      ));

    return {
      requests: requestsWithPreviews,
      total: allRequests.length
    };
  }

  // Accept a message request
  async acceptRequest(requestId: number, userId: number): Promise<MessageRequestResult> {
    // Verify the request belongs to this user
    const [request] = await db.select()
      .from(messageRequests)
      .where(and(
        eq(messageRequests.id, requestId),
        eq(messageRequests.recipientId, userId),
        eq(messageRequests.status, "pending")
      ))
      .limit(1);

    if (!request) {
      return { success: false, message: "Message request not found" };
    }

    // Update request status
    const [updated] = await db.update(messageRequests)
      .set({ 
        status: "accepted",
        respondedAt: new Date()
      })
      .where(eq(messageRequests.id, requestId))
      .returning();

    // Mark the message as read
    if (request.messageId) {
      await db.update(messages)
        .set({ read: true })
        .where(eq(messages.id, request.messageId));
    }

    // Notify sender that request was accepted
    await this.createRequestAcceptedNotification(userId, request.senderId);

    return { success: true, message: "Message request accepted", request: updated };
  }

  // Decline a message request
  async declineRequest(requestId: number, userId: number): Promise<MessageRequestResult> {
    // Verify the request belongs to this user
    const [request] = await db.select()
      .from(messageRequests)
      .where(and(
        eq(messageRequests.id, requestId),
        eq(messageRequests.recipientId, userId),
        eq(messageRequests.status, "pending")
      ))
      .limit(1);

    if (!request) {
      return { success: false, message: "Message request not found" };
    }

    // Update request status
    const [updated] = await db.update(messageRequests)
      .set({ 
        status: "declined",
        respondedAt: new Date()
      })
      .where(eq(messageRequests.id, requestId))
      .returning();

    return { success: true, message: "Message request declined", request: updated };
  }

  // Delete a message request (and associated messages)
  async deleteRequest(requestId: number, userId: number): Promise<{ success: boolean; message: string }> {
    // Verify the request belongs to this user
    const [request] = await db.select()
      .from(messageRequests)
      .where(and(
        eq(messageRequests.id, requestId),
        eq(messageRequests.recipientId, userId)
      ))
      .limit(1);

    if (!request) {
      return { success: false, message: "Message request not found" };
    }

    // Delete the request
    await db.delete(messageRequests).where(eq(messageRequests.id, requestId));

    return { success: true, message: "Message request deleted" };
  }

  // Check if there's a pending request between two users
  async hasPendingRequest(senderId: number, recipientId: number): Promise<boolean> {
    const [request] = await db.select()
      .from(messageRequests)
      .where(and(
        eq(messageRequests.senderId, senderId),
        eq(messageRequests.recipientId, recipientId),
        eq(messageRequests.status, "pending")
      ))
      .limit(1);

    return !!request;
  }

  // Get request status between two users
  async getRequestStatus(
    senderId: number, 
    recipientId: number
  ): Promise<"none" | "pending" | "accepted" | "declined"> {
    const [request] = await db.select({ status: messageRequests.status })
      .from(messageRequests)
      .where(and(
        eq(messageRequests.senderId, senderId),
        eq(messageRequests.recipientId, recipientId)
      ))
      .orderBy(desc(messageRequests.createdAt))
      .limit(1);

    if (!request) return "none";
    return (request.status as "pending" | "accepted" | "declined") || "none";
  }

  // Get message request count
  async getRequestCount(userId: number): Promise<number> {
    const requests = await db.select({ id: messageRequests.id })
      .from(messageRequests)
      .where(and(
        eq(messageRequests.recipientId, userId),
        eq(messageRequests.status, "pending")
      ));

    return requests.length;
  }

  // Check if user is following another user
  private async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const [relationship] = await db.select()
      .from(userRelationships)
      .where(and(
        eq(userRelationships.userId, followerId),
        eq(userRelationships.targetUserId, followingId),
        eq(userRelationships.relationshipType, "following")
      ))
      .limit(1);

    return !!relationship;
  }

  // Check if user is blocked
  private async isBlocked(userId: number, targetId: number): Promise<boolean> {
    const [blocked] = await db.select()
      .from(userRelationships)
      .where(and(
        or(
          and(eq(userRelationships.userId, userId), eq(userRelationships.targetUserId, targetId)),
          and(eq(userRelationships.userId, targetId), eq(userRelationships.targetUserId, userId))
        ),
        eq(userRelationships.relationshipType, "blocked")
      ))
      .limit(1);

    return !!blocked;
  }

  // Get or create conversation
  private async getOrCreateConversation(user1Id: number, user2Id: number): Promise<number> {
    const [existing] = await db.select()
      .from(conversations)
      .where(
        or(
          and(eq(conversations.user1Id, user1Id), eq(conversations.user2Id, user2Id)),
          and(eq(conversations.user1Id, user2Id), eq(conversations.user2Id, user1Id))
        )
      )
      .limit(1);

    if (existing) {
      return existing.id;
    }

    const [newConversation] = await db.insert(conversations)
      .values({
        user1Id,
        user2Id
      })
      .returning();

    return newConversation.id;
  }

  // Create notification for message request
  private async createMessageRequestNotification(senderId: number, recipientId: number): Promise<void> {
    const [sender] = await db.select({ username: users.username, profileImage: users.profileImage })
      .from(users)
      .where(eq(users.id, senderId))
      .limit(1);

    await db.insert(notifications).values({
      userId: recipientId,
      fromUserId: senderId,
      type: "message_request",
      title: "Message Request",
      message: `${sender?.username || 'Someone'} wants to send you a message`,
      entityType: "user",
      entityId: senderId,
      imageUrl: sender?.profileImage,
      actionUrl: "/messages/requests"
    });
  }

  // Create notification for regular message
  private async createMessageNotification(senderId: number, recipientId: number): Promise<void> {
    const [sender] = await db.select({ username: users.username, profileImage: users.profileImage })
      .from(users)
      .where(eq(users.id, senderId))
      .limit(1);

    await db.insert(notifications).values({
      userId: recipientId,
      fromUserId: senderId,
      type: "message",
      title: "New Message",
      message: `${sender?.username || 'Someone'} sent you a message`,
      entityType: "user",
      entityId: senderId,
      imageUrl: sender?.profileImage,
      actionUrl: "/messages"
    });
  }

  // Create notification for accepted request
  private async createRequestAcceptedNotification(accepterId: number, senderId: number): Promise<void> {
    const [accepter] = await db.select({ username: users.username, profileImage: users.profileImage })
      .from(users)
      .where(eq(users.id, accepterId))
      .limit(1);

    await db.insert(notifications).values({
      userId: senderId,
      fromUserId: accepterId,
      type: "message_request_accepted",
      title: "Message Request Accepted",
      message: `${accepter?.username || 'Someone'} accepted your message request`,
      entityType: "user",
      entityId: accepterId,
      imageUrl: accepter?.profileImage,
      actionUrl: "/messages"
    });
  }

  // Bulk accept all requests from a user
  async acceptAllFromUser(recipientId: number, senderId: number): Promise<{ success: boolean; count: number }> {
    const requests = await db.select()
      .from(messageRequests)
      .where(and(
        eq(messageRequests.recipientId, recipientId),
        eq(messageRequests.senderId, senderId),
        eq(messageRequests.status, "pending")
      ));

    for (const request of requests) {
      await this.acceptRequest(request.id, recipientId);
    }

    return { success: true, count: requests.length };
  }

  // Check if conversation is in request state
  async isConversationInRequestState(userId: number, otherUserId: number): Promise<boolean> {
    // Check if there's a pending request in either direction
    const hasPendingFromOther = await this.hasPendingRequest(otherUserId, userId);
    const hasPendingToOther = await this.hasPendingRequest(userId, otherUserId);
    
    return hasPendingFromOther || hasPendingToOther;
  }
}

// Export singleton instance
export const messageRequestService = new MessageRequestService();
