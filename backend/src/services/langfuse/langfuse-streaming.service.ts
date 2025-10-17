import { langfuseService, Pillar, PillarAction, SpanName } from './langfuse.service';

/**
 * Streaming trace context for managing partial updates
 */
export interface StreamingTraceContext {
  trace: any;
  generation: any;
  startTime: number;
  userId: string;
  pillar: Pillar;
  action: PillarAction;
  metadata: Record<string, any>;
}

/**
 * Langfuse Streaming Service
 * Handles streaming traces for chat and journal (OpenAI streaming responses)
 */
export class LangfuseStreamingService {
  private activeStreams: Map<string, StreamingTraceContext> = new Map();

  /**
   * Start a streaming trace
   * Returns a stream ID to use for updates
   */
  async startStreamingTrace(
    userId: string,
    pillar: Pillar,
    action: PillarAction,
    input: any,
    metadata?: Record<string, any>
  ): Promise<string | null> {
    // Create unified trace
    const trace = await langfuseService.createUnifiedTrace({
      userId,
      pillar,
      action,
      ...metadata,
    });

    if (!trace) return null; // User opted out

    // Create request span
    const requestSpan = langfuseService.createSpan(trace, SpanName.REQUEST, {
      input,
    });

    // Create generation for LLM inference
    const generation = langfuseService.createGeneration(
      requestSpan,
      'llm_streaming',
      metadata?.model || 'gpt-4',
      input,
      { streaming: true }
    );

    const streamId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store context
    this.activeStreams.set(streamId, {
      trace,
      generation,
      startTime: Date.now(),
      userId,
      pillar,
      action,
      metadata: metadata || {},
    });

    return streamId;
  }

  /**
   * Update streaming trace with partial content
   */
  async updateStreamingTrace(streamId: string, partialContent: string): Promise<void> {
    const context = this.activeStreams.get(streamId);
    if (!context) return;

    // Update generation metadata with partial content length
    // (Langfuse will aggregate on final update)
    context.metadata.partial_length = partialContent.length;
    context.metadata.last_update = Date.now();
  }

  /**
   * Complete streaming trace with final output and usage
   */
  async completeStreamingTrace(
    streamId: string,
    fullOutput: string,
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    }
  ): Promise<void> {
    const context = this.activeStreams.get(streamId);
    if (!context) return;

    const latencyMs = Date.now() - context.startTime;

    // Update generation with final output
    await langfuseService.updateGeneration(
      context.generation,
      fullOutput,
      usage,
      context.metadata.model || 'gpt-4'
    );

    // Calculate cost
    let costUsd: number | undefined;
    if (usage) {
      const cost = langfuseService.calculateCost(usage, context.metadata.model || 'gpt-4');
      costUsd = cost.costUsd;

      // Track user cost
      await langfuseService.trackUserCost(context.userId, costUsd, context.pillar);
    }

    // End trace
    context.trace.update({
      metadata: {
        ...context.metadata,
        completed: true,
        latency_ms: latencyMs,
        cost_usd: costUsd,
      },
    });

    // Clean up
    this.activeStreams.delete(streamId);
  }

  /**
   * Abort streaming trace (error or cancellation)
   */
  async abortStreamingTrace(streamId: string, reason: string): Promise<void> {
    const context = this.activeStreams.get(streamId);
    if (!context) return;

    const latencyMs = Date.now() - context.startTime;

    // Update trace with error
    context.trace.update({
      metadata: {
        ...context.metadata,
        aborted: true,
        abort_reason: reason,
        latency_ms: latencyMs,
      },
      level: 'ERROR',
    });

    // Clean up
    this.activeStreams.delete(streamId);
  }

  /**
   * Get active stream count (for monitoring)
   */
  getActiveStreamCount(): number {
    return this.activeStreams.size;
  }

  /**
   * Clean up stale streams (older than 5 minutes)
   */
  cleanupStaleStreams(): void {
    const now = Date.now();
    const STALE_THRESHOLD = 5 * 60 * 1000; // 5 minutes

    for (const [streamId, context] of this.activeStreams.entries()) {
      if (now - context.startTime > STALE_THRESHOLD) {
        console.warn(`Cleaning up stale stream: ${streamId}`);
        this.abortStreamingTrace(streamId, 'Stream timeout - no completion received');
      }
    }
  }
}

// Export singleton instance
export const langfuseStreamingService = new LangfuseStreamingService();

// Run cleanup every minute
setInterval(() => {
  langfuseStreamingService.cleanupStaleStreams();
}, 60 * 1000);
