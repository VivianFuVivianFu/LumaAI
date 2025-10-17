# Phase 2.5 - Stabilization & Testing Guide

## 🎯 Objective
Verify that all Phase 2 features work correctly before building additional features. This prevents wasting time building on a broken foundation.

---

## ⚠️ CRITICAL: Follow This Order

1. ✅ Database Migration
2. ✅ Backend Server Start
3. ✅ API Endpoint Testing
4. ✅ Memory Integration Testing
5. ✅ LangFuse Verification
6. ✅ Bug Fixes & Refinement
7. ✅ Frontend Connection (minimal)

**DO NOT skip steps or proceed out of order!**

---

## 📊 Step 1: Database Migration

### Prerequisites
- Supabase project created
- SQL Editor access
- All environment variables set

### Migration Order (MUST follow this sequence)

#### **1.1: Phase 1 - Foundation**
```sql
-- File: database-setup.sql
-- Run this FIRST
```

**What it creates:**
- `users` table
- `mood_checkins` table
- RLS policies
- Triggers for user profile creation

**Verification:**
```sql
-- Check tables exist
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'mood_checkins');

-- Check RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'mood_checkins');
```

#### **1.2: Enable pgvector Extension**
```sql
-- MUST do this BEFORE running database-phase2-memory.sql
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify
SELECT * FROM pg_extension WHERE extname = 'vector';
```

**⚠️ CRITICAL:** If pgvector extension fails:
- Check Supabase plan supports extensions
- May need to enable in Dashboard → Database → Extensions
- Contact Supabase support if unavailable

#### **1.3: Phase 2 - Chat**
```sql
-- File: database-phase2-chat.sql
```

**What it creates:**
- `conversations` table
- `messages` table
- RLS policies
- Indexes

**Verification:**
```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('conversations', 'messages');
```

#### **1.4: Phase 2 - Journal**
```sql
-- File: database-phase2-journal.sql
```

**What it creates:**
- `journal_sessions` table
- `journal_entries` table
- `journal_insights` table
- RLS policies
- Indexes

**Verification:**
```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('journal_sessions', 'journal_entries', 'journal_insights');
```

#### **1.5: Phase 2 - Goals**
```sql
-- File: database-phase2-goals.sql
```

**What it creates:**
- `goals` table
- `goal_clarifications` table
- `action_plans` table
- `milestones` table
- `weekly_actions` table
- `progress_reflections` table
- RLS policies
- Indexes

**Verification:**
```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('goals', 'goal_clarifications', 'action_plans', 'milestones', 'weekly_actions', 'progress_reflections');
```

#### **1.6: Phase 2 - Tools**
```sql
-- File: database-phase2-tools.sql
```

**What it creates:**
- `brain_exercises` table
- `narratives` table
- `future_me_exercises` table
- `tool_sessions` table
- RLS policies
- Indexes

**Verification:**
```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('brain_exercises', 'narratives', 'future_me_exercises', 'tool_sessions');
```

#### **1.7: Phase 2 - Memory**
```sql
-- File: database-phase2-memory.sql
-- Run LAST (depends on pgvector extension)
```

**What it creates:**
- `memory_blocks` table (with vector embeddings)
- `memory_relations` table
- `memory_ledger` table
- `memory_insights` table
- `user_memory_settings` table
- Vector similarity search functions
- RLS policies
- HNSW index for vector search

**Verification:**
```sql
-- Check tables
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'memory_%';

-- Check vector extension
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check vector column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'memory_blocks'
AND column_name = 'embedding';

-- Check functions exist
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('search_memory_blocks', 'get_related_blocks');
```

### Final Verification - All Tables
```sql
-- Should return 20 tables
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Expected tables:
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

---

## 🚀 Step 2: Backend Server Start

### 2.1: Environment Variables Check
```bash
# File: backend/.env

# Verify all variables are set
cat backend/.env

