# Langfuse Integration Guide for Services

This guide shows how to integrate Langfuse tracing and evaluation into each pillar service.

## Pattern Overview

All service integrations follow this pattern:

1. **Create unified trace** at the start of operation
2. **Create spans** for each step (request, context retrieval, LLM inference, etc.)
3. **Track cost** after LLM calls
4. **Evaluate** the output
5. **Store trace_id** in database records

---

## Example: Chat Service Integration

### Before (without tracing):

```typescript
async sendMessage(userId: string, conversationId: string, input: SendMessageInput) {
  // Save user message
  await supabaseAdmin.from('messages').insert({
    conversation_id: conversationId,
    role: 'user',
    content: input.message,
  });

  // Generate AI response
  const response = await openaiService.generateCompletion({
    messages: [...context, { role: 'user', content: input.message }],
    model: 'gpt-4',
  });

  // Save assistant message
  await supabaseAdmin.from('messages').insert({
    conversation_id: conversationId,
    role: 'assistant',
    content: response,
  });

  return response;
}
```

### After (with tracing and evaluation):

```typescript
import { langfuseService, SpanName } from '../services/langfuse/langfuse.service';
import { langfuseEvaluatorService } from '../services/langfuse/langfuse-evaluator.service';

async sendMessage(userId: string, conversationId: string, input: SendMessageInput) {
  const startTime = Date.now();

  // 1. Create unified trace
  const trace = await langfuseService.createUnifiedTrace({
    userId,
    pillar: 'chat',
    action: 'message',
    conversationId,
  });

  try {
    // 2. Create REQUEST span
    const requestSpan = langfuseService.createSpan(trace, SpanName.REQUEST, {
      message: input.message,
    });

    // Save user message
    await supabaseAdmin.from('messages').insert({
      conversation_id: conversationId,
      role: 'user',
      content: input.message,
      trace_id: trace?.id,
    });

    // 3. Create CONTEXT_RETRIEVAL span
    const contextSpan = langfuseService.createSpan(trace, SpanName.CONTEXT_RETRIEVAL);
    const context = await this.getConversationContext(conversationId);
    contextSpan?.end({ output: { context_messages: context.length } });

    // 4. Create LLM_INFER span with generation
    const llmSpan = langfuseService.createSpan(trace, SpanName.LLM_INFER);
    const generation = langfuseService.createGeneration(
      llmSpan,
      'chat_completion',
      'gpt-4',
      [...context, { role: 'user', content: input.message }]
    );

    const response = await openaiService.generateCompletion({
      messages: [...context, { role: 'user', content: input.message }],
      model: 'gpt-4',
    });

    // Update generation with output and usage
    await langfuseService.updateGeneration(
      generation,
      response,
      {
        promptTokens: 150, // From OpenAI response
        completionTokens: 50,
        totalTokens: 200,
      },
      'gpt-4'
    );

    llmSpan?.end();

    // 5. Track cost
    const cost = langfuseService.calculateCost(
      { promptTokens: 150, completionTokens: 50, totalTokens: 200 },
      'gpt-4'
    );

    await langfuseService.trackUserCost(userId, cost.costUsd, 'chat');

    // 6. Create POSTPROCESS_VALIDATE span
    const validateSpan = langfuseService.createSpan(trace, SpanName.POSTPROCESS_VALIDATE);

    // Evaluate the response
    await langfuseEvaluatorService.evaluateTrace({
      userId,
      traceId: trace?.id || '',
      pillar: 'chat',
      action: 'message',
      input: input.message,
      output: response,
      metadata: { conversationId },
      costUsd: cost.costUsd,
      tokenUsage: cost,
      latencyMs: Date.now() - startTime,
    });

    validateSpan?.end();

    // Save assistant message with trace_id
    await supabaseAdmin.from('messages').insert({
      conversation_id: conversationId,
      role: 'assistant',
      content: response,
      trace_id: trace?.id,
    });

    // 7. End request span
    requestSpan?.end();

    // 8. Create EMIT_EVENT span (optional - if you want to log event)
    const eventSpan = langfuseService.createSpan(trace, SpanName.EMIT_EVENT);
    await supabaseAdmin.from('events').insert({
      user_id: userId,
      event_type: 'chat_message_sent',
      source_feature: 'chat',
      source_id: conversationId,
      event_data: { message_length: input.message.length },
    });
    eventSpan?.end();

    return response;
  } catch (error) {
    // Mark trace as error
    trace?.update({
      level: 'ERROR',
      metadata: { error: error.message },
    });
    throw error;
  }
}
```

---

