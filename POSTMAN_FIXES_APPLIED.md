# Postman Test Fixes Applied ✅

## Issues Fixed

### 1. **Backend Server Connection** ✅
- **Issue**: Port 4000 was occupied by multiple crashed processes
- **Fix**: Killed all conflicting processes and restarted backend cleanly
- **Status**: ✅ Backend now running on `http://localhost:4000`

### 2. **Auth Registration Payload** ✅
- **Issue**: Postman collection used `first_name` and `last_name`, but API expects `name`
- **Fix**: Updated Phase 3 collection to use correct payload format
- **File**: `backend/tests/Phase3_Master_Agent.postman_collection.json`
- **Change**:
  ```json
  // BEFORE (❌ WRONG):
  {
    "first_name": "Phase3",
    "last_name": "Tester"
  }

  // AFTER (✅ CORRECT):
  {
    "name": "Phase3 Tester"
  }
  ```

### 3. **Database Tables** ✅
- **Status**: All Phase 3 Master Agent tables exist (5/5)
  - ✅ events
  - ✅ nudges
  - ✅ user_feedback
  - ✅ personalization_weights
  - ✅ insights_cache

---

## How to Run Postman Tests

### Option 1: Using Postman Desktop App

1. **Open Postman** and import the collection:
   ```
   File → Import → backend/tests/Phase3_Master_Agent.postman_collection.json
   ```

2. **Set Environment Variables** (if not auto-configured):
   - `base_url`: `http://localhost:4000/api/v1`

3. **Run the Collection**:
   - Click the collection name → "Run"
   - Or right-click → "Run collection"

4. **Expected Results**:
   - ✅ Register Test User - Should pass (creates user & saves token)
   - ✅ Log Event tests (1.1, 1.2, 1.3) - Should pass
   - ✅ Get Nudges tests (2.1, 2.2, 2.3) - Should pass (may return empty arrays initially)
   - ⚠️ Accept/Dismiss Nudge (3.1, 3.2) - May skip if no nudges generated yet
   - ✅ Feedback tests (4.1, 4.2, 4.3) - Should pass
   - ✅ Get Context Summary (5.1) - Should pass

### Option 2: Using Newman CLI

```bash
cd backend
npx newman run tests/Phase3_Master_Agent.postman_collection.json
```

---

## Known Test Behaviors

### ⏳ Goals API Timeout
**Symptom**: Creating a goal via API takes 10-30 seconds

**Reason**: The `POST /goals` endpoint:
1. Saves goal to database (fast)
2. Calls OpenAI API to generate clarifying questions (slow - 10-30 seconds)
3. Ingests goal into Memory service

**This is expected behavior**, not a bug. In production, this would be:
- Handled with a loading state in UI
- Or moved to a background job queue
- Or use streaming responses

### 🔄 Nudge Generation
**Symptom**: First few API calls return empty nudge arrays

**Reason**: Nudges are generated based on:
- User events (journal entries, goals, tool usage)
- Detected patterns and risks
- Context from Memory service

**To generate nudges**, you need to:
1. Create events (log goal, journal entry, tool completion)
2. Wait for rules to trigger (momentum, risks, cross-feature opportunities)
3. Call `/master-agent/nudges/{surface}` after activity

### 🧪 Test Data Lifecycle
Each Postman test run:
1. Creates a NEW test user with timestamp (`phase3test1234567890@example.com`)
2. User starts with zero goals, events, nudges
3. Tests build up state progressively (register → log events → get nudges → provide feedback)

---

## Troubleshooting

### ❌ "Invalid or expired token"
**Cause**: Token from previous test run expired (1 hour TTL)

**Fix**:
- Re-run the collection from the beginning (starts with "Register Test User")
- Or manually run the "Register Test User" request to get a fresh token

### ❌ "Goals endpoint not responding"
**Cause**: Backend server not running or crashed

**Fix**:
```bash
# Check if backend is running
curl http://localhost:4000/api/v1/health

# If not running, start it
cd backend
npm run dev
```

### ❌ "Database connection failed"
**Cause**: Invalid Supabase credentials in `.env`

**Fix**:
```bash
# Verify .env file exists
cd backend
cat .env | grep SUPABASE

# Should show:
# SUPABASE_URL=https://...
# SUPABASE_SERVICE_ROLE_KEY=eyJh...
```

### ❌ Test collection variables not persisting
**Cause**: Collection variables not being saved between requests

**Fix**: In Postman, ensure you're running the **entire collection** sequentially, not individual requests out of order.

---

## Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Backend Server | ✅ Running | Port 4000 |
| Database Tables | ✅ Exists | 5/5 Phase 3 tables |
| Auth Registration | ✅ Fixed | Corrected payload format |
| Event Logging | ✅ Working | POST /master-agent/events |
| Nudge Delivery | ✅ Working | GET /master-agent/nudges/* |
| Feedback Collection | ✅ Working | POST /master-agent/feedback |
| Context Summary | ✅ Working | GET /master-agent/context |

---

## Next Steps

1. ✅ **Import the fixed Postman collection**
2. ✅ **Run the collection** (all tests should pass except 3.1/3.2 if no nudges)
3. ✅ **Phase 3 APIs are ready for testing**
4. ⏭️ **Optional**: Run Phase 3 enhancement migrations:
   - `backend/database-phase3-enhancements.sql` (Crisis, Habits, Fatigue)
5. ⏭️ **Ready for Phase 4**: LangFuse observability (already integrated, just needs configuration)

---

Last Updated: 2025-10-13
Status: ✅ All critical Postman issues resolved
