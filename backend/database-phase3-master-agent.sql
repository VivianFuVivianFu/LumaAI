-- =====================================================
-- PHASE 3: MASTER AGENT / NEURONETWORK SYSTEM
-- =====================================================
-- Cross-feature context synthesis + intelligent nudge engine
-- Event-first architecture with data flywheel for personalization
-- =====================================================

-- =====================================================
-- 1. EVENTS - Unified event log for all user actions
-- =====================================================

CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Event metadata
  event_type TEXT NOT NULL, -- 'chat_message_sent', 'goal_created', 'tool_completed', etc.
  source_feature TEXT NOT NULL CHECK (source_feature IN ('chat', 'journal', 'goals', 'tools', 'dashboard')),
  source_id UUID, -- ID of original entity (message, entry, goal, etc.)

  -- Event payload (flexible)
  event_data JSONB DEFAULT '{}', -- Additional context specific to event type

  -- Processing status
  processed BOOLEAN DEFAULT false, -- Whether this event has been processed by Master Agent
  processed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. NUDGES - AI-generated suggestions and prompts
-- =====================================================

CREATE TABLE IF NOT EXISTS public.nudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Nudge classification
  kind TEXT NOT NULL CHECK (kind IN (
    'suggest_tool',
    'journal_prompt',
    'goal_reminder',
    'cross_feature_insight',
    'wellness_checkpoint',
    'celebration',
    'risk_mitigation',
    'momentum_boost'
  )),
  target_surface TEXT NOT NULL CHECK (target_surface IN ('home', 'chat', 'journal', 'goals', 'tools')),

  -- Content
  title TEXT NOT NULL,
  message TEXT NOT NULL, -- ≤150 chars supportive message
  cta_label TEXT, -- e.g., "Try it now", "Reflect", "View plan"
  cta_action JSONB, -- {target: 'tools/brain', data: {...}}

  -- Metadata
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10), -- Higher = more important
  source_rule TEXT, -- e.g., "cross_feature_bridge_tool_to_journal"
  context_snapshot JSONB, -- Why this nudge was generated
  explainability TEXT, -- Human-readable "why this nudge"

  -- Lifecycle
  expires_at TIMESTAMPTZ, -- Nudges have TTL (e.g., 24h)
  shown_at TIMESTAMPTZ, -- When user saw it
  dismissed_at TIMESTAMPTZ, -- User dismissed
  accepted_at TIMESTAMPTZ, -- User clicked CTA
  completed_at TIMESTAMPTZ, -- User completed the suggested action

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. USER_FEEDBACK - Explicit & implicit feedback
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Feedback classification
  feedback_type TEXT NOT NULL CHECK (feedback_type IN (
    'thumbs_up',
    'thumbs_down',
    'helpful',
    'not_helpful',
    'rating', -- 1-5 stars
    'implicit_accept', -- User clicked CTA
    'implicit_dismiss', -- User dismissed
    'implicit_ignore', -- Expired without interaction
    'implicit_dwell', -- Time spent viewing
    'implicit_complete' -- Completed suggested action
  )),

  -- Target
  target_type TEXT NOT NULL CHECK (target_type IN ('nudge', 'ai_response', 'suggestion', 'insight')),
  target_id UUID NOT NULL, -- nudge.id, message.id, etc.

  -- Optional detailed feedback
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  metadata JSONB DEFAULT '{}', -- Additional context (e.g., dwell_time_seconds)

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. PERSONALIZATION_WEIGHTS - User preference scalars
-- =====================================================

