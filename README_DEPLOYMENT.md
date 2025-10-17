# Luma Deployment Scripts - Quick Reference

Complete guide for using the deployment scripts to deploy Luma to staging and production.

---

## 📁 Available Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `deploy-staging.sh` | Deploy to staging | `./deploy-staging.sh` |
| `deploy-production.sh` | Deploy to production | `./deploy-production.sh` |
| `run-tests.sh` | Run integration tests | `./run-tests.sh [env]` |
| `run-performance-tests.sh` | Run performance tests | `./run-performance-tests.sh [env]` |

---

## 🚀 Quick Start

### 1. Make Scripts Executable

```bash
chmod +x deploy-staging.sh
chmod +x deploy-production.sh
chmod +x run-tests.sh
chmod +x run-performance-tests.sh
```

### 2. Deploy to Staging

```bash
./deploy-staging.sh
```

This will:
- Build and deploy backend
- Build and deploy frontend
- Run health checks
- Display deployment URLs

### 3. Run Tests

```bash
# Run integration tests on staging
./run-tests.sh staging

# Run performance tests on staging
./run-performance-tests.sh staging
```

### 4. Deploy to Production

```bash
./deploy-production.sh
```

This will:
- Ask for confirmation
- Build and deploy backend
- Build and deploy frontend
- Run health checks and smoke tests
- Display deployment summary

---

## 📖 Script Details

### deploy-staging.sh

**What it does:**
1. Checks if Vercel CLI is installed
2. Deploys backend to staging
3. Deploys frontend to staging
4. Runs health checks
5. Displays deployment URLs

**Environment variables used:**
- `.env.staging` (frontend)
- `backend/.env.staging` (backend)

**Output:**
```
🚀 Starting Luma Staging Deployment...
✓ Backend deployed to: https://luma-backend-staging.vercel.app
✓ Frontend deployed to: https://luma-staging.vercel.app
✓ Backend is healthy
✓ Frontend is accessible
```

### deploy-production.sh

**What it does:**
1. Asks for confirmation
2. Checks prerequisites
3. Deploys backend to production
4. Deploys frontend to production
5. Runs comprehensive health checks
6. Runs smoke tests
7. Displays post-deployment tasks

**Environment variables used:**
- `.env.production` (frontend)
- `backend/.env.production` (backend)

**Safety features:**
- Requires "yes" confirmation
- Validates health checks
- Tests critical endpoints
- Provides rollback instructions

### run-tests.sh

**What it does:**
1. Runs 78 integration tests
2. Tests all API endpoints
3. Validates functionality
4. Reports pass/fail status

**Usage:**
```bash
./run-tests.sh local      # Test local environment
./run-tests.sh staging    # Test staging environment
./run-tests.sh production # Test production (asks for confirmation)
```

**Test categories:**
- Authentication & Authorization (12 tests)
- AI Chat Integration (18 tests)
- Journal Management (15 tests)
- Goal Tracking (12 tests)
- Mental Wellness Tools (10 tests)
- Master Agent Orchestration (11 tests)

**Output:**
```
🧪 Luma Integration Test Suite
Total Tests: 78
✓ Passed: 78
Failed: 0
Pass Rate: 100%
```

### run-performance-tests.sh

**What it does:**
1. Tests backend response times
2. Tests frontend load times
3. Runs Lighthouse audit (if available)
4. Checks bundle sizes
5. Validates performance targets

**Usage:**
```bash
./run-performance-tests.sh local      # Test local
./run-performance-tests.sh staging    # Test staging
./run-performance-tests.sh production # Test production
```

**Metrics tested:**
- Backend response time (target: < 500ms)
- Concurrent request handling
- Frontend load time (target: < 3s)
- Bundle size (target: < 3MB)
- Lighthouse scores (target: > 90)

**Output:**
```
⚡ Luma Performance Testing
✓ Backend response time: 245ms
✓ Frontend load time: 1.8s
✓ Lighthouse performance: 94/100
✓ SEO score: 96/100
✓ PWA score: 89/100
```

---

## 🔧 Configuration

### Environment Variables

**Frontend (.env.staging / .env.production):**
```bash
VITE_API_URL=https://your-backend-url/api/v1
VITE_APP_ENVIRONMENT=staging|production
VITE_ENABLE_SERVICE_WORKER=true
VITE_ENABLE_ERROR_TRACKING=true
VITE_SENTRY_DSN=your_sentry_dsn
```

**Backend (backend/.env.staging / backend/.env.production):**
```bash
NODE_ENV=staging|production
PORT=4000
FRONTEND_URL=https://your-frontend-url
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_api_key
LANGFUSE_SECRET_KEY=your_langfuse_secret
LANGFUSE_PUBLIC_KEY=your_langfuse_public
```

### Vercel Configuration

**Frontend (vercel.json):**
- Configured for static build
- Security headers set
- Service worker caching rules
- SPA routing configured

**Backend (backend/vercel.json):**
- Configured for Node.js runtime
- API routing configured
- Environment variables set

---

## 📊 Deployment Flow

