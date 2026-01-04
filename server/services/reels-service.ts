import { v4 as uuidv4 } from 'uuid';
import minioClient, { BUCKETS, getPublicUrl, uploadFile, deleteFile, getPresignedUploadUrl, getPresignedDownloadUrl } from './minio-client';
import redisClient, { 
  cacheReelFeed, 
  getCachedReelFeed, 
  invalidateReelFeed,
  incrementReelLikes,
  decrementReelLikes,
  getReelLikes,
  incrementReelViews,
  getReelViews,
  updateTrendingScore,
  getTrendingReels,
  incrementMusicUsage,
  getTrendingMusic,
  cacheGet,
  cacheSet,
  CACHE_TTL,
  CACHE_KEYS
} from './redis-client';
import { storage } from '../storage';

// Reel types
export interface ReelUploadRequest {
  userId: number;
  caption?: string;
  hashtags?: string[];
  musicId?: number;
  visibility?: 'public' | 'followers' | 'private';
  category?: string;
  matchId?: string;
  teamId?: string;
  playerId?: string;
  isDraft?: boolean;
}

export interface ReelMetadata {
  id: number;
  userId: number;
  videoUrl: string;
  thumbnailUrl: string;
  hlsUrl?: string;
  caption?: string;
  hashtags: string[];
  musicId?: number;
  duration: number;
  visibility: string;
  category?: string;
  matchId?: string;
  teamId?: string;
  playerId?: string;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  sharesCount: number;
  isDraft: boolean;
  createdAt: Date;
}

export interface ReelEngagement {
  reelId: number;
  userId: number;
  type: 'like' | 'view' | 'save' | 'share';
  createdAt: Date;
}

// Generate unique filename for reel
export function generateReelFilename(userId: number, extension: string = 'mp4'): string {
  const timestamp = Date.now();
  const uuid = uuidv4().slice(0, 8);
  return `${userId}/${timestamp}-${uuid}.${extension}`;
}

// Get presigned URL for video upload
export async function getVideoUploadUrl(userId: number): Promise<{ uploadUrl: string; objectName: string }> {
  const objectName = generateReelFilename(userId, 'mp4');
  const uploadUrl = await getPresignedUploadUrl(BUCKETS.REELS_VIDEOS, objectName, 3600);
  return { uploadUrl, objectName };
}

// Get presigned URL for thumbnail upload
export async function getThumbnailUploadUrl(userId: number): Promise<{ uploadUrl: string; objectName: string }> {
  const objectName = generateReelFilename(userId, 'jpg');
  const uploadUrl = await getPresignedUploadUrl(BUCKETS.REELS_THUMBNAILS, objectName, 3600);
  return { uploadUrl, objectName };
}

// Upload video directly from buffer
export async function uploadReelVideo(
  userId: number,
  videoBuffer: Buffer,
  contentType: string = 'video/mp4'
): Promise<{ videoUrl: string; objectName: string }> {
  const objectName = generateReelFilename(userId, 'mp4');
  await uploadFile(BUCKETS.REELS_VIDEOS, objectName, videoBuffer, contentType);
  const videoUrl = getPublicUrl(BUCKETS.REELS_VIDEOS, objectName);
  return { videoUrl, objectName };
}

// Upload thumbnail directly from buffer
export async function uploadReelThumbnail(
  userId: number,
  thumbnailBuffer: Buffer,
  contentType: string = 'image/jpeg'
): Promise<{ thumbnailUrl: string; objectName: string }> {
  const objectName = generateReelFilename(userId, 'jpg');
  await uploadFile(BUCKETS.REELS_THUMBNAILS, objectName, thumbnailBuffer, contentType);
  const thumbnailUrl = getPublicUrl(BUCKETS.REELS_THUMBNAILS, objectName);
  return { thumbnailUrl, objectName };
}

// Create a new reel
export async function createReel(
  request: ReelUploadRequest,
  videoUrl: string,
  thumbnailUrl: string,
  duration: number
): Promise<any> {
  // Create post with reel category
  const post = await storage.createPost({
    userId: request.userId,
    content: request.caption || '',
    videoUrl,
    thumbnailUrl,
    duration,
    category: request.category || 'reel',
    matchId: request.matchId,
    teamId: request.teamId,
    playerId: request.playerId,
  });

  // Invalidate user's feed cache
  await invalidateReelFeed(request.userId);

  // Update trending score (new reels start with base score)
  await updateTrendingScore(post.id, 1);

  // If music is used, increment music usage
  if (request.musicId) {
    await incrementMusicUsage(request.musicId);
  }

  return post;
}

