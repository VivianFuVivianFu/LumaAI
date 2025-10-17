# Database Setup - Step by Step Guide

## 🚨 CRITICAL: Script Execution Order

The error `column "goal_id" does not exist` happens because you're running scripts **out of order**. Follow these exact steps:

---

## Step 1: Check Current Database State

Before running any migrations, check what already exists in your database.

**Run this SQL query in Supabase SQL Editor:**

Execute the contents of: [`CHECK_DATABASE_STATE.sql`](./CHECK_DATABASE_STATE.sql)

**Expected Output:**
```
Tables found: X (Expected: 22)
Policies found: Y (Expected: 60+)
```

### What to Do Based on Results:

| Tables Found | What It Means | Action Required |
|--------------|---------------|-----------------|
| 0 | Fresh database | Continue to Step 2 |
| 1-21 | Incomplete migration | **Clear database** (see Step 1b) |
| 22 | Tables exist | Skip to Step 3 (RLS) |

---

### Step 1b: Clear Database (If Needed)

**Only do this if you have incomplete migrations or want to start fresh.**

```sql
-- WARNING: This deletes everything!
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Restore schema permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO postgres;
```

---

## Step 2: Create All Tables

**Execute:** [`database-migration-master.sql`](./database-migration-master.sql)

This creates all 22 tables required for the application.

**Expected Output:**
```
✅ Extensions enabled: uuid-ossp, vector
✅ Phase 1 tables created: users, mood_checkins
✅ Phase 2 Chat tables created: conversations, messages
✅ Phase 2 Journal tables created: journal_sessions, journal_entries, journal_insights
✅ Phase 2 Goals tables created: goals, goal_clarifications, action_plans, milestones, weekly_actions, progress_reflections
✅ Phase 2 Tools tables created: brain_exercises, narratives, future_me_exercises, tool_sessions
✅ Phase 2 Memory tables created: memory_blocks, memory_relations, memory_ledger, memory_insights, user_memory_settings
✅ SUCCESS: All 22 tables created successfully!
```

**If you see an error:**

| Error | Solution |
|-------|----------|
| `extension "vector" does not exist` | Go to **Dashboard** → **Database** → **Extensions** → Enable `vector` |
| `extension "uuid-ossp" does not exist` | Go to **Dashboard** → **Database** → **Extensions** → Enable `uuid-ossp` |
| `permission denied` | Make sure you're using the Service Role key, not anon key |

---

## Step 3: Apply Row Level Security (RLS)

**Execute:** [`database-rls-policies.sql`](./database-rls-policies.sql)

This sets up security policies so users can only access their own data.

**Expected Output:**
```
🔄 Dropping existing policies if any...
✅ Existing policies dropped (if any existed)
✅ SUCCESS: RLS enabled on all 22 tables!
✅ All RLS policies created successfully!
```

**Why This Can Be Run Multiple Times:**
- The script is **idempotent** (safe to re-run)
- It automatically drops old policies before creating new ones
- No errors if run twice

---

## Step 4: Create Indexes and Functions

**Execute:** [`database-indexes-functions.sql`](./database-indexes-functions.sql)

This optimizes query performance and sets up automation.

**Expected Output:**
```
✅ All indexes created successfully!
✅ All functions created successfully!
✅ All triggers created successfully!
✅ Database setup complete!
   - Indexes created: 40+
   - Functions created: 5
   - Triggers created: 10+
```

**⚠️ IMPORTANT:** This script will fail if you run it before Step 2 because it tries to create indexes on tables that don't exist yet.

**Common Errors:**

| Error | Root Cause | Solution |
|-------|-----------|----------|
| `column "goal_id" does not exist` | Ran this script before migration-master.sql | Run Step 2 first |
| `relation "public.goals" does not exist` | Tables not created yet | Run Step 2 first |
| `function already exists` | Script run multiple times | Safe to ignore |

---

## Step 5: Verify Setup

