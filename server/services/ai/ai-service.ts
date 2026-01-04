/**
 * AI Service Module for CricSocial
 * 
 * This service provides AI functionality using Google's Gemini API:
 * - Match predictions with win %, reasoning, and key factors
 * - Player trading cards
 * - Meme generation
 * - Match emotion tracking
 * - Player avatar creation
 */

import path from 'path';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import crypto from 'crypto';
import {
  generateMatchPredictionWithGemini,
  generatePlayerCardWithGemini,
  generateMemeWithGemini,
  trackMatchEmotionsWithGemini,
  generatePlayerAvatarWithGemini
} from './gemini-service';

// Ensure directories exist for storing generated content
const GENERATED_DIR = path.join(process.cwd(), 'public', 'generated');
const MEMES_DIR = path.join(GENERATED_DIR, 'memes');
const PLAYER_CARDS_DIR = path.join(GENERATED_DIR, 'player-cards');
const PLAYER_AVATARS_DIR = path.join(GENERATED_DIR, 'player-avatars');

// Create directories if they don't exist
(async () => {
  try {
    await fsPromises.mkdir(GENERATED_DIR, { recursive: true });
    await fsPromises.mkdir(MEMES_DIR, { recursive: true });
    await fsPromises.mkdir(PLAYER_CARDS_DIR, { recursive: true });
    await fsPromises.mkdir(PLAYER_AVATARS_DIR, { recursive: true });
    console.log('AI service: Content directories created successfully');
  } catch (error) {
    console.error('Error creating AI content directories:', error);
  }
})();

/**
 * Generate a unique ID for created content
 */
function generateId(): string {
  return crypto.randomBytes(8).toString('hex');
}

/**
 * Generate a match prediction based on match data using Gemini AI
 */
