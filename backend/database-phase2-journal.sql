-- =====================================================
-- Phase 2: Journal Feature Database Schema
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Journal sessions table
CREATE TABLE IF NOT EXISTS public.journal_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('past', 'present-faults', 'present-virtues', 'future', 'free-write')),
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  is_completed BOOLEAN DEFAULT false
);

-- Journal entries table
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.journal_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  step_number INTEGER,
  prompt TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_private BOOLEAN DEFAULT true,
  exclude_from_memory BOOLEAN DEFAULT false
);

-- Journal insights table (AI analysis)
CREATE TABLE IF NOT EXISTS public.journal_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  insight_text TEXT NOT NULL,
  articulation_score DECIMAL(3,2) CHECK (articulation_score >= 0 AND articulation_score <= 1),
  coherence_score DECIMAL(3,2) CHECK (coherence_score >= 0 AND coherence_score <= 1),
  emotional_tone TEXT,
  themes JSONB DEFAULT '[]'::jsonb,
  safety_flags JSONB DEFAULT '[]'::jsonb,
  depth_level TEXT CHECK (depth_level IN ('surface', 'moderate', 'deep')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_journal_sessions_user_id ON public.journal_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_sessions_mode ON public.journal_sessions(mode);
CREATE INDEX IF NOT EXISTS idx_journal_sessions_created_at ON public.journal_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_session_id ON public.journal_entries(session_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON public.journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_created_at ON public.journal_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_insights_entry_id ON public.journal_insights(entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_insights_user_id ON public.journal_insights(user_id);

-- Enable Row Level Security
ALTER TABLE public.journal_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for journal_sessions
CREATE POLICY "Users can view own journal sessions"
  ON public.journal_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal sessions"
  ON public.journal_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal sessions"
  ON public.journal_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal sessions"
  ON public.journal_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for journal_entries
CREATE POLICY "Users can view own journal entries"
  ON public.journal_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal entries"
  ON public.journal_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries"
  ON public.journal_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries"
  ON public.journal_entries FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for journal_insights
CREATE POLICY "Users can view own journal insights"
  ON public.journal_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal insights"
  ON public.journal_insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Triggers
CREATE OR REPLACE FUNCTION update_journal_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.journal_sessions
  SET updated_at = NOW()
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_session_on_entry ON public.journal_entries;
CREATE TRIGGER update_session_on_entry
  AFTER INSERT ON public.journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_journal_session_timestamp();

-- Verification
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('journal_sessions', 'journal_entries', 'journal_insights');

-- Success
DO $$
BEGIN
  RAISE NOTICE '✅ Journal feature database schema created successfully!';
END $$;
