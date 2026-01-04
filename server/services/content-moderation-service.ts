import { 
  posts,
  comments,
  users,
  blockedUsers
} from "@shared/schema";
import { db } from "../db";
import { eq, and, desc, sql, gt, gte, lte } from "drizzle-orm";

export interface ModerationResult {
  isAllowed: boolean;
  flags: ModerationFlag[];
  score: number;
  action: "allow" | "flag" | "block" | "review";
  reason?: string;
}

export interface ModerationFlag {
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  matchedContent?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  reason?: string;
}

export interface SpamDetectionResult {
  isSpam: boolean;
  confidence: number;
  indicators: string[];
}

// In-memory rate limiting storage
const rateLimits = new Map<string, { count: number; resetAt: Date }>();

// Banned words and patterns (basic list - would be more comprehensive in production)
const BANNED_PATTERNS = [
  { pattern: /\b(spam|scam|fraud)\b/gi, type: "spam", severity: "medium" as const },
  { pattern: /\b(buy now|click here|free money)\b/gi, type: "spam", severity: "low" as const },
  { pattern: /https?:\/\/[^\s]+\.(ru|cn|tk)/gi, type: "suspicious_link", severity: "high" as const }
];

// Rate limit configurations
const RATE_LIMITS = {
  posts: { limit: 10, windowMs: 60 * 60 * 1000 }, // 10 posts per hour
  comments: { limit: 30, windowMs: 60 * 60 * 1000 }, // 30 comments per hour
  messages: { limit: 50, windowMs: 60 * 60 * 1000 }, // 50 messages per hour
  follows: { limit: 100, windowMs: 60 * 60 * 1000 }, // 100 follows per hour
  likes: { limit: 200, windowMs: 60 * 60 * 1000 } // 200 likes per hour
};

export class ContentModerationService {

  // Moderate text content
  moderateContent(content: string): ModerationResult {
    const flags: ModerationFlag[] = [];
    let totalScore = 0;

    // Check against banned patterns
    for (const banned of BANNED_PATTERNS) {
      const matches = content.match(banned.pattern);
      if (matches) {
        flags.push({
          type: banned.type,
          severity: banned.severity,
          description: `Detected ${banned.type} content`,
          matchedContent: matches[0]
        });
        
        // Add to score based on severity
        const severityScores = { low: 10, medium: 30, high: 60, critical: 100 };
        totalScore += severityScores[banned.severity];
      }
    }

    // Check for excessive caps (shouting)
    const capsRatio = this.getCapsRatio(content);
    if (capsRatio > 0.7 && content.length > 10) {
      flags.push({
        type: "excessive_caps",
        severity: "low",
        description: "Excessive use of capital letters"
      });
      totalScore += 5;
    }

    // Check for excessive repetition
    if (this.hasExcessiveRepetition(content)) {
      flags.push({
        type: "repetition",
        severity: "low",
        description: "Excessive character or word repetition"
      });
      totalScore += 10;
    }

    // Check for excessive links
    const linkCount = (content.match(/https?:\/\/[^\s]+/g) || []).length;
    if (linkCount > 3) {
      flags.push({
        type: "excessive_links",
        severity: "medium",
        description: "Too many links in content"
      });
      totalScore += 20;
    }

    // Determine action based on score
    let action: "allow" | "flag" | "block" | "review" = "allow";
    if (totalScore >= 100) {
      action = "block";
    } else if (totalScore >= 60) {
      action = "review";
    } else if (totalScore >= 30) {
      action = "flag";
    }

    return {
      isAllowed: action === "allow" || action === "flag",
      flags,
      score: totalScore,
      action,
      reason: flags.length > 0 ? flags[0].description : undefined
    };
  }

  // Check rate limit
  checkRateLimit(
    userId: number,
    actionType: keyof typeof RATE_LIMITS
  ): RateLimitResult {
    const config = RATE_LIMITS[actionType];
    const key = `${userId}:${actionType}`;
    const now = new Date();

    let limitData = rateLimits.get(key);

    // Reset if window expired
    if (!limitData || limitData.resetAt < now) {
      limitData = {
        count: 0,
        resetAt: new Date(now.getTime() + config.windowMs)
      };
    }

    // Check if limit exceeded
    if (limitData.count >= config.limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: limitData.resetAt,
        reason: `Rate limit exceeded for ${actionType}. Try again later.`
      };
    }

    // Increment count
    limitData.count++;
    rateLimits.set(key, limitData);

