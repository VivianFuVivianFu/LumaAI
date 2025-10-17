# Phase 3 P0 Enhancements: Implementation Guide

## Overview

This document outlines the implementation of **3 critical P0 enhancements** to the Master Agent system, identified through strategic product analysis:

1. **Crisis Resource Integration** - Ethical safety net
2. **Micro-Habit Stacking** - Behavioral science-backed engagement
3. **Nudge Fatigue Detection** - Respect user boundaries

---

## 🛡️ Enhancement 1: Crisis Resource Integration

### Problem
Mental health apps have an ethical duty of care. Current system detects "low mood" but has no crisis intervention capability.

### Solution
3-tier crisis detection + intervention system:

#### Database Changes
**File**: `database-phase3-enhancements.sql`

```sql
-- New table: crisis_detections
- Logs crisis signals (severe_low_mood, crisis_keywords, prolonged_isolation)
- Severity levels: concern, urgent, critical
- Tracks intervention shown and user acknowledgment

-- New nudge kind: 'crisis_support'
- Override all other nudges (priority 10)
- Show crisis resources immediately

-- New personalization_weights fields:
- crisis_contacts JSONB - User's saved contacts
- emergency_protocol_enabled BOOLEAN
- crisis_mode BOOLEAN - Auto-suppresses non-crisis nudges
```

#### Service Changes
**Files to update**:
1. `context-integrator.service.ts` - Add `detectCrisisSignals()`
2. `nudge-engine.service.ts` - Add `crisisInterventionNudge()` rule pack
3. `master-agent.service.ts` - Add `logCrisisDetection()`

#### Crisis Detection Logic

```typescript
// In context-integrator.service.ts
async detectCrisisSignals(userId: string): Promise<CrisisSignal | null> {
  const { data: recentMoods } = await supabaseAdmin
    .from('mood_checkins')
    .select('mood_value, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  // Signal 1: Mood ≤1 for 2+ consecutive days
  if (recentMoods && recentMoods.length >= 2) {
    const lastTwo = recentMoods.slice(0, 2);
    if (lastTwo.every(m => m.mood_value <= 1)) {
      return {
        type: 'severe_low_mood',
        severity: 'critical',
        confidence: 0.95,
        mood_data: lastTwo
      };
    }
  }

  // Signal 2: No activity for 10+ days + low mood
  const tenDaysAgo = new Date();
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

  const { data: recentActivity } = await supabaseAdmin
    .from('memory_blocks')
    .select('id')
    .eq('user_id', userId)
    .gte('created_at', tenDaysAgo.toISOString())
    .limit(1);

  if (!recentActivity || recentActivity.length === 0) {
    const avgMood = recentMoods?.reduce((sum, m) => sum + m.mood_value, 0) / recentMoods.length;
    if (avgMood <= 2.5) {
      return {
        type: 'prolonged_isolation',
        severity: 'urgent',
        confidence: 0.80,
        activity_data: { days_inactive: 10, avg_mood: avgMood }
      };
    }
  }

  return null;
}
```

#### Crisis Intervention Nudge

