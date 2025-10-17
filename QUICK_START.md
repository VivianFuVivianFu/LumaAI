# 🚀 Quick Start Guide

## Current Status
- ✅ Backend running on port 3001
- ✅ Frontend dependencies installed
- ✅ API testing suite ready
- ⚠️ Auth needs 1 fix

---

## Fix Auth (5 minutes)

### Quick Fix Steps:
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click: **Authentication** → **Settings**
4. Find: **"Enable email confirmations"**
5. **Turn it OFF** ❌
6. Click **"Save"**

### Test It Works:
```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test\",\"email\":\"test123@gmail.com\",\"password\":\"TestPassword123!\"}"
```

**Look for:** `"access_token": "eyJ..."`
If you see it → ✅ Fixed!

---

## Run API Tests

### Option 1: Node.js (Easiest)
```bash
cd backend/tests
node test-api.js
```

### Option 2: Postman (Best for detailed testing)
1. Download: https://www.postman.com/downloads/
2. Open Postman
3. Drag file into Postman: `backend/tests/API_Testing_Collection.postman.json`
4. Click **"Run"** button
5. Watch tests execute!

---

## What You Have

### 📁 Files Created:
```
Figma/
├── backend/tests/
│   ├── API_Testing_Collection.postman.json  ← Postman tests
│   ├── test-api.js                          ← Node.js test script
│   ├── test-api.sh                          ← Bash test script
│   ├── README.md                            ← Testing guide
│   └── POSTMAN_SETUP_GUIDE.md               ← Postman tutorial
├── AUTH_SESSION_FIX.md                      ← Fix guide (detailed)
├── TESTING_SETUP_COMPLETE.md                ← Summary doc
└── QUICK_START.md                           ← This file
```

### 📊 Test Coverage:
- 26 API tests across 7 feature modules
- Automatic token extraction
- Built-in assertions
- Memory integration testing

---

## Common Commands

### Start Backend:
```bash
cd backend
npm run dev
```

### Run Tests:
```bash
cd backend/tests
node test-api.js
```

### Test Single Endpoint:
```bash
curl http://localhost:3001/api/v1/health
```

### Check Backend Logs:
Look at the terminal where `npm run dev` is running

---

## Expected Results

### After Auth Fix:
✅ Registration returns access token
✅ Protected endpoints work
✅ Test suite passes (>90%)
✅ Memory blocks created
✅ LangFuse traces recorded

### Test Summary Should Show:
```
Tests Passed: 23-26
Tests Failed: 0-3
Total Tests: 26
```

---

## Next Steps (After Tests Pass)

1. ✅ **Verify memory ingestion**
   ```bash
   curl http://localhost:3001/api/v1/memory/blocks \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
   Should show blocks from chat/journal/goals

2. ✅ **Check LangFuse traces**
   - Go to: https://cloud.langfuse.com
   - Login to your project
   - See traces from API operations

3. ✅ **Test semantic search**
   ```bash
   curl -X POST http://localhost:3001/api/v1/memory/search \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"query":"confidence","limit":5}'
   ```

4. ✅ **Phase 2.5 Complete!**
   If all checks pass → Move to Phase 3

---

## Troubleshooting

### Backend won't start:
```bash
# Check if something is on port 3001
netstat -ano | findstr :3001

# Kill process (replace PID)
taskkill //F //PID YOUR_PID

# Try again
cd backend
npm run dev
```

### Tests fail:
1. Check backend is running
2. Check .env file exists with all keys
3. Run one test at a time in Postman
4. Check backend logs for errors

### Auth still broken:
See: `AUTH_SESSION_FIX.md` for detailed steps

---

## Help & Documentation

- **Postman Guide:** `backend/tests/POSTMAN_SETUP_GUIDE.md`
- **Auth Fix:** `AUTH_SESSION_FIX.md`
- **Full Testing Guide:** `PHASE2.5_TESTING_GUIDE.md`
- **Setup Summary:** `TESTING_SETUP_COMPLETE.md`

---

## Success Checklist

- [ ] Auth fix applied (email confirmation off)
- [ ] Registration returns access_token
- [ ] Test suite runs successfully
- [ ] >90% tests passing
- [ ] Memory blocks being created
- [ ] LangFuse traces visible
- [ ] Ready for Phase 3!

---

**You're almost there! Just fix the auth and run the tests!** 🎯
