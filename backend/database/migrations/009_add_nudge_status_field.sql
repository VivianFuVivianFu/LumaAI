-- ====================================================================
-- Phase 3.5: Add Status Field to Nudges Table
-- ====================================================================
-- Adds a computed status field to nudges table for easier querying
-- and compatibility with frontend/test expectations
--
-- Created: Phase 3 Enhancement
-- ====================================================================

-- ====================================================================
-- 1. ADD STATUS COLUMN
-- ====================================================================

-- Add status enum field (computed from timestamp fields)
ALTER TABLE public.nudges
ADD COLUMN IF NOT EXISTS status TEXT
  CHECK (status IN ('pending', 'shown', 'accepted', 'dismissed', 'completed', 'expired'))
  DEFAULT 'pending';

-- ====================================================================
-- 2. BACKFILL EXISTING NUDGES WITH CORRECT STATUS
-- ====================================================================

-- Update existing nudges to have correct status based on timestamps
UPDATE public.nudges
SET status = CASE
  WHEN completed_at IS NOT NULL THEN 'completed'
  WHEN accepted_at IS NOT NULL THEN 'accepted'
  WHEN dismissed_at IS NOT NULL THEN 'dismissed'
  WHEN expires_at < NOW() THEN 'expired'
  WHEN shown_at IS NOT NULL THEN 'shown'
  ELSE 'pending'
END
WHERE status IS NULL OR status = 'pending';

-- ====================================================================
-- 3. CREATE TRIGGER TO AUTO-UPDATE STATUS
-- ====================================================================

-- Trigger function to automatically update status based on lifecycle timestamps
CREATE OR REPLACE FUNCTION public.update_nudge_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Determine status based on timestamp priority
  -- (completed > accepted > dismissed > expired > shown > pending)
  IF NEW.completed_at IS NOT NULL THEN
    NEW.status := 'completed';
  ELSIF NEW.accepted_at IS NOT NULL THEN
    NEW.status := 'accepted';
  ELSIF NEW.dismissed_at IS NOT NULL THEN
    NEW.status := 'dismissed';
  ELSIF NEW.expires_at < NOW() THEN
    NEW.status := 'expired';
  ELSIF NEW.shown_at IS NOT NULL THEN
    NEW.status := 'shown';
  ELSE
    NEW.status := 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on INSERT and UPDATE
DROP TRIGGER IF EXISTS trigger_update_nudge_status ON public.nudges;
CREATE TRIGGER trigger_update_nudge_status
  BEFORE INSERT OR UPDATE ON public.nudges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_nudge_status();

-- ====================================================================
-- 4. CREATE INDEX FOR STATUS-BASED QUERIES
-- ====================================================================

-- Index for filtering nudges by status
CREATE INDEX IF NOT EXISTS idx_nudges_user_status_created
  ON public.nudges(user_id, status, created_at DESC);

-- ====================================================================
-- 5. UPDATE EXISTING INDEX TO REMOVE REDUNDANT STATUS FILTER
-- ====================================================================

-- The existing idx_nudges_user_surface_status_expires was trying to use
-- status but it didn't exist. Now we can create it properly.
DROP INDEX IF EXISTS idx_nudges_user_surface_status_expires;
CREATE INDEX IF NOT EXISTS idx_nudges_user_surface_status_expires
  ON public.nudges(user_id, target_surface, status, expires_at DESC);

-- ====================================================================
-- COMMENTS
-- ====================================================================

COMMENT ON COLUMN public.nudges.status IS 'Computed status field based on lifecycle timestamps - automatically updated by trigger';
COMMENT ON FUNCTION public.update_nudge_status IS 'Automatically updates nudge status based on timestamp fields';

-- ====================================================================
-- VERIFICATION
-- ====================================================================

-- Verify status distribution
DO $$
DECLARE
  v_pending INTEGER;
  v_shown INTEGER;
  v_accepted INTEGER;
  v_dismissed INTEGER;
  v_completed INTEGER;
  v_expired INTEGER;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE status = 'pending'),
    COUNT(*) FILTER (WHERE status = 'shown'),
    COUNT(*) FILTER (WHERE status = 'accepted'),
    COUNT(*) FILTER (WHERE status = 'dismissed'),
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status = 'expired')
  INTO v_pending, v_shown, v_accepted, v_dismissed, v_completed, v_expired
  FROM public.nudges;

  RAISE NOTICE '✅ Nudge Status Migration Complete:';
  RAISE NOTICE '   - Pending: %', v_pending;
  RAISE NOTICE '   - Shown: %', v_shown;
  RAISE NOTICE '   - Accepted: %', v_accepted;
  RAISE NOTICE '   - Dismissed: %', v_dismissed;
  RAISE NOTICE '   - Completed: %', v_completed;
  RAISE NOTICE '   - Expired: %', v_expired;
END $$;

-- ====================================================================
-- MIGRATION COMPLETE
-- ====================================================================
