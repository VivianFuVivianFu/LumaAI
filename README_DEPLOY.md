# Luma AI Frontend - Vercel Deployment Guide

**Status:** ✅ READY TO DEPLOY
**Platform:** Vercel
**Framework:** Vite + React
**Generated:** October 18, 2025

---

## 📋 Pre-Deployment Checklist

All checks have been completed and verified:

- ✅ **vite.config.ts** configured correctly
  - Build output: `build/` directory
  - Base path: root (`/`)
  - Vite plugins: React SWC

- ✅ **package.json** has correct scripts
  - `npm run build` → `vite build`
  - `npm run dev` → `vite` (for local testing)

- ✅ **vercel.json** properly configured
  - Framework: Vite
  - Output directory: `build`
  - SPA routing: All paths rewrite to `/index.html`
  - Security headers configured

- ✅ **.env.example** updated with frontend-only variables
  - `VITE_API_URL` - Backend API endpoint
  - `VITE_APP_NAME` - Application name
  - `VITE_ENV` - Environment mode

- ✅ **Build test successful**
  - Build completes in ~15s
  - Output: 282 KB main bundle (gzipped: 91 KB)
  - No errors or warnings

- ✅ **No backend files in frontend**
  - Clean Vite React structure
  - No Express/Node.js server code
  - Backend separated in `/backend` directory

---

## 🚀 Deployment Methods

### Method 1: GitHub Auto-Deploy (Recommended)

This is the easiest method - Vercel automatically deploys when you push to GitHub.

#### Step 1: Push to GitHub

```bash
# Ensure all changes are committed
git add .
git commit -m "feat: Prepare frontend for Vercel deployment"
git push origin main
```

#### Step 2: Connect to Vercel (First Time Only)

1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Click **"Import Git Repository"**
4. Select your GitHub repository
5. **Important Settings:**
   - **Framework Preset:** Vite
   - **Root Directory:** `.` (leave empty or set to root)
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `build`
6. Click **"Deploy"**

#### Step 3: Set Environment Variables

After the first deployment:

1. Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Add the following variables:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `VITE_API_URL` | `https://your-railway-backend.up.railway.app` | Production |
| `VITE_APP_NAME` | `Luma AI` | Production |
| `VITE_ENV` | `production` | Production |

> **Note:** Replace `your-railway-backend.up.railway.app` with your actual Railway backend URL after backend deployment.

3. Click **"Save"**
4. Go to **Deployments** → Latest deployment → **⋮ (three dots)** → **"Redeploy"**

#### Step 4: Future Deployments

Every push to `main` branch will automatically trigger a new deployment. No manual action needed!

---

### Method 2: Vercel CLI (Manual)

Use this method if you want to deploy directly from your VS Code terminal.

#### Step 1: Install Vercel CLI (if not already installed)

```bash
npm install -g vercel
```

Or use npx (no installation needed):

```bash
npx vercel --version
```

#### Step 2: Login to Vercel

```bash
npx vercel login
```

Follow the prompts to authenticate.

#### Step 3: Deploy to Production

```bash
# Deploy to production
npx vercel --prod

# Or if Vercel CLI is installed globally:
vercel deploy --prod
```

The CLI will:
1. Ask for project settings (first time only)
2. Build your project
3. Upload to Vercel
4. Return the deployment URL

#### Step 4: Set Environment Variables via CLI

```bash
# Set production environment variables
npx vercel env add VITE_API_URL production
# Enter value: https://your-railway-backend.up.railway.app

npx vercel env add VITE_APP_NAME production
# Enter value: Luma AI

npx vercel env add VITE_ENV production
# Enter value: production
```

Then redeploy:

```bash
npx vercel --prod
```

---

## 🔧 Environment Variables Configuration

### Required Variables

These variables **must** be set in Vercel for the frontend to work:

1. **VITE_API_URL**
   - **Purpose:** Backend API endpoint
   - **Local Dev:** `http://localhost:4000`
   - **Production:** `https://your-railway-backend.up.railway.app`
   - **Important:** Must match your Railway backend URL exactly

2. **VITE_APP_NAME** (Optional but recommended)
   - **Purpose:** Application name shown in UI
   - **Value:** `Luma AI`

