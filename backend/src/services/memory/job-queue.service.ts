import { supabaseAdmin } from '../../config/supabase.config';

/**
 * Job Queue Service
 *
 * Manages async job processing for memory system using PostgreSQL
 * Alternative to Redis Queue (simpler, no external dependency)
 */

export interface MemoryJob {
  id: string;
  job_type: 'enrich_and_embed' | 'detect_relations' | 'synthesize_context' | 'weekly_summary';
  user_id: string;
  payload: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: number;
  attempts: number;
  max_attempts: number;
  error_message?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  processing_time_ms?: number;
}

export class JobQueueService {
  /**
   * Enqueue a new job for async processing
   *
   * @param jobType Type of job to run
   * @param userId User ID for the job
   * @param payload Job-specific data
   * @param priority Higher = processed first (default: 0)
   * @returns Job ID
   */
  async enqueue(
    jobType: MemoryJob['job_type'],
    userId: string,
    payload: any,
    priority: number = 0
  ): Promise<string> {
    try {
      const { data, error } = await supabaseAdmin
        .from('memory_jobs')
        .insert({
          job_type: jobType,
          user_id: userId,
          payload,
          priority,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Enqueued job: ${jobType} for user ${userId}`);
      return data.id;
    } catch (error) {
      console.error('Failed to enqueue job:', error);
      throw error;
    }
  }

  /**
   * Get next jobs to process
   * Ordered by priority DESC, then created_at ASC
   *
   * @param limit Maximum number of jobs to fetch
   * @returns Array of pending jobs
   */
  async getNextJobs(limit: number = 10): Promise<MemoryJob[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('memory_jobs')
        .select('*')
        .eq('status', 'pending')
        .lt('attempts', supabaseAdmin.sql`max_attempts`)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Failed to get next jobs:', error);
      return [];
    }
  }

  /**
   * Mark job as processing (claim it)
   */
  async markProcessing(jobId: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('memory_jobs')
        .update({
          status: 'processing',
          started_at: new Date().toISOString(),
        })
        .eq('id', jobId)
        .eq('status', 'pending'); // Only update if still pending (avoid race conditions)

      if (error) throw error;
    } catch (error) {
      console.error(`Failed to mark job ${jobId} as processing:`, error);
      throw error;
    }
  }

  /**
   * Mark job as completed
   */
  async markCompleted(jobId: string, processingTimeMs?: number): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('memory_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          processing_time_ms: processingTimeMs,
        })
        .eq('id', jobId);

      if (error) throw error;
    } catch (error) {
      console.error(`Failed to mark job ${jobId} as completed:`, error);
      throw error;
    }
  }

  /**
   * Mark job as failed
   * Increments attempts counter
   */
  async markFailed(jobId: string, errorMessage: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('memory_jobs')
        .update({
          status: 'failed',
          error_message: errorMessage,
          attempts: supabaseAdmin.sql`attempts + 1`,
        })
        .eq('id', jobId);

      if (error) throw error;
    } catch (error) {
      console.error(`Failed to mark job ${jobId} as failed:`, error);
      throw error;
    }
  }

  /**
   * Requeue a failed job (reset to pending for retry)
   * Only if attempts < max_attempts
   */
  async requeueFailed(jobId: string): Promise<boolean> {
    try {
      // Check if job can be retried
      const { data: job } = await supabaseAdmin
        .from('memory_jobs')
        .select('attempts, max_attempts')
        .eq('id', jobId)
        .single();

      if (!job || job.attempts >= job.max_attempts) {
        console.log(`Cannot requeue job ${jobId}: max attempts reached`);
        return false;
      }

      const { error } = await supabaseAdmin
        .from('memory_jobs')
        .update({
          status: 'pending',
          error_message: null,
          started_at: null,
        })
        .eq('id', jobId);

      if (error) throw error;

      console.log(`✅ Requeued job ${jobId} for retry`);
      return true;
    } catch (error) {
      console.error(`Failed to requeue job ${jobId}:`, error);
      return false;
    }
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<MemoryJob | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('memory_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Failed to get job ${jobId}:`, error);
      return null;
    }
  }

  /**
   * Get jobs for a specific user
   */
  async getUserJobs(userId: string, limit: number = 50): Promise<MemoryJob[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('memory_jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Failed to get jobs for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
  }> {
    try {
      const { data, error } = await supabaseAdmin.rpc('get_memory_job_stats');

      if (error) throw error;

      const stats = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        total: 0,
      };

      if (data) {
        data.forEach((row: any) => {
          const count = parseInt(row.count, 10);
          stats[row.status as keyof typeof stats] = count;
          stats.total += count;
        });
      }

      return stats;
    } catch (error) {
      console.error('Failed to get job stats:', error);
      return {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        total: 0,
      };
    }
  }

  /**
   * Clean up old completed jobs (older than 7 days)
   * Should be called periodically by cron or worker
   */
  async cleanupOldJobs(): Promise<number> {
    try {
      const { data, error } = await supabaseAdmin.rpc('cleanup_old_memory_jobs');

      if (error) throw error;

      const deletedCount = data || 0;
      if (deletedCount > 0) {
        console.log(`🧹 Cleaned up ${deletedCount} old completed jobs`);
      }

      return deletedCount;
    } catch (error) {
      console.error('Failed to cleanup old jobs:', error);
      return 0;
    }
  }

  /**
   * Cancel a pending job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('memory_jobs')
        .delete()
        .eq('id', jobId)
        .eq('status', 'pending'); // Only cancel if still pending

      if (error) throw error;

      console.log(`✅ Cancelled job ${jobId}`);
      return true;
    } catch (error) {
      console.error(`Failed to cancel job ${jobId}:`, error);
      return false;
    }
  }

  /**
   * Retry all failed jobs (admin function)
   */
  async retryAllFailed(): Promise<number> {
    try {
      const { data: failedJobs } = await supabaseAdmin
        .from('memory_jobs')
        .select('id, attempts, max_attempts')
        .eq('status', 'failed')
        .lt('attempts', supabaseAdmin.sql`max_attempts`);

      if (!failedJobs || failedJobs.length === 0) {
        return 0;
      }

      let retriedCount = 0;
      for (const job of failedJobs) {
        const success = await this.requeueFailed(job.id);
        if (success) retriedCount++;
      }

      console.log(`✅ Retried ${retriedCount} failed jobs`);
      return retriedCount;
    } catch (error) {
      console.error('Failed to retry all failed jobs:', error);
      return 0;
    }
  }

  /**
   * Get failed jobs (for monitoring/debugging)
   */
  async getFailedJobs(limit: number = 50): Promise<MemoryJob[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('memory_jobs')
        .select('*')
        .eq('status', 'failed')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get failed jobs:', error);
      return [];
    }
  }
}

// Export singleton instance
export const jobQueueService = new JobQueueService();
