# Database Schema Confirmation: User Table Structure

## ✅ Analysis Complete - Schema Verified

### **User Table Architecture**

```
auth.users (Supabase Auth) ← Base authentication table
    ↓ (PRIMARY KEY reference)
public.users ← Extended user profile
    ↓ (FOREIGN KEY references)
All application tables ← Goals, Journal, Chat, Memory, etc.
```

---

## 📊 Schema Structure Confirmed

### **Base Layer: Supabase Auth**
```sql
-- Managed by Supabase (DO NOT MODIFY)
auth.users
  - id UUID PRIMARY KEY
  - email TEXT
  - encrypted_password TEXT
  - ... (other auth fields)
```

### **Profile Layer: Public Users**
```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_new_user BOOLEAN DEFAULT true,
  preferences JSONB DEFAULT '{}'::jsonb
);
```

**Key Points**:
- ✅ `public.users.id` references `auth.users(id)`
- ✅ CASCADE DELETE: If auth user deleted, profile also deleted
- ✅ Auto-created via trigger on `auth.users` INSERT

### **Application Layer: All Other Tables**
```sql
-- Example: Mood Check-ins
CREATE TABLE public.mood_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  -- ✅ References public.users, NOT auth.users
  ...
);

-- Example: Goals
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  -- ✅ References public.users, NOT auth.users
  ...
);
```

---

## ✅ Phase 3 Enhancements: Corrected & Verified

### **Issue Identified**
Your original `database-phase3-enhancements.sql` had syntax issues that would fail on Supabase:

| Issue | Problem | Fix |
|-------|---------|-----|
| Multi-column ALTER | `ALTER TABLE ADD COLUMN col1, col2` | Split into separate ALTERs |
| Missing JSONB cast | `DEFAULT '[]'` | `DEFAULT '[]'::jsonb` |
| Function volatility | Functions default to VOLATILE | Mark as STABLE |
| Non-idempotent policies | Duplicate policy error on re-run | DROP POLICY IF EXISTS first |

### **Corrected Version Created**

**File**: `database-phase3-enhancements-CORRECTED.sql` (✅ Now copied to `database-phase3-enhancements.sql`)

**All fixes applied**:
- ✅ One column per ALTER statement
- ✅ Explicit `::jsonb` casts
- ✅ Functions marked `STABLE` (not `VOLATILE`)
- ✅ `DROP POLICY IF EXISTS` before `CREATE POLICY`
- ✅ No `NOW()` in index predicates
- ✅ All FK references use `public.users(id)` ✅

---

## 🎯 User Table Reference: Confirmed Usage

### **Correct (Used in ALL application tables)**
```sql
user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE
```

### **Incorrect (NEVER use this)**
```sql
user_id UUID NOT NULL REFERENCES auth.users(id) -- ❌ WRONG!
```

**Why?**
- `auth.users` is managed by Supabase Auth
- Application code should NEVER directly reference `auth.users`
- `public.users` is the application-facing profile table
- All RLS policies use `auth.uid()` which maps to `public.users.id`

---

## 📋 Verification Checklist

### Phase 2 Tables (Existing) ✅
All Phase 2 tables correctly reference `public.users(id)`:

| Table | FK Column | References | Status |
|-------|-----------|------------|--------|
| mood_checkins | user_id | public.users(id) | ✅ |
| conversations | user_id | public.users(id) | ✅ |
| messages | (via conversation) | public.users(id) | ✅ |
| journal_sessions | user_id | public.users(id) | ✅ |
| journal_entries | user_id | public.users(id) | ✅ |
| goals | user_id | public.users(id) | ✅ |
| goal_clarifications | user_id | public.users(id) | ✅ |
| weekly_actions | user_id | public.users(id) | ✅ |
| brain_exercises | user_id | public.users(id) | ✅ |
| narratives | user_id | public.users(id) | ✅ |
| future_me_exercises | user_id | public.users(id) | ✅ |
| memory_blocks | user_id | public.users(id) | ✅ |
| memory_relations | user_id | public.users(id) | ✅ |

### Phase 3 Core Tables ✅
```sql
-- events table
user_id UUID NOT NULL REFERENCES public.users(id) ✅

-- nudges table
user_id UUID NOT NULL REFERENCES public.users(id) ✅

-- user_feedback table
user_id UUID NOT NULL REFERENCES public.users(id) ✅

-- personalization_weights table
user_id UUID PRIMARY KEY REFERENCES public.users(id) ✅

-- insights_cache table
user_id UUID NOT NULL REFERENCES public.users(id) ✅
```

### Phase 3 P0 Enhancement Tables ✅
```sql
-- crisis_detections table
user_id UUID NOT NULL REFERENCES public.users(id) ✅

-- habit_anchors table
user_id UUID NOT NULL REFERENCES public.users(id) ✅

-- nudge_fatigue_log table
user_id UUID NOT NULL REFERENCES public.users(id) ✅
```