3. **VITE_ENV** (Optional)
   - **Purpose:** Environment mode
   - **Values:** `development`, `staging`, `production`
   - **Production:** `production`

### How to Set Variables in Vercel Dashboard

**Visual Guide:**

1. **Navigate to Settings**
   ```
   Vercel Dashboard → [Your Project] → Settings → Environment Variables
   ```

2. **Add Each Variable**
   - Click **"Add New"**
   - **Name:** `VITE_API_URL`
   - **Value:** `https://your-railway-backend.up.railway.app`
   - **Environment:** Select **"Production"** (or all environments)
   - Click **"Save"**

3. **Repeat for all variables**

4. **Trigger Redeploy**
   ```
   Vercel Dashboard → Deployments → [Latest] → ⋮ → Redeploy
   ```

---

## 📡 After Backend Deployment

Once your Railway backend is deployed, you need to update the frontend to connect to it:

### Step 1: Get Railway Backend URL

After deploying the backend to Railway, you'll get a URL like:
```
https://luma-backend-production.up.railway.app
```

### Step 2: Update Vercel Environment Variables

1. Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Find `VITE_API_URL`
3. Click **"⋮"** → **"Edit"**
4. Update value to your Railway backend URL
5. Click **"Save"**

### Step 3: Redeploy Frontend

**Option A: Via Dashboard**
```
Vercel Dashboard → Deployments → [Latest] → ⋮ → Redeploy
```

**Option B: Via Git Push**
```bash
# Make a small change (like adding a comment) and push
git commit --allow-empty -m "chore: Trigger redeploy with updated API URL"
git push origin main
```

**Option C: Via CLI**
```bash
npx vercel --prod
```

---

## 🧪 Testing Deployment

### 1. Test Build Locally (Before Deploying)

```bash
# Build the project
npm run build

# Check build output
ls -la build/

# Expected output:
# - build/index.html
# - build/assets/ (JS and CSS files)
# - build/manifest.json
# - build/sw.js (service worker)
```

### 2. Test After Vercel Deployment

#### Check Deployment Status

1. Vercel Dashboard → Deployments
2. Latest deployment should show **"Ready"** status
3. Click deployment to see details

#### Test the Live Site

1. Visit your Vercel deployment URL (e.g., `https://luma-ai.vercel.app`)
2. Check browser console (F12) for errors
3. Try to login/register (will fail if backend not deployed yet - this is expected)
4. Verify UI loads correctly

#### Check API Connection

Open browser console and run:
```javascript
console.log('API URL:', import.meta.env.VITE_API_URL);
```

Expected output:
```
API URL: https://your-railway-backend.up.railway.app
```

If you see `undefined`, environment variables were not set correctly.

---

## 🔍 Troubleshooting

### Issue 1: "Failed to compile" during Vercel build

**Symptoms:** Build fails with TypeScript or Vite errors

**Solutions:**
1. Test build locally first: `npm run build`
2. Check Vercel build logs for specific errors
3. Verify all dependencies are in `package.json` (not just `devDependencies`)
4. Ensure Node.js version is compatible (Vercel uses Node 18+ by default)

### Issue 2: "Page not found" on refresh or direct URL access

**Symptoms:** App works on homepage, but refreshing or accessing `/dashboard` directly shows 404

**Solution:**
Check `vercel.json` has the rewrite rule:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This is already configured - if issue persists, check Vercel dashboard for any overrides.

### Issue 3: API calls failing with CORS errors

**Symptoms:** Browser console shows CORS errors when trying to call backend API

**Root Causes:**
1. Backend not deployed yet (expected - deploy backend first)
2. `VITE_API_URL` environment variable not set in Vercel
3. Backend CORS configuration doesn't include your Vercel domain

**Solutions:**
1. Verify `VITE_API_URL` is set in Vercel → Settings → Environment Variables
2. Check backend `CORS_ORIGINS` or `FRONTEND_URL` includes your Vercel domain
3. Redeploy both frontend and backend after updating CORS settings

### Issue 4: Environment variables not working

**Symptoms:** `import.meta.env.VITE_API_URL` returns `undefined`

