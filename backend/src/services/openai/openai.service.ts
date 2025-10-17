import OpenAI from 'openai';
import { env } from '../../config/env.config';
import { langfuseService } from '../langfuse/langfuse.service';
import { AI_PERFORMANCE_CONFIG, CONTEXT_CONFIG } from '../../config/ai-performance.config';
import { analyzeMessage } from './psychology-patterns';
import { buildEnhancedChatPrompt, getCrisisResourcesFooter } from './enhanced-chat-prompt';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

// Legacy crisis detection removed - now handled by psychology-patterns.ts

export interface ChatContext {
  userId: string;
  displayName: string;
  pronouns?: string;
  timezone?: string;
  conversationHistory?: string;
  memory?: string;
  goals?: string;
  mood?: string;
}

export class OpenAIService {
  /**
   * Get Chat system prompt for Luma with psychology integration
   * Uses enhanced prompt builder with cognitive distortion detection,
   * attachment-aware responses, and adaptive communication styles.
   */
  private getChatSystemPrompt(context: ChatContext, userMessage: string): string {
    // Analyze user message for psychology patterns (<100ms)
    const psychologyAnalysis = analyzeMessage(userMessage);

    // Build enhanced prompt with psychology guidance
    return buildEnhancedChatPrompt(context, psychologyAnalysis);
  }

  /**
   * Limit conversation history to improve response speed
   * Keeps system message + last N messages
   */
  private limitConversationHistory(
    messages: OpenAI.Chat.ChatCompletionMessageParam[]
  ): OpenAI.Chat.ChatCompletionMessageParam[] {
    if (messages.length <= CONTEXT_CONFIG.maxHistoryMessages + 2) {
      return messages;
    }

    // Keep system message, last N messages
    const systemMessage = messages[0];
    const recentMessages = messages.slice(-(CONTEXT_CONFIG.maxHistoryMessages + 1));

    return [systemMessage, ...recentMessages];
  }

  /**
   * Generate chat response with streaming
   * Enhanced with psychology pattern detection and adaptive responses
   */
  async generateChatResponse(
    userMessage: string,
    context: ChatContext,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  ) {
    // TEMPORARY: Disable Langfuse to unblock core functionality
    // TODO: Re-enable after fixing Langfuse integration
    console.log('[OpenAI] Generating streaming response for user:', context.userId);

    try {
      // Analyze message for psychology patterns (runs <100ms)
      const startAnalysis = Date.now();
      const psychologyAnalysis = analyzeMessage(userMessage);
      const analysisTime = Date.now() - startAnalysis;
      console.log('[OpenAI] Psychology analysis completed in', analysisTime, 'ms');

      // Log detected patterns for debugging
      if (psychologyAnalysis.cognitive_distortions.length > 0) {
        console.log('[OpenAI] Cognitive distortions detected:', psychologyAnalysis.cognitive_distortions);
      }
      if (psychologyAnalysis.emotional_state) {
        console.log('[OpenAI] Emotional state:', psychologyAnalysis.emotional_state);
      }
      if (psychologyAnalysis.attachment_style) {
        console.log('[OpenAI] Attachment pattern:', psychologyAnalysis.attachment_style);
      }
      if (psychologyAnalysis.tool_suggestions.length > 0) {
        console.log('[OpenAI] Tool suggestions:', psychologyAnalysis.tool_suggestions);
      }
      if (psychologyAnalysis.crisis_detected) {
        console.log('[OpenAI] ⚠️ CRISIS DETECTED');
      }

      // Build messages array with enhanced prompt
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: this.getChatSystemPrompt(context, userMessage),
        },
        ...conversationHistory.map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
        {
          role: 'user',
          content: userMessage,
        },
      ];

      console.log('[OpenAI] Calling streaming API with', messages.length, 'messages');

      // Limit conversation history for faster responses
      const limitedMessages = this.limitConversationHistory(messages);

      // Call OpenAI API with streaming - OPTIMIZED SETTINGS
      const stream = await openai.chat.completions.create({
        model: AI_PERFORMANCE_CONFIG.chat.model,
        messages: limitedMessages,
        temperature: AI_PERFORMANCE_CONFIG.chat.temperature,
        max_tokens: AI_PERFORMANCE_CONFIG.chat.max_tokens,
        stream: true,
      });

      console.log('[OpenAI] Stream created successfully');

      let fullResponse = '';

      // Return stream for frontend
      return {
        stream,
        onComplete: async (response: string, usage?: any) => {
          fullResponse = response;

          // Append crisis resources if crisis detected
          if (psychologyAnalysis.crisis_detected) {
            fullResponse += getCrisisResourcesFooter();
          }

          console.log('[OpenAI] Stream completed successfully');

          return fullResponse;
        },
      };
    } catch (error: any) {
      console.error('[OpenAI] API Error:', error);
      throw new Error(`Failed to generate response: ${error.message}`);
    }
  }

  /**
   * Generate non-streaming chat response (for simple use cases)
   * Enhanced with psychology pattern detection
   */
  async generateSimpleResponse(
    userMessage: string,
    context: ChatContext,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<string> {
    // TEMPORARY: Disable Langfuse to unblock core functionality
    // TODO: Re-enable after fixing Langfuse integration
    console.log('[OpenAI] Generating simple response for user:', context.userId);

    try {
      // Analyze message for psychology patterns
      const psychologyAnalysis = analyzeMessage(userMessage);

      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: this.getChatSystemPrompt(context, userMessage),
        },
        ...conversationHistory.map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
        {
          role: 'user',
          content: userMessage,
        },
      ];

      console.log('[OpenAI] Calling API with', messages.length, 'messages');

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o', // GPT-4o: 3x faster, 50% cheaper than gpt-4-turbo
        messages,
        temperature: 0.7,
        max_tokens: 500,
      });

      let response = completion.choices[0].message.content || '';

      // Append crisis resources if crisis detected
      if (psychologyAnalysis.crisis_detected) {
        response += getCrisisResourcesFooter();
      }

      console.log('[OpenAI] Response generated successfully');

      return response;
    } catch (error: any) {
      console.error('[OpenAI] API Error:', error);
      throw new Error('Failed to generate response');
    }
  }

  /**
   * Generate structured response (for JSON outputs like Tools feature)
   */
  async generateStructuredResponse(
    userPrompt: string,
    systemPrompt: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<{ content: string; usage?: any }> {
    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...conversationHistory.map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
        {
          role: 'user',
          content: userPrompt,
        },
      ];

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o', // GPT-4o: 3x faster, 50% cheaper than gpt-4-turbo
        messages,
        temperature: 0.7,
        max_tokens: 2000, // Higher limit for structured exercises
      });

      const response = completion.choices[0].message.content || '';

      return {
        content: response,
        usage: {
          prompt_tokens: completion.usage?.prompt_tokens || 0,
          completion_tokens: completion.usage?.completion_tokens || 0,
          total_tokens: completion.usage?.total_tokens || 0,
        },
      };
    } catch (error: any) {
      console.error('OpenAI API Error:', error);
      throw new Error('Failed to generate structured response');
    }
  }

  /**
   * Generate embedding for text (for memory/semantic search)
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Embedding generation error:', error);
      throw new Error('Failed to generate embedding');
    }
  }
}

// Export singleton instance
export const openaiService = new OpenAIService();