    return {
      allowed: true,
      remaining: config.limit - limitData.count,
      resetAt: limitData.resetAt
    };
  }

  // Detect spam
  detectSpam(content: string, userId: number): SpamDetectionResult {
    const indicators: string[] = [];
    let spamScore = 0;

    // Check for common spam patterns
    if (/\b(buy|sell|discount|offer|deal)\b/gi.test(content)) {
      indicators.push("commercial_language");
      spamScore += 20;
    }

    if (/\b(click|visit|check out)\b.*https?:\/\//gi.test(content)) {
      indicators.push("promotional_link");
      spamScore += 30;
    }

    if (/(.)\1{4,}/g.test(content)) {
      indicators.push("character_repetition");
      spamScore += 15;
    }

    if (/\b(\w+)\b(?:\s+\1){2,}/gi.test(content)) {
      indicators.push("word_repetition");
      spamScore += 20;
    }

    // Check for excessive emojis - simplified pattern for compatibility
    const emojiPattern = /[\uD83C-\uDBFF\uDC00-\uDFFF]/g;
    const emojiCount = (content.match(emojiPattern) || []).length / 2; // Surrogate pairs
    if (emojiCount > 10) {
      indicators.push("excessive_emojis");
      spamScore += 10;
    }

    // Check for all caps
    if (this.getCapsRatio(content) > 0.8 && content.length > 20) {
      indicators.push("all_caps");
      spamScore += 15;
    }

    const confidence = Math.min(spamScore / 100, 1);

    return {
      isSpam: confidence > 0.5,
      confidence,
      indicators
    };
  }


  // Check for duplicate content
  async checkDuplicateContent(
    userId: number,
    content: string,
    contentType: "post" | "comment"
  ): Promise<{ isDuplicate: boolean; originalId?: number }> {
    const contentHash = this.hashContent(content);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    if (contentType === "post") {
      const recentPosts = await db.select({ id: posts.id, content: posts.content })
        .from(posts)
        .where(and(
          eq(posts.userId, userId),
          gt(posts.createdAt, oneHourAgo)
        ))
        .limit(20);

      for (const post of recentPosts) {
        if (post.content && this.hashContent(post.content) === contentHash) {
          return { isDuplicate: true, originalId: post.id };
        }
      }
    } else {
      const recentComments = await db.select({ id: comments.id, content: comments.content })
        .from(comments)
        .where(and(
          eq(comments.userId, userId),
          gt(comments.createdAt, oneHourAgo)
        ))
        .limit(50);

      for (const comment of recentComments) {
        if (this.hashContent(comment.content) === contentHash) {
          return { isDuplicate: true, originalId: comment.id };
        }
      }
    }

    return { isDuplicate: false };
  }

  // Check user behavior patterns
  async analyzeUserBehavior(userId: number): Promise<{
    riskLevel: "low" | "medium" | "high";
    indicators: string[];
    recommendations: string[];
  }> {
    const indicators: string[] = [];
    const recommendations: string[] = [];
    let riskScore = 0;

    // Check account age
    const [user] = await db.select({ createdAt: users.createdAt })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user?.createdAt) {
      const accountAgeHours = (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60);
      if (accountAgeHours < 24) {
        indicators.push("new_account");
        riskScore += 20;
      }
    }

    // Check recent post frequency
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const [postCount] = await db.select({ count: sql<number>`count(*)` })
      .from(posts)
      .where(and(
        eq(posts.userId, userId),
        gt(posts.createdAt, oneHourAgo)
      ));

    if (Number(postCount?.count || 0) > 5) {
      indicators.push("high_post_frequency");
      riskScore += 15;
      recommendations.push("Consider rate limiting this user");
    }

    // Check recent comment frequency
    const [commentCount] = await db.select({ count: sql<number>`count(*)` })
      .from(comments)
      .where(and(
        eq(comments.userId, userId),
        gt(comments.createdAt, oneHourAgo)
      ));

    if (Number(commentCount?.count || 0) > 20) {
      indicators.push("high_comment_frequency");
      riskScore += 15;
      recommendations.push("Monitor comment activity");
    }

    // Determine risk level
    let riskLevel: "low" | "medium" | "high" = "low";
    if (riskScore >= 50) {
      riskLevel = "high";
    } else if (riskScore >= 25) {
      riskLevel = "medium";
    }

    return { riskLevel, indicators, recommendations };
  }

  // Filter inappropriate content
  filterContent(content: string): string {
    let filtered = content;

    // Replace banned words with asterisks
    for (const banned of BANNED_PATTERNS) {
      filtered = filtered.replace(banned.pattern, (match) => "*".repeat(match.length));
    }

    return filtered;
  }

  // Validate media URL
  validateMediaUrl(url: string): { isValid: boolean; reason?: string } {
    // Check for suspicious domains
    const suspiciousDomains = [".ru", ".cn", ".tk", ".ml", ".ga"];
    for (const domain of suspiciousDomains) {
      if (url.toLowerCase().includes(domain)) {
        return { isValid: false, reason: "Suspicious domain detected" };
      }
    }

    // Check for valid image/video extensions
    const validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".mp4", ".webm"];
    const hasValidExtension = validExtensions.some(ext => 
      url.toLowerCase().includes(ext)
    );

    if (!hasValidExtension && !url.includes("cloudinary") && !url.includes("amazonaws")) {
      return { isValid: false, reason: "Invalid media format" };
    }

    return { isValid: true };
  }


  // Pre-moderation check (before content is posted)
  async preModerate(
    userId: number,
    content: string,
    contentType: "post" | "comment"
  ): Promise<{
    allowed: boolean;
    reason?: string;
    flags: ModerationFlag[];
  }> {
    // Check rate limit
    const rateLimit = this.checkRateLimit(userId, contentType === "post" ? "posts" : "comments");
    if (!rateLimit.allowed) {
      return {
        allowed: false,
        reason: rateLimit.reason,
        flags: []
      };
    }

    // Check for duplicate content
    const duplicate = await this.checkDuplicateContent(userId, content, contentType);
    if (duplicate.isDuplicate) {
      return {
        allowed: false,
        reason: "Duplicate content detected. Please post something different.",
        flags: [{
          type: "duplicate",
          severity: "medium",
          description: "Duplicate content"
        }]
      };
    }

    // Moderate content
    const moderation = this.moderateContent(content);
    if (moderation.action === "block") {
      return {
        allowed: false,
        reason: "Content violates community guidelines",
        flags: moderation.flags
      };
    }

    // Check spam
    const spam = this.detectSpam(content, userId);
    if (spam.isSpam && spam.confidence > 0.8) {
      return {
        allowed: false,
        reason: "Content detected as spam",
        flags: [{
          type: "spam",
          severity: "high",
          description: "High confidence spam detection"
        }]
      };
    }

    return {
      allowed: true,
      flags: moderation.flags
    };
  }

  // Get moderation statistics
  getModerationStats(): {
    rateLimitsActive: number;
    bannedPatternsCount: number;
    rateLimitConfigs: typeof RATE_LIMITS;
  } {
    return {
      rateLimitsActive: rateLimits.size,
      bannedPatternsCount: BANNED_PATTERNS.length,
      rateLimitConfigs: RATE_LIMITS
    };
  }

  // Clear rate limits (for admin use)
  clearRateLimits(userId?: number): { cleared: number } {
    if (userId) {
      let cleared = 0;
      const keys = Array.from(rateLimits.keys());
      for (const key of keys) {
        if (key.startsWith(`${userId}:`)) {
          rateLimits.delete(key);
          cleared++;
        }
      }
      return { cleared };
    }

    const cleared = rateLimits.size;
    rateLimits.clear();
    return { cleared };
  }

  // Helper: Calculate caps ratio
  private getCapsRatio(text: string): number {
    const letters = text.replace(/[^a-zA-Z]/g, "");
    if (letters.length === 0) return 0;
    const caps = letters.replace(/[^A-Z]/g, "");
    return caps.length / letters.length;
  }

  // Helper: Check for excessive repetition
  private hasExcessiveRepetition(text: string): boolean {
    // Check for repeated characters (e.g., "aaaaaaa")
    if (/(.)\1{5,}/g.test(text)) return true;
    
    // Check for repeated words
    const words = text.toLowerCase().split(/\s+/);
    const wordCounts = new Map<string, number>();
    for (const word of words) {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    }
    
    const counts = Array.from(wordCounts.values());
    for (const count of counts) {
      if (count > 5 && words.length > 10) return true;
    }

    return false;
  }

  // Helper: Simple content hash for duplicate detection
  private hashContent(content: string): string {
    // Normalize content for comparison
    const normalized = content
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
    
    // Simple hash (in production, use a proper hash function)
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }
}

// Export singleton instance
export const contentModerationService = new ContentModerationService();
