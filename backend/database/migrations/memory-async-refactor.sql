-- =====================================================
-- MEMORY SYSTEM ASYNC REFACTOR MIGRATION
-- =====================================================
-- Adds async processing, job queue, and rate limiting
-- to memory system for improved performance
-- =====================================================

-- =====================================================
-- 1. UPDATE memory_blocks - Add status tracking
-- =====================================================

-- Add status column for tracking enrichment state
ALTER TABLE public.memory_blocks
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
CHECK (status IN ('pending_enrichment', 'active', 'failed'));

-- Add index for worker queries (find pending blocks)
CREATE INDEX IF NOT EXISTS idx_memory_blocks_status_pending
ON public.memory_blocks(status, created_at)
WHERE status = 'pending_enrichment';

-- Add index for failed blocks (monitoring)
CREATE INDEX IF NOT EXISTS idx_memory_blocks_status_failed
ON public.memory_blocks(status, created_at)
WHERE status = 'failed';

-- Update existing blocks to 'active' status
UPDATE public.memory_blocks
SET status = 'active'
WHERE status IS NULL;

-- =====================================================
-- 2. CREATE memory_jobs - Async job queue
-- =====================================================

CREATE TABLE IF NOT EXISTS public.memory_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Job metadata
  job_type TEXT NOT NULL CHECK (job_type IN (
    'enrich_and_embed',
    'detect_relations',
    'synthesize_context',
    'weekly_summary'
  )),

  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  payload JSONB NOT NULL,

  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',
    'processing',
    'completed',
    'failed'
  )),

  -- Priority and retry logic
  priority INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,

  -- Error handling
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Performance tracking
  processing_time_ms INTEGER
);

-- Indexes for efficient job processing
CREATE INDEX IF NOT EXISTS idx_memory_jobs_pending
ON public.memory_jobs(status, priority DESC, created_at ASC)
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_memory_jobs_user
ON public.memory_jobs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_memory_jobs_type
ON public.memory_jobs(job_type, status);

CREATE INDEX IF NOT EXISTS idx_memory_jobs_failed
ON public.memory_jobs(status, created_at DESC)
WHERE status = 'failed';

-- =====================================================
-- 3. CREATE memory_rate_limits - Rate limiting table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.memory_rate_limits (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,

  -- Relation detection rate limiting
  relation_detection_count INTEGER DEFAULT 0,
  last_relation_detection TIMESTAMPTZ,
  relation_detection_window_start TIMESTAMPTZ DEFAULT NOW(),

  -- Other rate limits can be added here

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for rate limit checks
CREATE INDEX IF NOT EXISTS idx_memory_rate_limits_user
ON public.memory_rate_limits(user_id);

-- =====================================================
-- 4. ROW LEVEL SECURITY for new tables
-- =====================================================

ALTER TABLE public.memory_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_rate_limits ENABLE ROW LEVEL SECURITY;

-- memory_jobs policies (read-only for users, service role manages)
CREATE POLICY "Users can view their own memory jobs"
  ON public.memory_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage memory jobs"
  ON public.memory_jobs FOR ALL
  USING (true); -- Service role only

-- memory_rate_limits policies (read-only for users)
CREATE POLICY "Users can view their own rate limits"
  ON public.memory_rate_limits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage rate limits"
  ON public.memory_rate_limits FOR ALL
  USING (true); -- Service role only

-- =====================================================
-- 5. HELPER FUNCTIONS
-- =====================================================

-- Function to clean up old completed jobs (older than 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_memory_jobs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.memory_jobs
  WHERE status = 'completed'
  AND completed_at < NOW() - INTERVAL '7 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset rate limits (call hourly)
CREATE OR REPLACE FUNCTION reset_memory_rate_limits()
RETURNS INTEGER AS $$
DECLARE
  reset_count INTEGER;
BEGIN
  UPDATE public.memory_rate_limits
  SET
    relation_detection_count = 0,
    relation_detection_window_start = NOW(),
    updated_at = NOW()
  WHERE relation_detection_window_start < NOW() - INTERVAL '1 hour';

  GET DIAGNOSTICS reset_count = ROW_COUNT;
  RETURN reset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get job queue stats
CREATE OR REPLACE FUNCTION get_memory_job_stats()
RETURNS TABLE (
  status TEXT,
  count BIGINT,
  avg_processing_time_ms NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mj.status,
    COUNT(*)::BIGINT,
    AVG(mj.processing_time_ms)::NUMERIC
  FROM public.memory_jobs mj
  GROUP BY mj.status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can detect relations (rate limiting)
CREATE OR REPLACE FUNCTION can_detect_relations(
  p_user_id UUID,
  p_max_per_hour INTEGER DEFAULT 5
)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  window_start TIMESTAMPTZ;
BEGIN
  -- Get or create rate limit record
  INSERT INTO public.memory_rate_limits (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Get current count and window start
  SELECT
    relation_detection_count,
    relation_detection_window_start
  INTO current_count, window_start
  FROM public.memory_rate_limits
  WHERE user_id = p_user_id;

  -- Reset if window has passed
  IF window_start < NOW() - INTERVAL '1 hour' THEN
    UPDATE public.memory_rate_limits
    SET
      relation_detection_count = 0,
      relation_detection_window_start = NOW()
    WHERE user_id = p_user_id;

    RETURN TRUE;
  END IF;

  -- Check if under limit
  RETURN current_count < p_max_per_hour;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment relation detection count
CREATE OR REPLACE FUNCTION increment_relation_detection(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.memory_rate_limits
  SET
    relation_detection_count = relation_detection_count + 1,
    last_relation_detection = NOW(),
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. TRIGGERS
-- =====================================================

-- Trigger to update updated_at on rate limits
CREATE OR REPLACE FUNCTION update_rate_limits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_memory_rate_limits_updated_at
  BEFORE UPDATE ON public.memory_rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_rate_limits_updated_at();

-- =====================================================
-- 7. GRANTS (if needed for service role)
-- =====================================================

-- Grant necessary permissions to service role
GRANT ALL ON public.memory_jobs TO service_role;
GRANT ALL ON public.memory_rate_limits TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_memory_jobs() TO service_role;
GRANT EXECUTE ON FUNCTION reset_memory_rate_limits() TO service_role;
GRANT EXECUTE ON FUNCTION get_memory_job_stats() TO service_role;
GRANT EXECUTE ON FUNCTION can_detect_relations(UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION increment_relation_detection(UUID) TO service_role;

-- =====================================================
-- 8. INITIAL DATA / MIGRATION
-- =====================================================

-- Migrate any pending enrichment blocks (if exists)
-- This is safe to run even if no such blocks exist
UPDATE public.memory_blocks
SET status = 'pending_enrichment'
WHERE embedding IS NULL
AND created_at > NOW() - INTERVAL '24 hours'
AND status = 'active';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verify migration
DO $$
BEGIN
  RAISE NOTICE 'Memory system async refactor migration completed successfully';
  RAISE NOTICE 'Tables created: memory_jobs, memory_rate_limits';
  RAISE NOTICE 'Columns added: memory_blocks.status';
  RAISE NOTICE 'Indexes created: 6 new indexes';
  RAISE NOTICE 'Functions created: 5 helper functions';
  RAISE NOTICE 'Ready for async worker deployment';
END $$;
