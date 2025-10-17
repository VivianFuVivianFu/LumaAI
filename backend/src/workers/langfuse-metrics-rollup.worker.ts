import { supabaseAdmin } from '../config/supabase.config';

/**
 * Langfuse Metrics Rollup Worker
 * Runs hourly to aggregate Langfuse evaluation data into insights_cache
 *
 * Schedule: Every hour (via cron or scheduler)
 */

interface UserMetrics {
  userId: string;
  avgContextFit: number;
  avgSafetyScore: number;
  avgToneAlignment: number;
  avgCostPerInteraction: number;
  totalCostUsd: number;
  totalInteractions: number;
  avgLatencyMs: number;
  nudgeAcceptanceRate: number;
  evaluationSummary: Record<string, any>;
}

export class LangfuseMetricsRollupWorker {
  /**
   * Run the rollup process
   */
  async run(): Promise<void> {
    console.log('[Langfuse Metrics Rollup] Starting...');

    const startTime = Date.now();

    try {
      // Get all active users (with activity in last 7 days)
      const activeUsers = await this.getActiveUsers();
      console.log(`[Langfuse Metrics Rollup] Processing ${activeUsers.length} active users`);

      for (const userId of activeUsers) {
        await this.rollupUserMetrics(userId, '7d');
        await this.rollupUserMetrics(userId, '30d');
      }

      const elapsed = Date.now() - startTime;
      console.log(
        `[Langfuse Metrics Rollup] Completed in ${elapsed}ms for ${activeUsers.length} users`
      );
    } catch (error) {
      console.error('[Langfuse Metrics Rollup] Error:', error);
      throw error;
    }
  }

  /**
   * Get list of active users (with evaluations in last 7 days)
   */
  private async getActiveUsers(): Promise<string[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await supabaseAdmin
      .from('langfuse_evaluations')
      .select('user_id')
      .gte('created_at', sevenDaysAgo.toISOString());

    if (error) {
      console.error('Failed to get active users:', error);
      return [];
    }

    // Get unique user IDs
    const uniqueUsers = [...new Set(data.map((row) => row.user_id))];
    return uniqueUsers;
  }

  /**
   * Rollup metrics for a single user and period
   */
  private async rollupUserMetrics(userId: string, period: '7d' | '30d'): Promise<void> {
    const metrics = await this.calculateMetrics(userId, period);

    if (!metrics) {
      return; // No data for this period
    }

    // Update or insert into insights_cache
    const periodStart = this.getPeriodStart(period);
    const periodEnd = new Date();

    const { error } = await supabaseAdmin.from('insights_cache').upsert(
      {
        user_id: userId,
        cache_period: period,
        period_start: periodStart.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0],
        langfuse_metrics: {
          avg_context_fit: metrics.avgContextFit,
          avg_safety_score: metrics.avgSafetyScore,
          avg_tone_alignment: metrics.avgToneAlignment,
          avg_cost_per_interaction: metrics.avgCostPerInteraction,
          total_cost_usd: metrics.totalCostUsd,
          total_interactions: metrics.totalInteractions,
          avg_latency_ms: metrics.avgLatencyMs,
          nudge_acceptance_rate: metrics.nudgeAcceptanceRate,
          evaluation_summary: metrics.evaluationSummary,
        },
        computed_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,cache_period',
      }
    );

