import { Router } from 'express';
import { validate } from '../../middleware/validation.middleware';
import { requireAuth } from '../../middleware/auth.middleware';
import { cacheMiddleware, invalidateCacheMiddleware } from '../../middleware/cache.middleware';
import {
  logEventSchema,
  getNudgesSchema,
  nudgeInteractionSchema,
  recordFeedbackSchema,
} from './master-agent.schema';
import {
  logEvent,
  getNudges,
  acceptNudge,
  dismissNudge,
  recordFeedback,
  getContext,
} from './master-agent.controller';
import {
  getDebugEvents,
  getDebugNudges,
  getDebugFeedback,
  getDebugStats,
  testNudgeRule,
  getSystemHealth,
} from './master-agent-debug.controller';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// POST /api/v1/master-agent/events - Log an event
router.post('/events', validate(logEventSchema), invalidateCacheMiddleware('/master-agent'), logEvent);

// GET /api/v1/master-agent/nudges/:surface - Get nudges for a surface
// Cache for 30 seconds (nudges change frequently but not instantly)
router.get('/nudges/:surface', validate(getNudgesSchema), cacheMiddleware(30), getNudges);

// POST /api/v1/master-agent/nudges/:nudgeId/accept - Accept a nudge
router.post(
  '/nudges/:nudgeId/accept',
  validate(nudgeInteractionSchema),
  invalidateCacheMiddleware('/nudges'),
  acceptNudge
);

// POST /api/v1/master-agent/nudges/:nudgeId/dismiss - Dismiss a nudge
router.post(
  '/nudges/:nudgeId/dismiss',
  validate(nudgeInteractionSchema),
  invalidateCacheMiddleware('/nudges'),
  dismissNudge
);

// POST /api/v1/master-agent/feedback - Record feedback
router.post('/feedback', validate(recordFeedbackSchema), recordFeedback);

// GET /api/v1/master-agent/context - Get context summary
// Cache for 5 minutes (context doesn't change that frequently)
router.get('/context', cacheMiddleware(300), getContext);

// Debug/Admin routes
router.get('/debug/events', getDebugEvents);
router.get('/debug/nudges', getDebugNudges);
router.get('/debug/feedback', getDebugFeedback);
router.get('/debug/stats', getDebugStats);
router.post('/debug/test-rule', testNudgeRule);
router.get('/debug/health', getSystemHealth);

export default router;
