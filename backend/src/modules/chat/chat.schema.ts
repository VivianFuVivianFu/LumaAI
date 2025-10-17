import { z } from 'zod';

export const createConversationSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
  }),
});

export const sendMessageSchema = z.object({
  body: z.object({
    message: z.string().min(1, 'Message cannot be empty').max(5000, 'Message is too long'),
  }),
});

export const updateConversationSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
  }),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>['body'];
export type SendMessageInput = z.infer<typeof sendMessageSchema>['body'];
export type UpdateConversationInput = z.infer<typeof updateConversationSchema>['body'];
