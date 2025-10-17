import { Langfuse } from 'langfuse';
import { env } from '../../config/env.config';
import { supabaseAdmin } from '../../config/supabase.config';

// Initialize LangFuse client
export const langfuse = new Langfuse({
  secretKey: env.LANGFUSE_SECRET_KEY,
  publicKey: env.LANGFUSE_PUBLIC_KEY,
  baseUrl: env.LANGFUSE_HOST,
});

/**
 * Pillar types matching our architecture
 */
export type Pillar = 'chat' | 'journal' | 'goals' | 'tools' | 'memory' | 'master_agent';

/**
 * Action types per pillar
 */
export type PillarAction =
  | 'message' // chat
  | 'prompt' // journal
  | 'plan' // goals
  | 'exercise' // tools
  | 'retrieve' // memory
  | 'nudge'; // master_agent

/**
 * Standard trace metadata
 */
export interface TraceMetadata {
  userId: string;
  pillar: Pillar;
  action: PillarAction;
  sessionId?: string;
  conversationId?: string;
  goalId?: string;
  journalSessionId?: string;
  toolSessionId?: string;
  eventId?: string;
  nudgeId?: string;
  routingPath?: string;
  promptVersion?: string;
  [key: string]: any;
}

/**
 * Standard span topology for unified tracing
 */
export enum SpanName {
  REQUEST = 'request',
  CONTEXT_RETRIEVAL = 'context_retrieval',
  PLANNING_OR_PROMPT = 'planning_or_prompt',
  LLM_INFER = 'llm_infer',
  POSTPROCESS_VALIDATE = 'postprocess_validate',
  EMIT_EVENT = 'emit_event',
}

/**
 * Cost calculation helper
 */
interface CostCalculation {
  costUsd: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * Enhanced LangFuse Service with unified trace model, cost tracking, and evaluation
 */
export class LangFuseService {
  /**
   * Check if user has opted out of Langfuse
   */
  async isUserOptedOut(userId: string): Promise<boolean> {
    const { data } = await supabaseAdmin
      .from('personalization_weights')
      .select('langfuse_opt_out')
      .eq('user_id', userId)
      .single();

    return data?.langfuse_opt_out || false;
  }

  /**
   * Check if user has exceeded daily cost cap
   */
  async hasExceededCostCap(userId: string): Promise<boolean> {
    const { data } = await supabaseAdmin.rpc('check_user_cost_cap', {
      p_user_id: userId,
    });

    return data || false;
  }

