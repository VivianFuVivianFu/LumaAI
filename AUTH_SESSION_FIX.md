# Auth Session Fix Guide

## Problem
When registering a new user, the API returns:
```json
{
  "user": { ... },
  "session": null  // ❌ Should contain access_token
}
```

This prevents testing protected endpoints because there's no authentication token.

## Root Cause
Supabase has **Email Confirmation** enabled by default. When a user registers:
1. User is created ✅
2. Confirmation email is sent 📧
3. Session is NOT created until email is confirmed ❌

For development/testing, we need to disable email confirmation.

---

## Fix Option 1: Disable Email Confirmation in Supabase (Recommended)

### Step 1: Go to Supabase Dashboard
1. Open: https://supabase.com/dashboard
2. Login to your account
3. Select your project

### Step 2: Navigate to Authentication Settings
```
Dashboard → Authentication → Settings
```

Or direct link:
```
https://supabase.com/dashboard/project/YOUR_PROJECT_ID/auth/settings
```

### Step 3: Disable Email Confirmation
1. Scroll to **"Email Auth"** section
2. Find **"Enable email confirmations"**
3. **TOGGLE IT OFF** ❌
4. Click **"Save"** button

### Step 4: Test Registration Again
```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@gmail.com","password":"TestPassword123!"}'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "test@gmail.com", ... },
    "session": {
      "access_token": "eyJhb...",  // ✅ Token present!
      "refresh_token": "...",
      "expires_in": 3600
    }
  }
}
```

---

## Fix Option 2: Use Admin Client for Registration (Alternative)

If you want to keep email confirmation ON but need instant sessions for development, modify the auth service:

### Update: `backend/src/modules/auth/auth.service.ts`

```typescript
async register(input: RegisterInput) {
  const { email, password, name } = input;

  // USE ADMIN CLIENT for auto-confirmed registrations
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,  // ← Auto-confirm email
    user_metadata: {
      name,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error('Registration failed: No user returned');
  }

  // Now sign in to get session
  const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    throw new Error('Failed to create session after registration');
  }

  // Fetch user profile
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (profileError) {
    console.warn('Profile fetch warning:', profileError.message);
  }

  return {
    user: profile || {
      id: data.user.id,
      email: data.user.email!,
      name,
      is_new_user: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      preferences: {},
    },
    session: sessionData.session,  // ✅ Session included
  };
}
```

**Note:** This approach creates users via admin API and then signs them in to get a session.

---

## Fix Option 3: Auto-Confirm via Environment Variable

Add to your Supabase project's Edge Functions or modify the trigger:

### In Supabase Dashboard:
1. Go to **Database** → **Triggers**
2. Find the `on_auth_user_created` trigger
3. Add auto-confirmation logic

**SQL to add:**
```sql
-- This would need to be part of your auth setup
-- Supabase doesn't directly support this via SQL
-- Use Option 1 (Dashboard) or Option 2 (Admin API) instead
```

---

## Verification After Fix

### Test 1: Register New User
```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "newtest@gmail.com",
    "password": "TestPassword123!"
  }'
```

**Check Response:**
- ✅ `session.access_token` exists
- ✅ `session.refresh_token` exists
- ✅ `session.expires_in` is 3600

### Test 2: Use Token
```bash
# Copy the access_token from response above
curl http://localhost:3001/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "name": "..." }
  }
}
```

### Test 3: Run Full Test Suite
```bash
cd backend/tests
node test-api.js
```

**Expected Results:**
- ✅ Health Check: PASS
- ✅ Register User: PASS (with token)
- ✅ Get Current User: PASS
- ✅ Dashboard tests: PASS
- ✅ Chat tests: PASS
- ✅ All other tests: PASS

---

## Which Fix Should You Use?

### ✅ **Fix Option 1** (Disable Email Confirmation)
**Best for:** Development & Testing
- Quickest to implement (2 minutes)
- No code changes needed
- Works immediately
- Can be re-enabled for production

### 🔧 **Fix Option 2** (Admin API Registration)
**Best for:** Keeping email confirmation on
- Requires code change
- More complex
- Good if you want to test confirmation flow separately

### ⚠️ **Fix Option 3** (Edge Function)
**Not recommended:** Too complex for this use case

---

## After Applying Fix

### 1. Test Registration
```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Fix Test","email":"fixtest@gmail.com","password":"TestPassword123!"}'
```

Save the `access_token` from response.

### 2. Test Protected Endpoint
```bash
curl http://localhost:3001/api/v1/dashboard/stats \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Should return dashboard data, not 401 error.

### 3. Run Full Test Suite
```bash
cd backend/tests
node test-api.js
```

Look for:
- ✅ Green "PASS" messages
- ✅ Access token extracted successfully
- ✅ Protected endpoints working

### 4. Import Postman Collection
- Follow: `POSTMAN_SETUP_GUIDE.md`
- Run collection
- Should see mostly green (>90% pass rate)

---

## Troubleshooting

### Issue: Still getting `session: null`
**Check:**
1. Did you save settings in Supabase Dashboard?
2. Try logging out and back in to Supabase Dashboard
3. Wait 30 seconds for settings to propagate
4. Try with a new email address

### Issue: "Email already registered"
**Solution:**
1. Go to Supabase Dashboard → Authentication → Users
2. Delete the test users
3. Try again with fresh email

### Issue: Token expires quickly
**This is normal!**
- Access tokens expire in 1 hour
- Use refresh token to get new access token
- For testing, just register a new user

---

## Summary

**Recommended: Use Fix Option 1**
1. Open Supabase Dashboard
2. Go to Authentication → Settings
3. Disable "Enable email confirmations"
4. Save
5. Test: `curl -X POST http://localhost:3001/api/v1/auth/register ...`
6. Verify `session.access_token` is present
7. Run test suite: `node test-api.js`

**Time:** 5 minutes
**Difficulty:** Easy
**Success Rate:** 99%

---

**Once fixed, all your API tests should work! 🎉**
