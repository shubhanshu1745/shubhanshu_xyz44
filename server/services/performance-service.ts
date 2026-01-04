// Performance Optimization Service
// Handles caching, query optimization, and performance monitoring

// In-memory cache (would use Redis in production)
const cache = new Map<string, { data: unknown; expiresAt: Date }>();

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Tags for cache invalidation
}

export interface PerformanceMetrics {
  cacheHits: number;
  cacheMisses: number;
  averageResponseTime: number;
  activeConnections: number;
}

// Cache tag tracking
const cacheTags = new Map<string, Set<string>>(); // tag -> Set of cache keys

// Performance metrics
let metrics = {
  cacheHits: 0,
  cacheMisses: 0,
  totalResponseTime: 0,
  requestCount: 0
};

export class PerformanceService {
  // ==================== CACHING ====================

  // Get from cache
  get<T>(key: string): T | null {
    const cached = cache.get(key);
    
    if (!cached) {
      metrics.cacheMisses++;
      return null;
    }

    if (cached.expiresAt < new Date()) {
      cache.delete(key);
      metrics.cacheMisses++;
      return null;
    }

    metrics.cacheHits++;
    return cached.data as T;
  }

  // Set in cache
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const ttl = options.ttl || 300; // Default 5 minutes
    const expiresAt = new Date(Date.now() + ttl * 1000);

    cache.set(key, { data, expiresAt });

