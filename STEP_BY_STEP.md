# Step-by-Step Instructions

## Part 1: Run Postman Tests (EASIEST)

### Step 1: Download Postman
1. Open your browser
2. Go to: **https://www.postman.com/downloads/**
3. Click **"Download the App"** for Windows
4. Install it (just click Next, Next, Finish)
5. Open Postman (skip sign-up for now)

### Step 2: Import the Test Collection
1. In Postman, look at the **LEFT sidebar**
2. You'll see: **Collections**, **Environments**, **History**
3. Click on **"Collections"** tab
4. Look for **"Import"** button (top left area)
5. Click **"Import"**
6. A window opens

### Step 3: Select the File
1. In the Import window, click **"Upload Files"**
2. Navigate to: `C:\Users\vivia\OneDrive\Desktop\Figma\backend\tests\`
3. Select file: **`API_Testing_Collection.postman.json`**
4. Click **"Open"**
5. Click **"Import"** button
6. Wait 2 seconds - collection appears in left sidebar!

### Step 4: Run All Tests
1. In left sidebar, you'll see: **"Luma API - Phase 2.5 Testing"**
2. **Hover your mouse** over the collection name
3. You'll see three dots (**...**) appear
4. Click the three dots
5. Select **"Run collection"** from menu

**OR** click the orange **"Run"** button next to the collection name

### Step 5: Start the Tests
1. Collection Runner window opens
2. You'll see a list of 26 tests
3. All should be checked ✓
4. Click the big blue button: **"Run Luma API - Phase 2.5 Testing"**
5. Watch the tests run!

### Step 6: View Results
- **Green** = Test passed ✅
- **Red** = Test failed ❌
- Click on any test to see details

**Expected Results RIGHT NOW:**
- ✅ Health Check: PASS (green)
- ❌ Register User: PASS but no token (this is the issue we need to fix)
- ❌ All other tests: FAIL (401 - because no auth token)

---

## Part 2: Fix the Auth Issue

### Why Tests Are Failing:
The registration works, but Supabase isn't giving us an access token because **email confirmation is required**. We need to turn that off for testing.

### Fix Steps (Takes 3 minutes):

#### Step 1: Open Supabase Dashboard
1. Open browser
2. Go to: **https://supabase.com/dashboard**
3. **Login** with your account
4. **Select your Luma project** (click on it)

#### Step 2: Go to Auth Settings
1. On the left sidebar, find **"Authentication"** (shield icon)
2. Click **"Authentication"**
3. You'll see: Users, Policies, **Settings**, etc.
4. Click **"Settings"**

#### Step 3: Disable Email Confirmation
1. **Scroll down** on the Settings page
2. Look for section: **"Email Auth"**
3. Find the toggle: **"Enable email confirmations"**
4. **Click the toggle** to turn it **OFF** (should be gray/disabled)
5. **Scroll to bottom**
6. Click **"Save"** button

#### Step 4: Verify It Worked
1. Open Git Bash (or Command Prompt)
2. Paste this command (all as one line):

```bash
curl -X POST http://localhost:3001/api/v1/auth/register -H "Content-Type: application/json" -d "{\"name\":\"Quick Test\",\"email\":\"quicktest123@gmail.com\",\"password\":\"TestPassword123!\"}"
```

3. Press Enter
4. Look at the response
5. **Check if you see:** `"access_token": "eyJ..."`

**If you see the access_token** → ✅ Fixed!
**If you see "session": null** → Try waiting 30 seconds and run command again

---

## Part 3: Run Tests Again

### Option A: Postman (Recommended)
1. Go back to Postman
2. Click **"Run"** on the collection again
3. Watch tests execute
4. **NOW you should see LOTS of green (PASS)!** ✅

**Expected after fix:**
- ✅ Health Check: PASS
- ✅ Register User: PASS (with token!)
- ✅ Get Current User: PASS
- ✅ Dashboard tests: PASS
- ✅ Chat tests: PASS (takes ~10s for AI)
- ✅ Journal tests: PASS (takes ~10s for AI)
- ✅ Goals tests: PASS (takes ~10s for AI)
- ✅ Tools tests: PASS (takes ~15s for AI)
- ✅ Memory tests: PASS

**Total:** Should see 23-26 tests PASS (green)

### Option B: Command Line
```bash
cd C:\Users\vivia\OneDrive\Desktop\Figma\backend\tests
node test-api.js
```

Look for green **PASS** messages!

---

## Command Reference

### Navigate to Correct Directory:
```bash
# You are here:
cd C:\Users\vivia\OneDrive\Desktop\Figma