**Solutions:**
1. **Variable names must start with `VITE_`** (Vite requirement)
2. Set variables in Vercel Dashboard → Environment Variables
3. **Important:** Redeploy after adding/changing environment variables
4. Check build logs - Vercel shows which env vars are available during build

### Issue 5: Build succeeds but app shows blank page

**Symptoms:** Deployment succeeds, but opening the URL shows a blank white page

**Solutions:**
1. Open browser console (F12) to see JavaScript errors
2. Common causes:
   - Missing environment variables
   - JavaScript errors in production build
   - Incorrect `base` path in `vite.config.ts`
3. Test production build locally:
   ```bash
   npm run build
   npx serve build
   ```
4. Check Vercel Function logs for runtime errors

---

## 📊 Deployment Commands Reference

### Quick Command Reference

```bash
# Local Development
npm run dev                      # Start dev server on http://localhost:3000

# Testing Build
npm run build                    # Build for production
npx serve build                  # Test production build locally

# Vercel CLI Deployment
npx vercel login                 # Login to Vercel (first time)
npx vercel                       # Deploy to preview
npx vercel --prod                # Deploy to production

# Environment Variables (CLI)
npx vercel env ls                # List all environment variables
npx vercel env add VAR_NAME      # Add new environment variable
npx vercel env rm VAR_NAME       # Remove environment variable

# Git Deployment
git add .
git commit -m "deploy: Update frontend"
git push origin main             # Triggers auto-deploy on Vercel
```

---

## 🔐 Security Notes

### Security Headers

The `vercel.json` configuration already includes security headers:

- **X-Content-Type-Options: nosniff** - Prevents MIME type sniffing
- **X-Frame-Options: DENY** - Prevents clickjacking
- **X-XSS-Protection: 1; mode=block** - Enables XSS filter
- **Referrer-Policy: strict-origin-when-cross-origin** - Controls referrer information

### Environment Variables Security

- ✅ **Do:** Store sensitive API keys in Vercel environment variables
- ❌ **Don't:** Commit `.env` or `.env.local` files to Git (already in `.gitignore`)
- ✅ **Do:** Use `VITE_` prefix for public variables (exposed to browser)
- ❌ **Don't:** Store backend secrets in frontend environment variables

---

## 📚 Additional Resources

### Vercel Documentation
- [Vite on Vercel](https://vercel.com/docs/frameworks/vite)
- [Environment Variables](https://vercel.com/docs/environment-variables)
- [Custom Domains](https://vercel.com/docs/custom-domains)

### Project Documentation
- [Backend Deployment Guide](BACKEND_DEPLOYMENT_READINESS.md)
- [Environment Variables Guide](ENVIRONMENT_VARIABLES_GUIDE.md)
- [Monitoring Guide](MONITORING_GUIDE.md)

---

## ✅ Post-Deployment Checklist

After deploying to Vercel, verify:

- [ ] Deployment status shows "Ready" in Vercel dashboard
- [ ] Can access the live URL without errors
- [ ] Browser console shows no critical errors (API errors expected if backend not deployed)
- [ ] Environment variables are set correctly (check browser console)
- [ ] App loads and shows UI correctly
- [ ] HTTPS is working (Vercel auto-configures SSL)
- [ ] After backend deployment:
  - [ ] Updated `VITE_API_URL` in Vercel
  - [ ] Redeployed frontend
  - [ ] Can login/register successfully
  - [ ] API calls work without CORS errors
  - [ ] All features functional

---

## 🎯 Next Steps

1. ✅ **Frontend deployment** (you are here)
2. ⏳ **Backend deployment** to Railway
   - See [BACKEND_DEPLOYMENT_READINESS.md](BACKEND_DEPLOYMENT_READINESS.md)
3. ⏳ **Update VITE_API_URL** with Railway backend URL
4. ⏳ **Update FRONTEND_URL** in Railway backend environment variables
5. ⏳ **Test full integration**
6. ⏳ **Monitor for 24-48 hours**
   - See [MONITORING_GUIDE.md](MONITORING_GUIDE.md)

---

**Ready to deploy!** Choose your deployment method above and follow the steps.

For questions or issues, check the troubleshooting section or refer to the Vercel documentation.
