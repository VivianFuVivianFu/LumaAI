/**
 * Advanced Caching Utilities
 * Provides in-memory and localStorage caching with TTL support
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds (default: 5 minutes)
  storage?: 'memory' | 'localStorage'; // Storage type (default: memory)
  prefix?: string; // Key prefix (default: 'luma_cache_')
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const DEFAULT_PREFIX = 'luma_cache_';

/**
 * In-memory cache storage
 */
const memoryCache = new Map<string, CacheEntry<any>>();

/**
 * Cache Manager Class
 */
export class CacheManager {
  private prefix: string;
  private defaultTTL: number;
  private storageType: 'memory' | 'localStorage';

  constructor(options: CacheOptions = {}) {
    this.prefix = options.prefix || DEFAULT_PREFIX;
    this.defaultTTL = options.ttl || DEFAULT_TTL;
    this.storageType = options.storage || 'memory';
  }

  /**
   * Get item from cache
   */
  get<T>(key: string): T | null {
    const fullKey = this.prefix + key;

    try {
      let entry: CacheEntry<T> | null = null;

      if (this.storageType === 'localStorage') {
        const stored = localStorage.getItem(fullKey);
        if (stored) {
          entry = JSON.parse(stored);
        }
      } else {
        entry = memoryCache.get(fullKey) || null;
      }

      if (!entry) {
        return null;
      }

      // Check if expired
      const now = Date.now();
      if (now - entry.timestamp > entry.ttl) {
        this.delete(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error('[Cache] Error getting item:', error);
      return null;
    }
  }

  /**
   * Set item in cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const fullKey = this.prefix + key;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    };

    try {
      if (this.storageType === 'localStorage') {
        localStorage.setItem(fullKey, JSON.stringify(entry));
      } else {
        memoryCache.set(fullKey, entry);
      }
    } catch (error) {
      console.error('[Cache] Error setting item:', error);
    }
  }

  /**
   * Delete item from cache
   */
  delete(key: string): void {
    const fullKey = this.prefix + key;

    try {
      if (this.storageType === 'localStorage') {
        localStorage.removeItem(fullKey);
      } else {
        memoryCache.delete(fullKey);
      }
    } catch (error) {
      console.error('[Cache] Error deleting item:', error);
    }
  }

  /**
   * Clear all cache entries with this prefix
   */
  clear(): void {
    try {
      if (this.storageType === 'localStorage') {
        const keys = Object.keys(localStorage);
        keys.forEach((key) => {
          if (key.startsWith(this.prefix)) {
            localStorage.removeItem(key);
          }
        });
      } else {
        const keys = Array.from(memoryCache.keys());
        keys.forEach((key) => {
          if (key.startsWith(this.prefix)) {
            memoryCache.delete(key);
          }
        });
      }
    } catch (error) {
      console.error('[Cache] Error clearing cache:', error);
    }
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Get or set pattern - fetch from cache or execute function
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = this.get<T>(key);
    if (cached !== null) {
      console.log(`[Cache] Hit: ${key}`);
      return cached;
    }

    console.log(`[Cache] Miss: ${key}`);

    // Execute fetch function
    const data = await fetchFn();

    // Store in cache
    this.set(key, data, ttl);

    return data;
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);

    try {
      if (this.storageType === 'localStorage') {
        const keys = Object.keys(localStorage);
        keys.forEach((key) => {
          if (key.startsWith(this.prefix) && regex.test(key)) {
            localStorage.removeItem(key);
          }
        });
      } else {
        const keys = Array.from(memoryCache.keys());
        keys.forEach((key) => {
          if (key.startsWith(this.prefix) && regex.test(key)) {
            memoryCache.delete(key);
          }
        });
      }
    } catch (error) {
      console.error('[Cache] Error invalidating pattern:', error);
    }
  }
}

/**
 * Default cache instances
 */
export const apiCache = new CacheManager({
  prefix: 'luma_api_',
  ttl: 5 * 60 * 1000, // 5 minutes
  storage: 'memory',
});

export const userCache = new CacheManager({
  prefix: 'luma_user_',
  ttl: 60 * 60 * 1000, // 1 hour
  storage: 'localStorage',
});

export const persistentCache = new CacheManager({
  prefix: 'luma_persist_',
  ttl: 24 * 60 * 60 * 1000, // 24 hours
  storage: 'localStorage',
});

/**
 * Cache hook for React components
 */
import { useCallback, useEffect, useState } from 'react';

export function useCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const cache = new CacheManager(options);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await cache.getOrSet(key, fetchFn, options.ttl);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [key]);

  const invalidate = useCallback(() => {
    cache.delete(key);
    loadData();
  }, [key, loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    invalidate,
    refetch: loadData,
  };
}

/**
 * Request deduplication - prevent multiple identical API calls
 */
const pendingRequests = new Map<string, Promise<any>>();

export async function dedupedFetch<T>(
  key: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  // Check if request is already in flight
  if (pendingRequests.has(key)) {
    console.log(`[Dedup] Reusing pending request: ${key}`);
    return pendingRequests.get(key)!;
  }

  // Create new request
  const promise = fetchFn().finally(() => {
    // Remove from pending when done
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, promise);
  return promise;
}

/**
 * Clear all caches
 */
export function clearAllCaches() {
  apiCache.clear();
  userCache.clear();
  persistentCache.clear();
  memoryCache.clear();
  console.log('[Cache] All caches cleared');
}

/**
 * Cache statistics
 */
export function getCacheStats() {
  const memorySize = memoryCache.size;
  const localStorageSize = Object.keys(localStorage).filter((key) =>
    key.startsWith('luma_')
  ).length;

  return {
    memory: {
      entries: memorySize,
      keys: Array.from(memoryCache.keys()),
    },
    localStorage: {
      entries: localStorageSize,
      keys: Object.keys(localStorage).filter((key) => key.startsWith('luma_')),
    },
  };
}
