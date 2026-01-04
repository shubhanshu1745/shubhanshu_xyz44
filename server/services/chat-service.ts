import { storage } from "../storage";
import type { 
  ChatConversation, 
  ChatMessage, 
  ChatMember, 
  ChatMessageReaction,
  ChatRequest,
  User 
} from "@shared/schema";

export interface ConversationWithDetails extends ChatConversation {
  members: (ChatMember & { user: User })[];
  lastMessage?: ChatMessage & { sender: User };
  unreadCount: number;
}

export interface MessageWithDetails extends ChatMessage {
  sender: User;
  replyTo?: ChatMessage & { sender: User };
  reactions: (ChatMessageReaction & { user: User })[];
  status: { delivered: number; seen: number };
}

class ChatService {
  // ============================================
  // CONVERSATION MANAGEMENT
  // ============================================

  async createDMConversation(userId1: number, userId2: number): Promise<ChatConversation> {
    // Check if DM already exists between these users
    const existing = await storage.findDMConversation(userId1, userId2);
    if (existing) {
      return existing;
    }

    // Create new DM conversation
    const conversation = await storage.createChatConversation({
      type: "dm",
      createdBy: userId1,
    });

    // Add both users as members
    await storage.addChatMember({
      conversationId: conversation.id,
      userId: userId1,
      role: "member",
    });

    await storage.addChatMember({
      conversationId: conversation.id,
      userId: userId2,
      role: "member",
    });

    return conversation;
  }

  async createGroupConversation(
    creatorId: number,
    name: string,
    memberIds: number[],
    avatarUrl?: string
  ): Promise<ChatConversation> {
    const conversation = await storage.createChatConversation({
      type: "group",
      name,
      avatarUrl,
      createdBy: creatorId,
    });

    // Add creator as admin
    await storage.addChatMember({
      conversationId: conversation.id,
      userId: creatorId,
      role: "admin",
    });

    // Add other members
    for (const memberId of memberIds) {
      if (memberId !== creatorId) {
        await storage.addChatMember({
          conversationId: conversation.id,
          userId: memberId,
          role: "member",
        });
      }
    }

    return conversation;
  }

  async getConversations(userId: number): Promise<ConversationWithDetails[]> {
    return storage.getUserConversations(userId);
  }

  async getConversation(conversationId: number, userId: number): Promise<ConversationWithDetails | null> {
    const conversation = await storage.getChatConversation(conversationId);
    if (!conversation) return null;

    // Check if user is a member
    const isMember = await storage.isConversationMember(conversationId, userId);
    if (!isMember) return null;

    return storage.getConversationWithDetails(conversationId, userId);
  }

  async updateConversation(
    conversationId: number,
    userId: number,
    updates: { name?: string; avatarUrl?: string }
  ): Promise<ChatConversation | null> {
    const conversation = await storage.getChatConversation(conversationId);
    if (!conversation || conversation.type !== "group") return null;

    // Check if user is admin
    const member = await storage.getChatMember(conversationId, userId);
    if (!member || member.role !== "admin") return null;

    return storage.updateChatConversation(conversationId, updates);
  }

  async deleteConversation(conversationId: number, userId: number): Promise<boolean> {
    const conversation = await storage.getChatConversation(conversationId);
    if (!conversation) return false;

    if (conversation.type === "dm") {
      // For DM, just archive for this user
      await storage.updateChatMember(conversationId, userId, { isArchived: true });
      return true;
    }

    // For groups, check if admin
    const member = await storage.getChatMember(conversationId, userId);
    if (!member || member.role !== "admin") return false;

    return storage.deleteChatConversation(conversationId);
  }

  // ============================================
  // MEMBER MANAGEMENT
  // ============================================

  async addMembers(conversationId: number, adminId: number, memberIds: number[]): Promise<boolean> {
    const conversation = await storage.getChatConversation(conversationId);
    if (!conversation || conversation.type !== "group") return false;

    const admin = await storage.getChatMember(conversationId, adminId);
    if (!admin || admin.role !== "admin") return false;

    for (const memberId of memberIds) {
      await storage.addChatMember({
        conversationId,
        userId: memberId,
        role: "member",
      });
    }

    return true;
  }

  async removeMember(conversationId: number, adminId: number, memberId: number): Promise<boolean> {
    const conversation = await storage.getChatConversation(conversationId);
    if (!conversation || conversation.type !== "group") return false;

    const admin = await storage.getChatMember(conversationId, adminId);
    if (!admin || admin.role !== "admin") return false;

    // Can't remove yourself as admin
    if (adminId === memberId) return false;

    return storage.removeChatMember(conversationId, memberId);
  }

  async leaveConversation(conversationId: number, userId: number): Promise<boolean> {
    const conversation = await storage.getChatConversation(conversationId);
    if (!conversation || conversation.type !== "group") return false;

    const member = await storage.getChatMember(conversationId, userId);
    if (!member) return false;

    // If admin leaving, transfer to another member
    if (member.role === "admin") {
      const members = await storage.getConversationMembers(conversationId);
      const otherMember = members.find(m => m.userId !== userId && m.isActive);
      if (otherMember) {
        await storage.updateChatMember(conversationId, otherMember.userId, { role: "admin" });
      }
    }

    return storage.removeChatMember(conversationId, userId);
  }

  async updateMemberSettings(
    conversationId: number,
    userId: number,
    settings: { isMuted?: boolean; isArchived?: boolean; isPinned?: boolean }
  ): Promise<boolean> {
    return storage.updateChatMember(conversationId, userId, settings);
  }

  // ============================================
  // MESSAGE MANAGEMENT
  // ============================================

