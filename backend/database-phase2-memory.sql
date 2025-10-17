-- =====================================================
-- PHASE 2: MEMORY FUNCTION DATABASE SCHEMA
-- =====================================================
-- Core Memory Intelligence: unified storage for all user interactions
-- Uses pgvector for semantic search and embeddings
-- =====================================================

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================================
-- 1. MEMORY BLOCKS - Unified storage for all interactions
-- =====================================================

CREATE TABLE IF NOT EXISTS public.memory_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Block metadata
  block_type TEXT NOT NULL CHECK (block_type IN (
    'chat_message',
    'journal_entry',
    'goal',
    'action_plan',
    'exercise',
    'reflection',
    'mood_checkin',
    'insight'
  )),

  -- Reference to original content
  source_feature TEXT NOT NULL CHECK (source_feature IN ('chat', 'journal', 'goals', 'tools', 'dashboard')),
  source_id UUID NOT NULL, -- ID from original table (messages, journal_entries, goals, etc.)

  -- Content
  content_text TEXT NOT NULL, -- The actual text content
  summary TEXT, -- Auto-generated summary for quick recall

  -- Enrichment data
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'mixed')),
  emotional_tone TEXT, -- e.g., "anxious", "hopeful", "reflective"
  themes JSONB, -- Array of detected themes
  tags JSONB, -- Array of tags for categorization

  -- Safety and privacy
  privacy_level TEXT DEFAULT 'ai-only' CHECK (privacy_level IN ('public', 'private', 'ai-only')),
  crisis_flag BOOLEAN DEFAULT false,
  sensitivity_flag BOOLEAN DEFAULT false,
  exclude_from_memory BOOLEAN DEFAULT false, -- User opt-out for specific block

  -- Embedding for semantic search
  embedding vector(1536), -- OpenAI text-embedding-3-small dimension

  -- Metadata
  relevance_score DECIMAL(3,2), -- Auto-calculated importance (0.00-1.00)
  retrieval_count INTEGER DEFAULT 0, -- How often this block has been retrieved
  last_retrieved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. MEMORY RELATIONS - Connect blocks across features
-- =====================================================

CREATE TABLE IF NOT EXISTS public.memory_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Source and target blocks
  source_block_id UUID NOT NULL REFERENCES public.memory_blocks(id) ON DELETE CASCADE,
  target_block_id UUID NOT NULL REFERENCES public.memory_blocks(id) ON DELETE CASCADE,

  -- Relation type
  relation_type TEXT NOT NULL CHECK (relation_type IN (
    'supports',
    'addresses',
    'follows_up_on',
    'derived_from',
    'connected_to',
    'contradicts',
    'reinforces'
  )),

  -- Metadata
  strength DECIMAL(3,2) DEFAULT 0.50 CHECK (strength BETWEEN 0.00 AND 1.00), -- Relation strength
  auto_generated BOOLEAN DEFAULT true, -- System-detected vs user-defined

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. MEMORY LEDGER - Track all memory operations
-- =====================================================

CREATE TABLE IF NOT EXISTS public.memory_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Operation details
  operation_type TEXT NOT NULL CHECK (operation_type IN (
    'create',
    'retrieve',
    'update',
    'delete',
    'redact',
    'exclude'
  )),

  block_id UUID REFERENCES public.memory_blocks(id) ON DELETE SET NULL,

  -- Context
  triggered_by TEXT NOT NULL, -- Which feature triggered this (chat, journal, goals, tools)
  context JSONB, -- Additional context about the operation

  -- Explainability
  reason TEXT, -- Why this operation occurred
  relevance_score DECIMAL(3,2), -- For retrieve operations

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. MEMORY INSIGHTS - Derived intelligence
-- =====================================================

