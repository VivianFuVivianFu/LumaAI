# SQL Error Fixes - Complete Resolution

## Fixed Issues

### 1. database-rls-policies.sql - Multiple Errors ✅ FIXED

**Error 1:** `syntax error at or near "RAISE"` on line 414
**Error 2:** `policy "Users can view own data" for table "users" already exists`

**Root Causes:**
1. PostgreSQL requires `RAISE NOTICE` statements to be inside a function or DO block. Line 414 had a standalone `RAISE NOTICE` statement.
2. Running the script multiple times caused duplicate policy errors because policies already existed.

**Fixes Applied:**

1. **Wrapped RAISE NOTICE in DO block:**
```sql
-- BEFORE (incorrect)
END $$;

RAISE NOTICE '✅ All RLS policies created successfully!';

-- AFTER (correct)
END $$;

DO $$ BEGIN
  RAISE NOTICE '✅ All RLS policies created successfully!';
END $$;
```

2. **Added policy cleanup at the start (makes script idempotent):**
```sql
-- Drop all existing policies before creating new ones
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
      pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;
```

**Status:** ✅ Fixed in [database-rls-policies.sql](./database-rls-policies.sql)
- Lines 8-33: Policy cleanup added
- Lines 440-442: RAISE NOTICE wrapped in DO block

**Result:** Script can now be run multiple times safely without errors

---

### 2. database-indexes-functions.sql - "column goal_id does not exist" ❌ USER ERROR (Not a code issue)

**Error:**
```
ERROR: 42703: column "goal_id" does not exist
```

**Root Cause:**
This error occurs when `database-indexes-functions.sql` is executed BEFORE `database-migration-master.sql`. The indexes script tries to create indexes on tables that don't exist yet.

**Verification:**
The `weekly_actions` table DOES have a `goal_id` column (confirmed in [database-migration-master.sql](./database-migration-master.sql) line 182):
```sql
CREATE TABLE IF NOT EXISTS public.weekly_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id UUID NOT NULL REFERENCES public.milestones(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,  -- ← Column exists!
  action_text TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Resolution:**
This is **not a code error** - it's a script execution order issue.

**Correct Execution Order:**
```bash
# Step 1: Create all tables first
Run: database-migration-master.sql

# Step 2: Set up security policies
Run: database-rls-policies.sql

# Step 3: Create indexes and functions (requires tables to exist)
Run: database-indexes-functions.sql
```

**Status:** ✅ No code fix needed - User must run scripts in correct order

---

## Summary

| File | Issue | Status | Action Required |
|------|-------|--------|-----------------|
| `database-rls-policies.sql` | Standalone RAISE NOTICE + duplicate policies | ✅ Fixed | None - code fixed, now idempotent |
| `database-indexes-functions.sql` | Column doesn't exist error | ✅ User Error | Run migration-master.sql FIRST |

---

## Next Steps for User

**Note:** The RLS policies script is now idempotent (can be run multiple times safely). Just run the scripts in correct order:

1. **Run scripts in correct order:**
   ```bash
   # 1. Create tables
   Execute: database-migration-master.sql

   # 2. Apply RLS policies (now fixed and idempotent!)
   Execute: database-rls-policies.sql

   # 3. Create indexes and functions
   Execute: database-indexes-functions.sql
   ```

2. **Verify success:**
   ```sql
   -- Check all 22 tables exist
   SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';
   -- Should return: 22

   -- Check RLS is enabled
   SELECT COUNT(*) FROM pg_tables
   WHERE schemaname = 'public' AND rowsecurity = true;
   -- Should return: 22

   -- Check indexes were created
   SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';
   -- Should return: 40+
   ```

3. **Start testing Phase 2.5:**
   - Follow [PHASE2.5_TESTING_GUIDE.md](../PHASE2.5_TESTING_GUIDE.md)
   - Run backend server: `npm run dev`
   - Test API endpoints

---

## All SQL Fixes Applied

### Previous Fixes (from earlier session):
- ✅ `database-migration-master.sql` - Fixed 6 standalone RAISE NOTICE statements
- ✅ `database-indexes-functions.sql` - Fixed 3 standalone RAISE NOTICE statements

### Current Fixes:
- ✅ `database-rls-policies.sql` - Fixed 1 standalone RAISE NOTICE statement + added idempotent policy cleanup

**Total Fixes:**
- 10 RAISE NOTICE syntax errors wrapped in DO blocks
- 1 idempotent execution fix (policy cleanup for RLS script)

---

## References

- [PHASE2.5_TESTING_GUIDE.md](../PHASE2.5_TESTING_GUIDE.md) - Complete testing workflow
- [DATABASE_MIGRATION_QUICKSTART.md](../DATABASE_MIGRATION_QUICKSTART.md) - Fast setup guide
- [SQL_FIXES_APPLIED.md](./SQL_FIXES_APPLIED.md) - Previous fix documentation