```typescript
// In nudge-engine.service.ts - NEW RULE PACK
async crisisIntervention(userId: string, context: ContextSummary): Promise<RuleResult> {
  const crisisSignal = context.crisis_signal; // From detectCrisisSignals()

  if (!crisisSignal) {
    return { matched: false, nudges: [] };
  }

  // Get user's saved contacts
  const { data: weights } = await supabaseAdmin
    .from('personalization_weights')
    .select('crisis_contacts, emergency_protocol_enabled')
    .eq('user_id', userId)
    .single();

  if (!weights || !weights.emergency_protocol_enabled) {
    return { matched: false, nudges: [] };
  }

  const savedContacts = weights.crisis_contacts || [];
  let contactsText = '';

  if (savedContacts.length > 0) {
    contactsText = savedContacts
      .map(c => `• ${c.name}: ${c.phone}`)
      .join('\n');
  }

  const nudge: Nudge = {
    kind: 'crisis_support',
    target_surface: 'home',
    priority: 10, // ALWAYS highest priority
    title: 'You\'re not alone',
    message: `You're going through something really hard. Please reach out for support.`,
    cta_label: 'View resources',
    cta_action: {
      target: 'crisis-resources',
      data: {
        resources: [
          { name: 'National Crisis Lifeline', contact: '988' },
          { name: 'Crisis Text Line', contact: 'Text HOME to 741741' },
          ...savedContacts
        ]
      }
    },
    source_rule: 'crisis_intervention',
    explainability: `Detected ${crisisSignal.severity} crisis signal: ${crisisSignal.type}. Luma prioritizes your safety above all else.`,
    context_snapshot: {
      crisis_type: crisisSignal.type,
      severity: crisisSignal.severity,
      confidence: crisisSignal.confidence
    }
  };

  // Enable crisis_mode (suppresses other nudges)
  await supabaseAdmin
    .from('personalization_weights')
    .update({ crisis_mode: true, last_crisis_check: new Date().toISOString() })
    .eq('user_id', userId);

  // Log crisis detection
  await supabaseAdmin
    .from('crisis_detections')
    .insert({
      user_id: userId,
      detection_type: crisisSignal.type,
      severity: crisisSignal.severity,
      confidence: crisisSignal.confidence,
      mood_data: crisisSignal.mood_data,
      activity_data: crisisSignal.activity_data
    });

  return { matched: true, nudges: [nudge] };
}
```

#### Frontend Integration

**New Component**: `CrisisResourcesModal.tsx`

```tsx
interface CrisisResource {
  name: string;
  contact: string;
  description: string;
}

export function CrisisResourcesModal({ resources }: { resources: CrisisResource[] }) {
  return (
    <div className="p-6 space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900">You're Not Alone</h2>
        <p className="text-gray-600 mt-2">
          If you're in crisis or need immediate support, please reach out:
        </p>
      </div>

      <div className="space-y-3">
        {resources.map((resource, index) => (
          <Card key={index} className="p-4">
            <h3 className="font-medium text-gray-900">{resource.name}</h3>
            <a
              href={`tel:${resource.contact}`}
              className="text-purple-600 text-lg font-semibold"
            >
              {resource.contact}
            </a>
            {resource.description && (
              <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
            )}
          </Card>
        ))}
      </div>

      <div className="bg-purple-50 p-4 rounded-lg">
        <p className="text-sm text-gray-700">
          Luma is here to support your journey, but we're not a replacement for professional help.
          If you're experiencing thoughts of self-harm, please call 988 or go to your nearest emergency room.
        </p>
      </div>
    </div>
  );
}
```

### Testing
- [ ] Test crisis detection with mood ≤1 for 2 days
- [ ] Verify crisis nudge overrides all others
- [ ] Confirm crisis_mode suppresses non-crisis nudges
- [ ] Test crisis resources modal display
- [ ] Verify user can save crisis contacts

---

## 🔗 Enhancement 2: Micro-Habit Stacking

### Problem
Users complete isolated actions (journal, tool) but don't build momentum toward goals. Behavioral science shows anchoring new habits to existing ones doubles success rate.

### Solution
BJ Fogg's Tiny Habits framework: Anchor small goal steps immediately after existing behaviors.

#### Database Changes

```sql
CREATE TABLE habit_anchors (
  anchor_event TEXT, -- 'after_journal', 'after_tool', 'after_chat'
  target_action TEXT, -- 'goal_micro_step', 'gratitude_reflection'
  trigger_window_minutes INTEGER DEFAULT 5,
  success_rate DECIMAL -- Tracks effectiveness
);
```

#### Service Changes

**File**: `nudge-engine.service.ts` - Add `habitStackingRules()`

```typescript
async habitStackingRules(userId: string, context: ContextSummary): Promise<RuleResult> {
  const nudges: Nudge[] = [];

  // Get user's active habit anchors
  const { data: anchors } = await supabaseAdmin.rpc('get_active_habit_anchors', {
    p_user_id: userId,
    p_anchor_event: null // Get all
  });

  // Rule 1: After journaling → Suggest ONE goal micro-step (≤5 min)
  const recentJournal = await this.checkRecentEvent(userId, 'journal', 5); // Last 5 minutes

  if (recentJournal && context.active_goal) {
    // Get smallest incomplete action for active goal
    const { data: nextAction } = await supabaseAdmin
      .from('weekly_actions')
      .select('id, title, estimated_minutes')
      .eq('goal_id', context.active_goal.id)
      .eq('completed', false)
      .order('estimated_minutes', { ascending: true })
      .limit(1)
      .single();

    if (nextAction && nextAction.estimated_minutes <= 10) {
      nudges.push({
        kind: 'habit_stack',
        target_surface: 'goals',
        priority: 8, // High priority - time-sensitive
        title: `Perfect timing! 🎯`,
        message: `Journal done! While you're in reflection mode, try this ${nextAction.estimated_minutes}-min step: "${nextAction.title}"`,
        cta_label: 'Start now',
        cta_action: {
          target: `goals/${context.active_goal.id}/action/${nextAction.id}`,
          data: { habit_stack: true, anchor: 'after_journal' }
        },
        source_rule: 'habit_stack_journal_to_goal',
        explainability: `Research shows anchoring new habits to existing ones (like journaling) doubles your success rate. This 5-min window is your momentum window!`
      });

      // Track anchor trigger
      await this.trackAnchorTrigger(userId, 'after_journal', 'goal_micro_step');
    }
  }

  // Rule 2: After tool → Suggest gratitude reflection
  const recentTool = await this.checkRecentEvent(userId, 'tool_completed', 5);

  if (recentTool) {
    nudges.push({
      kind: 'habit_stack',
      target_surface: 'journal',
      priority: 7,
      title: `Seal the insight 💡`,
      message: `You just completed an exercise. Quick: write ONE thing you're grateful for today. It cements the shift.`,
      cta_label: 'Write gratitude',
      cta_action: {
        target: 'journal/new',
        data: { prompt: 'One thing I\'m grateful for today:', mode: 'quick-reflection' }
      },
      source_rule: 'habit_stack_tool_to_gratitude',
      explainability: `Gratitude journaling after a brain exercise amplifies positive neuroplasticity.`
    });

    await this.trackAnchorTrigger(userId, 'after_tool', 'gratitude_reflection');
  }

  return { matched: nudges.length > 0, nudges };
}

