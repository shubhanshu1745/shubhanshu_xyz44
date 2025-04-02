import { Storage } from '../storage';
import * as crypto from 'crypto';
import path from 'path';
import fs from 'fs';

export interface StoryFilter {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  previewUrl: string; // GIF or short video showing the filter in action
  category: 'team' | 'celebration' | 'stadium' | 'gameplay' | 'stats';
  teamId?: number; // Optional team association
  playerIds?: number[]; // Optional player association
  tournamentId?: number; // Optional tournament association
  settings?: {
    [key: string]: any;
  };
  usageCount: number;
  created: Date;
}

export interface StoryEffect {
  id: string;
  name: string;
  description: string;
  previewUrl: string;
  category: 'animation' | 'sound' | 'ar' | 'interactive';
  settings?: {
    [key: string]: any;
  };
  assetUrls: string[];
  usageCount: number;
  created: Date;
}

export interface LiveScore {
  id: string;
  matchId: number;
  format: string; // JSON data for displaying live score
  style: 'minimal' | 'detailed' | 'animated';
  usageCount: number;
}

export class StoryFiltersService {
  private storage: Storage;
  private filters: Map<string, StoryFilter> = new Map();
  private effects: Map<string, StoryEffect> = new Map();
  private liveScores: Map<string, LiveScore> = new Map();

  constructor(storage: Storage) {
    this.storage = storage;
    this.initializeDemoFilters();
  }

  private initializeDemoFilters() {
    // Create sample filters
    const sampleFilters: StoryFilter[] = [
      {
        id: crypto.randomUUID(),
        name: 'Golden Helmet',
        description: 'Add a golden cricket helmet to your selfies',
        imageUrl: '/assets/filters/golden-helmet.png',
        previewUrl: '/assets/filters/previews/golden-helmet.gif',
        category: 'gameplay',
        settings: {
          adjustPosition: true,
          applyShine: true
        },
        usageCount: 1245,
        created: new Date()
      },
      {
        id: crypto.randomUUID(),
        name: 'Stadium Crowd',
        description: 'Add a cheering stadium crowd background to your stories',
        imageUrl: '/assets/filters/stadium-crowd.png',
        previewUrl: '/assets/filters/previews/stadium-crowd.gif',
        category: 'stadium',
        settings: {
          crowdIntensity: 0.8,
          soundEnabled: true
        },
        usageCount: 876,
        created: new Date()
      },
      {
        id: crypto.randomUUID(),
        name: 'Team India',
        description: 'Show your support for Team India with face paint and jersey',
        imageUrl: '/assets/filters/team-india.png',
        previewUrl: '/assets/filters/previews/team-india.gif',
        category: 'team',
        teamId: 1,
        settings: {
          facePaintIntensity: 0.7,
          jerseyType: 'home'
        },
        usageCount: 3421,
        created: new Date()
      },
      {
        id: crypto.randomUUID(),
        name: 'Cricket Stats',
        description: 'Add your cricket stats to your stories',
        imageUrl: '/assets/filters/cricket-stats.png',
        previewUrl: '/assets/filters/previews/cricket-stats.gif',
        category: 'stats',
        settings: {
          statsPosition: 'bottom',
          statsStyle: 'modern',
          showBattingOnly: false
        },
        usageCount: 542,
        created: new Date()
      }
    ];
    
    sampleFilters.forEach(filter => this.filters.set(filter.id, filter));
    
    // Create sample effects
    const sampleEffects: StoryEffect[] = [
      {
        id: crypto.randomUUID(),
        name: 'Boundary Explosions',
        description: 'Add colorful explosions when you hit boundaries in your cricket videos',
        previewUrl: '/assets/effects/previews/boundary-explosions.gif',
        category: 'animation',
        settings: {
          explosionType: 'confetti',
          intensity: 0.8
        },
        assetUrls: [
          '/assets/effects/boundary-explosions/explosion1.png',
          '/assets/effects/boundary-explosions/explosion2.png',
          '/assets/effects/boundary-explosions/explosion3.png',
        ],
        usageCount: 987,
        created: new Date()
      },
      {
        id: crypto.randomUUID(),
        name: 'Stadium Sounds',
        description: 'Add authentic stadium sounds to your cricket stories',
        previewUrl: '/assets/effects/previews/stadium-sounds.gif',
        category: 'sound',
        settings: {
          volume: 0.7,
          ambience: 'full-stadium'
        },
        assetUrls: [
          '/assets/effects/stadium-sounds/crowd-cheer.mp3',
          '/assets/effects/stadium-sounds/applause.mp3',
          '/assets/effects/stadium-sounds/stadium-ambience.mp3',
        ],
        usageCount: 645,
        created: new Date()
      },
      {
        id: crypto.randomUUID(),
        name: 'AR Cricket Field',
        description: 'Place a mini cricket field in your room with AR',
        previewUrl: '/assets/effects/previews/ar-cricket-field.gif',
        category: 'ar',
        settings: {
          fieldSize: 'medium',
          includeStands: true
        },
        assetUrls: [
          '/assets/effects/ar-cricket-field/cricket-field.glb',
          '/assets/effects/ar-cricket-field/players.glb',
          '/assets/effects/ar-cricket-field/stands.glb',
        ],
        usageCount: 432,
        created: new Date()
      },
      {
        id: crypto.randomUUID(),
        name: 'Tap to Hit',
        description: 'Interactive effect where viewers can tap to hit a ball',
        previewUrl: '/assets/effects/previews/tap-to-hit.gif',
        category: 'interactive',
        settings: {
          difficulty: 'medium',
          soundEnabled: true
        },
        assetUrls: [
          '/assets/effects/tap-to-hit/ball.png',
          '/assets/effects/tap-to-hit/bat.png',
          '/assets/effects/tap-to-hit/hit-sound.mp3',
        ],
        usageCount: 1204,
        created: new Date()
      }
    ];
    
    sampleEffects.forEach(effect => this.effects.set(effect.id, effect));
    
    // Create sample live scores
    const sampleLiveScores: LiveScore[] = [
      {
        id: crypto.randomUUID(),
        matchId: 1,
        format: JSON.stringify({
          team1: 'Royal Challengers Bangalore',
          team1Score: '186/4',
          team2: 'Mumbai Indians',
          team2Score: '145/8',
          overs: '20.0',
          result: 'RCB won by 41 runs'
        }),
        style: 'minimal',
        usageCount: 324
      },
      {
        id: crypto.randomUUID(),
        matchId: 1,
        format: JSON.stringify({
          team1: 'Royal Challengers Bangalore',
          team1Score: '186/4',
          team1Overs: '20.0',
          team2: 'Mumbai Indians',
          team2Score: '145/8',
          team2Overs: '20.0',
          result: 'RCB won by 41 runs',
          topBatsman: 'Virat Kohli (82)',
          topBowler: 'Jasprit Bumrah (3/28)'
        }),
        style: 'detailed',
        usageCount: 467
      }
    ];
    
    sampleLiveScores.forEach(score => this.liveScores.set(score.id, score));
  }

