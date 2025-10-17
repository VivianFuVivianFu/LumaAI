# 🚂 Luma Backend - Railway Deployment Guide

## ✅ Deployment Status: **READY**

This backend is fully configured and ready to deploy to Railway.

---

## 📋 Pre-Deployment Checklist

- [x] Dockerfile created and optimized
- [x] .dockerignore configured
- [x] .gitignore updated
- [x] package.json scripts verified
- [x] tsconfig.json configured
- [x] .env.example created
- [x] Railway configuration added
- [x] Health check endpoint implemented

---

## 🚀 Quick Deploy to Railway

### Option 1: Railway Dashboard (Recommended)

1. **Login to Railway**
   ```
   https://railway.app/new
   ```

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Select the `backend` folder as root directory

3. **Configure Environment Variables**

   Go to your service → Variables tab and add:

   | Variable | Value | Example |
   |----------|-------|---------|
   | `NODE_ENV` | `production` | `production` |
   | `PORT` | `4000` | `4000` |
   | `FRONTEND_URL` | Your Vercel URL | `https://luma-ai.vercel.app` |
   | `SUPABASE_URL` | Your Supabase project URL | `https://xxx.supabase.co` |
   | `SUPABASE_ANON_KEY` | Your Supabase anon key | `eyJhbGc...` |
   | `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | `eyJhbGc...` |
   | `OPENAI_API_KEY` | Your OpenAI API key | `sk-proj-...` |
   | `LANGFUSE_SECRET_KEY` | (Optional) Langfuse secret | `sk-lf-...` |
   | `LANGFUSE_PUBLIC_KEY` | (Optional) Langfuse public | `pk-lf-...` |
   | `LANGFUSE_HOST` | (Optional) `https://cloud.langfuse.com` | `https://cloud.langfuse.com` |

4. **Deploy**
   - Railway will automatically build and deploy
   - Build time: ~2-3 minutes
   - Your backend URL: `https://your-app.railway.app`

---

### Option 2: Railway CLI

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Navigate to backend folder
cd backend

# 4. Initialize Railway project
railway init

# 5. Link to existing project (or create new)
railway link

# 6. Add environment variables
railway variables set NODE_ENV=production
railway variables set PORT=4000
railway variables set FRONTEND_URL=https://your-app.vercel.app
railway variables set SUPABASE_URL=your_supabase_url
railway variables set SUPABASE_ANON_KEY=your_anon_key
railway variables set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
railway variables set OPENAI_API_KEY=your_openai_key
railway variables set LANGFUSE_SECRET_KEY=your_langfuse_secret
railway variables set LANGFUSE_PUBLIC_KEY=your_langfuse_public
railway variables set LANGFUSE_HOST=https://cloud.langfuse.com

# 7. Deploy
railway up

# 8. View logs
railway logs

# 9. Open in browser
railway open
```

---

## 🔍 Verify Deployment

### 1. Health Check
```bash
curl https://your-app.railway.app/api/v1/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-17T..."
}
```

### 2. Root Endpoint
```bash
curl https://your-app.railway.app/
```

Expected response:
```json
{
  "message": "Luma Backend API",
  "version": "1.0.0",
  "endpoints": {
    "health": "/api/v1/health",
    "auth": "/api/v1/auth",
    "dashboard": "/api/v1/dashboard"
  }
}
```

### 3. Check Logs
```bash
railway logs --tail 100
```

Look for:
```
✅ Database connection successful
🚀 Luma Backend Server Started
⏰ Starting Phase 3 cron jobs...
🧹 Starting cache cleanup service...
```

---

## 🛠️ Build Process

Railway will execute:

```bash
# 1. Install dependencies
npm ci

# 2. Build TypeScript
npm run build

# 3. Start server
npm start
```

**Build Output:**
- `dist/` folder containing compiled JavaScript
- Type definitions (`.d.ts` files)
- Source maps for debugging

**Build Time:** ~2-3 minutes
**Deploy Time:** ~30 seconds

---

## 📊 Resource Requirements

### Recommended Railway Plan

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| **Memory** | 512MB | 1GB |
| **CPU** | Shared | Dedicated |
| **Storage** | 1GB | 5GB |
| **Plan** | Trial ($5/month) | Hobby ($5/month) |

**Why these specs:**
- Cron jobs require persistent memory
- OpenAI API calls need stable connection
- Database connections need adequate CPU

---

## 🔧 Post-Deployment Configuration

### 1. Update Frontend CORS

After deployment, update your frontend's API URL:

**Vercel Dashboard:**
1. Go to your Vercel project
2. Settings → Environment Variables
3. Update `VITE_API_URL` to `https://your-app.railway.app`
4. Redeploy frontend

**Or via CLI:**
```bash
vercel env rm VITE_API_URL production
vercel env add VITE_API_URL production
# Enter: https://your-app.railway.app
vercel --prod
```

### 2. Test Full Integration

