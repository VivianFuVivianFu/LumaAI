# Postman Setup Guide - Step by Step

## Step 1: Install Postman

1. **Download Postman**
   - Go to: https://www.postman.com/downloads/
   - Click "Download" for Windows
   - Run the installer
   - Sign up for a free account (optional but recommended)

2. **Launch Postman**
   - Open Postman application
   - Skip tutorial if prompted

---

## Step 2: Import the Collection

### Method 1: Drag and Drop (Easiest)
1. Open Postman
2. Look for the left sidebar
3. Drag the file `API_Testing_Collection.postman.json` from File Explorer
4. Drop it into Postman's left sidebar
5. Done! Collection imported ✅

### Method 2: Import Button
1. Open Postman
2. Click **"Import"** button (top left area)
3. Click **"Upload Files"** or drag file into window
4. Navigate to: `C:\Users\vivia\OneDrive\Desktop\Figma\backend\tests\`
5. Select: `API_Testing_Collection.postman.json`
6. Click **"Import"**
7. Done! ✅

---

## Step 3: Run the Collection

### Visual Location Guide:
```
┌─────────────────────────────────────────┐
│  Postman                    [−][□][×]   │
├─────────────────────────────────────────┤
│  Collections  Environments  History     │
├─────────────────────────────────────────┤
│  ▼ Luma API - Phase 2.5 Testing        │  ← Your imported collection
│    ├─ 1. Authentication                 │
│    ├─ 2. Dashboard                      │
│    ├─ 3. Chat                           │
│    ├─ 4. Journal                        │
│    ├─ 5. Goals                          │
│    ├─ 6. Tools                          │
│    └─ 7. Memory                         │
│                                          │
│  [Run]  [...]  ← Click "Run" button    │
└─────────────────────────────────────────┘
```

### Steps:
1. **Find the collection** in left sidebar
   - Look for: **"Luma API - Phase 2.5 Testing"**

2. **Click the three dots (...)** next to collection name
   - OR hover over collection and click **"Run"** button

3. **Collection Runner opens**
   - You'll see all 26 tests listed

4. **Configure Runner:**
   - ✅ Select All (all tests should be checked)
   - Iterations: 1
   - Delay: 0 ms (or 500ms if you want slower execution)

5. **Click "Run Luma API - Phase 2.5 Testing"**
   - Tests will execute automatically!
   - Watch them turn green (pass) or red (fail)

---

## Step 4: Understanding Results

### What You'll See:

```
┌────────────────────────────────────────┐
│  Run Results                           │
├────────────────────────────────────────┤
│  ✅ 1.1 Health Check          200 OK  │  ← Green = Passed
│  ❌ 1.2 Register New User     500 ERR │  ← Red = Failed
│  ⚠️  1.3 Get Current User     401     │  ← Orange = Auth issue
│  ...                                   │
├────────────────────────────────────────┤
│  Summary:                              │
│  Passed: 15  Failed: 11  Skipped: 0   │
│  Duration: 45s                         │
└────────────────────────────────────────┘
```

### Click on any test to see:
- ✅ **Passed Tests**: Show response data
- ❌ **Failed Tests**: Show error message and what went wrong
- 📊 **Response Body**: JSON data returned
- ⏱️ **Response Time**: How long it took

---

## Step 5: Individual Test Execution

### To run ONE test at a time:

1. **Expand a folder** (e.g., "1. Authentication")
2. **Click a specific test** (e.g., "1.1 Health Check")
3. **Click blue "Send" button** (right side)
4. **View response below**

### Example - Testing Health Endpoint:
```
1. Click "1.1 Health Check"
2. Click "Send" button
3. See response:
   {
     "success": true,
     "message": "Luma API is running",
     "timestamp": "2025-10-12..."
   }
4. Status shows: 200 OK ✅
```

---

## Step 6: Variables (Auto-extracted)

The collection automatically saves these for you:
- `access_token` - Auth token from registration
- `user_id` - Your user ID
- `conversation_id` - Chat conversation ID
- `session_id` - Journal session ID
- `goal_id` - Goal ID

### To view variables:
1. Click collection name
2. Click "Variables" tab
3. See current values

These are used in subsequent requests automatically!

---

## Common Issues & Solutions

### ❌ Issue: "Could not get any response"
**Solution:** Backend not running
```bash
cd backend
npm run dev
```
Wait for: "Server listening on port 3001"

### ❌ Issue: All tests show 401 Unauthorized
**Solution:** Registration didn't return token (the issue we're fixing!)
- This is the auth session bug
- Continue to Part 2 below to fix it

### ❌ Issue: "Connection refused"
**Solution:** Wrong URL
- Check collection variable: `base_url`
- Should be: `http://localhost:3001/api/v1`
- Click collection → Variables tab → Verify base_url

### ⚠️ Issue: Tests timeout
**Solution:** AI operations take time
- In Runner, set Delay to 1000ms (1 second)
- Or increase timeout in Settings

---

## Tips for Success

### ✅ Best Practices:
1. **Run tests in order** (Auth → Dashboard → Chat → etc.)
2. **Check backend logs** for errors while tests run
3. **First run may be slower** (database operations)
4. **Save responses** by clicking "Save Response" button
5. **Export results** via "Export Results" button

### 📊 Success Criteria:
- Health Check: Should ALWAYS pass ✅
- Auth tests: Should pass after we fix session issue
- Other tests: Should pass if auth works
- Expected: >90% pass rate

### 🎯 What to Check:
- ✅ Green tests = Feature working
- ❌ Red tests = Check error message
- ⏱️ Slow tests (>10s) = Normal for AI operations
- 💾 Data persisted = Check Supabase dashboard

---

## Quick Reference

### Must-Have for Testing:
- ✅ Backend running on port 3001
- ✅ .env file configured
- ✅ Supabase database setup
- ✅ OpenAI API key valid

### Test Execution Time:
- Health check: <1s
- Auth operations: 1-2s
- AI operations (chat, journal): 5-15s
- Full suite: 2-5 minutes

### Keyboard Shortcuts:
- `Ctrl + Enter` - Send request
- `Ctrl + L` - Clear console
- `Ctrl + Alt + C` - Copy as cURL

---

## Next Steps

After running tests:
1. ✅ Note which tests passed/failed
2. ✅ Check backend console for errors
3. ✅ Verify data in Supabase dashboard
4. ✅ Check LangFuse for traces
5. ✅ Review memory blocks created

**Now let's fix the auth session issue (Part 2 below)!**
