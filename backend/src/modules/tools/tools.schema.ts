import { z } from 'zod';

// =====================================================
// 1. EMPOWER MY BRAIN SCHEMAS
// =====================================================

export const createBrainExerciseSchema = z.object({
  body: z.object({
    context_description: z
      .string()
      .min(10, 'Please describe what you\'re struggling with (at least 10 characters)')
      .max(1000, 'Context description is too long (max 1000 characters)'),
    original_thought: z
      .string()
      .optional()
      .describe('The specific unhelpful thought to reframe'),
  }),
});

export const completeBrainExerciseSchema = z.object({
  body: z.object({
    completed: z.boolean(),
    saved_to_journal: z.boolean().optional(),
    linked_to_goals: z.boolean().optional(),
  }),
});

export type CreateBrainExerciseInput = z.infer<typeof createBrainExerciseSchema>['body'];
export type CompleteBrainExerciseInput = z.infer<typeof completeBrainExerciseSchema>['body'];

// =====================================================
// 2. MY NEW NARRATIVE SCHEMAS
// =====================================================

export const createNarrativeSchema = z.object({
  body: z.object({
    context_description: z
      .string()
      .min(20, 'Please share more about your experience (at least 20 characters)')
      .max(2000, 'Context description is too long (max 2000 characters)'),
    focus_area: z
      .enum(['past', 'present', 'future', 'all'])
      .optional()
      .default('all')
      .describe('Which timeframe to focus on'),
  }),
});

export const submitNarrativeReflectionsSchema = z.object({
  body: z.object({
    user_reflection_1: z.string().max(1000).optional(),
    user_reflection_2: z.string().max(1000).optional(),
    completed: z.boolean().optional(),
    saved_to_journal: z.boolean().optional(),
    linked_to_goals: z.boolean().optional(),
  }),
});

export type CreateNarrativeInput = z.infer<typeof createNarrativeSchema>['body'];
export type SubmitNarrativeReflectionsInput = z.infer<typeof submitNarrativeReflectionsSchema>['body'];

// =====================================================
// 3. FUTURE ME SCHEMAS
// =====================================================

export const createFutureMeSchema = z.object({
  body: z.object({
    goal_or_theme: z
      .string()
      .min(10, 'Please describe what you want to work on (at least 10 characters)')
      .max(500, 'Goal or theme is too long (max 500 characters)'),
    preferred_tone: z
      .enum(['calming', 'energizing', 'balanced'])
      .optional()
      .default('balanced')
      .describe('Preferred emotional tone of the visualization'),
  }),
});

export const replayFutureMeSchema = z.object({
  body: z.object({
    saved_to_journal: z.boolean().optional(),
    linked_to_goals: z.boolean().optional(),
  }),
});

export type CreateFutureMeInput = z.infer<typeof createFutureMeSchema>['body'];
export type ReplayFutureMeInput = z.infer<typeof replayFutureMeSchema>['body'];

// =====================================================
// 4. TOOL SESSION SCHEMAS
// =====================================================

export const createToolSessionSchema = z.object({
  body: z.object({
    tool_type: z.enum(['empower_my_brain', 'my_new_narrative', 'future_me']),
    exercise_id: z.string().uuid(),
  }),
});

export const completeToolSessionSchema = z.object({
  body: z.object({
    duration_seconds: z.number().int().positive().optional(),
    helpfulness_rating: z.number().int().min(1).max(5).optional(),
    user_notes: z.string().max(1000).optional(),
  }),
});

export type CreateToolSessionInput = z.infer<typeof createToolSessionSchema>['body'];
export type CompleteToolSessionInput = z.infer<typeof completeToolSessionSchema>['body'];
