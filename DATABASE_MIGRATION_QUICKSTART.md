# Database Migration Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

Follow these steps in order to set up your Luma backend database.

---

## Step 1: Open Supabase SQL Editor

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

---

## Step 2: Run Migrations (In Order!)

⚠️ **CRITICAL: Scripts must be run in this exact order!**

Running scripts out of order will cause errors like "column does not exist" or "relation does not exist". If you encounter these errors, you likely ran the scripts in the wrong order - see troubleshooting section below.

### ✅ Migration 1: Tables
```sql
-- Copy and paste the entire contents of:
-- backend/database-migration-master.sql

-- This creates all 22 tables
```

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

**⚠️ If you see an error about pgvector:**
- Go to **Dashboard** → **Database** → **Extensions**
- Find `vector` and click **Enable**
- Re-run the migration

---

### ✅ Migration 2: RLS Policies
```sql
-- Copy and paste the entire contents of:
-- backend/database-rls-policies.sql

-- This sets up security policies
```

**Expected Output:**
```
✅ SUCCESS: RLS enabled on all 22 tables!
✅ All RLS policies created successfully!
```

---

### ✅ Migration 3: Indexes & Functions
```sql
-- Copy and paste the entire contents of:
-- backend/database-indexes-functions.sql

-- This optimizes queries and adds automation
```

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

---

## Step 3: Verify Installation

Run this query to verify everything worked:

```sql
-- Check all tables exist
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Should return 22 tables:
-- action_plans
-- brain_exercises
-- conversations
-- future_me_exercises
-- goal_clarifications
-- goals
-- journal_entries
-- journal_insights
-- journal_sessions
-- memory_blocks
-- memory_insights
-- memory_ledger
-- memory_relations
-- messages
-- milestones
-- mood_checkins
-- narratives
-- progress_reflections
-- tool_sessions
-- user_memory_settings
-- users
-- weekly_actions
```

**Expected:** 22 rows returned

---

## Step 4: Test pgvector Extension

```sql
-- Test vector search is working
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Should return 1 row with vector extension details
```

---

## Step 5: Configure Backend Environment

Create `backend/.env` file:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# OpenAI
OPENAI_API_KEY=sk-proj-your-key-here

# LangFuse
LANGFUSE_SECRET_KEY=sk-lf-your-secret-key
LANGFUSE_PUBLIC_KEY=pk-lf-your-public-key
LANGFUSE_HOST=https://cloud.langfuse.com

# Server
PORT=3001
NODE_ENV=development
```

**Find your Supabase keys:**
1. Go to **Project Settings** → **API**
2. Copy `URL`, `anon public`, and `service_role secret`

---

## Step 6: Start Backend Server

```bash
cd backend
npm install
npm run dev
```

**Expected Output:**
```
Server running on port 3001
Supabase connected
LangFuse initialized
```

---

## Step 7: Test Health Check

```bash
curl http://localhost:3001/api/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Luma API is running",
  "timestamp": "2025-01-..."
}
```

---

## ✅ Success!

Your Luma backend database is now fully set up with:

- ✅ 22 database tables
- ✅ Row Level Security enabled
- ✅ Indexes for fast queries
- ✅ Vector search for Memory feature
- ✅ Automated triggers

**Next Steps:**
- Follow [PHASE2.5_TESTING_GUIDE.md](PHASE2.5_TESTING_GUIDE.md) for API testing
- Test all 15 core endpoints
- Verify Memory ingestion works
- Check LangFuse traces

---

## 🐛 Troubleshooting

### Error: "pgvector extension not available"
**Solution:**
1. Go to Supabase Dashboard → Database → Extensions
2. Find `vector` extension
3. Click Enable
4. Re-run migration 1

### Error: "relation already exists"
**Solution:**
- Tables already exist from previous migration
- Either:
  - Skip to migration 2 (RLS policies)
  - OR drop all tables and re-run (⚠️ deletes data)

### Error: "permission denied for schema public"
**Solution:**
- Check you're using the correct Supabase credentials
- Verify you have admin access to the project

### Error: "function already exists"
**Solution:**
- Functions were already created
- This is safe to ignore, or use `CREATE OR REPLACE FUNCTION` (already in script)

### Error: "column goal_id does not exist" or "relation does not exist"
**Root Cause:** Scripts were run in wrong order (indexes created before tables)

**Solution:**
1. Clear database and start fresh:
   ```sql
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   GRANT USAGE ON SCHEMA public TO authenticated;
   GRANT USAGE ON SCHEMA public TO anon;
   ```
2. Run scripts in correct order:
   - First: `database-migration-master.sql` (creates tables)
   - Second: `database-rls-policies.sql` (applies security)
   - Third: `database-indexes-functions.sql` (creates indexes)

### Backend won't start
**Check:**
1. `.env` file exists in `backend/` folder
2. All environment variables are set
3. Node modules installed (`npm install`)
4. Port 3001 is not in use

---

## 📞 Need Help?

1. Check console logs for detailed error messages
2. Review Supabase logs (Dashboard → Logs)
3. Verify all migration steps completed successfully
4. Refer to [PHASE2.5_TESTING_GUIDE.md](PHASE2.5_TESTING_GUIDE.md) for detailed testing

**Happy Building! 🚀**
