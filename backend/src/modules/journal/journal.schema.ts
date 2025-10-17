import { z } from 'zod';

export const createJournalSessionSchema = z.object({
  body: z.object({
    mode: z.enum(['past', 'present-faults', 'present-virtues', 'future', 'free-write']),
    title: z.string().min(1).max(200).optional(),
  }),
});

export const createJournalEntrySchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Journal entry cannot be empty').max(10000, 'Entry is too long'),
    stepNumber: z.number().int().positive().optional(),
    prompt: z.string().optional(),
    isPrivate: z.boolean().default(true),
    excludeFromMemory: z.boolean().default(false),
  }),
});

export const updateJournalSessionSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    isCompleted: z.boolean().optional(),
  }),
});

export type CreateJournalSessionInput = z.infer<typeof createJournalSessionSchema>['body'];
export type CreateJournalEntryInput = z.infer<typeof createJournalEntrySchema>['body'];
export type UpdateJournalSessionInput = z.infer<typeof updateJournalSessionSchema>['body'];
