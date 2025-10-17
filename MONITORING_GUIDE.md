# 24-48 Hour Monitoring Guide

**Complete guide for monitoring your deployment after going live**

---

## 📊 Overview

After deploying, you should monitor your application for 24-48 hours to ensure:
- All services are running smoothly
- No unexpected errors
- Performance is as expected
- Memory system is working correctly

---

## 🎯 What to Monitor

### Critical Metrics (Check Every Hour - First 6 Hours)
1. Service uptime (Railway + Vercel)
2. Error rates in logs
3. API response times
4. Memory job completion rate
5. User-facing functionality

### Important Metrics (Check Every 6 Hours - Next 18 Hours)
1. Cache hit rates
2. Database query performance
3. OpenAI API usage/costs
4. Redis memory usage
5. Worker job queue length

### Nice-to-Have Metrics (Check Daily - Days 2-7)
1. User engagement
2. Feature usage patterns
3. Cost optimization opportunities
4. Performance trends

---

## 🚂 Railway Monitoring

### Method 1: Railway Dashboard (Primary Tool)

#### Access Logs

**Step 1: Navigate to Service**
1. Go to https://railway.app
2. Login and select your project
3. Click on **API Service**

**Step 2: View Logs**
1. Click on **"Deployments"** tab
2. Click on the latest deployment (green "Active" badge)
3. You'll see real-time logs scrolling

**What to Look For in API Service Logs:**

**✅ Good Signs (First 5 Minutes):**
```bash
✅ Server running on port 4000
✅ Redis connected successfully
✅ Database connected
✅ Health check endpoint registered: /api/v1/health
```

**✅ During Normal Operation:**
```bash
# API requests
GET /api/v1/health - 200 OK
POST /api/v1/auth/login - 200 OK
POST /api/v1/chat/:id/messages - 200 OK

# Memory cache hits (good!)
✅ Cache hit for context: context:user123:chat:general

# Memory cache misses (normal for first requests)
⚠️ Cache miss for context: context:user456:chat:mood
```

**❌ Warning Signs:**
```bash
# Connection errors
❌ Redis connection failed: ECONNREFUSED
❌ Database connection timeout

# API errors
Error: CORS not allowed for origin: https://wrong-url.com
Error: Authentication failed
Error: OpenAI API rate limit exceeded

# Memory system errors
❌ Memory enrichment failed: OpenAI API error
❌ Job queue error: Database connection lost
```

---

#### Worker Service Logs

**Step 1: Navigate to Worker**
1. Railway project → **Worker Service**
2. Click **"Deployments"** tab
3. Click latest deployment

**What to Look For in Worker Logs:**

**✅ Good Signs (Startup):**
```bash
🚀 Memory Worker Starting...
================================
System Configuration:
  - System Enabled: true
  - Enrichment: true
  - Embedding: true
  - Relations: false
  - Synthesis: true
  - Worker: true
================================
✅ Database connected
✅ Redis connected
📊 Worker Health Check
  ⏰ Uptime: 60s
  🔄 Processing: 2 jobs
  📋 Queue Stats: { pending: 5, processing: 2, completed: 15, failed: 0 }
```

**✅ During Normal Operation:**
```bash
# Job processing
🔄 Processing job: enrich_and_embed (ID: abc123)
✅ Enriched and embedded block def456
✅ Job completed: enrich_and_embed (2345ms)

# Health checks (every 60 seconds)
📊 Worker Health Check
  ⏰ Uptime: 3600s
  🔄 Processing: 1 jobs
  📋 Queue Stats: { pending: 3, processing: 1, completed: 247, failed: 5 }
🧹 Cleaned up 10 old jobs
```

**❌ Warning Signs:**
```bash
# Job failures
❌ Job failed: enrich_and_embed - OpenAI API timeout
⛔ Job abc123 exceeded max attempts, will not retry

# Connection issues
❌ Database connection lost
❌ Redis unavailable

# Performance issues
⚠️ Job timeout after 30000ms
⚠️ Queue has 100+ pending jobs (backlog building up)
```

---

#### Railway Metrics Dashboard

