# Luma Production Deployment Guide 🚀

Complete step-by-step guide for deploying Luma to staging and production environments.

---

## 📋 Prerequisites

### Required Tools
- [ ] Node.js 18+ installed
- [ ] npm or yarn installed
- [ ] Git installed
- [ ] Vercel CLI installed (`npm install -g vercel`)
- [ ] Access to Supabase dashboard
- [ ] Langfuse account (optional but recommended)
- [ ] Sentry account (optional but recommended)

### Required Accounts
- [ ] Vercel account (frontend + backend hosting)
- [ ] Supabase account (database)
- [ ] GitHub account (code repository)
- [ ] Langfuse account (AI observability)
- [ ] Sentry account (error tracking)
- [ ] UptimeRobot account (monitoring)

---

## 🎯 Phase 1: Pre-Deployment Setup

### Step 1: Run Database Migrations

```bash
# 1. Go to Supabase Dashboard
# https://supabase.com/dashboard

# 2. Navigate to SQL Editor

# 3. Execute migrations in order
# - 007_schema_fixes.sql
# - 008_langfuse_observability.sql

# 4. Verify migrations
SELECT * FROM information_schema.tables
WHERE table_schema = 'public';
```

### Step 2: Configure Environment Variables

**Backend (.env.staging & .env.production):**
```bash
NODE_ENV=staging|production
PORT=4000
FRONTEND_URL=https://your-frontend-url.vercel.app

SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

OPENAI_API_KEY=your_deepseek_api_key

LANGFUSE_SECRET_KEY=your_langfuse_secret
LANGFUSE_PUBLIC_KEY=your_langfuse_public
LANGFUSE_HOST=https://cloud.langfuse.com
```

**Frontend (.env.staging & .env.production):**
```bash
VITE_API_URL=https://your-backend-url.vercel.app/api/v1
VITE_APP_ENVIRONMENT=staging|production
VITE_ENABLE_SERVICE_WORKER=true
VITE_ENABLE_ERROR_TRACKING=true
VITE_SENTRY_DSN=your_sentry_dsn
```

### Step 3: Update Configuration Files

**Update index.html meta tags:**
- Replace placeholder URLs with actual production URLs
- Update og:image and twitter:image paths
- Verify all meta tags are correct

**Update manifest.json:**
- Add production URLs
- Ensure all icons exist in public/ folder

---

## 🧪 Phase 2: Staging Deployment

### Step 1: Deploy Backend to Staging

```bash
# Make deploy script executable
chmod +x deploy-staging.sh

# Deploy to staging
./deploy-staging.sh
```

**Manual Deployment (if script fails):**
```bash
cd backend

# Copy staging environment
cp .env.staging .env

# Build backend
npm run build

# Deploy to Vercel
vercel --prod

# Note the deployment URL
```

### Step 2: Deploy Frontend to Staging

```bash
# Frontend deployment is included in deploy-staging.sh

# Or manually:
cd ..
cp .env.staging .env

# Update API URL in .env with backend URL

# Build frontend
npm run build

# Deploy to Vercel
vercel --prod
```

### Step 3: Verify Staging Deployment

```bash
# Check backend health
curl https://your-backend-staging.vercel.app/api/v1/health

# Expected response:
# {"status":"healthy","services":{"api":"up","database":"up"}}

# Check frontend
curl -I https://your-frontend-staging.vercel.app

# Expected: HTTP 200 OK
```

---

## 🧪 Phase 3: Testing on Staging

### Step 1: Run Integration Tests

```bash
# Run all 78 integration tests
./run-tests.sh staging

# Expected output:
# ✓ All tests passed! ✅
# Total Tests: 78
# Passed: 78
# Failed: 0
# Pass Rate: 100%
```

### Step 2: Manual QA Testing

```bash
# Open QA checklist
cat QA_TESTING_CHECKLIST.md

# Test each category:
# - Authentication (12 tests)
# - Chat Feature (18 tests)
# - Journal Feature (15 tests)
# - Goals Feature (12 tests)
# - Tools Feature (10 tests)
# - Dashboard (10 tests)
# - PWA & Offline (12 tests)
# - UI/UX (15 tests)
# - Security (8 tests)
```

**Manual Testing Steps:**
1. Open staging URL in browser
2. Register new test account
3. Test each feature thoroughly
4. Test on mobile devices
5. Test offline mode
6. Test PWA installation
7. Document any bugs found

