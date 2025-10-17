# Memory System Async Refactor - Deployment Guide

## Overview

This guide covers deploying the refactored memory system with async processing, Redis caching, and background workers to Railway.

### Architecture Changes

**Before (Synchronous):**
- API endpoint → Enrich (2-3s) → Embed (1-2s) → Relations (20+ AI calls) → Response
- Total latency: 8-15 seconds per request
- Blocking user experience
- No caching
- Single point of failure

**After (Async):**
- API endpoint → Insert minimal block → Enqueue job → Response (<100ms)
- Worker processes enrichment/embedding in background
- Redis cache for fast retrieval
- Graceful degradation on failures
- Feature flags for safe rollout

---

## Prerequisites

### 1. Services Required

- **PostgreSQL** (Supabase) - Already configured
- **Redis** (Redis Cloud) - **NEW REQUIREMENT**
  - Already provided: `redis://default:lUcNSQRWWmkhzGotKL57qVPGQnIMmDfP@redis-13610.c82.us-east-1-2.ec2.redns.redis-cloud.com:13610`
- **Railway** - For API + Worker deployment

### 2. Database Migration

Run the async refactor migration:

```bash
# Connect to Supabase SQL Editor and run:
backend/database/migrations/memory-async-refactor.sql
```

This migration adds:
- `status` column to `memory_blocks` (pending_enrichment, active, failed)
- `memory_jobs` table for job queue
- `memory_rate_limits` table for throttling
- Helper functions for job management
- Indexes for efficient worker queries

---

## Deployment Steps

### Step 1: Deploy API Server (Existing)

The API server is already configured. Update environment variables:

```bash
# Railway Dashboard → API Service → Variables

# Add Redis
REDIS_URL=redis://default:lUcNSQRWWmkhzGotKL57qVPGQnIMmDfP@redis-13610.c82.us-east-1-2.ec2.redns.redis-cloud.com:13610

# Memory System Config (Start Conservative)
MEMORY_SYSTEM_ENABLED=true
MEMORY_ENRICHMENT_ENABLED=true
MEMORY_EMBEDDING_ENABLED=true
MEMORY_RELATIONS_ENABLED=false          # Start disabled
MEMORY_SYNTHESIS_ENABLED=true
MEMORY_WEEKLY_SUMMARIES_ENABLED=true
MEMORY_LANGFUSE_ENABLED=false           # Disable for performance
MEMORY_CACHE_TTL_SECONDS=3600           # 1 hour
MEMORY_MAX_CONTEXT_BLOCKS=10
MEMORY_SIMILARITY_THRESHOLD=0.75
MEMORY_RELATION_DETECTION_RATE_LIMIT=5
MEMORY_FAIL_FAST=false                  # Graceful fallback
MEMORY_RETRY_ATTEMPTS=3
MEMORY_RETRY_BACKOFF_MS=1000

# Worker Config (for worker service)
MEMORY_WORKER_ENABLED=true
MEMORY_WORKER_POLL_INTERVAL_MS=1000     # 1 second
MEMORY_WORKER_MAX_CONCURRENT_JOBS=5
MEMORY_WORKER_JOB_TIMEOUT_MS=30000      # 30 seconds
MEMORY_WORKER_HEALTH_CHECK_INTERVAL_MS=60000  # 1 minute
```

**Deploy API:**
```bash
# Railway will automatically redeploy on git push
git add .
git commit -m "feat: Add async memory system with Redis cache"
git push
```

---

### Step 2: Deploy Memory Worker (NEW Service)

**Create new Railway service:**

1. Go to Railway Dashboard
2. Click "New Service" → "GitHub Repo"
3. Select your repository
4. Configure service:
   - **Name:** `luma-memory-worker`
   - **Root Directory:** `backend`
   - **Builder:** Dockerfile
   - **Dockerfile Path:** `Dockerfile.worker`
   - **Start Command:** `node dist/workers/memory-worker.js`

**Add Environment Variables:**

Copy ALL environment variables from API service (they share the same .env)

**Critical Variables:**
```bash
# Database (same as API)
SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Redis (same as API)
REDIS_URL=redis://default:lUcNSQRWWmkhzGotKL57qVPGQnIMmDfP@redis-13610.c82.us-east-1-2.ec2.redns.redis-cloud.com:13610

# OpenAI (same as API)
OPENAI_API_KEY=<your-openai-key>

# Memory Config (same as API)
MEMORY_SYSTEM_ENABLED=true
MEMORY_WORKER_ENABLED=true
MEMORY_ENRICHMENT_ENABLED=true
MEMORY_EMBEDDING_ENABLED=true
MEMORY_RELATIONS_ENABLED=false
MEMORY_SYNTHESIS_ENABLED=true
MEMORY_WEEKLY_SUMMARIES_ENABLED=true
MEMORY_WORKER_POLL_INTERVAL_MS=1000
MEMORY_WORKER_MAX_CONCURRENT_JOBS=5
MEMORY_WORKER_JOB_TIMEOUT_MS=30000
MEMORY_WORKER_HEALTH_CHECK_INTERVAL_MS=60000
```