    // Track tags
    if (options.tags) {
      for (const tag of options.tags) {
        if (!cacheTags.has(tag)) {
          cacheTags.set(tag, new Set());
        }
        cacheTags.get(tag)!.add(key);
      }
    }
  }

  // Delete from cache
  delete(key: string): boolean {
    return cache.delete(key);
  }

  // Invalidate by tag
  invalidateByTag(tag: string): number {
    const keys = cacheTags.get(tag);
    if (!keys) return 0;

    let invalidated = 0;
    const keyArray = Array.from(keys);
    for (const key of keyArray) {
      if (cache.delete(key)) {
        invalidated++;
      }
    }

    cacheTags.delete(tag);
    return invalidated;
  }

  // Clear all cache
  clearCache(): number {
    const size = cache.size;
    cache.clear();
    cacheTags.clear();
    return size;
  }

  // Get cache stats
  getCacheStats(): { size: number; hitRate: number } {
    const total = metrics.cacheHits + metrics.cacheMisses;
    const hitRate = total > 0 ? (metrics.cacheHits / total) * 100 : 0;

    return {
      size: cache.size,
      hitRate: Math.round(hitRate * 100) / 100
    };
  }

  // ==================== QUERY OPTIMIZATION ====================

  // Generate optimized query hints
  getQueryHints(queryType: string): string[] {
    const hints: Record<string, string[]> = {
      feed: [
        "Use index on (user_id, created_at)",
        "Limit results with pagination",
        "Consider materialized view for hot data"
      ],
      search: [
        "Use full-text search index",
        "Implement search result caching",
        "Use trigram index for fuzzy matching"
      ],
      social_graph: [
        "Use index on (follower_id, following_id)",
        "Cache follower counts",
        "Use graph database for complex queries"
      ],
      analytics: [
        "Use time-series partitioning",
        "Pre-aggregate common metrics",
        "Use columnar storage for analytics"
      ]
    };

    return hints[queryType] || [];
  }

  // Suggest indexes for common queries
  getSuggestedIndexes(): { table: string; columns: string[]; reason: string }[] {
    return [
      {
        table: "posts",
        columns: ["user_id", "created_at"],
        reason: "Optimize feed queries"
      },
      {
        table: "follows",
        columns: ["follower_id", "status"],
        reason: "Optimize following list queries"
      },
      {
        table: "follows",
        columns: ["following_id", "status"],
        reason: "Optimize follower list queries"
      },
      {
        table: "likes",
        columns: ["post_id"],
        reason: "Optimize like count queries"
      },
      {
        table: "comments",
        columns: ["post_id", "created_at"],
        reason: "Optimize comment loading"
      },
      {
        table: "notifications",
        columns: ["user_id", "is_read", "created_at"],
        reason: "Optimize notification queries"
      }
    ];
  }


  // ==================== PERFORMANCE MONITORING ====================

  // Record response time
  recordResponseTime(timeMs: number): void {
    metrics.totalResponseTime += timeMs;
    metrics.requestCount++;
  }

  // Get performance metrics
  getMetrics(): PerformanceMetrics {
    const avgResponseTime = metrics.requestCount > 0
      ? metrics.totalResponseTime / metrics.requestCount
      : 0;

    return {
      cacheHits: metrics.cacheHits,
      cacheMisses: metrics.cacheMisses,
      averageResponseTime: Math.round(avgResponseTime * 100) / 100,
      activeConnections: 0 // Would track actual connections
    };
  }

  // Reset metrics
  resetMetrics(): void {
    metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      totalResponseTime: 0,
      requestCount: 0
    };
  }

  // ==================== CACHE WARMING ====================

  // Warm cache for popular content
  async warmCache(
    fetchFn: () => Promise<{ key: string; data: unknown; ttl?: number }[]>
  ): Promise<number> {
    const items = await fetchFn();
    
    for (const item of items) {
      this.set(item.key, item.data, { ttl: item.ttl });
    }

    return items.length;
  }

  // ==================== LAZY LOADING HELPERS ====================

  // Create paginated response
  createPaginatedResponse<T>(
    items: T[],
    page: number,
    pageSize: number,
    total: number
  ): {
    items: T[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
  } {
    const totalPages = Math.ceil(total / pageSize);

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1
      }
    };
  }

  // Create cursor-based pagination response
  createCursorResponse<T extends { id: number }>(
    items: T[],
    limit: number
  ): {
    items: T[];
    cursor: {
      next: string | null;
      hasMore: boolean;
    };
  } {
    const hasMore = items.length > limit;
    const returnItems = hasMore ? items.slice(0, limit) : items;
    const lastItem = returnItems[returnItems.length - 1];

    return {
      items: returnItems,
      cursor: {
        next: hasMore && lastItem ? String(lastItem.id) : null,
        hasMore
      }
    };
  }

  // ==================== MEDIA OPTIMIZATION ====================

  // Get optimized image URL
  getOptimizedImageUrl(
    originalUrl: string,
    options: { width?: number; height?: number; quality?: number }
  ): string {
    // In production, this would integrate with a CDN or image service
    const params = new URLSearchParams();
    
    if (options.width) params.set("w", String(options.width));
    if (options.height) params.set("h", String(options.height));
    if (options.quality) params.set("q", String(options.quality));

    const separator = originalUrl.includes("?") ? "&" : "?";
    return `${originalUrl}${separator}${params.toString()}`;
  }

  // Get responsive image srcset
  getResponsiveSrcSet(originalUrl: string): string {
    const widths = [320, 640, 960, 1280, 1920];
    
    return widths
      .map(w => `${this.getOptimizedImageUrl(originalUrl, { width: w })} ${w}w`)
      .join(", ");
  }

  // ==================== CONNECTION POOLING ====================

  // Get connection pool stats (placeholder)
  getConnectionPoolStats(): {
    active: number;
    idle: number;
    waiting: number;
    max: number;
  } {
    // Would integrate with actual database pool
    return {
      active: 0,
      idle: 10,
      waiting: 0,
      max: 20
    };
  }

  // ==================== CLEANUP ====================

  // Clean expired cache entries
  cleanExpiredCache(): number {
    const now = new Date();
    let cleaned = 0;

    const keys = Array.from(cache.keys());
    for (const key of keys) {
      const entry = cache.get(key);
      if (entry && entry.expiresAt < now) {
        cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  // Run periodic cleanup
  startCleanupInterval(intervalMs: number = 60000): NodeJS.Timeout {
    return setInterval(() => {
      this.cleanExpiredCache();
    }, intervalMs);
  }
}

// Export singleton instance
export const performanceService = new PerformanceService();
