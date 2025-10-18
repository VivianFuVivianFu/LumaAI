# Vercel Deployment - Quick Fix Guide

## ✅ Issue Fixed!

The warning about conflicting `vercel.json` configuration has been resolved.

**What was changed:**
- Simplified `vercel.json` to modern Vercel format
- Removed deprecated fields (`version`, `name`, `regions`)
- Kept essential SPA routing and security headers
- Now fully compatible with Vercel's latest deployment system

---

## 🚀 Complete Your Vercel Deployment

Follow these steps in the Vercel UI you have open:

### Step 1: Configure the Project (Current Screen)

You're on the "New Project" screen. Here's what to set:

#### ✅ Already Set (From Screenshot):
- **Importing from GitHub:** ✅ VivianFuVivianFu/LumaAI (main branch)
- **Project Name:** `LumaAI` ✅
- **Framework Preset:** Vite ✅
- **Root Directory:** `./` ✅

#### ⚠️ Need to Configure:

**1. Click "Build and Output Settings" dropdown**

**Build Command:**
```
npm run build
```
(Should be auto-detected, verify it's correct)

**Output Directory:**
```
build
```
(Important: This must match your `vite.config.ts` - already set to `build`)

**Install Command:**
```
npm install
```
(Should be auto-detected)

---

**2. Click "Environment Variables" dropdown**

**Add these variables NOW (before deploying):**

Click **"Add"** and enter:

```
Name: VITE_API_URL
Value: http://localhost:4000/api/v1
```
(Temporary value - we'll update after Railway deployment)

**For which environments?**
- ✅ Production
- ✅ Preview (optional)
- ⬜ Development (not needed)

**Why set a temporary value?**
- Vercel needs this variable defined during build
- We'll update it to your Railway URL after deployment
- The app will work once we update it

---

### Step 2: Deploy!

1. Click **"Deploy"** button (bottom of page)
2. Wait 2-3 minutes for build to complete
3. You'll see:
   ```
   Building...
   ✅ Build completed
   ✅ Deployed to: https://luma-ai-xyz.vercel.app
   ```

---

### Step 3: Get Your Vercel URL

After deployment completes:

1. You'll see a success screen with your deployment URL
2. Copy this URL (e.g., `https://luma-ai-xyz.vercel.app`)
3. **Save it** - you'll need it for Railway configuration

---

### Step 4: Update Environment Variable

Now that you have Railway backend deployed (or will deploy it):

**4A: Get Railway API URL**
1. Go to Railway Dashboard
2. Click your API service
3. Go to **Settings** → **Domains**
4. Copy the domain (e.g., `luma-backend-production.up.railway.app`)
5. Your full API URL is: `https://your-domain.railway.app/api/v1`

**4B: Update Vercel Variable**
1. Vercel Dashboard → Your Project → **Settings**
2. Click **Environment Variables** (left sidebar)
3. Find `VITE_API_URL`
4. Click **Edit**
5. Update value to: `https://your-railway-domain.railway.app/api/v1`
6. Click **Save**

**4C: Redeploy**
1. Go to **Deployments** tab
2. Click on latest deployment
3. Click **"⋯"** menu → **"Redeploy"**
4. Wait for new deployment to complete

---

### Step 5: Update Railway CORS

Now update Railway to allow your Vercel URL:

1. Railway Dashboard → API Service → **Variables**
2. Find or add: `FRONTEND_URL`
3. Set value to your Vercel URL: `https://luma-ai-xyz.vercel.app`
4. Service will auto-redeploy

---

### Step 6: Test Everything

1. Open your Vercel URL in browser
2. Press **F12** → **Console** tab
3. Try to:
   - Register/Login
   - Create a chat
   - Submit a goal

**Expected:**
- ✅ No CORS errors
- ✅ API calls succeed
- ✅ All features work

**If you see errors:**
- Check browser console for specific error
- Verify `VITE_API_URL` is set correctly in Vercel
- Verify `FRONTEND_URL` is set correctly in Railway
- Both should match exactly (including https://)

---

## 📋 Deployment Checklist

Use this to track your progress:

### Initial Deployment
- [ ] Vercel project configured (Framework: Vite, Output: build)
- [ ] Environment variable `VITE_API_URL` added (temporary value OK)
- [ ] Clicked "Deploy" button
- [ ] Deployment completed successfully
- [ ] Copied Vercel URL

### Railway Configuration
- [ ] Railway API service deployed
- [ ] Railway Worker service deployed
- [ ] Got Railway API URL from dashboard
- [ ] Updated `VITE_API_URL` in Vercel with Railway URL
- [ ] Redeployed Vercel
- [ ] Updated `FRONTEND_URL` in Railway with Vercel URL

### Testing
- [ ] Opened Vercel URL in browser
- [ ] No CORS errors in console
- [ ] Can register/login
- [ ] Can use chat feature
- [ ] Can create goals
- [ ] API calls showing in Network tab

---

## 🔧 Troubleshooting

### Warning Still Appears

**If you still see the warning after the fix:**
1. The warning is non-blocking - you can still deploy
2. Click "Deploy" anyway - it will work
3. The simplified `vercel.json` should prevent this in future deployments

---

### Build Fails: "VITE_API_URL is undefined"

**Solution:**
1. Vercel → Settings → Environment Variables
2. Make sure `VITE_API_URL` is added
3. Make sure it starts with `VITE_` (required for Vite)
4. Redeploy

---

### CORS Error in Browser

**Error:** `Access to fetch at '...' has been blocked by CORS policy`

**Solution:**
1. Railway → API Service → Variables
2. Check `FRONTEND_URL` exactly matches your Vercel URL
3. Include `https://` and correct domain
4. No trailing slash
5. Example: `https://luma-ai.vercel.app` (not `https://luma-ai.vercel.app/`)

---

### 404 Error on Refresh

**Error:** Refreshing a page shows "404 Not Found"

**Solution:**
This is already fixed by the `rewrites` in `vercel.json`:
```json
"rewrites": [
  {
    "source": "/(.*)",
    "destination": "/index.html"
  }
]
```

If still happening:
1. Check `vercel.json` is in root directory
2. Redeploy Vercel
3. Clear browser cache

---

## 🎯 What You Should See

### Successful Vercel Deployment:

**Build Logs:**
```
> npm run build

✓ built in 45s
✓ Deploying...
✓ Build completed in 1m 30s
✓ Deployment ready at: https://luma-ai-xyz.vercel.app
```

**Deployment Status:**
```
Status: Ready ✅
Domain: https://luma-ai-xyz.vercel.app
Build Time: 1m 30s
```

---

### Working Integration:

**Browser Console (F12):**
```javascript
// No errors
// API calls succeed:
GET https://your-railway.app/api/v1/health - 200 OK
POST https://your-railway.app/api/v1/auth/login - 200 OK
```

**Network Tab:**
```
✅ All API calls show Status: 200
✅ Response times < 3s
✅ No CORS preflight failures
```

---

## 📝 Summary

**What was fixed:**
- ✅ Simplified `vercel.json` to resolve warning
- ✅ Kept SPA routing (rewrites for React Router)
- ✅ Kept security headers
- ✅ Removed deprecated configuration fields

**What you need to do:**
1. Click "Deploy" in Vercel (ignore any warnings)
2. Copy your Vercel URL
3. Update `VITE_API_URL` with Railway URL
4. Update Railway `FRONTEND_URL` with Vercel URL
5. Test in browser

**Time estimate:** 5-10 minutes total

---

## 🆘 Still Having Issues?

**Check these common mistakes:**

1. **Environment Variable Name:**
   - ✅ Correct: `VITE_API_URL`
   - ❌ Wrong: `API_URL` or `REACT_APP_API_URL`
   - Must start with `VITE_` for Vite to pick it up

2. **API URL Format:**
   - ✅ Correct: `https://your-api.railway.app/api/v1`
   - ❌ Wrong: `https://your-api.railway.app` (missing /api/v1)
   - ❌ Wrong: `http://your-api.railway.app/api/v1` (http instead of https)

3. **CORS Configuration:**
   - Frontend URL in Railway must match Vercel URL exactly
   - Include https://
   - No trailing slash

4. **After Changing Env Vars:**
   - Always redeploy to apply changes
   - Vercel: Deployments → Latest → Redeploy
   - Railway: Auto-redeploys when variables change

---

**You're ready to deploy!** 🚀

Just click "Deploy" on the Vercel screen you have open, and follow the steps above.