// Helper: Check if event occurred recently
private async checkRecentEvent(userId: string, feature: string, minutes: number): Promise<boolean> {
  const since = new Date();
  since.setMinutes(since.getMinutes() - minutes);

  const { data } = await supabaseAdmin
    .from('events')
    .select('id')
    .eq('user_id', userId)
    .eq('source_feature', feature)
    .gte('created_at', since.toISOString())
    .limit(1);

  return Boolean(data && data.length > 0);
}

// Helper: Track anchor trigger
private async trackAnchorTrigger(userId: string, anchor: string, target: string): Promise<void> {
  // Find or create habit anchor
  let { data: existingAnchor } = await supabaseAdmin
    .from('habit_anchors')
    .select('id, triggered_count')
    .eq('user_id', userId)
    .eq('anchor_event', anchor)
    .eq('target_action', target)
    .single();

  if (existingAnchor) {
    // Increment triggered_count
    await supabaseAdmin
      .from('habit_anchors')
      .update({ triggered_count: existingAnchor.triggered_count + 1 })
      .eq('id', existingAnchor.id);
  } else {
    // Auto-create habit anchor
    await supabaseAdmin
      .from('habit_anchors')
      .insert({
        user_id: userId,
        anchor_event: anchor,
        target_action: target,
        triggered_count: 1,
        auto_discovered: true
      });
  }
}
```

#### Frontend Integration

**Update**: `NudgeCard.tsx` - Add visual indicator for habit stack nudges

```tsx
{nudge.kind === 'habit_stack' && (
  <div className="flex items-center gap-2 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
    <span>⚡</span>
    <span>Momentum Window</span>
  </div>
)}
```

### Testing
- [ ] Complete journal → Verify goal micro-step nudge appears within 5 min
- [ ] Complete tool → Verify gratitude reflection nudge appears
- [ ] Check `triggered_count` increments in database
- [ ] Test success_rate calculation when user completes target action

---

## 📉 Enhancement 3: Nudge Fatigue Detection

### Problem
Static cadence limit (2 nudges/day) doesn't adapt to user engagement. Users who dismiss 3+ nudges consecutively are experiencing fatigue.

### Solution
Dynamic frequency adjustment based on engagement patterns.

#### Database Changes

```sql
ALTER TABLE personalization_weights ADD COLUMN
  nudge_fatigue_score DECIMAL(3,2) DEFAULT 0.00,
  consecutive_dismissals INTEGER DEFAULT 0,
  consecutive_ignores INTEGER DEFAULT 0,
  paused_until TIMESTAMPTZ; -- If user requests pause

