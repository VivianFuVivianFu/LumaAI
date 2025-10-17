import { jobQueueService, MemoryJob } from '../services/memory/job-queue.service';
import { memoryService } from '../services/memory/memory.service';
import { MemoryConfig } from '../config/memory.config';

/**
 * Memory Worker
 *
 * Background worker that processes async memory jobs
 * Runs as separate Railway service for safe isolation
 *
 * Job Types:
 * - enrich_and_embed: AI enrichment + OpenAI embedding
 * - detect_relations: Find connections between blocks
 * - synthesize_context: Generate context summaries (future)
 * - weekly_summary: Generate weekly insights
 */

export class MemoryWorker {
  private isRunning = false;
  private processingJobs = new Map<string, Promise<void>>();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private lastHealthCheck = Date.now();

  constructor() {
    // Graceful shutdown handlers
    process.on('SIGTERM', () => this.shutdown('SIGTERM'));
    process.on('SIGINT', () => this.shutdown('SIGINT'));
  }

  /**
   * Start the worker
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Worker already running');
      return;
    }

    if (!MemoryConfig.isWorkerEnabled()) {
      console.log('❌ Worker is disabled by config');
      return;
    }

    console.log('\n🚀 Memory Worker Starting...');
    console.log('================================');
    MemoryConfig.logConfig();

    this.isRunning = true;

    // Start health check
    this.startHealthCheck();

    // Start processing loop
    await this.processLoop();
  }

  /**
   * Main processing loop
   * Polls for jobs at configured interval
   */
  private async processLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        // Check if we can process more jobs
        const maxConcurrent = MemoryConfig.getWorkerMaxConcurrentJobs();
        const currentJobs = this.processingJobs.size;

        if (currentJobs >= maxConcurrent) {
          // Wait for a job to finish
          await this.sleep(MemoryConfig.getWorkerPollIntervalMs());
          continue;
        }

        // Get next jobs to process
        const jobsToFetch = maxConcurrent - currentJobs;
        const jobs = await jobQueueService.getNextJobs(jobsToFetch);

        if (jobs.length === 0) {
          // No jobs available, sleep and retry
          await this.sleep(MemoryConfig.getWorkerPollIntervalMs());
          continue;
        }

