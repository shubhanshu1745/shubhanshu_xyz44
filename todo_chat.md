# CricSocial Chat System - 2026 Architecture

## Overview
Instagram-level chat system using SSE + Event Streams instead of WebSockets for better scalability, reliability, and cost efficiency.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Client → Server Realtime | SSE (Server-Sent Events) |
| Message Ingestion | REST API (POST) |
| Fan-out / Scale | Redis Pub/Sub (free tier) |
| Storage | PostgreSQL |
| Media | MinIO / Local uploads |
| Offline Sync | Cursor-based fetch |
| Push Notifications | FCM (future) |

---

## Features Checklist

### 🔐 Conversation Types
- [ ] One-to-one DM chat
- [ ] Group chat
- [ ] Message requests (non-followers)
- [ ] Vanish / disappearing messages
- [ ] Broadcast channels

### 💬 Messaging Features
- [ ] Send text messages
- [ ] Send emojis
- [ ] Send GIFs
- [ ] Send stickers
- [ ] Send images
- [ ] Send videos
- [ ] Send voice notes
- [ ] Send documents
- [ ] Share posts/reels in chat
- [ ] Reply to specific message
- [ ] Forward message
- [ ] Copy message
- [ ] Delete for me
- [ ] Unsend for everyone
- [ ] Edit message (within 15 min)

### 👀 Message State Tracking
- [ ] Sent status
- [ ] Delivered status
- [ ] Seen status
- [ ] Seen by whom (group)
- [ ] Typing indicator
- [ ] Online / last seen
- [ ] Message reactions (❤️ 😂 😮 😢 🔥 🏏)

### 🔕 Chat Controls
- [ ] Mute chat
- [ ] Archive chat
- [ ] Pin chat
- [ ] Mark unread
- [ ] Clear chat
- [ ] Block user
- [ ] Report chat

### 👥 Group Chat Features
- [ ] Create group
- [ ] Add members
- [ ] Remove members
- [ ] Leave group
- [ ] Assign admin
- [ ] Change group name
- [ ] Change group photo
- [ ] Mention users (@username)
- [ ] Polls in chat
- [ ] Restrict replies

### 📨 Message Request System
- [ ] Incoming request inbox
- [ ] Accept request
- [ ] Decline request
- [ ] Block sender
- [ ] Auto-accept after follow

---

## Database Schema

### conversations
```sql
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'dm', -- 'dm' | 'group'
  name TEXT, -- for groups
  avatar_url TEXT, -- for groups
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### conversation_members
```sql
CREATE TABLE conversation_members (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- 'admin' | 'member'
  joined_at TIMESTAMP DEFAULT NOW(),
  left_at TIMESTAMP,
  is_muted BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  last_read_message_id INTEGER,
  UNIQUE(conversation_id, user_id)
);
```

### messages
```sql
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id INTEGER REFERENCES users(id),
  type TEXT DEFAULT 'text', -- 'text' | 'image' | 'video' | 'voice' | 'gif' | 'sticker' | 'post' | 'reel'
  content TEXT,
  media_url TEXT,
  reply_to_id INTEGER REFERENCES messages(id),
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMP,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP,
  expires_at TIMESTAMP, -- for vanish mode
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
```

### message_reactions
```sql
CREATE TABLE message_reactions (
  id SERIAL PRIMARY KEY,
  message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);
```

### message_status
```sql
CREATE TABLE message_status (
  id SERIAL PRIMARY KEY,
  message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'delivered', -- 'delivered' | 'seen'
  status_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);
```

### message_requests
```sql
CREATE TABLE message_requests (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER REFERENCES users(id),
  recipient_id INTEGER REFERENCES users(id),
  conversation_id INTEGER REFERENCES conversations(id),
  status TEXT DEFAULT 'pending', -- 'pending' | 'accepted' | 'declined'
  created_at TIMESTAMP DEFAULT NOW(),
  responded_at TIMESTAMP,
  UNIQUE(sender_id, recipient_id)
);
```

---

## API Endpoints

### SSE Stream (Single Connection Per User)
```
GET /api/chat/stream
Authorization: Bearer JWT

Events:
- message: new message received
- typing: user is typing
- seen: message was seen
- online: user online status
- reaction: message reaction added
```

### Conversations
```
GET    /api/conversations              - List all conversations
POST   /api/conversations              - Create conversation (DM or group)
GET    /api/conversations/:id          - Get conversation details
DELETE /api/conversations/:id          - Delete/leave conversation
PATCH  /api/conversations/:id          - Update (mute, archive, pin)
```

### Messages
```
GET    /api/conversations/:id/messages?cursor=X  - Get messages (paginated)
POST   /api/conversations/:id/messages           - Send message
PATCH  /api/messages/:id                         - Edit message
DELETE /api/messages/:id                         - Delete message
POST   /api/messages/:id/react                   - Add reaction
DELETE /api/messages/:id/react                   - Remove reaction
```

### Typing & Status
```
POST   /api/conversations/:id/typing    - Send typing indicator
POST   /api/messages/:id/seen           - Mark as seen
GET    /api/users/:id/online            - Check online status
```

### Message Requests
```
GET    /api/message-requests            - List pending requests
POST   /api/message-requests/:id/accept - Accept request
POST   /api/message-requests/:id/decline - Decline request
```

### Groups
```
POST   /api/conversations/:id/members   - Add members
DELETE /api/conversations/:id/members/:userId - Remove member
PATCH  /api/conversations/:id/admin     - Change admin
```

---

## SSE Event Format

```javascript
// New message
event: message
data: {"conversationId": 123, "message": {"id": 456, "content": "Hello!", "sender": {...}}}

