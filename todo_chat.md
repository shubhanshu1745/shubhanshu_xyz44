# CricSocial Chat System - 2026 Architecture

## Overview
Instagram-level chat system using **Kafka + SSE** for real-time messaging with PostgreSQL for persistence.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Client → Server Realtime | SSE (Server-Sent Events) |
| Message Ingestion | REST API (POST) |
| Event Streaming | Apache Kafka / KafkaJS (with in-memory fallback) |
| Storage | PostgreSQL (Drizzle ORM) - **NO MemStorage** |
| Media | Local uploads / MinIO |
| Offline Sync | Cursor-based fetch |

---

## Architecture Flow

```
┌─────────┐    REST POST    ┌─────────┐    Publish    ┌─────────┐
│ Client  │ ──────────────► │ Server  │ ────────────► │  Kafka  │
└─────────┘                 └─────────┘               └─────────┘
     ▲                           │                         │
     │                           │ Save to DB              │ Consume
     │                           ▼                         ▼
     │                      ┌────────┐              ┌─────────┐
     │         SSE          │   DB   │              │ Consumer│
     └──────────────────────┤        │◄─────────────┤ Service │
                            └────────┘              └─────────┘
```

---

## Kafka Topics

| Topic | Purpose |
|-------|---------|
| `chat.messages` | New messages |
| `chat.typing` | Typing indicators |
| `chat.seen` | Read receipts |
| `chat.online` | Online status |
| `chat.reactions` | Message reactions |

---

## Features Checklist

### 🔐 Conversation Types
- [x] One-to-one DM chat
- [x] Group chat
- [x] Message requests (non-followers)
- [ ] Vanish / disappearing messages

### 💬 Messaging Features
- [x] Send text messages
- [x] Send emojis
- [ ] Send GIFs
- [ ] Send images
- [ ] Send videos
- [ ] Send voice notes
- [x] Reply to specific message
- [ ] Forward message
- [x] Delete for me
- [x] Unsend for everyone
- [x] Edit message (within 15 min)

### 👀 Message State Tracking
- [x] Sent status
- [x] Delivered status
- [x] Seen status
- [x] Typing indicator
- [x] Online / last seen
- [x] Message reactions

### 🔕 Chat Controls
- [x] Mute chat
- [x] Archive chat
- [x] Pin chat
- [ ] Clear chat
- [ ] Block user

### 👥 Group Chat Features
- [x] Create group
- [x] Add members
- [x] Remove members
- [x] Leave group
- [x] Assign admin
- [x] Change group name/photo

---

## Implementation Status

### Phase 1: Core ✅
- [x] Database schema (chat tables in schema.ts)
- [x] Chat service (chat-service.ts)
- [x] SSE service (chat-sse-service.ts)
- [x] Chat routes (routes/chat.ts)
- [x] Kafka integration (kafka-service.ts with fallback)

### Phase 2: Storage ✅
- [x] Chat storage methods in DatabaseStorage
- [x] PostgreSQL-only (no MemStorage fallback)
- [x] All CRUD operations for conversations, members, messages
- [x] Typing indicators
- [x] Online status
- [x] Message reactions
- [x] Chat requests

### Phase 3: Frontend ✅
- [x] Chat page (chat-page.tsx)
- [x] SSE hook (use-chat-stream.ts)
- [x] Chat route in App.tsx

### Phase 4: Real-time ✅
- [x] Kafka producer (with in-memory fallback)
- [x] Kafka consumer
- [x] SSE event broadcasting
- [x] Typing indicators
- [x] Read receipts
- [x] Online status

---

## Files Structure

```
server/
├── services/
│   ├── chat-service.ts      ✅ Complete
│   ├── chat-sse-service.ts  ✅ Complete
│   └── kafka-service.ts     ✅ Complete (with fallback)
├── routes/
│   └── chat.ts              ✅ Complete
└── storage.ts               ✅ PostgreSQL only

client/src/
├── pages/
│   └── chat-page.tsx        ✅ Complete
└── hooks/
    └── use-chat-stream.ts   ✅ Complete
```

---

## API Endpoints

### SSE Stream
```
GET /api/chat/stream
Authorization: Session cookie

Events: message, typing, seen, online, reaction, deleted, edited
```

### Conversations
```
GET    /api/chat/conversations
POST   /api/chat/conversations/dm
POST   /api/chat/conversations/group
GET    /api/chat/conversations/:id
PATCH  /api/chat/conversations/:id
DELETE /api/chat/conversations/:id
```

### Messages
```
GET    /api/chat/conversations/:id/messages?cursor=X
POST   /api/chat/conversations/:id/messages
PATCH  /api/chat/messages/:id
DELETE /api/chat/messages/:id
POST   /api/chat/messages/:id/react
DELETE /api/chat/messages/:id/react
```

### Status
```
POST   /api/chat/conversations/:id/typing
POST   /api/chat/conversations/:id/seen
GET    /api/chat/users/:id/online
```

### Requests
```
GET    /api/chat/requests
POST   /api/chat/requests/:id/respond
```

---

## Database Tables

- `chat_conversations` - DM and group conversations
- `chat_members` - Conversation membership with settings
- `chat_messages` - Messages with reply/forward support
- `chat_message_reactions` - Emoji reactions
- `chat_message_status` - Delivered/seen tracking
- `chat_requests` - Message requests for non-followers
- `user_online_status` - Online/last seen tracking
- `chat_typing_indicators` - Ephemeral typing state

---

## Next Steps

1. Run database migration: `npx drizzle-kit generate` then `npx drizzle-kit push`
2. Test chat functionality locally
3. Deploy to Railway
4. Add media upload support (images, videos, voice)
5. Add GIF integration