    if (error) {
      console.error(`Failed to update insights_cache for user ${userId}:`, error);
    }
  }

  /**
   * Calculate aggregated metrics for a user over a period
   */
  private async calculateMetrics(userId: string, period: '7d' | '30d'): Promise<UserMetrics | null> {
    const since = this.getPeriodStart(period);

    // Get all evaluations for this period
    const { data: evaluations, error } = await supabaseAdmin
      .from('langfuse_evaluations')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', since.toISOString());

    if (error || !evaluations || evaluations.length === 0) {
      return null;
    }

    // Aggregate metrics
    const contextFitScores = evaluations
      .filter((e) => e.metric_name === 'context_fit' && e.metric_value !== null)
      .map((e) => e.metric_value);

    const safetyScores = evaluations
      .filter((e) => e.metric_name === 'safety_ok' && e.rubric_pass !== null)
      .map((e) => (e.rubric_pass ? 1 : 0));

    const toneAlignmentScores = evaluations
      .filter((e) => e.metric_name === 'tone_alignment' && e.metric_value !== null)
      .map((e) => e.metric_value);

    const costs = evaluations
      .filter((e) => e.cost_usd !== null)
      .map((e) => e.cost_usd);

    const latencies = evaluations
      .filter((e) => e.latency_ms !== null)
      .map((e) => e.latency_ms);

    // Calculate nudge acceptance rate
    const nudgeAcceptanceRate = await this.calculateNudgeAcceptanceRate(userId, since);

    // Build evaluation summary by pillar
    const evaluationSummary = this.buildEvaluationSummary(evaluations);

    // Get unique trace IDs to count interactions
    const uniqueTraces = new Set(evaluations.map((e) => e.trace_id));

    return {
      userId,
      avgContextFit: this.average(contextFitScores),
      avgSafetyScore: this.average(safetyScores),
      avgToneAlignment: this.average(toneAlignmentScores),
      avgCostPerInteraction: costs.length > 0 ? this.sum(costs) / uniqueTraces.size : 0,
      totalCostUsd: this.sum(costs),
      totalInteractions: uniqueTraces.size,
      avgLatencyMs: this.average(latencies),
      nudgeAcceptanceRate,
      evaluationSummary,
    };
  }

  /**
   * Calculate nudge acceptance rate
   */
  private async calculateNudgeAcceptanceRate(userId: string, since: Date): Promise<number> {
    const { data: nudges } = await supabaseAdmin
      .from('nudges')
      .select('shown_at, accepted_at')
      .eq('user_id', userId)
      .gte('created_at', since.toISOString())
      .not('shown_at', 'is', null);

    if (!nudges || nudges.length === 0) return 0;

    const acceptedCount = nudges.filter((n) => n.accepted_at !== null).length;
    return acceptedCount / nudges.length;
  }

  /**
   * Build evaluation summary grouped by pillar and metric
   */
  private buildEvaluationSummary(evaluations: any[]): Record<string, any> {
    const summary: Record<string, any> = {
      by_pillar: {},
      top_failures: [],
      top_successes: [],
    };

    // Group by pillar
    const byPillar: Record<string, any> = {};

    for (const eval of evaluations) {
      if (!byPillar[eval.pillar]) {
        byPillar[eval.pillar] = {
          total: 0,
          passed: 0,
          failed: 0,
          avg_score: 0,
          scores: [],
        };
      }

      byPillar[eval.pillar].total++;

      if (eval.rubric_pass !== null) {
        if (eval.rubric_pass) {
          byPillar[eval.pillar].passed++;
        } else {
          byPillar[eval.pillar].failed++;
        }
      }

      if (eval.metric_value !== null) {
        byPillar[eval.pillar].scores.push(eval.metric_value);
      }
    }

    // Calculate averages
    for (const pillar in byPillar) {
      const scores = byPillar[pillar].scores;
      byPillar[pillar].avg_score = scores.length > 0 ? this.average(scores) : 0;
      delete byPillar[pillar].scores; // Remove raw scores
    }

    summary.by_pillar = byPillar;

    // Find top failures (critical or high severity failures)
    summary.top_failures = evaluations
      .filter((e) => e.rubric_pass === false && ['critical', 'high'].includes(e.severity))
      .slice(0, 5)
      .map((e) => ({
        metric: e.metric_name,
        pillar: e.pillar,
        reason: e.reason,
      }));

    // Find top successes (high scores)
    summary.top_successes = evaluations
      .filter((e) => e.metric_value !== null && e.metric_value >= 0.9)
      .slice(0, 5)
      .map((e) => ({
        metric: e.metric_name,
        pillar: e.pillar,
        score: e.metric_value,
      }));

    return summary;
  }

  /**
   * Helper: Get period start date
   */
  private getPeriodStart(period: '7d' | '30d'): Date {
    const date = new Date();
    const days = period === '7d' ? 7 : 30;
    date.setDate(date.getDate() - days);
    return date;
  }

  /**
   * Helper: Calculate average
   */
  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return parseFloat((this.sum(numbers) / numbers.length).toFixed(3));
  }

  /**
   * Helper: Calculate sum
   */
  private sum(numbers: number[]): number {
    return numbers.reduce((acc, n) => acc + n, 0);
  }
}

// Export function to run the worker
export async function runLangfuseMetricsRollup(): Promise<void> {
  const worker = new LangfuseMetricsRollupWorker();
  await worker.run();
}

// If running as standalone script
if (require.main === module) {
  runLangfuseMetricsRollup()
    .then(() => {
      console.log('Langfuse metrics rollup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Langfuse metrics rollup failed:', error);
      process.exit(1);
    });
}