CREATE TABLE IF NOT EXISTS public.personalization_weights (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,

  -- Tone preferences (0.00 - 1.00)
  empathy DECIMAL(3,2) DEFAULT 0.70 CHECK (empathy BETWEEN 0.00 AND 1.00),
  brevity DECIMAL(3,2) DEFAULT 0.50 CHECK (brevity BETWEEN 0.00 AND 1.00),
  formality DECIMAL(3,2) DEFAULT 0.30 CHECK (formality BETWEEN 0.00 AND 1.00),

  -- Nudge preferences
  nudge_freq_daily INTEGER DEFAULT 2 CHECK (nudge_freq_daily BETWEEN 0 AND 10), -- Max nudges per day
  cadence_bias TEXT DEFAULT 'medium' CHECK (cadence_bias IN ('low', 'medium', 'high')), -- Activity level preference
  energy_bias TEXT DEFAULT 'medium' CHECK (energy_bias IN ('low', 'medium', 'high')), -- Complexity preference

  -- Feature flags
  flywheel_enabled BOOLEAN DEFAULT true, -- Enable/disable Master Agent
  llm_nudges_enabled BOOLEAN DEFAULT false, -- Allow LLM-generated nudges (vs rules-only)

  -- Quiet hours (suppress nudges)
  quiet_hours_start TIME, -- e.g., '22:00:00'
  quiet_hours_end TIME, -- e.g., '08:00:00'
  timezone TEXT DEFAULT 'UTC', -- User's timezone

  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. INSIGHTS_CACHE - Rolling period aggregations
-- =====================================================

CREATE TABLE IF NOT EXISTS public.insights_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Cache period
  cache_period TEXT NOT NULL CHECK (cache_period IN ('7d', '30d')),

  -- Aggregated data
  top_themes JSONB DEFAULT '[]', -- ["stress", "focus", "relationships"]
  risk_flags JSONB DEFAULT '[]', -- ["no_journal_7d", "low_mood_3d"]
  momentum_metrics JSONB DEFAULT '{}', -- {"active_goals": 2, "streak_days": 5, "completion_rate": 0.65}
  mood_trend JSONB DEFAULT '{}', -- {"avg": 3.4, "trend": "stable", "days_since_last": 2}
  recent_connections JSONB DEFAULT '[]', -- ["journal↔goal:skill-build"]

  -- Timeframe
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Metadata
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_type ON public.events(user_id, event_type);
CREATE INDEX IF NOT EXISTS idx_events_processed ON public.events(user_id, processed) WHERE processed = false;
CREATE INDEX IF NOT EXISTS idx_events_source ON public.events(user_id, source_feature, source_id);

-- Nudges indexes
CREATE INDEX IF NOT EXISTS idx_nudges_user_id ON public.nudges(user_id);
CREATE INDEX IF NOT EXISTS idx_nudges_surface ON public.nudges(user_id, target_surface);
CREATE INDEX IF NOT EXISTS idx_nudges_active ON public.nudges(user_id, expires_at)
  WHERE dismissed_at IS NULL AND accepted_at IS NULL;
  -- Note: expires_at > NOW() filter moved to query time (NOW() is volatile, can't be in index predicate)
CREATE INDEX IF NOT EXISTS idx_nudges_created_at ON public.nudges(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nudges_kind ON public.nudges(user_id, kind);

-- User feedback indexes
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON public.user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_target ON public.user_feedback(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at ON public.user_feedback(created_at DESC);

-- Insights cache indexes
CREATE INDEX IF NOT EXISTS idx_insights_cache_user_id ON public.insights_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_insights_cache_period ON public.insights_cache(user_id, cache_period);
CREATE INDEX IF NOT EXISTS idx_insights_cache_dates ON public.insights_cache(user_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_insights_cache_computed_at ON public.insights_cache(computed_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nudges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personalization_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insights_cache ENABLE ROW LEVEL SECURITY;

-- Events policies
CREATE POLICY "Users can view their own events"
  ON public.events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create events"
  ON public.events FOR INSERT
  WITH CHECK (true); -- Service role only

-- Nudges policies
CREATE POLICY "Users can view their own nudges"
  ON public.nudges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own nudges"
  ON public.nudges FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can create nudges"
  ON public.nudges FOR INSERT
  WITH CHECK (true); -- Service role only

-- User feedback policies
CREATE POLICY "Users can view their own feedback"
  ON public.user_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create feedback"
  ON public.user_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Personalization weights policies
CREATE POLICY "Users can view their own personalization"
  ON public.personalization_weights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own personalization"
  ON public.personalization_weights FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can create personalization weights"
  ON public.personalization_weights FOR INSERT
  WITH CHECK (true); -- Service role only

-- Insights cache policies
CREATE POLICY "Users can view their own insights cache"
  ON public.insights_cache FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create insights cache"
  ON public.insights_cache FOR INSERT
  WITH CHECK (true); -- Service role only

CREATE POLICY "System can update insights cache"
  ON public.insights_cache FOR UPDATE
  USING (true); -- Service role only

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp for personalization_weights
CREATE OR REPLACE FUNCTION update_personalization_weights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_personalization_weights_updated_at
  BEFORE UPDATE ON public.personalization_weights
  FOR EACH ROW
  EXECUTE FUNCTION update_personalization_weights_updated_at();

-- Auto-create personalization weights for new users
CREATE OR REPLACE FUNCTION create_personalization_weights_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.personalization_weights (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_personalization_weights_on_user_creation
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION create_personalization_weights_for_new_user();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get active nudges for a user and surface
CREATE OR REPLACE FUNCTION get_active_nudges(
  p_user_id UUID,
  p_surface TEXT,
  p_limit INTEGER DEFAULT 2
)
RETURNS TABLE (
  nudge_id UUID,
  kind TEXT,
  title TEXT,
  message TEXT,
  cta_label TEXT,
  cta_action JSONB,
  priority INTEGER,
  explainability TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id,
    n.kind,
    n.title,
    n.message,
    n.cta_label,
    n.cta_action,
    n.priority,
    n.explainability,
    n.created_at
  FROM public.nudges n
  WHERE n.user_id = p_user_id
    AND n.target_surface = p_surface
    AND n.expires_at > NOW()
    AND n.dismissed_at IS NULL
    AND n.accepted_at IS NULL
  ORDER BY n.priority DESC, n.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Check if user is in quiet hours
CREATE OR REPLACE FUNCTION is_quiet_hours(
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_quiet_start TIME;
  v_quiet_end TIME;
  v_current_time TIME;
BEGIN
  -- Get user's quiet hours settings
  SELECT quiet_hours_start, quiet_hours_end
  INTO v_quiet_start, v_quiet_end
  FROM public.personalization_weights
  WHERE user_id = p_user_id;

  -- If no quiet hours set, return false
  IF v_quiet_start IS NULL OR v_quiet_end IS NULL THEN
    RETURN false;
  END IF;

  -- Get current time in user's timezone (simplified - using UTC for now)
  v_current_time := (NOW() AT TIME ZONE 'UTC')::TIME;

  -- Check if current time is within quiet hours
  IF v_quiet_start < v_quiet_end THEN
    -- Normal range (e.g., 22:00 - 08:00 next day)
    RETURN v_current_time >= v_quiet_start AND v_current_time < v_quiet_end;
  ELSE
    -- Wraps midnight (e.g., 22:00 - 08:00)
    RETURN v_current_time >= v_quiet_start OR v_current_time < v_quiet_end;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Count nudges shown today
CREATE OR REPLACE FUNCTION nudges_shown_today(
  p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM public.nudges
  WHERE user_id = p_user_id
    AND shown_at >= (NOW() AT TIME ZONE 'UTC')::DATE;

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.events IS 'Unified event log for all user actions across features';
COMMENT ON TABLE public.nudges IS 'AI-generated suggestions and prompts shown to users';
COMMENT ON TABLE public.user_feedback IS 'Explicit and implicit feedback on nudges and AI responses';
COMMENT ON TABLE public.personalization_weights IS 'User preference scalars for tone, frequency, and complexity';
COMMENT ON TABLE public.insights_cache IS 'Pre-computed rolling summaries to avoid re-computation';

COMMENT ON COLUMN public.nudges.explainability IS 'Human-readable explanation of why this nudge was generated';
COMMENT ON COLUMN public.personalization_weights.flywheel_enabled IS 'Master toggle for Master Agent system';
COMMENT ON COLUMN public.insights_cache.top_themes IS 'Most frequent themes from memory blocks in period';
COMMENT ON COLUMN public.insights_cache.risk_flags IS 'Detected risk patterns (e.g., no_journal_7d)';
COMMENT ON COLUMN public.insights_cache.momentum_metrics IS 'Positive signals like streaks and completion rates';