// Get reel by ID with cached counts
export async function getReelById(reelId: number, userId?: number): Promise<any | null> {
  const post = await storage.getPost(reelId);
  if (!post || post.category !== 'reel') return null;

  const user = await storage.getUser(post.userId);
  
  // Get cached counts or fallback to DB
  const cachedLikes = await getReelLikes(reelId);
  const cachedViews = await getReelViews(reelId);
  
  let likeCount = cachedLikes;
  let viewsCount = cachedViews.total;
  
  // If no cached data, get from DB
  if (likeCount === 0) {
    const likes = await storage.getLikesForPost(reelId);
    likeCount = likes.length;
  }

  const comments = await storage.getCommentsForPost(reelId);
  const hasLiked = userId ? !!(await storage.getLike(userId, reelId)) : false;
  const isSaved = userId ? !!(await storage.getSavedPost(userId, reelId)) : false;

  return {
    ...post,
    user,
    likeCount,
    commentCount: comments.length,
    viewsCount,
    hasLiked,
    isSaved,
    isLiked: hasLiked,
  };
}

// Get reels feed for user (following + explore)
export async function getReelsFeed(
  userId: number,
  page: number = 1,
  limit: number = 10,
  type: 'following' | 'explore' | 'trending' = 'following'
): Promise<any[]> {
  // Try to get from cache first
  const cacheKey = `${CACHE_KEYS.REEL_FEED}${userId}:${type}:${page}`;
  const cached = await cacheGet<any[]>(cacheKey);
  if (cached) return cached;

  let reels: any[] = [];

  if (type === 'following') {
    // Get reels from followed users
    reels = await storage.getReels(userId, limit);
  } else if (type === 'trending') {
    // Get trending reel IDs from Redis
    const trendingIds = await getTrendingReels(limit);
    
    // Fetch reel details
    for (const id of trendingIds) {
      const reel = await getReelById(parseInt(id), userId);
      if (reel) reels.push(reel);
    }
  } else {
    // Explore - mix of trending and new reels
    reels = await storage.getReels(userId, limit);
  }

  // Enrich with user data and counts
  const enrichedReels = await Promise.all(
    reels.map(async (reel) => {
      if (!reel.user) {
        const user = await storage.getUser(reel.userId);
        reel.user = user;
      }
      
      // Get cached counts
      const cachedLikes = await getReelLikes(reel.id);
      const cachedViews = await getReelViews(reel.id);
      
      return {
        ...reel,
        likeCount: cachedLikes || reel.likeCount || 0,
        viewsCount: cachedViews.total || 0,
        isLiked: reel.hasLiked || false,
        isSaved: reel.isSaved || false,
      };
    })
  );

  // Cache the result
  await cacheSet(cacheKey, enrichedReels, CACHE_TTL.REEL_FEED);

  return enrichedReels;
}

// Like a reel
export async function likeReel(reelId: number, userId: number): Promise<boolean> {
  try {
    // Check if already liked
    const existingLike = await storage.getLike(userId, reelId);
    if (existingLike) return false;

    // Create like in DB
    await storage.likePost({ userId, postId: reelId });

    // Increment cached count
    await incrementReelLikes(reelId);

    // Update trending score (likes have weight of 3)
    const currentScore = await getReelLikes(reelId);
    await updateTrendingScore(reelId, currentScore * 3);

    // Invalidate feed caches
    await invalidateReelFeed(userId);

    return true;
  } catch (error) {
    console.error('Error liking reel:', error);
    return false;
  }
}

// Unlike a reel
export async function unlikeReel(reelId: number, userId: number): Promise<boolean> {
  try {
    // Remove like from DB
    await storage.unlikePost(userId, reelId);

    // Decrement cached count
    await decrementReelLikes(reelId);

    // Update trending score
    const currentScore = await getReelLikes(reelId);
    await updateTrendingScore(reelId, Math.max(0, currentScore * 3));

    return true;
  } catch (error) {
    console.error('Error unliking reel:', error);
    return false;
  }
}

