/**
 * Rate Limiting Middleware
 *
 * Implements different rate limits for different endpoint types:
 * - Strict limits for authentication endpoints (prevent brute force)
 * - Moderate limits for AI-powered endpoints (prevent cost abuse)
 * - General limits for all other endpoints (prevent DDoS)
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Global rate limiter - applies to all API endpoints
 * 100 requests per 15 minutes per IP
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    console.warn('[RATE_LIMIT] Global limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });

    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

/**
 * Authentication rate limiter - strict limits for login/register
 * 5 requests per 15 minutes per IP
 * Prevents brute force attacks
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  skipSuccessfulRequests: true, // Don't count successful requests
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    console.warn('[RATE_LIMIT] Auth limit exceeded - possible brute force attack', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });

    res.status(429).json({
      error: 'Too many authentication attempts. Please try again in 15 minutes.',
      retryAfter: '15 minutes'
    });
  }
});

/**
 * AI endpoints rate limiter - moderate limits for AI-powered features
 * 20 requests per 15 minutes per IP
 * Prevents API cost abuse
 */
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 AI requests per window
  message: {
    error: 'Too many AI requests, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    console.warn('[RATE_LIMIT] AI limit exceeded - possible cost abuse', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      user: (req as any).user?.id,
      timestamp: new Date().toISOString()
    });

    res.status(429).json({
      error: 'Too many AI requests. Please try again in 15 minutes.',
      retryAfter: '15 minutes'
    });
  }
});

/**
 * Strict rate limiter for sensitive operations
 * 10 requests per hour per IP
 * For operations like password reset, account deletion, etc.
 */
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  message: {
    error: 'Too many requests for this sensitive operation.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    console.warn('[RATE_LIMIT] Strict limit exceeded for sensitive operation', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      user: (req as any).user?.id,
      timestamp: new Date().toISOString()
    });

    res.status(429).json({
      error: 'Too many requests for this sensitive operation. Please try again in 1 hour.',
      retryAfter: '1 hour'
    });
  }
});

/**
 * Per-user rate limiter (requires authentication)
 * 50 requests per 15 minutes per user
 * Prevents individual user abuse
 */
export const createUserLimiter = () => rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per user per window
  keyGenerator: (req: Request) => {
    // Use user ID as key if authenticated, otherwise fall back to IP
    const user = (req as any).user;
    return user?.id || req.ip || 'unknown';
  },
  message: {
    error: 'You have made too many requests. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    console.warn('[RATE_LIMIT] User limit exceeded', {
      userId: (req as any).user?.id,
      ip: req.ip,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });

    res.status(429).json({
      error: 'You have made too many requests. Please try again in 15 minutes.',
      retryAfter: '15 minutes'
    });
  }
});
