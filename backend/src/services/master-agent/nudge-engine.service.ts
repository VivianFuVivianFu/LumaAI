import { supabaseAdmin } from '../../config/supabase.config';
import { OpenAIService } from '../openai/openai.service';
import { ContextSummary } from './context-integrator.service';

/**
 * Nudge - Generated suggestion for user
 */
export interface Nudge {
  kind: string;
  target_surface: string;
  title: string;
  message: string;
  cta_label?: string;
  cta_action?: any;
  priority: number;
  source_rule: string;
  explainability: string;
  context_snapshot?: any;
}

/**
 * Rule Result - Output from a nudge rule
 */
interface RuleResult {
  matched: boolean;
  nudges: Nudge[];
}

/**
 * Nudge Engine Service
 * Rules-first nudge generation + guarded LLM fallback
 */
export class NudgeEngineService {
  private openaiService: OpenAIService;

  constructor() {
    this.openaiService = new OpenAIService();
  }

  /**
   * Generate nudges for a user based on context
   */
  async generateNudges(
    userId: string,
    context: ContextSummary,
    targetSurface?: string
  ): Promise<Nudge[]> {
    const allNudges: Nudge[] = [];

    // Apply rule packs (deterministic)
    const ruleNudges = await this.applyRulePacks(userId, context);
    allNudges.push(...ruleNudges);

    // LLM fallback (only if enabled and no rules matched)
    if (allNudges.length === 0 && context.personalization.nudge_freq_daily > 0) {
      const llmNudge = await this.generateLLMNudge(userId, context);
      if (llmNudge) {
        allNudges.push(llmNudge);
      }
    }

    // Filter by target surface if specified
    let filteredNudges = targetSurface
      ? allNudges.filter(n => n.target_surface === targetSurface)
      : allNudges;

    // Deduplicate by kind
    filteredNudges = this.deduplicateNudges(filteredNudges);

    // Respect cadence limits
    filteredNudges = await this.respectCadence(userId, filteredNudges, context);

    // Sort by priority
    filteredNudges.sort((a, b) => b.priority - a.priority);

    return filteredNudges;
  }

  /**
   * Apply all rule packs
   */
  private async applyRulePacks(userId: string, context: ContextSummary): Promise<Nudge[]> {
    const nudges: Nudge[] = [];

    // Rule Pack 1: Cross-Feature Bridges
    nudges.push(...(await this.crossFeatureBridges(userId, context)).nudges);

    // Rule Pack 2: Risk Hygiene
    nudges.push(...(await this.riskHygiene(userId, context)).nudges);

    // Rule Pack 3: Momentum Celebration
    nudges.push(...(await this.momentumCelebration(userId, context)).nudges);

    // Rule Pack 4: Wellness Checkpoints (NEW - Phase 3.3)
    nudges.push(...(await this.wellnessCheckpoints(userId, context)).nudges);

    // Rule Pack 5: Enhanced Risk Mitigation (NEW - Phase 3.3)
    nudges.push(...(await this.enhancedRiskMitigation(userId, context)).nudges);

    // Rule Pack 6: Engagement Recovery (NEW - Phase 3.3)
    nudges.push(...(await this.engagementRecovery(userId, context)).nudges);

    return nudges;
  }

