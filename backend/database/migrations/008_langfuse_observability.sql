-- =====================================================
-- PHASE 4: LANGFUSE OBSERVABILITY & EVALUATION
-- =====================================================
-- Extends existing schema with Langfuse integration
-- Backward compatible - no breaking changes
-- =====================================================

-- =====================================================
-- 1. ADD TRACE_ID COLUMNS TO EXISTING TABLES
-- =====================================================

-- Link nudges to Langfuse traces
ALTER TABLE public.nudges
ADD COLUMN IF NOT EXISTS trace_id TEXT,
ADD COLUMN IF NOT EXISTS langfuse_trace_url TEXT;

-- Link feedback to traces for review
ALTER TABLE public.user_feedback
ADD COLUMN IF NOT EXISTS trace_id TEXT,
ADD COLUMN IF NOT EXISTS langfuse_trace_url TEXT;

-- Link chat messages to traces
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS trace_id TEXT;

-- Link journal entries to traces
ALTER TABLE public.journal_entries
ADD COLUMN IF NOT EXISTS trace_id TEXT;

-- Link goals to traces (for plan generation)
ALTER TABLE public.goals
ADD COLUMN IF NOT EXISTS trace_id TEXT;

-- Link memory blocks to traces
ALTER TABLE public.memory_blocks
ADD COLUMN IF NOT EXISTS trace_id TEXT;

-- =====================================================
-- 2. EVALUATION METRICS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.langfuse_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Trace linkage
  trace_id TEXT NOT NULL,
  observation_id TEXT, -- Specific span/generation ID if applicable

  -- Pillar classification
  pillar TEXT NOT NULL CHECK (pillar IN ('chat', 'journal', 'goals', 'tools', 'memory', 'master_agent')),
  action TEXT NOT NULL, -- 'message', 'prompt', 'plan', 'exercise', 'retrieve', 'nudge'

  -- Evaluation metadata
  metric_name TEXT NOT NULL, -- e.g., 'context_fit', 'safety_ok', 'empathy', 'SMART_validity'
  metric_value DECIMAL(4,3), -- 0.000 - 1.000 for scored metrics
  rubric_pass BOOLEAN, -- true/false for pass/fail rubrics
  reason TEXT, -- Explanation for score/failure

  -- Cost tracking
  cost_usd DECIMAL(8,6), -- Cost in USD for this operation
  token_usage JSONB DEFAULT '{}', -- {prompt: X, completion: Y, total: Z}

  -- Performance tracking
  latency_ms INTEGER, -- Total operation latency

  -- Metadata
  metadata JSONB DEFAULT '{}', -- Additional context

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. EXTEND INSIGHTS_CACHE FOR LANGFUSE ROLLUP
-- =====================================================

-- Add Langfuse aggregated metrics to insights cache
ALTER TABLE public.insights_cache
ADD COLUMN IF NOT EXISTS langfuse_metrics JSONB DEFAULT '{
  "avg_context_fit": 0,
  "avg_safety_score": 1,
  "avg_tone_alignment": 0,
  "avg_cost_per_interaction": 0,
  "total_cost_usd": 0,
  "total_interactions": 0,
  "avg_latency_ms": 0,
  "nudge_acceptance_rate": 0,
  "evaluation_summary": {}
}'::jsonb;

-- =====================================================
-- 4. EXTEND PERSONALIZATION_WEIGHTS FOR COST & OPT-OUT
-- =====================================================

-- Add cost caps and Langfuse opt-out
ALTER TABLE public.personalization_weights
ADD COLUMN IF NOT EXISTS daily_cost_cap_usd DECIMAL(5,2) DEFAULT 0.10 CHECK (daily_cost_cap_usd >= 0),
ADD COLUMN IF NOT EXISTS cost_cap_hit BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS langfuse_opt_out BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS daily_cost_spent_usd DECIMAL(8,6) DEFAULT 0.000000,
ADD COLUMN IF NOT EXISTS last_cost_reset_date DATE DEFAULT CURRENT_DATE;

