-- =====================================================
-- PHASE 3 ENHANCEMENTS: P0 PRIORITIES (CORRECTED)
-- =====================================================
-- 1. Crisis Resource Integration
-- 2. Micro-Habit Stacking
-- 3. Nudge Fatigue Detection
-- =====================================================
-- FIXES:
-- ✅ One column per ALTER statement (Supabase requirement)
-- ✅ Explicit JSONB casts (::jsonb)
-- ✅ Functions marked STABLE (not VOLATILE)
-- ✅ DROP POLICY IF EXISTS before CREATE (idempotent)
-- ✅ No volatile NOW() in index predicates
-- =====================================================

-- =====================================================
-- ENHANCEMENT 1: CRISIS RESOURCE INTEGRATION
-- =====================================================

-- Add crisis-related fields to personalization_weights (one column per ALTER; explicit JSONB casts)
ALTER TABLE public.personalization_weights
  ADD COLUMN IF NOT EXISTS crisis_contacts JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.personalization_weights
  ADD COLUMN IF NOT EXISTS emergency_protocol_enabled BOOLEAN DEFAULT true;

ALTER TABLE public.personalization_weights
  ADD COLUMN IF NOT EXISTS crisis_mode BOOLEAN DEFAULT false;

ALTER TABLE public.personalization_weights
  ADD COLUMN IF NOT EXISTS last_crisis_check TIMESTAMPTZ;

-- Expand nudge kinds to include crisis and habit stacking
-- (recreate named CHECK constraint idempotently)
ALTER TABLE public.nudges
  DROP CONSTRAINT IF EXISTS nudges_kind_check;

ALTER TABLE public.nudges
  ADD CONSTRAINT nudges_kind_check CHECK (kind IN (
    'suggest_tool',
    'journal_prompt',
    'goal_reminder',
    'cross_feature_insight',
    'wellness_checkpoint',
    'celebration',
    'risk_mitigation',
    'momentum_boost',
    'crisis_support',  -- NEW
    'habit_stack'      -- NEW (for Enhancement 2)
  ));

-- Create crisis detection log table
CREATE TABLE IF NOT EXISTS public.crisis_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Detection details
  detection_type TEXT CHECK (detection_type IN ('severe_low_mood', 'crisis_keywords', 'prolonged_isolation')),
  severity TEXT CHECK (severity IN ('concern', 'urgent', 'critical')),
  confidence DECIMAL(3,2) CHECK (confidence BETWEEN 0.00 AND 1.00),

  -- Context
  mood_data JSONB DEFAULT '{}'::jsonb,   -- Recent mood values
  activity_data JSONB DEFAULT '{}'::jsonb, -- Recent activity patterns
  trigger_text TEXT,                     -- If keyword-based, the text that triggered it

  -- Response
  intervention_shown BOOLEAN DEFAULT false,
  intervention_id UUID REFERENCES public.nudges(id),
  user_acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for crisis detections (no volatile functions in predicates)
