import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import dashboardRoutes from '../modules/dashboard/dashboard.routes';
import chatRoutes from '../modules/chat/chat.routes';
import journalRoutes from '../modules/journal/journal.routes';
import goalsRoutes from '../modules/goals/goals.routes';
import toolsRoutes from '../modules/tools/tools.routes';
import memoryRoutes from '../modules/memory/memory.routes';
import masterAgentRoutes from '../modules/master-agent/master-agent.routes';

const router = Router();

// API v1 routes
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/chat', chatRoutes);
router.use('/journal', journalRoutes);
router.use('/goals', goalsRoutes);
router.use('/tools', toolsRoutes);
router.use('/memory', memoryRoutes);
router.use('/master-agent', masterAgentRoutes);

// Health check with database connectivity test
router.get('/health', async (req, res) => {
  try {
    const { testConnection } = require('../config/supabase.config');

    // Test database connection
    const dbHealthy = await testConnection();

    const health = {
      status: dbHealthy ? 'healthy' : 'degraded',
      message: 'Luma API is running',
      timestamp: new Date().toISOString(),
      services: {
        api: 'up',
        database: dbHealthy ? 'up' : 'down',
      },
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };

    // Return 503 if database is down, 200 if healthy
    res.status(dbHealthy ? 200 : 503).json(health);
  } catch (error) {
    console.error('[HEALTH_CHECK_ERROR]', error);
    res.status(503).json({
      status: 'unhealthy',
      message: 'Service unavailable',
      timestamp: new Date().toISOString(),
      services: {
        api: 'up',
        database: 'unknown',
      },
    });
  }
});

export default router;