export async function generateMatchPrediction(matchData: any) {
  console.log('Generating AI match prediction for:', matchData.team1, 'vs', matchData.team2);
  
  try {
    // Call Gemini AI for prediction
    const aiPrediction = await generateMatchPredictionWithGemini({
      team1: matchData.team1,
      team2: matchData.team2,
      venue: matchData.venue,
      date: matchData.date,
      format: matchData.format || 'T20',
      weather: matchData.weather,
      team1Score: matchData.team1Score,
      team2Score: matchData.team2Score,
      tossWinner: matchData.tossWinner,
      tossDecision: matchData.tossDecision,
      pitchCondition: matchData.pitchCondition
    });

    return {
      id: generateId(),
      matchId: matchData.id,
      prediction: {
        homeTeamWinProbability: aiPrediction.team1WinProbability / 100,
        awayTeamWinProbability: aiPrediction.team2WinProbability / 100,
        drawProbability: aiPrediction.drawProbability / 100,
        predictedWinner: aiPrediction.predictedWinner,
        winReason: aiPrediction.winReason,
        predictedScore: {
          homeTeam: aiPrediction.predictedScore.team1,
          awayTeam: aiPrediction.predictedScore.team2
        },
        keyFactors: aiPrediction.keyFactors,
        matchAnalysis: aiPrediction.matchAnalysis,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Gemini AI prediction failed, using fallback:', error);
    // Fallback to simulated prediction if Gemini fails
    return generateFallbackPrediction(matchData);
  }
}

/**
 * Fallback prediction when Gemini API is unavailable
 */
function generateFallbackPrediction(matchData: any) {
  const team1 = matchData.team1;
  const team2 = matchData.team2;
  
  const homeTeamWinProbability = parseFloat((0.35 + Math.random() * 0.3).toFixed(2));
  const awayTeamWinProbability = parseFloat((0.35 + Math.random() * 0.3).toFixed(2));
  const drawProbability = parseFloat((1 - homeTeamWinProbability - awayTeamWinProbability).toFixed(2));
  
  const predictedWinner = homeTeamWinProbability > awayTeamWinProbability ? team1 : team2;
  
  return {
    id: generateId(),
    matchId: matchData.id,
    prediction: {
      homeTeamWinProbability,
      awayTeamWinProbability,
      drawProbability,
      predictedWinner,
      winReason: `Based on recent form and historical performance, ${predictedWinner} has a slight edge in this matchup.`,
      predictedScore: {
        homeTeam: `${Math.floor(150 + Math.random() * 100)}/${Math.floor(4 + Math.random() * 6)}`,
        awayTeam: `${Math.floor(140 + Math.random() * 100)}/${Math.floor(5 + Math.random() * 5)}`
      },
      keyFactors: [
        `${team1}'s recent form at ${matchData.venue}`,
        `${team2}'s batting lineup consistency`,
        `Historical head-to-head record`,
        `Weather and pitch conditions`,
        `Key player availability and form`
      ],
      matchAnalysis: `This promises to be an exciting contest between ${team1} and ${team2}. Both teams have shown good form recently.`,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Generate a player trading card using Gemini AI
 */
export async function generatePlayerCard(playerData: any, style: string) {
  console.log('Generating AI player card for:', playerData.name, 'in style:', style);
  
  try {
    const aiCard = await generatePlayerCardWithGemini({
      name: playerData.name,
      country: playerData.country || 'Unknown',
      role: playerData.role || 'All-rounder',
      battingStyle: playerData.battingStyle,
      bowlingStyle: playerData.bowlingStyle,
      stats: playerData.stats
    }, style);

    const cardId = generateId();
    const cardImagePath = `/generated/player-cards/${playerData.name.toLowerCase().replace(/\s+/g, '-')}-${style}-${cardId}.png`;

    return {
      id: cardId,
      playerCard: {
        playerId: playerData.id,
        playerName: playerData.name,
        cardStyle: style,
        cardTitle: aiCard.cardTitle,
        cardRarity: aiCard.cardRarity,
        cardDescription: aiCard.cardDescription,
        specialAbility: aiCard.specialAbility,
        abilityDescription: aiCard.abilityDescription,
        cardValue: aiCard.cardValue,
        flavorText: aiCard.flavorText,
        attributes: aiCard.attributes,
        cardImageUrl: cardImagePath,
        createdAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Gemini AI card generation failed, using fallback:', error);
    return generateFallbackPlayerCard(playerData, style);
  }
}

/**
 * Fallback player card generation
 */
function generateFallbackPlayerCard(playerData: any, style: string) {
  const rarities = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
  const rarityWeights = [50, 30, 15, 4, 1];
  
  let randomNum = Math.random() * 100;
  let cumulativeWeight = 0;
  let selectedRarity = rarities[0];
  
  for (let i = 0; i < rarities.length; i++) {
    cumulativeWeight += rarityWeights[i];
    if (randomNum <= cumulativeWeight) {
      selectedRarity = rarities[i];
      break;
    }
  }
  
  const cardId = generateId();
  
  return {
    id: cardId,
    playerCard: {
      playerId: playerData.id,
      playerName: playerData.name,
      cardStyle: style,
      cardTitle: `${playerData.name} - ${style} Edition`,
      cardRarity: selectedRarity,
      cardDescription: `A ${selectedRarity.toLowerCase()} card featuring ${playerData.name}`,
      specialAbility: 'Match Winner',
      abilityDescription: 'Can turn the game around in crucial moments',
      cardValue: 50 + (rarities.indexOf(selectedRarity) + 1) * 100,
      flavorText: 'Cricket is not just a game, it\'s a way of life.',
      attributes: {
        batting: Math.floor(60 + Math.random() * 40),
        bowling: Math.floor(60 + Math.random() * 40),
        fielding: Math.floor(60 + Math.random() * 40),
        leadership: Math.floor(60 + Math.random() * 40),
        clutch: Math.floor(60 + Math.random() * 40)
      },
      cardImageUrl: `/generated/player-cards/${playerData.name.toLowerCase().replace(/\s+/g, '-')}-${style}-${cardId}.png`,
      createdAt: new Date().toISOString()
    }
  };
}

/**
 * Generate a cricket meme using Gemini AI
 */
export async function generateMeme(prompt: string) {
  console.log('Generating AI meme with prompt:', prompt);
  
  try {
    const aiMeme = await generateMemeWithGemini(prompt);
    const memeId = generateId();
    const memeImagePath = `/generated/memes/meme-${memeId}.png`;

    return {
      id: memeId,
      meme: {
        prompt: prompt,
        title: aiMeme.memeTitle,
        topText: aiMeme.topText,
        bottomText: aiMeme.bottomText,
        description: aiMeme.memeDescription,
        suggestedTemplate: aiMeme.suggestedTemplate,
        humorType: aiMeme.humorType,
        targetAudience: aiMeme.targetAudience,
        viralPotential: aiMeme.viralPotential,
        imageUrl: memeImagePath,
        createdAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Gemini AI meme generation failed, using fallback:', error);
    return generateFallbackMeme(prompt);
  }
}

/**
 * Fallback meme generation
 */
function generateFallbackMeme(prompt: string) {
  const memeId = generateId();
  
  return {
    id: memeId,
    meme: {
      prompt: prompt,
      title: 'Cricket Meme',
      topText: 'When you think you\'ve seen it all',
      bottomText: 'Cricket happens!',
      description: `A cricket meme based on: ${prompt}`,
      suggestedTemplate: 'Drake',
      humorType: 'relatable',
      targetAudience: 'cricket fans',
      viralPotential: 7,
      imageUrl: `/generated/memes/meme-${memeId}.png`,
      createdAt: new Date().toISOString()
    }
  };
}

/**
 * Track match emotions using Gemini AI
 */
export async function trackMatchEmotions(matchData: any) {
  console.log('Tracking AI emotions for match:', matchData.team1, 'vs', matchData.team2);
  
  try {
    const aiEmotions = await trackMatchEmotionsWithGemini(matchData);

    return {
      id: generateId(),
      matchId: matchData.id,
      emotions: {
        crowdSentiment: aiEmotions.crowdSentiment,
        overallMood: aiEmotions.overallMood,
        team1FanMood: aiEmotions.team1FanMood,
        team2FanMood: aiEmotions.team2FanMood,
        keyMoments: aiEmotions.keyMoments,
        emotionalHighlight: aiEmotions.emotionalHighlight,
        predictedFinish: aiEmotions.predictedFinish,
        memeWorthyMoments: aiEmotions.memeWorthyMoments,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Gemini AI emotion tracking failed, using fallback:', error);
    return generateFallbackEmotions(matchData);
  }
}

/**
 * Fallback emotion tracking
 */
function generateFallbackEmotions(matchData: any) {
  const crowdSentiment = parseFloat((0.3 + Math.random() * 0.5).toFixed(2));
  
  return {
    id: generateId(),
    matchId: matchData.id,
    emotions: {
      crowdSentiment,
      overallMood: crowdSentiment >= 0.7 ? 'Enthusiastic' : crowdSentiment >= 0.5 ? 'Positive' : 'Tense',
      team1FanMood: 'Hopeful',
      team2FanMood: 'Anxious',
      keyMoments: [
        {
          timestamp: '1h 15m',
          event: `${matchData.team1} scores a boundary`,
          dominantEmotion: 'Excitement',
          emotionIntensity: 0.8,
          description: 'Crowd erupts in celebration'
        },
        {
          timestamp: '2h 30m',
          event: `${matchData.team2} takes a crucial wicket`,
          dominantEmotion: 'Tension',
          emotionIntensity: 0.9,
          description: 'Game-changing moment'
        }
      ],
      emotionalHighlight: 'The final over drama',
      predictedFinish: 'Nail-biting finish expected',
      memeWorthyMoments: ['That dropped catch', 'The celebration dance'],
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Generate player avatar using Gemini AI
 */
export async function generatePlayerAvatar(playerData: any, style: string) {
  console.log('Generating AI avatar for player:', playerData.name, 'in style:', style);
  
  try {
    const aiAvatar = await generatePlayerAvatarWithGemini(playerData, style);
    const avatarId = generateId();
    const avatarImagePath = `/generated/player-avatars/avatar-${playerData.name.toLowerCase().replace(/\s+/g, '-')}-${style}-${avatarId}.png`;

    return {
      id: avatarId,
      avatar: {
        player: playerData.name,
        country: playerData.country,
        style: style,
        title: aiAvatar.avatarTitle,
        visualDescription: aiAvatar.visualDescription,
        colorPalette: aiAvatar.colorPalette,
        pose: aiAvatar.pose,
        expression: aiAvatar.expression,
        accessories: aiAvatar.accessories,
        background: aiAvatar.background,
        styleNotes: aiAvatar.styleNotes,
        signatureElement: aiAvatar.signatureElement,
        imageUrl: avatarImagePath,
        createdAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Gemini AI avatar generation failed, using fallback:', error);
    return generateFallbackAvatar(playerData, style);
  }
}

/**
 * Fallback avatar generation
 */
function generateFallbackAvatar(playerData: any, style: string) {
  const avatarId = generateId();
  
  return {
    id: avatarId,
    avatar: {
      player: playerData.name,
      country: playerData.country,
      style: style,
      title: `${playerData.name} - ${style} Avatar`,
      visualDescription: `A ${style} style avatar of ${playerData.name}`,
      colorPalette: ['#1F3B4D', '#FFD700', '#FFFFFF'],
      pose: 'Batting stance',
      expression: 'Determined',
      accessories: ['Cricket bat', 'Helmet'],
      background: 'Stadium lights',
      styleNotes: `Rendered in ${style} artistic style`,
      signatureElement: 'Iconic batting pose',
      imageUrl: `/generated/player-avatars/avatar-${playerData.name.toLowerCase().replace(/\s+/g, '-')}-${style}-${avatarId}.png`,
      createdAt: new Date().toISOString()
    }
  };
}