# Required variables:
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
LANGFUSE_SECRET_KEY=
LANGFUSE_PUBLIC_KEY=
LANGFUSE_HOST=https://cloud.langfuse.com
PORT=3001
NODE_ENV=development
```

### 2.2: Install Dependencies
```bash
cd backend
npm install
```

**Check for errors:**
- Missing dependencies
- Version conflicts
- TypeScript compilation errors

### 2.3: Build TypeScript
```bash
npm run build
```

**Expected output:**
- No TypeScript errors
- `dist/` folder created
- All `.ts` files compiled to `.js`

### 2.4: Start Development Server
```bash
npm run dev
```

**Expected output:**
```
Server running on port 3001
Supabase connected
LangFuse initialized
```

**Check for errors:**
- Port conflicts (kill process on 3001 if needed)
- Database connection errors
- Missing environment variables
- Module import errors

### 2.5: Verify Health Check
```bash
curl http://localhost:3001/api/health
```

**Expected response:**
```json
{
  "success": true,
  "message": "Luma API is running",
  "timestamp": "2025-01-xx..."
}
```

---

## 🧪 Step 3: API Endpoint Testing

### 3.1: Setup Testing Tool
**Recommended:** Postman or Insomnia

**Base URL:** `http://localhost:3001/api`

### 3.2: Authentication Flow Test

#### **Test 1: Register New User**
```
POST /api/auth/register

Body (JSON):
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "TestPassword123!"
}

Expected Response (201):
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": { "id": "...", "email": "...", "name": "..." },
    "session": { "access_token": "...", "refresh_token": "..." }
  }
}
```

**⚠️ SAVE THE ACCESS TOKEN - You'll need it for all other requests!**

#### **Test 2: Login**
```
POST /api/auth/login

Body (JSON):
{
  "email": "test@example.com",
  "password": "TestPassword123!"
}

Expected Response (200):
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "session": { "access_token": "...", ... }
  }
}
```

#### **Test 3: Get Current User**
```
GET /api/auth/me

Headers:
Authorization: Bearer <access_token>

Expected Response (200):
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "name": "..." }
  }
}
```

### 3.3: Dashboard / Mood Check-in Test

#### **Test 4: Submit Mood Check-in**
```
POST /api/dashboard/mood

Headers:
Authorization: Bearer <access_token>

Body (JSON):
{
  "mood_value": 4,
  "notes": "Feeling good today!"
}

Expected Response (201):
{
  "success": true,
  "message": "Mood check-in saved",
  "data": {
    "mood_checkin": { "id": "...", "mood_value": 4, ... }
  }
}
```

#### **Test 5: Get Dashboard Stats**
```
GET /api/dashboard/stats

Headers:
Authorization: Bearer <access_token>

Expected Response (200):
{
  "success": true,
  "data": {
    "stats": {
      "totalMoodCheckins": 1,
      "averageMood": 4,
      "currentStreak": 1,
      ...
    }
  }
}
```

### 3.4: Chat Feature Tests

#### **Test 6: Create Conversation**
```
POST /api/chat/conversations

Headers:
Authorization: Bearer <access_token>

Body (JSON):
{
  "title": "My First Chat"
}

Expected Response (201):
{
  "success": true,
  "data": {
    "conversation": { "id": "...", "title": "My First Chat", ... }
  }
}
```

**⚠️ SAVE THE CONVERSATION ID**

#### **Test 7: Send Message**
```
POST /api/chat/conversations/{conversation_id}/messages

Headers:
Authorization: Bearer <access_token>

Body (JSON):
{
  "message": "Hello Luma, how are you today?"
}

Expected Response (201):
{
  "success": true,
  "data": {
    "userMessage": { "id": "...", "content": "Hello Luma...", "role": "user" },
    "assistantMessage": { "id": "...", "content": "...", "role": "assistant" }
  }
}
```

**Verify:**
- Assistant response is coherent
- Response reflects Luma's personality (calm, supportive)
- No errors from OpenAI API
- Message saved to database