  /**
   * Rule Pack 1: Cross-Feature Bridges
   */
  private async crossFeatureBridges(userId: string, context: ContextSummary): Promise<RuleResult> {
    const nudges: Nudge[] = [];

    // Rule 1.1: Tool completed → Suggest journal reflection
    const { data: recentToolCompletions } = await supabaseAdmin
      .from('brain_exercises')
      .select('id, title, created_at')
      .eq('user_id', userId)
      .eq('completed', true)
      .gte('created_at', new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()) // Last 2 hours
      .limit(1);

    if (recentToolCompletions && recentToolCompletions.length > 0) {
      const tool = recentToolCompletions[0];
      nudges.push({
        kind: 'cross_feature_insight',
        target_surface: 'journal',
        title: 'Reflect on your exercise',
        message: `You just completed "${tool.title}". Want to journal 2 lines about how it felt?`,
        cta_label: 'Start journaling',
        cta_action: { target: 'journal/new', data: { prompt: `Reflect on ${tool.title}` } },
        priority: 7,
        source_rule: 'cross_feature_bridge_tool_to_journal',
        explainability: `You completed a brain exercise recently. Journaling helps cement insights.`
      });
    }

    // Rule 1.2: Journal completed → Suggest goal micro-step
    const { data: recentJournals } = await supabaseAdmin
      .from('journal_entries')
      .select('id, created_at')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()) // Last 2 hours
      .limit(1);

    if (recentJournals && recentJournals.length > 0 && context.active_goal) {
      nudges.push({
        kind: 'goal_reminder',
        target_surface: 'goals',
        title: 'Ready for a micro-step?',
        message: `You just journaled! Try a 5-10 min starter task for "${context.active_goal.title}".`,
        cta_label: 'View actions',
        cta_action: { target: `goals/${context.active_goal.id}`, data: {} },
        priority: 6,
        source_rule: 'cross_feature_bridge_journal_to_goal',
        explainability: `Journaling creates clarity. Now's a good time for a small goal step.`
      });
    }