**Deploy Worker:**
```bash
# Railway will automatically deploy on git push
# Worker will start processing jobs immediately
```

---

## Gradual Rollout Strategy

### Phase 1: Enable Async Ingestion (Week 1)

**Goal:** Test async ingestion without breaking existing functionality

**Config:**
```bash
MEMORY_SYSTEM_ENABLED=true
MEMORY_ENRICHMENT_ENABLED=true
MEMORY_EMBEDDING_ENABLED=true
MEMORY_RELATIONS_ENABLED=false  # Disabled
```

**What to Monitor:**
- API latency: Should drop to <100ms for memory ingestion
- Worker health: Check Railway logs for worker processing
- Job queue: Monitor `memory_jobs` table in Supabase
- Error rate: Check for failed jobs

**Success Criteria:**
- ✅ API latency < 100ms
- ✅ Worker processing jobs successfully
- ✅ < 5% job failure rate
- ✅ No user-facing errors

---

### Phase 2: Enable Caching (Week 2)

**Goal:** Improve retrieval performance with Redis cache

**Config:**
```bash
MEMORY_CACHE_TTL_SECONDS=3600  # 1 hour (default)
```

**What to Monitor:**
- Cache hit rate: Check logs for "Cache hit" vs "Cache miss"
- Retrieval latency: Should drop significantly on cache hits
- Redis memory usage: Monitor in Redis Cloud dashboard

**Success Criteria:**
- ✅ Cache hit rate > 40% after 24 hours
- ✅ Retrieval latency < 500ms on cache hits
- ✅ Redis memory usage stable

---

### Phase 3: Enable Relation Detection (Week 3-4)

**Goal:** Add expensive relation detection with rate limiting

**Config:**
```bash
MEMORY_RELATIONS_ENABLED=true
MEMORY_RELATION_DETECTION_RATE_LIMIT=5  # 5 per hour per user
```

**What to Monitor:**
- Rate limit hits: Check logs for "Rate limit reached"
- Relation quality: Manually inspect created relations
- Worker load: Ensure worker can handle increased jobs

**Success Criteria:**
- ✅ Relations created successfully
- ✅ Rate limiting prevents abuse
- ✅ Worker not overwhelmed

---

### Phase 4: Production Optimization (Week 4+)

**Goal:** Fine-tune for production scale

**Optimizations:**
```bash
# Increase cache TTL
MEMORY_CACHE_TTL_SECONDS=7200  # 2 hours

# Adjust similarity threshold (higher = more relevant)
MEMORY_SIMILARITY_THRESHOLD=0.80

# Increase worker concurrency if needed
MEMORY_WORKER_MAX_CONCURRENT_JOBS=10

# Enable Langfuse if debugging needed
MEMORY_LANGFUSE_ENABLED=true  # Only when troubleshooting
```

---

## Monitoring

### 1. Worker Health

**Railway Logs:**
```bash
# View worker logs in Railway dashboard
# Look for:
# - "🚀 Memory Worker Starting..."
# - "✅ Job completed: enrich_and_embed (1234ms)"
# - "📊 Worker Health Check"
```

**Health Check:**
Worker logs stats every 60 seconds:
- Uptime
- Jobs processing
- Queue stats (pending, processing, completed, failed)

### 2. Job Queue Stats

**Supabase SQL:**
```sql
-- View queue stats
SELECT * FROM get_memory_job_stats();

-- View failed jobs
SELECT * FROM memory_jobs
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 50;

-- View pending jobs
SELECT * FROM memory_jobs
WHERE status = 'pending'
ORDER BY priority DESC, created_at ASC
LIMIT 20;
```

### 3. Redis Cache Stats

**Check cache stats via API:**
```bash
# Add to memory.controller.ts:
GET /api/v1/memory/cache/stats

# Response:
{
  "connected": true,
  "keys_count": 234,
  "memory_used": "2.45M"
}
```

### 4. Memory System Health

**Check overall health:**
```bash
# Add to memory.controller.ts:
GET /api/v1/memory/health

# Response:
{
  "system_enabled": true,
  "worker_running": true,
  "queue_stats": {
    "pending": 12,
    "processing": 3,
    "completed": 1847,
    "failed": 5
  },
  "cache": {
    "connected": true,
    "hit_rate": 0.65
  }
}
```

---

## Troubleshooting

### Worker Not Processing Jobs

**Symptoms:**
- Jobs stuck in "pending" status
- No worker logs in Railway

**Checks:**
1. Verify worker service is running in Railway
2. Check environment variables (especially `MEMORY_WORKER_ENABLED`)
3. Check worker logs for errors
4. Verify database connection (Supabase credentials)

**Fix:**
```bash
# Restart worker service in Railway
# Or redeploy with:
git push --force
```

---

### High Job Failure Rate

**Symptoms:**
- Many jobs in "failed" status
- Error messages in worker logs

**Common Causes:**
1. **OpenAI API errors:** Rate limit or API key issues
2. **Database errors:** Connection issues or schema problems
3. **Timeout errors:** Jobs taking too long