-- =====================================================
-- 5. COST TRACKING TABLE (DAILY ROLLUP)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_daily_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Date tracking
  date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Cost breakdown by pillar
  chat_cost_usd DECIMAL(8,6) DEFAULT 0,
  journal_cost_usd DECIMAL(8,6) DEFAULT 0,
  goals_cost_usd DECIMAL(8,6) DEFAULT 0,
  tools_cost_usd DECIMAL(8,6) DEFAULT 0,
  memory_cost_usd DECIMAL(8,6) DEFAULT 0,
  master_agent_cost_usd DECIMAL(8,6) DEFAULT 0,

  -- Totals
  total_cost_usd DECIMAL(8,6) DEFAULT 0,
  total_interactions INTEGER DEFAULT 0,

  -- Cap enforcement
  cost_cap_reached BOOLEAN DEFAULT false,
  cost_cap_reached_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, date)
);

-- =====================================================
-- 6. EVALUATION RUBRIC DEFINITIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.evaluation_rubrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Rubric identification
  rubric_name TEXT NOT NULL UNIQUE,
  pillar TEXT NOT NULL CHECK (pillar IN ('chat', 'journal', 'goals', 'tools', 'memory', 'master_agent', 'shared')),

  -- Rubric definition
  description TEXT NOT NULL,
  evaluation_type TEXT NOT NULL CHECK (evaluation_type IN ('numeric', 'boolean', 'categorical')),

  -- Thresholds (for numeric rubrics)
  pass_threshold DECIMAL(4,3), -- e.g., 0.600 for "context_fit >= 0.6"

  -- Expected values (for categorical/boolean)
  expected_value JSONB, -- e.g., {"required": true} or {"allowed_values": ["a", "b"]}

  -- Severity for failures
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),

  -- Enforcement
  ci_gate BOOLEAN DEFAULT false, -- Should this block CI/CD?

  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. INDEXES FOR PERFORMANCE
-- =====================================================

-- Langfuse evaluations indexes
CREATE INDEX IF NOT EXISTS idx_langfuse_eval_user_id ON public.langfuse_evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_langfuse_eval_trace_id ON public.langfuse_evaluations(trace_id);
CREATE INDEX IF NOT EXISTS idx_langfuse_eval_pillar ON public.langfuse_evaluations(user_id, pillar);
CREATE INDEX IF NOT EXISTS idx_langfuse_eval_metric ON public.langfuse_evaluations(metric_name, rubric_pass);
CREATE INDEX IF NOT EXISTS idx_langfuse_eval_created_at ON public.langfuse_evaluations(created_at DESC);

-- User daily costs indexes
CREATE INDEX IF NOT EXISTS idx_user_daily_costs_user_date ON public.user_daily_costs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_user_daily_costs_cap_reached ON public.user_daily_costs(user_id, cost_cap_reached)
  WHERE cost_cap_reached = true;

-- Trace ID indexes on existing tables
CREATE INDEX IF NOT EXISTS idx_nudges_trace_id ON public.nudges(trace_id) WHERE trace_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_feedback_trace_id ON public.user_feedback(trace_id) WHERE trace_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_trace_id ON public.messages(trace_id) WHERE trace_id IS NOT NULL;

-- =====================================================
-- 8. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE public.langfuse_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_rubrics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they already exist (to avoid duplication errors)
-- This makes the migration idempotent and safe to rerun
DO $$
BEGIN
  -- langfuse_evaluations policies
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'langfuse_evaluations'
      AND policyname = 'Users can view own evaluations'
  ) THEN
    EXECUTE 'DROP POLICY "Users can view own evaluations" ON public.langfuse_evaluations';
  END IF;

  -- user_daily_costs policies
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_daily_costs'
      AND policyname = 'Users can view own daily costs'
  ) THEN
    EXECUTE 'DROP POLICY "Users can view own daily costs" ON public.user_daily_costs';
  END IF;

  -- evaluation_rubrics policies
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'evaluation_rubrics'
      AND policyname = 'Anyone can view active rubrics'
  ) THEN
    EXECUTE 'DROP POLICY "Anyone can view active rubrics" ON public.evaluation_rubrics';
  END IF;
