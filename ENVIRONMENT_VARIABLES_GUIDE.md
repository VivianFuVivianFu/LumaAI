# Environment Variables Setup Guide

**Complete step-by-step guide for Railway and Vercel**

---

## 🚂 Railway - Setting Environment Variables

### Method 1: Railway Dashboard (Recommended)

#### For API Service

**Step 1: Navigate to Your Service**
1. Go to https://railway.app
2. Login to your account
3. Click on your project (e.g., "Luma Backend")
4. Click on the **API service** (the main backend service)

**Step 2: Open Variables Tab**
1. Click on the **"Variables"** tab (top menu)
2. You'll see a list of existing variables (if any)

**Step 3: Add Variables One by One**

Click **"+ New Variable"** button for each variable below:

```bash
# ==========================================
# DATABASE (Supabase)
# ==========================================
Name: SUPABASE_URL
Value: https://your-project.supabase.co
# (Get from: Supabase Dashboard → Settings → API → Project URL)

Name: SUPABASE_ANON_KEY
Value: your_anon_key_here
# (Get from: Supabase Dashboard → Settings → API → Project API keys → anon/public)

Name: SUPABASE_SERVICE_ROLE_KEY
Value: your_service_role_key_here
# (Get from: Supabase Dashboard → Settings → API → Project API keys → service_role)
# ⚠️ IMPORTANT: This is a secret key, never expose it!

# ==========================================
# OPENAI API
# ==========================================
Name: OPENAI_API_KEY
Value: sk-proj-your-openai-api-key-here
# (Get from: https://platform.openai.com/api-keys)

# ==========================================
# REDIS CACHE (NEW - Required for Memory System)
# ==========================================
Name: REDIS_URL
Value: redis://default:lUcNSQRWWmkhzGotKL57qVPGQnIMmDfP@redis-13610.c82.us-east-1-2.ec2.redns.redis-cloud.com:13610
# ✅ This is your Redis Cloud URL (already provided)

# ==========================================
# CORS (Frontend URL)
# ==========================================
Name: FRONTEND_URL
Value: https://your-app.vercel.app
# ⚠️ UPDATE THIS: Replace with your actual Vercel deployment URL
# Example: https://luma-ai.vercel.app

# ==========================================
# OPTIONAL: Langfuse (Observability)
# ==========================================
Name: LANGFUSE_SECRET_KEY
Value: sk-lf-your-secret-key
# (Leave empty to disable)

Name: LANGFUSE_PUBLIC_KEY
Value: pk-lf-your-public-key
# (Leave empty to disable)

Name: LANGFUSE_HOST
Value: https://cloud.langfuse.com
# (Leave empty to disable)

# ==========================================
# MEMORY SYSTEM CONFIGURATION
# ==========================================
# Master switch
Name: MEMORY_SYSTEM_ENABLED
Value: true

# AI enrichment (sentiment, themes, tags)
Name: MEMORY_ENRICHMENT_ENABLED
Value: true

# OpenAI embeddings (required for search)
Name: MEMORY_EMBEDDING_ENABLED
Value: true

# Relation detection (expensive - start disabled)
Name: MEMORY_RELATIONS_ENABLED
Value: false

# Context synthesis
Name: MEMORY_SYNTHESIS_ENABLED
Value: true

# Weekly summaries
Name: MEMORY_WEEKLY_SUMMARIES_ENABLED
Value: true

# Langfuse tracing (adds latency)
Name: MEMORY_LANGFUSE_ENABLED
Value: false

# Cache TTL (1 hour)
Name: MEMORY_CACHE_TTL_SECONDS
Value: 3600

# Max context blocks
Name: MEMORY_MAX_CONTEXT_BLOCKS
Value: 10

# Similarity threshold
Name: MEMORY_SIMILARITY_THRESHOLD
Value: 0.75

# Relation detection rate limit
Name: MEMORY_RELATION_DETECTION_RATE_LIMIT
Value: 5

# Batch size
Name: MEMORY_ENRICHMENT_BATCH_SIZE
Value: 10

# Fail fast mode
Name: MEMORY_FAIL_FAST
Value: false

# Retry attempts
Name: MEMORY_RETRY_ATTEMPTS
Value: 3

# Retry backoff
Name: MEMORY_RETRY_BACKOFF_MS
Value: 1000

# ==========================================
# WORKER CONFIGURATION
# ==========================================
Name: MEMORY_WORKER_ENABLED
Value: true

Name: MEMORY_WORKER_POLL_INTERVAL_MS
Value: 1000

Name: MEMORY_WORKER_MAX_CONCURRENT_JOBS
Value: 5

Name: MEMORY_WORKER_JOB_TIMEOUT_MS
Value: 30000

Name: MEMORY_WORKER_HEALTH_CHECK_INTERVAL_MS
Value: 60000
```

