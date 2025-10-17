-- =====================================================
-- LUMA BACKEND - MASTER DATABASE MIGRATION SCRIPT
-- =====================================================
-- This script runs all database migrations in the correct order
-- Run this in Supabase SQL Editor (one command)
--
-- IMPORTANT: This will create ALL tables, policies, and functions
-- Only run this on a fresh database or if you want to reset everything
-- =====================================================

-- =====================================================
-- STEP 0: Enable Required Extensions
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgvector extension (REQUIRED for Memory feature)
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify extensions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
    RAISE EXCEPTION 'uuid-ossp extension not available';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    RAISE EXCEPTION 'pgvector extension not available. Check Supabase plan or enable in Dashboard.';
  END IF;

  RAISE NOTICE '✅ Extensions enabled: uuid-ossp, vector';
END $$;

-- =====================================================
-- PHASE 1: FOUNDATION TABLES
-- =====================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_new_user BOOLEAN DEFAULT true,
  preferences JSONB DEFAULT '{}'::jsonb
);

-- Mood check-ins table
CREATE TABLE IF NOT EXISTS public.mood_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  mood_value INTEGER NOT NULL CHECK (mood_value >= 1 AND mood_value <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$ BEGIN
  RAISE NOTICE '✅ Phase 1 tables created: users, mood_checkins';
END $$;

-- =====================================================
-- PHASE 2: CHAT TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  RAISE NOTICE '✅ Phase 2 Chat tables created: conversations, messages';
END $$;

-- =====================================================
-- PHASE 2: JOURNAL TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.journal_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('past', 'present-faults', 'present-virtues', 'future', 'free-write')),
  title TEXT,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.journal_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_private BOOLEAN DEFAULT false,
  exclude_from_memory BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.journal_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  insight_text TEXT NOT NULL,
  articulation_score DECIMAL(3,2) CHECK (articulation_score BETWEEN 0 AND 1),
  coherence_score DECIMAL(3,2) CHECK (coherence_score BETWEEN 0 AND 1),
  emotional_tone TEXT,
  themes JSONB DEFAULT '[]'::jsonb,
  safety_flags JSONB DEFAULT '[]'::jsonb,
  depth_level TEXT CHECK (depth_level IN ('surface', 'moderate', 'deep')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  RAISE NOTICE '✅ Phase 2 Journal tables created: journal_sessions, journal_entries, journal_insights';
END $$;

-- =====================================================
-- PHASE 2: GOALS TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'career', 'financial', 'health', 'relationships',
    'mental-health', 'personal-growth', 'creative', 'social-impact'
  )),
  timeframe TEXT NOT NULL CHECK (timeframe IN ('3-months', '6-months', '12-months')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'abandoned')),
  progress INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.goal_clarifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  question_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.action_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  smart_statement TEXT NOT NULL,
  total_sprints INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_plan_id UUID NOT NULL REFERENCES public.action_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sprint_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'skipped')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: milestones table intentionally does NOT have goal_id column
-- Goal relationship is through: milestones → action_plans → goals