#### **Test 8: Get Conversation**
```
GET /api/chat/conversations/{conversation_id}

Headers:
Authorization: Bearer <access_token>

Expected Response (200):
{
  "success": true,
  "data": {
    "conversation": { ... },
    "messages": [ ... ]
  }
}
```

### 3.5: Journal Feature Tests

#### **Test 9: Create Journal Session**
```
POST /api/journal/sessions

Headers:
Authorization: Bearer <access_token>

Body (JSON):
{
  "mode": "present-virtues",
  "title": "Reflecting on my strengths"
}

Expected Response (201):
{
  "success": true,
  "data": {
    "session": { "id": "...", "mode": "present-virtues", ... },
    "initialPrompt": "..."
  }
}
```

**⚠️ SAVE THE SESSION ID**

#### **Test 10: Create Journal Entry**
```
POST /api/journal/sessions/{session_id}/entries

Headers:
Authorization: Bearer <access_token>

Body (JSON):
{
  "content": "Today I realize I'm really good at problem-solving. When challenges come up at work, I stay calm and think through solutions methodically. This has helped my team many times."
}

Expected Response (201):
{
  "success": true,
  "data": {
    "entry": { "id": "...", "content": "...", ... },
    "insight": {
      "insight_text": "...",
      "articulation_score": 0.85,
      "coherence_score": 0.90,
      "emotional_tone": "confident",
      "themes": ["problem-solving", "calm", "teamwork"],
      ...
    }
  }
}
```

**Verify:**
- AI insight is relevant and supportive
- Metadata extracted (scores, themes, emotional_tone)
- No crisis flags (unless content warrants it)

### 3.6: Goals Feature Tests

#### **Test 11: Create Goal**
```
POST /api/goals

Headers:
Authorization: Bearer <access_token>

Body (JSON):
{
  "title": "Learn Spanish",
  "description": "I want to become conversational in Spanish for travel",
  "category": "personal-growth",
  "timeframe": "6-months"
}

Expected Response (201):
{
  "success": true,
  "data": {
    "goal": { "id": "...", "title": "Learn Spanish", ... },
    "clarifications": [
      { "question": "How many hours per week can you dedicate to learning Spanish?", ... },
      { "question": "Do you have any Spanish learning experience?", ... },
      ...
    ]
  }
}
```

**⚠️ SAVE THE GOAL ID**

#### **Test 12: Submit Clarifications**
```
POST /api/goals/{goal_id}/clarifications

Headers:
Authorization: Bearer <access_token>

Body (JSON):
{
  "answers": [
    {
      "question_id": "...",
      "answer": "I can dedicate about 5 hours per week, mostly on weekends"
    },
    {
      "question_id": "...",
      "answer": "Complete beginner, but I know a few basic phrases"
    },
    ...
  ]
}

Expected Response (201):
{
  "success": true,
  "data": {
    "actionPlan": {
      "smart_statement": "...",
      "total_sprints": 9,
      "milestones": [ ... ],
      "weeklyActions": [ ... ]
    }
  }
}
```

**Verify:**
- SMART statement is specific and realistic
- 9 sprints generated (for 6-month timeframe)
- Weekly actions are concrete and achievable

### 3.7: Tools Feature Tests

#### **Test 13: Create Brain Exercise (Empower My Brain)**
```
POST /api/tools/brain

Headers:
Authorization: Bearer <access_token>

Body (JSON):
{
  "context_description": "I keep thinking I'm not good enough for my job and that I'll be found out as a fraud",
  "original_thought": "I'm a fraud and everyone will realize it soon"
}

Expected Response (201):
{
  "success": true,
  "data": {
    "exercise": {
      "title": "...",
      "reframe": "...",
      "micro_action": "...",
      "why_it_helps": "...",
      ...
    },
    "steps": [ ... ]
  }
}
```

**Verify:**
- Reframe is ≤20 words
- Reframe is kinder and realistic
- Micro-action is specific (1-2 min)