Run this verification query:

```sql
-- Check tables
SELECT
  'Tables' AS item,
  COUNT(*) AS count,
  '22 expected' AS expected
FROM pg_tables
WHERE schemaname = 'public'

UNION ALL

-- Check RLS enabled
SELECT
  'RLS Policies' AS item,
  COUNT(*) AS count,
  '60+ expected' AS expected
FROM pg_policies
WHERE schemaname = 'public'

UNION ALL

-- Check indexes
SELECT
  'Indexes' AS item,
  COUNT(*) AS count,
  '40+ expected' AS expected
FROM pg_indexes
WHERE schemaname = 'public'

UNION ALL

-- Check functions
SELECT
  'Functions' AS item,
  COUNT(*) AS count,
  '5 expected' AS expected
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
AND proname IN ('update_updated_at_column', 'handle_new_user', 'create_memory_settings_for_new_user', 'search_memory_blocks', 'get_related_blocks');
```

**Expected Result:**

| Item | Count | Expected |
|------|-------|----------|
| Tables | 22 | 22 expected |
| RLS Policies | 60+ | 60+ expected |
| Indexes | 40+ | 40+ expected |
| Functions | 5 | 5 expected |

---

## Step 6: Test Backend Connection

Now that the database is set up, test your backend:

1. **Make sure `.env` is configured:**
   ```bash
   cd backend
   cat .env  # Should show SUPABASE_URL, SUPABASE_SERVICE_KEY, etc.
   ```

2. **Start the backend:**
   ```bash
   npm run dev
   ```

3. **Test the health endpoint:**
   ```bash
   curl http://localhost:3001/api/health
   ```

   **Expected response:**
   ```json
   {
     "status": "ok",
     "timestamp": "2025-10-12T...",
     "database": "connected"
   }
   ```

---

## Troubleshooting

### Error: "column goal_id does not exist"

**Cause:** You ran `database-indexes-functions.sql` BEFORE `database-migration-master.sql`

**Solution:**
1. Clear your database (Step 1b)
2. Follow the steps in exact order: Step 2 → Step 3 → Step 4

---

### Error: "policy already exists"

**Cause:** You ran `database-rls-policies.sql` multiple times before the idempotent fix

**Solution:**
- The script is now fixed with automatic cleanup
- Just run it again - it will work

---

### Error: "extension vector does not exist"

**Cause:** pgvector extension not enabled in Supabase

**Solution:**
1. Go to Supabase Dashboard
2. Navigate to **Database** → **Extensions**
3. Search for `vector`
4. Click **Enable**
5. Re-run `database-migration-master.sql`

---

## Summary Checklist

- [ ] Step 1: Check database state
- [ ] Step 2: Run `database-migration-master.sql` (creates 22 tables)
- [ ] Step 3: Run `database-rls-policies.sql` (applies security)
- [ ] Step 4: Run `database-indexes-functions.sql` (optimizes performance)
- [ ] Step 5: Verify all counts match expected values
- [ ] Step 6: Start backend and test connection

**Once all steps are complete**, proceed to [PHASE2.5_TESTING_GUIDE.md](../PHASE2.5_TESTING_GUIDE.md) to test all API endpoints.

---

## Quick Reference

| File | Purpose | When to Run | Can Re-run? |
|------|---------|-------------|-------------|
| `CHECK_DATABASE_STATE.sql` | Check what exists | Before everything | ✅ Always |
| `database-migration-master.sql` | Create tables | First (Step 2) | ⚠️ Use CREATE IF NOT EXISTS |
| `database-rls-policies.sql` | Apply security | Second (Step 3) | ✅ Yes (idempotent) |
| `database-indexes-functions.sql` | Optimize | Third (Step 4) | ⚠️ May cause "already exists" warnings |

---

**Next:** After completing all steps successfully, move to [PHASE2.5_TESTING_GUIDE.md](../PHASE2.5_TESTING_GUIDE.md)
