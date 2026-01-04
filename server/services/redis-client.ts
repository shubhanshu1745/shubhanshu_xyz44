import { createClient, RedisClientType } from 'redis';

// Redis Configuration
const redisConfig = {
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
};

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  REEL_FEED: 60,           // 1 minute
  LIKE_COUNT: 10,          // 10 seconds
  VIEW_COUNT: 10,          // 10 seconds
  TRENDING_REELS: 300,     // 5 minutes
  USER_FEED: 30,           // 30 seconds
  EXPLORE_FEED: 60,        // 1 minute
  REEL_METADATA: 300,      // 5 minutes
  MUSIC_TRENDING: 600,     // 10 minutes
} as const;

// Cache key prefixes
export const CACHE_KEYS = {
  REEL_FEED: 'reels:feed:user:',
  EXPLORE_FEED: 'reels:explore',
  TRENDING_REELS: 'reels:trending',
  REEL_LIKES: 'reels:likes:',
  REEL_VIEWS: 'reels:views:',
  REEL_COMMENTS: 'reels:comments:',
  REEL_METADATA: 'reels:meta:',
  USER_LIKED_REELS: 'user:liked:',
  USER_SAVED_REELS: 'user:saved:',
  TRENDING_MUSIC: 'music:trending',
  MUSIC_USAGE: 'music:usage:',
  HOT_REELS: 'reels:hot',
} as const;

let redisClient: RedisClientType | null = null;
let isConnected = false;

// Initialize Redis client
export async function initializeRedis(): Promise<RedisClientType> {
  if (redisClient && isConnected) {
    return redisClient;
  }

  redisClient = createClient(redisConfig);

  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
    isConnected = false;
  });

  redisClient.on('connect', () => {
    console.log('Redis connected');
    isConnected = true;
  });

  redisClient.on('disconnect', () => {
    console.log('Redis disconnected');
    isConnected = false;
  });

  try {
    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    throw error;
  }
}

// Get Redis client
export function getRedisClient(): RedisClientType | null {
  return redisClient;
}

// Check if Redis is connected
export function isRedisConnected(): boolean {
  return isConnected && redisClient !== null;
}

// Generic cache operations
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!isRedisConnected()) return null;
  
  try {
    const data = await redisClient!.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Redis GET error:', error);
    return null;
  }
}

