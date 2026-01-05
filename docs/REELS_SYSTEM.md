# 🎬 CricStagram Reels System - Complete Documentation

## Overview
Instagram-level Reels platform built with React, TypeScript, and Node.js. Features a full video editor, music sync, filters, and smooth vertical feed.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────┤
│  ReelsFeedEnhanced    │  CreateReelEnhanced  │  VideoEditor │
│  - Vertical scroll    │  - 4-step wizard     │  - Trim      │
│  - Infinite load      │  - Upload validation │  - Text      │
│  - Tab navigation     │  - Editor integration│  - Stickers  │
│  - Keyboard controls  │  - Details form      │  - Music     │
│  - Video preloading   │                      │  - Filters   │
│                       │                      │  - Preview   │
├─────────────────────────────────────────────────────────────┤
│  ReelCardEnhanced                                           │
│  - Auto-play/pause    │  - Double-tap like   │  - Comments  │
│  - Progress bar       │  - Share sheet       │  - Save      │
│  - Long-press pause   │  - Follow button     │  - Report    │
│  - @mention support   │  - Comment like/reply│  - Block     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js)                        │
├─────────────────────────────────────────────────────────────┤
│  /api/reels/*                                               │
│  - POST /upload       - Upload video + thumbnail            │
│  - POST /             - Create reel with metadata           │
│  - GET /feed          - Paginated feed (following/explore)  │
│  - GET /trending      - Trending reels                      │
│  - POST /:id/like     - Like/unlike (rate limited)          │
│  - POST /:id/view     - Record view (rate limited)          │
│  - POST /:id/save     - Save/unsave                         │
│  - GET /:id/analytics - Creator analytics                   │
│  - POST /:id/comments/:cid/like   - Like comment            │
│  - POST /:id/comments/:cid/reply  - Reply to comment        │
│  - POST /users/:id/block          - Block user              │
├─────────────────────────────────────────────────────────────┤
│  Video Processing Service (FFmpeg)                          │
│  - Trim video         │  - Apply filters     │  - Merge     │
│  - Generate thumbnail │  - Optimize quality  │  - Queue     │
├─────────────────────────────────────────────────────────────┤
│  Rate Limiting                                              │
│  - Likes: 100/min     │  - Comments: 30/min  │  - Views:    │
│  - General: 60/min    │  - Per-user tracking │  200/min     │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| UI Framework | React 18 | Component architecture |
| State Management | TanStack Query | Server state, caching |
| Animations | Framer Motion | Smooth transitions |
| Styling | Tailwind CSS | Utility-first CSS |
| UI Components | shadcn/ui | Accessible components |
| Video Player | HTML5 Video | Native playback |
| Backend | Express.js | REST API |
| Video Processing | FFmpeg | Trim, filter, merge |
| Storage | Local filesystem | Video/image storage |

## Component Reference

### 1. ReelsFeedEnhanced
Main feed component with vertical scroll navigation.

```tsx
<ReelsFeedEnhanced 
  initialType="following"  // "following" | "explore" | "trending"
  initialReelId={123}      // Deep link to specific reel
/>
```

**Features:**
- Infinite scroll with prefetching
- Keyboard navigation (↑/↓, j/k)
- Touch swipe gestures
- Mouse wheel support
- Tab switching (Following/Explore/Trending)
- Search bar

### 2. CreateReelEnhanced
Full-featured reel creation wizard.

**Steps:**
1. **Upload** - Drag & drop or browse (MP4/MOV/WebM, ≤90s, ≤100MB)
2. **Edit** - VideoEditor with trim, text, stickers, music, filters
3. **Details** - Caption, hashtags, category, visibility
4. **Publishing** - Progress indicator

### 3. VideoEditor
Layer-based video editor.

**Layers:**
- Video Layer (base)
- Text Layer (drag, resize, animate)
- Sticker Layer (emoji, GIF)
- Music Layer (sync, volume)
- Filter Layer (CSS-based presets)

**Filter Presets:**
| ID | Name | CSS Filter |
|----|------|------------|
| warm | Warm | sepia(0.3) saturate(1.4) brightness(1.1) |
| cool | Cool | saturate(0.9) hue-rotate(10deg) |
| vintage | Vintage | sepia(0.4) contrast(1.1) brightness(0.9) |
| bw | B&W | grayscale(1) contrast(1.2) |
| vivid | Vivid | saturate(1.5) contrast(1.1) |
| cricket | Cricket | saturate(1.3) brightness(1.1) |

### 4. ReelCardEnhanced
Individual reel viewer with interactions.

**Gestures:**
- Single tap → Play/Pause
- Double tap → Like with heart animation
- Long press → Pause (release to resume)
- Swipe up/down → Navigate reels

## API Endpoints

### Upload & Create
```
POST /api/reels/upload
Content-Type: multipart/form-data
Body: { video: File, thumbnail?: File }
Response: { videoUrl, thumbnailUrl, filename }

POST /api/reels
Body: { videoUrl, thumbnailUrl, caption, hashtags[], category, visibility, duration }
Response: { id, ...reelData }
```

### Feed
```
GET /api/reels/feed?type=following&page=1&limit=10
GET /api/reels/trending?limit=20
GET /api/reels/explore?page=1&limit=10
GET /api/reels/user/:username
```

### Interactions
```
POST /api/reels/:id/like
DELETE /api/reels/:id/like
POST /api/reels/:id/view
POST /api/reels/:id/save
DELETE /api/reels/:id/save
POST /api/reels/:id/report
```

### Comment Interactions
```
POST /api/reels/:id/comments/:commentId/like    - Like a comment
DELETE /api/reels/:id/comments/:commentId/like  - Unlike a comment
POST /api/reels/:id/comments/:commentId/reply   - Reply to a comment
GET /api/reels/:id/comments/:commentId/replies  - Get replies for a comment
```

### Block User
```
POST /api/reels/users/:userId/block    - Block a user
DELETE /api/reels/users/:userId/block  - Unblock a user
GET /api/reels/users/:userId/blocked   - Check if user is blocked
GET /api/reels/blocked-users           - Get list of blocked users
```

### Music
```
GET /api/reels/music/trending?limit=10
GET /api/reels/music/search?q=query
GET /api/reels/music/genres
GET /api/reels/music/genre/:genre
```

### Processing
```
GET /api/reels/processing/status  - Check FFmpeg availability
POST /api/reels/process           - Queue video processing
GET /api/reels/process/:jobId     - Get processing status
```

## Categories
| Value | Label | Use Case |
|-------|-------|----------|
| reel | General | Default category |
| match_highlight | Match Highlight | Game moments |
| player_moment | Player Moment | Individual plays |
| training | Training | Practice sessions |
| fan_moment | Fan Moment | Crowd reactions |
| behind_scenes | Behind Scenes | Off-field content |

## Visibility Options
| Value | Description |
|-------|-------------|
| public | Anyone can see |
| followers | Only followers |
| private | Only creator |

## Video Processing Pipeline

```
Upload → Raw Storage → FFmpeg Processing → Optimized MP4 → CDN
                              │
                              ├── Trim (start/end)
                              ├── Apply CSS filter
                              ├── Merge music audio
                              ├── Scale to 1080p max
                              └── Generate thumbnail
```

**Quality Settings:**
| Level | CRF | Preset | Use Case |
|-------|-----|--------|----------|
| low | 28 | fast | Quick preview |
| medium | 23 | medium | Default |
| high | 18 | slow | Best quality |

## Performance Optimizations

1. **Lazy Loading** - Only active reel plays video
2. **Video Preloading** - Preload next 2 videos for instant playback
3. **Thumbnail Posters** - Show thumbnail before video loads
4. **Buffering Indicator** - Show buffered progress
5. **Memoization** - React.memo on ReelCard
6. **Virtual Scrolling** - Only render visible reels
7. **Rate Limiting** - Prevent abuse on likes/comments/views

## Keyboard Shortcuts
| Key | Action |
|-----|--------|
| ↑ / k | Previous reel |
| ↓ / j | Next reel |
| Space | Play/Pause |
| m | Mute/Unmute |
| l | Like |
| s | Save |

## File Structure
```
client/src/components/reels/
├── index.ts                    # Exports
├── create-reel-dialog.tsx      # Basic creator (legacy)
├── create-reel-enhanced.tsx    # Full editor wizard
├── reel-viewer.tsx             # Basic viewer (legacy)
├── reel-viewer-enhanced.tsx    # Enhanced viewer
├── reels-feed.tsx              # Basic feed (legacy)
├── reels-feed-enhanced.tsx     # Enhanced feed
└── editor/
    └── video-editor.tsx        # Layer-based editor

server/
├── routes/reels.ts             # API routes
└── services/
    ├── reels-upload.ts         # File upload
    └── video-processing.ts     # FFmpeg processing
```

## Future Enhancements
- [ ] HLS adaptive streaming
- [ ] WebGL filters
- [ ] AI-powered auto-captions
- [ ] Duet/Stitch features
- [ ] AR effects
- [ ] Redis caching
- [ ] CDN integration

## Recently Implemented Features (v2.0)

### Music Preview Playback ✅
- Audio preview before selecting music track
- Play/pause toggle with progress indicator
- 15-second preview limit
- Visual feedback during playback

### Comment Like/Reply Backend ✅
- `POST /api/reels/:id/comments/:commentId/like` - Like a comment
- `DELETE /api/reels/:id/comments/:commentId/like` - Unlike a comment
- `POST /api/reels/:id/comments/:commentId/reply` - Reply to a comment
- `GET /api/reels/:id/comments/:commentId/replies` - Get replies

### @Mention Support ✅
- Parse @mentions in comments and replies
- Clickable mentions linking to user profiles
- Visual indicator when typing mentions
- Reply-to UI with mention auto-fill

### Video Preloading ✅
- Preload next 2 videos for instant playback
- Preload previous video for smooth backward navigation
- Automatic cleanup on unmount
- Memory-efficient with max 3 preloaded videos

### Rate Limiting ✅
- Likes: 100 requests per minute
- Comments: 30 requests per minute
- Views: 200 requests per minute
- General: 60 requests per minute
- Per-user tracking with automatic cleanup

### Block User in Reels ✅
- Block/unblock users from reels context
- Blocked users' reels filtered from feed
- Check block status endpoint
- Get blocked users list

### Layer Ordering ✅
- Bring layer forward/backward
- Bring to front/send to back
- Works for both text and sticker layers
- Visual UI buttons in editor
