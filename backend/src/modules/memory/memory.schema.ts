import { z } from 'zod';

// =====================================================
// MEMORY SETTINGS SCHEMAS
// =====================================================

export const updateMemorySettingsSchema = z.object({
  body: z.object({
    memory_enabled: z.boolean().optional(),
    chat_memory_enabled: z.boolean().optional(),
    journal_memory_enabled: z.boolean().optional(),
    goals_memory_enabled: z.boolean().optional(),
    tools_memory_enabled: z.boolean().optional(),
    default_privacy_level: z.enum(['public', 'private', 'ai-only']).optional(),
    allow_crisis_recall: z.boolean().optional(),
    allow_cross_feature_recall: z.boolean().optional(),
    weekly_summary_enabled: z.boolean().optional(),
    pattern_insights_enabled: z.boolean().optional(),
  }),
});

export type UpdateMemorySettingsInput = z.infer<typeof updateMemorySettingsSchema>['body'];

// =====================================================
// MEMORY RETRIEVAL SCHEMAS
// =====================================================

export const retrieveContextSchema = z.object({
  body: z.object({
    query: z.string().optional(),
    target_feature: z.enum(['chat', 'journal', 'goals', 'tools']),
    current_topic: z.string().optional(),
    limit: z.number().int().min(1).max(50).optional().default(10),
    similarity_threshold: z.number().min(0).max(1).optional().default(0.70),
    exclude_crisis: z.boolean().optional().default(true),
  }),
});

export type RetrieveContextInput = z.infer<typeof retrieveContextSchema>['body'];

// =====================================================
// MEMORY BLOCK MANAGEMENT SCHEMAS
// =====================================================

export const updateBlockPrivacySchema = z.object({
  body: z.object({
    privacy_level: z.enum(['public', 'private', 'ai-only']),
  }),
});

export type UpdateBlockPrivacyInput = z.infer<typeof updateBlockPrivacySchema>['body'];

// =====================================================
// MEMORY SEARCH SCHEMAS
// =====================================================

export const searchMemorySchema = z.object({
  body: z.object({
    query: z.string().min(1, 'Search query is required'),
    block_types: z
      .array(
        z.enum([
          'chat_message',
          'journal_entry',
          'goal',
          'action_plan',
          'exercise',
          'reflection',
          'mood_checkin',
          'insight',
        ])
      )
      .optional(),
    limit: z.number().int().min(1).max(100).optional().default(20),
    similarity_threshold: z.number().min(0).max(1).optional().default(0.70),
  }),
});

export type SearchMemoryInput = z.infer<typeof searchMemorySchema>['body'];
