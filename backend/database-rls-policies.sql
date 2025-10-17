-- =====================================================
-- LUMA BACKEND - ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- Run this AFTER database-migration-master.sql
-- This sets up security policies for all tables
-- The script is idempotent — safe to run multiple times
-- =====================================================

-- =====================================================
-- Drop Existing Policies (for idempotent execution)
-- =====================================================

DO $$
DECLARE
  pol RECORD;
BEGIN
  RAISE NOTICE '🔄 Dropping existing policies if any...';

  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;',
      pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;

  RAISE NOTICE '✅ Existing policies dropped (if any existed)';
END
$$;

-- =====================================================
-- Enable RLS on All Tables
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_clarifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.narratives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.future_me_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_memory_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USERS
-- =====================================================

CREATE POLICY "Users can view own data"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own data"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- MOOD CHECKINS
-- =====================================================

CREATE POLICY "Users can view own mood checkins"
  ON public.mood_checkins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mood checkins"
  ON public.mood_checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mood checkins"
  ON public.mood_checkins FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own mood checkins"
  ON public.mood_checkins FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- CHAT
-- =====================================================

CREATE POLICY "Users can view own conversations"
  ON public.conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON public.conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON public.conversations FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view messages in their conversations"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their conversations"
  ON public.messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- =====================================================
-- JOURNAL
-- =====================================================

CREATE POLICY "Users can view own journal sessions"
  ON public.journal_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own journal sessions"
  ON public.journal_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal sessions"
  ON public.journal_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal sessions"
  ON public.journal_sessions FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own journal entries"
  ON public.journal_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own journal entries"
  ON public.journal_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries"
  ON public.journal_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries"
  ON public.journal_entries FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own journal insights"
  ON public.journal_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create journal insights"
  ON public.journal_insights FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- GOALS
-- =====================================================

CREATE POLICY "Users can view own goals"
  ON public.goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own goals"
  ON public.goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON public.goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON public.goals FOR DELETE
  USING (auth.uid() = user_id);

-- ✅ FIXED: goal_clarifications has user_id column (matching phase2-goals.sql schema)
CREATE POLICY "Users can view own goal clarifications"
  ON public.goal_clarifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create goal clarifications"
  ON public.goal_clarifications FOR INSERT
  WITH CHECK (true);

-- ✅ FIXED: action_plans has user_id column (matching phase2-goals.sql schema)
CREATE POLICY "Users can view own action plans"
  ON public.action_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create action plans"
  ON public.action_plans FOR INSERT
  WITH CHECK (true);

-- ✅ FIXED: milestones table has user_id column (matching phase2-goals.sql schema)
CREATE POLICY "Users can view own milestones"
  ON public.milestones FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create milestones"
  ON public.milestones FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own milestones"
  ON public.milestones FOR UPDATE
  USING (auth.uid() = user_id);

-- ✅ FIXED: weekly_actions table has user_id column (matching phase2-goals.sql schema)
CREATE POLICY "Users can view own weekly actions"
  ON public.weekly_actions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create weekly actions"
  ON public.weekly_actions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own weekly actions"
  ON public.weekly_actions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own weekly actions"
  ON public.weekly_actions FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own progress reflections"
  ON public.progress_reflections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own progress reflections"
  ON public.progress_reflections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- TOOLS
-- =====================================================

CREATE POLICY "Users can view own brain exercises"
  ON public.brain_exercises FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own brain exercises"
  ON public.brain_exercises FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brain exercises"
  ON public.brain_exercises FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own brain exercises"
  ON public.brain_exercises FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own narratives"
  ON public.narratives FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own narratives"
  ON public.narratives FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own narratives"
  ON public.narratives FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own narratives"
  ON public.narratives FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own future me exercises"
  ON public.future_me_exercises FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own future me exercises"
  ON public.future_me_exercises FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own future me exercises"
  ON public.future_me_exercises FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own future me exercises"
  ON public.future_me_exercises FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own tool sessions"
  ON public.tool_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tool sessions"
  ON public.tool_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tool sessions"
  ON public.tool_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- MEMORY
-- =====================================================

CREATE POLICY "Users can view their own memory blocks"
  ON public.memory_blocks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own memory blocks"
  ON public.memory_blocks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memory blocks"
  ON public.memory_blocks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memory blocks"
  ON public.memory_blocks FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own memory relations"
  ON public.memory_relations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own memory relations"
  ON public.memory_relations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memory relations"
  ON public.memory_relations FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own memory ledger"
  ON public.memory_ledger FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert to memory ledger"
  ON public.memory_ledger FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own memory insights"
  ON public.memory_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create memory insights"
  ON public.memory_insights FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own memory settings"
  ON public.user_memory_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own memory settings"
  ON public.user_memory_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memory settings"
  ON public.user_memory_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- GRANTS
-- =====================================================

GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
DECLARE
  rls_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO rls_count
  FROM pg_tables
  WHERE schemaname = 'public'
  AND rowsecurity = true;

  IF rls_count = 22 THEN
    RAISE NOTICE '✅ SUCCESS: RLS enabled on all 22 tables!';
  ELSE
    RAISE EXCEPTION '❌ ERROR: Expected RLS on 22 tables, but found %', rls_count;
  END IF;
END
$$;

DO $$
BEGIN
  RAISE NOTICE '✅ All RLS policies created successfully!';
END
$$;