  async sendMessage(
    conversationId: number,
    senderId: number,
    message: {
      type?: string;
      content?: string;
      mediaUrl?: string;
      replyToId?: number;
      sharedPostId?: number;
    }
  ): Promise<MessageWithDetails | null> {
    // Verify sender is a member
    const isMember = await storage.isConversationMember(conversationId, senderId);
    if (!isMember) return null;

    const newMessage = await storage.createChatMessage({
      conversationId,
      senderId,
      type: message.type || "text",
      content: message.content,
      mediaUrl: message.mediaUrl,
      replyToId: message.replyToId,
      sharedPostId: message.sharedPostId,
    });

    // Update conversation last message
    await storage.updateChatConversation(conversationId, {
      lastMessageAt: new Date(),
      lastMessagePreview: message.content?.substring(0, 100) || `[${message.type || "message"}]`,
    });

    // Create delivery status for all other members
    const members = await storage.getConversationMembers(conversationId);
    for (const member of members) {
      if (member.userId !== senderId && member.isActive) {
        await storage.createMessageStatus({
          messageId: newMessage.id,
          userId: member.userId,
          status: "delivered",
        });
      }
    }

    return storage.getMessageWithDetails(newMessage.id);
  }

  async getMessages(
    conversationId: number,
    userId: number,
    cursor?: number,
    limit: number = 50
  ): Promise<MessageWithDetails[]> {
    const isMember = await storage.isConversationMember(conversationId, userId);
    if (!isMember) return [];

    return storage.getConversationMessages(conversationId, cursor, limit);
  }

  async editMessage(
    messageId: number,
    userId: number,
    newContent: string
  ): Promise<ChatMessage | null> {
    const message = await storage.getChatMessage(messageId);
    if (!message || message.senderId !== userId) return null;

    // Can only edit within 15 minutes
    const fifteenMinutes = 15 * 60 * 1000;
    if (Date.now() - new Date(message.createdAt!).getTime() > fifteenMinutes) {
      return null;
    }

    return storage.updateChatMessage(messageId, {
      content: newContent,
      isEdited: true,
      editedAt: new Date(),
    });
  }

  async deleteMessage(
    messageId: number,
    userId: number,
    forEveryone: boolean = false
  ): Promise<boolean> {
    const message = await storage.getChatMessage(messageId);
    if (!message) return false;

    if (forEveryone) {
      // Only sender can delete for everyone
      if (message.senderId !== userId) return false;
      return storage.updateChatMessage(messageId, {
        isDeleted: true,
        deletedAt: new Date(),
        content: null,
        mediaUrl: null,
      }) !== null;
    } else {
      // Delete for self only
      return storage.deleteMessageForUser(messageId, userId);
    }
  }

  async markAsSeen(conversationId: number, userId: number, messageId: number): Promise<boolean> {
    // Update all messages up to this one as seen
    return storage.markMessagesAsSeen(conversationId, userId, messageId);
  }

  // ============================================
  // REACTIONS
  // ============================================

  async addReaction(messageId: number, userId: number, emoji: string): Promise<ChatMessageReaction | null> {
    const message = await storage.getChatMessage(messageId);
    if (!message) return null;

    const isMember = await storage.isConversationMember(message.conversationId, userId);
    if (!isMember) return null;

    return storage.addMessageReaction({
      messageId,
      userId,
      emoji,
    });
  }

  async removeReaction(messageId: number, userId: number): Promise<boolean> {
    return storage.removeMessageReaction(messageId, userId);
  }

  // ============================================
  // TYPING INDICATORS
  // ============================================

  async setTyping(conversationId: number, userId: number, isTyping: boolean): Promise<boolean> {
    if (isTyping) {
      return storage.setTypingIndicator(conversationId, userId);
    } else {
      return storage.clearTypingIndicator(conversationId, userId);
    }
  }

  async getTypingUsers(conversationId: number): Promise<number[]> {
    return storage.getTypingUsers(conversationId);
  }

  // ============================================
  // ONLINE STATUS
  // ============================================

  async setOnlineStatus(userId: number, isOnline: boolean): Promise<boolean> {
    return storage.updateOnlineStatus(userId, isOnline);
  }

  async getOnlineStatus(userId: number): Promise<{ isOnline: boolean; lastSeenAt: Date | null }> {
    return storage.getOnlineStatus(userId);
  }

  // ============================================
  // MESSAGE REQUESTS
  // ============================================

  async createMessageRequest(senderId: number, recipientId: number, messagePreview: string): Promise<ChatRequest | null> {
    // Check if they already follow each other
    const isFollowing = await storage.isFollowing(senderId, recipientId);
    if (isFollowing) {
      // No request needed, create DM directly
      return null;
    }

    return storage.createChatRequest({
      senderId,
      recipientId,
      messagePreview,
      status: "pending",
    });
  }

  async getMessageRequests(userId: number): Promise<(ChatRequest & { sender: User })[]> {
    return storage.getPendingChatRequests(userId);
  }

  async respondToRequest(requestId: number, userId: number, accept: boolean): Promise<ChatConversation | null> {
    const request = await storage.getChatRequest(requestId);
    if (!request || request.recipientId !== userId) return null;

    if (accept) {
      // Create conversation
      const conversation = await this.createDMConversation(request.senderId, request.recipientId);
      
      // Update request
      await storage.updateChatRequest(requestId, {
        status: "accepted",
        conversationId: conversation.id,
        respondedAt: new Date(),
      });

      return conversation;
    } else {
      await storage.updateChatRequest(requestId, {
        status: "declined",
        respondedAt: new Date(),
      });
      return null;
    }
  }
}

export const chatService = new ChatService();