#### **Test 14: Create Narrative (My New Narrative)**
```
POST /api/tools/narrative

Headers:
Authorization: Bearer <access_token>

Body (JSON):
{
  "context_description": "I've been feeling stuck since losing my job last year. I used to be so confident but now I doubt everything."
}

Expected Response (201):
{
  "success": true,
  "data": {
    "narrative": {
      "title": "...",
      "chapter_past": "...",
      "chapter_present": "...",
      "chapter_future": "...",
      "future_choice": "...",
      ...
    }
  }
}
```

**Verify:**
- Each chapter is 3-5 sentences
- Future choice is ≤12 words
- Tone is empowering and compassionate

#### **Test 15: Create Future Me Exercise**
```
POST /api/tools/future-me

Headers:
Authorization: Bearer <access_token>

Body (JSON):
{
  "goal_or_theme": "I want to feel confident speaking up in meetings"
}

Expected Response (201):
{
  "success": true,
  "data": {
    "exercise": {
      "visualization_script": "...",
      "affirmation_1": "...",
      "affirmation_2": "...",
      "affirmation_3": "...",
      "if_then_anchor": "...",
      ...
    }
  }
}
```

**Verify:**
- Visualization ≤160 words
- Each affirmation ≤12 words
- If-Then anchor is specific

---

## 🧠 Step 4: Memory Integration Testing

### 4.1: Verify Memory Ingestion

After completing Tests 7, 10, 12, 13, 14, 15, check if memory blocks were created:

```
GET /api/memory/blocks

Headers:
Authorization: Bearer <access_token>

Expected Response (200):
{
  "success": true,
  "data": {
    "blocks": [
      { "block_type": "chat_message", "content_text": "Hello Luma...", ... },
      { "block_type": "journal_entry", "content_text": "Today I realize...", ... },
      { "block_type": "goal", "content_text": "Goal: Learn Spanish...", ... },
      { "block_type": "exercise", "content_text": "Empower My Brain: ...", ... },
      ...
    ],
    "count": 6+
  }
}
```

**⚠️ CRITICAL:** If no blocks appear, memory ingestion is broken!

### 4.2: Test Semantic Search

```
POST /api/memory/search

Headers:
Authorization: Bearer <access_token>

Body (JSON):
{
  "query": "confidence and self-worth",
  "limit": 5
}

Expected Response (200):
{
  "success": true,
  "data": {
    "results": {
      "context_bullets": [ ... ],
      "key_themes": [ ... ]
    }
  }
}
```

**Verify:**
- Relevant blocks are returned
- Results relate to "confidence and self-worth"
- Similarity scores make sense

### 4.3: Test Memory Settings

```
GET /api/memory/settings

Headers:
Authorization: Bearer <access_token>

Expected Response (200):
{
  "success": true,
  "data": {
    "settings": {
      "memory_enabled": true,
      "chat_memory_enabled": true,
      ...
    }
  }
}
```

### 4.4: Test Memory Explainability

Get a block ID from Step 4.1, then:

```
GET /api/memory/blocks/{block_id}/explain

Headers:
Authorization: Bearer <access_token>

Expected Response (200):
{
  "success": true,
  "data": {
    "explanation": {
      "why_remembered": { ... },
      "why_retrieved": { ... }
    }
  }
}
```

---

## 📊 Step 5: LangFuse Verification

### 5.1: Check LangFuse Dashboard

1. Go to https://cloud.langfuse.com
2. Login to your project
3. Navigate to "Traces" section

**Expected:**
- Traces for Chat, Journal, Goals, Tools, Memory operations
- Token usage recorded
- Model versions tracked
- Timestamps accurate

### 5.2: Verify Trace Details

Click on any trace and verify:
- ✅ Trace name is descriptive
- ✅ User ID is present
- ✅ Generation spans exist
- ✅ Input/output captured
- ✅ Token usage recorded (input, output, total)
- ✅ Latency metrics present

