import { Express, Request, Response } from "express";
import { chatService } from "../services/chat-service";
import { chatSSEService } from "../services/chat-sse-service";
import { kafkaService } from "../services/kafka-service";
import { storage } from "../storage";

export function registerChatRoutes(app: Express) {
  // ============================================
  // SSE STREAM ENDPOINT
  // ============================================

  app.get("/api/chat/stream", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user!.id;

    // Set up SSE connection
    const clientId = chatSSEService.addClient(userId, res);

    // Update online status
    await chatService.setOnlineStatus(userId, true);

    // Notify followers about online status via Kafka
    const followers = await storage.getFollowers(userId);
    const followerIds = followers.map((f: any) => f.id || f.followerId);
    await kafkaService.publishOnline({
      userId,
      isOnline: true,
      recipientIds: followerIds,
    });

    // Handle client disconnect
    req.on("close", async () => {
      chatSSEService.removeClient(userId, clientId);
      
      // Check if user has other active connections
      if (!chatSSEService.isUserOnline(userId)) {
        await chatService.setOnlineStatus(userId, false);
        await kafkaService.publishOnline({
          userId,
          isOnline: false,
          lastSeenAt: new Date(),
          recipientIds: followerIds,
        });
      }
    });
  });

  // ============================================
  // CONVERSATIONS
  // ============================================

  // Get all conversations
  app.get("/api/chat/conversations", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const conversations = await chatService.getConversations(req.user!.id);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Create DM conversation
  app.post("/api/chat/conversations/dm", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { recipientId } = req.body;
      if (!recipientId) {
        return res.status(400).json({ message: "recipientId is required" });
      }

      // Check if recipient exists
      const recipient = await storage.getUser(recipientId);
      if (!recipient) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if blocked
      const isBlocked = await storage.isBlocked(req.user!.id, recipientId);
      if (isBlocked) {
        return res.status(403).json({ message: "Cannot message this user" });
      }

      const conversation = await chatService.createDMConversation(req.user!.id, recipientId);
      const details = await chatService.getConversation(conversation.id, req.user!.id);
      
      res.status(201).json(details);
    } catch (error) {
      console.error("Error creating DM:", error);
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  // Create group conversation
  app.post("/api/chat/conversations/group", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { name, memberIds, avatarUrl } = req.body;
      if (!name || !memberIds || !Array.isArray(memberIds) || memberIds.length < 1) {
        return res.status(400).json({ message: "name and memberIds are required" });
      }

      const conversation = await chatService.createGroupConversation(
        req.user!.id,
        name,
        memberIds,
        avatarUrl
      );

      const details = await chatService.getConversation(conversation.id, req.user!.id);
      res.status(201).json(details);
    } catch (error) {
      console.error("Error creating group:", error);
      res.status(500).json({ message: "Failed to create group" });
    }
  });

  // Get single conversation
  app.get("/api/chat/conversations/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const conversationId = parseInt(req.params.id);
      const conversation = await chatService.getConversation(conversationId, req.user!.id);
      
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      res.json(conversation);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  // Update conversation (group settings)
  app.patch("/api/chat/conversations/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const conversationId = parseInt(req.params.id);
      const { name, avatarUrl, isMuted, isArchived, isPinned } = req.body;

      // Update member settings
      if (isMuted !== undefined || isArchived !== undefined || isPinned !== undefined) {
        await chatService.updateMemberSettings(conversationId, req.user!.id, {
          isMuted,
          isArchived,
          isPinned,
        });
      }

      // Update group settings (admin only)
      if (name !== undefined || avatarUrl !== undefined) {
        await chatService.updateConversation(conversationId, req.user!.id, { name, avatarUrl });
      }

      const updated = await chatService.getConversation(conversationId, req.user!.id);
      res.json(updated);
    } catch (error) {
      console.error("Error updating conversation:", error);
      res.status(500).json({ message: "Failed to update conversation" });
    }
  });

  // Delete/leave conversation
  app.delete("/api/chat/conversations/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const conversationId = parseInt(req.params.id);
      const success = await chatService.deleteConversation(conversationId, req.user!.id);
      
      if (!success) {
        return res.status(403).json({ message: "Cannot delete this conversation" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ message: "Failed to delete conversation" });
    }
  });

  // ============================================
  // MEMBERS (Groups)
  // ============================================

  // Add members to group
  app.post("/api/chat/conversations/:id/members", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const conversationId = parseInt(req.params.id);
      const { memberIds } = req.body;

      if (!memberIds || !Array.isArray(memberIds)) {
        return res.status(400).json({ message: "memberIds array is required" });
      }

      const success = await chatService.addMembers(conversationId, req.user!.id, memberIds);
      if (!success) {
        return res.status(403).json({ message: "Cannot add members" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error adding members:", error);
      res.status(500).json({ message: "Failed to add members" });
    }
  });

  // Remove member from group
  app.delete("/api/chat/conversations/:id/members/:userId", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const conversationId = parseInt(req.params.id);
      const memberId = parseInt(req.params.userId);

      const success = await chatService.removeMember(conversationId, req.user!.id, memberId);
      if (!success) {
        return res.status(403).json({ message: "Cannot remove member" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error removing member:", error);
      res.status(500).json({ message: "Failed to remove member" });
    }
  });

  // Leave group
  app.post("/api/chat/conversations/:id/leave", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const conversationId = parseInt(req.params.id);
      const success = await chatService.leaveConversation(conversationId, req.user!.id);
      
      if (!success) {
        return res.status(403).json({ message: "Cannot leave this conversation" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error leaving conversation:", error);
      res.status(500).json({ message: "Failed to leave conversation" });
    }
  });

  // ============================================
  // MESSAGES
  // ============================================

  // Get messages
  app.get("/api/chat/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const conversationId = parseInt(req.params.id);
      const cursor = req.query.cursor ? parseInt(req.query.cursor as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

      const messages = await chatService.getMessages(conversationId, req.user!.id, cursor, limit);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Send message
  app.post("/api/chat/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const conversationId = parseInt(req.params.id);
      const { type, content, mediaUrl, replyToId, sharedPostId } = req.body;

      if (!content && !mediaUrl && !sharedPostId) {
        return res.status(400).json({ message: "Message content is required" });
      }

      const message = await chatService.sendMessage(conversationId, req.user!.id, {
        type,
        content,
        mediaUrl,
        replyToId,
        sharedPostId,
      });

      if (!message) {
        return res.status(403).json({ message: "Cannot send message" });
      }

      // Emit to other members via Kafka → SSE
      const members = await storage.getConversationMembers(conversationId);
      const recipientIds = members
        .filter(m => m.userId !== req.user!.id && m.isActive)
        .map(m => m.userId);

      await kafkaService.publishMessage({
        conversationId,
        message: message as any,
        recipientIds,
      });

      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Edit message
  app.patch("/api/chat/messages/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const messageId = parseInt(req.params.id);
      const { content } = req.body;

      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }

      const message = await chatService.editMessage(messageId, req.user!.id, content);
      if (!message) {
        return res.status(403).json({ message: "Cannot edit message" });
      }

      // Emit edit event via Kafka
      const members = await storage.getConversationMembers(message.conversationId);
      const recipientIds = members
        .filter(m => m.userId !== req.user!.id && m.isActive)
        .map(m => m.userId);

      await kafkaService.publishEdited({
        conversationId: message.conversationId,
        messageId,
        content,
        recipientIds,
      });

      res.json(message);
    } catch (error) {
      console.error("Error editing message:", error);
      res.status(500).json({ message: "Failed to edit message" });
    }
  });

  // Delete message
  app.delete("/api/chat/messages/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const messageId = parseInt(req.params.id);
      const forEveryone = req.query.forEveryone === "true";

      const message = await storage.getChatMessage(messageId);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }

      const success = await chatService.deleteMessage(messageId, req.user!.id, forEveryone);
      if (!success) {
        return res.status(403).json({ message: "Cannot delete message" });
      }

      if (forEveryone) {
        const members = await storage.getConversationMembers(message.conversationId);
        const recipientIds = members
          .filter(m => m.userId !== req.user!.id && m.isActive)
          .map(m => m.userId);

        await kafkaService.publishDeleted({
          conversationId: message.conversationId,
          messageId,
          recipientIds,
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({ message: "Failed to delete message" });
    }
  });

  // ============================================
  // REACTIONS
  // ============================================

  // Add reaction
  app.post("/api/chat/messages/:id/react", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const messageId = parseInt(req.params.id);
      const { emoji } = req.body;

      if (!emoji) {
        return res.status(400).json({ message: "Emoji is required" });
      }

      const reaction = await chatService.addReaction(messageId, req.user!.id, emoji);
      if (!reaction) {
        return res.status(403).json({ message: "Cannot react to message" });
      }

      // Emit reaction event via Kafka
      const message = await storage.getChatMessage(messageId);
      if (message) {
        const members = await storage.getConversationMembers(message.conversationId);
        const recipientIds = members
          .filter(m => m.userId !== req.user!.id && m.isActive)
          .map(m => m.userId);

        await kafkaService.publishReaction({
          conversationId: message.conversationId,
          messageId,
          userId: req.user!.id,
          emoji,
          recipientIds,
        });
      }

      res.json(reaction);
    } catch (error) {
      console.error("Error adding reaction:", error);
      res.status(500).json({ message: "Failed to add reaction" });
    }
  });

  // Remove reaction
  app.delete("/api/chat/messages/:id/react", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const messageId = parseInt(req.params.id);
      const success = await chatService.removeReaction(messageId, req.user!.id);

      if (success) {
        const message = await storage.getChatMessage(messageId);
        if (message) {
          const members = await storage.getConversationMembers(message.conversationId);
          const recipientIds = members
            .filter(m => m.userId !== req.user!.id && m.isActive)
            .map(m => m.userId);

          await kafkaService.publishReaction({
            conversationId: message.conversationId,
            messageId,
            userId: req.user!.id,
            emoji: null,
            recipientIds,
          });
        }
      }

      res.json({ success });
    } catch (error) {
      console.error("Error removing reaction:", error);
      res.status(500).json({ message: "Failed to remove reaction" });
    }
  });

  // ============================================
  // TYPING & STATUS
  // ============================================

  // Send typing indicator
  app.post("/api/chat/conversations/:id/typing", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const conversationId = parseInt(req.params.id);
      const { isTyping } = req.body;

      await chatService.setTyping(conversationId, req.user!.id, isTyping !== false);

      // Emit typing event via Kafka
      const members = await storage.getConversationMembers(conversationId);
      const recipientIds = members
        .filter(m => m.userId !== req.user!.id && m.isActive)
        .map(m => m.userId);

      await kafkaService.publishTyping({
        conversationId,
        userId: req.user!.id,
        isTyping: isTyping !== false,
        recipientIds,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error setting typing:", error);
      res.status(500).json({ message: "Failed to set typing" });
    }
  });

  // Mark messages as seen
  app.post("/api/chat/conversations/:id/seen", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const conversationId = parseInt(req.params.id);
      const { messageId } = req.body;

      if (!messageId) {
        return res.status(400).json({ message: "messageId is required" });
      }

      await chatService.markAsSeen(conversationId, req.user!.id, messageId);

      // Emit seen event via Kafka to message sender
      const message = await storage.getChatMessage(messageId);
      if (message && message.senderId !== req.user!.id) {
        await kafkaService.publishSeen({
          conversationId,
          messageId,
          seenByUserId: req.user!.id,
          senderId: message.senderId,
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error marking as seen:", error);
      res.status(500).json({ message: "Failed to mark as seen" });
    }
  });

  // Get user online status
  app.get("/api/chat/users/:id/online", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = parseInt(req.params.id);
      const status = await chatService.getOnlineStatus(userId);
      
      // Also check SSE connections
      const isConnected = chatSSEService.isUserOnline(userId);
      
      res.json({
        ...status,
        isOnline: status.isOnline || isConnected,
      });
    } catch (error) {
      console.error("Error getting online status:", error);
      res.status(500).json({ message: "Failed to get online status" });
    }
  });

  // ============================================
  // MESSAGE REQUESTS
  // ============================================

  // Get pending requests
  app.get("/api/chat/requests", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const requests = await chatService.getMessageRequests(req.user!.id);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching requests:", error);
      res.status(500).json({ message: "Failed to fetch requests" });
    }
  });

  // Accept/decline request
  app.post("/api/chat/requests/:id/respond", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const requestId = parseInt(req.params.id);
      const { accept } = req.body;

      const conversation = await chatService.respondToRequest(requestId, req.user!.id, accept === true);
      
      res.json({ 
        success: true, 
        conversation: conversation || null,
      });
    } catch (error) {
      console.error("Error responding to request:", error);
      res.status(500).json({ message: "Failed to respond to request" });
    }
  });

  console.log("✅ Chat routes registered");
}
