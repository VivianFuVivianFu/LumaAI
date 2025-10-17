# Luma Deployment Checklist 🚀

Complete checklist for deploying Luma to production.

---

## 📋 Pre-Deployment Checklist

### Backend ✅ (Already Complete)

- [x] Database migrations 007 & 008 executed
- [x] Environment variables configured
- [x] Rate limiting implemented (5 tiers)
- [x] Security logging (SecurityLogger)
- [x] GDPR endpoints (export, delete, summary)
- [x] Graceful shutdown handlers
- [x] Health check endpoint
- [x] Error response status codes fixed
- [x] Langfuse observability integrated
- [x] Privacy Policy & Terms of Service
- [x] Cookie consent banner
- [x] Dependency scanning (GitHub Actions)

### Frontend ✅ (Just Completed)

- [x] Environment files (.env.development, .env.production)
- [x] Error Boundary component
- [x] Loading states (useApiCall hook, LoadingSpinner)
- [x] Offline detection (useOnlineStatus, OfflineIndicator)
- [x] SEO meta tags (Open Graph, Twitter Cards)
- [x] Security headers (CSP, X-Frame-Options, etc.)
- [x] PWA manifest & service worker
- [x] Offline fallback page
- [x] Sentry integration (code ready)
- [x] Advanced caching (CacheManager)
- [x] Request deduplication

---

## 🔧 Configuration Tasks

### 1. Backend Configuration

```bash
# Navigate to backend folder
cd backend

# Ensure .env.production is configured
# Check these critical variables:
NODE_ENV=production
PORT=4000
FRONTEND_URL=https://your-production-domain.com
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_deepseek_api_key
LANGFUSE_SECRET_KEY=your_langfuse_secret
LANGFUSE_PUBLIC_KEY=your_langfuse_public
LANGFUSE_HOST=https://cloud.langfuse.com
```

### 2. Frontend Configuration

```bash
# Navigate to frontend folder (root)
cd ..

# Update .env.production
VITE_API_URL=https://your-production-api.com/api/v1
VITE_APP_ENVIRONMENT=production
VITE_ENABLE_SERVICE_WORKER=true
VITE_ENABLE_ERROR_TRACKING=true
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Update meta tags in index.html
# Replace "https://luma.app/" with your actual domain
# Replace "https://luma.app/og-image.png" with your actual image URLs
```

### 3. Database Migrations

```bash
# Run migrations in Supabase SQL Editor
# 1. Go to Supabase Dashboard → SQL Editor
# 2. Execute backend/database/migrations/007_schema_fixes.sql
# 3. Execute backend/database/migrations/008_langfuse_observability.sql
# 4. Verify no errors
```

---

## 🧪 Testing Checklist

### Backend Testing

```bash
cd backend

# 1. Run in production mode locally
npm run build
NODE_ENV=production node dist/server.js

# 2. Test health check
curl http://localhost:4000/api/v1/health

# 3. Test authentication
# - Register new user
# - Login
# - Get profile
# - Logout

# 4. Test rate limiting
# - Make 10+ requests rapidly
# - Should see 429 errors

# 5. Test GDPR endpoints
# - GET /api/v1/auth/gdpr/data-summary
# - GET /api/v1/auth/gdpr/export
# - DELETE /api/v1/auth/gdpr/delete-account

# 6. Test all feature endpoints
# - Chat API
# - Journal API
# - Goals API
# - Tools API
```

### Frontend Testing

```bash
# 1. Build production bundle
npm run build

# 2. Serve locally
npx serve -s build

# 3. Test in browser (http://localhost:3000)
```

**Manual Tests:**

- [ ] Registration flow works
- [ ] Login flow works
- [ ] Dashboard loads
- [ ] Chat feature works
- [ ] Journal feature works
- [ ] Goals feature works
- [ ] Tools feature works
- [ ] Profile screen loads
- [ ] Logout works

**PWA Tests:**

- [ ] Service worker registers (check DevTools → Application)
- [ ] App works offline (toggle offline in DevTools)
- [ ] Offline banner appears when offline
- [ ] App can be installed (install icon appears)
- [ ] Installed app opens standalone

**Error Handling Tests:**

- [ ] Error boundary catches errors (throw test error)
- [ ] Loading spinners show during API calls
- [ ] Error messages display properly
- [ ] 404 errors handled gracefully

**Performance Tests:**