**Step 1: Access Metrics**
1. Railway → Service → **"Metrics"** tab
2. You'll see graphs for:
   - CPU usage
   - Memory usage
   - Network traffic

**What to Look For:**

**CPU Usage:**
- ✅ API: Should be < 50% most of the time
- ✅ Worker: Can spike to 80-100% when processing jobs (normal)
- ❌ Sustained 100% CPU = may need to scale up

**Memory Usage:**
- ✅ API: Should be stable around 100-300 MB
- ✅ Worker: Should be stable around 200-400 MB
- ❌ Constantly growing = memory leak (restart service)

**Network:**
- ✅ Steady in/out traffic during usage
- ❌ Sudden spike = possible attack or bug

---

### Method 2: Railway CLI (Advanced)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and link
railway login
railway link

# View live logs (API service)
railway logs

# View logs for specific service
railway logs --service luma-memory-worker

# Follow logs in real-time
railway logs --follow
```

---

## 🔺 Vercel Monitoring

### Method 1: Vercel Dashboard (Primary Tool)

#### Access Logs

**Step 1: Navigate to Deployments**
1. Go to https://vercel.com
2. Click your project
3. Click **"Deployments"** tab
4. Click on latest deployment (green "Ready" badge)

**Step 2: View Function Logs**
1. Click **"Functions"** tab (or "Runtime Logs")
2. You'll see logs from serverless functions (if any)

**What to Look For:**

**✅ Good Signs:**
```bash
# Successful builds
✅ Build completed in 45s
✅ Output: 2.3 MB

# No errors during build
✅ No warnings or errors
```

**❌ Warning Signs:**
```bash
# Build errors
❌ Build failed: Module not found
❌ Environment variable VITE_API_URL is undefined

# Runtime errors (check browser console instead)
```

---

#### Vercel Analytics (If Enabled)

**Step 1: Access Analytics**
1. Vercel → Project → **"Analytics"** tab
2. View metrics for:
   - Page views
   - Unique visitors
   - Top pages
   - Performance metrics

**What to Look For:**
- ✅ Page load time < 3 seconds
- ✅ Core Web Vitals in "Good" range
- ❌ High bounce rate = possible UX issue

---

### Method 2: Browser DevTools (Most Important for Frontend!)

**Step 1: Open Your Site**
1. Open your Vercel URL in browser
2. Press **F12** to open DevTools

**Step 2: Check Console Tab**

**✅ Good Signs:**
```bash
# No errors
# Clean console or only minor warnings
```

**❌ Warning Signs:**
```bash
# API connection errors
❌ Failed to fetch: https://your-api.railway.app/api/v1/...
❌ CORS policy: No 'Access-Control-Allow-Origin' header

# Environment variable issues
❌ API_BASE_URL is undefined

# React errors
❌ Uncaught TypeError: Cannot read property 'x' of undefined
```

**Step 3: Check Network Tab**

1. Click **"Network"** tab
2. Refresh the page
3. Filter by **"XHR"** or **"Fetch"** to see API calls

**✅ Good Signs:**
```bash
# API calls succeed
GET /api/v1/health - Status: 200 OK (50ms)
POST /api/v1/auth/login - Status: 200 OK (350ms)
POST /api/v1/chat/abc/messages - Status: 200 OK (2.1s)
```

**❌ Warning Signs:**
```bash
# Failed requests
POST /api/v1/auth/login - Status: 401 Unauthorized
GET /api/v1/health - Status: 0 (CORS error)
POST /api/v1/chat/abc/messages - Status: 500 Internal Server Error
```

---

## 🗄️ Database Monitoring (Supabase)

### Method 1: Supabase Dashboard

**Step 1: Access Database**
1. Go to https://app.supabase.com
2. Select your project
3. Click **"Database"** (left sidebar)

**Step 2: Check Table Statistics**

Click **"Table Editor"** → Select tables to check:

**memory_blocks:**
```sql
-- Check total blocks created
SELECT COUNT(*) as total_blocks FROM memory_blocks;

-- Check status distribution
SELECT status, COUNT(*) as count
FROM memory_blocks
GROUP BY status;

