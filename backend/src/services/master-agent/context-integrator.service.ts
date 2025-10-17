import { supabaseAdmin } from '../../config/supabase.config';
import { memoryService } from '../memory/memory.service';

/**
 * Context Summary - Aggregated user state
 */
export interface ContextSummary {
  themes: string[]; // Top themes from recent memory
  risks: RiskFlag[]; // Detected risk patterns
  momentum: MomentumMetrics; // Positive signals
  active_goal: ActiveGoal | null; // Current primary goal
  mood: MoodTrend; // Mood trend over time
  personalization: PersonalizationProfile; // User preferences
  recent_connections: string[]; // Cross-feature relations
}

export interface RiskFlag {
  risk_type: string; // 'no_journal_7d', 'low_mood_3d', 'no_goal_progress_14d'
  severity: 'low' | 'medium' | 'high';
  detected_at: string;
  description: string;
}

export interface MomentumMetrics {
  active_goals_count: number;
  streak_days: number;
  completion_rate: number; // 0.0 - 1.0
  recent_completions: number; // Count in last 7 days
}

export interface ActiveGoal {
  id: string;
  title: string;
  category: string;
  timeframe: string;
  progress: number;
}

export interface MoodTrend {
  avg: number; // Average mood value
  trend: 'improving' | 'stable' | 'declining' | 'unknown';
  days_since_last: number;
  recent_values: number[]; // Last 7 days
}

export interface PersonalizationProfile {
  tone: {
    empathy: number;
    formality: number;
    brevity: number;
  };
  nudge_freq_daily: number;
  energy_bias: string;
  cadence_bias: string;
}

/**
 * Context Integrator Service
 * Aggregates Memory + Personalization → Context Summary
 */
export class ContextIntegratorService {
  /**
   * Generate complete context summary for a user
   */
  async generateContextSummary(userId: string): Promise<ContextSummary> {
    const [
      themes,
      risks,
      momentum,
      activeGoal,
      mood,
      personalization,
      connections
    ] = await Promise.all([
      this.detectThemes(userId, 7),
      this.detectRisks(userId),
      this.calculateMomentum(userId),
      this.getActiveGoal(userId),
      this.getMoodTrend(userId, 7),
      this.getPersonalizationProfile(userId),
      this.getRecentConnections(userId)
    ]);

    return {
      themes,
      risks,
      momentum,
      active_goal: activeGoal,
      mood,
      personalization,
      recent_connections: connections
    };
  }

  /**
   * Detect top themes from recent memory blocks
   */
  async detectThemes(userId: string, days: number = 7): Promise<string[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data: blocks } = await supabaseAdmin
      .from('memory_blocks')
      .select('themes')
      .eq('user_id', userId)
      .gte('created_at', since.toISOString())
      .not('themes', 'is', null);

    if (!blocks || blocks.length === 0) {
      return [];
    }

    // Aggregate all themes and count frequency
    const themeCount: Record<string, number> = {};
    blocks.forEach(block => {
      const themes = block.themes as string[] || [];
      themes.forEach(theme => {
        themeCount[theme] = (themeCount[theme] || 0) + 1;
      });
    });

