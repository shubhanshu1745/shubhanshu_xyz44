import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { saveReelVideo, saveReelThumbnail } from '../services/reels-upload';
import { storage } from '../storage';

const router = Router();

// Multer setup for video uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for videos
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video and image files are allowed'));
    }
  },
});

// Validation schemas
const createReelSchema = z.object({
  caption: z.string().max(2200).optional(),
  hashtags: z.array(z.string()).optional(),
  musicId: z.number().optional(),
  visibility: z.enum(['public', 'followers', 'private']).optional().default('public'),
  category: z.string().optional(),
  matchId: z.string().optional(),
  teamId: z.string().optional(),
  playerId: z.string().optional(),
  isDraft: z.boolean().optional().default(false),
  duration: z.number().optional(),
});

// Middleware to check authentication
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
}

// Upload reel video directly
router.post('/upload', requireAuth, upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
]), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    if (!files.video || files.video.length === 0) {
      return res.status(400).json({ message: 'Video file is required' });
    }

    const videoFile = files.video[0];
    const thumbnailFile = files.thumbnail?.[0];

    console.log('Uploading video:', {
      originalName: videoFile.originalname,
      mimetype: videoFile.mimetype,
      size: videoFile.size,
    });

    // Save video locally
    const { videoUrl, filename } = await saveReelVideo(
      userId,
      videoFile.buffer,
      videoFile.mimetype
    );

    console.log('Video saved:', { videoUrl, filename });

    // Verify the file was saved
    const fullPath = path.join(process.cwd(), 'public', videoUrl);
    const fileExists = fs.existsSync(fullPath);
    console.log('File exists check:', { fullPath, fileExists });

    // Save thumbnail if provided
    let thumbnailUrl = '';
    if (thumbnailFile) {
      const result = await saveReelThumbnail(
        userId,
        thumbnailFile.buffer,
        thumbnailFile.mimetype
      );
      thumbnailUrl = result.thumbnailUrl;
    }

    res.json({
      videoUrl,
      thumbnailUrl,
      filename,
      fileExists,
    });
  } catch (error) {
    console.error('Error uploading reel:', error);
    res.status(500).json({ message: 'Failed to upload reel' });
  }
});

// Create a new reel
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const data = createReelSchema.parse(req.body);
    const { videoUrl, thumbnailUrl, duration } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ message: 'Video URL is required' });
    }

    // Create post with reel category
    const post = await storage.createPost({
      userId,
      content: data.caption || '',
      videoUrl,
      thumbnailUrl: thumbnailUrl || '',
      duration: duration || 0,
      category: data.category || 'reel',
      matchId: data.matchId,
      teamId: data.teamId,
      playerId: data.playerId,
    });

    // Get user info for response
    const user = await storage.getUser(userId);

    res.status(201).json({
      ...post,
      user,
      likeCount: 0,
      commentCount: 0,
      viewsCount: 0,
      isLiked: false,
      isSaved: false,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Error creating reel:', error);
    res.status(500).json({ message: 'Failed to create reel' });
  }
});

// Get reels feed
router.get('/feed', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const type = (req.query.type as string) || 'following';

    // Get reels (posts with video)
    const reels = await storage.getReels(userId, limit * page);
    
    // Paginate
    const startIndex = (page - 1) * limit;
    const paginatedReels = reels.slice(startIndex, startIndex + limit);

    // Enrich with user data and counts
    const enrichedReels = await Promise.all(
      paginatedReels.map(async (reel) => {
        const user = await storage.getUser(reel.userId);
        const likes = await storage.getLikesForPost(reel.id);
        const comments = await storage.getCommentsForPost(reel.id);
        const hasLiked = !!(await storage.getLike(userId, reel.id));
        const savedPost = await storage.getSavedPost(userId, reel.id);

        return {
          ...reel,
          user: user ? {
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            profileImage: user.profileImage,
            verificationBadge: user.verificationBadge,
            isPlayer: user.isPlayer,
          } : null,
          likeCount: likes.length,
          commentCount: comments.length,
          viewsCount: 0, // TODO: implement view tracking
          isLiked: hasLiked,
          hasLiked,
          isSaved: !!savedPost,
        };
      })
    );

    res.json(enrichedReels);
  } catch (error) {
    console.error('Error fetching reels feed:', error);
    res.status(500).json({ message: 'Failed to fetch reels' });
  }
});