---

## 🚀 Migration Order (Correct Sequence)

### 1️⃣ Base Setup (If not already done)
```sql
-- Run ONCE at project start
-- File: database-setup.sql
-- Creates: auth.users → public.users structure
```

### 2️⃣ Phase 2 Tables
```sql
-- Run in Supabase SQL Editor
-- Files (order doesn't matter, all reference public.users):
- database-phase2-chat.sql
- database-phase2-journal.sql
- database-phase2-goals.sql
- database-phase2-tools.sql
- database-phase2-memory.sql
```

### 3️⃣ Phase 3 Core
```sql
-- Run AFTER Phase 2 complete
-- File: database-phase3-master-agent.sql (FIXED - no NOW() in index)
-- Creates: events, nudges, user_feedback, personalization_weights, insights_cache
```

### 4️⃣ Phase 3 P0 Enhancements
```sql
-- Run AFTER Phase 3 Core
-- File: database-phase3-enhancements.sql (NOW CORRECTED ✅)
-- Creates: crisis_detections, habit_anchors, nudge_fatigue_log
-- Alters: personalization_weights (adds 10 columns)
```

### 5️⃣ RLS Policies (Optional - if not in individual files)
```sql
-- Run AFTER all tables created
-- File: database-rls-policies.sql
-- Applies: Row Level Security policies to all tables
```

---

## ✅ Final Confirmation

### **Question: Do we use `public.users` or `auth.users`?**

**Answer**: **`public.users`** for ALL application table foreign keys.

**Summary Table**:

| Layer | Table | Purpose | FK References |
|-------|-------|---------|---------------|
| Auth | `auth.users` | Supabase authentication | N/A (base layer) |
| Profile | `public.users` | Extended user profile | `auth.users(id)` ↑ |
| Application | All other tables | App data (goals, chat, etc.) | `public.users(id)` ↑ |

**Visual Flow**:
```
User Signs Up
    ↓
auth.users row created (Supabase)
    ↓
Trigger: handle_new_user()
    ↓
public.users row created (our code)
    ↓
Application tables can now FK to public.users(id)
```

---

## 🎯 Ready for Migration

### Files Ready to Run (in order):

1. ✅ `database-phase3-master-agent.sql` (FIXED - no NOW() in index)
2. ✅ `database-phase3-enhancements.sql` (CORRECTED - all syntax issues fixed)

### Verification Commands:

```bash
# After running migrations, verify tables exist:
cd backend
node check-phase3-tables.js

# Expected output:
# ✅ events: Exists
# ✅ nudges: Exists
# ✅ user_feedback: Exists
# ✅ personalization_weights: Exists
# ✅ insights_cache: Exists
# ✅ crisis_detections: Exists
# ✅ habit_anchors: Exists
# ✅ nudge_fatigue_log: Exists
```

### SQL Verification (run in Supabase):

```sql
-- Check all Phase 3 tables reference public.users correctly
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN (
    'events', 'nudges', 'user_feedback', 'personalization_weights',
    'insights_cache', 'crisis_detections', 'habit_anchors', 'nudge_fatigue_log'
  )
  AND ccu.column_name = 'id'
ORDER BY tc.table_name;

-- Expected: All should show foreign_table_name = 'users' (public.users)
```

---

## 📚 References

| Document | Purpose |
|----------|---------|
| `DATABASE_SCHEMA_CONFIRMED.md` | This document (schema verification) |
| `DATABASE_MIGRATION_FIXED.md` | Phase 3 core SQL fixes (NOW() issue) |
| `PHASE3_P0_ENHANCEMENTS.md` | P0 enhancements implementation guide |
| `database-phase3-master-agent.sql` | Phase 3 core schema (5 tables) |
| `database-phase3-enhancements.sql` | Phase 3 P0 schema (3 tables + columns) |

---

## ✅ Status Summary

| Component | Status | Notes |
|-----------|--------|-------|
| User table structure | ✅ Confirmed | `auth.users` → `public.users` → app tables |
| Phase 2 FK references | ✅ Verified | All use `public.users(id)` |
| Phase 3 core FK references | ✅ Verified | All use `public.users(id)` |
| Phase 3 enhancements FK references | ✅ Corrected | Now uses `public.users(id)` |
| SQL syntax issues | ✅ Fixed | Multi-column ALTER, JSONB casts, etc. |
| Idempotency | ✅ Fixed | DROP IF EXISTS, IF NOT EXISTS |
| Ready for migration | ✅ Yes | Both SQL files ready to run |

---

**Date**: 2025-10-13
**Files Corrected**: 2 (phase3-master-agent.sql, phase3-enhancements.sql)
**Status**: ✅ Ready for Supabase SQL Editor execution
