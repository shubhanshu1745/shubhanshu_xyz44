import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";

// Import services
import { searchService } from "../services/search-service";
import { recommendationService } from "../services/recommendation-service";
import { hashtagService } from "../services/hashtag-service";
import { contentReportService } from "../services/content-report-service";
import { contentModerationService } from "../services/content-moderation-service";
import { analyticsService } from "../services/analytics-service";

const router = Router();

// Middleware for authentication check
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

// Middleware for admin check
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !(req.user as { isAdmin?: boolean }).isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// Error handler wrapper
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// ==================== SEARCH API ====================

// Search content
router.get("/search", requireAuth, asyncHandler(async (req, res) => {
  const { q, type, category, location, sortBy } = req.query;
  const userId = (req.user as { id: number }).id;

  if (!q || typeof q !== "string") {
    return res.status(400).json({ error: "Search query required" });
  }

  const results = await searchService.search(
    q,
    userId,
    {
      contentType: type as "all" | "posts" | "users" | "hashtags" | "reels" | undefined,
      category: category as string | undefined,
      location: location as string | undefined,
      sortBy: sortBy as "relevance" | "recent" | "popular" | undefined
    }
  );

  res.json(results);
}));

// Search suggestions
router.get("/search/suggestions", requireAuth, asyncHandler(async (req, res) => {
  const { q } = req.query;
  const userId = (req.user as { id: number }).id;

  if (!q || typeof q !== "string") {
    return res.status(400).json({ error: "Query required" });
  }

  const suggestions = await searchService.getSearchSuggestions(q, userId);
  res.json(suggestions);
}));

// Trending searches
router.get("/search/trending", asyncHandler(async (req, res) => {
  const trending = await searchService.getTrendingSearches();
  res.json(trending);
}));

// ==================== RECOMMENDATIONS API ====================

// Get personalized feed
router.get("/feed/personalized", requireAuth, asyncHandler(async (req, res) => {
  const userId = (req.user as { id: number }).id;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;

  const feed = await recommendationService.getPersonalizedFeed(userId, limit, offset);
  res.json(feed);
}));

// Get explore content
router.get("/explore", requireAuth, asyncHandler(async (req, res) => {
  const userId = (req.user as { id: number }).id;
  const content = await recommendationService.getExploreContent(userId);
  res.json(content);
}));

// Get suggested users
router.get("/users/suggested", requireAuth, asyncHandler(async (req, res) => {
  const userId = (req.user as { id: number }).id;
  const limit = parseInt(req.query.limit as string) || 10;

  const suggestions = await recommendationService.getSuggestedUsers(userId, [], [], limit);
  res.json(suggestions);
}));

// Record engagement
router.post("/engagement", requireAuth, asyncHandler(async (req, res) => {
  const userId = (req.user as { id: number }).id;
  const { postId, type, duration } = req.body;

  await recommendationService.recordEngagement(userId, postId, type, duration);
  res.json({ success: true });
}));


// ==================== HASHTAGS API ====================

// Get trending hashtags
router.get("/hashtags/trending", asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const trending = await hashtagService.getTrendingHashtags(limit);
  res.json(trending);
}));

// Get popular hashtags
router.get("/hashtags/popular", asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 20;
  const popular = await hashtagService.getPopularHashtags(limit);
  res.json(popular);
}));

// Search hashtags
router.get("/hashtags/search", asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || typeof q !== "string") {
    return res.status(400).json({ error: "Query required" });
  }

  const results = await hashtagService.searchHashtags(q);
  res.json(results);
}));

// Get hashtag details
router.get("/hashtags/:name", asyncHandler(async (req, res) => {
  const hashtag = await hashtagService.getHashtagByName(req.params.name);
  if (!hashtag) {
    return res.status(404).json({ error: "Hashtag not found" });
  }
  res.json(hashtag);
}));

// Get posts for hashtag
router.get("/hashtags/:name/posts", asyncHandler(async (req, res) => {
  const hashtag = await hashtagService.getHashtagByName(req.params.name);
  if (!hashtag) {
    return res.status(404).json({ error: "Hashtag not found" });
  }

  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;
  const sortBy = req.query.sortBy as "recent" | "popular" || "recent";

  const posts = await hashtagService.getHashtagPosts(hashtag.id, limit, offset, sortBy);
  res.json(posts);
}));

// Get hashtag analytics
router.get("/hashtags/:name/analytics", requireAuth, asyncHandler(async (req, res) => {
  const hashtag = await hashtagService.getHashtagByName(req.params.name);
  if (!hashtag) {
    return res.status(404).json({ error: "Hashtag not found" });
  }

  const analytics = await hashtagService.getHashtagAnalytics(hashtag.id);
  res.json(analytics);
}));

// ==================== CONTENT REPORTS API ====================