// Get trending reels
router.get('/trending', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 20;

    const reels = await storage.getReels(userId, limit);
    
    const enrichedReels = await Promise.all(
      reels.map(async (reel) => {
        const user = await storage.getUser(reel.userId);
        const likes = await storage.getLikesForPost(reel.id);
        const comments = await storage.getCommentsForPost(reel.id);
        const hasLiked = !!(await storage.getLike(userId, reel.id));
        const savedPost = await storage.getSavedPost(userId, reel.id);

        return {
          ...reel,
          user: user ? {
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            profileImage: user.profileImage,
            verificationBadge: user.verificationBadge,
            isPlayer: user.isPlayer,
          } : null,
          likeCount: likes.length,
          commentCount: comments.length,
          viewsCount: 0,
          isLiked: hasLiked,
          hasLiked,
          isSaved: !!savedPost,
        };
      })
    );

    // Sort by engagement (likes + comments)
    enrichedReels.sort((a, b) => (b.likeCount + b.commentCount) - (a.likeCount + a.commentCount));

    res.json(enrichedReels);
  } catch (error) {
    console.error('Error fetching trending reels:', error);
    res.status(500).json({ message: 'Failed to fetch trending reels' });
  }
});

// Get explore reels
router.get('/explore', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const reels = await storage.getReels(userId, limit * page);
    const startIndex = (page - 1) * limit;
    const paginatedReels = reels.slice(startIndex, startIndex + limit);

    const enrichedReels = await Promise.all(
      paginatedReels.map(async (reel) => {
        const user = await storage.getUser(reel.userId);
        const likes = await storage.getLikesForPost(reel.id);
        const comments = await storage.getCommentsForPost(reel.id);
        const hasLiked = !!(await storage.getLike(userId, reel.id));
        const savedPost = await storage.getSavedPost(userId, reel.id);

        return {
          ...reel,
          user: user ? {
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            profileImage: user.profileImage,
            verificationBadge: user.verificationBadge,
            isPlayer: user.isPlayer,
          } : null,
          likeCount: likes.length,
          commentCount: comments.length,
          viewsCount: 0,
          isLiked: hasLiked,
          hasLiked,
          isSaved: !!savedPost,
        };
      })
    );

    res.json(enrichedReels);
  } catch (error) {
    console.error('Error fetching explore reels:', error);
    res.status(500).json({ message: 'Failed to fetch explore reels' });
  }
});

// Get single reel
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const reelId = parseInt(req.params.id);

    const post = await storage.getPost(reelId);
    if (!post) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    const user = await storage.getUser(post.userId);
    const likes = await storage.getLikesForPost(reelId);
    const comments = await storage.getCommentsForPost(reelId);
    const hasLiked = !!(await storage.getLike(userId, reelId));
    const savedPost = await storage.getSavedPost(userId, reelId);

    res.json({
      ...post,
      user: user ? {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        profileImage: user.profileImage,
        verificationBadge: user.verificationBadge,
        isPlayer: user.isPlayer,
      } : null,
      likeCount: likes.length,
      commentCount: comments.length,
      viewsCount: 0,
      isLiked: hasLiked,
      hasLiked,
      isSaved: !!savedPost,
    });
  } catch (error) {
    console.error('Error fetching reel:', error);
    res.status(500).json({ message: 'Failed to fetch reel' });
  }
});

// Like a reel
router.post('/:id/like', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const reelId = parseInt(req.params.id);

    // Check if already liked
    const existingLike = await storage.getLike(userId, reelId);
    if (existingLike) {
      return res.status(400).json({ message: 'Already liked' });
    }

    // Create like
    await storage.likePost({ userId, postId: reelId });

    // Get updated count
    const likes = await storage.getLikesForPost(reelId);

    res.json({ message: 'Reel liked successfully', likeCount: likes.length });
  } catch (error) {
    console.error('Error liking reel:', error);
    res.status(500).json({ message: 'Failed to like reel' });
  }
});

// Unlike a reel
router.delete('/:id/like', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const reelId = parseInt(req.params.id);

    await storage.unlikePost(userId, reelId);

    // Get updated count
    const likes = await storage.getLikesForPost(reelId);

    res.json({ message: 'Reel unliked successfully', likeCount: likes.length });
  } catch (error) {
    console.error('Error unliking reel:', error);
    res.status(500).json({ message: 'Failed to unlike reel' });
  }
});

