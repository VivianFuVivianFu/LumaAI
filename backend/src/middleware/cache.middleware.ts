import { Request, Response, NextFunction } from 'express';

/**
 * Simple in-memory cache for response caching
 * For production, consider using Redis or similar
 */
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class ResponseCache {
  private cache: Map<string, CacheEntry> = new Map();

  /**
   * Generate cache key from request
   */
  private generateKey(req: Request): string {
    const userId = (req as any).userId || 'anonymous';
    const path = req.path;
    const query = JSON.stringify(req.query);
    return `${userId}:${path}:${query}`;
  }

  /**
   * Get cached response
   */
  get(req: Request): any | null {
    const key = this.generateKey(req);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set cached response
   */
  set(req: Request, data: any, ttl: number = 60000): void {
    const key = this.generateKey(req);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Invalidate cache for a user
   */
  invalidateUser(userId: string): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (key.startsWith(`${userId}:`)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Invalidate cache by pattern
   */
  invalidatePattern(pattern: string): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clean up expired entries (run periodically)
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Get cache stats
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export const responseCache = new ResponseCache();

/**
 * Cache middleware factory
 * @param ttl - Time to live in seconds (default: 60)
 * @param cacheCondition - Optional function to determine if response should be cached
 */
export function cacheMiddleware(
  ttl: number = 60,
  cacheCondition?: (req: Request, res: Response) => boolean
) {
  const ttlMs = ttl * 1000;

  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Check if response is cached
    const cachedData = responseCache.get(req);
    if (cachedData) {
      console.log(`[CACHE HIT] ${req.path}`);
      return res.json(cachedData);
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache response
    res.json = function (data: any) {
      // Check cache condition if provided
      if (cacheCondition && !cacheCondition(req, res)) {
        return originalJson(data);
      }

      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log(`[CACHE SET] ${req.path} (TTL: ${ttl}s)`);
        responseCache.set(req, data, ttlMs);
      }

      return originalJson(data);
    };

    next();
  };
}

/**
 * Cache invalidation middleware
 * Invalidates cache after mutations
 */
export function invalidateCacheMiddleware(pattern?: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).userId;

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to invalidate cache after successful mutation
    res.json = function (data: any) {
      // Only invalidate on successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        if (pattern) {
          console.log(`[CACHE INVALIDATE] Pattern: ${pattern}`);
          responseCache.invalidatePattern(pattern);
        } else if (userId) {
          console.log(`[CACHE INVALIDATE] User: ${userId}`);
          responseCache.invalidateUser(userId);
        }
      }

      return originalJson(data);
    };

    next();
  };
}

/**
 * Start cache cleanup interval (run every 5 minutes)
 */
export function startCacheCleanup(): void {
  setInterval(() => {
    console.log('[CACHE CLEANUP] Running...');
    responseCache.cleanup();
    console.log(`[CACHE CLEANUP] Complete. Current size: ${responseCache.getStats().size}`);
  }, 5 * 60 * 1000); // 5 minutes
}
