import { Router } from 'express';
import {
  createSession,
  getSessions,
  getSession,
  createEntry,
  completeSession,
  deleteSession,
} from './journal.controller';
import { validate } from '../../middleware/validation.middleware';
import { requireAuth } from '../../middleware/auth.middleware';
import { aiLimiter } from '../../middleware/rate-limit.middleware';
import {
  createJournalSessionSchema,
  createJournalEntrySchema,
} from './journal.schema';

const router = Router();

// All journal routes require authentication
router.use(requireAuth);

// Session routes
router.post('/', aiLimiter, validate(createJournalSessionSchema), createSession);
router.get('/', getSessions);
router.get('/:sessionId', getSession);
router.post('/:sessionId/complete', completeSession);
router.delete('/:sessionId', deleteSession);

// Entry routes - AI rate limited (generates AI prompts)
router.post('/:sessionId/entries', aiLimiter, validate(createJournalEntrySchema), createEntry);

export default router;