// Create report
router.post("/reports", requireAuth, asyncHandler(async (req, res) => {
  const userId = (req.user as { id: number }).id;
  const { contentId, contentType, reason, description } = req.body;

  const report = await contentReportService.createReport(
    userId,
    contentId,
    contentType,
    reason,
    description
  );

  res.status(201).json(report);
}));

// Get report reasons
router.get("/reports/reasons", (req, res) => {
  const reasons = contentReportService.getReportReasons();
  res.json(reasons);
});

// Get my reports
router.get("/reports/mine", requireAuth, asyncHandler(async (req, res) => {
  const userId = (req.user as { id: number }).id;
  const reports = await contentReportService.getReportsByReporter(userId);
  res.json(reports);
}));

// Admin: Get moderation queue
router.get("/admin/reports", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const status = req.query.status as string || "pending";
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;

  const reports = await contentReportService.getModerationQueue(
    status as "pending" | "reviewed" | "resolved" | "dismissed",
    limit,
    offset
  );

  res.json(reports);
}));

// Admin: Review report
router.post("/admin/reports/:id/review", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const reportId = parseInt(req.params.id);
  const reviewerId = (req.user as { id: number }).id;
  const { status, notes } = req.body;

  const report = await contentReportService.reviewReport(
    reportId,
    reviewerId,
    status,
    notes
  );

  res.json(report);
}));

// Admin: Get report statistics
router.get("/admin/reports/stats", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const stats = await contentReportService.getReportStats();
  res.json(stats);
}));


// ==================== CONTENT MODERATION API ====================

// Pre-moderate content
router.post("/moderation/check", requireAuth, asyncHandler(async (req, res) => {
  const userId = (req.user as { id: number }).id;
  const { content, contentType } = req.body;

  const result = await contentModerationService.preModerate(userId, content, contentType);
  res.json(result);
}));

// Check rate limit
router.get("/moderation/rate-limit", requireAuth, (req, res) => {
  const userId = (req.user as { id: number }).id;
  const actionType = req.query.action as "posts" | "comments" | "messages" | "follows" | "likes";

  const result = contentModerationService.checkRateLimit(userId, actionType);
  res.json(result);
});

// Admin: Get moderation stats
router.get("/admin/moderation/stats", requireAuth, requireAdmin, (req, res) => {
  const stats = contentModerationService.getModerationStats();
  res.json(stats);
});

// Admin: Clear rate limits
router.post("/admin/moderation/clear-limits", requireAuth, requireAdmin, (req, res) => {
  const { userId } = req.body;
  const result = contentModerationService.clearRateLimits(userId);
  res.json(result);
});

// ==================== ANALYTICS API ====================

// Get user analytics
router.get("/analytics/user", requireAuth, asyncHandler(async (req, res) => {
  const userId = (req.user as { id: number }).id;
  const days = parseInt(req.query.days as string) || 30;

  const analytics = await analyticsService.getUserAnalytics(userId, days);
  res.json(analytics);
}));

// Get post analytics
router.get("/analytics/post/:id", requireAuth, asyncHandler(async (req, res) => {
  const postId = parseInt(req.params.id);
  const analytics = await analyticsService.getPostAnalytics(postId);
  res.json(analytics);
}));

// Get story analytics
router.get("/analytics/story/:id", requireAuth, asyncHandler(async (req, res) => {
  const storyId = parseInt(req.params.id);
  const analytics = await analyticsService.getStoryAnalytics(storyId);
  res.json(analytics);
}));

// Get content performance
router.get("/analytics/performance", requireAuth, asyncHandler(async (req, res) => {
  const userId = (req.user as { id: number }).id;
  const days = parseInt(req.query.days as string) || 30;

  const performance = await analyticsService.getContentPerformance(userId, days);
  res.json(performance);
}));

// Get social graph analytics
router.get("/analytics/social", requireAuth, asyncHandler(async (req, res) => {
  const userId = (req.user as { id: number }).id;
  const analytics = await analyticsService.getSocialGraphAnalytics(userId);
  res.json(analytics);
}));

// Get relationship growth
router.get("/analytics/growth", requireAuth, asyncHandler(async (req, res) => {
  const userId = (req.user as { id: number }).id;
  const days = parseInt(req.query.days as string) || 30;

  const growth = await analyticsService.getRelationshipGrowth(userId, days);
  res.json(growth);
}));

// Record profile visit
router.post("/analytics/profile-visit", requireAuth, (req, res) => {
  const visitorId = (req.user as { id: number }).id;
  const { profileUserId } = req.body;

  analyticsService.recordProfileVisit(profileUserId, visitorId);
  res.json({ success: true });
});

// ==================== ERROR HANDLING ====================

// Global error handler for this router
router.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Social API Error:", err);
  
  if (err.message.includes("not found")) {
    return res.status(404).json({ error: err.message });
  }
  
  if (err.message.includes("already")) {
    return res.status(409).json({ error: err.message });
  }
  
  if (err.message.includes("Invalid") || err.message.includes("required")) {
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({ error: "Internal server error" });
});

export default router;
