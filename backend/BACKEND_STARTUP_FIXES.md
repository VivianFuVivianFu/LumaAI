# Backend Startup Issues - Complete Fix Guide

## Current Status

✅ **FIXED:**
1. Import path issues - moved `shared/utils` and `shared/types` to `src/utils` and `src/types`
2. All imports updated to use new paths
3. Auth middleware renamed from `authenticate` to `requireAuth`

❌ **REMAINING ISSUES:**
1. Backend server crashing on startup
2. Controller functions appearing as undefined to Express routes
3. Multiple route files may have similar issues

---

## What We've Done

### 1. Folder Restructure ✅
**Action:** Moved folders to root `src/` level for consistency

```
BEFORE:
src/
├── middleware/         (at root)
└── shared/
    ├── types/          (nested)
    └── utils/          (nested)

AFTER:
src/
├── middleware/         (at root)
├── types/              (at root) ✅
└── utils/              (at root) ✅
```

### 2. Import Path Updates ✅
**Action:** Updated all imports from `../shared/utils/` → `../utils/`

Files fixed:
- ✅ `src/middleware/auth.middleware.ts`
- ✅ `src/middleware/validation.middleware.ts`
- ✅ `src/modules/auth/auth.controller.ts`
- ✅ `src/modules/chat/chat.controller.ts`
- ✅ `src/modules/dashboard/dashboard.controller.ts`
- ✅ `src/modules/goals/goals.controller.ts`
- ✅ `src/modules/journal/journal.controller.ts`
- ✅ `src/modules/memory/memory.controller.ts`
- ✅ `src/modules/memory/memory.routes.ts`
- ✅ `src/modules/tools/tools.controller.ts`
- ✅ `src/modules/tools/tools.routes.ts`

### 3. Auth Middleware Rename ✅
**Action:** Renamed export from `authenticate` to `requireAuth`

File: `src/middleware/auth.middleware.ts`
```typescript
// BEFORE
export const authenticate = async (...) => { ... }

// AFTER
export const requireAuth = async (...) => { ... }
```

Also updated in:
- ✅ `src/modules/auth/auth.routes.ts`

---

## Remaining Issues

### Issue 1: Controller Functions Undefined

**Error:**
```
Error: Route.get() requires a callback function but got a [object Undefined]
at import_auth (C:\...\backend\src\modules\auth\auth.routes.ts:14:8)
```

**Root Cause:** The route file imports controller functions, but they appear as `undefined` when passed to Express router methods.

**Possible Causes:**
1. **Circular dependency** - Controllers might be importing something that imports the routes
2. **Missing exports** - Though we verified exports exist
3. **TypeScript/tsx compilation issue** - The `asyncHandler` wrapper might be causing issues
4. **Import timing** - Modules loading in wrong order

**Files Affected:**
- `src/modules/auth/auth.routes.ts` (line 14: `getCurrentUser`)
- Likely others: dashboard, chat, journal, goals, memory, tools

---

## Recommended Fix Strategy

### Option 1: Simplify Controllers (Remove asyncHandler)

The `asyncHandler` wrapper might be causing issues. Try simplifying one controller first:

**File:** `src/modules/auth/auth.controller.ts`

```typescript
// BEFORE (using asyncHandler)
import { asyncHandler } from '../../utils/async.util';

export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  // ... code
});

// AFTER (direct export)
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.substring(7);
    if (!token) {
      sendError(res, 'No token provided', 401);
      return;
    }
    const user = await authService.getCurrentUser(token);
    sendSuccess(res, { user });
  } catch (error) {
    console.error(error);
    sendError(res, 'Failed to get user', 500);
  }
};
```

### Option 2: Check for Circular Dependencies

Run this command to detect circular imports:

```bash
cd backend
npx madge --circular --extensions ts src/
```

If circular dependencies exist, refactor to break the cycle.

### Option 3: Verify All Route Files

Check each route file for correct imports:

```bash
# Search for any remaining 'authenticate' references (should be 'requireAuth')
cd backend
grep -r "import.*authenticate" src/modules/
```

