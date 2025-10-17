import { Router } from 'express';
import { validate } from '../../middleware/validation.middleware';
import { requireAuth } from '../../middleware/auth.middleware';
import { aiLimiter } from '../../middleware/rate-limit.middleware';
import {
  createGoalSchema,
  answerClarificationSchema,
  updateGoalSchema,
  toggleActionSchema,
  adjustActionPlanSchema,
} from './goals.schema';
import {
  createGoal,
  submitClarifications,
  getGoals,
  getGoal,
  updateGoal,
  toggleAction,
  deleteGoal,
  adjustActionPlan,
} from './goals.controller';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// POST /api/goals - Create new goal and get clarifying questions (AI rate limited)
router.post('/', aiLimiter, validate(createGoalSchema), createGoal);

// POST /api/goals/:goalId/clarifications - Submit answers and generate action plan (AI rate limited)
router.post(
  '/:goalId/clarifications',
  aiLimiter,
  validate(answerClarificationSchema),
  submitClarifications
);

// POST /api/goals/:goalId/adjust - Adjust action plan based on feedback (AI rate limited)
router.post(
  '/:goalId/adjust',
  aiLimiter,
  validate(adjustActionPlanSchema),
  adjustActionPlan
);

// GET /api/goals - Get all goals for user
router.get('/', getGoals);

// GET /api/goals/:goalId - Get single goal with action plan
router.get('/:goalId', getGoal);

// PATCH /api/goals/:goalId - Update goal
router.patch('/:goalId', validate(updateGoalSchema), updateGoal);

// PATCH /api/goals/actions/:actionId - Toggle action completion
router.patch(
  '/actions/:actionId',
  validate(toggleActionSchema),
  toggleAction
);

// DELETE /api/goals/:goalId - Delete goal
router.delete('/:goalId', deleteGoal);

export default router;
