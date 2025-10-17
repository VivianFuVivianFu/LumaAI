import { supabaseAdmin } from '../../config/supabase.config';
import { MoodCheckinInput } from './dashboard.schema';

interface MoodCheckin {
  id: string;
  user_id: string;
  mood_value: number;
  notes: string | null;
  created_at: string;
}

export class DashboardService {
  async submitMoodCheckin(userId: string, input: MoodCheckinInput): Promise<MoodCheckin> {
    const { mood_value, notes } = input;

    const { data, error } = await supabaseAdmin
      .from('mood_checkins')
      .insert({
        user_id: userId,
        mood_value,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error('Failed to save mood check-in');
    }

    return data;
  }

  async getMoodHistory(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabaseAdmin
      .from('mood_checkins')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('Failed to fetch mood history');
    }

    // Calculate stats
    const moodValues = data.map((checkin) => checkin.mood_value);
    const averageMood = moodValues.length > 0
      ? moodValues.reduce((sum, val) => sum + val, 0) / moodValues.length
      : 0;

    // Determine trend
    let trendDirection: 'improving' | 'steady' | 'declining' = 'steady';
    if (moodValues.length >= 2) {
      const firstHalf = moodValues.slice(Math.floor(moodValues.length / 2));
      const secondHalf = moodValues.slice(0, Math.floor(moodValues.length / 2));

      const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

      if (secondAvg > firstAvg + 0.3) trendDirection = 'improving';
      else if (secondAvg < firstAvg - 0.3) trendDirection = 'declining';
    }

    return {
      mood_checkins: data,
      stats: {
        average_mood: parseFloat(averageMood.toFixed(2)),
        trend_direction: trendDirection,
        total_checkins: data.length,
      },
    };
  }

  async getDashboardStats(userId: string) {
    // Get last 7 days of mood data
    const { mood_checkins, stats } = await this.getMoodHistory(userId, 7);

    // Get mood values for trend chart
    const moodTrend = mood_checkins
      .slice(0, 7)
      .reverse()
      .map((checkin) => checkin.mood_value);

    // TODO: Add streaks calculation when journal entries are implemented
    const streaks = {
      journaling: 0,
      reflection: 0,
    };

    // TODO: Add goals count when goals are implemented
    const activeGoalsCount = 0;

    return {
      mood_trend: moodTrend,
      streaks,
      active_goals_count: activeGoalsCount,
      average_mood: stats.average_mood,
      trend_direction: stats.trend_direction,
    };
  }
}
