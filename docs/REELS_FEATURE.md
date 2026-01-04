# Instagram-like Reels Feature

## Overview

CricStagram now includes a full-featured Reels system similar to Instagram, optimized for cricket content. This document covers the architecture, setup, and usage.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ ReelsFeed   │  │ ReelCard    │  │ CreateReelDialog    │  │
│  │ (Infinite   │  │ (Video      │  │ (Upload, Edit,      │  │
│  │  Scroll)    │  │  Player)    │  │  Music Selection)   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Node.js)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Reels       │  │ Music       │  │ Redis Cache         │  │
│  │ Service     │  │ Service     │  │ Service             │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │ MinIO    │   │ Redis    │   │ PostgreSQL│
        │ (Videos) │   │ (Cache)  │   │ (Metadata)│
        └──────────┘   └──────────┘   └──────────┘
```

## Features

### Core Features
- ✅ Vertical video feed with swipe navigation
- ✅ Autoplay with loop
- ✅ Double-tap to like
- ✅ Like, comment, share, save
- ✅ View count tracking (total + unique)
- ✅ Music library integration
- ✅ Hashtag support
- ✅ Cricket-specific categories

### Feed Types
- **Following**: Reels from users you follow
- **Explore**: Discover new content
- **Trending**: Top performing reels

### Engagement
- Like/Unlike with animation
- Comments with replies
- Share via native share or copy link
- Save to collection
- View count (unique + total)

## Setup

### 1. Start Docker Services

```bash
cd CricStagram-1
docker-compose up -d
```

This starts:
- PostgreSQL (port 5432)
- MinIO (ports 9000, 9001)
- Redis (port 6379)

### 2. MinIO Buckets

The `minio-init` service automatically creates:
- `reels-videos` - Video storage
- `reels-thumbnails` - Thumbnail images
- `reels-hls` - HLS streaming files (future)
- `music-library` - Audio tracks
- `drafts` - Draft reels

### 3. Environment Variables

```env
# MinIO
MINIO_ENDPOINT=localhost  # or 'minio' in Docker
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_USE_SSL=false

# Redis
REDIS_HOST=localhost  # or 'redis' in Docker
REDIS_PORT=6379
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run the App

```bash
npm run dev
```

## API Endpoints

### Reels

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reels/feed` | Get reels feed |
| GET | `/api/reels/trending` | Get trending reels |
| GET | `/api/reels/explore` | Get explore reels |
| GET | `/api/reels/:id` | Get single reel |
| POST | `/api/reels` | Create new reel |
| POST | `/api/reels/upload` | Upload video/thumbnail |
| POST | `/api/reels/:id/like` | Like a reel |
| DELETE | `/api/reels/:id/like` | Unlike a reel |
| POST | `/api/reels/:id/view` | Record view |
| POST | `/api/reels/:id/save` | Save reel |
| DELETE | `/api/reels/:id/save` | Unsave reel |
| DELETE | `/api/reels/:id` | Delete reel |
| GET | `/api/reels/user/:username` | Get user's reels |

### Music

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reels/music/all` | Get all music |
| GET | `/api/reels/music/search` | Search music |
| GET | `/api/reels/music/trending` | Get trending music |
| GET | `/api/reels/music/genre/:genre` | Get music by genre |
| GET | `/api/reels/music/genres` | Get available genres |
| GET | `/api/reels/music/:id` | Get single track |
| POST | `/api/reels/music/upload` | Upload original audio |

## Caching Strategy

### Redis Keys

| Key Pattern | TTL | Description |
|-------------|-----|-------------|
| `reels:feed:user:{userId}:{type}:{page}` | 60s | User feed cache |
| `reels:likes:{reelId}` | 10s | Like count |
| `reels:views:{reelId}` | 10s | View count |
| `reels:views:{reelId}:unique` | 24h | Unique viewers set |
| `reels:trending` | 5min | Trending reels sorted set |
| `music:trending` | 10min | Trending music sorted set |

### Trending Score Formula

```
score = (views × 1) + (likes × 3) + (comments × 4) + (shares × 5) + (completionRate × 5) - agePenalty
```

## Frontend Components

### ReelsFeed
Main container with infinite scroll, feed type tabs, and navigation.

### ReelCard
Individual reel display with:
- Video player with autoplay
- Progress bar
- User info overlay
- Action buttons (like, comment, share, save)
- Double-tap like animation

### CreateReelDialog
Multi-step reel creation:
1. Upload video
2. Edit (thumbnail, music)
3. Details (caption, hashtags, category)

## Video Upload Flow

1. User selects video file
2. Client validates (size, duration, format)
3. Video uploaded to MinIO via presigned URL
4. Thumbnail generated from video frame
5. Reel metadata saved to PostgreSQL
6. Feed caches invalidated
7. Trending score initialized

## Future Enhancements

- [ ] HLS adaptive bitrate streaming
- [ ] Video transcoding worker
- [ ] Remix/Duet feature
- [ ] Draft reels
- [ ] Reel analytics dashboard
- [ ] CDN integration

## Troubleshooting

### MinIO Connection Issues
```bash
# Check MinIO is running
docker-compose ps minio

# Access MinIO console
open http://localhost:9001
# Login: minioadmin / minioadmin123
```

### Redis Connection Issues
```bash
# Check Redis is running
docker-compose ps redis

# Test connection
docker-compose exec redis redis-cli ping
```

### Video Upload Fails
- Check file size (max 100MB)
- Check duration (max 90 seconds)
- Check format (MP4, MOV, WebM)
- Verify MinIO bucket permissions