CREATE TABLE IF NOT EXISTS public.memory_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Insight type
  insight_type TEXT NOT NULL CHECK (insight_type IN (
    'weekly_summary',
    'pattern_recognition',
    'trait_mapping',
    'recovery_metric',
    'progress_snapshot'
  )),

  -- Content
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  detailed_analysis TEXT,

  -- Data
  insights_data JSONB, -- Structured data for charts/metrics
  source_blocks JSONB, -- Array of block IDs that contributed to this insight

  -- Timeframe
  period_start DATE,
  period_end DATE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. USER MEMORY SETTINGS - Privacy and control
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_memory_settings (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,

  -- Global memory toggle
  memory_enabled BOOLEAN DEFAULT true,

  -- Feature-specific toggles
  chat_memory_enabled BOOLEAN DEFAULT true,
  journal_memory_enabled BOOLEAN DEFAULT true,
  goals_memory_enabled BOOLEAN DEFAULT true,
  tools_memory_enabled BOOLEAN DEFAULT true,

  -- Privacy preferences
  default_privacy_level TEXT DEFAULT 'ai-only' CHECK (default_privacy_level IN ('public', 'private', 'ai-only')),
  allow_crisis_recall BOOLEAN DEFAULT false, -- Opt-in for trauma/crisis content retrieval
  allow_cross_feature_recall BOOLEAN DEFAULT true, -- Allow Chat to recall Journal, etc.

  -- Auto-insights preferences
  weekly_summary_enabled BOOLEAN DEFAULT true,
  pattern_insights_enabled BOOLEAN DEFAULT true,

  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Memory blocks indexes
CREATE INDEX IF NOT EXISTS idx_memory_blocks_user_id ON public.memory_blocks(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_blocks_block_type ON public.memory_blocks(user_id, block_type);
CREATE INDEX IF NOT EXISTS idx_memory_blocks_source ON public.memory_blocks(user_id, source_feature, source_id);
CREATE INDEX IF NOT EXISTS idx_memory_blocks_created_at ON public.memory_blocks(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memory_blocks_exclude ON public.memory_blocks(user_id, exclude_from_memory);

-- Vector similarity search index (using HNSW algorithm)
CREATE INDEX IF NOT EXISTS idx_memory_blocks_embedding ON public.memory_blocks
  USING hnsw (embedding vector_cosine_ops)
  WHERE embedding IS NOT NULL;

-- Memory relations indexes
CREATE INDEX IF NOT EXISTS idx_memory_relations_user_id ON public.memory_relations(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_relations_source ON public.memory_relations(source_block_id);
CREATE INDEX IF NOT EXISTS idx_memory_relations_target ON public.memory_relations(target_block_id);
CREATE INDEX IF NOT EXISTS idx_memory_relations_type ON public.memory_relations(user_id, relation_type);

-- Memory ledger indexes
CREATE INDEX IF NOT EXISTS idx_memory_ledger_user_id ON public.memory_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_ledger_created_at ON public.memory_ledger(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memory_ledger_operation ON public.memory_ledger(user_id, operation_type);

-- Memory insights indexes
CREATE INDEX IF NOT EXISTS idx_memory_insights_user_id ON public.memory_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_insights_type ON public.memory_insights(user_id, insight_type);
CREATE INDEX IF NOT EXISTS idx_memory_insights_created_at ON public.memory_insights(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.memory_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_memory_settings ENABLE ROW LEVEL SECURITY;

-- Memory blocks policies
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

-- Memory relations policies
CREATE POLICY "Users can view their own memory relations"
  ON public.memory_relations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own memory relations"
  ON public.memory_relations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memory relations"
  ON public.memory_relations FOR DELETE
  USING (auth.uid() = user_id);

-- Memory ledger policies (read-only for users)
CREATE POLICY "Users can view their own memory ledger"
  ON public.memory_ledger FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert to memory ledger"
  ON public.memory_ledger FOR INSERT
  WITH CHECK (true); -- Service role only

-- Memory insights policies
CREATE POLICY "Users can view their own memory insights"
  ON public.memory_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create memory insights"
  ON public.memory_insights FOR INSERT
  WITH CHECK (true); -- Service role only

-- User memory settings policies
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
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp for memory blocks
CREATE OR REPLACE FUNCTION update_memory_blocks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_memory_blocks_updated_at
  BEFORE UPDATE ON public.memory_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_memory_blocks_updated_at();

-- Update updated_at timestamp for memory settings
CREATE TRIGGER update_memory_settings_updated_at
  BEFORE UPDATE ON public.user_memory_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_memory_blocks_updated_at();

-- Auto-create memory settings for new users
CREATE OR REPLACE FUNCTION create_memory_settings_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_memory_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_memory_settings_on_user_creation
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION create_memory_settings_for_new_user();

-- =====================================================
-- FUNCTIONS FOR SEMANTIC SEARCH
-- =====================================================

-- Find similar memory blocks using cosine similarity
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

-- Get related blocks through relations
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