### Step 3: Performance Testing

```bash
# Run performance tests
./run-performance-tests.sh staging

# Expected results:
# - Backend response time < 500ms
# - Frontend load time < 3s
# - Lighthouse performance > 90
# - SEO score > 90
# - PWA score > 80
```

### Step 4: Security Audit

**Check Security Headers:**
```bash
curl -I https://your-frontend-staging.vercel.app

# Verify headers:
# ✓ X-Content-Type-Options: nosniff
# ✓ X-Frame-Options: DENY
# ✓ X-XSS-Protection: 1; mode=block
# ✓ Content-Security-Policy: ...
```

**Test Rate Limiting:**
```bash
# Rapid login attempts (should block after 5)
for i in {1..10}; do
  curl -X POST https://your-backend-staging.vercel.app/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done

# Expected: 429 Too Many Requests after 5 attempts
```

---

## 🚀 Phase 4: Production Deployment

### Pre-Deployment Checklist

Before deploying to production, ensure:

- [ ] All integration tests passing (78/78)
- [ ] Manual QA completed and signed off
- [ ] Performance tests passed
- [ ] Security audit completed
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Monitoring tools set up
- [ ] Rollback plan documented
- [ ] Team notified of deployment
- [ ] Maintenance window scheduled (if needed)

### Step 1: Deploy to Production

```bash
# Make deploy script executable
chmod +x deploy-production.sh

# Deploy to production
./deploy-production.sh

# Follow prompts and confirm deployment
```

**The script will:**
1. Confirm you want to deploy to production
2. Build and deploy backend
3. Build and deploy frontend
4. Run health checks
5. Run smoke tests
6. Display deployment URLs

### Step 2: Verify Production Deployment

```bash
# Check backend health
curl https://your-backend.vercel.app/api/v1/health

# Check frontend
curl -I https://your-frontend.vercel.app

# Test user registration
# Test login
# Test main features
```

### Step 3: Set Up Custom Domain (Optional)

**In Vercel Dashboard:**

1. **Backend Domain:**
   ```
   Project: luma-backend
   Domain: api.luma.app
   ```

2. **Frontend Domain:**
   ```
   Project: luma-frontend
   Domain: luma.app, www.luma.app
   ```

3. **Add DNS Records:**
   ```
   Type: CNAME
   Name: api
   Value: cname.vercel-dns.com

   Type: A
   Name: @
   Value: 76.76.21.21
   ```

4. **Update Environment Variables:**
   ```bash
   # Backend .env.production
   FRONTEND_URL=https://luma.app

   # Frontend .env.production
   VITE_API_URL=https://api.luma.app/api/v1
   ```

5. **Redeploy with new URLs**

---

## 📊 Phase 5: Post-Deployment Monitoring

### Step 1: Set Up Monitoring

**Sentry (Error Tracking):**
```bash
# If not already configured
npm install @sentry/react

# Uncomment Sentry code in src/lib/sentry.ts

# Add DSN to .env.production
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id

# Redeploy
```

**UptimeRobot (Uptime Monitoring):**
1. Go to https://uptimerobot.com
2. Add New Monitor
3. Type: HTTP(s)
4. URL: https://api.luma.app/api/v1/health
5. Interval: 5 minutes
6. Alert Contacts: Your email

**Langfuse (AI Observability):**
1. Go to https://cloud.langfuse.com
2. View traces and costs
3. Set up cost alerts
4. Monitor AI performance

### Step 2: Monitor for First 24 Hours

**Hour 1: Intensive Monitoring**
- [ ] Check error rates in Sentry
- [ ] Monitor response times
- [ ] Check user registrations working
- [ ] Verify login flow
- [ ] Test main features
- [ ] Monitor server logs

**Hours 2-4: Active Monitoring**
- [ ] Check every 30 minutes
- [ ] Monitor error dashboards
- [ ] Check uptime status
- [ ] Review user feedback

**Hours 5-24: Passive Monitoring**
- [ ] Check every 2 hours
- [ ] Review daily metrics
- [ ] Monitor costs (AI, hosting)
- [ ] Address any critical issues

### Step 3: Metrics to Track

**Performance Metrics:**
- Response time (target: < 500ms)
- Error rate (target: < 0.1%)
- Uptime (target: > 99.9%)
- API success rate (target: > 99%)