```
┌─────────────────────────────────────────────┐
│  1. PRE-DEPLOYMENT                          │
│  - Configure environments                   │
│  - Update configuration files               │
│  - Run database migrations                  │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  2. STAGING DEPLOYMENT                      │
│  $ ./deploy-staging.sh                      │
│  - Deploy backend                           │
│  - Deploy frontend                          │
│  - Run health checks                        │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  3. TESTING ON STAGING                      │
│  $ ./run-tests.sh staging                   │
│  $ ./run-performance-tests.sh staging       │
│  - Integration tests (78 tests)            │
│  - Performance tests                        │
│  - Manual QA testing                        │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  4. PRODUCTION DEPLOYMENT                   │
│  $ ./deploy-production.sh                   │
│  - Confirm deployment                       │
│  - Deploy backend                           │
│  - Deploy frontend                          │
│  - Run health checks & smoke tests          │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  5. POST-DEPLOYMENT                         │
│  - Monitor for 24 hours                     │
│  - Check error rates                        │
│  - Verify user flows                        │
│  - Review metrics                           │
└─────────────────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### Script Not Executable

**Error:** `Permission denied`

**Solution:**
```bash
chmod +x deploy-staging.sh
chmod +x deploy-production.sh
chmod +x run-tests.sh
chmod +x run-performance-tests.sh
```

### Vercel CLI Not Found

**Error:** `vercel: command not found`

**Solution:**
```bash
npm install -g vercel
```

### Backend Health Check Fails

**Error:** `Backend is not reachable`

**Solution:**
1. Check backend logs: `vercel logs luma-backend`
2. Verify environment variables: `vercel env ls`
3. Check database connection
4. Verify API keys are correct

### Frontend Not Loading

**Error:** `Frontend check failed`

**Solution:**
1. Clear cache and hard reload
2. Check browser console for errors
3. Verify service worker status
4. Check API URL is correct

### Tests Failing

**Error:** `Some tests failed`

**Solution:**
1. Check backend is running
2. Verify database migrations are applied
3. Check environment variables
4. Review failed test output
5. Fix issues and rerun

---

## 📝 Best Practices

### 1. Always Deploy to Staging First

```bash
# ✅ Correct order
./deploy-staging.sh
./run-tests.sh staging
./deploy-production.sh

# ❌ Never skip staging
./deploy-production.sh # Don't do this!
```

### 2. Run All Tests Before Production

```bash
# Run integration tests
./run-tests.sh staging

# Run performance tests
./run-performance-tests.sh staging

# Manual QA testing
# Use QA_TESTING_CHECKLIST.md
```

### 3. Monitor After Deployment

```bash
# Check logs immediately after deployment
vercel logs luma-backend --follow
vercel logs luma-frontend --follow

# Monitor error rates
# Check Sentry dashboard

# Verify health checks
curl https://api.luma.app/api/v1/health
```

### 4. Have Rollback Plan Ready

```bash
# Know how to rollback
vercel rollback luma-backend
vercel rollback luma-frontend

# Or via dashboard
# Vercel Dashboard → Deployments → Previous → Promote
```

---

## 🔄 Common Workflows

### Full Deployment Workflow

```bash
# 1. Deploy to staging
./deploy-staging.sh

# 2. Run all tests
./run-tests.sh staging
./run-performance-tests.sh staging

# 3. Manual QA (use checklist)
# QA_TESTING_CHECKLIST.md

# 4. Deploy to production
./deploy-production.sh

# 5. Monitor for 24 hours
# Check Sentry, logs, metrics
```

### Quick Staging Update

```bash
# Deploy latest changes to staging
./deploy-staging.sh

# Quick smoke test
curl https://luma-backend-staging.vercel.app/api/v1/health
```

### Production Hotfix

```bash
# 1. Fix the issue
# 2. Test locally
npm run dev

# 3. Deploy to staging
./deploy-staging.sh

# 4. Quick test
./run-tests.sh staging

# 5. Deploy to production
./deploy-production.sh

# 6. Verify fix
# Test the specific issue
```

---

## 📊 Success Criteria

Deployment is successful when:

- [ ] All health checks passing
- [ ] Integration tests: 78/78 passed
- [ ] Performance tests passed
- [ ] Lighthouse score > 90
- [ ] Error rate < 0.1%
- [ ] Response time < 500ms
- [ ] No critical bugs

---

## 📞 Need Help?

### Documentation
- `DEPLOYMENT_GUIDE.md` - Complete deployment guide
- `DEPLOYMENT_CHECKLIST.md` - Pre-deployment checklist
- `QA_TESTING_CHECKLIST.md` - Manual testing guide
- `DEPLOYMENT_READY_SUMMARY.md` - Readiness summary

### Common Issues
- Check Vercel logs: `vercel logs <project-name>`
- Check environment variables: `vercel env ls`
- Verify database connection in Supabase dashboard
- Review error logs in Sentry (if configured)

### Support Resources
- Vercel Documentation: https://vercel.com/docs
- Supabase Documentation: https://supabase.com/docs
- Deployment troubleshooting in DEPLOYMENT_GUIDE.md

---

## ✅ Pre-Deployment Checklist

Before running deployment scripts:

- [ ] Database migrations executed
- [ ] Environment variables configured
- [ ] Vercel CLI installed
- [ ] Scripts made executable
- [ ] Configuration files updated
- [ ] Tests passing locally
- [ ] Git commits pushed

---

**Ready to deploy? Start with staging!**

```bash
./deploy-staging.sh
```

**Good luck! 🚀**
