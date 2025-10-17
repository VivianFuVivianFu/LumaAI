import { supabaseAdmin } from '../config/supabase.config';
import { openaiService } from '../services/openai/openai.service';

/**
 * Langfuse Quality Evaluator Worker
 * Runs every 6 hours to sample failed evaluations and generate optimization hints
 *
 * Schedule: Every 6 hours (via cron or scheduler)
 */

interface FailureSample {
  traceId: string;
  pillar: string;
  action: string;
  metricName: string;
  reason: string;
  severity: string;
  timestamp: string;
}

interface QualityReport {
  period: string;
  totalFailures: number;
  criticalFailures: number;
  sampledFailures: FailureSample[];
  recommendations: string[];
  promptOptimizations: string[];
}

export class LangfuseQualityEvaluatorWorker {
  private readonly SAMPLE_SIZE = 20; // Sample 20 failures per run
  private readonly LOOKBACK_HOURS = 6; // Look back 6 hours

  /**
   * Run the quality evaluation process
   */
  async run(): Promise<QualityReport> {
    console.log('[Langfuse Quality Evaluator] Starting...');

    const startTime = Date.now();

    try {
      // 1. Sample failed evaluations from last 6 hours
      const failures = await this.sampleFailures();

      if (failures.length === 0) {
        console.log('[Langfuse Quality Evaluator] No failures found - skipping');
        return {
          period: `Last ${this.LOOKBACK_HOURS}h`,
          totalFailures: 0,
          criticalFailures: 0,
          sampledFailures: [],
          recommendations: [],
          promptOptimizations: [],
        };
      }

      console.log(`[Langfuse Quality Evaluator] Analyzing ${failures.length} failures`);

      // 2. Group failures by pattern
      const patterns = this.groupFailuresByPattern(failures);

      // 3. Generate recommendations using LLM
      const recommendations = await this.generateRecommendations(patterns);

      // 4. Generate prompt optimization suggestions
      const promptOptimizations = await this.generatePromptOptimizations(patterns);

      // 5. Save report
      await this.saveQualityReport({
        period: `Last ${this.LOOKBACK_HOURS}h`,
        totalFailures: failures.length,
        criticalFailures: failures.filter((f) => f.severity === 'critical').length,
        sampledFailures: failures.slice(0, 10), // Top 10 for report
        recommendations,
        promptOptimizations,
      });

      const elapsed = Date.now() - startTime;
      console.log(
        `[Langfuse Quality Evaluator] Completed in ${elapsed}ms with ${recommendations.length} recommendations`
      );

      return {
        period: `Last ${this.LOOKBACK_HOURS}h`,
        totalFailures: failures.length,
        criticalFailures: failures.filter((f) => f.severity === 'critical').length,
        sampledFailures: failures.slice(0, 10),
        recommendations,
        promptOptimizations,
      };
    } catch (error) {
      console.error('[Langfuse Quality Evaluator] Error:', error);
      throw error;
    }
  }

  /**
   * Sample failed evaluations from recent period
   */
  private async sampleFailures(): Promise<FailureSample[]> {
    const since = new Date();
    since.setHours(since.getHours() - this.LOOKBACK_HOURS);

    const { data, error } = await supabaseAdmin
      .from('langfuse_evaluations')
      .select('trace_id, pillar, action, metric_name, reason, metadata, created_at')
      .eq('rubric_pass', false)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .limit(this.SAMPLE_SIZE);

    if (error) {
      console.error('Failed to sample failures:', error);
      return [];
    }

    return (
      data?.map((row) => ({
        traceId: row.trace_id,
        pillar: row.pillar,
        action: row.action,
        metricName: row.metric_name,
        reason: row.reason || 'No reason provided',
        severity: row.metadata?.severity || 'medium',
        timestamp: row.created_at,
      })) || []
    );
  }

  /**
   * Group failures by pattern (pillar + metric)
   */
  private groupFailuresByPattern(failures: FailureSample[]): Map<string, FailureSample[]> {
    const patterns = new Map<string, FailureSample[]>();

    for (const failure of failures) {
      const key = `${failure.pillar}:${failure.metricName}`;
      if (!patterns.has(key)) {
        patterns.set(key, []);
      }
      patterns.get(key)!.push(failure);
    }

    return patterns;
  }