-- Expected:
-- status: 'active' - most blocks
-- status: 'pending_enrichment' - some blocks (being processed)
-- status: 'failed' - very few (< 5%)
```

**memory_jobs:**
```sql
-- Check job queue health
SELECT * FROM get_memory_job_stats();

-- Expected output:
-- pending: 0-10 (low number = worker keeping up)
-- processing: 1-5 (worker actively processing)
-- completed: growing number (good!)
-- failed: < 5% of completed (acceptable)
```

**Step 3: Check Recent Failed Jobs**
```sql
SELECT
  id,
  job_type,
  error_message,
  attempts,
  created_at
FROM memory_jobs
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 10;
```

**✅ Good Signs:**
- Failed jobs < 5% of total
- Error messages are transient (timeouts, rate limits)
- No recurring pattern of failures

**❌ Warning Signs:**
- Failed jobs > 20% of total
- Same error message repeating
- All jobs failing (system issue)

---

### Method 2: SQL Editor Queries

**Step 1: Open SQL Editor**
1. Supabase → **"SQL Editor"** (left sidebar)
2. Click **"New query"**

**Monitoring Queries:**

**Query 1: Job Queue Health (Run Every Hour)**
```sql
-- Overall job statistics
SELECT
  status,
  COUNT(*) as count,
  AVG(processing_time_ms)::INTEGER as avg_time_ms
FROM memory_jobs
GROUP BY status
ORDER BY status;
```

**Query 2: Recent Job Activity (Run Every 6 Hours)**
```sql
-- Jobs created in last 6 hours
SELECT
  DATE_TRUNC('hour', created_at) as hour,
  job_type,
  status,
  COUNT(*) as count
FROM memory_jobs
WHERE created_at > NOW() - INTERVAL '6 hours'
GROUP BY hour, job_type, status
ORDER BY hour DESC, job_type;
```

**Query 3: Failed Jobs Analysis (Run Daily)**
```sql
-- Common failure reasons
SELECT
  error_message,
  COUNT(*) as occurrences,
  MAX(created_at) as last_occurrence
FROM memory_jobs
WHERE status = 'failed'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY error_message
ORDER BY occurrences DESC
LIMIT 10;
```

**Query 4: Memory Block Enrichment Status (Run Daily)**
```sql
-- How many blocks are stuck in pending?
SELECT
  status,
  COUNT(*) as count,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM memory_blocks
GROUP BY status;
```

**❌ Warning: If "pending_enrichment" count keeps growing:**
- Worker may be down
- Worker may be overwhelmed
- Check worker logs immediately

---

## 📈 Monitoring Schedule

### First 6 Hours (Critical Period)

**Every Hour:**
- [ ] Check Railway API logs - Any errors?
- [ ] Check Railway Worker logs - Processing jobs?
- [ ] Check Vercel deployment - Still "Ready"?
- [ ] Test frontend in browser - Everything works?
- [ ] Quick Supabase check - Jobs completing?

**Use This Checklist:**
```bash
Hour 1: ✅ All green
Hour 2: ✅ All green
Hour 3: ⚠️ 3 failed jobs (investigated - OpenAI timeout, retried successfully)
Hour 4: ✅ All green
Hour 5: ✅ All green
Hour 6: ✅ All green - Looks stable!
```

---

### Hours 7-24 (Monitoring Period)

**Every 6 Hours:**
- [ ] Railway metrics - CPU/Memory stable?
- [ ] Worker health check logs - Queue healthy?
- [ ] Supabase - Run monitoring queries
- [ ] Check costs - OpenAI, Railway, Redis usage
- [ ] User feedback - Any complaints?

---

### Hours 25-48 (Stabilization Period)

**Twice Daily (Morning & Evening):**
- [ ] Quick log check - Any new error patterns?
- [ ] Database queries - Job queue healthy?
- [ ] Performance check - Response times good?
- [ ] Cost tracking - Within budget?

---

## 🔔 Setting Up Alerts (Optional but Recommended)

### Railway Alerts

**Built-in Alerts (Coming Soon):**
Railway is adding alerting features. For now, manual monitoring.

**Workaround: Use UptimeRobot (Free)**

1. Sign up at https://uptimerobot.com (free tier)
2. Add monitor:
   - **Type:** HTTP(s)
   - **URL:** `https://your-railway-api.railway.app/api/v1/health`
   - **Interval:** 5 minutes
   - **Alert Contacts:** Your email
