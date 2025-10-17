-- =====================================================
-- LUMA BACKEND - INDEXES, FUNCTIONS & TRIGGERS
-- =====================================================
-- Run this AFTER database-rls-policies.sql
-- This optimizes queries and sets up automation
-- =====================================================

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Phase 1
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);
CREATE INDEX IF NOT EXISTS idx_mood_checkins_user_id ON public.mood_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_checkins_created_at ON public.mood_checkins(created_at DESC);

-- Chat
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- Journal
CREATE INDEX IF NOT EXISTS idx_journal_sessions_user_id ON public.journal_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_sessions_created_at ON public.journal_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_session_id ON public.journal_entries(session_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON public.journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_insights_entry_id ON public.journal_insights(entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_insights_user_id ON public.journal_insights(user_id);

-- Goals (✅ Fixed to match phase2-goals.sql schema)
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON public.goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_created_at ON public.goals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_goal_clarifications_goal_id ON public.goal_clarifications(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_clarifications_user_id ON public.goal_clarifications(user_id);
CREATE INDEX IF NOT EXISTS idx_action_plans_goal_id ON public.action_plans(goal_id);
CREATE INDEX IF NOT EXISTS idx_action_plans_user_id ON public.action_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_action_plan_id ON public.milestones(action_plan_id);
CREATE INDEX IF NOT EXISTS idx_milestones_user_id ON public.milestones(user_id);
-- ❌ REMOVED idx_milestones_goal_id: milestones table doesn't have goal_id column
CREATE INDEX IF NOT EXISTS idx_weekly_actions_milestone_id ON public.weekly_actions(milestone_id);
CREATE INDEX IF NOT EXISTS idx_weekly_actions_goal_id ON public.weekly_actions(goal_id);
CREATE INDEX IF NOT EXISTS idx_weekly_actions_user_id ON public.weekly_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_actions_completed ON public.weekly_actions(goal_id, completed);
CREATE INDEX IF NOT EXISTS idx_progress_reflections_goal_id ON public.progress_reflections(goal_id);
CREATE INDEX IF NOT EXISTS idx_progress_reflections_user_id ON public.progress_reflections(user_id);

-- Tools
CREATE INDEX IF NOT EXISTS idx_brain_exercises_user_id ON public.brain_exercises(user_id);
CREATE INDEX IF NOT EXISTS idx_brain_exercises_created_at ON public.brain_exercises(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_narratives_user_id ON public.narratives(user_id);
CREATE INDEX IF NOT EXISTS idx_narratives_created_at ON public.narratives(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_future_me_user_id ON public.future_me_exercises(user_id);
CREATE INDEX IF NOT EXISTS idx_future_me_created_at ON public.future_me_exercises(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tool_sessions_user_id ON public.tool_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_tool_sessions_tool_type ON public.tool_sessions(user_id, tool_type);

-- Memory
CREATE INDEX IF NOT EXISTS idx_memory_blocks_user_id ON public.memory_blocks(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_blocks_block_type ON public.memory_blocks(user_id, block_type);
CREATE INDEX IF NOT EXISTS idx_memory_blocks_source ON public.memory_blocks(user_id, source_feature, source_id);
CREATE INDEX IF NOT EXISTS idx_memory_blocks_created_at ON public.memory_blocks(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memory_blocks_exclude ON public.memory_blocks(user_id, exclude_from_memory);

-- Vector similarity search index (HNSW algorithm)
CREATE INDEX IF NOT EXISTS idx_memory_blocks_embedding ON public.memory_blocks
  USING hnsw (embedding vector_cosine_ops)
  WHERE embedding IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_memory_relations_user_id ON public.memory_relations(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_relations_source ON public.memory_relations(source_block_id);
CREATE INDEX IF NOT EXISTS idx_memory_relations_target ON public.memory_relations(target_block_id);
CREATE INDEX IF NOT EXISTS idx_memory_ledger_user_id ON public.memory_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_ledger_created_at ON public.memory_ledger(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memory_insights_user_id ON public.memory_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_insights_created_at ON public.memory_insights(created_at DESC);

DO $$ BEGIN
  RAISE NOTICE '✅ All indexes created successfully!';
END $$;

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create default memory settings for new users
CREATE OR REPLACE FUNCTION create_memory_settings_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_memory_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function for semantic search using pgvector
CREATE OR REPLACE FUNCTION search_memory_blocks(
  p_user_id UUID,
  p_query_embedding vector(1536),
  p_limit INTEGER DEFAULT 10,
  p_similarity_threshold DECIMAL DEFAULT 0.70,
  p_exclude_crisis BOOLEAN DEFAULT true
)
RETURNS TABLE (
  block_id UUID,
  content_text TEXT,
  summary TEXT,
  block_type TEXT,
  source_feature TEXT,
  similarity DECIMAL,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mb.id,
    mb.content_text,
    mb.summary,
    mb.block_type,
    mb.source_feature,
    (1 - (mb.embedding <=> p_query_embedding))::DECIMAL AS similarity,
    mb.created_at
  FROM public.memory_blocks mb
  WHERE mb.user_id = p_user_id
    AND mb.exclude_from_memory = false
    AND mb.embedding IS NOT NULL
    AND (NOT p_exclude_crisis OR mb.crisis_flag = false)
    AND (1 - (mb.embedding <=> p_query_embedding)) >= p_similarity_threshold
  ORDER BY mb.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get related blocks through relations
CREATE OR REPLACE FUNCTION get_related_blocks(
  p_block_id UUID,
  p_user_id UUID,
  p_max_depth INTEGER DEFAULT 2
)
RETURNS TABLE (
  block_id UUID,
  content_text TEXT,
  relation_type TEXT,
  depth INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE related_blocks AS (
    -- Base case: direct relations
    SELECT
      mr.target_block_id AS block_id,
      mr.relation_type,
      1 AS depth
    FROM public.memory_relations mr
    WHERE mr.source_block_id = p_block_id
      AND mr.user_id = p_user_id

    UNION

    -- Recursive case: relations of relations
    SELECT
      mr.target_block_id,
      mr.relation_type,
      rb.depth + 1
    FROM public.memory_relations mr
    INNER JOIN related_blocks rb ON mr.source_block_id = rb.block_id
    WHERE mr.user_id = p_user_id
      AND rb.depth < p_max_depth
  )
  SELECT
    mb.id,
    mb.content_text,
    rb.relation_type,
    rb.depth
  FROM related_blocks rb
  INNER JOIN public.memory_blocks mb ON rb.block_id = mb.id
  WHERE mb.exclude_from_memory = false
  ORDER BY rb.depth, mb.created_at DESC;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  RAISE NOTICE '✅ All functions created successfully!';
END $$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger for users table to update updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically create user profile when auth.users record is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger to create default memory settings for new users
DROP TRIGGER IF EXISTS create_memory_settings_on_user_creation ON public.users;
CREATE TRIGGER create_memory_settings_on_user_creation
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION create_memory_settings_for_new_user();

-- Triggers for updated_at on various tables
DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_journal_sessions_updated_at ON public.journal_sessions;
CREATE TRIGGER update_journal_sessions_updated_at
  BEFORE UPDATE ON public.journal_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_goals_updated_at ON public.goals;
CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_brain_exercises_updated_at ON public.brain_exercises;
CREATE TRIGGER update_brain_exercises_updated_at
  BEFORE UPDATE ON public.brain_exercises
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_narratives_updated_at ON public.narratives;
CREATE TRIGGER update_narratives_updated_at
  BEFORE UPDATE ON public.narratives
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_future_me_updated_at ON public.future_me_exercises;
CREATE TRIGGER update_future_me_updated_at
  BEFORE UPDATE ON public.future_me_exercises
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_memory_blocks_updated_at ON public.memory_blocks;
CREATE TRIGGER update_memory_blocks_updated_at
  BEFORE UPDATE ON public.memory_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_memory_settings_updated_at ON public.user_memory_settings;
CREATE TRIGGER update_memory_settings_updated_at
  BEFORE UPDATE ON public.user_memory_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DO $$ BEGIN
  RAISE NOTICE '✅ All triggers created successfully!';
END $$;

-- =====================================================
-- Final Verification
-- =====================================================

DO $$
DECLARE
  index_count INTEGER;
  function_count INTEGER;
  trigger_count INTEGER;
BEGIN
  -- Count indexes
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public';

  -- Count functions
  SELECT COUNT(*) INTO function_count
  FROM pg_proc
  WHERE pronamespace = 'public'::regnamespace
  AND proname IN ('update_updated_at_column', 'handle_new_user', 'create_memory_settings_for_new_user', 'search_memory_blocks', 'get_related_blocks');

  -- Count triggers
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger
  WHERE tgrelid IN (
    SELECT oid FROM pg_class
    WHERE relnamespace = 'public'::regnamespace
  );

  RAISE NOTICE '✅ Database setup complete!';
  RAISE NOTICE '   - Indexes created: %', index_count;
  RAISE NOTICE '   - Functions created: %', function_count;
  RAISE NOTICE '   - Triggers created: %', trigger_count;
END $$;
