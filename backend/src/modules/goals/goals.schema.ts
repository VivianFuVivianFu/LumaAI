import { z } from 'zod';

export const createGoalSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().max(1000).optional(),
    category: z.enum([
      'career',
      'financial',
      'health',
      'relationships',
      'mental-health',
      'personal-growth',
      'creative',
      'social-impact',
    ]),
    timeframe: z.enum(['3-months', '6-months', '12-months']),
  }),
});

export const answerClarificationSchema = z.object({
  body: z.object({
    answers: z.array(
      z.object({
        questionId: z.number(),
        answer: z.string().min(1, 'Answer cannot be empty'),
      })
    ),
  }),
});

export const updateGoalSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    status: z.enum(['active', 'completed', 'paused', 'abandoned']).optional(),
    progress: z.number().int().min(0).max(100).optional(),
  }),
});

export const toggleActionSchema = z.object({
  body: z.object({
    completed: z.boolean(),
  }),
});

export const adjustActionPlanSchema = z.object({
  body: z.object({
    feedback: z.string().min(1, 'Feedback is required'),
  }),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>['body'];
export type AnswerClarificationInput = z.infer<typeof answerClarificationSchema>['body'];
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>['body'];
export type ToggleActionInput = z.infer<typeof toggleActionSchema>['body'];
export type AdjustActionPlanInput = z.infer<typeof adjustActionPlanSchema>['body'];
