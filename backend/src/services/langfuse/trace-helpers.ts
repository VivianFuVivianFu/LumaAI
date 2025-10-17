/**
 * Langfuse Trace Helper Functions
 *
 * Simplified wrappers for common tracing patterns across services
 */

import { langfuseService, SpanName, Pillar, PillarAction } from './langfuse.service';
import { langfuseEvaluatorService } from './langfuse-evaluator.service';

interface TraceWrapperOptions {
  userId: string;
  pillar: Pillar;
  action: PillarAction;
  metadata?: Record<string, any>;
}

interface LLMCallOptions {
  model: string;
  input: any;
  output: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Wrap an LLM call with complete tracing, cost tracking, and evaluation
 *
 * Usage:
 * ```typescript
 * const result = await traceLLMCall(
 *   { userId, pillar: 'chat', action: 'message', metadata: { conversationId } },
 *   async (trace, generation) => {
 *     const response = await openai.chat.completions.create({...});
 *     return {
 *       model: 'gpt-4',
 *       input: messages,
 *       output: response.choices[0].message.content,
 *       usage: { promptTokens: ..., completionTokens: ..., totalTokens: ... }
 *     };
 *   }
 * );
 * ```
 */
export async function traceLLMCall<T extends LLMCallOptions>(
  options: TraceWrapperOptions,
  llmCallback: (trace: any, generation: any) => Promise<T>
): Promise<T & { traceId: string; cost: number }> {
  const startTime = Date.now();

  const trace = await langfuseService.createUnifiedTrace({
    userId: options.userId,
    pillar: options.pillar,
    action: options.action,
    ...options.metadata,
  });

  try {
    const requestSpan = langfuseService.createSpan(trace, SpanName.REQUEST, options.metadata);
    const llmSpan = langfuseService.createSpan(trace, SpanName.LLM_INFER);
    const generation = langfuseService.createGeneration(
      llmSpan,
      `${options.pillar}_${options.action}`,
      'gpt-4',
      options.metadata
    );

    // Execute LLM call
    const result = await llmCallback(trace, generation);

    // Update generation
    await langfuseService.updateGeneration(
      generation,
      result.output,
      result.usage,
      result.model
    );

    llmSpan?.end();

    // Track cost
    const cost = langfuseService.calculateCost(result.usage, result.model);
    await langfuseService.trackUserCost(options.userId, cost.costUsd, options.pillar);

    // Evaluate
    const validateSpan = langfuseService.createSpan(trace, SpanName.POSTPROCESS_VALIDATE);

    await langfuseEvaluatorService.evaluateTrace({
      userId: options.userId,
      traceId: trace?.id || '',
      pillar: options.pillar,
      action: options.action,
      input: result.input,
      output: result.output,
      metadata: options.metadata,
      costUsd: cost.costUsd,
      tokenUsage: cost,
      latencyMs: Date.now() - startTime,
    });

    validateSpan?.end();
    requestSpan?.end();

    return {
      ...result,
      traceId: trace?.id || '',
      cost: cost.costUsd,
    };
  } catch (error: any) {
    trace?.update({ level: 'ERROR', metadata: { error: error.message } });
    throw error;
  }
}

/**
 * Simple trace wrapper for non-LLM operations
 */
export async function traceOperation<T>(
  options: TraceWrapperOptions,
  operation: (trace: any) => Promise<T>
): Promise<T> {
  const trace = await langfuseService.createUnifiedTrace({
    userId: options.userId,
    pillar: options.pillar,
    action: options.action,
    ...options.metadata,
  });

  try {
    const requestSpan = langfuseService.createSpan(trace, SpanName.REQUEST, options.metadata);
    const result = await operation(trace);
    requestSpan?.end();
    return result;
  } catch (error: any) {
    trace?.update({ level: 'ERROR', metadata: { error: error.message } });
    throw error;
  }
}
