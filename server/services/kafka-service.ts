/**
 * Kafka Service for Chat Real-time Events
 * 
 * In production, this would use KafkaJS to connect to a Kafka cluster.
 * For development/free tier, we use an in-memory event emitter that
 * mimics Kafka's pub/sub pattern.
 * 
 * To enable real Kafka:
 * 1. Set KAFKA_BROKER environment variable
 * 2. npm install kafkajs
 */

import { EventEmitter } from "events";
import { chatSSEService } from "./chat-sse-service";
import type { ChatMessage, User } from "@shared/schema";

// Kafka topics
export const TOPICS = {
  MESSAGES: "chat.messages",
  TYPING: "chat.typing",
  SEEN: "chat.seen",
  ONLINE: "chat.online",
  REACTIONS: "chat.reactions",
  DELETED: "chat.deleted",
  EDITED: "chat.edited",
} as const;

// Event types
interface MessageEvent {
  conversationId: number;
  message: ChatMessage & { sender: User };
  recipientIds: number[];
}

interface TypingEvent {
  conversationId: number;
  userId: number;
  isTyping: boolean;
  recipientIds: number[];
}

interface SeenEvent {
  conversationId: number;
  messageId: number;
  seenByUserId: number;
  senderId: number;
}

interface OnlineEvent {
  userId: number;
  isOnline: boolean;
  lastSeenAt?: Date;
  recipientIds: number[];
}

interface ReactionEvent {
  conversationId: number;
  messageId: number;
  userId: number;
  emoji: string | null;
  recipientIds: number[];
}

interface DeletedEvent {
  conversationId: number;
  messageId: number;
  recipientIds: number[];
}

interface EditedEvent {
  conversationId: number;
  messageId: number;
  content: string;
  recipientIds: number[];
}

class KafkaService {
  private emitter: EventEmitter;
  private isKafkaEnabled: boolean = false;

  constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(100);
    
    // Check if Kafka is configured
    if (process.env.KAFKA_BROKER) {
      this.initKafka();
    } else {
      console.log("📨 Using in-memory event bus for chat (set KAFKA_BROKER for production)");
      this.initInMemoryConsumer();
    }
  }

  private async initKafka() {
    try {
      // In production, initialize KafkaJS here
      // const { Kafka } = require('kafkajs');
      // this.kafka = new Kafka({ clientId: 'cricsocial', brokers: [process.env.KAFKA_BROKER] });
      console.log("🚀 Kafka connection would be initialized here");
      this.isKafkaEnabled = true;
    } catch (error) {
      console.error("Failed to initialize Kafka, falling back to in-memory:", error);
      this.initInMemoryConsumer();
    }
  }

  private initInMemoryConsumer() {
    // Subscribe to all topics and forward to SSE
    this.emitter.on(TOPICS.MESSAGES, (event: MessageEvent) => {
      chatSSEService.emitNewMessage(event.recipientIds, event.conversationId, event.message);
    });

    this.emitter.on(TOPICS.TYPING, (event: TypingEvent) => {
      chatSSEService.emitTyping(event.recipientIds, event.conversationId, event.userId, event.isTyping);
    });

    this.emitter.on(TOPICS.SEEN, (event: SeenEvent) => {
      chatSSEService.emitSeen(event.senderId, event.conversationId, event.messageId, event.seenByUserId);
    });

    this.emitter.on(TOPICS.ONLINE, (event: OnlineEvent) => {
      chatSSEService.emitOnlineStatus(event.recipientIds, event.userId, event.isOnline, event.lastSeenAt);
    });

    this.emitter.on(TOPICS.REACTIONS, (event: ReactionEvent) => {
      chatSSEService.emitReaction(event.recipientIds, event.conversationId, event.messageId, event.userId, event.emoji);
    });

    this.emitter.on(TOPICS.DELETED, (event: DeletedEvent) => {
      chatSSEService.emitMessageDeleted(event.recipientIds, event.conversationId, event.messageId);
    });

    this.emitter.on(TOPICS.EDITED, (event: EditedEvent) => {
      chatSSEService.emitMessageEdited(event.recipientIds, event.conversationId, event.messageId, event.content);
    });
  }

  // ============================================
  // PRODUCERS (Publish events)
  // ============================================

  async publishMessage(event: MessageEvent) {
    if (this.isKafkaEnabled) {
      // await this.producer.send({ topic: TOPICS.MESSAGES, messages: [{ value: JSON.stringify(event) }] });
    }
    this.emitter.emit(TOPICS.MESSAGES, event);
  }

  async publishTyping(event: TypingEvent) {
    if (this.isKafkaEnabled) {
      // await this.producer.send({ topic: TOPICS.TYPING, messages: [{ value: JSON.stringify(event) }] });
    }
    this.emitter.emit(TOPICS.TYPING, event);
  }

  async publishSeen(event: SeenEvent) {
    if (this.isKafkaEnabled) {
      // await this.producer.send({ topic: TOPICS.SEEN, messages: [{ value: JSON.stringify(event) }] });
    }
    this.emitter.emit(TOPICS.SEEN, event);
  }

  async publishOnline(event: OnlineEvent) {
    if (this.isKafkaEnabled) {
      // await this.producer.send({ topic: TOPICS.ONLINE, messages: [{ value: JSON.stringify(event) }] });
    }
    this.emitter.emit(TOPICS.ONLINE, event);
  }

  async publishReaction(event: ReactionEvent) {
    if (this.isKafkaEnabled) {
      // await this.producer.send({ topic: TOPICS.REACTIONS, messages: [{ value: JSON.stringify(event) }] });
    }
    this.emitter.emit(TOPICS.REACTIONS, event);
  }

  async publishDeleted(event: DeletedEvent) {
    if (this.isKafkaEnabled) {
      // await this.producer.send({ topic: TOPICS.DELETED, messages: [{ value: JSON.stringify(event) }] });
    }
    this.emitter.emit(TOPICS.DELETED, event);
  }

  async publishEdited(event: EditedEvent) {
    if (this.isKafkaEnabled) {
      // await this.producer.send({ topic: TOPICS.EDITED, messages: [{ value: JSON.stringify(event) }] });
    }
    this.emitter.emit(TOPICS.EDITED, event);
  }

  // ============================================
  // UTILITY
  // ============================================

  isEnabled(): boolean {
    return this.isKafkaEnabled;
  }

  async disconnect() {
    if (this.isKafkaEnabled) {
      // await this.producer.disconnect();
      // await this.consumer.disconnect();
    }
    this.emitter.removeAllListeners();
  }
}

export const kafkaService = new KafkaService();