CREATE TABLE nudge_fatigue_log (
  adjustment_reason TEXT, -- 'high_acceptance', 'consecutive_dismissals', etc.
  nudge_freq_before INTEGER,
  nudge_freq_after INTEGER,
  recent_accept_rate DECIMAL
);
```

#### Service Changes

**File**: `master-agent.service.ts` - Update `dismissNudge()` and add `adjustNudgeFrequency()`

```typescript
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
    metadata: { timestamp: new Date().toISOString() }
  });

  // Increment consecutive dismissals
  await supabaseAdmin
    .from('personalization_weights')
    .update({
      consecutive_dismissals: supabaseAdmin.sql`consecutive_dismissals + 1`,
      consecutive_ignores: 0, // Reset ignores
      last_nudge_interaction: new Date().toISOString()
    })
    .eq('user_id', userId);

  // Check for fatigue and adjust frequency
  await this.checkAndAdjustFatigueAsync(userId);
}

async acceptNudge(nudgeId: string, userId: string): Promise<void> {
  // ... existing code ...

  // Reset consecutive counts (user is engaged!)
  await supabaseAdmin
    .from('personalization_weights')
    .update({
      consecutive_dismissals: 0,
      consecutive_ignores: 0,
      last_nudge_interaction: new Date().toISOString()
    })
    .eq('user_id', userId);
}

// NEW: Check fatigue and adjust frequency
private async checkAndAdjustFatigueAsync(userId: string): Promise<void> {
  setImmediate(async () => {
    try {
      const { data: weights } = await supabaseAdmin
        .from('personalization_weights')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!weights) return;

      let newFreq = weights.nudge_freq_daily;
      let adjustmentReason: string | null = null;

      // Rule 1: 3+ consecutive dismissals → Reduce by 1
      if (weights.consecutive_dismissals >= 3) {
        newFreq = Math.max(0, weights.nudge_freq_daily - 1);
        adjustmentReason = 'consecutive_dismissals';
      }

      // Rule 2: 5+ consecutive ignores → Pause for 3 days
      if (weights.consecutive_ignores >= 5) {
        newFreq = 0;
        const pauseUntil = new Date();
        pauseUntil.setDate(pauseUntil.getDate() + 3);

        await supabaseAdmin
          .from('personalization_weights')
          .update({ paused_until: pauseUntil.toISOString() })
          .eq('user_id', userId);

        adjustmentReason = 'consecutive_ignores';
      }

      // Rule 3: High acceptance (70%+) → Increase by 1 (max 5)
      const acceptRate = await this.calculateRecentAcceptRate(userId, 7);
      if (acceptRate >= 0.70 && weights.nudge_freq_daily < 5) {
        newFreq = Math.min(5, weights.nudge_freq_daily + 1);
        adjustmentReason = 'high_acceptance';
      }

      // Apply adjustment if needed
      if (newFreq !== weights.nudge_freq_daily && adjustmentReason) {
        // Calculate fatigue score
        const fatigueScore = await supabaseAdmin.rpc('calculate_nudge_fatigue', {
          p_user_id: userId
        });

        // Update weights
        await supabaseAdmin
          .from('personalization_weights')
          .update({
            nudge_freq_daily: newFreq,
            nudge_fatigue_score: fatigueScore.data || 0.00
          })
          .eq('user_id', userId);

        // Log adjustment
        await supabaseAdmin
          .from('nudge_fatigue_log')
          .insert({
            user_id: userId,
            fatigue_score: fatigueScore.data || 0.00,
            nudge_freq_before: weights.nudge_freq_daily,
            nudge_freq_after: newFreq,
            adjustment_reason: adjustmentReason,
            recent_accept_rate: acceptRate
          });

        console.log(`Adjusted nudge frequency for ${userId}: ${weights.nudge_freq_daily} → ${newFreq} (${adjustmentReason})`);
      }
    } catch (error) {
      console.error('Fatigue check error:', error);
    }
  });
}

