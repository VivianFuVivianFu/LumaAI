# Quick Start: Testing Phase 2 & Phase 3 APIs

## ⚡ TL;DR - 3 Steps to Test Everything

```bash
# Step 1: Start backend (REQUIRED)
cd backend
npm run dev

# Step 2: Import Postman collections
# - Phase 2.5: backend/tests/API_Testing_Collection.postman.json
# - Phase 3: backend/tests/Phase3_Master_Agent.postman_collection.json

# Step 3: Run tests in Postman
# (Backend must be running!)
```

---

## 🔴 Your 3 Issues - Resolved

### 1️⃣ **Goals API Not Working**

**Root Cause**: Backend server not running

**Fix**:
```bash
cd "C:\Users\vivia\OneDrive\Desktop\Figma\backend"
npm run dev
```

**Verify it's working**:
```bash
curl http://localhost:4000/api/v1/health
# Should return: {"success":true,"message":"Luma API is running"}
```

**If backend won't start**:
- Check `.env` file exists (copy from `.env.example`)
- Verify Supabase credentials are correct
- Kill existing Node processes: `taskkill /F /IM node.exe` (Windows)

---

### 2️⃣ **Postman Tests Not Running**

**Root Cause**: Need to import collection + backend must be running

**Fix**:

**Option A: Using Postman UI** (Recommended)
1. Open Postman
2. **File → Import**
3. Select: `backend/tests/API_Testing_Collection.postman.json`
4. Create environment:
   - Name: `Luma Local`
   - Variable: `base_url` = `http://localhost:4000/api/v1`
5. Select "Luma Local" environment (top right dropdown)
6. **Run Collection**:
   - Click "..." next to collection name
   - Select "Run collection"
   - Click "Run Luma API - Phase 2.5 Testing"

**Expected Result**: 26/26 tests passing ✅

**Option B: Using Newman (CLI)**
```bash
npm install -g newman
newman run backend/tests/API_Testing_Collection.postman.json
```

---

### 3️⃣ **Can Postman Test Phase 3 Master Agent?**

**Answer**: ✅ **YES!** I've created a complete Postman collection.

**File**: `backend/tests/Phase3_Master_Agent.postman_collection.json`

**Prerequisites**:
1. ✅ Backend running (`npm run dev`)
2. ✅ Phase 3 database tables created (run migration in Supabase)

**Import & Run**:
1. Import `Phase3_Master_Agent.postman_collection.json` to Postman
2. Use same environment (`base_url=http://localhost:4000/api/v1`)
3. Run collection (tests run in order)

**What it tests**:
- ✅ Event logging (3 events)
- ✅ Nudge retrieval (3 surfaces: home, goals, journal)
- ✅ Nudge interactions (accept, dismiss)
- ✅ Feedback collection (thumbs up, ratings, helpful)
- ✅ Context summary (debug view)

**Expected Result**: 10-13 tests passing (some may be skipped if no nudges generated yet)

---

## 📋 Prerequisites Checklist

Before running ANY tests:

| Requirement | Check | How to Fix |
|-------------|-------|------------|
| Backend running | `curl http://localhost:4000/api/v1/health` | `npm run dev` |
| Phase 2 DB tables | `node check-phase2-tables.js` | Run SQL in Supabase |
| Phase 3 DB tables (optional) | `node check-phase3-tables.js` | Run Phase 3 migration |
| Postman installed | Open Postman app | Download from postman.com |
| Collections imported | See in Postman sidebar | File → Import |

---

## 🎯 Recommended Testing Flow

### Phase 2.5 Testing (Required - 10 minutes)

```
1. Start backend → npm run dev
2. Import Phase 2.5 collection
3. Run tests in Postman:
   ✅ 1. Authentication (3 tests) ← Gets auth token
   ✅ 2. Dashboard (3 tests)
   ✅ 3. Chat (4 tests)
   ✅ 4. Journal (5 tests)
   ✅ 5. Goals (3 tests) ← YOUR ISSUE HERE
   ✅ 6. Tools (4 tests)
   ✅ 7. Memory (4 tests)

Total: 26 tests → Should be 26/26 passing
```

**If Goals tests fail**:
1. Check backend logs for errors
2. Verify `goals` table exists in Supabase
3. Ensure OpenAI API key is in `.env`
4. See full troubleshooting: `PHASE2_AND_PHASE3_TESTING_GUIDE.md`

### Phase 3 Testing (Optional - After DB Migration)

```
1. Run Phase 3 migration in Supabase:
   - Open SQL Editor
   - Run: database-phase3-master-agent.sql

2. Verify tables: node check-phase3-tables.js

3. Import Phase 3 collection to Postman

4. Run tests:
   ✅ Setup: Get Auth Token (1 test)
   ✅ 1. Event Logging (3 tests)
   ✅ 2. Nudge Delivery (3 tests)
   ✅ 3. Nudge Interactions (2 tests)
   ✅ 4. Feedback Collection (3 tests)
   ✅ 5. Context & Debugging (1 test)

Total: 13 tests
```

