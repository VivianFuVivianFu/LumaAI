import { redisClient, isRedisAvailable } from '../../config/redis.config';

/**
 * Redis Cache Service
 *
 * Provides caching layer for memory system with:
 * - Fast context retrieval (reduce AI calls)
 * - TTL-based expiration
 * - Pattern-based invalidation
 * - Graceful fallback (cache unavailable = no error)
 */

export class RedisCacheService {
  /**
   * Get value from cache
   * Returns null if key doesn't exist or cache is unavailable
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!(await isRedisAvailable())) {
        return null;
      }

      const value = await redisClient.get(key);

      if (!value) {
        return null;
      }

      try {
        return JSON.parse(value) as T;
      } catch (parseError) {
        console.error(`Cache parse error for key ${key}:`, parseError);
        return null;
      }
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null; // Graceful fallback
    }
  }

  /**
   * Set value in cache with optional TTL
   * @param key Cache key
   * @param value Value to cache (will be JSON stringified)
   * @param ttlSeconds Time to live in seconds (optional)
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      if (!(await isRedisAvailable())) {
        return; // Silently skip if Redis unavailable
      }

      const serialized = JSON.stringify(value);

      if (ttlSeconds && ttlSeconds > 0) {
        await redisClient.setex(key, ttlSeconds, serialized);
      } else {
        await redisClient.set(key, serialized);
      }
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      // Don't throw - cache failures should be transparent
    }
  }

  /**
   * Delete a single key from cache
   */
  async del(key: string): Promise<void> {
    try {
      if (!(await isRedisAvailable())) {
        return;
      }

      await redisClient.del(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  /**
   * Delete multiple keys matching a pattern
   * Example: invalidatePattern('context:user123:*')
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      if (!(await isRedisAvailable())) {
        return 0;
      }

      const keys = await redisClient.keys(pattern);

      if (keys.length === 0) {
        return 0;
      }

      await redisClient.del(...keys);
      console.log(`✅ Invalidated ${keys.length} cache keys matching: ${pattern}`);
      return keys.length;
    } catch (error) {
      console.error(`Cache pattern invalidation error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Check if a key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (!(await isRedisAvailable())) {
        return false;
      }

      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists check error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get TTL (time to live) for a key
   * Returns -1 if key has no expiration, -2 if key doesn't exist
   */
  async getTTL(key: string): Promise<number> {
    try {
      if (!(await isRedisAvailable())) {
        return -2;
      }

      return await redisClient.ttl(key);
    } catch (error) {
      console.error(`Cache TTL check error for key ${key}:`, error);
      return -2;
    }
  }

  /**
   * Extend TTL for an existing key
   */
  async extendTTL(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      if (!(await isRedisAvailable())) {
        return false;
      }

      const result = await redisClient.expire(key, ttlSeconds);
      return result === 1;
    } catch (error) {
      console.error(`Cache TTL extension error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get multiple keys at once (more efficient than individual gets)
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      if (!(await isRedisAvailable())) {
        return keys.map(() => null);
      }

      const values = await redisClient.mget(...keys);

      return values.map(value => {
        if (!value) return null;
        try {
          return JSON.parse(value) as T;
        } catch {
          return null;
        }
      });
    } catch (error) {
      console.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  }

  /**
   * Set multiple keys at once with the same TTL
   */
  async mset(entries: { key: string; value: any }[], ttlSeconds?: number): Promise<void> {
    try {
      if (!(await isRedisAvailable())) {
        return;
      }

      // Use pipeline for efficiency
      const pipeline = redisClient.pipeline();

      for (const entry of entries) {
        const serialized = JSON.stringify(entry.value);
        if (ttlSeconds && ttlSeconds > 0) {
          pipeline.setex(entry.key, ttlSeconds, serialized);
        } else {
          pipeline.set(entry.key, serialized);
        }
      }

      await pipeline.exec();
    } catch (error) {
      console.error('Cache mset error:', error);
    }
  }

  /**
   * Increment a counter (useful for rate limiting)
   */
  async increment(key: string, amount: number = 1): Promise<number> {
    try {
      if (!(await isRedisAvailable())) {
        return 0;
      }

      return await redisClient.incrby(key, amount);
    } catch (error) {
      console.error(`Cache increment error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Decrement a counter
   */
  async decrement(key: string, amount: number = 1): Promise<number> {
    try {
      if (!(await isRedisAvailable())) {
        return 0;
      }

      return await redisClient.decrby(key, amount);
    } catch (error) {
      console.error(`Cache decrement error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    connected: boolean;
    keys_count: number;
    memory_used: string;
  }> {
    try {
      if (!(await isRedisAvailable())) {
        return {
          connected: false,
          keys_count: 0,
          memory_used: '0',
        };
      }

      const info = await redisClient.info('memory');
      const dbsize = await redisClient.dbsize();

      // Parse memory usage from info string
      const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
      const memoryUsed = memoryMatch ? memoryMatch[1] : 'unknown';

      return {
        connected: true,
        keys_count: dbsize,
        memory_used: memoryUsed,
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return {
        connected: false,
        keys_count: 0,
        memory_used: '0',
      };
    }
  }

  /**
   * Clear all cache (use with caution!)
   */
  async flushAll(): Promise<void> {
    try {
      if (!(await isRedisAvailable())) {
        return;
      }

      await redisClient.flushdb();
      console.log('⚠️ Cache flushed (all keys deleted)');
    } catch (error) {
      console.error('Cache flush error:', error);
    }
  }
}

// Export singleton instance
export const cacheService = new RedisCacheService();