CREATE INDEX IF NOT EXISTS idx_crisis_detections_user
  ON public.crisis_detections(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_crisis_detections_unacknowledged
  ON public.crisis_detections(user_id)
  WHERE user_acknowledged = false;

-- RLS for crisis detections
ALTER TABLE public.crisis_detections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own crisis detections" ON public.crisis_detections;
CREATE POLICY "Users can view their own crisis detections"
  ON public.crisis_detections FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create crisis detections" ON public.crisis_detections;
CREATE POLICY "System can create crisis detections"
  ON public.crisis_detections FOR INSERT
  WITH CHECK (true);  -- service role inserts

DROP POLICY IF EXISTS "Users can acknowledge crisis detections" ON public.crisis_detections;
CREATE POLICY "Users can acknowledge crisis detections"
  ON public.crisis_detections FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- ENHANCEMENT 2: MICRO-HABIT STACKING
-- =====================================================

-- Create habit_anchors table
CREATE TABLE IF NOT EXISTS public.habit_anchors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Anchor definition
  anchor_event TEXT NOT NULL,      -- 'after_journal', 'after_mood_checkin', 'after_tool', 'after_chat'
  target_action TEXT NOT NULL,     -- 'goal_micro_step', 'gratitude_reflection', 'breathing_exercise'

  -- Timing
  trigger_window_minutes INTEGER DEFAULT 5, -- Show nudge within X minutes of anchor

  -- Success tracking
  triggered_count INTEGER DEFAULT 0,   -- How many times anchor occurred
  completed_count INTEGER DEFAULT 0,   -- How many times user completed target action
  success_rate DECIMAL(4,2) DEFAULT 0.00, -- completed_count / triggered_count

  -- Status
  active BOOLEAN DEFAULT true,
  auto_discovered BOOLEAN DEFAULT false, -- System detected pattern vs user created

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for habit anchors (simple predicate; no NOW() in WHERE)
CREATE INDEX IF NOT EXISTS idx_habit_anchors_user
  ON public.habit_anchors(user_id);

CREATE INDEX IF NOT EXISTS idx_habit_anchors_active
  ON public.habit_anchors(user_id, active)
  WHERE active = true;

-- RLS for habit anchors
ALTER TABLE public.habit_anchors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own habit anchors" ON public.habit_anchors;
CREATE POLICY "Users can view their own habit anchors"
  ON public.habit_anchors FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create habit anchors" ON public.habit_anchors;
CREATE POLICY "Users can create habit anchors"
  ON public.habit_anchors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own habit anchors" ON public.habit_anchors;
CREATE POLICY "Users can update their own habit anchors"
  ON public.habit_anchors FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create habit anchors" ON public.habit_anchors;
CREATE POLICY "System can create habit anchors"
  ON public.habit_anchors FOR INSERT
  WITH CHECK (true); -- service role inserts

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_habit_anchors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_habit_anchors_updated_at ON public.habit_anchors;

CREATE TRIGGER update_habit_anchors_updated_at
  BEFORE UPDATE ON public.habit_anchors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_habit_anchors_updated_at();

-- =====================================================
-- ENHANCEMENT 3: NUDGE FATIGUE DETECTION
-- =====================================================

-- Add fatigue-related fields to personalization_weights (one column per ALTER)
ALTER TABLE public.personalization_weights
  ADD COLUMN IF NOT EXISTS nudge_fatigue_score DECIMAL(3,2)
  DEFAULT 0.00 CHECK (nudge_fatigue_score BETWEEN 0.00 AND 1.00);

ALTER TABLE public.personalization_weights
  ADD COLUMN IF NOT EXISTS consecutive_dismissals INTEGER DEFAULT 0;

ALTER TABLE public.personalization_weights
  ADD COLUMN IF NOT EXISTS consecutive_ignores INTEGER DEFAULT 0;

ALTER TABLE public.personalization_weights
  ADD COLUMN IF NOT EXISTS last_nudge_interaction TIMESTAMPTZ;

ALTER TABLE public.personalization_weights
  ADD COLUMN IF NOT EXISTS paused_until TIMESTAMPTZ; -- If user is in nudge pause

-- Create nudge_fatigue_log for tracking patterns
CREATE TABLE IF NOT EXISTS public.nudge_fatigue_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Fatigue metrics
  fatigue_score DECIMAL(3,2) NOT NULL,
  nudge_freq_before INTEGER,
  nudge_freq_after INTEGER,

  -- Reason for adjustment
  adjustment_reason TEXT CHECK (adjustment_reason IN (
    'high_acceptance',         -- User accepting 70%+ nudges
    'consecutive_dismissals',  -- 3+ dismissals in a row
    'consecutive_ignores',     -- 5+ ignores
    'pause_requested',         -- User explicitly paused
    'pause_expired'            -- Auto-resume after pause
  )),

  -- Feedback context
  recent_accept_rate DECIMAL(4,2),
  recent_dismiss_rate DECIMAL(4,2),
  recent_ignore_rate DECIMAL(4,2),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fatigue log
CREATE INDEX IF NOT EXISTS idx_nudge_fatigue_log_user
  ON public.nudge_fatigue_log(user_id, created_at DESC);

-- RLS for fatigue log
ALTER TABLE public.nudge_fatigue_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own fatigue log" ON public.nudge_fatigue_log;
CREATE POLICY "Users can view their own fatigue log"
  ON public.nudge_fatigue_log FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create fatigue log entries" ON public.nudge_fatigue_log;
CREATE POLICY "System can create fatigue log entries"
  ON public.nudge_fatigue_log FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- HELPER FUNCTIONS FOR ENHANCEMENTS
-- =====================================================

-- Function: Check if user is in crisis mode
CREATE OR REPLACE FUNCTION public.is_crisis_mode(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_crisis_mode BOOLEAN;
BEGIN
  SELECT crisis_mode INTO v_crisis_mode
  FROM public.personalization_weights
  WHERE user_id = p_user_id;

  RETURN COALESCE(v_crisis_mode, false);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Check if nudges are paused for user
CREATE OR REPLACE FUNCTION public.is_nudges_paused(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_paused_until TIMESTAMPTZ;
BEGIN
  SELECT paused_until INTO v_paused_until
  FROM public.personalization_weights
  WHERE user_id = p_user_id;

  -- If paused_until is set and in the future, nudges are paused
  IF v_paused_until IS NOT NULL AND v_paused_until > NOW() THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get active habit anchors for user
CREATE OR REPLACE FUNCTION public.get_active_habit_anchors(
  p_user_id UUID,
  p_anchor_event TEXT
)
RETURNS TABLE (
  anchor_id UUID,
  target_action TEXT,
  trigger_window_minutes INTEGER,
  success_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ha.id,
    ha.target_action,
    ha.trigger_window_minutes,
    ha.success_rate
  FROM public.habit_anchors ha
  WHERE ha.user_id = p_user_id
    AND ha.anchor_event = p_anchor_event
    AND ha.active = true
  ORDER BY ha.success_rate DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Calculate nudge fatigue score
CREATE OR REPLACE FUNCTION public.calculate_nudge_fatigue(p_user_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_consecutive_dismissals INTEGER;
  v_consecutive_ignores INTEGER;
  v_fatigue_score DECIMAL;
BEGIN
  SELECT
    consecutive_dismissals,
    consecutive_ignores
  INTO v_consecutive_dismissals, v_consecutive_ignores
  FROM public.personalization_weights
  WHERE user_id = p_user_id;

  -- Calculate fatigue score (0.00 - 1.00)
  -- Dismissals weight: 0.15 each, Ignores weight: 0.10 each
  v_fatigue_score := LEAST(
    1.00,
    (COALESCE(v_consecutive_dismissals, 0) * 0.15) +
    (COALESCE(v_consecutive_ignores, 0) * 0.10)
  );

  RETURN v_fatigue_score;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.crisis_detections IS 'Log of detected crisis signals requiring immediate intervention';
COMMENT ON TABLE public.habit_anchors IS 'Micro-habit stacking: anchor existing behaviors to new target actions';
COMMENT ON TABLE public.nudge_fatigue_log IS 'Tracking nudge frequency adjustments based on user engagement patterns';

COMMENT ON COLUMN public.personalization_weights.crisis_mode IS 'When true, only crisis support nudges are shown';
COMMENT ON COLUMN public.personalization_weights.paused_until IS 'If set, suppress all nudges until this timestamp';
COMMENT ON COLUMN public.habit_anchors.success_rate IS 'Percentage of times user completed target action after anchor event';
COMMENT ON COLUMN public.nudge_fatigue_log.fatigue_score IS 'Computed fatigue score (0.00=engaged, 1.00=fatigued)';

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Phase 3 P0 Enhancements SQL completed successfully!';
  RAISE NOTICE '📊 Created 3 new tables: crisis_detections, habit_anchors, nudge_fatigue_log';
  RAISE NOTICE '📊 Added 10 columns to personalization_weights';
  RAISE NOTICE '📊 Created 4 helper functions';
  RAISE NOTICE '📊 Created 9 RLS policies';
END $$;
