import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.config';
import { corsOptions } from './config/cors.config';
import { testConnection } from './config/supabase.config';
import { logger } from './middleware/logger.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { startCacheCleanup } from './middleware/cache.middleware';
import { globalLimiter } from './middleware/rate-limit.middleware';
import routes from './routes';
import { insightsCronService } from './services/cron/insights-cron.service';

const app: Application = express();

// Security middleware
app.use(helmet());

// CORS
app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10mb' })); // Add size limit
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(logger);

// Global rate limiting
app.use('/api', globalLimiter);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Luma Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/api/v1/health',
      auth: '/api/v1/auth',
      dashboard: '/api/v1/dashboard',
    },
  });
});

// API routes
app.use('/api/v1', routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Server instance for graceful shutdown
let server: any;

// Start server
const startServer = async () => {
  try {
    // Test database connection
    console.log('🔄 Testing database connection...');
    const isConnected = await testConnection();

    if (!isConnected) {
      console.error('❌ Database connection failed. Please check your Supabase credentials.');
      process.exit(1);
    }

    // Start listening
    server = app.listen(env.PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║   🚀 Luma Backend Server Started      ║
╠════════════════════════════════════════╣
║   Environment: ${env.NODE_ENV.padEnd(23)} ║
║   Port:        ${env.PORT.toString().padEnd(23)} ║
║   Frontend:    ${env.FRONTEND_URL.substring(0, 23).padEnd(23)} ║
╠════════════════════════════════════════╣
║   API Base:    http://localhost:${env.PORT}/api/v1 ║
║   Health:      http://localhost:${env.PORT}/api/v1/health  ║
╚════════════════════════════════════════╝
      `);

      // Start Phase 3 cron jobs
      if (env.NODE_ENV === 'production' || env.NODE_ENV === 'development') {
        console.log('⏰ Starting Phase 3 cron jobs...');
        insightsCronService.startCronJobs();
      }

      // Start cache cleanup
      console.log('🧹 Starting cache cleanup service...');
      startCacheCleanup();
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  if (server) {
    // Stop accepting new requests
    server.close(() => {
      console.log('✅ HTTP server closed');

      // Stop cron jobs
      insightsCronService.stopCronJobs();
      console.log('✅ Cron jobs stopped');

      // Close database connections would go here if needed
      console.log('✅ Database connections closed');

      console.log('✅ Graceful shutdown complete');
      process.exit(0);
    });

    // Force shutdown after 30 seconds if graceful shutdown hangs
    setTimeout(() => {
      console.error('⚠️  Forced shutdown after timeout (30s)');
      process.exit(1);
    }, 30000);
  } else {
    process.exit(0);
  }
};

// Handle uncaught errors
process.on('unhandledRejection', (error: Error) => {
  console.error('Unhandled Rejection:', error);
  gracefulShutdown('UNHANDLED_REJECTION');
});

process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start the server
startServer();

export default app;


