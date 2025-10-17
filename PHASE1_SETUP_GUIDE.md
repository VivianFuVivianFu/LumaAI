# Phase 1: Foundation - Setup & Testing Guide

## ✅ What Has Been Implemented

### Backend (Node.js + Express + TypeScript)
- **Server**: Express server with CORS, error handling, logging
- **Authentication**: Email/password registration and login via Supabase Auth
- **Dashboard**: Mood check-in submission and history retrieval
- **Database**: PostgreSQL via Supabase with Row Level Security
- **Validation**: Request validation with Zod schemas
- **Security**: JWT-based authentication, helmet, CORS

### Frontend (React + TypeScript)
- **API Client**: Centralized API client with error handling
- **Auth Context**: Real API integration (no more mocks)
- **Registration**: Email/password signup form
- **Login**: Email/password login form
- **Dashboard**: Real mood check-in with backend integration

---

## 🚀 Setup Instructions

### Step 1: Set Up Supabase Database

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Open the SQL Editor
3. Copy and paste the entire content of `backend/database-setup.sql`
4. Click "Run" to execute the script
5. Verify tables were created:
   - Go to "Database" → "Tables"
   - You should see: `users` and `mood_checkins`

### Step 2: Start the Backend Server

```bash
# Navigate to backend directory
cd backend

# Start the development server
npm run dev
```

You should see:
```
╔════════════════════════════════════════╗
║   🚀 Luma Backend Server Started      ║
╠════════════════════════════════════════╣
║   Environment: development             ║
║   Port:        3001                    ║
║   Frontend:    http://localhost:5173   ║
╠════════════════════════════════════════╣
║   API Base:    http://localhost:3001/api/v1 ║
║   Health:      http://localhost:3001/api/v1/health  ║
╚════════════════════════════════════════╝
```

### Step 3: Start the Frontend

```bash
# Navigate back to root directory
cd ..

# Start the frontend development server
npm run dev
```

Frontend will start on `http://localhost:5173`

---

## 🧪 Testing Guide

### Test 1: Backend Health Check

```bash
# Test backend is running
curl http://localhost:3001/api/v1/health
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Luma API is running",
  "timestamp": "2025-01-12T..."
}
```

### Test 2: User Registration

1. Open `http://localhost:5173` in your browser
2. You should see the onboarding screens (swipe through them)
3. Click "Get Started"
4. Fill in the registration form:
   - Name: "Test User"
   - Email: "test@example.com"
   - Password: "password123"
   - Confirm Password: "password123"
5. Click "Create Account"

**Expected Result**:
- Loading indicator appears
- You should be redirected to the Dashboard
- Greeting shows: "Good [time of day], Test User"

**Verify in Supabase**:
1. Go to Supabase Dashboard → Authentication → Users
2. You should see your new user
3. Go to Database → Tables → `users`
4. You should see your user profile

### Test 3: User Login

1. Click "Logout" or clear localStorage
2. You should see the registration screen
3. Click "Already have an account? Login"
4. Enter:
   - Email: "test@example.com"
   - Password: "password123"
5. Click "Login"

**Expected Result**:
- You should be logged in and see the Dashboard

### Test 4: Mood Check-In

1. On the Dashboard, find the "Mood Check-in" section
2. Move the slider to select a mood (1-5)
3. Click "Submit"

**Expected Result**:
- Button changes to green with checkmark
- Shows "Submitted"
- After 3 seconds, button resets

