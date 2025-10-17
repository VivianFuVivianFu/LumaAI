import { Router } from 'express';
import { submitMoodCheckin, getMoodHistory, getDashboardStats } from './dashboard.controller';
import { validate } from '../../middleware/validation.middleware';
import { requireAuth } from '../../middleware/auth.middleware';
import { moodCheckinSchema } from './dashboard.schema';

const router = Router();

// All dashboard routes require authentication
router.use(requireAuth);

router.post('/mood-checkin', validate(moodCheckinSchema), submitMoodCheckin);
router.get('/mood-history', getMoodHistory);
router.get('/stats', getDashboardStats);

export default router;
