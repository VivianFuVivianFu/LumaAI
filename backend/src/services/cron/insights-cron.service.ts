import { supabaseAdmin } from '../../config/supabase.config';
import { contextIntegratorService } from '../master-agent/context-integrator.service';
import { nudgeEngineService } from '../master-agent/nudge-engine.service';

/**
 * Insights Cron Service
 *
 * Runs automated tasks for Phase 3:
 * - Cache user context summaries
 * - Pre-generate nudges for active users
 * - Clean up expired data
 * - Generate weekly insights
 */

export class InsightsCronService {
  /**
   * Cache context summaries for all active users
   * Runs every 6 hours
   */
  async cacheUserContexts(): Promise<void> {
    console.log('[CRON] Starting context caching...');

    try {
      // Get all users active in last 7 days
      const { data: activeUsers } = await supabaseAdmin
        .from('events')
        .select('user_id')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (!activeUsers) return;

      // Get unique user IDs
      const userIds = [...new Set(activeUsers.map((e) => e.user_id))];

      console.log(`[CRON] Caching context for ${userIds.length} active users...`);

      let successCount = 0;
      let errorCount = 0;

      for (const userId of userIds) {
        try {
          // Get context summary
          const context = await contextIntegratorService.generateContextSummary(userId);

          // Cache in insights_cache table
          await supabaseAdmin.from('insights_cache').upsert({
            user_id: userId,
            insight_type: 'context_summary',
            insight_data: context,
            expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours
            updated_at: new Date().toISOString(),
          });

          successCount++;
        } catch (error) {
          console.error(`[CRON] Failed to cache context for user ${userId}:`, error);
          errorCount++;
        }
      }

      console.log(`[CRON] Context caching complete: ${successCount} success, ${errorCount} errors`);
    } catch (error) {
      console.error('[CRON] Context caching failed:', error);
    }
  }

  /**
   * Pre-generate nudges for active users
   * Runs every 4 hours
   */
  async pregenerateNudges(): Promise<void> {
    console.log('[CRON] Starting nudge pre-generation...');

    try {
      // Get users active in last 24 hours
      const { data: activeUsers } = await supabaseAdmin
        .from('events')
        .select('user_id')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (!activeUsers) return;

      const userIds = [...new Set(activeUsers.map((e) => e.user_id))];

      console.log(`[CRON] Pre-generating nudges for ${userIds.length} users...`);

      let successCount = 0;
      let errorCount = 0;

      for (const userId of userIds) {
        try {
          // Get context
          const context = await contextIntegratorService.buildContext(userId);

          // Generate nudges
          const nudges = await nudgeEngineService.generateNudges(userId, context);

          // Save to database
          if (nudges.length > 0) {
            await nudgeEngineService.saveNudges(userId, nudges);
            successCount++;
          }
        } catch (error) {
          console.error(`[CRON] Failed to generate nudges for user ${userId}:`, error);
          errorCount++;
        }
      }

      console.log(`[CRON] Nudge generation complete: ${successCount} success, ${errorCount} errors`);
    } catch (error) {
      console.error('[CRON] Nudge generation failed:', error);
    }
  }

  /**
   * Clean up expired data
   * Runs daily at 2 AM
   */
  async cleanupExpiredData(): Promise<void> {
    console.log('[CRON] Starting data cleanup...');

    try {
      const now = new Date().toISOString();

      // Delete expired nudges
      const { error: nudgesError, count: nudgesDeleted } = await supabaseAdmin
        .from('nudges')
        .delete()
        .lt('expires_at', now);

      if (nudgesError) throw nudgesError;

      // Delete expired cache entries
      const { error: cacheError, count: cacheDeleted } = await supabaseAdmin
        .from('insights_cache')
        .delete()
        .lt('expires_at', now);

      if (cacheError) throw cacheError;

      // Delete old events (keep only last 90 days)
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const { error: eventsError, count: eventsDeleted } = await supabaseAdmin
        .from('events')
        .delete()
        .lt('created_at', ninetyDaysAgo);

      if (eventsError) throw eventsError;

      console.log('[CRON] Cleanup complete:', {
        nudges_deleted: nudgesDeleted || 0,
        cache_deleted: cacheDeleted || 0,
        events_deleted: eventsDeleted || 0,
      });
    } catch (error) {
      console.error('[CRON] Cleanup failed:', error);
    }
  }

