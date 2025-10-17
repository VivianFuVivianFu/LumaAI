import { Router } from 'express';
import { validate } from '../../middleware/validation.middleware';
import { requireAuth } from '../../middleware/auth.middleware';
import { aiLimiter } from '../../middleware/rate-limit.middleware';
import {
  createBrainExerciseSchema,
  completeBrainExerciseSchema,
  createNarrativeSchema,
  submitNarrativeReflectionsSchema,
  createFutureMeSchema,
  replayFutureMeSchema,
  createToolSessionSchema,
  completeToolSessionSchema,
} from './tools.schema';
import {
  // Brain exercises
  createBrainExercise,
  getBrainExercises,
  getBrainExercise,
  completeBrainExercise,
  deleteBrainExercise,
  // Narratives
  createNarrative,
  submitNarrativeReflections,
  getNarratives,
  getNarrative,
  deleteNarrative,
  // Future Me
  createFutureMeExercise,
  replayFutureMeExercise,
  getFutureMeExercises,
  getFutureMeExercise,
  deleteFutureMeExercise,
  // Tool sessions
  createToolSession,
  completeToolSession,
  getToolSessions,
} from './tools.controller';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// =====================================================
// 1. EMPOWER MY BRAIN ROUTES
// =====================================================

// POST /api/tools/brain - Create brain exercise (AI rate limited)
router.post('/brain', aiLimiter, validate(createBrainExerciseSchema), createBrainExercise);

// GET /api/tools/brain - Get all brain exercises
router.get('/brain', getBrainExercises);

// GET /api/tools/brain/:exerciseId - Get single brain exercise
router.get('/brain/:exerciseId', getBrainExercise);

// PATCH /api/tools/brain/:exerciseId - Complete/update brain exercise
router.patch(
  '/brain/:exerciseId',
  validate(completeBrainExerciseSchema),
  completeBrainExercise
);

// DELETE /api/tools/brain/:exerciseId - Delete brain exercise
router.delete('/brain/:exerciseId', deleteBrainExercise);

// =====================================================
// 2. MY NEW NARRATIVE ROUTES
// =====================================================

// POST /api/tools/narrative - Create narrative (AI rate limited)
router.post('/narrative', aiLimiter, validate(createNarrativeSchema), createNarrative);

// POST /api/tools/narrative/:narrativeId/reflections - Submit reflections (AI rate limited)
router.post(
  '/narrative/:narrativeId/reflections',
  aiLimiter,
  validate(submitNarrativeReflectionsSchema),
  submitNarrativeReflections
);

// GET /api/tools/narrative - Get all narratives
router.get('/narrative', getNarratives);

// GET /api/tools/narrative/:narrativeId - Get single narrative
router.get('/narrative/:narrativeId', getNarrative);

// DELETE /api/tools/narrative/:narrativeId - Delete narrative
router.delete('/narrative/:narrativeId', deleteNarrative);

// =====================================================
// 3. FUTURE ME ROUTES
// =====================================================

// POST /api/tools/future-me - Create Future Me exercise (AI rate limited)
router.post('/future-me', aiLimiter, validate(createFutureMeSchema), createFutureMeExercise);

// POST /api/tools/future-me/:exerciseId/replay - Replay exercise (AI rate limited)
router.post(
  '/future-me/:exerciseId/replay',
  aiLimiter,
  validate(replayFutureMeSchema),
  replayFutureMeExercise
);

// GET /api/tools/future-me - Get all Future Me exercises
router.get('/future-me', getFutureMeExercises);

// GET /api/tools/future-me/:exerciseId - Get single Future Me exercise
router.get('/future-me/:exerciseId', getFutureMeExercise);

// DELETE /api/tools/future-me/:exerciseId - Delete Future Me exercise
router.delete('/future-me/:exerciseId', deleteFutureMeExercise);

// =====================================================
// 4. TOOL SESSIONS ROUTES
// =====================================================

// POST /api/tools/sessions - Create tool session
router.post('/sessions', validate(createToolSessionSchema), createToolSession);

// PATCH /api/tools/sessions/:sessionId - Complete tool session
router.patch(
  '/sessions/:sessionId',
  validate(completeToolSessionSchema),
  completeToolSession
);

// GET /api/tools/sessions - Get tool sessions (with optional tool_type filter)
router.get('/sessions', getToolSessions);

export default router;
