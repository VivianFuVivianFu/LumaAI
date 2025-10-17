import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../utils/response.util';
import { supabaseAdmin } from '../../config/supabase.config';

/**
 * Admin/Debug Controller for Phase 3 Monitoring
 * Provides insights into events, nudges, and system performance
 */

/**
 * Get recent events for debugging
 */
export const getDebugEvents = async (req: Request, res: Response) => {
  try {
    const { timeRange = '24h' } = req.query;
    const userId = req.userId!;

    // Calculate time threshold
    const hoursBack = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
    const threshold = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

    const { data: events, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', threshold)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    sendSuccess(res, { events: events || [] }, 'Events retrieved successfully');
  } catch (error) {
    console.error('Get debug events error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to get events', 500);
  }
};

/**
 * Get all nudges (including dismissed/accepted) for debugging
 */
export const getDebugNudges = async (req: Request, res: Response) => {
  try {
    const { timeRange = '24h' } = req.query;
    const userId = req.userId!;

    const hoursBack = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
    const threshold = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

    const { data: nudges, error } = await supabaseAdmin
      .from('nudges')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', threshold)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    sendSuccess(res, { nudges: nudges || [] }, 'Nudges retrieved successfully');
  } catch (error) {
    console.error('Get debug nudges error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to get nudges', 500);
  }
};

/**
 * Get all feedback for debugging
 */
export const getDebugFeedback = async (req: Request, res: Response) => {
  try {
    const { timeRange = '24h' } = req.query;
    const userId = req.userId!;

    const hoursBack = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
    const threshold = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

    const { data: feedback, error } = await supabaseAdmin
      .from('user_feedback')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', threshold)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    sendSuccess(res, { feedback: feedback || [] }, 'Feedback retrieved successfully');
  } catch (error) {
    console.error('Get debug feedback error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to get feedback', 500);
  }
};

/**
 * Get aggregated statistics for dashboard
 */
export const getDebugStats = async (req: Request, res: Response) => {
  try {
    const { timeRange = '24h' } = req.query;
    const userId = req.userId!;

    const hoursBack = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
    const threshold = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

    // Get event counts by feature
    const { data: events } = await supabaseAdmin
      .from('events')
      .select('feature_area')
      .eq('user_id', userId)
      .gte('created_at', threshold);

    const eventsByFeature: Record<string, number> = {};
    events?.forEach((event) => {
      eventsByFeature[event.feature_area] = (eventsByFeature[event.feature_area] || 0) + 1;
    });

    // Get nudge counts by surface
    const { data: nudges } = await supabaseAdmin
      .from('nudges')
      .select('target_surface, status')
      .eq('user_id', userId)
      .gte('created_at', threshold);

    const nudgesBySurface: Record<string, number> = {};
    let acceptedCount = 0;
    let totalNudges = 0;

    nudges?.forEach((nudge) => {
      nudgesBySurface[nudge.target_surface] = (nudgesBySurface[nudge.target_surface] || 0) + 1;
      totalNudges++;
      if (nudge.status === 'accepted') acceptedCount++;
    });

    // Get feedback counts by type
    const { data: feedback } = await supabaseAdmin
      .from('user_feedback')
      .select('feedback_type')
      .eq('user_id', userId)
      .gte('created_at', threshold);

    const feedbackByType: Record<string, number> = {};
    feedback?.forEach((item) => {
      feedbackByType[item.feedback_type] = (feedbackByType[item.feedback_type] || 0) + 1;
    });

    const stats = {
      total_events: events?.length || 0,
      total_nudges: totalNudges,
      total_feedback: feedback?.length || 0,
      nudge_acceptance_rate: totalNudges > 0 ? acceptedCount / totalNudges : 0,
      events_by_feature: eventsByFeature,
      nudges_by_surface: nudgesBySurface,
      feedback_by_type: feedbackByType,
    };

    sendSuccess(res, { stats }, 'Stats retrieved successfully');
  } catch (error) {
    console.error('Get debug stats error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to get stats', 500);
  }
};

/**
 * Test a specific nudge rule manually
 */
export const testNudgeRule = async (req: Request, res: Response) => {
  try {
    const { ruleName } = req.body;
    const userId = req.userId!;

    // This would trigger a specific rule pack and return the results
    // Implementation depends on nudge engine refactoring

    sendSuccess(res, {
      message: 'Rule testing not yet implemented',
      rule_name: ruleName
    }, 'Test initiated');
  } catch (error) {
    console.error('Test nudge rule error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to test rule', 500);
  }
};

/**
 * Get system health metrics
 */
export const getSystemHealth = async (req: Request, res: Response) => {
  try {
    // Check database connection
    const { data: dbCheck } = await supabaseAdmin
      .from('events')
      .select('id')
      .limit(1);

    const health = {
      database: dbCheck ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };

    sendSuccess(res, { health }, 'System health retrieved');
  } catch (error) {
    console.error('Get system health error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to get system health', 500);
  }
};