        // Process jobs concurrently
        for (const job of jobs) {
          this.processJob(job); // Fire and forget (tracked in processingJobs)
        }
      } catch (error) {
        console.error('❌ Process loop error:', error);
        await this.sleep(5000); // Wait longer on error
      }
    }

    // Wait for all jobs to complete before shutting down
    await this.waitForJobsToComplete();
    console.log('✅ Worker stopped gracefully');
  }

  /**
   * Process a single job
   */
  private async processJob(job: MemoryJob): Promise<void> {
    const startTime = Date.now();

    // Mark as processing
    try {
      await jobQueueService.markProcessing(job.id);
    } catch (error) {
      console.error(`Failed to mark job ${job.id} as processing:`, error);
      return; // Skip this job (likely race condition)
    }

    // Track processing promise
    const processingPromise = this.executeJob(job, startTime);
    this.processingJobs.set(job.id, processingPromise);

    // Cleanup after completion
    processingPromise
      .finally(() => {
        this.processingJobs.delete(job.id);
      })
      .catch(() => {}); // Already handled in executeJob
  }

  /**
   * Execute job with timeout and error handling
   */
  private async executeJob(job: MemoryJob, startTime: number): Promise<void> {
    const timeout = MemoryConfig.getWorkerJobTimeoutMs();

    try {
      // Execute with timeout
      await this.executeWithTimeout(job, timeout);

      // Mark as completed
      const processingTime = Date.now() - startTime;
      await jobQueueService.markCompleted(job.id, processingTime);

      console.log(`✅ Job completed: ${job.job_type} (${processingTime}ms)`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Job failed: ${job.job_type}`, errorMessage);

      // Mark as failed
      await jobQueueService.markFailed(job.id, errorMessage);

      // Retry if under max attempts
      if (job.attempts + 1 < job.max_attempts) {
        console.log(`🔄 Will retry job ${job.id} (attempt ${job.attempts + 1}/${job.max_attempts})`);
        await this.sleep(MemoryConfig.getRetryBackoffMs() * (job.attempts + 1)); // Exponential backoff
        await jobQueueService.requeueFailed(job.id);
      } else {
        console.log(`⛔ Job ${job.id} exceeded max attempts, will not retry`);
      }
    }
  }

  /**
   * Execute job with timeout
   */
  private async executeWithTimeout(job: MemoryJob, timeoutMs: number): Promise<void> {
    return Promise.race([
      this.executeJobByType(job),
      this.createTimeout(timeoutMs),
    ]);
  }

  /**
   * Execute job based on type
   */
  private async executeJobByType(job: MemoryJob): Promise<void> {
    console.log(`🔄 Processing job: ${job.job_type} (ID: ${job.id})`);

    switch (job.job_type) {
      case 'enrich_and_embed':
        await this.handleEnrichAndEmbed(job);
        break;

      case 'detect_relations':
        await this.handleDetectRelations(job);
        break;

      case 'synthesize_context':
        await this.handleSynthesizeContext(job);
        break;

      case 'weekly_summary':
        await this.handleWeeklySummary(job);
        break;

      default:
        throw new Error(`Unknown job type: ${job.job_type}`);
    }
  }

  /**
   * Handle enrich_and_embed job
   */
  private async handleEnrichAndEmbed(job: MemoryJob): Promise<void> {
    const { block_id } = job.payload;

    if (!block_id) {
      throw new Error('Missing block_id in payload');
    }

    await memoryService.enrichAndEmbedBlock(block_id);
  }

  /**
   * Handle detect_relations job
   */
  private async handleDetectRelations(job: MemoryJob): Promise<void> {
    const { block_id } = job.payload;

    if (!block_id) {
      throw new Error('Missing block_id in payload');
    }

    await memoryService.detectRelationsForBlock(block_id);
  }

  /**
   * Handle synthesize_context job (future)
   */
  private async handleSynthesizeContext(job: MemoryJob): Promise<void> {
    console.log('⚠️ synthesize_context not yet implemented');
    // Future: Pre-compute context for common queries
  }

  /**
   * Handle weekly_summary job
   */
  private async handleWeeklySummary(job: MemoryJob): Promise<void> {
    await memoryService.generateWeeklySummary(job.user_id);
  }

  /**
   * Create timeout promise
   */
  private createTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Job timeout after ${ms}ms`)), ms);
    });
  }

  /**
   * Sleep for ms
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Wait for all jobs to complete
   */
  private async waitForJobsToComplete(): Promise<void> {
    console.log(`⏳ Waiting for ${this.processingJobs.size} jobs to complete...`);
    await Promise.allSettled(Array.from(this.processingJobs.values()));
  }

  /**
   * Start health check interval
   */
  private startHealthCheck(): void {
    const interval = MemoryConfig.getWorkerHealthCheckIntervalMs();

    this.healthCheckInterval = setInterval(async () => {
      try {
        const stats = await jobQueueService.getStats();
        console.log('\n📊 Worker Health Check');
        console.log('======================');
        console.log(`⏰ Uptime: ${Math.floor((Date.now() - this.lastHealthCheck) / 1000)}s`);
        console.log(`🔄 Processing: ${this.processingJobs.size} jobs`);
        console.log(`📋 Queue Stats:`, stats);
        console.log('');

        this.lastHealthCheck = Date.now();

        // Cleanup old jobs periodically
        const cleaned = await jobQueueService.cleanupOldJobs();
        if (cleaned > 0) {
          console.log(`🧹 Cleaned up ${cleaned} old jobs`);
        }
      } catch (error) {
        console.error('❌ Health check error:', error);
      }
    }, interval);
  }

  /**
   * Graceful shutdown
   */
  private async shutdown(signal: string): Promise<void> {
    console.log(`\n⚠️ Received ${signal}, shutting down gracefully...`);

    // Stop accepting new jobs
    this.isRunning = false;

    // Stop health check
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Wait for current jobs to complete (with timeout)
    const shutdownTimeout = 30000; // 30 seconds
    const shutdownPromise = this.waitForJobsToComplete();

    await Promise.race([
      shutdownPromise,
      this.sleep(shutdownTimeout).then(() => {
        console.log('⚠️ Shutdown timeout reached, forcing exit');
      }),
    ]);

    console.log('✅ Worker shutdown complete');
    process.exit(0);
  }
}

// =====================================================
// START WORKER (if run directly)
// =====================================================

if (require.main === module) {
  const worker = new MemoryWorker();

  worker.start().catch((error) => {
    console.error('❌ Worker fatal error:', error);
    process.exit(1);
  });
}

export default MemoryWorker;