**Step 4: Save and Deploy**
- Click **"Deploy"** button (top right)
- Or changes auto-deploy after a few seconds
- Watch the deployment logs

---

#### For Worker Service (NEW Service to Create)

**Step 1: Create New Service**
1. In your Railway project, click **"+ New"** → **"Service"**
2. Select **"GitHub Repo"**
3. Choose your repository: `VivianFuVivianFu/LumaAI`
4. Click **"Add Service"**

**Step 2: Configure Worker Service**
1. Service name: `luma-memory-worker`
2. Click on the service → **"Settings"** tab
3. Set **Root Directory**: `backend`
4. Set **Builder**: `DOCKERFILE`
5. Set **Dockerfile Path**: `Dockerfile.worker`

**Step 3: Copy All Variables from API Service**

**Easy Method:**
1. Go to your **API service** → **Variables** tab
2. Click **"⋮" menu** (three dots) → **"Raw Editor"**
3. **Copy all the text**
4. Go to **Worker service** → **Variables** tab
5. Click **"⋮" menu** → **"Raw Editor"**
6. **Paste** the copied text
7. Click **"Update Variables"**

**Or Add Manually:**
- Repeat all the same variables as API service above
- Worker needs access to same database, Redis, OpenAI, etc.

**Step 4: Deploy Worker**
- Click **"Deploy"** button
- Worker will build using `Dockerfile.worker`
- Check logs for: `🚀 Memory Worker Starting...`

---

### Method 2: Railway CLI (Alternative)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Set variables (one at a time)
railway variables set REDIS_URL="redis://default:lUcNSQRWWmkhzGotKL57qVPGQnIMmDfP@redis-13610.c82.us-east-1-2.ec2.redns.redis-cloud.com:13610"
railway variables set MEMORY_SYSTEM_ENABLED="true"
railway variables set FRONTEND_URL="https://your-app.vercel.app"

# Or use .env file
railway variables set --from .env
```

---

## 🔺 Vercel - Setting Environment Variables

### Method 1: Vercel Dashboard (Recommended)

**Step 1: Navigate to Your Project**
1. Go to https://vercel.com
2. Login to your account
3. Click on your project (e.g., "luma-ai" or "Figma")

**Step 2: Open Environment Variables**
1. Click **"Settings"** (top menu)
2. Click **"Environment Variables"** (left sidebar)

**Step 3: Add Variables**

For each variable, click **"Add New"**:

**Variable 1: API URL (CRITICAL)**
```
Name: VITE_API_URL
Value: https://your-railway-backend.railway.app/api/v1
```
⚠️ **IMPORTANT:**
- Replace `your-railway-backend` with your actual Railway domain
- Get this from: Railway Dashboard → API Service → Settings → Domain
- Must include `/api/v1` at the end
- Example: `https://luma-backend-production.up.railway.app/api/v1`

**Select Environments:**
- ✅ Production (required)
- ✅ Preview (recommended)
- ⬜ Development (optional)

**Variable 2: Environment** (optional)
```
Name: VITE_APP_ENVIRONMENT
Value: production
```
Select: Production only

**Variable 3: Debug Logging** (optional)
```
Name: VITE_ENABLE_DEBUG_LOGGING
Value: false
```
Select: Production only

**Step 4: Redeploy**
- After adding variables, click **"Redeploy"** on your latest deployment
- Or push a new commit to trigger deployment
- Environment variables take effect on next deployment

---

### Method 2: Vercel CLI (Alternative)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link to your project
vercel link

# Add environment variable
vercel env add VITE_API_URL production
# Then paste your Railway API URL when prompted

# Or add from .env file
vercel env pull .env.production
```

---

### Finding Your Railway API URL

**Method 1: Railway Dashboard**
1. Go to Railway project
2. Click on your **API service**
3. Click **"Settings"** tab
4. Scroll to **"Domains"** section
5. Copy the generated domain (e.g., `luma-backend-production.up.railway.app`)
6. Add `/api/v1` to the end
7. Full URL: `https://luma-backend-production.up.railway.app/api/v1`

