/**
 * AI Performance Configuration
 * Optimized settings for faster responses with minimal quality loss
 */

export const AI_PERFORMANCE_CONFIG = {
  // Chat responses - optimized for speed
  chat: {
    model: 'gpt-4o', // Fastest GPT-4 class model
    temperature: 0.7,
    max_tokens: 300, // Reduced from 500 for faster responses
    stream: true, // Always stream for perceived speed
  },

  // Journal reflections - balanced
  journal: {
    model: 'gpt-4o',
    temperature: 0.8,
    max_tokens: 400, // Reduced from 600
  },

  // Goals & action plans - detailed but controlled
  goals: {
    model: 'gpt-4o',
    temperature: 0.7,
    max_tokens: 1200, // Reduced from 2000
  },

  // Tools (Brain exercises, etc) - structured
  tools: {
    model: 'gpt-4o',
    temperature: 0.7,
    max_tokens: 1000, // Reduced from 2000
  },

  // Quick operations (clarifications, short answers)
  quick: {
    model: 'gpt-4o-mini', // Faster, cheaper for simple tasks
    temperature: 0.7,
    max_tokens: 150,
  },
} as const;

/**
 * Response optimization strategies
 */
export const OPTIMIZATION_STRATEGIES = {
  // Use streaming for all user-facing LLM calls
  useStreaming: true,

  // Cache common responses (e.g., welcome messages, standard prompts)
  enableCaching: true,

  // Parallel processing for independent operations
  parallelProcessing: true,

  // Timeout settings (ms)
  timeouts: {
    llmRequest: 30000, // 30 seconds max for LLM
    databaseQuery: 5000, // 5 seconds max for DB
    total: 45000, // 45 seconds total request timeout
  },
} as const;

/**
 * Context window optimization
 * Limit conversation history to prevent slow responses
 */
export const CONTEXT_CONFIG = {
  maxHistoryMessages: 10, // Only include last 10 messages
  maxHistoryTokens: 2000, // Approximate token limit for history
  summarizeOldHistory: true, // Summarize if history is too long
} as const;
