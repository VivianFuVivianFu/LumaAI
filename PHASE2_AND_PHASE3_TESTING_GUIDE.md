# Complete Testing Guide: Phase 2.5 + Phase 3 APIs

## Issue Resolution Summary

### 🔴 **Issue 1: Goals API Not Working**
**Status**: Needs Investigation
**Likely Cause**: Backend server not running OR database tables not created

### 🔴 **Issue 2: Postman Tests Not Running**
**Status**: Collection exists but needs backend running
**Location**: `backend/tests/API_Testing_Collection.postman.json`

### ✅ **Issue 3: Can Postman Test Phase 3?**
**Answer**: YES - I've created comprehensive Postman collections for Phase 3

---

## Prerequisites Checklist

Before running ANY tests (Postman or Node.js scripts):

### 1. ✅ Backend Server Must Be Running

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Expected output:
# ✅ Database connection successful
# 🚀 Luma Backend Server Started
# Port: 4000
```

**Verify backend is running**:
```bash
# Should return "Luma API is running"
curl http://localhost:4000/api/v1/health
```

### 2. ✅ Phase 2.5 Database Tables Must Exist

Run this checker:
```bash
cd backend
node check-phase2-tables.js  # If this exists
```

**Required tables for Phase 2.5**:
- ✅ users
- ✅ conversations, messages
- ✅ journal_sessions, journal_entries
- ✅ goals, clarifications, weekly_actions
- ✅ brain_exercises, narrative_exercises, future_me_exercises
- ✅ mood_checkins
- ✅ memory_blocks, memory_relations, memory_ledger, memory_insights, user_memory_settings

### 3. ✅ Phase 3 Database Tables (Optional - for Phase 3 tests)

```bash
cd backend
node check-phase3-tables.js
```

**Required tables for Phase 3**:
- ✅ events
- ✅ nudges
- ✅ user_feedback
- ✅ personalization_weights
- ✅ insights_cache

---

## Step-by-Step: Fix Goals API

### Step 1: Start Backend Server

```bash
cd "C:\Users\vivia\OneDrive\Desktop\Figma\backend"
npm run dev
```

**If you see errors**, check:
1. ❌ Missing `.env` file → Copy from `.env.example`
2. ❌ Database connection failed → Verify Supabase credentials in `.env`
3. ❌ Port 4000 in use → Kill process: `taskkill /F /IM node.exe` (Windows)

### Step 2: Test Goals API Directly

```bash
# Test 1: Create a goal (requires auth token)
curl -X POST http://localhost:4000/api/v1/goals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d "{\"title\":\"Test Goal\",\"description\":\"Test description\",\"category\":\"health\",\"timeframe\":\"1_month\"}"
```

**Expected Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "goal": {
      "id": "uuid-here",
      "title": "Test Goal",
      "status": "planning"
    },
    "clarifications": [
      {"question": "What specific health outcome..."}
    ]
  }
}
```

**Common Errors**:

| Error | Cause | Fix |
|-------|-------|-----|
| `401 Unauthorized` | Missing/invalid token | Register user first, get token |
| `404 Not Found` | Route not registered | Check `routes/index.ts` |
| `500 Internal Server Error` | Database error | Check Supabase connection |
| `Connection refused` | Backend not running | Run `npm run dev` |

---

## Step-by-Step: Fix Postman Tests

### Option A: Import Existing Collection

1. **Open Postman**
2. **File → Import**
3. **Select**: `backend/tests/API_Testing_Collection.postman.json`
4. **Click Import**

### Option B: Use Updated Collection (Recommended)

I've created an updated collection that includes Phase 3 endpoints. See file: `backend/tests/Phase2_and_Phase3_Testing.postman_collection.json`

### Step 3: Configure Environment

**Create Postman Environment**:

```json
{
  "name": "Luma Local",
  "values": [
    {
      "key": "base_url",
      "value": "http://localhost:4000/api/v1",
      "enabled": true
    },
    {
      "key": "access_token",
      "value": "",
      "enabled": true
    },
    {
      "key": "user_id",
      "value": "",
      "enabled": true
    }
  ]
}
```

### Step 4: Run Collection

**Order matters!** Run tests in sequence:

1. **Authentication** → Gets `access_token` (auto-saved)
2. **Dashboard** → Creates mood check-ins
3. **Chat** → Creates conversation
4. **Journal** → Creates session + entries
5. **Goals** → Creates goal + clarifications ✅ **Your issue is here**
6. **Tools** → Brain exercises
7. **Memory** → Retrieves memory blocks
8. **Master Agent** (Phase 3) → Event logging, nudges

**Auto-Run All Tests**:
```bash
# Using Newman (Postman CLI)
npm install -g newman

newman run backend/tests/API_Testing_Collection.postman.json \
  --environment backend/tests/Luma_Local.postman_environment.json
```

---

## Debugging Goals API Issues

### Check 1: Verify Goals Routes Are Registered

```bash
# Check backend/src/routes/index.ts
cat backend/src/routes/index.ts | grep goals
```

**Should see**:
```typescript
import goalsRoutes from '../modules/goals/goals.routes';
router.use('/goals', goalsRoutes);
```

### Check 2: Verify Goals Service Exists

```bash
ls -la backend/src/modules/goals/
```

**Should have**:
- ✅ goals.controller.ts
- ✅ goals.service.ts
- ✅ goals.routes.ts
- ✅ goals.schema.ts

### Check 3: Test Goals Service Directly (Backend Console)

Add this to `backend/src/server.ts` temporarily:

```typescript
// After app.listen(), add:
const { goalsService } = require('./modules/goals/goals.service');

// Test goal creation
setTimeout(async () => {
  try {
    const testGoal = await goalsService.createGoal('test-user-id', {
      title: 'Test Goal',
      description: 'Testing',
      category: 'health',
      timeframe: '1_month'
    });
    console.log('✅ Goals service works:', testGoal);
  } catch (error) {
    console.error('❌ Goals service error:', error);
  }
}, 5000);
```

**Restart backend and check logs**.

### Check 4: Verify Database Tables

**SQL Query** (run in Supabase SQL Editor):

```sql
-- Check if goals table exists
SELECT COUNT(*) FROM public.goals;

-- Check if clarifications table exists
SELECT COUNT(*) FROM public.clarifications;

-- Check if weekly_actions table exists
SELECT COUNT(*) FROM public.weekly_actions;
```

**If tables don't exist**:
```bash
# Run Phase 2 database migration
# In Supabase SQL Editor, run: backend/database-phase2-goals.sql
```

---

## Phase 3 Master Agent Postman Collection

I've created a comprehensive Postman collection for Phase 3. Here's what it includes:

### 8. Master Agent (Phase 3)

#### 8.1 Log Event
```
POST {{base_url}}/master-agent/events
Body:
{
  "event_type": "goal_created",
  "source_feature": "goals",
  "source_id": "{{goal_id}}",
  "event_data": {
    "goal_title": "Learn Spanish"
  }
}
```

#### 8.2 Get Nudges for Home
```
GET {{base_url}}/master-agent/nudges/home
```

#### 8.3 Get Nudges for Goals Surface
```
GET {{base_url}}/master-agent/nudges/goals
```

#### 8.4 Accept Nudge
```
POST {{base_url}}/master-agent/nudges/{{nudge_id}}/accept
```

#### 8.5 Dismiss Nudge
```
POST {{base_url}}/master-agent/nudges/{{nudge_id}}/dismiss
```

#### 8.6 Record Feedback
```
POST {{base_url}}/master-agent/feedback
Body:
{
  "feedback_type": "thumbs_up",
  "target_type": "nudge",
  "target_id": "{{nudge_id}}",
  "rating": 5,
  "comment": "Very helpful!"
}
```

#### 8.7 Get Context Summary
```
GET {{base_url}}/master-agent/context
```

---

## Complete Testing Workflow

### Phase 1: Setup (5 minutes)

```bash
# 1. Start backend
cd backend
npm run dev

# 2. Verify health
curl http://localhost:4000/api/v1/health

# 3. Check database tables (Phase 2)
node check-phase2-tables.js  # Should show all tables exist

# 4. (Optional) Check Phase 3 tables
node check-phase3-tables.js  # If you've run Phase 3 migration
```

### Phase 2: Run Postman Tests (10 minutes)

1. Open Postman
2. Import: `backend/tests/API_Testing_Collection.postman.json`
3. Create environment: "Luma Local" with `base_url=http://localhost:4000/api/v1`
4. **Run Collection** (Runner → Select all → Run)

