/**
 * Memory System Configuration
 *
 * Feature flags and settings for the memory system.
 * Allows gradual rollout and safe toggling of features.
 */

export class MemoryConfig {
  /**
   * Master switch for entire memory system
   * If false, memory ingestion and retrieval return null/empty
   */
  static isSystemEnabled(): boolean {
    return process.env.MEMORY_SYSTEM_ENABLED !== 'false'; // Default: true
  }

  /**
   * Enable AI enrichment (sentiment, themes, tags, summary)
   * Adds 2-3s of AI processing per block (async)
   */
  static isEnrichmentEnabled(): boolean {
    return process.env.MEMORY_ENRICHMENT_ENABLED !== 'false'; // Default: true
  }

  /**
   * Enable OpenAI embedding generation
   * Adds 1-2s per block, required for semantic search
   */
  static isEmbeddingEnabled(): boolean {
    return process.env.MEMORY_EMBEDDING_ENABLED !== 'false'; // Default: true
  }

  /**
   * Enable relation detection between memories
   * EXPENSIVE: Can trigger multiple AI calls per block
   * Recommended: Start disabled, enable with rate limits
   */
  static isRelationsEnabled(): boolean {
    return process.env.MEMORY_RELATIONS_ENABLED === 'true'; // Default: false
  }

  /**
   * Enable context synthesis (AI-powered context summaries)
   * Adds 1-3s per retrieval (cached for performance)
   */
  static isSynthesisEnabled(): boolean {
    return process.env.MEMORY_SYNTHESIS_ENABLED !== 'false'; // Default: true
  }

  /**
   * Enable weekly summary generation
   * Runs async via cron or manual trigger
   */
  static isWeeklySummariesEnabled(): boolean {
    return process.env.MEMORY_WEEKLY_SUMMARIES_ENABLED !== 'false'; // Default: true
  }

  /**
   * Enable Langfuse tracing (adds latency)
   * Useful for debugging, disable for production performance
   */
  static isLangfuseEnabled(): boolean {
    return process.env.MEMORY_LANGFUSE_ENABLED === 'true'; // Default: false
  }

  /**
   * Cache TTL in seconds
   * Default: 3600 (1 hour)
   */
  static getCacheTTL(): number {
    return parseInt(process.env.MEMORY_CACHE_TTL_SECONDS || '3600', 10);
  }

  /**
   * Maximum number of context blocks to retrieve
   * Default: 10
   */
  static getMaxContextBlocks(): number {
    return parseInt(process.env.MEMORY_MAX_CONTEXT_BLOCKS || '10', 10);
  }

  /**
   * Minimum similarity threshold for semantic search (0.00-1.00)
   * Higher = more relevant but fewer results
   * Default: 0.75
   */
  static getSimilarityThreshold(): number {
    return parseFloat(process.env.MEMORY_SIMILARITY_THRESHOLD || '0.75');
  }

  /**
   * Relation detection rate limit (per hour per user)
   * Prevents excessive AI calls
   * Default: 5
   */
  static getRelationRateLimit(): number {
    return parseInt(process.env.MEMORY_RELATION_DETECTION_RATE_LIMIT || '5', 10);
  }

  /**
   * Batch size for enrichment processing
   * Default: 10
   */
  static getEnrichmentBatchSize(): number {
    return parseInt(process.env.MEMORY_ENRICHMENT_BATCH_SIZE || '10', 10);
  }

  /**
   * Fail fast mode: if true, throw errors instead of graceful fallback
   * Useful for development/testing, should be false in production
   * Default: false
   */
  static isFailFastEnabled(): boolean {
    return process.env.MEMORY_FAIL_FAST === 'true'; // Default: false
  }

  /**
   * Number of retry attempts for failed operations
   * Default: 3
   */
  static getRetryAttempts(): number {
    return parseInt(process.env.MEMORY_RETRY_ATTEMPTS || '3', 10);
  }

  /**
   * Backoff delay for retries in milliseconds
   * Default: 1000 (1 second)
   */
  static getRetryBackoffMs(): number {
    return parseInt(process.env.MEMORY_RETRY_BACKOFF_MS || '1000', 10);
  }

  /**
   * Worker configuration
   */
  static isWorkerEnabled(): boolean {
    return process.env.MEMORY_WORKER_ENABLED !== 'false'; // Default: true
  }

  static getWorkerPollIntervalMs(): number {
    return parseInt(process.env.MEMORY_WORKER_POLL_INTERVAL_MS || '1000', 10);
  }

  static getWorkerMaxConcurrentJobs(): number {
    return parseInt(process.env.MEMORY_WORKER_MAX_CONCURRENT_JOBS || '5', 10);
  }

  static getWorkerJobTimeoutMs(): number {
    return parseInt(process.env.MEMORY_WORKER_JOB_TIMEOUT_MS || '30000', 10);
  }

  static getWorkerHealthCheckIntervalMs(): number {
    return parseInt(process.env.MEMORY_WORKER_HEALTH_CHECK_INTERVAL_MS || '60000', 10);
  }

  /**
   * Get all config as object (useful for debugging)
   */
  static getAll(): Record<string, any> {
    return {
      system_enabled: this.isSystemEnabled(),
      enrichment_enabled: this.isEnrichmentEnabled(),
      embedding_enabled: this.isEmbeddingEnabled(),
      relations_enabled: this.isRelationsEnabled(),
      synthesis_enabled: this.isSynthesisEnabled(),
      weekly_summaries_enabled: this.isWeeklySummariesEnabled(),
      langfuse_enabled: this.isLangfuseEnabled(),
      cache_ttl_seconds: this.getCacheTTL(),
      max_context_blocks: this.getMaxContextBlocks(),
      similarity_threshold: this.getSimilarityThreshold(),
      relation_rate_limit: this.getRelationRateLimit(),
      enrichment_batch_size: this.getEnrichmentBatchSize(),
      fail_fast: this.isFailFastEnabled(),
      retry_attempts: this.getRetryAttempts(),
      retry_backoff_ms: this.getRetryBackoffMs(),
      worker_enabled: this.isWorkerEnabled(),
      worker_poll_interval_ms: this.getWorkerPollIntervalMs(),
      worker_max_concurrent_jobs: this.getWorkerMaxConcurrentJobs(),
      worker_job_timeout_ms: this.getWorkerJobTimeoutMs(),
      worker_health_check_interval_ms: this.getWorkerHealthCheckIntervalMs(),
    };
  }

  /**
   * Log configuration on startup
   */
  static logConfig(): void {
    console.log('\n🧠 Memory System Configuration:');
    console.log('================================');
    const config = this.getAll();
    Object.entries(config).forEach(([key, value]) => {
      const emoji = typeof value === 'boolean' ? (value ? '✅' : '❌') : '⚙️';
      console.log(`${emoji} ${key}: ${value}`);
    });
    console.log('================================\n');
  }
}