- [ ] Run Lighthouse audit (target: 90+ score)
- [ ] Check bundle size (should be < 1MB)
- [ ] Test on slow 3G connection
- [ ] Verify lazy loading works

---

## 🚀 Deployment Steps

### Option 1: Deploy to Vercel (Recommended)

**Backend:**
```bash
cd backend

# 1. Install Vercel CLI
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy
vercel --prod

# 4. Set environment variables in Vercel dashboard
# - Go to project settings
# - Add all variables from .env.production

# 5. Note the deployment URL
```

**Frontend:**
```bash
cd ..

# 1. Update VITE_API_URL in .env.production
# Use the backend URL from Vercel

# 2. Build
npm run build

# 3. Deploy
vercel --prod

# 4. Set environment variables in Vercel dashboard

# 5. Configure custom domain (optional)
```

### Option 2: Deploy to Railway

**Backend:**
```bash
# 1. Go to railway.app
# 2. Create new project
# 3. Connect GitHub repo
# 4. Set root directory to "backend"
# 5. Add environment variables
# 6. Deploy
```

**Frontend:**
```bash
# 1. Create another Railway service
# 2. Set root directory to "."
# 3. Set build command: npm run build
# 4. Set start command: npx serve -s build
# 5. Add environment variables
# 6. Deploy
```

### Option 3: Deploy to AWS

**Backend (EC2 + RDS):**
```bash
# 1. Launch EC2 instance (Ubuntu 22.04)
# 2. Install Node.js 18+
# 3. Clone repository
# 4. Set up environment variables
# 5. Install PM2: npm install -g pm2
# 6. Start: pm2 start dist/server.js --name luma-backend
# 7. Set up nginx reverse proxy
# 8. Configure SSL with Let's Encrypt
```

**Frontend (S3 + CloudFront):**
```bash
# 1. Create S3 bucket
# 2. Enable static website hosting
# 3. Upload build/ folder contents
# 4. Create CloudFront distribution
# 5. Configure SSL certificate
# 6. Set up custom domain
```

### Option 4: Deploy to DigitalOcean

**Backend + Frontend (Single Droplet):**
```bash
# 1. Create Ubuntu droplet
# 2. Install Node.js 18+
# 3. Clone repository
# 4. Set up backend with PM2
# 5. Build frontend and serve with nginx
# 6. Configure SSL with Let's Encrypt
```

---

## 🔐 Security Checklist

### Backend Security

- [ ] HTTPS enabled
- [ ] Rate limiting active
- [ ] Helmet middleware enabled
- [ ] CORS configured correctly
- [ ] Environment variables secured
- [ ] Database credentials rotated
- [ ] API keys not exposed
- [ ] Security logging enabled
- [ ] Error messages don't leak info

### Frontend Security

- [ ] CSP headers configured
- [ ] No API keys in frontend code
- [ ] XSS protection enabled
- [ ] Clickjacking prevention (X-Frame-Options)
- [ ] HTTPS enforced
- [ ] Secure cookies (if using)
- [ ] Input validation everywhere

### Database Security

- [ ] RLS policies enabled
- [ ] Service role key secured
- [ ] Regular backups enabled
- [ ] No public access
- [ ] Strong passwords
- [ ] Audit logs enabled

---

## 📊 Monitoring Setup

### 1. Sentry (Error Tracking)

```bash
# 1. Create account at https://sentry.io
# 2. Create new project (React)
# 3. Copy DSN
# 4. Install: npm install @sentry/react
# 5. Uncomment code in src/lib/sentry.ts
# 6. Add DSN to .env.production
# 7. Redeploy
```

### 2. Langfuse (AI Observability)

```bash
# 1. Already configured in backend
# 2. Go to cloud.langfuse.com
# 3. View traces, costs, evaluations
# 4. Set up alerts for high costs
```

### 3. Uptime Monitoring

**UptimeRobot (Free):**
```bash
# 1. Go to uptimerobot.com
# 2. Add new monitor (HTTP)
# 3. URL: https://your-api.com/api/v1/health
# 4. Interval: 5 minutes
# 5. Set up alerts (email, SMS, Slack)
```

**Alternative: StatusCake, Pingdom**

### 4. Application Performance

**Google Analytics:**
```bash
# 1. Create GA4 property
# 2. Add tracking code to index.html
# 3. Track page views, user flow
```

