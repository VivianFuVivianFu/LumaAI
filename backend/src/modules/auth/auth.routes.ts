import { Router } from 'express';
import { register, login, getCurrentUser, logout, updateProfile } from './auth.controller';
import { exportUserData, deleteUserAccount, getDataSummary } from './gdpr.controller';
import { validate } from '../../middleware/validation.middleware';
import { requireAuth } from '../../middleware/auth.middleware';
import { authLimiter, strictLimiter } from '../../middleware/rate-limit.middleware';
import { registerSchema, loginSchema, updateProfileSchema } from './auth.schema';

const router = Router();

// Public routes with strict rate limiting
router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);

// Protected routes
router.get('/me', requireAuth, getCurrentUser);
router.post('/logout', requireAuth, logout);
router.put('/profile', requireAuth, validate(updateProfileSchema), updateProfile);

// GDPR compliance routes (protected + strict rate limiting)
router.get('/gdpr/data-summary', requireAuth, getDataSummary);
router.get('/gdpr/export', requireAuth, strictLimiter, exportUserData);
router.delete('/gdpr/delete-account', requireAuth, strictLimiter, deleteUserAccount);

export default router;