**Note**: Some Phase 3 tests may return empty results until you've generated data (journaled, created goals, etc.). This is expected.

---

## 🐛 Common Errors & Fixes

| Error | Meaning | Fix |
|-------|---------|-----|
| `Could not connect to localhost:4000` | Backend not running | `npm run dev` |
| `401 Unauthorized` | No auth token | Run "Register User" test first |
| `404 Not Found` | Route doesn't exist | Check `routes/index.ts` |
| `500 Internal Server Error` | Database or code error | Check backend console logs |
| `Table does not exist` | Migration not run | Run SQL in Supabase |
| Tests stuck | Backend crashed | Restart: `npm run dev` |

---

## 📁 File Locations

| File | Purpose | Location |
|------|---------|----------|
| Phase 2.5 Postman Collection | Test all Phase 2 APIs | `backend/tests/API_Testing_Collection.postman.json` |
| Phase 3 Postman Collection | Test Master Agent APIs | `backend/tests/Phase3_Master_Agent.postman_collection.json` |
| Comprehensive Testing Guide | Full documentation | `PHASE2_AND_PHASE3_TESTING_GUIDE.md` |
| Phase 2 Database Schema | SQL for Phase 2 tables | `backend/database-phase2-*.sql` |
| Phase 3 Database Schema | SQL for Phase 3 tables | `backend/database-phase3-master-agent.sql` |
| This Quick Start | Quick reference | `QUICK_START_TESTING.md` |

---

## ✅ Verification Commands

```bash
# 1. Check backend is running
curl http://localhost:4000/api/v1/health

# 2. Check Phase 2 tables exist
cd backend
node check-phase2-tables.js

# 3. Check Phase 3 tables exist (if migrated)
node check-phase3-tables.js

# 4. Test Goals API directly
curl -X POST http://localhost:4000/api/v1/goals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title":"Test","description":"Test","category":"health","timeframe":"1_month"}'

# 5. Run Phase 2 tests via Newman
npm install -g newman
newman run backend/tests/API_Testing_Collection.postman.json
```

---

## 🎯 Next Steps After Testing

### If Phase 2 Tests Pass (26/26):
✅ **Phase 2.5 is COMPLETE**
- All APIs working
- Ready for Phase 3 or Phase 4

**Options**:
1. **Complete Phase 3** → Run DB migration → Test Master Agent APIs
2. **Move to Phase 4** → Implement LangFuse observability (but need Phase 3 DB first for full observability)

### If Phase 3 Tests Pass (13/13):
✅ **Phase 3 Core is READY**
- Event logging works
- Nudge system operational
- Feedback loop functional

**Next**:
- Implement P0 enhancements (crisis, habits, fatigue)
- Add frontend integration
- Move to Phase 4 (observability)

---

## 💡 Pro Tips

1. **Run tests in order** - Later tests depend on earlier ones (auth token, conversation IDs, etc.)

2. **Check console logs** - Postman tests log useful debugging info to the console tab

3. **Use variables** - The collections auto-save IDs (tokens, conversation_id, goal_id, etc.) for reuse

4. **Backend logs** - Watch backend terminal for real-time error messages

5. **Database check** - If tests fail mysteriously, verify tables exist in Supabase

6. **Clean slate** - Register a new user if data gets messy (`test{{$timestamp}}@example.com` creates unique email)

---

## 🆘 Getting Help

If tests still fail after following this guide:

1. **Check backend logs** - Most errors show here
2. **Run verification commands** (above)
3. **Review full guide**: `PHASE2_AND_PHASE3_TESTING_GUIDE.md`
4. **Check Supabase logs**: Dashboard → Logs

**Still stuck?** Provide:
- Which test failed (e.g., "5.1 Create Goal")
- Backend console output
- Postman test result error message

---

## Summary: Your 3 Questions Answered

✅ **Q1: Goals API not working**
**A**: Start backend with `npm run dev`. Test with curl or Postman.

✅ **Q2: Postman tests not running**
**A**: Import `API_Testing_Collection.postman.json`, set environment, ensure backend running, run collection.

✅ **Q3: Can Postman test Phase 3?**
**A**: YES! Import `Phase3_Master_Agent.postman_collection.json`. Same workflow as Phase 2. 13 tests covering events, nudges, feedback, and context.

---

**Status**: ✅ All testing infrastructure ready
**Collections**: 2 (Phase 2.5 + Phase 3)
**Total Tests**: 39 (26 Phase 2 + 13 Phase 3)
**Next Action**: Start backend → Import collections → Run tests
