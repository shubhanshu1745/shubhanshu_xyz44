import { v4 as uuidv4 } from 'uuid';
import minioClient, { BUCKETS, getPublicUrl, uploadFile, getPresignedUploadUrl } from './minio-client';
import redisClient, { incrementMusicUsage, getTrendingMusic, cacheGet, cacheSet, CACHE_TTL, CACHE_KEYS } from './redis-client';

// Music track interface
export interface MusicTrack {
  id: number;
  title: string;
  artist: string;
  audioUrl: string;
  duration: number;
  waveformData?: number[];
  coverUrl?: string;
  genre?: string;
  usageCount: number;
  isOriginal: boolean;
  createdBy?: number;
  createdAt: Date;
}

export interface MusicSearchResult {
  tracks: MusicTrack[];
  total: number;
  page: number;
  limit: number;
}

// In-memory music library (in production, this would be in the database)
const musicLibrary: Map<number, MusicTrack> = new Map();
let musicIdCounter = 1;

// Initialize with some sample tracks
function initializeMusicLibrary() {
  const sampleTracks: Omit<MusicTrack, 'id'>[] = [
    {
      title: 'Cricket Anthem',
      artist: 'Stadium Sounds',
      audioUrl: '/audio/cricket-anthem.mp3',
      duration: 30,
      genre: 'Sports',
      usageCount: 0,
      isOriginal: false,
      createdAt: new Date(),
    },
    {
      title: 'Victory March',
      artist: 'Champion Beats',
      audioUrl: '/audio/victory-march.mp3',
      duration: 45,
      genre: 'Celebration',
      usageCount: 0,
      isOriginal: false,
      createdAt: new Date(),
    },
    {
      title: 'Crowd Roar',
      artist: 'Stadium Ambience',
      audioUrl: '/audio/crowd-roar.mp3',
      duration: 20,
      genre: 'Ambient',
      usageCount: 0,
      isOriginal: false,
      createdAt: new Date(),
    },
    {
      title: 'Six Hit',
      artist: 'Cricket Beats',
      audioUrl: '/audio/six-hit.mp3',
      duration: 15,
      genre: 'Effects',
      usageCount: 0,
      isOriginal: false,
      createdAt: new Date(),
    },
    {
      title: 'Wicket Fall',
      artist: 'Cricket Beats',
      audioUrl: '/audio/wicket-fall.mp3',
      duration: 10,
      genre: 'Effects',
      usageCount: 0,
      isOriginal: false,
      createdAt: new Date(),
    },
  ];

  sampleTracks.forEach(track => {
    const id = musicIdCounter++;
    musicLibrary.set(id, { ...track, id });
  });
}

// Initialize on module load
initializeMusicLibrary();

// Get all music tracks
export async function getAllMusic(page: number = 1, limit: number = 20): Promise<MusicSearchResult> {
  const cacheKey = `${CACHE_KEYS.TRENDING_MUSIC}:all:${page}:${limit}`;
  const cached = await cacheGet<MusicSearchResult>(cacheKey);
  if (cached) return cached;

  const allTracks = Array.from(musicLibrary.values());
  const start = (page - 1) * limit;
  const tracks = allTracks.slice(start, start + limit);

  const result: MusicSearchResult = {
    tracks,
    total: allTracks.length,
    page,
    limit,
  };

  await cacheSet(cacheKey, result, CACHE_TTL.MUSIC_TRENDING);
  return result;
}

// Search music by title or artist
export async function searchMusic(query: string, page: number = 1, limit: number = 20): Promise<MusicSearchResult> {
  const lowerQuery = query.toLowerCase();
  const allTracks = Array.from(musicLibrary.values());
  
  const matchingTracks = allTracks.filter(track => 
    track.title.toLowerCase().includes(lowerQuery) ||
    track.artist.toLowerCase().includes(lowerQuery) ||
    (track.genre && track.genre.toLowerCase().includes(lowerQuery))
  );

  const start = (page - 1) * limit;
  const tracks = matchingTracks.slice(start, start + limit);

  return {
    tracks,
    total: matchingTracks.length,
    page,
    limit,
  };
}

// Get music by ID
export async function getMusicById(id: number): Promise<MusicTrack | null> {
  return musicLibrary.get(id) || null;
}

// Get trending music
export async function getTrendingMusicTracks(limit: number = 20): Promise<MusicTrack[]> {
  // Get trending IDs from Redis
  const trendingIds = await getTrendingMusic(limit);
  
  if (trendingIds.length > 0) {
    const tracks: MusicTrack[] = [];
    for (const id of trendingIds) {
      const track = musicLibrary.get(parseInt(id));
      if (track) tracks.push(track);
    }
    return tracks;
  }

  // Fallback to most used tracks
  const allTracks = Array.from(musicLibrary.values());
  return allTracks
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, limit);
}

// Get music by genre
export async function getMusicByGenre(genre: string, page: number = 1, limit: number = 20): Promise<MusicSearchResult> {
  const lowerGenre = genre.toLowerCase();
  const allTracks = Array.from(musicLibrary.values());
  
  const matchingTracks = allTracks.filter(track => 
    track.genre && track.genre.toLowerCase() === lowerGenre
  );

  const start = (page - 1) * limit;
  const tracks = matchingTracks.slice(start, start + limit);

  return {
    tracks,
    total: matchingTracks.length,
    page,
    limit,
  };
}

// Record music usage (when used in a reel)
export async function recordMusicUsage(musicId: number): Promise<void> {
  const track = musicLibrary.get(musicId);
  if (track) {
    track.usageCount++;
    musicLibrary.set(musicId, track);
  }
  
  // Update Redis trending
  await incrementMusicUsage(musicId);
}

// Upload original audio (extracted from reel or user uploaded)
export async function uploadOriginalAudio(
  userId: number,
  audioBuffer: Buffer,
  title: string,
  duration: number
): Promise<MusicTrack> {
  const objectName = `${userId}/${Date.now()}-${uuidv4().slice(0, 8)}.mp3`;
  await uploadFile(BUCKETS.MUSIC_LIBRARY, objectName, audioBuffer, 'audio/mpeg');
  
  const audioUrl = getPublicUrl(BUCKETS.MUSIC_LIBRARY, objectName);
  
  const id = musicIdCounter++;
  const track: MusicTrack = {
    id,
    title,
    artist: 'Original Audio',
    audioUrl,
    duration,
    usageCount: 0,
    isOriginal: true,
    createdBy: userId,
    createdAt: new Date(),
  };

  musicLibrary.set(id, track);
  return track;
}

// Get user's original audio tracks
export async function getUserOriginalAudio(userId: number): Promise<MusicTrack[]> {
  const allTracks = Array.from(musicLibrary.values());
  return allTracks.filter(track => track.isOriginal && track.createdBy === userId);
}

// Get available genres
export function getAvailableGenres(): string[] {
  const genres = new Set<string>();
  musicLibrary.forEach(track => {
    if (track.genre) genres.add(track.genre);
  });
  return Array.from(genres);
}

// Generate waveform data (placeholder - in production would use audio analysis)
export function generateWaveformData(duration: number): number[] {
  const points = Math.min(100, Math.floor(duration * 2));
  return Array.from({ length: points }, () => Math.random() * 0.8 + 0.2);
}

export default {
  getAllMusic,
  searchMusic,
  getMusicById,
  getTrendingMusicTracks,
  getMusicByGenre,
  recordMusicUsage,
  uploadOriginalAudio,
  getUserOriginalAudio,
  getAvailableGenres,
  generateWaveformData,
};