Should return no results. If it does, those files need fixing.

---

## Step-by-Step Manual Fix

### Step 1: Check Dashboard Routes

```bash
cd backend
cat src/modules/dashboard/dashboard.routes.ts | head -10
```

**Look for:**
- Line ~10: Does it import `authenticate` or `requireAuth`?
- If `authenticate`, change to `requireAuth`

**Fix:**
```typescript
// Change this:
import { authenticate } from '../../middleware/auth.middleware';
router.use(authenticate);

// To this:
import { requireAuth } from '../../middleware/auth.middleware';
router.use(requireAuth);
```

### Step 2: Fix Other Module Routes

Check and fix in this order:
1. ✅ `src/modules/auth/auth.routes.ts` - Already fixed
2. ❌ `src/modules/dashboard/dashboard.routes.ts` - Needs checking
3. ❌ `src/modules/chat/chat.routes.ts` - Needs checking
4. ❌ `src/modules/journal/journal.routes.ts` - Needs checking
5. ✅ `src/modules/goals/goals.routes.ts` - Already fixed
6. ✅ `src/modules/memory/memory.routes.ts` - Already fixed
7. ✅ `src/modules/tools/tools.routes.ts` - Already fixed
8. ❌ `src/modules/user/user.routes.ts` - Needs checking

### Step 3: Simplify Auth Controller

Remove `asyncHandler` wrapper temporarily to test:

**File:** `src/modules/auth/auth.controller.ts`

Replace all 5 functions with direct try/catch blocks (see Option 1 above).

### Step 4: Start Server and Test

```bash
cd backend
npm run dev
```

Watch for errors. If it starts successfully:

```bash
curl http://localhost:3001/api/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "...",
  "database": "connected"
}
```

---

## Quick Fix Script

I've created a script to fix all remaining `authenticate` references:

```bash
cd C:\Users\vivia\OneDrive\Desktop\Figma\backend

# Find all files with 'authenticate' import
grep -rl "import.*authenticate.*from.*middleware" src/modules/ --include="*.ts"

# Replace in each file
find src/modules/ -name "*.ts" -exec sed -i "s/import { authenticate }/import { requireAuth }/g; s/router\.use(authenticate)/router.use(requireAuth)/g; s/, authenticate,/, requireAuth,/g" {} \;
```

---

## Testing Checklist

After applying fixes:

- [ ] Backend starts without errors
  ```bash
  cd backend
  npm run dev
  # Should see: "Server listening on port 3001"
  ```

- [ ] Health endpoint responds
  ```bash
  curl http://localhost:3001/api/health
  # Should return JSON with status:"ok"
  ```

- [ ] Auth routes work
  ```bash
  curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"password123"}'
  # Should return proper error (user not found) not 500 error
  ```

- [ ] No undefined middleware errors in logs

---

## If Still Failing

### Last Resort: Create Minimal Test Server

Create `test-server.ts`:

```typescript
import express from 'express';

const app = express();

app.get('/test', (req, res) => {
  res.json({ message: 'Server works!' });
});

app.listen(3001, () => {
  console.log('✅ Test server running on port 3001');
});
```

Run:
```bash
cd backend
npx tsx test-server.ts
curl http://localhost:3001/test
```

If this works, the issue is with your route/controller setup, not the server itself.

---

## Summary

**What You Need to Do:**

1. **Fix remaining route files** that import `authenticate` instead of `requireAuth`
2. **Simplify controllers** by removing `asyncHandler` wrapper temporarily
3. **Test server startup** and check for new errors
4. **Once working**, move to database migrations

**Expected Timeline:**
- Fixing imports: 5 minutes
- Simplifying controllers: 10-15 minutes
- Testing: 5 minutes
- **Total: ~30 minutes**

---

**Next Steps After Backend Starts:**
1. Run database migrations (database-migration-master.sql)
2. Apply RLS policies (database-rls-policies.sql)
3. Create indexes (database-indexes-functions.sql)
4. Test API endpoints (PHASE2.5_TESTING_GUIDE.md)

Good luck! 🚀