    // Sort by frequency and return top 5
    return Object.entries(themeCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([theme]) => theme);
  }

  /**
   * Detect risk patterns
   */
  async detectRisks(userId: string): Promise<RiskFlag[]> {
    const risks: RiskFlag[] = [];

    // Risk 1: No journal entries in 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentJournals } = await supabaseAdmin
      .from('journal_entries')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', sevenDaysAgo.toISOString())
      .limit(1);

    if (!recentJournals || recentJournals.length === 0) {
      risks.push({
        risk_type: 'no_journal_7d',
        severity: 'low',
        detected_at: new Date().toISOString(),
        description: 'No journal entries in the past 7 days'
      });
    }

    // Risk 2: Low mood for 3+ consecutive days
    const { data: recentMoods } = await supabaseAdmin
      .from('mood_checkins')
      .select('mood_value, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentMoods && recentMoods.length >= 3) {
      const lastThreeMoods = recentMoods.slice(0, 3);
      const avgMood = lastThreeMoods.reduce((sum, m) => sum + m.mood_value, 0) / 3;

      if (avgMood <= 2.5) {
        risks.push({
          risk_type: 'low_mood_3d',
          severity: 'medium',
          detected_at: new Date().toISOString(),
          description: 'Low mood detected for 3+ recent check-ins'
        });
      }
    }

    // Risk 3: No goal progress in 14 days
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const { data: recentActions } = await supabaseAdmin
      .from('weekly_actions')
      .select('id')
      .eq('user_id', userId)
      .gte('completed_at', fourteenDaysAgo.toISOString())
      .eq('completed', true)
      .limit(1);

    if (!recentActions || recentActions.length === 0) {
      const { data: activeGoals } = await supabaseAdmin
        .from('goals')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .limit(1);

      if (activeGoals && activeGoals.length > 0) {
        risks.push({
          risk_type: 'no_goal_progress_14d',
          severity: 'low',
          detected_at: new Date().toISOString(),
          description: 'No goal actions completed in 14 days'
        });
      }
    }

    return risks;
  }

  /**
   * Calculate momentum metrics
   */
  async calculateMomentum(userId: string): Promise<MomentumMetrics> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Active goals count
    const { data: activeGoals } = await supabaseAdmin
      .from('goals')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active');

    // Recent completions (last 7 days)
    const { data: recentCompletions } = await supabaseAdmin
      .from('weekly_actions')
      .select('id')
      .eq('user_id', userId)
      .gte('completed_at', sevenDaysAgo.toISOString())
      .eq('completed', true);

    // Total actions and completed for completion rate
    const { data: allActions } = await supabaseAdmin
      .from('weekly_actions')
      .select('completed')
      .eq('user_id', userId);

    const completionRate = allActions && allActions.length > 0
      ? allActions.filter(a => a.completed).length / allActions.length
      : 0;

    // Calculate streak (simplified - consecutive days with any activity)
    const streakDays = await this.calculateStreakDays(userId);

    return {
      active_goals_count: activeGoals?.length || 0,
      streak_days: streakDays,
      completion_rate: Number(completionRate.toFixed(2)),
      recent_completions: recentCompletions?.length || 0
    };
  }

  /**
   * Calculate streak days (consecutive days with activity)
   */
  private async calculateStreakDays(userId: string): Promise<number> {
    // Get all memory blocks ordered by date
    const { data: blocks, error } = await supabaseAdmin
      .from('memory_blocks')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);

    // Enhanced null/error checking
    if (error || !blocks || !Array.isArray(blocks) || blocks.length === 0) {
      return 0;
    }

    // Group by date with null safety
    const dates = new Set<string>();
    blocks.forEach(block => {
      if (block && block.created_at && typeof block.created_at === 'string') {
        const date = block.created_at.split('T')[0];
        if (date) {
          dates.add(date);
        }
      }
    });

    if (dates.size === 0) {
      return 0;
    }

    const sortedDates = Array.from(dates).sort().reverse();

    // Count consecutive days
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    let currentDate = today;

    for (const date of sortedDates) {
      if (date === currentDate) {
        streak++;
        // Move to previous day
        const d = new Date(currentDate);
        d.setDate(d.getDate() - 1);
        currentDate = d.toISOString().split('T')[0];
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Get user's active goal (highest priority)
   */
  async getActiveGoal(userId: string): Promise<ActiveGoal | null> {
    const { data: goal } = await supabaseAdmin
      .from('goals')
      .select('id, title, category, timeframe, progress')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!goal) {
      return null;
    }

    return {
      id: goal.id,
      title: goal.title,
      category: goal.category,
      timeframe: goal.timeframe,
      progress: goal.progress || 0
    };
  }

  /**
   * Get mood trend over time
   */
  async getMoodTrend(userId: string, days: number = 7): Promise<MoodTrend> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data: moods } = await supabaseAdmin
      .from('mood_checkins')
      .select('mood_value, created_at')
      .eq('user_id', userId)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false });

    if (!moods || moods.length === 0) {
      return {
        avg: 0,
        trend: 'unknown',
        days_since_last: 999,
        recent_values: []
      };
    }

    // Calculate average
    const avg = moods.reduce((sum, m) => sum + m.mood_value, 0) / moods.length;

    // Determine trend (compare first half vs second half)
    const mid = Math.floor(moods.length / 2);
    const firstHalf = moods.slice(0, mid);
    const secondHalf = moods.slice(mid);

    const avgFirst = firstHalf.reduce((sum, m) => sum + m.mood_value, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((sum, m) => sum + m.mood_value, 0) / secondHalf.length;

    let trend: MoodTrend['trend'] = 'stable';
    if (avgSecond > avgFirst + 0.5) trend = 'improving';
    else if (avgSecond < avgFirst - 0.5) trend = 'declining';

    // Days since last mood
    const lastMood = moods[0];
    const daysSinceLast = Math.floor(
      (Date.now() - new Date(lastMood.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      avg: Number(avg.toFixed(1)),
      trend,
      days_since_last: daysSinceLast,
      recent_values: moods.slice(0, 7).map(m => m.mood_value).reverse()
    };
  }

  /**
   * Get personalization profile
   */
  async getPersonalizationProfile(userId: string): Promise<PersonalizationProfile> {
    const { data: weights } = await supabaseAdmin
      .from('personalization_weights')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!weights) {
      // Return defaults
      return {
        tone: {
          empathy: 0.70,
          formality: 0.30,
          brevity: 0.50
        },
        nudge_freq_daily: 2,
        energy_bias: 'medium',
        cadence_bias: 'medium'
      };
    }

    return {
      tone: {
        empathy: weights.empathy,
        formality: weights.formality,
        brevity: weights.brevity
      },
      nudge_freq_daily: weights.nudge_freq_daily,
      energy_bias: weights.energy_bias,
      cadence_bias: weights.cadence_bias
    };
  }

  /**
   * Get recent cross-feature connections
   */
  async getRecentConnections(userId: string): Promise<string[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: relations } = await supabaseAdmin
      .from('memory_relations')
      .select(`
        relation_type,
        source_block:memory_blocks!memory_relations_source_block_id_fkey(source_feature),
        target_block:memory_blocks!memory_relations_target_block_id_fkey(source_feature)
      `)
      .eq('user_id', userId)
      .gte('created_at', sevenDaysAgo.toISOString())
      .limit(5);

    if (!relations || relations.length === 0) {
      return [];
    }

    // Format as "source↔target:type"
    return relations.map(r => {
      const source = (r as any).source_block?.source_feature || 'unknown';
      const target = (r as any).target_block?.source_feature || 'unknown';
      return `${source}↔${target}:${r.relation_type}`;
    });
  }

  /**
   * Cache insights for a period
   */
  async cacheInsights(userId: string, period: '7d' | '30d'): Promise<void> {
    const days = period === '7d' ? 7 : 30;
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - days);

    const summary = await this.generateContextSummary(userId);

    await supabaseAdmin
      .from('insights_cache')
      .insert({
        user_id: userId,
        cache_period: period,
        top_themes: summary.themes,
        risk_flags: summary.risks,
        momentum_metrics: summary.momentum,
        mood_trend: summary.mood,
        recent_connections: summary.recent_connections,
        period_start: periodStart.toISOString().split('T')[0],
        period_end: new Date().toISOString().split('T')[0]
      });
  }

  /**
   * Get cached insights if available and fresh
   */
  async getCachedInsights(userId: string, period: '7d' | '30d'): Promise<any | null> {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const { data: cache } = await supabaseAdmin
      .from('insights_cache')
      .select('*')
      .eq('user_id', userId)
      .eq('cache_period', period)
      .gte('computed_at', oneHourAgo.toISOString())
      .order('computed_at', { ascending: false })
      .limit(1)
      .single();

    return cache || null;
  }
}

export const contextIntegratorService = new ContextIntegratorService();