  async getAllFilters(category?: string): Promise<StoryFilter[]> {
    let filters = Array.from(this.filters.values());
    
    if (category) {
      filters = filters.filter(filter => filter.category === category);
    }
    
    return filters;
  }

  async getFilterById(id: string): Promise<StoryFilter | null> {
    return this.filters.get(id) || null;
  }

  async getTeamFilters(teamId: number): Promise<StoryFilter[]> {
    return Array.from(this.filters.values())
      .filter(filter => filter.teamId === teamId);
  }

  async getAllEffects(category?: string): Promise<StoryEffect[]> {
    let effects = Array.from(this.effects.values());
    
    if (category) {
      effects = effects.filter(effect => effect.category === category);
    }
    
    return effects;
  }

  async getEffectById(id: string): Promise<StoryEffect | null> {
    return this.effects.get(id) || null;
  }

  async getLiveScoreTemplates(matchId?: number): Promise<LiveScore[]> {
    let scores = Array.from(this.liveScores.values());
    
    if (matchId) {
      scores = scores.filter(score => score.matchId === matchId);
    }
    
    return scores;
  }

  async createCustomFilter(filterData: Omit<StoryFilter, 'id' | 'usageCount' | 'created'>): Promise<StoryFilter> {
    const id = crypto.randomUUID();
    const newFilter: StoryFilter = {
      id,
      ...filterData,
      usageCount: 0,
      created: new Date()
    };
    
    this.filters.set(id, newFilter);
    return newFilter;
  }

  async createCustomEffect(effectData: Omit<StoryEffect, 'id' | 'usageCount' | 'created'>): Promise<StoryEffect> {
    const id = crypto.randomUUID();
    const newEffect: StoryEffect = {
      id,
      ...effectData,
      usageCount: 0,
      created: new Date()
    };
    
    this.effects.set(id, newEffect);
    return newEffect;
  }

  async incrementFilterUsage(filterId: string): Promise<StoryFilter | null> {
    const filter = this.filters.get(filterId);
    if (!filter) return null;
    
    filter.usageCount += 1;
    this.filters.set(filterId, filter);
    return filter;
  }

  async incrementEffectUsage(effectId: string): Promise<StoryEffect | null> {
    const effect = this.effects.get(effectId);
    if (!effect) return null;
    
    effect.usageCount += 1;
    this.effects.set(effectId, effect);
    return effect;
  }

  async createLiveScoreTemplate(matchId: number, format: string, style: 'minimal' | 'detailed' | 'animated'): Promise<LiveScore> {
    const id = crypto.randomUUID();
    const newScore: LiveScore = {
      id,
      matchId,
      format,
      style,
      usageCount: 0
    };
    
    this.liveScores.set(id, newScore);
    return newScore;
  }

  async applyFilterToImage(imageData: string, filterId: string): Promise<string> {
    // In a real implementation, this would apply image processing
    // For demo purposes, we'll just return the original image
    return imageData;
  }
}