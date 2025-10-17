import { Request, Response } from 'express';
import { masterAgentService } from '../../services/master-agent/master-agent.service';
import {
  LogEventInput,
  GetNudgesParams,
  NudgeInteractionParams,
  RecordFeedbackInput,
} from './master-agent.schema';
import { sendSuccess, sendError } from '../../utils/response.util';

/**
 * POST /api/v1/master-agent/events
 * Log an event (fire-and-forget)
 */
export const logEvent = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const input: LogEventInput = req.body;
    const eventId = await masterAgentService.logEvent(req.userId, input);
    sendSuccess(res, { event_id: eventId }, 'Event logged', 201);
  } catch (error) {
    console.error('Log event error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to log event', 500);
  }
};

/**
 * GET /api/v1/master-agent/nudges/:surface
 * Get active nudges for a surface
 */
export const getNudges = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const { surface } = req.params as GetNudgesParams;
    const nudges = await masterAgentService.getNudgesForSurface(
      req.userId,
      surface as 'home' | 'chat' | 'journal' | 'goals' | 'tools'
    );
    sendSuccess(res, { nudges });
  } catch (error) {
    console.error('Get nudges error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to get nudges', 500);
  }
};

/**
 * POST /api/v1/master-agent/nudges/:nudgeId/accept
 * Accept a nudge (user clicked CTA)
 */
export const acceptNudge = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const { nudgeId } = req.params as NudgeInteractionParams;
    await masterAgentService.acceptNudge(nudgeId, req.userId);
    sendSuccess(res, null, 'Nudge accepted');
  } catch (error) {
    console.error('Accept nudge error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to accept nudge', 500);
  }
};

/**
 * POST /api/v1/master-agent/nudges/:nudgeId/dismiss
 * Dismiss a nudge (user dismissed)
 */
export const dismissNudge = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const { nudgeId } = req.params as NudgeInteractionParams;
    await masterAgentService.dismissNudge(nudgeId, req.userId);
    sendSuccess(res, null, 'Nudge dismissed');
  } catch (error) {
    console.error('Dismiss nudge error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to dismiss nudge', 500);
  }
};

/**
 * POST /api/v1/master-agent/feedback
 * Record user feedback
 */
export const recordFeedback = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const input: RecordFeedbackInput = req.body;
    const feedbackId = await masterAgentService.recordFeedback(req.userId, input);
    sendSuccess(res, { feedback_id: feedbackId }, 'Feedback recorded', 201);
  } catch (error) {
    console.error('Record feedback error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to record feedback', 500);
  }
};

/**
 * GET /api/v1/master-agent/context
 * Get context summary (for debugging/admin)
 */
export const getContext = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const context = await masterAgentService.getContext(req.userId);
    sendSuccess(res, { context });
  } catch (error) {
    console.error('Get context error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to get context', 500);
  }
};