export async function cacheSet(key: string, value: any, ttlSeconds: number): Promise<boolean> {
  if (!isRedisConnected()) return false;
  
  try {
    await redisClient!.setEx(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Redis SET error:', error);
    return false;
  }
}

export async function cacheDelete(key: string): Promise<boolean> {
  if (!isRedisConnected()) return false;
  
  try {
    await redisClient!.del(key);
    return true;
  } catch (error) {
    console.error('Redis DEL error:', error);
    return false;
  }
}

// Atomic increment for counters
export async function incrementCounter(key: string, ttlSeconds?: number): Promise<number> {
  if (!isRedisConnected()) return 0;
  
  try {
    const result = await redisClient!.incr(key);
    if (ttlSeconds) {
      await redisClient!.expire(key, ttlSeconds);
    }
    return result;
  } catch (error) {
    console.error('Redis INCR error:', error);
    return 0;
  }
}

export async function decrementCounter(key: string): Promise<number> {
  if (!isRedisConnected()) return 0;
  
  try {
    return await redisClient!.decr(key);
  } catch (error) {
    console.error('Redis DECR error:', error);
    return 0;
  }
}

export async function getCounter(key: string): Promise<number> {
  if (!isRedisConnected()) return 0;
  
  try {
    const value = await redisClient!.get(key);
    return value ? parseInt(value, 10) : 0;
  } catch (error) {
    console.error('Redis GET counter error:', error);
    return 0;
  }
}

// Sorted set operations for trending/ranking
export async function addToSortedSet(key: string, score: number, member: string): Promise<boolean> {
  if (!isRedisConnected()) return false;
  
  try {
    await redisClient!.zAdd(key, { score, value: member });
    return true;
  } catch (error) {
    console.error('Redis ZADD error:', error);
    return false;
  }
}

export async function incrementSortedSetScore(key: string, increment: number, member: string): Promise<number> {
  if (!isRedisConnected()) return 0;
  
  try {
    return await redisClient!.zIncrBy(key, increment, member);
  } catch (error) {
    console.error('Redis ZINCRBY error:', error);
    return 0;
  }
}

export async function getTopFromSortedSet(key: string, count: number): Promise<string[]> {
  if (!isRedisConnected()) return [];
  
  try {
    return await redisClient!.zRange(key, 0, count - 1, { REV: true });
  } catch (error) {
    console.error('Redis ZRANGE error:', error);
    return [];
  }
}

export async function getTopFromSortedSetWithScores(key: string, count: number): Promise<{ value: string; score: number }[]> {
  if (!isRedisConnected()) return [];
  
  try {
    return await redisClient!.zRangeWithScores(key, 0, count - 1, { REV: true });
  } catch (error) {
    console.error('Redis ZRANGE error:', error);
    return [];
  }
}

// Set operations for unique tracking (views, etc.)
export async function addToSet(key: string, member: string, ttlSeconds?: number): Promise<boolean> {
  if (!isRedisConnected()) return false;
  
  try {
    await redisClient!.sAdd(key, member);
    if (ttlSeconds) {
      await redisClient!.expire(key, ttlSeconds);
    }
    return true;
  } catch (error) {
    console.error('Redis SADD error:', error);
    return false;
  }
}

export async function isInSet(key: string, member: string): Promise<boolean> {
  if (!isRedisConnected()) return false;
  
  try {
    return await redisClient!.sIsMember(key, member);
  } catch (error) {
    console.error('Redis SISMEMBER error:', error);
    return false;
  }
}

export async function getSetSize(key: string): Promise<number> {
  if (!isRedisConnected()) return 0;
  
  try {
    return await redisClient!.sCard(key);
  } catch (error) {
    console.error('Redis SCARD error:', error);
    return 0;
  }
}

// Hash operations for reel metadata
export async function setHashField(key: string, field: string, value: string): Promise<boolean> {
  if (!isRedisConnected()) return false;
  
  try {
    await redisClient!.hSet(key, field, value);
    return true;
  } catch (error) {
    console.error('Redis HSET error:', error);
    return false;
  }
}

export async function getHashField(key: string, field: string): Promise<string | null> {
  if (!isRedisConnected()) return null;
  
  try {
    const value = await redisClient!.hGet(key, field);
    return value || null;
  } catch (error) {
    console.error('Redis HGET error:', error);
    return null;
  }
}

export async function getHash(key: string): Promise<Record<string, string>> {
  if (!isRedisConnected()) return {};
  
  try {
    return await redisClient!.hGetAll(key);
  } catch (error) {
    console.error('Redis HGETALL error:', error);
    return {};
  }
}

export async function incrementHashField(key: string, field: string, increment: number): Promise<number> {
  if (!isRedisConnected()) return 0;
  
  try {
    return await redisClient!.hIncrBy(key, field, increment);
  } catch (error) {
    console.error('Redis HINCRBY error:', error);
    return 0;
  }
}

// Reel-specific cache functions
export async function cacheReelFeed(userId: number, reels: any[]): Promise<boolean> {
  const key = `${CACHE_KEYS.REEL_FEED}${userId}`;
  return await cacheSet(key, reels, CACHE_TTL.REEL_FEED);
}

export async function getCachedReelFeed(userId: number): Promise<any[] | null> {
  const key = `${CACHE_KEYS.REEL_FEED}${userId}`;
  return await cacheGet<any[]>(key);
}

export async function invalidateReelFeed(userId: number): Promise<boolean> {
  const key = `${CACHE_KEYS.REEL_FEED}${userId}`;
  return await cacheDelete(key);
}

export async function incrementReelLikes(reelId: number): Promise<number> {
  const key = `${CACHE_KEYS.REEL_LIKES}${reelId}`;
  return await incrementCounter(key, CACHE_TTL.LIKE_COUNT);
}

export async function decrementReelLikes(reelId: number): Promise<number> {
  const key = `${CACHE_KEYS.REEL_LIKES}${reelId}`;
  return await decrementCounter(key);
}

export async function getReelLikes(reelId: number): Promise<number> {
  const key = `${CACHE_KEYS.REEL_LIKES}${reelId}`;
  return await getCounter(key);
}

export async function incrementReelViews(reelId: number, userId: number): Promise<{ total: number; unique: boolean }> {
  const viewKey = `${CACHE_KEYS.REEL_VIEWS}${reelId}`;
  const uniqueKey = `${CACHE_KEYS.REEL_VIEWS}${reelId}:unique`;
  
  // Check if user already viewed
  const alreadyViewed = await isInSet(uniqueKey, userId.toString());
  
  // Always increment total views
  const total = await incrementCounter(viewKey, 86400); // 24 hour TTL
  
  // Track unique view
  if (!alreadyViewed) {
    await addToSet(uniqueKey, userId.toString(), 86400);
  }
  
  return { total, unique: !alreadyViewed };
}

export async function getReelViews(reelId: number): Promise<{ total: number; unique: number }> {
  const viewKey = `${CACHE_KEYS.REEL_VIEWS}${reelId}`;
  const uniqueKey = `${CACHE_KEYS.REEL_VIEWS}${reelId}:unique`;
  
  const total = await getCounter(viewKey);
  const unique = await getSetSize(uniqueKey);
  
  return { total, unique };
}

// Trending reels
export async function updateTrendingScore(reelId: number, score: number): Promise<boolean> {
  return await addToSortedSet(CACHE_KEYS.TRENDING_REELS, score, reelId.toString());
}

export async function getTrendingReels(count: number = 20): Promise<string[]> {
  return await getTopFromSortedSet(CACHE_KEYS.TRENDING_REELS, count);
}

// Music trending
export async function incrementMusicUsage(musicId: number): Promise<number> {
  return await incrementSortedSetScore(CACHE_KEYS.TRENDING_MUSIC, 1, musicId.toString());
}

export async function getTrendingMusic(count: number = 20): Promise<string[]> {
  return await getTopFromSortedSet(CACHE_KEYS.TRENDING_MUSIC, count);
}

export default {
  initializeRedis,
  getRedisClient,
  isRedisConnected,
  cacheGet,
  cacheSet,
  cacheDelete,
  incrementCounter,
  decrementCounter,
  getCounter,
  addToSortedSet,
  incrementSortedSetScore,
  getTopFromSortedSet,
  getTopFromSortedSetWithScores,
  addToSet,
  isInSet,
  getSetSize,
  setHashField,
  getHashField,
  getHash,
  incrementHashField,
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
  CACHE_TTL,
  CACHE_KEYS,
};
