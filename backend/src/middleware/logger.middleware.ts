import morgan from 'morgan';
import { isDevelopment } from '../config/env.config';

// Morgan logger configuration
export const logger = morgan(
  isDevelopment ? 'dev' : 'combined',
  {
    skip: (req, res) => {
      // Skip logging for health check endpoints
      return req.url === '/health' || req.url === '/';
    },
  }
);