// Record reel view
export async function recordReelView(reelId: number, userId: number): Promise<{ total: number; unique: boolean }> {
  // Increment view count in Redis
  const result = await incrementReelViews(reelId, userId);

  // Update trending score (views have weight of 1)
  const likes = await getReelLikes(reelId);
  const views = result.total;
  const score = views + (likes * 3);
  await updateTrendingScore(reelId, score);

  return result;
}

// Save a reel
export async function saveReel(reelId: number, userId: number): Promise<boolean> {
  try {
    const existingSave = await storage.getSavedPost(userId, reelId);
    if (existingSave) return false;

    await storage.savePost({ userId, postId: reelId });
    return true;
  } catch (error) {
    console.error('Error saving reel:', error);
    return false;
  }
}

// Unsave a reel
export async function unsaveReel(reelId: number, userId: number): Promise<boolean> {
  try {
    await storage.unsavePost(userId, reelId);
    return true;
  } catch (error) {
    console.error('Error unsaving reel:', error);
    return false;
  }
}

// Delete a reel
export async function deleteReel(reelId: number, userId: number): Promise<boolean> {
  try {
    const post = await storage.getPost(reelId);
    if (!post || post.userId !== userId) return false;

    // Delete from MinIO
    if (post.videoUrl) {
      const videoObjectName = post.videoUrl.split('/').slice(-2).join('/');
      await deleteFile(BUCKETS.REELS_VIDEOS, videoObjectName);
    }
    if (post.thumbnailUrl) {
      const thumbObjectName = post.thumbnailUrl.split('/').slice(-2).join('/');
      await deleteFile(BUCKETS.REELS_THUMBNAILS, thumbObjectName);
    }

    // Delete from DB
    await storage.deletePost(reelId);

    // Invalidate caches
    await invalidateReelFeed(userId);

    return true;
  } catch (error) {
    console.error('Error deleting reel:', error);
    return false;
  }
}

// Get user's reels
export async function getUserReels(userId: number, viewerId?: number): Promise<any[]> {
  const posts = await storage.getUserPosts(userId);
  const reels = posts.filter(p => p.category === 'reel' || p.videoUrl);

  return Promise.all(
    reels.map(async (reel) => {
      const user = await storage.getUser(reel.userId);
      const likes = await storage.getLikesForPost(reel.id);
      const comments = await storage.getCommentsForPost(reel.id);
      const hasLiked = viewerId ? !!(await storage.getLike(viewerId, reel.id)) : false;
      const isSaved = viewerId ? !!(await storage.getSavedPost(viewerId, reel.id)) : false;

      return {
        ...reel,
        user,
        likeCount: likes.length,
        commentCount: comments.length,
        hasLiked,
        isSaved,
        isLiked: hasLiked,
      };
    })
  );
}

// Calculate reel score for ranking
export function calculateReelScore(
  views: number,
  likes: number,
  comments: number,
  shares: number,
  completionRate: number,
  ageHours: number
): number {
  // Score formula: views*1 + likes*3 + comments*4 + shares*5 + completionRate*5 - agePenalty
  const baseScore = (views * 1) + (likes * 3) + (comments * 4) + (shares * 5);
  const completionBonus = completionRate * 5;
  const agePenalty = Math.min(ageHours * 0.1, 10); // Max 10 point penalty
  
  return Math.max(0, baseScore + completionBonus - agePenalty);
}

// Get trending hashtags from reels
export async function getTrendingHashtags(limit: number = 10): Promise<string[]> {
  // This would aggregate hashtags from recent reels
  // For now, return placeholder
  return ['#cricket', '#ipl', '#worldcup', '#sixers', '#wicket', '#century', '#bowling', '#batting', '#fielding', '#catch'];
}

export default {
  generateReelFilename,
  getVideoUploadUrl,
  getThumbnailUploadUrl,
  uploadReelVideo,
  uploadReelThumbnail,
  createReel,
  getReelById,
  getReelsFeed,
  likeReel,
  unlikeReel,
  recordReelView,
  saveReel,
  unsaveReel,
  deleteReel,
  getUserReels,
  calculateReelScore,
  getTrendingHashtags,
};