// Record view
router.post('/:id/view', requireAuth, async (req: Request, res: Response) => {
  try {
    const reelId = parseInt(req.params.id);
    // TODO: Implement view tracking in database
    res.json({ total: 1, unique: true });
  } catch (error) {
    console.error('Error recording view:', error);
    res.status(500).json({ message: 'Failed to record view' });
  }
});

// Save a reel
router.post('/:id/save', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const reelId = parseInt(req.params.id);

    // Check if already saved
    const existingSave = await storage.getSavedPost(userId, reelId);
    if (existingSave) {
      return res.status(400).json({ message: 'Already saved' });
    }

    await storage.savePost({ userId, postId: reelId });

    res.json({ message: 'Reel saved successfully' });
  } catch (error) {
    console.error('Error saving reel:', error);
    res.status(500).json({ message: 'Failed to save reel' });
  }
});

// Unsave a reel
router.delete('/:id/save', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const reelId = parseInt(req.params.id);

    await storage.unsavePost(userId, reelId);

    res.json({ message: 'Reel unsaved successfully' });
  } catch (error) {
    console.error('Error unsaving reel:', error);
    res.status(500).json({ message: 'Failed to unsave reel' });
  }
});

// Delete a reel
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const reelId = parseInt(req.params.id);

    const post = await storage.getPost(reelId);
    if (!post) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    if (post.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this reel' });
    }

    await storage.deletePost(reelId);

    res.json({ message: 'Reel deleted successfully' });
  } catch (error) {
    console.error('Error deleting reel:', error);
    res.status(500).json({ message: 'Failed to delete reel' });
  }
});

// Get user's reels
router.get('/user/:username', requireAuth, async (req: Request, res: Response) => {
  try {
    const viewerId = req.user!.id;
    const username = req.params.username;

    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const posts = await storage.getUserPosts(user.id);
    const reels = posts.filter(p => p.category === 'reel' || p.videoUrl);

    const enrichedReels = await Promise.all(
      reels.map(async (reel) => {
        const likes = await storage.getLikesForPost(reel.id);
        const comments = await storage.getCommentsForPost(reel.id);
        const hasLiked = !!(await storage.getLike(viewerId, reel.id));
        const savedPost = await storage.getSavedPost(viewerId, reel.id);

        return {
          ...reel,
          user: {
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            profileImage: user.profileImage,
            verificationBadge: user.verificationBadge,
            isPlayer: user.isPlayer,
          },
          likeCount: likes.length,
          commentCount: comments.length,
          viewsCount: 0,
          isLiked: hasLiked,
          hasLiked,
          isSaved: !!savedPost,
        };
      })
    );

    res.json(enrichedReels);
  } catch (error) {
    console.error('Error fetching user reels:', error);
    res.status(500).json({ message: 'Failed to fetch user reels' });
  }
});

// Get trending hashtags
router.get('/hashtags/trending', requireAuth, async (req: Request, res: Response) => {
  try {
    const hashtags = ['#cricket', '#ipl', '#worldcup', '#sixers', '#wicket', '#century', '#bowling', '#batting', '#fielding', '#catch'];
    res.json(hashtags);
  } catch (error) {
    console.error('Error fetching trending hashtags:', error);
    res.status(500).json({ message: 'Failed to fetch trending hashtags' });
  }
});

// ============ MUSIC ROUTES ============

// Sample music data
const sampleMusic = [
  { id: 1, title: 'Cricket Anthem', artist: 'Stadium Sounds', audioUrl: '/audio/cricket-anthem.mp3', duration: 30, genre: 'Sports', usageCount: 100 },
  { id: 2, title: 'Victory March', artist: 'Champion Beats', audioUrl: '/audio/victory-march.mp3', duration: 45, genre: 'Celebration', usageCount: 80 },
  { id: 3, title: 'Crowd Roar', artist: 'Stadium Ambience', audioUrl: '/audio/crowd-roar.mp3', duration: 20, genre: 'Ambient', usageCount: 60 },
  { id: 4, title: 'Six Hit', artist: 'Cricket Beats', audioUrl: '/audio/six-hit.mp3', duration: 15, genre: 'Effects', usageCount: 120 },
  { id: 5, title: 'Wicket Fall', artist: 'Cricket Beats', audioUrl: '/audio/wicket-fall.mp3', duration: 10, genre: 'Effects', usageCount: 90 },
];