  /**
   * Create a unified trace with standardized naming convention
   * Format: {pillar}.{action} (e.g., chat.message, journal.prompt, master_agent.nudge)
   */
  async createUnifiedTrace(metadata: TraceMetadata) {
    const { userId, pillar, action, ...rest } = metadata;

    // Check opt-out
    if (await this.isUserOptedOut(userId)) {
      return null; // Return null trace that no-ops
    }

    const traceName = `${pillar}.${action}`;

    return langfuse.trace({
      name: traceName,
      userId,
      metadata: {
        ...rest,
        pillar,
        action,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Backward compatibility method for legacy createTrace calls
   * @deprecated Use createUnifiedTrace instead
   */
  async createTrace(
    name: string,
    userId: string,
    metadata?: Record<string, any>
  ) {
    // Check opt-out
    if (await this.isUserOptedOut(userId)) {
      return null; // Return null trace that no-ops
    }

    return langfuse.trace({
      name,
      userId,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
    });
  }


  /**
   * Create a standardized span within a trace
   */
  createSpan(
    trace: any,
    spanName: SpanName,
    metadata?: Record<string, any>
  ) {
    if (!trace) return null; // Handle opted-out case

    return trace.span({
      name: spanName,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Create a generation span for LLM calls with cost tracking
   */
  createGeneration(
    traceOrSpan: any,
    name: string,
    model: string,
    input: any,
    metadata?: Record<string, any>
  ) {
    if (!traceOrSpan) return null; // Handle opted-out case

    // Check if generation method exists (backward compatibility)
    if (typeof traceOrSpan.generation !== 'function') {
      console.warn('traceOrSpan.generation is not a function - creating mock generation');
      // Return mock generation object
      return {
        end: () => {},
        update: () => {},
      };
    }

    return traceOrSpan.generation({
      name,
      model,
      input,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Update generation with output, usage, and cost calculation
   */
  async updateGeneration(
    generation: any,
    output: string,
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    },
    model: string = 'gpt-4'
  ) {
    if (!generation) return; // Handle opted-out case

    const cost = usage ? this.calculateCost(usage, model) : undefined;

    generation.end({
      output,
      usage: usage
        ? {
            input: usage.promptTokens,
            output: usage.completionTokens,
            total: usage.totalTokens,
          }
        : undefined,
      metadata: cost
        ? {
            cost_usd: cost.costUsd,
          }
        : undefined,
    });
  }

  /**
   * Calculate cost based on token usage and model
   * OpenAI pricing as of Jan 2025 (update as needed)
   */
  calculateCost(
    usage: { promptTokens: number; completionTokens: number; totalTokens: number },
    model: string
  ): CostCalculation {
    // Pricing per 1M tokens (input / output)
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4': { input: 30.0, output: 60.0 },
      'gpt-4-turbo': { input: 10.0, output: 30.0 },
      'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
      'text-embedding-3-small': { input: 0.02, output: 0 },
      'text-embedding-ada-002': { input: 0.10, output: 0 },
    };

    const modelPricing = pricing[model] || pricing['gpt-4']; // Default to GPT-4 pricing

    const inputCost = (usage.promptTokens / 1_000_000) * modelPricing.input;
    const outputCost = (usage.completionTokens / 1_000_000) * modelPricing.output;
    const totalCost = inputCost + outputCost;

    return {
      costUsd: parseFloat(totalCost.toFixed(6)),
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens: usage.totalTokens,
    };
  }

  /**
   * Track cost for user (increment daily spend)
   */
  async trackUserCost(
    userId: string,
    costUsd: number,
    pillar: Pillar
  ): Promise<boolean> {
    try {
      const { data: capReached } = await supabaseAdmin.rpc('increment_user_cost', {
        p_user_id: userId,
        p_cost_usd: costUsd,
        p_pillar: pillar,
      });

      return capReached || false;
    } catch (error) {
      console.error('Failed to track user cost:', error);
      return false;
    }
  }

  /**
   * Create a score for evaluation metrics
   */
  async createScore(
    traceId: string,
    name: string,
    value: number,
    comment?: string
  ) {
    if (!traceId) return; // Handle opted-out case

    return langfuse.score({
      traceId,
      name,
      value,
      comment,
    });
  }

  /**
   * Save evaluation to database
   */
  async saveEvaluation(
    userId: string,
    traceId: string,
    pillar: Pillar,
    action: PillarAction,
    metricName: string,
    metricValue: number | null,
    rubricPass: boolean | null,
    reason?: string,
    costUsd?: number,
    tokenUsage?: any,
    latencyMs?: number,
    observationId?: string
  ) {
    const { error } = await supabaseAdmin.from('langfuse_evaluations').insert({
      user_id: userId,
      trace_id: traceId,
      observation_id: observationId,
      pillar,
      action,
      metric_name: metricName,
      metric_value: metricValue,
      rubric_pass: rubricPass,
      reason,
      cost_usd: costUsd,
      token_usage: tokenUsage || {},
      latency_ms: latencyMs,
    });

    if (error) {
      console.error('Failed to save evaluation:', error);
    }
  }

  /**
   * Get Langfuse trace URL for debugging
   */
  getTraceUrl(traceId: string): string {
    return `${env.LANGFUSE_HOST}/trace/${traceId}`;
  }

  /**
   * Flush all pending events (call before server shutdown)
   */
  async flush() {
    await langfuse.flushAsync();
  }

  /**
   * Shutdown LangFuse client
   */
  async shutdown() {
    await langfuse.shutdownAsync();
  }
}

// Export singleton instance
export const langfuseService = new LangFuseService();
