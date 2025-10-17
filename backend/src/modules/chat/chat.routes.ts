import { Router } from 'express';
import {
  createConversation,
  getConversations,
  getConversation,
  sendMessage,
  deleteConversation,
  updateConversation,
} from './chat.controller';
import { validate } from '../../middleware/validation.middleware';
import { requireAuth } from '../../middleware/auth.middleware';
import { aiLimiter } from '../../middleware/rate-limit.middleware';
import {
  createConversationSchema,
  sendMessageSchema,
  updateConversationSchema,
} from './chat.schema';

const router = Router();

// All chat routes require authentication
router.use(requireAuth);

// Conversation routes
router.post('/', validate(createConversationSchema), createConversation);
router.get('/', getConversations);
router.get('/:conversationId', getConversation);
router.put('/:conversationId', validate(updateConversationSchema), updateConversation);
router.delete('/:conversationId', deleteConversation);

// Message routes - AI rate limited
router.post('/:conversationId/messages', aiLimiter, validate(sendMessageSchema), sendMessage);

export default router;