**Fix:**
```bash
# Increase timeout
MEMORY_WORKER_JOB_TIMEOUT_MS=60000  # 60 seconds

# Reduce concurrency
MEMORY_WORKER_MAX_CONCURRENT_JOBS=3

# Enable retry
MEMORY_RETRY_ATTEMPTS=5
```

---

### Redis Connection Issues

**Symptoms:**
- "Cache unavailable" logs
- No cache hits

**Checks:**
1. Verify Redis credentials in environment variables
2. Check Redis Cloud dashboard for connection issues
3. Test connection: `redis-cli -u <REDIS_URL> ping`

**Fix:**
```bash
# Update REDIS_URL in Railway
# Verify format: redis://default:password@host:port
```

---

### Memory Blocks Not Being Enriched

**Symptoms:**
- Blocks stuck in "pending_enrichment" status
- No embeddings generated

**Checks:**
1. Verify worker is processing "enrich_and_embed" jobs
2. Check OpenAI API key is valid
3. Check for job errors in `memory_jobs` table

**SQL Query:**
```sql
-- Check pending blocks
SELECT id, user_id, status, created_at
FROM memory_blocks
WHERE status = 'pending_enrichment'
ORDER BY created_at DESC;

-- Check related jobs
SELECT * FROM memory_jobs
WHERE job_type = 'enrich_and_embed'
AND status IN ('failed', 'pending')
ORDER BY created_at DESC;
```

---

## Rollback Procedure

If issues arise, rollback to synchronous mode:

### Step 1: Disable Async Processing
```bash
# Railway API Service → Environment Variables
MEMORY_WORKER_ENABLED=false
```

### Step 2: Stop Worker Service
```bash
# Railway Dashboard → Worker Service → Settings → Pause
```

### Step 3: Use Legacy Sync Method

Update feature integrations to use `ingestBlock()` instead of `ingestBlockAsync()`:

```typescript
// Change from:
await memoryService.ingestBlockAsync(block);

// Back to:
await memoryService.ingestBlock(block);
```

### Step 4: Clear Job Queue (Optional)
```sql
-- Clear pending jobs
DELETE FROM memory_jobs WHERE status = 'pending';
```

---

## Performance Targets

### API Latency
- **Memory Ingestion:** < 100ms (was 8-15s)
- **Context Retrieval (cached):** < 500ms (was 2-5s)
- **Context Retrieval (uncached):** < 3s (was 5-10s)

### Worker Performance
- **Enrich & Embed:** 2-4s per block
- **Relation Detection:** 10-30s per block (expensive)
- **Weekly Summary:** 5-15s per user

### Queue Health
- **Pending Jobs:** < 50 at any time
- **Processing Jobs:** 1-5 (concurrent)
- **Failed Jobs:** < 5% failure rate
- **Job Completion:** 95% within 30 seconds

### Cache Performance
- **Hit Rate:** > 40% after 24 hours
- **Memory Usage:** < 100MB for 1000 users
- **TTL:** 1 hour (configurable)

---

## Cost Estimates

### Redis Cloud (Shared Plan)
- **Cost:** $0/month (free tier: 30MB)
- **Capacity:** ~5,000 cached contexts
- **Upgrade:** $10/month for 100MB

### Railway Worker
- **Cost:** ~$5/month (similar to API)
- **CPU:** Shared (upgrade if needed)
- **Memory:** 512MB (increase if needed)

### OpenAI API (Incremental)
- **Embeddings:** ~$0.0001 per block (ada-002)
- **Enrichment:** ~$0.002 per block (GPT-4o-mini)
- **Estimated:** +$10-20/month for 10k blocks

---

## Next Steps

1. ✅ Run database migration
2. ✅ Add Redis credentials to Railway
3. ✅ Deploy API with async config
4. ✅ Deploy worker service
5. ⏳ Monitor Phase 1 (async ingestion)
6. ⏳ Enable caching (Phase 2)
7. ⏳ Enable relation detection (Phase 3)
8. ⏳ Optimize for production (Phase 4)

---

## Support

For issues or questions:
1. Check Railway logs (API + Worker)
2. Check Supabase SQL tables (`memory_jobs`, `memory_blocks`)
3. Check Redis Cloud dashboard
4. Review this documentation

**Key Files:**
- `backend/src/services/memory/memory.service.ts` - Memory service
- `backend/src/workers/memory-worker.ts` - Worker implementation
- `backend/src/config/memory.config.ts` - Feature flags
- `backend/database/migrations/memory-async-refactor.sql` - Migration

---

## Summary

**What Changed:**
- ✅ Async job processing (PostgreSQL queue)
- ✅ Redis caching layer
- ✅ Background worker service
- ✅ Feature flags for safe rollout
- ✅ Graceful degradation
- ✅ Rate limiting for expensive operations

**Benefits:**
- 🚀 99% faster memory ingestion (<100ms)
- 📈 50%+ faster retrieval (with cache)
- 🛡️ Resilient to failures (graceful fallback)
- 🎯 Scalable architecture (separate worker)
- 🔧 Configurable via environment variables

**Risks Mitigated:**
- ❌ No blocking user experience
- ❌ No single point of failure
- ❌ No unbounded AI costs (rate limiting)
- ❌ No performance degradation (caching)
