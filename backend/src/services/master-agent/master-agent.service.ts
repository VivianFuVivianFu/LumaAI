import { supabaseAdmin } from '../../config/supabase.config';
import { contextIntegratorService } from './context-integrator.service';
import { nudgeEngineService, Nudge } from './nudge-engine.service';
import { langfuseService, SpanName } from '../langfuse/langfuse.service';
import { langfuseEvaluatorService } from '../langfuse/langfuse-evaluator.service';
import { ContextSummary } from './context-integrator.service';

/**
 * Event Data - Flexible payload for different event types
 */
export interface EventData {
  event_type: string;
  source_feature: 'chat' | 'journal' | 'goals' | 'tools' | 'dashboard';
  source_id?: string;
  event_data?: any;
}

/**
 * Feedback Data - User feedback on nudges/responses
 */
export interface FeedbackData {
  feedback_type: string;
  target_type: 'nudge' | 'ai_response' | 'suggestion' | 'insight';
  target_id: string;
  rating?: number;
  comment?: string;
  metadata?: any;
}

/**
 * Master Agent Service
 * Orchestrates the entire event → context → nudge → feedback loop
 */
export class MasterAgentService {
  /**
   * Log an event (fire-and-forget from features)
   */
  async logEvent(userId: string, eventData: EventData): Promise<string> {
    try {
      // Validate eventData before insertion
      if (!eventData.event_type || !eventData.source_feature) {
        console.error('Event validation failed:', {
          userId,
          event_type: eventData.event_type,
          source_feature: eventData.source_feature,
        });
        throw new Error('Invalid event data: missing event_type or source_feature');
      }

      const { data: event, error } = await supabaseAdmin
        .from('events')
        .insert({
          user_id: userId,
          event_type: eventData.event_type,
          source_feature: eventData.source_feature,
          source_id: eventData.source_id,
          event_data: eventData.event_data || {},
        })
        .select()
        .single();

      if (error) {
        console.error('Event log error:', {
          error,
          userId,
          eventData,
          errorDetails: {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          }
        });
        throw new Error(`Failed to log event: ${error.message || 'Unknown error'}`);
      }

      if (!event) {
        console.error('Event created but no data returned:', { userId, eventData });
        throw new Error('Failed to log event: no event data returned');
      }

      // Process event asynchronously (don't wait)
      setImmediate(() => {
        this.processEvent(event.id, userId).catch(err =>
          console.error('Event processing error:', {
            eventId: event.id,
            userId,
            error: err.message,
            stack: err.stack
          })
        );
      });

      return event.id;
    } catch (error: any) {
      console.error('logEvent exception:', {
        userId,
        eventData,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Process an event (triggered async after logging)
   */
  async processEvent(eventId: string, userId: string): Promise<void> {
    // Create LangFuse trace
    const trace = await langfuseService.createTrace('master_agent_process', userId, {
      event_id: eventId,
    }).catch(() => null);

    try {
      // Check if flywheel is enabled
      const { data: weights } = await supabaseAdmin
        .from('personalization_weights')
        .select('flywheel_enabled')
        .eq('user_id', userId)
        .single();

      if (!weights || !weights.flywheel_enabled) {
        if (trace && typeof trace.update === 'function') {
          try {
            await trace.update({ output: { skipped: 'flywheel_disabled' } });
          } catch (traceError) {
            // Ignore trace errors
          }
        }
        return;
      }

      // Generate context summary
      const context = await contextIntegratorService.generateContextSummary(userId);

      // Generate nudges
      const nudges = await nudgeEngineService.generateNudges(userId, context);

      // Save nudges to database with trace_ids
      if (nudges.length > 0) {
        await this.saveNudgesWithTraces(userId, nudges, context);
      }

      // Mark event as processed
      await supabaseAdmin
        .from('events')
        .update({
          processed: true,
          processed_at: new Date().toISOString(),
        })
        .eq('id', eventId);

      if (trace && typeof trace.update === 'function') {
        try {
          await trace.update({
            output: {
              nudges_generated: nudges.length,
              context_themes: context.themes,
              risks: context.risks.length,
            },
          });
        } catch (traceError) {
          // Ignore trace errors
        }
      }
    } catch (error: any) {
      console.error('Event processing error:', error);
      if (trace && typeof trace.update === 'function') {
        try {
          await trace.update({
            output: { error: error.message },
            level: 'ERROR',
          });
        } catch (traceError) {
          // Ignore trace errors
        }
      }
    }
  }

  /**
   * Get nudges for a surface (called by frontend)
   */
  async getNudgesForSurface(
    userId: string,
    surface: 'home' | 'chat' | 'journal' | 'goals' | 'tools'
  ): Promise<any[]> {
    const { data: nudges } = await supabaseAdmin.rpc('get_active_nudges', {
      p_user_id: userId,
      p_surface: surface,
      p_limit: 2, // Max 2 nudges per surface
    });

    // Mark as shown
    if (nudges && nudges.length > 0) {
      const nudgeIds = nudges.map((n: any) => n.nudge_id);
      await supabaseAdmin
        .from('nudges')
        .update({ shown_at: new Date().toISOString() })
        .in('id', nudgeIds)
        .is('shown_at', null);
    }

    return nudges || [];
  }

  /**
   * Record nudge acceptance (user clicked CTA)
   */
  async acceptNudge(nudgeId: string, userId: string): Promise<void> {
    // Update nudge
    await supabaseAdmin
      .from('nudges')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', nudgeId)
      .eq('user_id', userId);

    // Record implicit feedback
    await this.recordFeedback(userId, {
      feedback_type: 'implicit_accept',
      target_type: 'nudge',
      target_id: nudgeId,
      metadata: { timestamp: new Date().toISOString() },
    });
  }

  /**
   * Record nudge dismissal
   */
  async dismissNudge(nudgeId: string, userId: string): Promise<void> {
    // Update nudge
    await supabaseAdmin
      .from('nudges')
      .update({ dismissed_at: new Date().toISOString() })
      .eq('id', nudgeId)
      .eq('user_id', userId);

    // Record implicit feedback
    await this.recordFeedback(userId, {
      feedback_type: 'implicit_dismiss',
      target_type: 'nudge',
      target_id: nudgeId,
      metadata: { timestamp: new Date().toISOString() },
    });
  }

  /**
   * Record nudge completion (user completed suggested action)
   */
  async completeNudge(nudgeId: string, userId: string): Promise<void> {
    // Update nudge
    await supabaseAdmin
      .from('nudges')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', nudgeId)
      .eq('user_id', userId);

    // Record implicit feedback
    await this.recordFeedback(userId, {
      feedback_type: 'implicit_complete',
      target_type: 'nudge',
      target_id: nudgeId,
      metadata: { timestamp: new Date().toISOString() },
    });

    // Trigger personalization update
    setImmediate(() => {
      this.updatePersonalization(userId).catch(err =>
        console.error('Personalization update error:', err)
      );
    });
  }

  /**
   * Record user feedback
   */
  async recordFeedback(userId: string, feedbackData: FeedbackData): Promise<string> {
    try {
      // Validate feedback data
      if (!feedbackData.feedback_type || !feedbackData.target_type || !feedbackData.target_id) {
        console.error('Feedback validation failed:', {
          userId,
          feedback_type: feedbackData.feedback_type,
          target_type: feedbackData.target_type,
          target_id: feedbackData.target_id,
        });
        throw new Error('Invalid feedback data: missing required fields');
      }

      const { data: feedback, error } = await supabaseAdmin
        .from('user_feedback')
        .insert({
          user_id: userId,
          feedback_type: feedbackData.feedback_type,
          target_type: feedbackData.target_type,
          target_id: feedbackData.target_id,
          rating: feedbackData.rating,
          comment: feedbackData.comment,
          metadata: feedbackData.metadata || {},
        })
        .select()
        .single();

      if (error) {
        console.error('Feedback record error:', {
          error,
          userId,
          feedbackData,
          errorDetails: {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          }
        });
        throw new Error(`Failed to record feedback: ${error.message || 'Unknown error'}`);
      }

      if (!feedback) {
        console.error('Feedback created but no data returned:', { userId, feedbackData });
        throw new Error('Failed to record feedback: no feedback data returned');
      }

      return feedback.id;
    } catch (error: any) {
      console.error('recordFeedback exception:', {
        userId,
        feedbackData,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Update personalization weights based on feedback
   */
  async updatePersonalization(userId: string): Promise<void> {
    // Get recent feedback (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentFeedback } = await supabaseAdmin
      .from('user_feedback')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (!recentFeedback || recentFeedback.length === 0) {
      return; // Not enough feedback to update
    }

    // Calculate adjustment factors
    const acceptCount = recentFeedback.filter(
      f => f.feedback_type === 'implicit_accept'
    ).length;
    const dismissCount = recentFeedback.filter(
      f => f.feedback_type === 'implicit_dismiss'
    ).length;
    const totalNudges = acceptCount + dismissCount;

    if (totalNudges === 0) return;

    const acceptRate = acceptCount / totalNudges;

    // Get current weights
    const { data: currentWeights } = await supabaseAdmin
      .from('personalization_weights')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!currentWeights) return;

    // Adjust nudge frequency based on accept rate
    let newNudgeFreq = currentWeights.nudge_freq_daily;

    if (acceptRate > 0.70 && newNudgeFreq < 10) {
      // High accept rate → increase frequency slightly
      newNudgeFreq = Math.min(newNudgeFreq + 1, 10);
    } else if (acceptRate < 0.30 && newNudgeFreq > 0) {
      // Low accept rate → decrease frequency
      newNudgeFreq = Math.max(newNudgeFreq - 1, 0);
    }

    // Update weights
    if (newNudgeFreq !== currentWeights.nudge_freq_daily) {
      await supabaseAdmin
        .from('personalization_weights')
        .update({ nudge_freq_daily: newNudgeFreq })
        .eq('user_id', userId);
    }

    console.log(
      `Updated personalization for ${userId}: nudge_freq ${currentWeights.nudge_freq_daily} → ${newNudgeFreq}`
    );
  }

  /**
   * Get context summary (for debugging/admin)
   */
  async getContext(userId: string): Promise<any> {
    const context = await contextIntegratorService.generateContextSummary(userId);
    return context;
  }

  /**
   * Save nudges with Langfuse traces and evaluation
   */
  private async saveNudgesWithTraces(
    userId: string,
    nudges: Nudge[],
    context: ContextSummary
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    for (const nudge of nudges) {
      const startTime = Date.now();

      // Create trace for this nudge
      const trace = await langfuseService.createUnifiedTrace({
        userId,
        pillar: 'master_agent',
        action: 'nudge',
        nudgeKind: nudge.kind,
        targetSurface: nudge.target_surface,
      }).catch(() => null);

      const traceId = trace?.id || null;
      const traceUrl = traceId ? langfuseService.getTraceUrl(traceId) : null;

      // Save nudge with trace info
      const { data: savedNudge } = await supabaseAdmin
        .from('nudges')
        .insert({
          user_id: userId,
          kind: nudge.kind,
          target_surface: nudge.target_surface,
          title: nudge.title,
          message: nudge.message,
          cta_label: nudge.cta_label,
          cta_action: nudge.cta_action,
          priority: nudge.priority,
          source_rule: nudge.source_rule,
          explainability: nudge.explainability,
          context_snapshot: nudge.context_snapshot,
          expires_at: expiresAt.toISOString(),
          trace_id: traceId,
          langfuse_trace_url: traceUrl,
        })
        .select()
        .single();

      // Evaluate nudge
      if (traceId) {
        await langfuseEvaluatorService.evaluateTrace({
          userId,
          traceId,
          pillar: 'master_agent',
          action: 'nudge',
          input: JSON.stringify(context),
          output: JSON.stringify(nudge),
          metadata: {
            nudge_id: savedNudge?.id,
            kind: nudge.kind,
            target_surface: nudge.target_surface,
            source_rule: nudge.source_rule,
          },
          latencyMs: Date.now() - startTime,
        });
      }
    }
  }

  /**
   * Manual nudge generation trigger (for testing)
   */
  async triggerNudgeGeneration(userId: string): Promise<void> {
    const context = await contextIntegratorService.generateContextSummary(userId);
    const nudges = await nudgeEngineService.generateNudges(userId, context);

    if (nudges.length > 0) {
      await this.saveNudgesWithTraces(userId, nudges, context);
    }
  }

  /**
   * Cache insights (called periodically via cron/scheduler)
   */
  async cacheInsightsForAllUsers(): Promise<void> {
    // Get all active users (with activity in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: activeUsers } = await supabaseAdmin
      .from('memory_blocks')
      .select('user_id')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('user_id');

    if (!activeUsers || activeUsers.length === 0) return;

    // Get unique user IDs
    const uniqueUserIds = [...new Set(activeUsers.map(u => u.user_id))];

    // Cache insights for each user
    for (const userId of uniqueUserIds) {
      try {
        await contextIntegratorService.cacheInsights(userId as string, '7d');
        await contextIntegratorService.cacheInsights(userId as string, '30d');
        console.log(`Cached insights for user ${userId}`);
      } catch (error) {
        console.error(`Failed to cache insights for user ${userId}:`, error);
      }
    }
  }

  /**
   * Clean up expired nudges (called periodically)
   */
  async cleanupExpiredNudges(): Promise<void> {
    const { data, error } = await supabaseAdmin
      .from('nudges')
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (error) {
      console.error('Cleanup error:', error);
    } else {
      console.log(`Cleaned up ${data?.length || 0} expired nudges`);
    }
  }
}

export const masterAgentService = new MasterAgentService();