  /**
   * Generate recommendations using LLM
   */
  private async generateRecommendations(
    patterns: Map<string, FailureSample[]>
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // Convert patterns to analysis input
    const analysisInput: string[] = [];

    for (const [pattern, failures] of patterns.entries()) {
      const [pillar, metric] = pattern.split(':');
      const count = failures.length;
      const reasons = failures.map((f) => f.reason).slice(0, 3); // Sample 3 reasons

      analysisInput.push(
        `Pattern: ${pillar} - ${metric} (${count} failures)\n  Reasons: ${reasons.join('; ')}`
      );
    }

    if (analysisInput.length === 0) return [];

    // Use LLM to generate recommendations
    const prompt = `You are a quality analyst for an AI mental wellness app. Analyze these evaluation failures and provide 3-5 actionable recommendations to improve quality.

Failure Patterns:
${analysisInput.join('\n\n')}

Provide specific, actionable recommendations in bullet format. Focus on:
1. Prompt engineering improvements
2. Validation rule adjustments
3. User experience enhancements
4. Safety and privacy improvements

Keep each recommendation concise (1-2 sentences).`;

    try {
      const response = await openaiService.generateStructuredResponse(
        prompt,
        'You are an AI quality evaluator. Analyze the trace data and provide clear, actionable recommendations.',
        []
      );

      // Parse bullet points from response
      const lines = response.content.split('\n').filter((line: string) => line.trim().startsWith('-') || line.trim().match(/^\d+\./));

      return lines.map((line: string) => line.replace(/^[-\d.]+\s*/, '').trim());
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      return ['Unable to generate AI recommendations - manual review required'];
    }
  }

  /**
   * Generate prompt optimization suggestions
   */
  private async generatePromptOptimizations(
    patterns: Map<string, FailureSample[]>
  ): Promise<string[]> {
    const optimizations: string[] = [];

    // Focus on pillar-specific failures
    const pillarFailures: Record<string, number> = {};

    for (const [pattern, failures] of patterns.entries()) {
      const [pillar] = pattern.split(':');
      pillarFailures[pillar] = (pillarFailures[pillar] || 0) + failures.length;
    }

    // Generate optimizations for top 3 problematic pillars
    const topPillars = Object.entries(pillarFailures)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([pillar]) => pillar);

    for (const pillar of topPillars) {
      const pillarPatterns = Array.from(patterns.entries())
        .filter(([pattern]) => pattern.startsWith(pillar))
        .map(([pattern, failures]) => ({
          metric: pattern.split(':')[1],
          count: failures.length,
          reasons: failures.map((f) => f.reason).slice(0, 2),
        }));

      const prompt = `You are a prompt engineering expert. The "${pillar}" feature is failing these evaluation metrics:

${pillarPatterns.map((p) => `- ${p.metric}: ${p.count} failures (${p.reasons.join(', ')})`).join('\n')}

Suggest 1-2 specific prompt template improvements for the ${pillar} feature. Be concrete and actionable.`;

      try {
        const response = await openaiService.generateStructuredResponse(
          prompt,
          'You are a prompt engineering expert. Analyze the failures and provide concrete, actionable improvements.',
          []
        );

        optimizations.push(`**${pillar.toUpperCase()}**: ${response.content.trim()}`);
      } catch (error) {
        console.error(`Failed to generate optimization for ${pillar}:`, error);
      }
    }

    return optimizations;
  }

  /**
   * Save quality report to database
   */
  private async saveQualityReport(report: QualityReport): Promise<void> {
    // Store in a dedicated quality_reports table or append to insights_cache
    // For now, we'll log it and could extend schema later

    const { error } = await supabaseAdmin.from('langfuse_evaluations').insert({
      user_id: '00000000-0000-0000-0000-000000000000', // System user
      trace_id: `quality_report_${Date.now()}`,
      pillar: 'master_agent',
      action: 'nudge',
      metric_name: 'quality_report',
      rubric_pass: true,
      reason: JSON.stringify(report),
      metadata: {
        type: 'quality_report',
        report_period: report.period,
        total_failures: report.totalFailures,
      },
    });

    if (error) {
      console.error('Failed to save quality report:', error);
    }

    console.log('[Quality Report]', JSON.stringify(report, null, 2));
  }
}

// Export function to run the worker
export async function runLangfuseQualityEvaluator(): Promise<QualityReport> {
  const worker = new LangfuseQualityEvaluatorWorker();
  return await worker.run();
}

// If running as standalone script
if (require.main === module) {
  runLangfuseQualityEvaluator()
    .then((report) => {
      console.log('Langfuse quality evaluation completed successfully');
      console.log(`Generated ${report.recommendations.length} recommendations`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Langfuse quality evaluation failed:', error);
      process.exit(1);
    });
}
