# Environment Files Guide 📝

## ⚠️ IMPORTANT: DO NOT DELETE ANY .env FILES

The `.env` files are **NOT duplicates**. They serve different purposes:

---

## 📁 File Structure & Purpose

### Frontend Environment Files (Root Directory)
**Location:** `C:\Users\vivia\OneDrive\Desktop\Figma\`

| File | Purpose | Used By | Variables Start With |
|------|---------|---------|---------------------|
| `.env` | **Active environment** (copy from one of below) | Vite build | `VITE_` |
| `.env.development` | Local development configuration | Development | `VITE_` |
| `.env.staging` | Staging deployment configuration | Staging | `VITE_` |
| `.env.production` | Production deployment configuration | Production | `VITE_` |

**Purpose:** Configure the React/Vite **frontend** application
**Technology:** Vite requires variables prefixed with `VITE_`

### Backend Environment Files (Backend Directory)
**Location:** `C:\Users\vivia\OneDrive\Desktop\Figma\backend\`

| File | Purpose | Used By | Variables |
|------|---------|---------|-----------|
| `.env` | **Active environment** (currently development) | Node.js | Standard Node vars |
| `.env.development` | Local development configuration | Development | Standard Node vars |
| `.env.staging` | Staging deployment configuration | Staging | Standard Node vars |
| `.env.production` | Production deployment configuration | Production | Standard Node vars |

**Purpose:** Configure the Node.js/Express **backend** API
**Technology:** Standard Node.js environment variables

---

## 🔄 How They Work Together

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (.env)                         │
│  VITE_API_URL=http://localhost:4000/api/v1                 │
│                          │                                   │
│                          │ Makes API requests to            │
│                          ▼                                   │
│                     Backend (.env)                          │
│  PORT=4000                                                  │
│  SUPABASE_URL=...                                           │
│  OPENAI_API_KEY=...                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Current Configuration Status

### ✅ Frontend Files (KEEP ALL)

**`.env`** (Active - Development)
```bash
VITE_API_URL=http://localhost:4000/api/v1
VITE_APP_NAME=Luma
```
**Status:** ✅ Currently set to development
**Action:** Keep as-is for local development

**`.env.development`** (Template)
```bash
VITE_API_URL=http://localhost:4000/api/v1
VITE_ENABLE_SERVICE_WORKER=false
VITE_ENABLE_ERROR_TRACKING=false
```
**Status:** ✅ Properly configured
**Action:** Keep as template

**`.env.staging`** (Template)
```bash
VITE_API_URL=https://luma-backend-staging.vercel.app/api/v1
VITE_ENABLE_SERVICE_WORKER=true
VITE_ENABLE_ERROR_TRACKING=true
```
**Status:** ✅ Properly configured
**Action:** Keep as template

**`.env.production`** (Template)
```bash
VITE_API_URL=https://your-production-domain.com/api/v1
VITE_ENABLE_SERVICE_WORKER=true
VITE_ENABLE_ERROR_TRACKING=true
```
**Status:** ⚠️ Needs production URL update
**Action:** Keep as template, update before production deployment

### ✅ Backend Files (KEEP ALL)

**`backend/.env`** (Active - Development)
```bash
NODE_ENV=development
PORT=4000
SUPABASE_URL=https://ibuwjozsonmbpdvrlneb.supabase.co
OPENAI_API_KEY=sk-proj-...
```
**Status:** ✅ Properly configured with real credentials
**Action:** Keep as-is for local development

**`backend/.env.development`** (Template)
```bash
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:3000
```
**Status:** ✅ Properly configured with real credentials
**Action:** Keep as template

**`backend/.env.staging`** (Template)
```bash
NODE_ENV=staging
PORT=4000
FRONTEND_URL=https://luma-staging.vercel.app
```
**Status:** ✅ Properly configured with real credentials
**Action:** Keep as template

**`backend/.env.production`** (Template)
```bash
NODE_ENV=production
PORT=4000
FRONTEND_URL=http://localhost:3000
```
**Status:** ⚠️ Needs production URL update
**Action:** Keep as template, update before production deployment

---

## 🔄 How to Switch Environments

### For Local Development (Current Setup)
```bash
# Frontend uses .env (already points to .env.development)
# Backend uses backend/.env (already configured)

# No changes needed - already configured!
```

### For Staging Deployment
```bash
# Frontend
cp .env.staging .env

# Backend
cd backend
cp .env.staging .env
cd ..

# Deploy
./deploy-staging.sh
```

### For Production Deployment
```bash
# Frontend
cp .env.production .env