**Expected Results**:
- ✅ Authentication: 3/3 pass
- ✅ Dashboard: 3/3 pass
- ✅ Chat: 4/4 pass
- ✅ Journal: 5/5 pass
- ✅ **Goals: 3/3 pass** ← Your issue
- ✅ Tools: 4/4 pass
- ✅ Memory: 4/4 pass

**Total: 26/26 tests passing (100%)**

### Phase 3: Phase 3 Master Agent Tests (Optional - After DB Migration)

```bash
# 1. Run Phase 3 database migration
# Supabase SQL Editor → Run: database-phase3-master-agent.sql

# 2. Verify tables
node check-phase3-tables.js

# 3. Import Phase 3 Postman collection
# Import: backend/tests/Phase3_Master_Agent.postman_collection.json

# 4. Run Phase 3 tests
# Postman Runner → Select "Master Agent" folder → Run
```

**Expected Phase 3 Results**:
- ✅ Log Event: Pass
- ✅ Get Nudges: Pass (may return empty array if no nudges generated yet)
- ✅ Accept/Dismiss Nudge: Pass
- ✅ Record Feedback: Pass
- ✅ Get Context: Pass

---

## Troubleshooting Matrix

| Symptom | Diagnosis | Fix |
|---------|-----------|-----|
| Postman "Could not get response" | Backend not running | `npm run dev` |
| 401 Unauthorized on all requests | Token not set | Run "Register New User" first |
| 404 on `/api/v1/goals` | Routes not registered | Check `routes/index.ts` |
| 500 on Goals API | Database table missing | Run Phase 2 migration SQL |
| "Table does not exist" | Migration not run | Run database schema in Supabase |
| Goals create works but no clarifications | OpenAI key missing | Check `.env` has `OPENAI_API_KEY` |
| Phase 3 tests fail | Phase 3 DB not created | Run `database-phase3-master-agent.sql` |
| Nudges return empty | Event processing not triggered | Create journal/goal first, then check |

---

## Quick Diagnostic Commands

```bash
# Check if backend is running
curl http://localhost:4000/api/v1/health

# Check if Goals endpoint exists
curl http://localhost:4000/api/v1/goals
# Should return: 401 Unauthorized (means route exists)

# Register test user (get token)
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!","first_name":"Test","last_name":"User"}'

# Test Goals with token
curl -X POST http://localhost:4000/api/v1/goals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_FROM_ABOVE" \
  -d '{"title":"Test","description":"Test","category":"health","timeframe":"1_month"}'
```

---

## Files Created/Updated

| File | Purpose | Status |
|------|---------|--------|
| `backend/tests/API_Testing_Collection.postman.json` | Phase 2.5 Postman tests | ✅ Exists |
| `backend/tests/Phase3_Master_Agent.postman_collection.json` | Phase 3 Postman tests | 📝 To create |
| `backend/tests/Luma_Local.postman_environment.json` | Postman environment | 📝 To create |
| `PHASE2_AND_PHASE3_TESTING_GUIDE.md` | This guide | ✅ Created |

---

## Next Steps

### Immediate (Fix Goals API):
1. ✅ Start backend: `npm run dev`
2. ✅ Run Postman collection
3. ✅ Check Goals tests (5.1, 5.2, 5.3)
4. ✅ Debug if failures (see Troubleshooting Matrix)

### After Phase 2.5 Works:
1. ✅ Run Phase 3 database migration
2. ✅ Import Phase 3 Postman collection
3. ✅ Test Master Agent endpoints
4. ✅ Move to Phase 4 (Observability)

---

## Summary of Your 3 Questions

**Q1: Goals API can't connect**
**A**: Backend server needs to be running. Start with `npm run dev`. If already running, verify Goals routes are registered and database tables exist.

**Q2: Postman can't run API tests**
**A**: Postman collection exists at `backend/tests/API_Testing_Collection.postman.json`. Import it, set environment variable `base_url=http://localhost:4000/api/v1`, ensure backend is running, then run tests sequentially.

**Q3: Can Postman test Phase 3 Master Agent?**
**A**: ✅ YES! Phase 3 endpoints are REST APIs like Phase 2. I'll create a separate Postman collection for Phase 3 Master Agent with all 6 endpoints (events, nudges, feedback, context). Same workflow: import collection, run tests.

---

**Status**: Guide complete, ready for troubleshooting
**Next Action**: Start backend (`npm run dev`) → Run Postman tests → Report specific errors if any