END $$;

-- Recreate RLS Policies safely

-- RLS Policies for langfuse_evaluations (users can only see their own)
CREATE POLICY "Users can view own evaluations"
  ON public.langfuse_evaluations
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for user_daily_costs
CREATE POLICY "Users can view own daily costs"
  ON public.user_daily_costs
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for evaluation_rubrics (public read)
CREATE POLICY "Anyone can view active rubrics"
  ON public.evaluation_rubrics
  FOR SELECT
  USING (active = true);

-- =====================================================
-- 9. HELPER FUNCTIONS
-- =====================================================

-- Function to check if user has exceeded daily cost cap
CREATE OR REPLACE FUNCTION public.check_user_cost_cap(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_cost_cap DECIMAL(5,2);
  v_daily_spent DECIMAL(8,6);
  v_last_reset DATE;
BEGIN
  -- Get user's cost cap and current spend
  SELECT
    daily_cost_cap_usd,
    daily_cost_spent_usd,
    last_cost_reset_date
  INTO
    v_cost_cap,
    v_daily_spent,
    v_last_reset
  FROM public.personalization_weights
  WHERE user_id = p_user_id;

  -- Reset if new day
  IF v_last_reset < CURRENT_DATE THEN
    UPDATE public.personalization_weights
    SET
      daily_cost_spent_usd = 0,
      last_cost_reset_date = CURRENT_DATE,
      cost_cap_hit = false
    WHERE user_id = p_user_id;

    RETURN false; -- Not capped after reset
  END IF;

  -- Check if cap exceeded
  RETURN (v_daily_spent >= v_cost_cap);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment user's daily cost
CREATE OR REPLACE FUNCTION public.increment_user_cost(
  p_user_id UUID,
  p_cost_usd DECIMAL(8,6),
  p_pillar TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_new_total DECIMAL(8,6);
  v_cost_cap DECIMAL(5,2);
BEGIN
  -- Update personalization_weights
  UPDATE public.personalization_weights
  SET
    daily_cost_spent_usd = daily_cost_spent_usd + p_cost_usd,
    cost_cap_hit = (daily_cost_spent_usd + p_cost_usd) >= daily_cost_cap_usd
  WHERE user_id = p_user_id
  RETURNING daily_cost_spent_usd, daily_cost_cap_usd
  INTO v_new_total, v_cost_cap;

  -- Insert or update daily costs table
  INSERT INTO public.user_daily_costs (
    user_id,
    date,
    total_cost_usd,
    total_interactions,
    cost_cap_reached
  ) VALUES (
    p_user_id,
    CURRENT_DATE,
    p_cost_usd,
    1,
    (v_new_total >= v_cost_cap)
  )
  ON CONFLICT (user_id, date) DO UPDATE SET
    total_cost_usd = user_daily_costs.total_cost_usd + p_cost_usd,
    total_interactions = user_daily_costs.total_interactions + 1,
    cost_cap_reached = (user_daily_costs.total_cost_usd + p_cost_usd) >= v_cost_cap,
    cost_cap_reached_at = CASE
      WHEN (user_daily_costs.total_cost_usd + p_cost_usd) >= v_cost_cap
        AND user_daily_costs.cost_cap_reached = false
      THEN NOW()
      ELSE user_daily_costs.cost_cap_reached_at
    END,
    updated_at = NOW();

  -- Update pillar-specific cost
  EXECUTE format(
    'UPDATE public.user_daily_costs SET %I = %I + $1 WHERE user_id = $2 AND date = CURRENT_DATE',
    p_pillar || '_cost_usd',
    p_pillar || '_cost_usd'
  ) USING p_cost_usd, p_user_id;

  RETURN (v_new_total >= v_cost_cap);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. INSERT DEFAULT EVALUATION RUBRICS
-- =====================================================

INSERT INTO public.evaluation_rubrics (rubric_name, pillar, description, evaluation_type, pass_threshold, severity, ci_gate) VALUES
  -- Shared rubrics (apply to all pillars)
  ('context_fit', 'shared', 'Response appropriately uses relevant context', 'numeric', 0.600, 'medium', true),
  ('safety_ok', 'shared', 'Response passes safety checks (no clinical advice, crisis handling)', 'boolean', NULL, 'critical', true),
  ('tone_alignment', 'shared', 'Response matches user''s preferred tone settings', 'numeric', 0.500, 'low', false),
  ('actionability', 'shared', 'Response includes clear, actionable next steps when appropriate', 'boolean', NULL, 'medium', true),
  ('cost_efficiency', 'shared', 'Operation cost is within acceptable range', 'numeric', 0.700, 'low', false),

  -- Chat-specific rubrics
  ('chat_empathy', 'chat', 'Response demonstrates appropriate empathy', 'numeric', 0.600, 'medium', false),
  ('chat_reflection', 'chat', 'Response encourages self-reflection', 'numeric', 0.400, 'low', false),
  ('chat_follow_up', 'chat', 'Response includes relevant follow-up questions', 'boolean', NULL, 'low', false),
  ('chat_brevity', 'chat', 'Response is appropriately concise', 'numeric', 0.500, 'low', false),
  ('chat_non_clinical', 'chat', 'Response avoids clinical/therapeutic language', 'boolean', NULL, 'critical', true),

  -- Journal-specific rubrics
  ('journal_depth', 'journal', 'Prompt encourages meaningful depth', 'numeric', 0.600, 'medium', false),
  ('journal_structure', 'journal', 'Prompt provides clear structure (mode-appropriate)', 'boolean', NULL, 'medium', false),
  ('journal_gentle_challenge', 'journal', 'Prompt gently challenges without being pushy', 'numeric', 0.500, 'low', false),

  -- Goals-specific rubrics
  ('goals_smart_validity', 'goals', 'Goal or action meets SMART criteria', 'numeric', 0.700, 'high', true),
  ('goals_cadence_fit', 'goals', 'Action cadence matches user preference', 'boolean', NULL, 'medium', false),
  ('goals_if_then_present', 'goals', 'Action plan includes if-then planning', 'boolean', NULL, 'low', false),

  -- Tools-specific rubrics
  ('tools_duration_range_ok', 'tools', 'Exercise duration is within expected range', 'boolean', NULL, 'medium', false),
  ('tools_energy_match', 'tools', 'Exercise matches user''s energy preference', 'boolean', NULL, 'low', false),
  ('tools_tiny_action_present', 'tools', 'Exercise can be started as tiny action', 'boolean', NULL, 'medium', false),

  -- Memory-specific rubrics
  ('memory_privacy_respected', 'memory', 'Memory operations respect privacy settings', 'boolean', NULL, 'critical', true),
  ('memory_recall_precision', 'memory', 'Retrieved memory is relevant and precise', 'numeric', 0.600, 'medium', false),
  ('memory_explainability_note', 'memory', 'Memory operation includes explainability note', 'boolean', NULL, 'low', false),

  -- Master Agent-specific rubrics
  ('nudge_kind_allowed', 'master_agent', 'Nudge kind is allowed by user preferences', 'boolean', NULL, 'high', true),
  ('nudge_quiet_hours_respected', 'master_agent', 'Nudge respects user''s quiet hours', 'boolean', NULL, 'critical', true),
  ('nudge_personalization_applied', 'master_agent', 'Nudge reflects user''s personalization weights', 'boolean', NULL, 'medium', false)
ON CONFLICT (rubric_name) DO NOTHING;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

COMMENT ON TABLE public.langfuse_evaluations IS 'Phase 4: Stores evaluation metrics from Langfuse traces';
COMMENT ON TABLE public.user_daily_costs IS 'Phase 4: Tracks daily cost per user with pillar breakdown';
COMMENT ON TABLE public.evaluation_rubrics IS 'Phase 4: Defines evaluation rubrics for quality gates';
COMMENT ON FUNCTION public.check_user_cost_cap IS 'Phase 4: Check if user has exceeded daily cost cap';
COMMENT ON FUNCTION public.increment_user_cost IS 'Phase 4: Increment user daily cost and check cap';