# Backend
cd backend
cp .env.production .env
cd ..

# Deploy
./deploy-production.sh
```

---

## ⚠️ Common Mistakes to Avoid

### ❌ DON'T Delete Files
```bash
# ❌ WRONG - Don't do this!
rm .env.staging
rm backend/.env.production
```
**Reason:** You'll need these templates for deployment

### ❌ DON'T Mix Frontend/Backend Variables
```bash
# ❌ WRONG - Backend variables in frontend .env
NODE_ENV=production
SUPABASE_URL=...

# ✅ CORRECT - Only VITE_ variables in frontend
VITE_API_URL=...
VITE_APP_NAME=Luma
```

### ❌ DON'T Commit .env with Secrets
```bash
# ❌ WRONG - Don't commit active .env files
git add .env
git add backend/.env

# ✅ CORRECT - Only commit templates
git add .env.example
git add backend/.env.example
```

---

## 🔐 Security Best Practices

### Template Files vs Active Files

**Template Files** (`.env.example`, `.env.development`, etc.)
- ✅ Safe to commit to Git
- ✅ Should have placeholder values or development credentials
- ✅ Used as templates for deployment

**Active Files** (`.env`, `backend/.env`)
- ❌ Should NOT be committed to Git
- ❌ Contains real credentials and secrets
- ❌ Created by copying from templates

### Current .gitignore Configuration
```bash
# These are ignored (safe)
.env
backend/.env

# These can be committed (templates)
.env.development
.env.staging
.env.production
backend/.env.development
backend/.env.staging
backend/.env.production
```

---

## 📊 Environment Variable Reference

### Frontend Variables (VITE_ prefix)

| Variable | Purpose | Development | Staging | Production |
|----------|---------|-------------|---------|------------|
| `VITE_API_URL` | Backend API endpoint | `http://localhost:4000/api/v1` | `https://backend-staging.vercel.app/api/v1` | `https://api.luma.app/api/v1` |
| `VITE_APP_ENVIRONMENT` | Current environment | `development` | `staging` | `production` |
| `VITE_ENABLE_SERVICE_WORKER` | Enable PWA offline mode | `false` | `true` | `true` |
| `VITE_ENABLE_ERROR_TRACKING` | Enable Sentry | `false` | `true` | `true` |
| `VITE_ENABLE_DEBUG_LOGGING` | Console logging | `true` | `true` | `false` |

### Backend Variables (Standard Node.js)

| Variable | Purpose | Development | Staging | Production |
|----------|---------|-------------|---------|------------|
| `NODE_ENV` | Node environment | `development` | `staging` | `production` |
| `PORT` | Server port | `4000` | `4000` | `4000` |
| `FRONTEND_URL` | CORS origin | `http://localhost:3000` | `https://luma-staging.vercel.app` | `https://luma.app` |
| `SUPABASE_URL` | Database URL | Same for all | Same for all | Same for all |
| `OPENAI_API_KEY` | AI API key | Same for all | Same for all | Same for all |

---

## 🚀 Quick Commands

### Check Current Environment
```bash
# Frontend
cat .env | head -5

# Backend
cat backend/.env | head -5
```

### Switch to Staging
```bash
cp .env.staging .env
cp backend/.env.staging backend/.env
```

### Switch to Production
```bash
cp .env.production .env
cp backend/.env.production backend/.env
```

### Reset to Development
```bash
cp .env.development .env
cp backend/.env.development backend/.env
```

---

## ✅ Summary

**What to Keep:**
- ✅ All `.env.*` files in root directory (frontend templates)
- ✅ All `backend/.env.*` files (backend templates)
- ✅ Current `.env` and `backend/.env` (active configs)

**What to Update:**
- ⚠️ `.env.production` - Update `VITE_API_URL` before production deploy
- ⚠️ `backend/.env.production` - Update `FRONTEND_URL` before production deploy

**What to Delete:**
- ❌ **NOTHING** - All files are needed!

---

## 🎯 Action Required

Before production deployment:

1. **Update Frontend Production URL**
   ```bash
   # Edit .env.production
   VITE_API_URL=https://api.luma.app/api/v1
   ```

2. **Update Backend Production URL**
   ```bash
   # Edit backend/.env.production
   FRONTEND_URL=https://luma.app
   ```

3. **Verify All Credentials**
   - Supabase credentials ✅ (already configured)
   - OpenAI API key ✅ (already configured)
   - Langfuse keys ✅ (already configured)
   - Sentry DSN ⚠️ (optional, needs setup)

---

**Remember:** These files work together but serve different purposes. Keep them all! 🎉