3. Get email if API goes down

---

### Vercel Alerts

**Built-in Alerts:**
1. Vercel → Project → **"Settings"** → **"Notifications"**
2. Enable:
   - ✅ Deployment Failed
   - ✅ Deployment Ready (optional)
3. Add your email

---

### Supabase Alerts

**Database Performance Alerts:**
1. Supabase → Project → **"Settings"** → **"Billing"**
2. Set spending limit alerts
3. Get notified if usage spikes

---

## 📊 Using Monitoring Tools

### Tool 1: UptimeRobot (Free - Recommended)

**Setup:**
1. Go to https://uptimerobot.com
2. Sign up (free tier: 50 monitors)
3. Create monitor:
   ```
   Monitor Type: HTTP(s)
   Friendly Name: Luma API Health
   URL: https://your-api.railway.app/api/v1/health
   Monitoring Interval: 5 minutes
   ```
4. Add alert contact (email)

**Benefits:**
- ✅ Email alerts if API goes down
- ✅ Uptime statistics
- ✅ Response time tracking
- ✅ Free for basic monitoring

---

### Tool 2: Better Stack (Free Tier Available)

**Setup:**
1. Go to https://betterstack.com
2. Sign up for free tier
3. Create uptime monitor
4. Add log collection (optional)

**Benefits:**
- ✅ More detailed monitoring
- ✅ Incident management
- ✅ Status page
- ✅ Log aggregation

---

### Tool 3: Sentry (Error Tracking - Optional)

**Setup for Frontend:**
1. Sign up at https://sentry.io
2. Create project (React)
3. Install package:
   ```bash
   npm install @sentry/react
   ```
4. Add to your app (only if you want error tracking)

**Benefits:**
- ✅ Automatic error reporting
- ✅ Stack traces
- ✅ User context
- ✅ Performance monitoring

---

## 📝 Monitoring Checklist Template

**Copy this and fill it out each day:**

### Day 1 - Hour-by-Hour

```markdown
## Hour 1 (9:00 AM)
- [ ] Railway API: ✅ Running, no errors
- [ ] Railway Worker: ✅ Processing jobs
- [ ] Vercel: ✅ Deployed and ready
- [ ] Browser test: ✅ Login works, chat works
- [ ] Supabase: ✅ Jobs completing
- Notes: All systems green

## Hour 2 (10:00 AM)
- [ ] Railway API: ___
- [ ] Railway Worker: ___
- [ ] Vercel: ___
- [ ] Browser test: ___
- [ ] Supabase: ___
- Notes: ___

[Continue for first 6 hours...]
```

---

### Day 1 - 6-Hour Blocks

```markdown
## Morning Check (10:00 AM)
- [ ] All services running
- [ ] Error rate: ___%
- [ ] Job completion rate: ___%
- [ ] Response times: API ___ ms, Frontend ___ s
- [ ] Issues found: ___
- [ ] Action taken: ___

## Afternoon Check (4:00 PM)
- [ ] All services running
- [ ] Error rate: ___%
- [ ] Job completion rate: ___%
- [ ] Response times: API ___ ms, Frontend ___ s
- [ ] Issues found: ___
- [ ] Action taken: ___

## Evening Check (10:00 PM)
- [ ] All services running
- [ ] Error rate: ___%
- [ ] Job completion rate: ___%
- [ ] Response times: API ___ ms, Frontend ___ s
- [ ] Issues found: ___
- [ ] Action taken: ___
```

---

### Day 2 - Morning & Evening