## Streaming Example: Chat with Streaming

```typescript
import { langfuseStreamingService } from '../services/langfuse/langfuse-streaming.service';

async sendStreamingMessage(userId: string, conversationId: string, input: SendMessageInput) {
  // 1. Start streaming trace
  const streamId = await langfuseStreamingService.startStreamingTrace(
    userId,
    'chat',
    'message',
    input.message,
    { conversationId, model: 'gpt-4' }
  );

  try {
    let fullResponse = '';

    // 2. Stream response from OpenAI
    const stream = await openaiService.generateStreamingCompletion({
      messages: [...context, { role: 'user', content: input.message }],
      model: 'gpt-4',
    });

    for await (const chunk of stream) {
      fullResponse += chunk;

      // Update streaming trace with partial content
      await langfuseStreamingService.updateStreamingTrace(streamId, fullResponse);

      // Emit to client (SSE, WebSocket, etc.)
      emitToClient(chunk);
    }

    // 3. Complete streaming trace
    await langfuseStreamingService.completeStreamingTrace(streamId, fullResponse, {
      promptTokens: 150,
      completionTokens: 50,
      totalTokens: 200,
    });

    // 4. Evaluate
    await langfuseEvaluatorService.evaluateTrace({
      userId,
      traceId: streamId, // Use streamId as traceId
      pillar: 'chat',
      action: 'message',
      input: input.message,
      output: fullResponse,
    });

    return fullResponse;
  } catch (error) {
    // Abort streaming trace
    await langfuseStreamingService.abortStreamingTrace(streamId, error.message);
    throw error;
  }
}
```

---

## Integration Checklist

For each service, integrate tracing by:

### ✅ Chat Service
- [x] Wrap `sendMessage` with trace
- [ ] Add streaming trace support
- [ ] Store trace_id in messages table
- [ ] Evaluate responses

### ⏳ Journal Service
- [ ] Wrap prompt generation with trace
- [ ] Evaluate prompt depth and structure
- [ ] Store trace_id in journal_entries table

### ⏳ Goals Service
- [ ] Wrap goal planning with trace
- [ ] Evaluate SMART criteria
- [ ] Store trace_id in goals table

### ⏳ Tools Service
- [ ] Wrap exercise generation with trace
- [ ] Evaluate duration and energy match
- [ ] Link to events

### ✅ Memory Service (already has basic tracing)
- [ ] Enhance with unified trace model
- [ ] Add evaluation for recall precision
- [ ] Add privacy checks

### ⏳ Master Agent Service
- [ ] Wrap nudge generation with trace
- [ ] Evaluate quiet hours and personalization
- [ ] Store trace_id in nudges table

---

## Cost Cap Handling

Always check cost caps before expensive operations:

```typescript
// Check if user has exceeded cost cap
const hasExceededCap = await langfuseService.hasExceededCostCap(userId);

if (hasExceededCap) {
  throw new Error('Daily cost cap exceeded. Please try again tomorrow.');
}

// Proceed with operation...
```

---

## Opt-Out Handling

The trace creation automatically handles opt-out:

```typescript
const trace = await langfuseService.createUnifiedTrace({...});

// trace will be null if user opted out - safe to continue
// All subsequent trace operations are null-safe
```

---

## Error Handling

Always wrap trace operations in try-catch:

```typescript
try {
  // ... operations with tracing
} catch (error) {
  // Mark trace as error
  trace?.update({
    level: 'ERROR',
    metadata: { error: error.message },
  });
  throw error;
}
```

---

## Testing Traces

```typescript
// In your tests, mock the langfuse service
jest.mock('../services/langfuse/langfuse.service', () => ({
  langfuseService: {
    createUnifiedTrace: jest.fn(() => ({
      id: 'test-trace-id',
      update: jest.fn(),
    })),
    createSpan: jest.fn(() => ({
      end: jest.fn(),
    })),
    // ... other mocks
  },
}));
```

---

## Summary

**Pattern**: REQUEST → CONTEXT → LLM → VALIDATE → EVENT → EVALUATE

**Key Functions**:
- `langfuseService.createUnifiedTrace()` - Start trace
- `langfuseService.createSpan()` - Add spans
- `langfuseService.createGeneration()` - Track LLM calls
- `langfuseService.trackUserCost()` - Track costs
- `langfuseEvaluatorService.evaluateTrace()` - Evaluate quality

**Benefits**:
- ✅ Full observability across all pillars
- ✅ Automatic cost tracking and caps
- ✅ Quality evaluation and optimization hints
- ✅ Privacy-first with opt-out
- ✅ Backward compatible