// Get all music
router.get('/music/all', requireAuth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const start = (page - 1) * limit;
    const tracks = sampleMusic.slice(start, start + limit);

    res.json({
      tracks,
      total: sampleMusic.length,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error fetching music:', error);
    res.status(500).json({ message: 'Failed to fetch music' });
  }
});

// Search music
router.get('/music/search', requireAuth, async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string || '').toLowerCase();
    const tracks = sampleMusic.filter(t => 
      t.title.toLowerCase().includes(query) || 
      t.artist.toLowerCase().includes(query)
    );

    res.json({
      tracks,
      total: tracks.length,
      page: 1,
      limit: 20,
    });
  } catch (error) {
    console.error('Error searching music:', error);
    res.status(500).json({ message: 'Failed to search music' });
  }
});

// Get trending music
router.get('/music/trending', requireAuth, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const tracks = [...sampleMusic].sort((a, b) => b.usageCount - a.usageCount).slice(0, limit);
    res.json(tracks);
  } catch (error) {
    console.error('Error fetching trending music:', error);
    res.status(500).json({ message: 'Failed to fetch trending music' });
  }
});

// Get music by genre
router.get('/music/genre/:genre', requireAuth, async (req: Request, res: Response) => {
  try {
    const genre = req.params.genre.toLowerCase();
    const tracks = sampleMusic.filter(t => t.genre?.toLowerCase() === genre);

    res.json({
      tracks,
      total: tracks.length,
      page: 1,
      limit: 20,
    });
  } catch (error) {
    console.error('Error fetching music by genre:', error);
    res.status(500).json({ message: 'Failed to fetch music' });
  }
});

// Get available genres
router.get('/music/genres', requireAuth, async (req: Request, res: Response) => {
  try {
    const genreSet = new Set(sampleMusic.map(t => t.genre).filter(Boolean));
    const genres = Array.from(genreSet);
    res.json(genres);
  } catch (error) {
    console.error('Error fetching genres:', error);
    res.status(500).json({ message: 'Failed to fetch genres' });
  }
});

// Get single music track
router.get('/music/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const musicId = parseInt(req.params.id);
    const track = sampleMusic.find(t => t.id === musicId);
    
    if (!track) {
      return res.status(404).json({ message: 'Music track not found' });
    }

    res.json(track);
  } catch (error) {
    console.error('Error fetching music track:', error);
    res.status(500).json({ message: 'Failed to fetch music track' });
  }
});

// Debug endpoint to check video files
router.get('/debug/video/:filename', requireAuth, async (req: Request, res: Response) => {
  try {
    const filename = req.params.filename;
    const videoPath = path.join(process.cwd(), 'public', 'uploads', 'reels', filename);
    const exists = fs.existsSync(videoPath);
    
    let stats = null;
    if (exists) {
      const fileStats = fs.statSync(videoPath);
      stats = {
        size: fileStats.size,
        created: fileStats.birthtime,
        modified: fileStats.mtime,
      };
    }
    
    res.json({
      filename,
      path: videoPath,
      exists,
      stats,
      url: `/uploads/reels/${filename}`,
    });
  } catch (error) {
    console.error('Error checking video:', error);
    res.status(500).json({ message: 'Failed to check video' });
  }
});

// List all uploaded reels
router.get('/debug/list', requireAuth, async (req: Request, res: Response) => {
  try {
    const reelsDir = path.join(process.cwd(), 'public', 'uploads', 'reels');
    
    if (!fs.existsSync(reelsDir)) {
      return res.json({ files: [], message: 'Reels directory does not exist' });
    }
    
    const files = fs.readdirSync(reelsDir).map(file => {
      const filePath = path.join(reelsDir, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        url: `/uploads/reels/${file}`,
        size: stats.size,
        created: stats.birthtime,
      };
    });
    
    res.json({ files, directory: reelsDir });
  } catch (error) {
    console.error('Error listing reels:', error);
    res.status(500).json({ message: 'Failed to list reels' });
  }
});

export default router;