```markdown
## Day 2 Morning (9:00 AM)
- [ ] Services: ___
- [ ] 24h job stats: ___
- [ ] Errors: ___
- [ ] Performance: ___
- [ ] Costs (estimated): ___
- [ ] User feedback: ___

## Day 2 Evening (9:00 PM)
- [ ] Services: ___
- [ ] Total jobs (48h): ___
- [ ] Error patterns: ___
- [ ] Performance trends: ___
- [ ] Decision: Continue monitoring / Adjust / Rollback
```

---

## 🎯 Success Metrics (24-48 Hours)

**After 24 hours, you should see:**

| Metric | Target | How to Check |
|--------|--------|--------------|
| API Uptime | > 99.5% | Railway logs, UptimeRobot |
| Worker Uptime | > 99% | Railway worker logs |
| Job Success Rate | > 95% | Supabase query |
| API Response Time | < 200ms | Railway metrics, Network tab |
| Frontend Load Time | < 3s | Vercel analytics, DevTools |
| Failed Jobs | < 5% | Supabase query |
| Cache Hit Rate | > 30% | API logs (search "Cache hit") |
| User Complaints | 0 | User feedback |

**If all targets are met → Deployment successful!** 🎉

**If any target missed → Investigate and fix before week 2**

---

## 🚨 Common Issues & Quick Fixes

### Issue 1: Worker Not Processing Jobs

**Symptoms:**
- Pending jobs keep growing
- No "Job completed" in worker logs

**Check:**
```sql
SELECT COUNT(*) FROM memory_jobs WHERE status = 'pending';
-- If > 20, worker may be stuck
```

**Fix:**
1. Railway → Worker Service → **Restart**
2. Check logs for startup errors
3. Verify environment variables set

---

### Issue 2: High Error Rate

**Symptoms:**
- Many failed jobs (> 10%)
- Repeated error messages

**Check:**
```sql
SELECT error_message, COUNT(*)
FROM memory_jobs
WHERE status = 'failed'
GROUP BY error_message;
```

**Common Fixes:**
- OpenAI timeout → Increase `MEMORY_WORKER_JOB_TIMEOUT_MS`
- Rate limit → Reduce `MEMORY_WORKER_MAX_CONCURRENT_JOBS`
- Connection error → Check Redis/Supabase credentials

---

### Issue 3: CORS Errors

**Symptoms:**
- Browser console shows CORS error
- API calls fail with status 0

**Check:**
- Railway → Variables → `FRONTEND_URL`
- Must exactly match Vercel URL

**Fix:**
```bash
# Update Railway variable:
FRONTEND_URL=https://your-exact-vercel-url.vercel.app

# Restart API service
```

---

### Issue 4: Memory Leak (Growing Memory)

**Symptoms:**
- Railway metrics show memory constantly growing
- Service becomes slow or crashes

**Check:**
- Railway → Metrics → Memory usage trending up

**Fix:**
1. Railway → Service → **Restart**
2. If persists, may need code fix
3. Monitor again after restart

---

## 📖 Summary

### Monitoring Tools You'll Use

**Primary (Every Day):**
1. **Railway Dashboard** - Service logs & metrics
2. **Vercel Dashboard** - Deployment status
3. **Browser DevTools** - Frontend errors & API calls
4. **Supabase SQL Editor** - Database queries

**Secondary (Setup Once):**
1. **UptimeRobot** - Automated health checks
2. **Email Alerts** - Vercel deployment notifications

**Optional (Advanced):**
1. **Better Stack** - Comprehensive monitoring
2. **Sentry** - Error tracking

---

### Monitoring Schedule

- **Hours 1-6:** Check every hour (critical period)
- **Hours 7-24:** Check every 6 hours
- **Hours 25-48:** Check twice daily
- **After 48h:** Check daily, then weekly

---

### Key Queries to Bookmark

```sql
-- Job queue health (run hourly)
SELECT * FROM get_memory_job_stats();

-- Failed jobs (run when errors occur)
SELECT * FROM memory_jobs WHERE status = 'failed' LIMIT 10;

-- Pending jobs backlog (run hourly)
SELECT COUNT(*) FROM memory_jobs WHERE status = 'pending';
```

---

**You're ready to monitor your deployment!** 📊

Use the checklists above and adjust based on what you observe.