```bash
# 1. Test signup
curl -X POST https://your-app.railway.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","full_name":"Test User"}'

# 2. Test login
curl -X POST https://your-app.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# 3. Test with frontend
# Open https://your-frontend.vercel.app
# Try signup → login → chat → goals → journal
```

---

## 🚨 Troubleshooting

### Issue 1: Build Fails

**Error:** `tsc: command not found`

**Solution:**
```bash
# Ensure devDependencies are installed during build
# Railway does this automatically, but verify:
railway run npm install
railway run npm run build
```

---

### Issue 2: Server Won't Start

**Error:** `Missing environment variable: SUPABASE_URL`

**Solution:**
```bash
# Check all variables are set
railway variables

# Add missing variables
railway variables set SUPABASE_URL=your_url
```

---

### Issue 3: Database Connection Failed

**Error:** `Database connection failed`

**Solution:**
1. Verify Supabase credentials are correct
2. Check Supabase project is not paused
3. Verify service role key (not anon key) is used
4. Check Railway logs: `railway logs`

---

### Issue 4: CORS Errors from Frontend

**Error:** `CORS policy blocked`

**Solution:**
```bash
# Update FRONTEND_URL to match your Vercel domain
railway variables set FRONTEND_URL=https://your-exact-vercel-url.vercel.app

# Restart service
railway restart
```

---

### Issue 5: Cron Jobs Not Running

**Symptoms:** No insights generated, nudges not appearing

**Solution:**
```bash
# Check logs for cron job messages
railway logs --tail 200 | grep CRON

# Should see:
# ⏰ Starting Phase 3 cron jobs...
# [CRON] Initializing cron jobs...
# [CRON] All cron jobs started successfully

# If not, check NODE_ENV is set:
railway variables | grep NODE_ENV
```

---

## 📈 Monitoring

### Railway Dashboard

1. **Metrics**: View CPU, Memory, Network usage
2. **Logs**: Real-time log streaming
3. **Deployments**: Track deployment history
4. **Usage**: Monitor monthly costs

### Custom Monitoring

Add to your Railway environment:

```bash
# Optional: Sentry for error tracking
railway variables set SENTRY_DSN=your_sentry_dsn

# Optional: DataDog for APM
railway variables set DD_API_KEY=your_datadog_key
```

---

## 🔄 Continuous Deployment

Railway auto-deploys on git push to `main`:

```bash
# 1. Make changes to backend
git add .
git commit -m "Update backend API"

# 2. Push to GitHub
git push origin main

# 3. Railway auto-detects and deploys
# Watch deployment: railway logs -f
```

**Disable auto-deploy:**
```bash
# In Railway dashboard:
# Settings → Deployments → Trigger: Manual
```

---

## 💰 Cost Estimation

| Service | Plan | Cost |
|---------|------|------|
| **Railway** | Trial | $5 credit (500 hours) |
| **Railway** | Hobby | $5/month |
| **Supabase** | Free | $0 (500MB DB) |
| **OpenAI** | Pay-as-you-go | ~$10-30/month |
| **Langfuse** | Free | $0 (optional) |

**Total for Test Phase:** $5-40/month

---

## 🎯 Production Checklist

Before going to production:

- [ ] All environment variables set correctly
- [ ] Database migrations applied
- [ ] Health check endpoint responding
- [ ] Cron jobs running successfully
- [ ] Frontend connected and CORS configured
- [ ] OpenAI API key has sufficient credits
- [ ] Monitoring/logging configured
- [ ] Backup strategy in place
- [ ] Error handling tested
- [ ] Load testing completed

---

## 🔐 Security Notes

1. **Never commit `.env` files** - Use Railway environment variables
2. **Rotate API keys** - Regularly update OpenAI and Supabase keys
3. **Use HTTPS only** - Railway provides this by default
4. **Enable rate limiting** - Already configured in middleware
5. **Monitor logs** - Watch for suspicious activity

---

## 📞 Support

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Supabase Docs**: https://supabase.com/docs
- **OpenAI API Docs**: https://platform.openai.com/docs

---

## ✅ Deployment Commands Summary

```bash
# Quick deploy
cd backend
railway login
railway init
railway up

# Add all environment variables (see .env.example)
railway variables set NODE_ENV=production
railway variables set PORT=4000
railway variables set FRONTEND_URL=https://your-app.vercel.app
railway variables set SUPABASE_URL=your_url
railway variables set SUPABASE_ANON_KEY=your_key
railway variables set SUPABASE_SERVICE_ROLE_KEY=your_key
railway variables set OPENAI_API_KEY=your_key
railway variables set LANGFUSE_SECRET_KEY=your_key
railway variables set LANGFUSE_PUBLIC_KEY=your_key
railway variables set LANGFUSE_HOST=https://cloud.langfuse.com

# View deployment
railway logs
railway status
railway open
```

---

**Status:** ✅ **DEPLOYMENT READY**

**Estimated Setup Time:** 10-15 minutes
**Build Time:** 2-3 minutes per deployment

🚀 Ready to deploy!