**Method 2: From Deployment**
1. Railway → API Service → **"Deployments"** tab
2. Click on latest deployment
3. Look for **"Service URL"** in the logs
4. Add `/api/v1` to the end

---

## ✅ Verification Checklist

### Railway Variables - Verify Set Correctly

**Check in Dashboard:**
1. Railway → API Service → Variables tab
2. You should see ~30 variables
3. Critical ones to verify:
   - ✅ `REDIS_URL` starts with `redis://`
   - ✅ `SUPABASE_URL` starts with `https://`
   - ✅ `OPENAI_API_KEY` starts with `sk-`
   - ✅ `FRONTEND_URL` matches your Vercel URL
   - ✅ `MEMORY_SYSTEM_ENABLED` = `true`
   - ✅ `MEMORY_WORKER_ENABLED` = `true`

**Check Worker Has Same Variables:**
1. Railway → Worker Service → Variables tab
2. Should have the same ~30 variables as API service

### Vercel Variables - Verify Set Correctly

**Check in Dashboard:**
1. Vercel → Project → Settings → Environment Variables
2. You should see at least 1 critical variable:
   - ✅ `VITE_API_URL` ends with `/api/v1`
   - ✅ Points to your Railway domain
   - ✅ Applied to "Production" environment

**Test in Build Logs:**
1. Vercel → Deployments → Latest deployment
2. Click **"View Function Logs"** or **"Build Logs"**
3. Search for `VITE_API_URL`
4. Should show your Railway URL (not undefined)

---

## 🔧 Troubleshooting

### Railway Issues

**Problem: "Variable not found" in logs**
```bash
# Solution: Make sure variable is set
Railway Dashboard → Service → Variables → Check variable exists
```

**Problem: "Redis connection failed"**
```bash
# Solution: Verify REDIS_URL format
# Should be: redis://default:password@host:port
# Check for typos in password
```

**Problem: "CORS error" in frontend**
```bash
# Solution: Check FRONTEND_URL in Railway
# Must exactly match your Vercel URL (including https://)
Railway → API Service → Variables → FRONTEND_URL
```

### Vercel Issues

**Problem: "API_BASE_URL is undefined"**
```bash
# Solution: Check VITE_API_URL is set
Vercel → Settings → Environment Variables → VITE_API_URL

# Must start with VITE_ prefix for Vite to pick it up
```

**Problem: "Changes not taking effect"**
```bash
# Solution: Redeploy after changing env vars
Vercel → Deployments → Latest → Redeploy
```

**Problem: "CORS error when calling API"**
```bash
# Solution: Make sure Railway FRONTEND_URL matches Vercel URL exactly
# Check in browser console for the exact error
```

---

## 🎯 Quick Test After Setting Variables

### Test Railway API

```bash
# Health check (replace with your Railway domain)
curl https://your-railway-api.railway.app/api/v1/health

# Expected response:
{
  "success": true,
  "data": {
    "message": "Luma API is running",
    "timestamp": "2025-10-18T..."
  }
}
```

### Test Vercel Frontend

1. Open your Vercel URL in browser
2. Open browser console (F12)
3. Go to **Network** tab
4. Try to login or register
5. Look for API calls - should go to your Railway domain
6. **No CORS errors** should appear

### Test Integration

1. Login to your Vercel app
2. Create a new chat message
3. Check Railway Worker logs for:
   ```
   ✅ Job completed: enrich_and_embed (2345ms)
   ```
4. Check Supabase:
   ```sql
   SELECT * FROM memory_jobs ORDER BY created_at DESC LIMIT 5;
   ```

---

## 📝 Summary

**Railway Environment Variables:**
- Set in: Railway Dashboard → Service → Variables
- ~30 variables total
- Most critical: REDIS_URL, FRONTEND_URL, SUPABASE keys, OPENAI key
- Copy same variables to Worker service

**Vercel Environment Variables:**
- Set in: Vercel Dashboard → Settings → Environment Variables
- 1 critical variable: VITE_API_URL
- Must start with `VITE_` prefix
- Points to Railway API URL + `/api/v1`

**After Setting:**
- Redeploy both services
- Test health endpoints
- Check logs for connection confirmations
- Verify no CORS errors

---

**You're ready to set your environment variables!** 🚀
