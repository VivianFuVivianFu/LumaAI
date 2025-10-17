import { z } from 'zod';

export const moodCheckinSchema = z.object({
  body: z.object({
    mood_value: z
      .number()
      .int('Mood value must be an integer')
      .min(1, 'Mood value must be at least 1')
      .max(5, 'Mood value must be at most 5'),
    notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
  }),
});

export const moodHistoryQuerySchema = z.object({
  query: z.object({
    days: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 30))
      .refine((val) => val > 0 && val <= 365, 'Days must be between 1 and 365'),
  }),
});

export type MoodCheckinInput = z.infer<typeof moodCheckinSchema>['body'];
export type MoodHistoryQuery = z.infer<typeof moodHistoryQuerySchema>['query'];
