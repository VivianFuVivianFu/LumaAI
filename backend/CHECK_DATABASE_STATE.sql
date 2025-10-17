-- =====================================================
-- DATABASE STATE CHECK
-- =====================================================
-- Run this to check what exists in your database
-- =====================================================

-- Check if tables exist
SELECT
  'Tables' AS check_type,
  COUNT(*) AS count
FROM pg_tables
WHERE schemaname = 'public';

-- List all tables
SELECT
  tablename AS "Table Name",
  CASE WHEN rowsecurity THEN '✅ Enabled' ELSE '❌ Disabled' END AS "RLS Status"
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check specific tables needed for indexes
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('goals', 'weekly_actions', 'goal_clarifications', 'action_plans', 'milestones')
  AND column_name = 'goal_id'
ORDER BY table_name, ordinal_position;

-- Check if policies exist
SELECT
  'Policies' AS check_type,
  COUNT(*) AS count
FROM pg_policies
WHERE schemaname = 'public';

-- Check if indexes exist
SELECT
  'Indexes' AS check_type,
  COUNT(*) AS count
FROM pg_indexes
WHERE schemaname = 'public';

-- Expected vs Actual
DO $$
DECLARE
  table_count INTEGER;
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count FROM pg_tables WHERE schemaname = 'public';
  SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE schemaname = 'public';

  RAISE NOTICE '========================================';
  RAISE NOTICE 'DATABASE STATE CHECK';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tables found: % (Expected: 22)', table_count;
  RAISE NOTICE 'Policies found: % (Expected: 60+)', policy_count;
  RAISE NOTICE '========================================';

  IF table_count = 0 THEN
    RAISE NOTICE '❌ ERROR: No tables found!';
    RAISE NOTICE '   Action: Run database-migration-master.sql FIRST';
  ELSIF table_count < 22 THEN
    RAISE NOTICE '⚠️  WARNING: Only % of 22 tables found', table_count;
    RAISE NOTICE '   Action: Re-run database-migration-master.sql';
  ELSE
    RAISE NOTICE '✅ All 22 tables exist';
    RAISE NOTICE '   Action: Safe to run database-rls-policies.sql';
    RAISE NOTICE '   Then: Run database-indexes-functions.sql';
  END IF;
END $$;