**User Metrics:**
- New registrations
- Active users
- Feature usage
- Session duration

**Cost Metrics:**
- AI API costs (DeepSeek)
- Hosting costs (Vercel)
- Database costs (Supabase)
- Monitoring costs (Sentry, etc.)

---

## 🔄 Phase 6: Rollback Procedure

If something goes wrong, follow this rollback procedure:

### Immediate Rollback (Critical Issues)

```bash
# Vercel dashboard
# Go to project → Deployments
# Find previous working deployment
# Click "..." → "Promote to Production"
```

**Or via CLI:**
```bash
# List deployments
vercel ls luma-backend
vercel ls luma-frontend

# Promote previous deployment
vercel promote <deployment-url> --prod
```

### Database Rollback

```bash
# Go to Supabase dashboard
# Database → Backups
# Select backup before deployment
# Click "Restore"
```

### Communication

1. **Notify Team:**
   - Inform team of rollback
   - Explain issue
   - Provide ETA for fix

2. **Notify Users (if applicable):**
   - Status page update
   - Email notification (if major)
   - Social media update

3. **Post-Mortem:**
   - Document what went wrong
   - Create action items
   - Update deployment process

---

## 📝 Phase 7: Post-Launch Tasks

### Day 1: Launch Day

- [ ] Monitor all systems intensively
- [ ] Respond to user feedback
- [ ] Fix any critical bugs immediately
- [ ] Update status page
- [ ] Announce launch (if public)

### Week 1: First Week

- [ ] Review error logs daily
- [ ] Monitor performance metrics
- [ ] Collect user feedback
- [ ] Fix high-priority bugs
- [ ] Optimize based on metrics
- [ ] Review AI costs
- [ ] Check database performance

### Week 2-4: First Month

- [ ] Monthly performance review
- [ ] User satisfaction survey
- [ ] Feature usage analysis
- [ ] Cost optimization
- [ ] Plan next features
- [ ] Security audit
- [ ] Dependency updates

---

## 🛠️ Troubleshooting

### Common Issues

**Issue: Backend health check fails**
```bash
# Check logs
vercel logs luma-backend

# Check environment variables
vercel env ls

# Common fixes:
# - Verify database connection
# - Check API keys
# - Verify CORS settings
```

**Issue: Frontend not loading**
```bash
# Check build
npm run build

# Check console errors
# Open DevTools → Console

# Common fixes:
# - Clear cache
# - Check API URL
# - Verify service worker
```

**Issue: Service worker not registering**
```bash
# Check HTTPS
# Service workers require HTTPS (except localhost)

# Check manifest.json
# Verify manifest is accessible

# Clear service workers
# DevTools → Application → Service Workers → Unregister
```

**Issue: Rate limiting too aggressive**
```bash
# Adjust in backend/src/middleware/rate-limit.middleware.ts
# Increase max requests or window time

# Redeploy backend
```

---

## 📊 Success Criteria

Deployment is considered successful when:

- [ ] All health checks passing
- [ ] Error rate < 0.1%
- [ ] Uptime > 99.9%
- [ ] Response time < 500ms
- [ ] All features working
- [ ] PWA installable
- [ ] Offline mode works
- [ ] No critical bugs
- [ ] Monitoring active
- [ ] User feedback positive

---

## 🎉 Conclusion

Congratulations! You have successfully deployed Luma to production! 🎊

**Key Achievements:**
✅ Backend deployed and healthy
✅ Frontend deployed and accessible
✅ Database configured and secure
✅ Monitoring tools active
✅ Performance optimized
✅ Security hardened
✅ PWA capabilities enabled
✅ Error tracking configured

**Next Steps:**
1. Monitor performance for 24-48 hours
2. Collect user feedback
3. Plan next features
4. Regular maintenance and updates

**Support Resources:**
- Sentry Dashboard: https://sentry.io
- Vercel Dashboard: https://vercel.com/dashboard
- Supabase Dashboard: https://supabase.com/dashboard
- Langfuse Dashboard: https://cloud.langfuse.com

**For questions or issues, refer to:**
- DEPLOYMENT_CHECKLIST.md
- FRONTEND_CRITICAL_FIXES_COMPLETE.md
- TROUBLESHOOTING.md (if created)

---

**Deployment Complete! 🚀**
