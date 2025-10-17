# API Testing Setup

This directory contains comprehensive API testing tools for the Luma backend.

## 📦 What's Included

1. **Postman Collection** (`API_Testing_Collection.postman.json`)
   - Complete collection with 30+ API tests
   - Automatic variable extraction (tokens, IDs)
   - Built-in test assertions
   - Organized by feature (Auth, Dashboard, Chat, Journal, Goals, Tools, Memory)

2. **Bash Test Script** (`test-api.sh`)
   - Automated command-line testing
   - Color-coded output
   - Test summary and statistics
   - Can be run in CI/CD pipelines

## 🚀 Quick Start

### Option 1: Postman (Recommended)

1. **Install Postman**
   - Download from: https://www.postman.com/downloads/

2. **Import Collection**
   ```
   File → Import → Select API_Testing_Collection.postman.json
   ```

3. **Run Collection**
   - Click "Run" button on the collection
   - Select all requests
   - Click "Run Luma API - Phase 2.5 Testing"
   - Watch tests execute automatically!

4. **View Results**
   - Green = Passed ✅
   - Red = Failed ❌
   - See response times, payloads, and assertions

### Option 2: Bash Script (Command Line)

1. **Make Script Executable** (Git Bash on Windows)
   ```bash
   cd backend/tests
   chmod +x test-api.sh
   ```

2. **Run Tests**
   ```bash
   ./test-api.sh
   ```

3. **View Results**
   - Tests run automatically
   - Summary shows pass/fail count
   - Green = Pass, Red = Fail

### Option 3: Manual Testing with curl

**Health Check:**
```bash
curl http://localhost:3001/api/v1/health
```

**Register User:**
```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

**Get Current User** (replace TOKEN):
```bash
curl http://localhost:3001/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 📋 Test Coverage

### 1. Authentication (3 tests)
- ✅ Health Check
- ✅ Register User
- ✅ Get Current User

### 2. Dashboard (3 tests)
- ✅ Submit Mood Check-in
- ✅ Get Dashboard Stats
- ✅ Get Mood History

### 3. Chat (4 tests)
- ✅ Create Conversation
- ✅ Send Message
- ✅ Get Conversation
- ✅ Get All Conversations

### 4. Journal (5 tests)
- ✅ Create Session
- ✅ Create Entry with AI Insight
- ✅ Get Session
- ✅ Complete Session
- ✅ Get All Sessions

### 5. Goals (3 tests)
- ✅ Create Goal with Clarifications
- ✅ Get All Goals
- ✅ Get Single Goal

### 6. Tools (4 tests)
- ✅ Create Brain Exercise (Empower My Brain)
- ✅ Create Narrative (My New Narrative)
- ✅ Create Future Me Exercise
- ✅ Get All Brain Exercises

### 7. Memory (4 tests)
- ✅ Get Memory Settings
- ✅ Get Memory Blocks
- ✅ Search Memory (Semantic Search)
- ✅ Get Memory Insights

**Total: 26 Tests**

## 🔍 What Gets Tested

### Automatic Checks (in Postman)
- ✅ HTTP status codes (200, 201, etc.)
- ✅ Response structure validation
- ✅ Required fields presence
- ✅ Data type validation
- ✅ Token extraction and storage
- ✅ ID extraction for chained requests

### Manual Verification Needed
- AI response quality (chat, journal insights)
- Memory block creation after operations
- Semantic search relevance
- LangFuse trace recording
- Database data persistence

## 🐛 Troubleshooting

### Issue: "Connection Refused"
**Solution:** Make sure backend is running
```bash
cd backend
npm run dev
```

### Issue: "401 Unauthorized"
**Solution:** Token expired or invalid
- Re-run registration test to get new token
- Check Authorization header format: `Bearer <token>`

### Issue: "Database Connection Error"
**Solution:** Check backend/.env file
- Verify SUPABASE_URL is set
- Verify SUPABASE_ANON_KEY is set
- Test database connection in Supabase dashboard

### Issue: "Memory blocks not created"
**Solution:** Check memory settings
```bash
curl http://localhost:3001/api/v1/memory/settings \
  -H "Authorization: Bearer YOUR_TOKEN"
```
- Ensure `memory_enabled: true`
- Check OpenAI API key for embeddings

### Issue: Tests timing out
**Solution:**
- AI operations can take 5-30 seconds
- Increase timeout in Postman settings
- Check OpenAI API rate limits

## 📊 Test Results Interpretation

### Success Criteria
- ✅ All auth tests pass (100%)
- ✅ At least 90% of feature tests pass
- ✅ No 500 errors
- ✅ Memory blocks created after chat/journal/goals/tools operations
- ✅ LangFuse traces appear in dashboard

### Warning Signs
- ⚠️ 50-89% tests passing = Some features broken
- ⚠️ Memory blocks not created = Memory ingestion broken
- ⚠️ Consistent timeouts = API key issues or database problems

### Critical Failures
- ❌ Auth tests fail = Cannot proceed
- ❌ Database connection errors = Check Supabase
- ❌ <50% tests passing = Major issues, don't proceed

## 🔄 Running Tests in Sequence

For best results, run tests in this order:

1. **Health Check** - Verify backend is up
2. **Register** - Create test user
3. **Dashboard** - Test simple CRUD
4. **Chat** - Test AI integration
5. **Journal** - Test AI + memory
6. **Goals** - Test multi-step flows
7. **Tools** - Test all three tools
8. **Memory** - Verify ingestion worked

## 📈 Next Steps After Testing

1. ✅ All tests pass → Proceed to memory integration verification
2. ✅ Memory blocks created → Check LangFuse traces
3. ✅ LangFuse working → Move to Phase 3
4. ❌ Tests failing → Check logs and fix issues

## 🆘 Getting Help

**Check these first:**
1. Backend console logs (`npm run dev` output)
2. Browser console (if testing frontend)
3. Supabase logs (Dashboard → Logs)
4. LangFuse traces (cloud.langfuse.com)

**Common Log Locations:**
- Backend: Terminal running `npm run dev`
- Supabase: Supabase Dashboard → Logs → API
- Database: Supabase Dashboard → Logs → Database

## 📝 Notes

- **Test Data:** Each test creates real data in database
- **Cleanup:** You may want to delete test users after testing
- **Rate Limits:** Be aware of OpenAI API rate limits
- **Costs:** AI operations consume OpenAI credits
- **Timing:** Full test suite takes 2-5 minutes

---

**Happy Testing! 🚀**

For detailed testing guide, see: `PHASE2.5_TESTING_GUIDE.md`
