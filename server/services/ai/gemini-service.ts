/**
 * Gemini AI Service for CricSocial
 * 
 * This service integrates Google's Gemini AI for cricket-related features:
 * - Match predictions with win %, reasoning, and key factors
 * - Player analysis and trading cards
 * - Cricket meme generation
 * - Match emotion tracking
 * - Player avatar descriptions
 */

import { GoogleGenAI } from "@google/genai";

// Initialize Gemini AI client
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyDoMwVgvD-9gN-KaIE5_NSRKKUAxKSSloM";
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

/**
 * Match prediction input interface
 */
interface MatchPredictionInput {
  team1: string;
  team2: string;
  venue: string;
  date: string;
  format: string;
  weather?: string;
  team1Score?: string;
  team2Score?: string;
  tossWinner?: string;
  tossDecision?: string;
  pitchCondition?: string;
}

/**
 * Match prediction response interface
 */
interface MatchPredictionResponse {
  team1WinProbability: number;
  team2WinProbability: number;
  drawProbability: number;
  predictedWinner: string;
  winReason: string;
  keyFactors: string[];
  predictedScore: {
    team1: string;
    team2: string;
  };
  matchAnalysis: string;
}

/**
 * Generate AI-powered match prediction using Gemini
 */
export async function generateMatchPredictionWithGemini(matchData: MatchPredictionInput): Promise<MatchPredictionResponse> {
  const prompt = `You are an expert cricket analyst. Analyze the following cricket match and provide a detailed prediction.

Match Details:
- Team 1: ${matchData.team1}
- Team 2: ${matchData.team2}
- Venue: ${matchData.venue}
- Date: ${matchData.date}
- Format: ${matchData.format}
${matchData.weather ? `- Weather: ${matchData.weather}` : ''}
${matchData.team1Score ? `- ${matchData.team1} Current Score: ${matchData.team1Score}` : ''}
${matchData.team2Score ? `- ${matchData.team2} Current Score: ${matchData.team2Score}` : ''}
${matchData.tossWinner ? `- Toss Winner: ${matchData.tossWinner}` : ''}
${matchData.tossDecision ? `- Toss Decision: ${matchData.tossDecision}` : ''}
${matchData.pitchCondition ? `- Pitch Condition: ${matchData.pitchCondition}` : ''}

Provide your prediction in the following JSON format ONLY (no additional text):
{
  "team1WinProbability": <number between 0-100>,
  "team2WinProbability": <number between 0-100>,
  "drawProbability": <number between 0-100 for Test matches, 0 for limited overs>,
  "predictedWinner": "<team name>",
  "winReason": "<2-3 sentence explanation of why this team will win>",
  "keyFactors": [
    "<factor 1>",
    "<factor 2>",
    "<factor 3>",
    "<factor 4>",
    "<factor 5>"
  ],
  "predictedScore": {
    "team1": "<predicted score like 185/6 or 320/8>",
    "team2": "<predicted score like 170/10 or 295/10>"
  },
  "matchAnalysis": "<detailed 3-4 sentence analysis of the match>"
}

Consider these factors in your analysis:
1. Historical head-to-head records between the teams
2. Recent form of both teams
3. Venue statistics and conditions
4. Weather impact on the match
5. Key players and their current form
6. Format-specific strengths of each team
7. Home advantage if applicable`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const responseText = response.text || "";
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response");
    }

    const prediction = JSON.parse(jsonMatch[0]) as MatchPredictionResponse;
    
    // Validate and normalize probabilities
    const total = prediction.team1WinProbability + prediction.team2WinProbability + prediction.drawProbability;
    if (total > 0) {
      prediction.team1WinProbability = Math.round((prediction.team1WinProbability / total) * 100);
      prediction.team2WinProbability = Math.round((prediction.team2WinProbability / total) * 100);
      prediction.drawProbability = 100 - prediction.team1WinProbability - prediction.team2WinProbability;
    }

    return prediction;
  } catch (error) {
    console.error("Gemini API error:", error);
    throw error;
  }
}

/**
 * Player card generation input
 */
interface PlayerCardInput {
  name: string;
  country: string;
  role: string;
  battingStyle?: string;
  bowlingStyle?: string;
  stats?: {
    matches?: number;
    runs?: number;
    wickets?: number;
    average?: number;
    strikeRate?: number;
    economy?: number;
  };
}

/**
 * Generate AI-powered player trading card description
 */