# Go to tests folder:
cd backend\tests

# OR in one command:
cd C:\Users\vivia\OneDrive\Desktop\Figma\backend\tests
```

### Run Tests:
```bash
node test-api.js
```

### Test Registration Manually:
```bash
curl -X POST http://localhost:3001/api/v1/auth/register -H "Content-Type: application/json" -d "{\"name\":\"Test\",\"email\":\"test999@gmail.com\",\"password\":\"TestPassword123!\"}"
```

---

## What You Should See After Fix

### In Postman:
```
✅ 1.1 Health Check                    200 OK
✅ 1.2 Register New User               201 Created
✅ 1.3 Get Current User                200 OK
✅ 2.1 Submit Mood Check-in            201 Created
✅ 2.2 Get Dashboard Stats             200 OK
✅ 2.3 Get Mood History                200 OK
✅ 3.1 Create Conversation             201 Created
✅ 3.2 Send Message                    201 Created (takes 5-10s)
✅ 3.3 Get Conversation                200 OK
... (more tests)

Summary:
✅ Passed: 24
❌ Failed: 2  (some memory tests might fail if no data yet)
⏱️ Duration: 2-4 minutes
```

### In Command Line:
```
Testing: Health Check... PASS (HTTP 200)
Testing: Register User... PASS (HTTP 201)
✓ Registration successful
Access Token: eyJhbGciOiJIUzI1NiIsIn...
Testing: Get Current User... PASS (HTTP 200)
Testing: Submit Mood Check-in... PASS (HTTP 201)
...

================================================
              TEST SUMMARY
================================================
Tests Passed: 24
Tests Failed: 2
Total Tests: 26

✓ All tests passed!
```

---

## Troubleshooting

### "Connection refused"
**Problem:** Backend not running
**Solution:**
```bash
cd C:\Users\vivia\OneDrive\Desktop\Figma\backend
npm run dev
```
Wait for: "Server listening on port 3001"

### "Module not found"
**Problem:** Wrong directory
**Solution:**
```bash
# Make sure you're in the right place:
cd C:\Users\vivia\OneDrive\Desktop\Figma\backend\tests
# Then run:
node test-api.js
```

### "Still getting session: null"
**Problem:** Supabase settings not saved or not applied yet
**Solution:**
1. Go back to Supabase Dashboard
2. Check "Enable email confirmations" is OFF
3. Click Save again
4. Wait 1-2 minutes
5. Try with a NEW email address

### "Cannot find Postman collection"
**File Location:**
```
C:\Users\vivia\OneDrive\Desktop\Figma\backend\tests\API_Testing_Collection.postman.json
```
Copy this path, paste into Windows Explorer, press Enter

---

## Quick Check: Is Everything Working?

### ✅ Backend Running?
Open browser, go to: **http://localhost:3001/api/v1/health**

Should see:
```json
{"success":true,"message":"Luma API is running",...}
```

### ✅ Auth Fixed?
Run this in Git Bash:
```bash
curl http://localhost:3001/api/v1/auth/register -X POST -H "Content-Type: application/json" -d "{\"email\":\"test$(date +%s)@gmail.com\",\"password\":\"Test123!\",\"name\":\"Test\"}"
```

Look for: `"access_token"`

### ✅ Tests Ready?
Check file exists:
```bash
ls C:\Users\vivia\OneDrive\Desktop\Figma\backend\tests\test-api.js
```

Should show: `test-api.js`

---

## Success = When You See This

**In Postman:**
- Collection loads ✅
- Tests run ✅
- Most tests are green ✅
- Can see response data ✅

**In Command Line:**
- Script runs without errors ✅
- Access token extracted ✅
- Most tests PASS ✅
- Summary shows 20+ passed ✅

**That means your API is working!** 🎉

---

## Next - After Tests Pass

1. Check memory blocks were created
2. Verify LangFuse traces
3. Test semantic search
4. Phase 2.5 complete!
5. Move to Phase 3

---

**Start with Postman - it's the easiest way to see what's happening!**