### 5.3: Test Cost Tracking

In LangFuse dashboard:
- Check "Usage" or "Costs" section
- Verify costs are being calculated
- Confirm costs match your OpenAI usage

---

## 🐛 Step 6: Bug Fixes & Known Issues

### Common Issues & Solutions

#### **Issue 1: Database Migration Fails**
**Symptom:** SQL errors when running migrations
**Solutions:**
- Check if pgvector extension is enabled
- Verify RLS is supported on your Supabase plan
- Run migrations in correct order (see Step 1)
- Check for typos in SQL files

#### **Issue 2: Memory Blocks Not Created**
**Symptom:** `/api/memory/blocks` returns empty array
**Solutions:**
- Check `user_memory_settings.memory_enabled = true`
- Verify `memoryService.ingestBlock()` is being called
- Check console logs for errors during ingestion
- Verify OpenAI embeddings API is working

#### **Issue 3: Vector Search Returns No Results**
**Symptom:** Semantic search finds nothing
**Solutions:**
- Verify embeddings were generated (check `embedding` column)
- Check similarity threshold (try lowering to 0.5)
- Ensure pgvector HNSW index was created
- Test with more obvious queries

#### **Issue 4: OpenAI API Errors**
**Symptom:** 429 (rate limit) or 401 (invalid key)
**Solutions:**
- Verify `OPENAI_API_KEY` is correct
- Check OpenAI account has credits
- Implement retry logic for rate limits
- Consider using `gpt-3.5-turbo` for testing (cheaper)

#### **Issue 5: LangFuse Traces Not Appearing**
**Symptom:** Dashboard shows no traces
**Solutions:**
- Verify credentials are correct
- Check `langfuseService.flush()` is called periodically
- Wait 30-60 seconds (traces may be delayed)
- Check LangFuse console for errors

#### **Issue 6: RLS Policy Blocks Requests**
**Symptom:** `PGRST301` or permission errors
**Solutions:**
- Verify JWT token is valid
- Check RLS policies use `auth.uid()`
- Test with service role key (bypasses RLS) to isolate issue
- Ensure user ID matches `auth.uid()`

---

## 📝 Step 7: Test Data Creation

### Create Diverse Test Data

**Goal:** Generate realistic data for each feature

#### **7.1: Create Multiple Users**
- Register 3-5 test users
- Different personas (e.g., anxious user, goal-oriented user, reflective user)

#### **7.2: Create Varied Content**
- **Chat:** 10+ conversations with different topics
- **Journal:** 5+ sessions in different modes
- **Goals:** 3+ goals in different categories
- **Tools:** 5+ exercises across all three tools

#### **7.3: Generate Memory Blocks**
- Aim for 20+ memory blocks total
- Mix of different block types
- Test semantic search with various queries

---

## ✅ Step 8: Success Criteria

**Phase 2.5 is complete when:**

- [ ] All 6 SQL files run without errors
- [ ] pgvector extension works
- [ ] Backend server starts without errors
- [ ] All 15+ API tests pass
- [ ] Memory ingestion works (blocks created automatically)
- [ ] Semantic search returns relevant results
- [ ] LangFuse traces appear in dashboard
- [ ] No critical bugs found
- [ ] Test data created for all features

**Once ALL criteria are met, you can proceed to Phase 3 (Enhanced Observability)**

---

## 🚫 DO NOT Proceed to Phase 3 If:

- Database migrations fail
- Memory ingestion broken
- More than 2-3 API tests fail
- LangFuse traces not appearing
- Critical bugs found

**Fix issues first!** Building on a broken foundation wastes time.

---

## 📞 Support

**If stuck:**
1. Check console logs (backend and browser)
2. Review Supabase logs (Dashboard → Logs)
3. Check LangFuse traces for errors
4. Review this guide's "Common Issues" section
5. Test with simpler inputs (isolated testing)

**Good luck with testing! 🚀**
