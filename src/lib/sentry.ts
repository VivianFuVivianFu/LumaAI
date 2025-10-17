/**
 * Sentry Error Tracking Integration
 *
 * To use Sentry:
 * 1. Install: npm install @sentry/react
 * 2. Create account at https://sentry.io
 * 3. Add VITE_SENTRY_DSN to .env.production
 * 4. Import and call initSentry() in main.tsx
 */

// Uncomment when @sentry/react is installed
// import * as Sentry from '@sentry/react';

interface SentryConfig {
  dsn: string;
  environment: string;
  tracesSampleRate: number;
  release?: string;
  enabled: boolean;
}

/**
 * Initialize Sentry error tracking
 */
export function initSentry() {
  const config: SentryConfig = {
    dsn: import.meta.env.VITE_SENTRY_DSN || '',
    environment: import.meta.env.VITE_APP_ENVIRONMENT || 'development',
    tracesSampleRate: parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || '0.1'),
    release: import.meta.env.VITE_APP_VERSION || '1.0.0',
    enabled: import.meta.env.VITE_ENABLE_ERROR_TRACKING === 'true',
  };

  // Only initialize if DSN is provided and enabled
  if (!config.dsn || !config.enabled) {
    console.log('[Sentry] Error tracking disabled or DSN not configured');
    return;
  }

  try {
    // Uncomment when @sentry/react is installed
    /*
    Sentry.init({
      dsn: config.dsn,
      environment: config.environment,
      release: config.release,
      tracesSampleRate: config.tracesSampleRate,

      integrations: [
        new Sentry.BrowserTracing({
          // Set trace propagation targets
          tracePropagationTargets: ['localhost', /^https:\/\/yourserver\.io\/api/],
        }),
        new Sentry.Replay({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],

      // Capture Replay for 10% of all sessions,
      // plus 100% of sessions with an error
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,

      // Filter out sensitive information
      beforeSend(event, hint) {
        // Remove PII from event
        if (event.request) {
          delete event.request.cookies;
          delete event.request.headers;
        }

        // Filter out known non-critical errors
        const error = hint.originalException;
        if (error && typeof error === 'object' && 'message' in error) {
          const message = (error as Error).message;

          // Ignore network errors that are expected
          if (message.includes('Failed to fetch') || message.includes('Network request failed')) {
            return null; // Don't send to Sentry
          }
        }

        return event;
      },

      // Ignore specific errors
      ignoreErrors: [
        // Browser extension errors
        'top.GLOBALS',
        'canvas.contentDocument',
        'MyApp_RemoveAllHighlights',
        'atomicFindClose',
        // Network errors
        'NetworkError',
        'Failed to fetch',
        'Load failed',
        // Random plugins/extensions
        'Can\'t find variable: ZiteReader',
        'jigsaw is not defined',
        'ComboSearch is not defined',
      ],
    });
    */

    console.log('[Sentry] Error tracking initialized');
  } catch (error) {
    console.error('[Sentry] Failed to initialize:', error);
  }
}

/**
 * Manually capture an exception
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (import.meta.env.VITE_ENABLE_ERROR_TRACKING !== 'true') {
    console.error('[Sentry] Would capture exception:', error, context);
    return;
  }

  try {
    // Uncomment when @sentry/react is installed
    /*
    Sentry.captureException(error, {
      tags: context?.tags,
      extra: context?.extra,
      level: context?.level || 'error',
    });
    */
    console.error('[Error]', error, context);
  } catch (e) {
    console.error('[Sentry] Failed to capture exception:', e);
  }
}

/**
 * Manually capture a message
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (import.meta.env.VITE_ENABLE_ERROR_TRACKING !== 'true') {
    console.log(`[Sentry] Would capture message (${level}):`, message);
    return;
  }

  try {
    // Uncomment when @sentry/react is installed
    /*
    Sentry.captureMessage(message, level);
    */
    console.log(`[${level.toUpperCase()}]`, message);
  } catch (error) {
    console.error('[Sentry] Failed to capture message:', error);
  }
}

/**
 * Set user context for error tracking
 */
export function setUser(user: { id: string; email?: string; username?: string } | null) {
  if (import.meta.env.VITE_ENABLE_ERROR_TRACKING !== 'true') {
    return;
  }

  try {
    // Uncomment when @sentry/react is installed
    /*
    Sentry.setUser(user);
    */
    console.log('[Sentry] User context set:', user?.id);
  } catch (error) {
    console.error('[Sentry] Failed to set user:', error);
  }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
  if (import.meta.env.VITE_ENABLE_ERROR_TRACKING !== 'true') {
    return;
  }

  try {
    // Uncomment when @sentry/react is installed
    /*
    Sentry.addBreadcrumb({
      message,
      category,
      level: 'info',
      data,
    });
    */
    if (import.meta.env.DEV) {
      console.log(`[Breadcrumb] ${category}: ${message}`, data);
    }
  } catch (error) {
    console.error('[Sentry] Failed to add breadcrumb:', error);
  }
}

/**
 * Installation instructions
 */
export const SENTRY_SETUP_INSTRUCTIONS = `
# Sentry Error Tracking Setup

## 1. Install Sentry SDK
npm install @sentry/react

## 2. Create Sentry Account
- Go to https://sentry.io
- Create a new project
- Select "React" as the platform
- Copy your DSN

## 3. Configure Environment Variables
Add to .env.production:
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
VITE_ENABLE_ERROR_TRACKING=true
VITE_SENTRY_TRACES_SAMPLE_RATE=0.1

## 4. Uncomment Sentry Code
- Uncomment imports in src/lib/sentry.ts
- Uncomment Sentry.init() call
- Uncomment all Sentry function calls

## 5. Initialize in main.tsx
import { initSentry } from './lib/sentry';
initSentry();

## 6. Use Error Boundary
The ErrorBoundary component will automatically send errors to Sentry.

## 7. Manual Error Tracking
import { captureException, captureMessage } from './lib/sentry';

try {
  // risky operation
} catch (error) {
  captureException(error, { extra: { context: 'user-action' } });
}
`;
