import { Storage } from '../storage';
import * as crypto from 'crypto';
import path from 'path';
import fs from 'fs';

export interface HighlightClip {
  id: string;
  matchId: number;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  startTime: number; // timestamp in seconds
  endTime: number; // timestamp in seconds
  tags: string[];
  created: Date;
  clipType: 'boundary' | 'wicket' | 'milestone' | 'catch' | 'other';
  views: number;
  likes: number;
  playerId?: number;
}

export interface HighlightPackage {
  id: string;
  matchId: number;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number; // in seconds
  created: Date;
  clips: HighlightClip[];
  status: 'generating' | 'ready' | 'failed';
  views: number;
}

export class HighlightService {
  private storage: Storage;
  private clips: Map<string, HighlightClip> = new Map();
  private packages: Map<string, HighlightPackage> = new Map();

  constructor(storage: Storage) {
    this.storage = storage;
    this.initializeDemoHighlights();
  }

  private initializeDemoHighlights() {
    // Add some demo highlight clips
    const demoClips: HighlightClip[] = [
      {
        id: crypto.randomUUID(),
        matchId: 1,
        title: 'Perfect Yorker by Bumrah',
        description: 'Jasprit Bumrah delivers a perfect yorker to dismiss the batsman',
        videoUrl: '/assets/highlights/bumrah-yorker.mp4',
        thumbnailUrl: '/assets/highlights/thumbnails/bumrah-yorker.jpg',
        startTime: 2345,
        endTime: 2360,
        tags: ['yorker', 'bumrah', 'wicket'],
        created: new Date(),
        clipType: 'wicket',
        views: 1243,
        likes: 342,
        playerId: 2
      },
      {
        id: crypto.randomUUID(),
        matchId: 1,
        title: 'Maxwell\'s massive six',
        description: 'Glenn Maxwell hits a massive six over long-on',
        videoUrl: '/assets/highlights/maxwell-six.mp4',
        thumbnailUrl: '/assets/highlights/thumbnails/maxwell-six.jpg',
        startTime: 3145,
        endTime: 3158,
        tags: ['six', 'maxwell', 'boundary'],
        created: new Date(),
        clipType: 'boundary',
        views: 2156,
        likes: 531,
        playerId: 8
      },
      {
        id: crypto.randomUUID(),
        matchId: 1,
        title: 'Kohli reaches century',
        description: 'Virat Kohli celebrates after reaching his 71st century',
        videoUrl: '/assets/highlights/kohli-century.mp4',
        thumbnailUrl: '/assets/highlights/thumbnails/kohli-century.jpg',
        startTime: 5230,
        endTime: 5250,
        tags: ['century', 'kohli', 'milestone'],
        created: new Date(),
        clipType: 'milestone',
        views: 5723,
        likes: 1237,
        playerId: 1
      }
    ];
    
    demoClips.forEach(clip => this.clips.set(clip.id, clip));
    
    // Create a sample highlight package
    const packageId = crypto.randomUUID();
    const highlightPackage: HighlightPackage = {
      id: packageId,
      matchId: 1,
      title: 'RCB vs MI Match Highlights',
      description: 'All the key moments from the thrilling match between Royal Challengers Bangalore and Mumbai Indians',
      videoUrl: '/assets/highlights/rcb-mi-highlights.mp4',
      thumbnailUrl: '/assets/highlights/thumbnails/rcb-mi.jpg',
      duration: 352, // 5:52 minutes
      created: new Date(),
      clips: demoClips,
      status: 'ready',
      views: 8792
    };
    
    this.packages.set(packageId, highlightPackage);
  }

  async getMatchHighlights(matchId: number): Promise<HighlightPackage | null> {
    const packages = Array.from(this.packages.values());
    return packages.find(p => p.matchId === matchId) || null;
  }

  async getHighlightClips(matchId: number, clipType?: string): Promise<HighlightClip[]> {
    let clips = Array.from(this.clips.values()).filter(clip => clip.matchId === matchId);
    
    if (clipType) {
      clips = clips.filter(clip => clip.clipType === clipType);
    }
    
    return clips;
  }

  async getHighlightClipsByPlayer(playerId: number): Promise<HighlightClip[]> {
    return Array.from(this.clips.values())
      .filter(clip => clip.playerId === playerId);
  }

  async createHighlightPackage(matchId: number, title: string, description: string): Promise<HighlightPackage> {
    const id = crypto.randomUUID();
    const clips = await this.getHighlightClips(matchId);
    
    const newPackage: HighlightPackage = {
      id,
      matchId,
      title,
      description,
      videoUrl: '',
      thumbnailUrl: '',
      duration: 0,
      created: new Date(),
      clips,
      status: 'generating',
      views: 0
    };
    
    this.packages.set(id, newPackage);
    
    // Simulate async generation process
    setTimeout(() => {
      this.completeHighlightGeneration(id);
    }, 5000);
    
    return newPackage;
  }
  
  private completeHighlightGeneration(packageId: string): void {
    const pkg = this.packages.get(packageId);
    if (!pkg) return;
    
    // Calculate total duration
    const totalDuration = pkg.clips.reduce((total, clip) => {
      return total + (clip.endTime - clip.startTime);
    }, 0);
    
    const updated: HighlightPackage = {
      ...pkg,
      status: 'ready',
      duration: totalDuration,
      videoUrl: `/assets/highlights/package-${packageId}.mp4`,
      thumbnailUrl: `/assets/highlights/thumbnails/package-${packageId}.jpg`
    };
    
    this.packages.set(packageId, updated);
  }

  async addClipToHighlights(matchId: number, clipData: Omit<HighlightClip, 'id' | 'created' | 'views' | 'likes'>): Promise<HighlightClip> {
    const id = crypto.randomUUID();
    const newClip: HighlightClip = {
      id,
      ...clipData,
      created: new Date(),
      views: 0,
      likes: 0
    };
    
    this.clips.set(id, newClip);
    
    // Also add to any existing package for this match
    const matchPackage = await this.getMatchHighlights(matchId);
    if (matchPackage) {
      matchPackage.clips.push(newClip);
      // Regenerate the package
      this.completeHighlightGeneration(matchPackage.id);
    }
    
    return newClip;
  }

  async incrementClipViews(clipId: string): Promise<HighlightClip | null> {
    const clip = this.clips.get(clipId);
    if (!clip) return null;
    
    clip.views += 1;
    this.clips.set(clipId, clip);
    return clip;
  }

  async likeClip(clipId: string): Promise<HighlightClip | null> {
    const clip = this.clips.get(clipId);
    if (!clip) return null;
    
    clip.likes += 1;
    this.clips.set(clipId, clip);
    return clip;
  }

  // AI-based highlight generation
  async generateHighlightsFromMatch(matchId: number, ballByBallData: any[]): Promise<HighlightPackage> {
    // In a real implementation, this would analyze ball-by-ball data to identify key moments
    // and automatically create a highlight package
    
    const title = `Match ${matchId} Highlights`;
    const description = `Automatically generated highlights from match ${matchId}`;
    
    return this.createHighlightPackage(matchId, title, description);
  }
}