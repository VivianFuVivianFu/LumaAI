# 🚀 Quick Start Deployment Guide

**Get your Luma AI app deployed in 5 steps**

---

## Step 1: Database Migration (5 minutes)

### What to do:
1. Open **Supabase Dashboard**: https://app.supabase.com
2. Select your project
3. Click **"SQL Editor"** → **"New query"**
4. Copy contents of: `backend/database/migrations/memory-async-refactor.sql`
5. Paste and click **"Run"**

### Expected result:
```
NOTICE: Memory system async refactor migration completed successfully
NOTICE: Tables created: memory_jobs, memory_rate_limits
```

✅ **Done! Database is ready**

---

## Step 2: Railway Backend (10 minutes)

### 2A: Set Environment Variables

1. Go to **Railway Dashboard**: https://railway.app
2. Click your project → **API Service** → **"Variables"** tab
3. Click **"+ New Variable"** and add these critical variables:

**Critical Variables (Must Set):**
```bash
REDIS_URL=redis://default:lUcNSQRWWmkhzGotKL57qVPGQnIMmDfP@redis-13610.c82.us-east-1-2.ec2.redns.redis-cloud.com:13610

FRONTEND_URL=https://your-app.vercel.app
(Replace with your actual Vercel URL once deployed)

MEMORY_SYSTEM_ENABLED=true
MEMORY_ENRICHMENT_ENABLED=true
MEMORY_EMBEDDING_ENABLED=true
MEMORY_RELATIONS_ENABLED=false
MEMORY_WORKER_ENABLED=true
MEMORY_LANGFUSE_ENABLED=false
MEMORY_FAIL_FAST=false
```

📖 **Full list:** See [ENVIRONMENT_VARIABLES_GUIDE.md](ENVIRONMENT_VARIABLES_GUIDE.md)

4. Click **"Deploy"** (auto-deploys from GitHub)

### 2B: Create Worker Service (NEW)

1. Railway project → **"+ New"** → **"Service"**
2. Select **"GitHub Repo"** → Your repository
3. Service name: `luma-memory-worker`
4. Settings:
   - Root Directory: `backend`
   - Builder: `DOCKERFILE`
   - Dockerfile Path: `Dockerfile.worker`
5. **Variables tab** → Copy all variables from API service
   - Easiest: API Service → Variables → ⋮ menu → "Raw Editor" → Copy
   - Worker Service → Variables → ⋮ menu → "Raw Editor" → Paste
6. Click **"Deploy"**

### Expected result:
**API Service logs:**
```
✅ Server running on port 4000
✅ Redis connected
✅ Database connected
```

**Worker Service logs:**
```
🚀 Memory Worker Starting...
📊 Worker Health Check
```

✅ **Done! Backend is running**

---

## Step 3: Vercel Frontend (5 minutes)

### What to do:

1. Go to **Vercel Dashboard**: https://vercel.com
2. Click your project → **"Settings"** → **"Environment Variables"**
3. Click **"Add New"**

**Add this variable:**
```
Name: VITE_API_URL
Value: https://your-railway-api.railway.app/api/v1

Environments: ✅ Production  ✅ Preview
```

💡 **How to find your Railway API URL:**
- Railway → API Service → Settings → Domains
- Copy the domain and add `/api/v1`
- Example: `https://luma-backend-production.up.railway.app/api/v1`

4. Go to **"Deployments"** tab
5. Click latest deployment → **"Redeploy"**

### Expected result:
```
✅ Build completed
✅ Deployed to: https://your-app.vercel.app
```

✅ **Done! Frontend is live**

---

## Step 4: Update CORS (2 minutes)

Now that you have your Vercel URL, update Railway:

1. **Railway** → API Service → **Variables**
2. Find `FRONTEND_URL`
3. Update to your actual Vercel URL: `https://your-app.vercel.app`
4. Service auto-redeploys

✅ **Done! CORS configured**

---

## Step 5: Verify Everything Works (5 minutes)

### Test 1: API Health
```bash
# Replace with your Railway URL
curl https://your-railway-api.railway.app/api/v1/health
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "message": "Luma API is running",
    "timestamp": "2025-10-18T..."
  }
}
```

### Test 2: Frontend Connection

1. Open your Vercel URL in browser
2. Press **F12** → **Console** tab
3. Create account or login
4. Check console for errors

**Expected:**
- ✅ No CORS errors
- ✅ API calls succeed
- ✅ Can use all features

### Test 3: Memory System

1. Create a chat message
2. **Railway** → Worker Service → **Logs**

**Expected:**
```
✅ Job completed: enrich_and_embed (2345ms)
```

3. **Supabase** → SQL Editor:
```sql
SELECT * FROM memory_jobs ORDER BY created_at DESC LIMIT 5;
```

**Expected:**
- See jobs with status: `completed`