**LogRocket (Optional):**
```bash
# Session replay + performance monitoring
npm install logrocket
```

---

## 🔄 Post-Deployment Tasks

### Immediate (Day 1)

- [ ] Verify app is accessible at production URL
- [ ] Test user registration end-to-end
- [ ] Test all core features work
- [ ] Check error tracking is capturing errors
- [ ] Verify service worker is registering
- [ ] Test PWA installation on mobile
- [ ] Check Lighthouse score (90+)
- [ ] Verify SSL certificate is valid
- [ ] Test rate limiting is working
- [ ] Monitor server logs for errors

### First Week

- [ ] Monitor error rates in Sentry
- [ ] Check API response times
- [ ] Review user feedback
- [ ] Test on multiple devices/browsers
- [ ] Verify offline mode works
- [ ] Check cache hit rates
- [ ] Monitor database performance
- [ ] Review Langfuse AI costs
- [ ] Set up automated backups
- [ ] Create staging environment

### Ongoing

- [ ] Weekly security scans
- [ ] Monthly dependency updates
- [ ] Review error logs
- [ ] Monitor uptime (target: 99.9%)
- [ ] Analyze user metrics
- [ ] Optimize slow endpoints
- [ ] Review and rotate API keys
- [ ] Database performance tuning
- [ ] Cost optimization

---

## 📞 Support & Maintenance

### Health Check Endpoints

**Backend:**
```bash
GET https://your-api.com/api/v1/health

Response:
{
  "status": "healthy",
  "services": {
    "api": "up",
    "database": "up"
  },
  "version": "1.0.0",
  "environment": "production"
}
```

**Frontend:**
```bash
GET https://your-app.com/

Should load without errors
Check Console for:
- "✅ App is ready for offline use"
- No error messages
```

### Emergency Contacts

```bash
# Backend Issues
- Check: https://your-api.com/api/v1/health
- Logs: PM2 logs or hosting platform logs
- Restart: pm2 restart luma-backend

# Frontend Issues
- Check: Browser console for errors
- Verify: Service worker status
- Clear: Cache and hard reload

# Database Issues
- Check: Supabase dashboard
- Backup: Automatic daily backups
- Restore: From Supabase dashboard
```

---

## 🎉 Launch Checklist

### Pre-Launch (Final Check)

- [ ] All tests passing
- [ ] Production builds successful
- [ ] Environment variables configured
- [ ] Database migrations completed
- [ ] SSL certificates valid
- [ ] Monitoring tools set up
- [ ] Error tracking active
- [ ] Backups configured
- [ ] Rate limiting tested
- [ ] Security scan passed

### Launch Day

- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Verify health checks
- [ ] Test user flows
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Announce launch (if applicable)
- [ ] Monitor user feedback

### Post-Launch

- [ ] Monitor for first 24 hours
- [ ] Fix any critical issues
- [ ] Respond to user feedback
- [ ] Optimize based on metrics
- [ ] Plan next features
- [ ] Celebrate! 🎉

---

## 🚨 Rollback Plan

If something goes wrong:

### Backend Rollback

```bash
# Vercel
vercel rollback

# Railway
# Use dashboard to rollback to previous deployment

# PM2
pm2 restart luma-backend
# Or restore from backup
```

### Frontend Rollback

```bash
# Vercel
vercel rollback

# S3/CloudFront
# Upload previous build files
aws s3 sync old-build/ s3://your-bucket/
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

### Database Rollback

```bash
# Supabase
# Restore from automatic backup in dashboard
# Or run rollback migrations if available
```

---

## 📚 Additional Resources

### Documentation
- Backend API: `backend/README.md`
- Frontend Guide: `FRONTEND_CRITICAL_FIXES_COMPLETE.md`
- Quick Start: `FRONTEND_QUICK_START.md`

### External Resources
- [Vercel Docs](https://vercel.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Sentry Setup](https://docs.sentry.io/platforms/javascript/guides/react/)
- [PWA Guide](https://web.dev/progressive-web-apps/)

---

## ✅ Deployment Complete!

Once all items are checked off, your Luma application is successfully deployed and ready for users! 🎊

**Key Metrics to Track:**
- Uptime: > 99.9%
- Error Rate: < 0.1%
- Response Time: < 500ms
- Lighthouse Score: > 90
- User Satisfaction: > 4.5/5

**Congratulations on launching Luma! 🚀**
