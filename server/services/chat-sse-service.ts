import { Response } from "express";
import type { ChatMessage, User } from "@shared/schema";

interface SSEClient {
  id: string;
  userId: number;
  response: Response;
  lastPing: number;
}

interface ChatEvent {
  type: "message" | "typing" | "seen" | "online" | "reaction" | "deleted" | "edited";
  data: any;
}

class ChatSSEService {
  private clients: Map<number, SSEClient[]> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start heartbeat to keep connections alive and clean up stale ones
    this.startHeartbeat();
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const staleThreshold = 60000; // 60 seconds

      this.clients.forEach((clients, userId) => {
        const activeClients = clients.filter(client => {
          if (now - client.lastPing > staleThreshold) {
            try {
              client.response.end();
            } catch (e) {
              // Client already disconnected
            }
            return false;
          }
          
          // Send heartbeat
          try {
            client.response.write(`:heartbeat\n\n`);
          } catch (e) {
            return false;
          }
          return true;
        });

        if (activeClients.length === 0) {
          this.clients.delete(userId);
        } else {
          this.clients.set(userId, activeClients);
        }
      });
    }, 30000); // Every 30 seconds
  }

  addClient(userId: number, response: Response): string {
    const clientId = `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const client: SSEClient = {
      id: clientId,
      userId,
      response,
      lastPing: Date.now(),
    };

    const userClients = this.clients.get(userId) || [];
    userClients.push(client);
    this.clients.set(userId, userClients);

    // Set up SSE headers
    response.setHeader("Content-Type", "text/event-stream");
    response.setHeader("Cache-Control", "no-cache");
    response.setHeader("Connection", "keep-alive");
    response.setHeader("X-Accel-Buffering", "no"); // For nginx
    response.flushHeaders();

    // Send initial connection event
    this.sendToClient(client, {
      type: "connected" as any,
      data: { clientId, timestamp: new Date().toISOString() },
    });

    console.log(`SSE client connected: ${clientId} for user ${userId}`);
    return clientId;
  }

  removeClient(userId: number, clientId: string) {
    const userClients = this.clients.get(userId);
    if (!userClients) return;

    const filtered = userClients.filter(c => c.id !== clientId);
    if (filtered.length === 0) {
      this.clients.delete(userId);
    } else {
      this.clients.set(userId, filtered);
    }

    console.log(`SSE client disconnected: ${clientId} for user ${userId}`);
  }

  private sendToClient(client: SSEClient, event: ChatEvent) {
    try {
      const eventString = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
      client.response.write(eventString);
      client.lastPing = Date.now();
    } catch (e) {
      console.error(`Failed to send to client ${client.id}:`, e);
    }
  }

  sendToUser(userId: number, event: ChatEvent) {
    const userClients = this.clients.get(userId);
    if (!userClients) return;

    userClients.forEach(client => {
      this.sendToClient(client, event);
    });
  }

  sendToUsers(userIds: number[], event: ChatEvent) {
    userIds.forEach(userId => {
      this.sendToUser(userId, event);
    });
  }

  // ============================================
  // EVENT EMITTERS
  // ============================================

  emitNewMessage(
    recipientIds: number[],
    conversationId: number,
    message: ChatMessage & { sender: User }
  ) {
    this.sendToUsers(recipientIds, {
      type: "message",
      data: {
        conversationId,
        message: {
          id: message.id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          type: message.type,
          content: message.content,
          mediaUrl: message.mediaUrl,
          replyToId: message.replyToId,
          createdAt: message.createdAt,
          sender: {
            id: message.sender.id,
            username: message.sender.username,
            fullName: message.sender.fullName,
            profileImage: message.sender.profileImage,
          },
        },
      },
    });
  }

  emitTyping(recipientIds: number[], conversationId: number, userId: number, isTyping: boolean) {
    this.sendToUsers(recipientIds, {
      type: "typing",
      data: {
        conversationId,
        userId,
        isTyping,
      },
    });
  }

  emitSeen(senderId: number, conversationId: number, messageId: number, seenByUserId: number) {
    this.sendToUser(senderId, {
      type: "seen",
      data: {
        conversationId,
        messageId,
        seenByUserId,
        seenAt: new Date().toISOString(),
      },
    });
  }

  emitOnlineStatus(recipientIds: number[], userId: number, isOnline: boolean, lastSeenAt?: Date) {
    this.sendToUsers(recipientIds, {
      type: "online",
      data: {
        userId,
        isOnline,
        lastSeenAt: lastSeenAt?.toISOString(),
      },
    });
  }

  emitReaction(
    recipientIds: number[],
    conversationId: number,
    messageId: number,
    userId: number,
    emoji: string | null
  ) {
    this.sendToUsers(recipientIds, {
      type: "reaction",
      data: {
        conversationId,
        messageId,
        userId,
        emoji,
      },
    });
  }

  emitMessageDeleted(recipientIds: number[], conversationId: number, messageId: number) {
    this.sendToUsers(recipientIds, {
      type: "deleted",
      data: {
        conversationId,
        messageId,
      },
    });
  }

  emitMessageEdited(
    recipientIds: number[],
    conversationId: number,
    messageId: number,
    newContent: string
  ) {
    this.sendToUsers(recipientIds, {
      type: "edited",
      data: {
        conversationId,
        messageId,
        content: newContent,
        editedAt: new Date().toISOString(),
      },
    });
  }

  // ============================================
  // UTILITY
  // ============================================

  isUserOnline(userId: number): boolean {
    const clients = this.clients.get(userId);
    return clients !== undefined && clients.length > 0;
  }

  getOnlineUsers(): number[] {
    return Array.from(this.clients.keys());
  }

  getClientCount(): number {
    let count = 0;
    this.clients.forEach(clients => {
      count += clients.length;
    });
    return count;
  }

  cleanup() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.clients.forEach((clients) => {
      clients.forEach(client => {
        try {
          client.response.end();
        } catch (e) {
          // Ignore
        }
      });
    });
    this.clients.clear();
  }
}

export const chatSSEService = new ChatSSEService();
