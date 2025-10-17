import { z } from 'zod';

/**
 * Schema for logging events
 */
export const logEventSchema = z.object({
  body: z.object({
    event_type: z.string().min(1, 'Event type is required'),
    source_feature: z.enum(['chat', 'journal', 'goals', 'tools', 'dashboard']),
    source_id: z.string().uuid().optional(),
    event_data: z.record(z.any()).optional(),
  }),
});

export type LogEventInput = z.infer<typeof logEventSchema>['body'];

/**
 * Schema for getting nudges (query param)
 */
export const getNudgesSchema = z.object({
  params: z.object({
    surface: z.enum(['home', 'chat', 'journal', 'goals', 'tools']),
  }),
});

export type GetNudgesParams = z.infer<typeof getNudgesSchema>['params'];

/**
 * Schema for nudge interaction (accept/dismiss/complete)
 */
export const nudgeInteractionSchema = z.object({
  params: z.object({
    nudgeId: z.string().uuid(),
  }),
});

export type NudgeInteractionParams = z.infer<typeof nudgeInteractionSchema>['params'];

/**
 * Schema for recording feedback
 */
export const recordFeedbackSchema = z.object({
  body: z.object({
    feedback_type: z.enum([
      'thumbs_up',
      'thumbs_down',
      'helpful',
      'not_helpful',
      'rating',
      'implicit_accept',
      'implicit_dismiss',
      'implicit_ignore',
      'implicit_dwell',
      'implicit_complete',
    ]),
    target_type: z.enum(['nudge', 'ai_response', 'suggestion', 'insight']),
    target_id: z.string().uuid(),
    rating: z.number().int().min(1).max(5).optional(),
    comment: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  }),
});

export type RecordFeedbackInput = z.infer<typeof recordFeedbackSchema>['body'];