// Typing indicator
event: typing
data: {"conversationId": 123, "userId": 45, "isTyping": true}

// Message seen
event: seen
data: {"conversationId": 123, "messageId": 789, "userId": 45}

// Online status
event: online
data: {"userId": 45, "isOnline": true, "lastSeen": "2026-01-04T12:00:00Z"}

// Reaction
event: reaction
data: {"messageId": 789, "userId": 45, "emoji": "❤️"}
```

---

## Message Flow

```
┌─────────┐    REST POST    ┌─────────┐    Save    ┌────────┐
│ Client  │ ──────────────► │ Server  │ ─────────► │   DB   │
└─────────┘                 └─────────┘            └────────┘
                                 │
                                 │ Publish Event
                                 ▼
                            ┌─────────┐
                            │  Redis  │
                            │ Pub/Sub │
                            └─────────┘
                                 │
                                 │ Subscribe
                                 ▼
                            ┌─────────┐    SSE     ┌──────────┐
                            │ Server  │ ─────────► │ Receiver │
                            └─────────┘            └──────────┘
```

---

## UI Components

### Chat List Page
- Search bar
- Pinned chats section
- Recent chats list
- Message request badge
- Online indicators
- Unread count badges
- Last message preview

### Chat Window
- Header (avatar, name, online status)
- Messages area (infinite scroll up)
- Typing indicator
- Message input with:
  - Text field
  - Emoji picker
  - GIF picker
  - Attachment button
  - Voice record button
  - Send button

### Message Bubble
- Sender avatar (group only)
- Message content
- Reply preview (if reply)
- Reactions bar
- Timestamp
- Status indicator (sent/delivered/seen)
- Long press menu (reply, react, copy, delete, forward)

### Group Info Page
- Group avatar & name
- Members list with roles
- Media/links/docs tabs
- Mute/archive/leave options

---

## Implementation Priority

### Phase 1: Core Chat ✅
1. [ ] Database schema migration
2. [ ] Conversations CRUD API
3. [ ] Messages CRUD API
4. [ ] SSE stream endpoint
5. [ ] Basic chat UI (list + window)

### Phase 2: Real-time Features
6. [ ] Typing indicators
7. [ ] Read receipts (seen status)
8. [ ] Online status
9. [ ] Message reactions

### Phase 3: Rich Media
10. [ ] Image messages
11. [ ] Video messages
12. [ ] Voice notes
13. [ ] GIF picker
14. [ ] Stickers

### Phase 4: Groups
15. [ ] Group creation
16. [ ] Member management
17. [ ] Admin controls
18. [ ] Group settings

### Phase 5: Advanced
19. [ ] Message requests
20. [ ] Vanish mode
21. [ ] Message editing
22. [ ] Message forwarding
23. [ ] Chat search
24. [ ] Push notifications

---

## Why SSE > WebSockets (2026)

| Feature | SSE + Redis | WebSockets |
|---------|-------------|------------|
| Scale to millions | ✅ Easy | ❌ Complex |
| Load balancer friendly | ✅ Yes | ❌ Sticky sessions |
| Free infra | ✅ Yes | ❌ Expensive |
| Mobile stability | ✅ Great | ❌ Weak |
| Debuggable | ✅ Easy | ❌ Hard |
| Stateless backend | ✅ Yes | ❌ No |
| Auto-reconnect | ✅ Built-in | ❌ Manual |

---

## Files to Create/Modify

### Backend
- `server/routes/chat.ts` - Chat API routes
- `server/services/chat-service.ts` - Chat business logic
- `server/services/sse-service.ts` - SSE connection manager
- `shared/schema.ts` - Add chat tables

### Frontend
- `client/src/pages/messages-page.tsx` - Chat list
- `client/src/components/chat/chat-window.tsx` - Chat UI
- `client/src/components/chat/message-bubble.tsx` - Message component
- `client/src/components/chat/chat-input.tsx` - Input with attachments
- `client/src/hooks/use-chat-stream.ts` - SSE hook

---

## Notes
- Use cursor-based pagination for message history
- Implement heartbeat for online status (30s interval)
- Cache online status in Redis with TTL
- Use optimistic updates for sent messages
- Implement retry logic for failed messages