CREATE TABLE IF NOT EXISTS public.weekly_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id UUID NOT NULL REFERENCES public.milestones(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action_text TEXT NOT NULL,
  week_number INTEGER,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.progress_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  wins TEXT,
  challenges TEXT,
  adjustments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  RAISE NOTICE '✅ Phase 2 Goals tables created: goals, goal_clarifications, action_plans, milestones, weekly_actions, progress_reflections';
END $$;

-- =====================================================
-- PHASE 2: TOOLS TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.brain_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  duration TEXT NOT NULL,
  context_description TEXT NOT NULL,
  original_thought TEXT,
  reframe TEXT NOT NULL,
  micro_action TEXT NOT NULL,
  why_it_helps TEXT NOT NULL,
  alternative_reframes JSONB DEFAULT '[]'::jsonb,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  saved_to_journal BOOLEAN DEFAULT false,
  linked_to_goals BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.narratives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  duration TEXT NOT NULL,
  detected_themes JSONB DEFAULT '[]'::jsonb,
  chapter_past TEXT NOT NULL,
  chapter_present TEXT NOT NULL,
  chapter_future TEXT NOT NULL,
  reflection_prompt_1 TEXT NOT NULL,
  reflection_prompt_2 TEXT NOT NULL,
  future_choice TEXT NOT NULL,
  user_reflection_1 TEXT,
  user_reflection_2 TEXT,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  saved_to_journal BOOLEAN DEFAULT false,
  linked_to_goals BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.future_me_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  duration TEXT NOT NULL,
  goal_or_theme TEXT NOT NULL,
  visualization_script TEXT NOT NULL,
  affirmation_1 TEXT NOT NULL,
  affirmation_2 TEXT NOT NULL,
  affirmation_3 TEXT NOT NULL,
  if_then_anchor TEXT NOT NULL,
  replay_suggestion TEXT NOT NULL,
  times_replayed INTEGER DEFAULT 0,
  last_replayed_at TIMESTAMPTZ,
  saved_to_journal BOOLEAN DEFAULT false,
  linked_to_goals BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tool_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tool_type TEXT NOT NULL CHECK (tool_type IN ('empower_my_brain', 'my_new_narrative', 'future_me')),
  exercise_id UUID NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  helpfulness_rating INTEGER CHECK (helpfulness_rating BETWEEN 1 AND 5),
  user_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  RAISE NOTICE '✅ Phase 2 Tools tables created: brain_exercises, narratives, future_me_exercises, tool_sessions';
END $$;

-- =====================================================
-- PHASE 2: MEMORY TABLES (REQUIRES pgvector)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.memory_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL CHECK (block_type IN (
    'chat_message', 'journal_entry', 'goal', 'action_plan',
    'exercise', 'reflection', 'mood_checkin', 'insight'
  )),
  source_feature TEXT NOT NULL CHECK (source_feature IN ('chat', 'journal', 'goals', 'tools', 'dashboard')),
  source_id UUID NOT NULL,
  content_text TEXT NOT NULL,
  summary TEXT,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'mixed')),
  emotional_tone TEXT,
  themes JSONB DEFAULT '[]'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  privacy_level TEXT DEFAULT 'ai-only' CHECK (privacy_level IN ('public', 'private', 'ai-only')),
  crisis_flag BOOLEAN DEFAULT false,
  sensitivity_flag BOOLEAN DEFAULT false,
  exclude_from_memory BOOLEAN DEFAULT false,
  embedding vector(1536),
  relevance_score DECIMAL(3,2) CHECK (relevance_score BETWEEN 0 AND 1),
  retrieval_count INTEGER DEFAULT 0,
  last_retrieved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.memory_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  source_block_id UUID NOT NULL REFERENCES public.memory_blocks(id) ON DELETE CASCADE,
  target_block_id UUID NOT NULL REFERENCES public.memory_blocks(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL CHECK (relation_type IN (
    'supports', 'addresses', 'follows_up_on', 'derived_from',
    'connected_to', 'contradicts', 'reinforces'
  )),
  strength DECIMAL(3,2) DEFAULT 0.50 CHECK (strength BETWEEN 0 AND 1),
  auto_generated BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.memory_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL CHECK (operation_type IN (
    'create', 'retrieve', 'update', 'delete', 'redact', 'exclude'
  )),
  block_id UUID REFERENCES public.memory_blocks(id) ON DELETE SET NULL,
  triggered_by TEXT NOT NULL,
  context JSONB DEFAULT '{}'::jsonb,
  reason TEXT,
  relevance_score DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.memory_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN (
    'weekly_summary', 'pattern_recognition', 'trait_mapping',
    'recovery_metric', 'progress_snapshot'
  )),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  detailed_analysis TEXT,
  insights_data JSONB DEFAULT '{}'::jsonb,
  source_blocks JSONB DEFAULT '[]'::jsonb,
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_memory_settings (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  memory_enabled BOOLEAN DEFAULT true,
  chat_memory_enabled BOOLEAN DEFAULT true,
  journal_memory_enabled BOOLEAN DEFAULT true,
  goals_memory_enabled BOOLEAN DEFAULT true,
  tools_memory_enabled BOOLEAN DEFAULT true,
  default_privacy_level TEXT DEFAULT 'ai-only' CHECK (default_privacy_level IN ('public', 'private', 'ai-only')),
  allow_crisis_recall BOOLEAN DEFAULT false,
  allow_cross_feature_recall BOOLEAN DEFAULT true,
  weekly_summary_enabled BOOLEAN DEFAULT true,
  pattern_insights_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  RAISE NOTICE '✅ Phase 2 Memory tables created: memory_blocks, memory_relations, memory_ledger, memory_insights, user_memory_settings';
END $$;

-- =====================================================
-- SUMMARY: Verify All Tables Created
-- =====================================================

DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename IN (
    'users', 'mood_checkins',
    'conversations', 'messages',
    'journal_sessions', 'journal_entries', 'journal_insights',
    'goals', 'goal_clarifications', 'action_plans', 'milestones', 'weekly_actions', 'progress_reflections',
    'brain_exercises', 'narratives', 'future_me_exercises', 'tool_sessions',
    'memory_blocks', 'memory_relations', 'memory_ledger', 'memory_insights', 'user_memory_settings'
  );

  IF table_count = 22 THEN
    RAISE NOTICE '✅ SUCCESS: All 22 tables created successfully!';
  ELSE
    RAISE EXCEPTION '❌ ERROR: Expected 22 tables, but found %', table_count;
  END IF;
END $$;

-- =====================================================
-- Next Steps:
-- 1. Run the RLS policies script (separate file recommended)
-- 2. Run the indexes script (separate file recommended)
-- 3. Run the functions and triggers script (separate file recommended)
-- =====================================================