**Verify in Supabase**:
1. Go to Database → Tables → `mood_checkins`
2. You should see your mood entry with:
   - user_id (your user's ID)
   - mood_value (1-5)
   - created_at (timestamp)

### Test 5: Protected Routes

**Test with cURL**:

```bash
# Try to access protected route without token (should fail)
curl http://localhost:3001/api/v1/dashboard/mood-history

# Expected: 401 Unauthorized

# Get your token from browser localStorage:
# Open browser console and run: localStorage.getItem('luma_auth_token')

# Try again with token
curl http://localhost:3001/api/v1/dashboard/mood-history \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Expected: List of mood check-ins
```

### Test 6: Mood History API

```bash
# Get mood history (requires token)
curl http://localhost:3001/api/v1/dashboard/mood-history?days=7 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "mood_checkins": [...],
    "stats": {
      "average_mood": 3.5,
      "trend_direction": "steady",
      "total_checkins": 1
    }
  }
}
```

### Test 7: Dashboard Stats

```bash
# Get dashboard stats
curl http://localhost:3001/api/v1/dashboard/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "mood_trend": [4],
    "streaks": {
      "journaling": 0,
      "reflection": 0
    },
    "active_goals_count": 0,
    "average_mood": 4,
    "trend_direction": "steady"
  }
}
```

---

## 🔍 Troubleshooting

### Backend won't start

**Error**: "Database connection test failed"
- **Solution**: Check your `.env` file has correct Supabase credentials
- Run the database setup SQL script in Supabase SQL Editor

**Error**: "Port 3001 is already in use"
- **Solution**: Kill the process using port 3001 or change PORT in `.env`

### Frontend can't connect to backend

**Error**: "Network error" or "CORS error"
- **Solution**:
  1. Make sure backend is running on port 3001
  2. Check `backend/src/config/cors.config.ts` includes your frontend URL
  3. Clear browser cache and reload

### Registration fails

**Error**: "Registration failed"
- **Solution**:
  1. Check browser console for detailed error
  2. Verify Supabase Auth is enabled in your project
  3. Check that database trigger `on_auth_user_created` exists

### Token expired errors

**Error**: "Invalid or expired token"
- **Solution**:
  1. Logout and login again
  2. Clear localStorage: `localStorage.clear()`
  3. Tokens expire after 7 days by default

### Mood check-in not saving

**Error**: "Failed to submit mood check-in"
- **Solution**:
  1. Check you're logged in (token exists)
  2. Verify `mood_checkins` table exists in Supabase
  3. Check RLS policies are set up correctly
  4. Look at backend logs for detailed error

---

## 📊 Database Verification

### Check User Count
```sql
SELECT COUNT(*) FROM public.users;
```

### Check Recent Mood Check-ins
```sql
SELECT * FROM public.mood_checkins
ORDER BY created_at DESC
LIMIT 10;
```

### Check User's Mood Average
```sql
SELECT
  u.name,
  AVG(m.mood_value) as avg_mood,
  COUNT(m.id) as total_checkins
FROM public.users u
LEFT JOIN public.mood_checkins m ON m.user_id = u.id
GROUP BY u.id, u.name;
```

---

## 🎯 Success Criteria Checklist

- [ ] Backend server starts without errors
- [ ] Frontend connects to backend successfully
- [ ] Can register a new user
- [ ] User appears in Supabase Auth and `users` table
- [ ] Can login with registered credentials
- [ ] Token is stored in localStorage
- [ ] Protected routes require authentication
- [ ] Can submit mood check-in
- [ ] Mood check-in appears in `mood_checkins` table
- [ ] Can retrieve mood history
- [ ] Dashboard stats endpoint works
- [ ] Logout clears token and redirects to login

---

## 📝 API Endpoint Summary

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/v1/auth/register` | No | Register new user |
| POST | `/api/v1/auth/login` | No | Login user |
| GET | `/api/v1/auth/me` | Yes | Get current user |
| POST | `/api/v1/auth/logout` | Yes | Logout user |
| PUT | `/api/v1/auth/profile` | Yes | Update profile |
| POST | `/api/v1/dashboard/mood-checkin` | Yes | Submit mood |
| GET | `/api/v1/dashboard/mood-history` | Yes | Get mood history |
| GET | `/api/v1/dashboard/stats` | Yes | Get dashboard stats |
| GET | `/api/v1/health` | No | Health check |

---

## 🎓 Next Steps (Phase 2)

Once Phase 1 is fully tested and working:

1. **Chat Feature**: Integrate OpenAI GPT for real-time chat
2. **Journal Feature**: Create journal entries with AI analysis
3. **Goals Feature**: CRUD operations for goal management
4. **Tools Feature**: Implement CBT/DBT tools with AI guidance

---

## 📞 Getting Help

If you encounter issues:

1. Check browser console (F12 → Console tab)
2. Check backend logs in terminal
3. Verify Supabase dashboard for data
4. Check network tab for API call failures
5. Review error messages carefully

---

## 🔐 Security Notes

- **Never commit `.env` files** to version control
- **JWT tokens** are stored in localStorage (consider httpOnly cookies for production)
- **Row Level Security** (RLS) is enabled on all tables
- **Passwords** are hashed by Supabase Auth
- **CORS** is configured for localhost only (update for production)

---

## ✅ Phase 1 Complete!

Once all tests pass, you have successfully implemented:
- ✅ Full authentication system
- ✅ Mood tracking with database persistence
- ✅ Secure API with JWT authentication
- ✅ Frontend-backend integration
- ✅ Scalable architecture ready for Phase 2

**Estimated Completion Time**: 1-2 hours (if no issues)

Ready to proceed to **Phase 2: Core Features** (Chat, Journal, Goals, Tools)!