    return { matched: nudges.length > 0, nudges };
  }

  /**
   * Rule Pack 2: Risk Hygiene
   */
  private async riskHygiene(userId: string, context: ContextSummary): Promise<RuleResult> {
    const nudges: Nudge[] = [];

    // Rule 2.1: Low mood 3+ days → Suggest low-energy tool
    const lowMoodRisk = context.risks.find(r => r.risk_type === 'low_mood_3d');
    if (lowMoodRisk) {
      nudges.push({
        kind: 'wellness_checkpoint',
        target_surface: 'tools',
        title: 'Feeling heavy?',
        message: `Try a 2-min breathing exercise. It's gentle and can help shift energy.`,
        cta_label: 'Start breathing',
        cta_action: { target: 'tools/future-me', data: { preferred_tone: 'calming' } },
        priority: 8,
        source_rule: 'risk_hygiene_low_mood',
        explainability: `Your recent mood check-ins have been lower than usual. A simple breathing exercise can help.`
      });
    }

    // Rule 2.2: No journal 7d → Offer re-entry prompts
    const noJournalRisk = context.risks.find(r => r.risk_type === 'no_journal_7d');
    if (noJournalRisk) {
      nudges.push({
        kind: 'journal_prompt',
        target_surface: 'journal',
        title: `It's been a while!`,
        message: `No pressure, but here are 3 easy prompts to ease back into journaling.`,
        cta_label: 'See prompts',
        cta_action: { target: 'journal/new', data: { mode: 'free-write' } },
        priority: 5,
        source_rule: 'risk_hygiene_no_journal_7d',
        explainability: `You haven't journaled in a week. Sometimes re-entry is easier with prompts.`
      });
    }

    // Rule 2.3: No goal progress 14d → Suggest adjustment
    const noProgressRisk = context.risks.find(r => r.risk_type === 'no_goal_progress_14d');
    if (noProgressRisk && context.active_goal) {
      nudges.push({
        kind: 'goal_reminder',
        target_surface: 'goals',
        title: `Let's adjust the plan`,
        message: `No progress on "${context.active_goal.title}" lately. Want to break steps down smaller?`,
        cta_label: 'View goal',
        cta_action: { target: `goals/${context.active_goal.id}`, data: {} },
        priority: 6,
        source_rule: 'risk_hygiene_no_progress_14d',
        explainability: `You haven't completed actions for this goal in 14 days. Smaller steps might help.`
      });
    }

    return { matched: nudges.length > 0, nudges };
  }

  /**
   * Rule Pack 3: Momentum Celebration
   */
  private async momentumCelebration(userId: string, context: ContextSummary): Promise<RuleResult> {
    const nudges: Nudge[] = [];

    // Rule 3.1: 5-day streak → Celebration
    if (context.momentum.streak_days >= 5) {
      nudges.push({
        kind: 'celebration',
        target_surface: 'home',
        title: `🔥 You're on a roll!`,
        message: `${context.momentum.streak_days} days in a row! Your consistency is building real change.`,
        priority: 9,
        source_rule: 'momentum_celebration_streak',
        explainability: `You've been active for ${context.momentum.streak_days} consecutive days. That's worth celebrating!`
      });
    }

    // Rule 3.2: Goal 50%+ complete → Milestone celebration
    if (context.active_goal && context.active_goal.progress >= 50) {
      nudges.push({
        kind: 'celebration',
        target_surface: 'goals',
        title: 'Halfway there!',
        message: `Your "${context.active_goal.title}" goal is ${context.active_goal.progress}% done. Proud of you! 🎉`,
        priority: 7,
        source_rule: 'momentum_celebration_milestone',
        explainability: `You've completed over half of "${context.active_goal.title}". That's a big deal!`
      });
    }

    // Rule 3.3: High completion rate → Acknowledge momentum
    if (context.momentum.completion_rate >= 0.70) {
      nudges.push({
        kind: 'celebration',
        target_surface: 'home',
        title: `You're crushing it!`,
        message: `${Math.round(context.momentum.completion_rate * 100)}% completion rate. Keep this momentum going!`,
        priority: 6,
        source_rule: 'momentum_celebration_completion_rate',
        explainability: `You're completing ${Math.round(context.momentum.completion_rate * 100)}% of your actions. That's excellent!`
      });
    }

    return { matched: nudges.length > 0, nudges };
  }

  /**
   * Rule Pack 4: Wellness Checkpoints (NEW - Phase 3.3)
   * Proactive wellness monitoring and self-care reminders
   */
  private async wellnessCheckpoints(userId: string, context: ContextSummary): Promise<RuleResult> {
    const nudges: Nudge[] = [];

    // Rule 4.1: Consistent low mood (avg < 3 for 5+ days) → Self-care reminder
    if (context.mood.avg < 3 && context.mood.recent_values.length >= 5) {
      nudges.push({
        kind: 'wellness_checkpoint',
        target_surface: 'home',
        title: 'Check in with yourself',
        message: 'You\'ve been feeling low lately. What\'s one small thing that might help today?',
        cta_label: 'Chat with Luma',
        cta_action: { target: 'chat/new', data: { suggested_topic: 'self_care' } },
        priority: 9,
        source_rule: 'wellness_checkpoint_low_mood_pattern',
        explainability: `Your mood has been consistently low (avg ${context.mood.avg}/6). It might help to talk through it.`
      });
    }

    // Rule 4.2: No activity for 3+ days → Gentle re-engagement
    const daysSinceActivity = Math.floor((Date.now() - new Date(context.momentum.last_activity_at).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceActivity >= 3) {
      nudges.push({
        kind: 'wellness_checkpoint',
        target_surface: 'home',
        title: 'We miss you!',
        message: `It's been ${daysSinceActivity} days. No pressure—want to check in with a quick mood rating?`,
        cta_label: 'Check in',
        cta_action: { target: 'dashboard', data: {} },
        priority: 6,
        source_rule: 'wellness_checkpoint_inactive_days',
        explainability: `You haven't been active for ${daysSinceActivity} days. A quick check-in can help.`
      });
    }

    // Rule 4.3: High engagement but declining mood → Burnout prevention
    if (context.momentum.streak_days >= 7 && context.mood.trend === 'declining') {
      nudges.push({
        kind: 'wellness_checkpoint',
        target_surface: 'home',
        title: 'Are you pushing too hard?',
        message: 'You\'re super consistent, but your mood\'s dipping. Maybe take a gentler day?',
        cta_label: 'Self-care tips',
        cta_action: { target: 'tools/future-me', data: { theme: 'rest_recovery' } },
        priority: 8,
        source_rule: 'wellness_checkpoint_burnout_prevention',
        explainability: `High streak (${context.momentum.streak_days} days) but mood declining. Rest is productive too!`
      });
    }

    // Rule 4.4: Weekend wellness check (Friday/Saturday evening)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sunday, 5=Friday, 6=Saturday
    const hour = now.getHours();
    if ((dayOfWeek === 5 || dayOfWeek === 6) && hour >= 18) {
      nudges.push({
        kind: 'wellness_checkpoint',
        target_surface: 'journal',
        title: 'Weekend reflection',
        message: 'Quick weekend check-in: What went well this week? What needs care?',
        cta_label: 'Journal 2 mins',
        cta_action: { target: 'journal/new', data: { mode: 'free-write' } },
        priority: 4,
        source_rule: 'wellness_checkpoint_weekend',
        explainability: 'Weekend is a good time to reflect on the week.'
      });
    }

    return { matched: nudges.length > 0, nudges };
  }

  /**
   * Rule Pack 5: Enhanced Risk Mitigation (NEW - Phase 3.3)
   * Advanced risk detection and intervention
   */
  private async enhancedRiskMitigation(userId: string, context: ContextSummary): Promise<RuleResult> {
    const nudges: Nudge[] = [];

    // Rule 5.1: Abandoned goal with no progress for 30+ days → Reset or archive
    if (context.active_goal) {
      const daysSinceProgress = Math.floor(
        (Date.now() - new Date(context.active_goal.last_progress_at || context.active_goal.created_at).getTime()) /
        (1000 * 60 * 60 * 24)
      );

      if (daysSinceProgress >= 30) {
        nudges.push({
          kind: 'goal_reminder',
          target_surface: 'goals',
          title: 'Is this goal still relevant?',
          message: `No progress on "${context.active_goal.title}" for 30+ days. Archive it or break it down smaller?`,
          cta_label: 'Review goal',
          cta_action: { target: `goals/${context.active_goal.id}`, data: {} },
          priority: 7,
          source_rule: 'risk_mitigation_abandoned_goal',
          explainability: `This goal has been inactive for ${daysSinceProgress} days. Time to reassess?`
        });
      }
    }

    // Rule 5.2: Mood volatility (high variance in recent check-ins) → Stability support
    if (context.mood.recent_values.length >= 5) {
      const variance = this.calculateVariance(context.mood.recent_values);
      if (variance > 2.0) {
        nudges.push({
          kind: 'wellness_checkpoint',
          target_surface: 'chat',
          title: 'Mood swings?',
          message: 'Your mood has been up and down. Want to talk through what\'s shifting?',
          cta_label: 'Chat now',
          cta_action: { target: 'chat/new', data: { suggested_topic: 'mood_stability' } },
          priority: 8,
          source_rule: 'risk_mitigation_mood_volatility',
          explainability: 'Your recent mood check-ins show high variability. Talking might help stabilize.'
        });
      }
    }

    // Rule 5.3: Rapid goal creation without completion → Over-commitment warning
    const { data: recentGoals } = await supabaseAdmin
      .from('goals')
      .select('id, created_at, status')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString()) // Last 14 days
      .order('created_at', { ascending: false });

    if (recentGoals && recentGoals.length >= 3) {
      const completedGoals = recentGoals.filter(g => g.status === 'completed').length;
      if (completedGoals === 0) {
        nudges.push({
          kind: 'goal_reminder',
          target_surface: 'goals',
          title: 'Too many goals?',
          message: 'You\'ve added 3+ goals recently but none are complete yet. Focus on one?',
          cta_label: 'View goals',
          cta_action: { target: 'goals', data: {} },
          priority: 6,
          source_rule: 'risk_mitigation_overcommitment',
          explainability: 'Multiple new goals without completions might mean you\'re overcommitted.'
        });
      }
    }

    return { matched: nudges.length > 0, nudges };
  }

  /**
   * Rule Pack 6: Engagement Recovery (NEW - Phase 3.3)
   * Re-engagement strategies for lapsed users
   */
  private async engagementRecovery(userId: string, context: ContextSummary): Promise<RuleResult> {
    const nudges: Nudge[] = [];

    // Rule 6.1: Lapsed user (no activity 7-14 days) → Value reminder
    const daysSinceActivity = Math.floor((Date.now() - new Date(context.momentum.last_activity_at).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceActivity >= 7 && daysSinceActivity <= 14) {
      nudges.push({
        kind: 'engagement_recovery',
        target_surface: 'home',
        title: 'Come back anytime',
        message: `Life gets busy! Your progress is still here: ${context.momentum.streak_days} day streak, ${context.active_goal?.progress || 0}% on goals.`,
        cta_label: 'Pick up where you left off',
        cta_action: { target: 'dashboard', data: {} },
        priority: 7,
        source_rule: 'engagement_recovery_lapsed_user',
        explainability: `You've been away for ${daysSinceActivity} days. Your progress is waiting!`
      });
    }

    // Rule 6.2: Used to be consistent (streak >= 5) but lapsed → Restart momentum
    if (context.momentum.max_streak >= 5 && context.momentum.streak_days === 0 && daysSinceActivity >= 3) {
      nudges.push({
        kind: 'engagement_recovery',
        target_surface: 'home',
        title: 'Restart your streak',
        message: `You had a ${context.momentum.max_streak}-day streak! Want to start a new one? Just 1 check-in gets you going.`,
        cta_label: 'Start today',
        cta_action: { target: 'dashboard', data: {} },
        priority: 8,
        source_rule: 'engagement_recovery_restart_streak',
        explainability: `You previously had a ${context.momentum.max_streak}-day streak. You can do it again!`
      });
    }

    // Rule 6.3: Feature-specific re-engagement (journaled before but stopped)
    const { data: journalCount } = await supabaseAdmin
      .from('journal_entries')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { data: recentJournal } = await supabaseAdmin
      .from('journal_entries')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (journalCount && (journalCount as any).count >= 3 && recentJournal) {
      const daysSinceJournal = Math.floor((Date.now() - new Date(recentJournal.created_at).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceJournal >= 10) {
        nudges.push({
          kind: 'engagement_recovery',
          target_surface: 'journal',
          title: 'Your journal misses you',
          message: `You've written ${(journalCount as any).count} times before. Want to add another page today?`,
          cta_label: 'Journal now',
          cta_action: { target: 'journal/new', data: { mode: 'free-write' } },
          priority: 5,
          source_rule: 'engagement_recovery_journal',
          explainability: `You journaled ${(journalCount as any).count} times but haven't in ${daysSinceJournal} days.`
        });
      }
    }

    return { matched: nudges.length > 0, nudges };
  }

  /**
   * Helper: Calculate variance for mood volatility detection
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * LLM Fallback (guarded)
   */
  private async generateLLMNudge(userId: string, context: ContextSummary): Promise<Nudge | null> {
    // Check if LLM nudges are enabled
    const { data: weights } = await supabaseAdmin
      .from('personalization_weights')
      .select('llm_nudges_enabled')
      .eq('user_id', userId)
      .single();

    if (!weights || !weights.llm_nudges_enabled) {
      return null;
    }

    // Check context richness threshold
    const hasThemes = context.themes.length >= 2;
    const hasActiveGoal = context.active_goal !== null;
    const hasMoodData = context.mood.recent_values.length >= 3;

    if (!hasThemes && !hasActiveGoal && !hasMoodData) {
      return null; // Not enough context
    }

    try {
      // Get top 3 memory snippets
      const { data: topBlocks } = await supabaseAdmin
        .from('memory_blocks')
        .select('summary, content_text')
        .eq('user_id', userId)
        .order('relevance_score', { ascending: false })
        .limit(3);

      const memorySnippets = topBlocks
        ?.map((b, i) => `${i + 1}. ${b.summary || b.content_text.substring(0, 100)}`)
        .join('\n') || 'No memory snippets';

      const prompt = `You are Luma's nudge generator. Create a supportive, actionable nudge.

User Context:
- Themes: ${context.themes.join(', ') || 'none'}
- Risks: ${context.risks.map(r => r.risk_type).join(', ') || 'none'}
- Active Goal: ${context.active_goal?.title || 'none'}
- Mood Trend: ${context.mood.trend} (avg: ${context.mood.avg})
- Streak: ${context.momentum.streak_days} days
- Memory Snippets:
${memorySnippets}

Generate 1 nudge (JSON):
{
  "kind": "suggest_tool" | "journal_prompt" | "goal_reminder" | "cross_feature_insight",
  "target_surface": "home" | "chat" | "journal" | "goals" | "tools",
  "title": "short, supportive (≤40 chars)",
  "message": "≤150 chars, warm and actionable",
  "cta_label": "action verb (≤20 chars)",
  "cta_action": {"target": "feature/path", "data": {}}
}

Guidelines:
- Be warm, not clinical
- Keep message ≤150 chars
- Make it actionable
- Avoid trauma/crisis content
- Focus on small, doable steps`;

      const response = await this.openaiService.generateStructuredResponse(
        prompt,
        'You are a supportive nudge generator for Luma.',
        []
      );

      const nudgeData = this.parseJSON(response.content);

      return {
        kind: nudgeData.kind,
        target_surface: nudgeData.target_surface,
        title: nudgeData.title,
        message: nudgeData.message,
        cta_label: nudgeData.cta_label,
        cta_action: nudgeData.cta_action,
        priority: 4,
        source_rule: 'llm_fallback',
        explainability: `AI-generated based on your recent themes and patterns.`,
        context_snapshot: {
          themes: context.themes,
          risks: context.risks.map(r => r.risk_type),
          active_goal: context.active_goal?.title
        }
      };
    } catch (error) {
      console.error('LLM nudge generation error:', error);
      return null;
    }
  }

  /**
   * Deduplicate nudges by kind (keep highest priority)
   */
  private deduplicateNudges(nudges: Nudge[]): Nudge[] {
    const seen = new Map<string, Nudge>();

    nudges.forEach(nudge => {
      const existing = seen.get(nudge.kind);
      if (!existing || nudge.priority > existing.priority) {
        seen.set(nudge.kind, nudge);
      }
    });

    return Array.from(seen.values());
  }

  /**
   * Respect cadence limits
   */
  private async respectCadence(
    userId: string,
    nudges: Nudge[],
    context: ContextSummary
  ): Promise<Nudge[]> {
    // Check quiet hours
    const { data: isQuiet } = await supabaseAdmin.rpc('is_quiet_hours', {
      p_user_id: userId
    });

    if (isQuiet) {
      return []; // Suppress all nudges during quiet hours
    }

    // Check daily nudge limit
    const { data: nudgesToday } = await supabaseAdmin.rpc('nudges_shown_today', {
      p_user_id: userId
    });

    const remaining = context.personalization.nudge_freq_daily - (nudgesToday || 0);

    if (remaining <= 0) {
      return []; // Daily limit reached
    }

    // Return top N nudges based on remaining quota
    return nudges.slice(0, remaining);
  }

  /**
   * Save nudges to database
   */
  async saveNudges(userId: string, nudges: Nudge[]): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24h TTL

    const inserts = nudges.map(nudge => ({
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
      expires_at: expiresAt.toISOString()
    }));

    if (inserts.length > 0) {
      await supabaseAdmin.from('nudges').insert(inserts);
    }
  }

  /**
   * Parse JSON from LLM response
   */
  private parseJSON(content: string): any {
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('JSON parse error:', error);
      return {};
    }
  }
}

export const nudgeEngineService = new NudgeEngineService();
