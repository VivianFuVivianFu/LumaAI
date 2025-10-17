import Redis from 'ioredis';

/**
 * Redis Configuration for Caching and Job Coordination
 * Used for:
 * - Memory context caching (fast retrieval)
 * - Job queue coordination (optional, currently using Postgres)
 * - Rate limiting counters
 */

const redisConfig = {
  // Redis connection URL (from Railway or other provider)
  url: process.env.REDIS_URL || 'redis://localhost:6379',

  // Connection settings
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  connectTimeout: 5000,
  lazyConnect: false, // Connect immediately on startup

  // Retry strategy with exponential backoff
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    console.log(`Redis retry attempt ${times}, waiting ${delay}ms`);
    return delay;
  },

  // Reconnect on error strategy
  reconnectOnError(err: Error) {
    const targetErrors = ['READONLY', 'ECONNREFUSED'];
    if (targetErrors.some(targetError => err.message.includes(targetError))) {
      // Reconnect on specific errors
      return true;
    }
    return false;
  },
};

// Create Redis client
export const redisClient = new Redis(redisConfig.url, {
  maxRetriesPerRequest: redisConfig.maxRetriesPerRequest,
  enableReadyCheck: redisConfig.enableReadyCheck,
  connectTimeout: redisConfig.connectTimeout,
  lazyConnect: redisConfig.lazyConnect,
  retryStrategy: redisConfig.retryStrategy,
  reconnectOnError: redisConfig.reconnectOnError,
});

// Event handlers for monitoring
redisClient.on('connect', () => {
  console.log('🔗 Redis: Connecting...');
});

redisClient.on('ready', () => {
  console.log('✅ Redis: Connected and ready');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis error:', err.message);
});

redisClient.on('close', () => {
  console.log('🔌 Redis: Connection closed');
});

redisClient.on('reconnecting', (delay) => {
  console.log(`🔄 Redis: Reconnecting in ${delay}ms...`);
});

// Graceful shutdown handler
export const closeRedis = async (): Promise<void> => {
  try {
    await redisClient.quit();
    console.log('✅ Redis connection closed gracefully');
  } catch (error) {
    console.error('Error closing Redis connection:', error);
    redisClient.disconnect();
  }
};

// Test Redis connection (call on server startup)
export const testRedisConnection = async (): Promise<boolean> => {
  try {
    const response = await redisClient.ping();
    if (response === 'PONG') {
      console.log('✅ Redis connection test successful');
      return true;
    }
    console.error('❌ Redis connection test failed: unexpected response');
    return false;
  } catch (error) {
    console.error('❌ Redis connection test failed:', error);
    return false;
  }
};

// Check if Redis is available (non-throwing)
export const isRedisAvailable = async (): Promise<boolean> => {
  try {
    await redisClient.ping();
    return true;
  } catch {
    return false;
  }
};