// Helper: Calculate accept rate
private async calculateRecentAcceptRate(userId: string, days: number): Promise<number> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data: feedback } = await supabaseAdmin
    .from('user_feedback')
    .select('feedback_type')
    .eq('user_id', userId)
    .eq('target_type', 'nudge')
    .gte('created_at', since.toISOString());

  if (!feedback || feedback.length === 0) return 0.5; // Neutral default

  const accepts = feedback.filter(f => f.feedback_type === 'implicit_accept').length;
  const dismisses = feedback.filter(f => f.feedback_type === 'implicit_dismiss').length;
  const total = accepts + dismisses;

  return total > 0 ? accepts / total : 0.5;
}
```

#### Frontend Integration

**New Feature**: Nudge pause control in settings

```tsx
// In PersonalizationSettings.tsx
<div className="space-y-2">
  <label className="text-sm font-medium">Nudge Frequency</label>
  <p className="text-xs text-gray-600">
    Luma automatically adjusts based on your engagement.
    Current: {nudgeFreqDaily} per day
  </p>

  {fatigue Score > 0.5 && (
    <div className="bg-yellow-50 p-3 rounded-lg">
      <p className="text-sm text-yellow-800">
        We've noticed you're not engaging with nudges lately.
        Want to take a break? We'll pause for 3 days.
      </p>
      <Button onClick={handlePauseNudges} className="mt-2">
        Pause nudges
      </Button>
    </div>
  )}
</div>
```

### Testing
- [ ] Dismiss 3 consecutive nudges → Verify frequency reduces by 1
- [ ] Ignore 5 nudges → Verify 3-day pause
- [ ] Accept 70%+ nudges → Verify frequency increases
- [ ] Check fatigue_score calculation
- [ ] Test manual pause button

---

## Implementation Checklist

### Phase 1: Database Migration
- [ ] Run `database-phase3-enhancements.sql` in Supabase SQL Editor
- [ ] Verify all 3 new tables created (crisis_detections, habit_anchors, nudge_fatigue_log)
- [ ] Verify personalization_weights columns added
- [ ] Test helper functions (is_crisis_mode, is_nudges_paused, calculate_nudge_fatigue)

### Phase 2: Service Updates
- [ ] Update `context-integrator.service.ts` with `detectCrisisSignals()`
- [ ] Update `nudge-engine.service.ts` with 2 new rule packs (crisisIntervention, habitStackingRules)
- [ ] Update `master-agent.service.ts` with fatigue detection logic
- [ ] Add TypeScript interfaces for new types

### Phase 3: API & Frontend
- [ ] No new API endpoints needed (existing endpoints support new nudge kinds)
- [ ] Create `CrisisResourcesModal.tsx` component
- [ ] Update `NudgeCard.tsx` to show habit stack indicator
- [ ] Add nudge pause control to settings
- [ ] Test end-to-end flows

### Phase 4: Testing & Monitoring
- [ ] Test crisis detection with simulated low moods
- [ ] Test habit stacking with journal → goal flow
- [ ] Test fatigue detection with consecutive dismissals
- [ ] Monitor nudge acceptance rates (target +30%)
- [ ] Monitor goal completion rates (target +20%)

---

## Expected Outcomes

### Metrics Targets (30 days post-launch)
- **Crisis Detection**: Catch 70%+ of at-risk users before self-reported crisis
- **Nudge Acceptance Rate**: +30-50% improvement
- **Goal Completion Rate**: +20-40% improvement via habit stacking
- **User Retention**: +15-25% due to respectful engagement
- **Churn Reduction**: 10-20% fewer users leave due to "app fatigue"

### User Experience Improvements
- ✅ Users feel cared for (crisis safety net)
- ✅ Users build sustainable habits (not just isolated actions)
- ✅ Users feel respected (no spam, adaptive frequency)
- ✅ Users trust Luma (ethical AI boundaries)

---

## Next Steps (P1 Priorities)

After P0 is deployed and tested:

1. **Early Warning System** (P1) - Predictive risk scoring before crisis
2. **Emotional State-Aware Nudging** (P1) - Adapt tone to current mood
3. **Achievement System** (P1) - Gamification with micro-achievements
4. **Pattern Recognition Engine** (P1) - Detect behavioral patterns

---

**Status**: Ready for implementation
**Estimated Timeline**: 1 week (P0 priorities)
**Next Action**: Run database migration → Update services → Test flows