✅ **Done! Everything is working**

---

## 🎉 You're Live!

### What to monitor next 24-48 hours:

**Every Hour (First 6 Hours):**
- Railway API logs - any errors?
- Railway Worker logs - processing jobs?
- Your app in browser - everything works?

**Every 6 Hours (Next 18 Hours):**
- Railway Metrics - CPU/Memory stable?
- Supabase - Jobs completing successfully?

📖 **Full monitoring guide:** [MONITORING_GUIDE.md](MONITORING_GUIDE.md)

---

## 🆘 Quick Troubleshooting

### Problem: "CORS error" in browser

**Solution:**
1. Railway → API Service → Variables → `FRONTEND_URL`
2. Make sure it exactly matches your Vercel URL
3. Restart service

---

### Problem: Worker not processing jobs

**Solution:**
1. Railway → Worker Service → Logs
2. Check for errors
3. Verify all environment variables are set
4. Restart service

---

### Problem: API can't connect to Redis

**Solution:**
1. Railway → API Service → Variables
2. Check `REDIS_URL` is correct
3. Should start with: `redis://default:`

---

### Problem: Frontend shows "API_BASE_URL is undefined"

**Solution:**
1. Vercel → Settings → Environment Variables
2. Check `VITE_API_URL` is set
3. Must start with `VITE_` prefix
4. Redeploy

---

## 📚 Documentation Index

**Setup Guides:**
- 📖 [ENVIRONMENT_VARIABLES_GUIDE.md](ENVIRONMENT_VARIABLES_GUIDE.md) - Detailed env var setup
- 📖 [DEPLOYMENT_READINESS_AUDIT.md](DEPLOYMENT_READINESS_AUDIT.md) - Complete audit report

**Operations:**
- 📊 [MONITORING_GUIDE.md](MONITORING_GUIDE.md) - 24-48 hour monitoring
- 🚀 [DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md) - Quick reference

**Technical Details:**
- 🔧 [backend/MEMORY_ASYNC_DEPLOYMENT.md](backend/MEMORY_ASYNC_DEPLOYMENT.md) - Memory system
- 🚂 [backend/RAILWAY_DEPLOYMENT.md](backend/RAILWAY_DEPLOYMENT.md) - Railway details

---

## ✅ Deployment Checklist

Use this to track your progress:

- [ ] Step 1: Database migration completed
- [ ] Step 2A: Railway API variables set
- [ ] Step 2B: Railway Worker created
- [ ] Step 3: Vercel variables set
- [ ] Step 4: CORS updated with Vercel URL
- [ ] Step 5: All tests passed
- [ ] Monitoring: Set up UptimeRobot (optional)
- [ ] Monitoring: First 6 hours complete
- [ ] Monitoring: First 24 hours complete
- [ ] Monitoring: 48 hours stable
- [ ] Decision: Production ready! 🎉

---

## 🎯 Success Metrics

**After 24 hours, you should see:**

| Metric | Target | Status |
|--------|--------|--------|
| API Uptime | > 99.5% | ___ |
| Job Success Rate | > 95% | ___ |
| API Response Time | < 200ms | ___ |
| Frontend Load Time | < 3s | ___ |
| User Complaints | 0 | ___ |

**If all targets met → Success!** 🎉

---

## 💡 Pro Tips

1. **Use UptimeRobot** (free) to monitor your API automatically
   - Get email if it goes down
   - Setup: https://uptimerobot.com

2. **Bookmark your dashboards:**
   - Railway API: `railway.app/project/your-project/service/api`
   - Railway Worker: `railway.app/project/your-project/service/worker`
   - Vercel: `vercel.com/your-username/your-project`
   - Supabase: `app.supabase.com/project/your-project`

3. **Keep these SQL queries handy:**
   ```sql
   -- Job health
   SELECT * FROM get_memory_job_stats();

   -- Failed jobs
   SELECT * FROM memory_jobs WHERE status = 'failed' LIMIT 10;
   ```

4. **Check logs regularly:**
   - Railway: Real-time logs show what's happening
   - Browser console: Shows frontend errors
   - Supabase: Shows database activity

---

## 🚨 Emergency Rollback

If something goes wrong and you need to rollback:

**Quick Disable Memory System:**
```
Railway → API Service → Variables
Set: MEMORY_SYSTEM_ENABLED=false
Restart service
```

**Full Rollback:**
```
Railway Dashboard → Deployments → Previous → Redeploy
Vercel Dashboard → Deployments → Previous → Promote
```

---

**Ready to deploy?** Follow the 5 steps above! 🚀

**Need help?** Check the detailed guides linked above.

**Questions?** Review [DEPLOYMENT_READINESS_AUDIT.md](DEPLOYMENT_READINESS_AUDIT.md) sections 5-9.