export async function generatePlayerCardWithGemini(playerData: PlayerCardInput, style: string) {
  const prompt = `You are a creative designer for cricket trading cards. Create a unique trading card description for this player.

Player Details:
- Name: ${playerData.name}
- Country: ${playerData.country}
- Role: ${playerData.role}
${playerData.battingStyle ? `- Batting Style: ${playerData.battingStyle}` : ''}
${playerData.bowlingStyle ? `- Bowling Style: ${playerData.bowlingStyle}` : ''}
${playerData.stats ? `- Stats: ${JSON.stringify(playerData.stats)}` : ''}

Card Style: ${style}

Provide the card details in JSON format ONLY:
{
  "cardTitle": "<creative title for the card>",
  "cardRarity": "<Common/Uncommon/Rare/Epic/Legendary>",
  "cardDescription": "<2-3 sentence creative description>",
  "specialAbility": "<unique ability name based on player's strengths>",
  "abilityDescription": "<description of the special ability>",
  "attributes": {
    "batting": <1-100>,
    "bowling": <1-100>,
    "fielding": <1-100>,
    "leadership": <1-100>,
    "clutch": <1-100>
  },
  "cardValue": <estimated value 50-1000>,
  "flavorText": "<inspirational quote or fun fact about the player>"
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const responseText = response.text || "";
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response");
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Gemini API error for player card:", error);
    throw error;
  }
}

/**
 * Generate AI-powered cricket meme description
 */
export async function generateMemeWithGemini(prompt: string) {
  const memePrompt = `You are a cricket meme expert. Create a hilarious cricket meme based on this prompt: "${prompt}"

Provide the meme details in JSON format ONLY:
{
  "memeTitle": "<catchy title>",
  "topText": "<text for top of meme>",
  "bottomText": "<text for bottom of meme>",
  "memeDescription": "<description of the meme image>",
  "suggestedTemplate": "<suggested meme template like 'Drake', 'Distracted Boyfriend', 'Two Buttons', etc.>",
  "humorType": "<type of humor: sarcastic/wholesome/savage/relatable>",
  "targetAudience": "<cricket fans/IPL fans/test cricket purists/etc.>",
  "viralPotential": <1-10>
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: memePrompt,
    });

    const responseText = response.text || "";
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response");
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Gemini API error for meme:", error);
    throw error;
  }
}

/**
 * Generate AI-powered match emotion analysis
 */
export async function trackMatchEmotionsWithGemini(matchData: any) {
  const prompt = `You are a cricket match emotion analyst. Analyze the emotional journey of this cricket match.

Match Details:
- ${matchData.team1} vs ${matchData.team2}
- Venue: ${matchData.venue || 'Unknown'}
- Format: ${matchData.format || 'T20'}
${matchData.currentScore ? `- Current Score: ${matchData.currentScore}` : ''}
${matchData.matchSituation ? `- Match Situation: ${matchData.matchSituation}` : ''}

Provide emotional analysis in JSON format ONLY:
{
  "overallMood": "<Thrilling/Tense/One-sided/Exciting/Nail-biting>",
  "crowdSentiment": <0.0-1.0>,
  "team1FanMood": "<emotion>",
  "team2FanMood": "<emotion>",
  "keyMoments": [
    {
      "timestamp": "<time in match>",
      "event": "<what happened>",
      "dominantEmotion": "<emotion>",
      "emotionIntensity": <0.5-1.0>,
      "description": "<brief description>"
    }
  ],
  "emotionalHighlight": "<most emotional moment of the match>",
  "predictedFinish": "<how the match might end emotionally>",
  "memeWorthyMoments": ["<moment 1>", "<moment 2>"]
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const responseText = response.text || "";
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response");
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Gemini API error for emotions:", error);
    throw error;
  }
}

/**
 * Generate AI-powered player avatar description
 */
export async function generatePlayerAvatarWithGemini(playerData: any, style: string) {
  const prompt = `You are a creative artist specializing in cricket player avatars. Create a unique avatar description for this player.

Player: ${playerData.name}
Country: ${playerData.country || 'Unknown'}
Role: ${playerData.role || 'Cricketer'}
Style: ${style}

Provide avatar details in JSON format ONLY:
{
  "avatarTitle": "<creative title>",
  "visualDescription": "<detailed description of how the avatar should look>",
  "colorPalette": ["<color1>", "<color2>", "<color3>"],
  "pose": "<description of the pose>",
  "expression": "<facial expression>",
  "accessories": ["<accessory1>", "<accessory2>"],
  "background": "<background description>",
  "styleNotes": "<specific style notes for the ${style} style>",
  "signatureElement": "<unique element that represents this player>"
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const responseText = response.text || "";
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response");
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Gemini API error for avatar:", error);
    throw error;
  }
}

export default {
  generateMatchPredictionWithGemini,
  generatePlayerCardWithGemini,
  generateMemeWithGemini,
  trackMatchEmotionsWithGemini,
  generatePlayerAvatarWithGemini
};