  /**
   * Generate weekly insights
   * Runs every Sunday at 8 AM
   */
  async generateWeeklyInsights(): Promise<void> {
    console.log('[CRON] Starting weekly insights generation...');

    try {
      // Get all active users
      const { data: activeUsers } = await supabaseAdmin
        .from('events')
        .select('user_id')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (!activeUsers) return;

      const userIds = [...new Set(activeUsers.map((e) => e.user_id))];

      console.log(`[CRON] Generating weekly insights for ${userIds.length} users...`);

      let successCount = 0;

      for (const userId of userIds) {
        try {
          const insights = await this.calculateWeeklyInsights(userId);

          // Cache insights
          await supabaseAdmin.from('insights_cache').insert({
            user_id: userId,
            insight_type: 'weekly_summary',
            insight_data: insights,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
          });

          successCount++;
        } catch (error) {
          console.error(`[CRON] Failed to generate insights for user ${userId}:`, error);
        }
      }

      console.log(`[CRON] Weekly insights complete: ${successCount} users`);
    } catch (error) {
      console.error('[CRON] Weekly insights failed:', error);
    }
  }

  /**
   * Calculate weekly insights for a user
   */
  private async calculateWeeklyInsights(userId: string): Promise<any> {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Get events from last week
    const { data: events } = await supabaseAdmin
      .from('events')
      .select('event_type, feature_area, created_at')
      .eq('user_id', userId)
      .gte('created_at', weekAgo);

    // Get mood check-ins
    const { data: moods } = await supabaseAdmin
      .from('mood_checkins')
      .select('mood_value')
      .eq('user_id', userId)
      .gte('created_at', weekAgo);

    // Get completed goals/actions
    const { data: completedActions } = await supabaseAdmin
      .from('goal_actions')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', true)
      .gte('completed_at', weekAgo);

    // Calculate insights
    const eventsByFeature: Record<string, number> = {};
    events?.forEach((event) => {
      eventsByFeature[event.feature_area] = (eventsByFeature[event.feature_area] || 0) + 1;
    });

    const avgMood = moods && moods.length > 0
      ? moods.reduce((sum, m) => sum + m.mood_value, 0) / moods.length
      : 0;

    const mostUsedFeature = Object.entries(eventsByFeature)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'none';

    return {
      week_start: weekAgo,
      week_end: new Date().toISOString(),
      total_activity: events?.length || 0,
      most_used_feature: mostUsedFeature,
      events_by_feature: eventsByFeature,
      avg_mood: avgMood,
      mood_checkins: moods?.length || 0,
      completed_actions: completedActions?.length || 0,
      engagement_score: this.calculateEngagementScore(events || [], moods || []),
    };
  }

  /**
   * Calculate engagement score (0-100)
   */
  private calculateEngagementScore(events: any[], moods: any[]): number {
    const activityScore = Math.min(events.length * 2, 40); // Max 40 points
    const moodScore = moods.length > 0
      ? (moods.reduce((sum, m) => sum + m.mood_value, 0) / moods.length) * 6
      : 0; // Max 36 points

    const consistencyScore = events.length >= 5 ? 24 : (events.length / 5) * 24; // Max 24 points

    return Math.min(Math.round(activityScore + moodScore + consistencyScore), 100);
  }

  // Store interval IDs for cleanup
  private intervals: NodeJS.Timeout[] = [];

  /**
   * Start all cron jobs
   */
  startCronJobs(): void {
    console.log('[CRON] Initializing cron jobs...');

    // Context caching - Every 6 hours
    const contextInterval = setInterval(() => {
      this.cacheUserContexts();
    }, 6 * 60 * 60 * 1000);
    this.intervals.push(contextInterval);

    // Nudge pre-generation - Every 4 hours
    const nudgeInterval = setInterval(() => {
      this.pregenerateNudges();
    }, 4 * 60 * 60 * 1000);
    this.intervals.push(nudgeInterval);

    // Cleanup - Daily at 2 AM (check every hour)
    const cleanupInterval = setInterval(() => {
      const hour = new Date().getHours();
      if (hour === 2) {
        this.cleanupExpiredData();
      }
    }, 60 * 60 * 1000);
    this.intervals.push(cleanupInterval);

    // Weekly insights - Every Sunday at 8 AM (check every hour)
    const weeklyInterval = setInterval(() => {
      const now = new Date();
      if (now.getDay() === 0 && now.getHours() === 8) {
        this.generateWeeklyInsights();
      }
    }, 60 * 60 * 1000);
    this.intervals.push(weeklyInterval);

    console.log('[CRON] All cron jobs started successfully');

    // Run initial caching
    this.cacheUserContexts();
  }

  /**
   * Stop all cron jobs
   */
  stopCronJobs(): void {
    console.log('[CRON] Stopping all cron jobs...');

    this.intervals.forEach((interval) => {
      clearInterval(interval);
    });

    this.intervals = [];
    console.log('[CRON] All cron jobs stopped');
  }
}

export const insightsCronService = new InsightsCronService();
