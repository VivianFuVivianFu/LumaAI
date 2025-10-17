-- =====================================================
-- PHASE 2: TOOLS FEATURE DATABASE SCHEMA
-- =====================================================
-- Three subsections:
-- 1. Empower My Brain (Neuroplasticity exercises)
-- 2. My New Narrative (Past-Present-Future stories)
-- 3. Future Me (Visualization and affirmations)
-- =====================================================

-- =====================================================
-- 1. EMPOWER MY BRAIN (Reframe unhelpful thoughts)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.brain_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Exercise metadata
  title TEXT NOT NULL,
  duration TEXT NOT NULL, -- e.g., "2-5 min"

  -- Context and input
  context_description TEXT NOT NULL, -- What user is struggling with

  -- Core outputs
  original_thought TEXT, -- The unhelpful thought
  reframe TEXT NOT NULL, -- Kinder reframe (≤20 words)
  micro_action TEXT NOT NULL, -- 1-2 min action
  why_it_helps TEXT NOT NULL, -- Explanation

  -- Optional alternatives
  alternative_reframes JSONB, -- Array of alternative reframes

  -- Metadata
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  saved_to_journal BOOLEAN DEFAULT false,
  linked_to_goals BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. MY NEW NARRATIVE (Transform stories)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.narratives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Exercise metadata
  title TEXT NOT NULL,
  duration TEXT NOT NULL,

  -- Detected themes (from journal/chat)
  detected_themes JSONB, -- Array of themes

  -- Core outputs: 3 chapters
  chapter_past TEXT NOT NULL, -- 3-5 sentences
  chapter_present TEXT NOT NULL, -- 3-5 sentences
  chapter_future TEXT NOT NULL, -- 3-5 sentences

  -- Reflection prompts
  reflection_prompt_1 TEXT NOT NULL,
  reflection_prompt_2 TEXT NOT NULL,

  -- Future choice statement
  future_choice TEXT NOT NULL, -- ≤12 words

  -- User reflections (optional)
  user_reflection_1 TEXT,
  user_reflection_2 TEXT,

  -- Metadata
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  saved_to_journal BOOLEAN DEFAULT false,
  linked_to_goals BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. FUTURE ME (Visualization & affirmations)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.future_me_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Exercise metadata
  title TEXT NOT NULL,
  duration TEXT NOT NULL,

  -- Context
  goal_or_theme TEXT NOT NULL, -- What user wants to work on

  -- Core outputs
  visualization_script TEXT NOT NULL, -- ≤160 words guided visualization
  affirmation_1 TEXT NOT NULL, -- ≤12 words
  affirmation_2 TEXT NOT NULL, -- ≤12 words
  affirmation_3 TEXT NOT NULL, -- ≤12 words
  if_then_anchor TEXT NOT NULL, -- "If X happens, then I will Y"
  replay_suggestion TEXT NOT NULL, -- When to replay this

  -- Metadata
  times_replayed INTEGER DEFAULT 0,
  last_replayed_at TIMESTAMPTZ,
  saved_to_journal BOOLEAN DEFAULT false,
  linked_to_goals BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SHARED: EXERCISE HISTORY (All three tools)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.tool_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Which tool was used
  tool_type TEXT NOT NULL CHECK (tool_type IN ('empower_my_brain', 'my_new_narrative', 'future_me')),

  -- Reference to specific exercise
  exercise_id UUID NOT NULL, -- ID from one of the three tables above

  -- Session metadata
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,

  -- User feedback (optional)
  helpfulness_rating INTEGER CHECK (helpfulness_rating BETWEEN 1 AND 5),
  user_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_brain_exercises_user_id ON public.brain_exercises(user_id);
CREATE INDEX IF NOT EXISTS idx_brain_exercises_created_at ON public.brain_exercises(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_brain_exercises_completed ON public.brain_exercises(user_id, completed);

CREATE INDEX IF NOT EXISTS idx_narratives_user_id ON public.narratives(user_id);
CREATE INDEX IF NOT EXISTS idx_narratives_created_at ON public.narratives(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_narratives_completed ON public.narratives(user_id, completed);

CREATE INDEX IF NOT EXISTS idx_future_me_user_id ON public.future_me_exercises(user_id);
CREATE INDEX IF NOT EXISTS idx_future_me_created_at ON public.future_me_exercises(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_future_me_replayed ON public.future_me_exercises(user_id, last_replayed_at);

CREATE INDEX IF NOT EXISTS idx_tool_sessions_user_id ON public.tool_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_tool_sessions_tool_type ON public.tool_sessions(user_id, tool_type);
CREATE INDEX IF NOT EXISTS idx_tool_sessions_created_at ON public.tool_sessions(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.brain_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.narratives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.future_me_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_sessions ENABLE ROW LEVEL SECURITY;

-- Brain exercises policies
CREATE POLICY "Users can view their own brain exercises"
  ON public.brain_exercises FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own brain exercises"
  ON public.brain_exercises FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own brain exercises"
  ON public.brain_exercises FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own brain exercises"
  ON public.brain_exercises FOR DELETE
  USING (auth.uid() = user_id);

-- Narratives policies
CREATE POLICY "Users can view their own narratives"
  ON public.narratives FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own narratives"
  ON public.narratives FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own narratives"
  ON public.narratives FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own narratives"
  ON public.narratives FOR DELETE
  USING (auth.uid() = user_id);

-- Future Me policies
CREATE POLICY "Users can view their own future me exercises"
  ON public.future_me_exercises FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own future me exercises"
  ON public.future_me_exercises FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own future me exercises"
  ON public.future_me_exercises FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own future me exercises"
  ON public.future_me_exercises FOR DELETE
  USING (auth.uid() = user_id);

-- Tool sessions policies
CREATE POLICY "Users can view their own tool sessions"
  ON public.tool_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tool sessions"
  ON public.tool_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tool sessions"
  ON public.tool_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tools_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_brain_exercises_updated_at
  BEFORE UPDATE ON public.brain_exercises
  FOR EACH ROW
  EXECUTE FUNCTION update_tools_updated_at();

CREATE TRIGGER update_narratives_updated_at
  BEFORE UPDATE ON public.narratives
  FOR EACH ROW
  EXECUTE FUNCTION update_tools_updated_at();

CREATE TRIGGER update_future_me_updated_at
  BEFORE UPDATE ON public.future_me_exercises
  FOR EACH ROW
  EXECUTE FUNCTION update_tools_updated_at();
