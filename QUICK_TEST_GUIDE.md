# Luma - Quick Testing Guide
## 5-Minute Manual QA Checklist

**Use this checklist before every deployment**

---

## ✅ Pre-Flight Checks (2 minutes)

### 1. Servers Running
```powershell
# Backend
cd backend
.\debug-helper.ps1 ports

# Expected: Port 4000 in use ✓
# Expected: Port 3000 in use ✓
```

### 2. Health Check
```powershell
.\debug-helper.ps1 health

# Expected: 200 status
# Expected: All services "healthy"
```

### 3. Environment Variables
```powershell
.\debug-helper.ps1 env

# Expected: All critical variables ✓
```

---

## 🧪 Critical Path Testing (3 minutes)

### Test 1: Authentication (30 seconds)

#### Register New User
1. Open http://localhost:3000
2. Click "Sign Up"
3. Enter:
   - Email: `test+[timestamp]@example.com`
   - Password: `TestPass123!`
   - Name: `Test User`
4. **✓ Should**: Navigate to onboarding
5. **✗ Fail if**: Error message appears

#### Login Existing User
1. Open http://localhost:3000
2. Click "Sign In"
3. Enter:
   - Email: `vivianfu2020@gmail.com`
   - Password: `shuwei1984`
4. **✓ Should**: Navigate to dashboard
5. **✗ Fail if**: "Invalid credentials" or error

---

### Test 2: Chat Functionality (60 seconds)

1. From dashboard, click "Chat with Luma"
2. Type: `Hello, I need support`
3. Click Send
4. **✓ Should**:
   - Message appears in chat
   - AI response received within 3-5 seconds
   - Response is relevant and empathetic
5. **✗ Fail if**:
   - 500 error
   - No response after 10 seconds
   - Error message displayed

**Quick Test Message**: "I'm feeling anxious about work"
**Expected**: Empathetic response with support resources

---

### Test 3: Goals Creation (45 seconds)

1. From dashboard, click "Thrive with Luma"
2. Click "Create New Goal"
3. Fill form:
   - Title: `Build healthy boundaries`
   - Category: `Personal Growth`
   - Timeframe: `3 months`
4. Click "Generate Action Plan"
5. **✓ Should**:
   - Loading indicator appears
   - Goal card displays with 3 weekly actions
   - Can view goal details
6. **✗ Fail if**:
   - 500 error
   - Empty action list
   - Loading never completes

---

### Test 4: Tools/Brain Exercise (45 seconds)

1. From dashboard, click "Practice with Luma"
2. Click "Brain Exercises"
3. Click "Cognitive Reframe"
4. Enter:
   - Negative thought: `I always fail`
   - Context: `Work presentation`
5. Click "Get Reframe"
6. **✓ Should**:
   - AI generates positive reframe
   - Reframe is logical and supportive
   - Can save to history
7. **✗ Fail if**:
   - 500 error
   - No reframe generated
   - Generic/unhelpful response

---

### Test 5: Dashboard Features (30 seconds)

1. Navigate to dashboard
2. Check that all sections render:
   - [ ] Greeting with user name
   - [ ] Mood check-in slider
   - [ ] "How can I support you" cards
   - [ ] Progress & Wellbeing chart
3. Click "Submit" on mood check-in
4. **✓ Should**: Green checkmark appears
5. **✗ Fail if**: Error or no response

---

## 🔍 API Testing (Optional - 2 minutes)

### Quick API Test Script
```powershell
cd backend
.\debug-helper.ps1 test

# This will automatically test:
# ✓ Login endpoint
# ✓ Chat endpoints
# ✓ Goals endpoints
```

### Manual API Test (if script fails)
```powershell
# 1. Login
curl -X POST http://localhost:4000/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"vivianfu2020@gmail.com","password":"shuwei1984"}'

# Expected: 200 status, access_token in response

# 2. Health Check
curl http://localhost:4000/api/v1/health

# Expected: 200 status, all checks "healthy"
```

---

## 🚨 Error Scenarios to Test

### Test Error Handling

1. **Invalid Login**
   - Email: `wrong@example.com`
   - Password: `wrongpass`
   - **Expected**: "Invalid credentials" message (NOT crash)

2. **Empty Chat Message**
   - Send empty message
   - **Expected**: Validation error or disabled button

3. **Network Interruption**
   - Disable network mid-request
   - **Expected**: Error message with retry option

4. **Rate Limiting**
   - Send 20 chat messages in 10 seconds
   - **Expected**: Rate limit message after 10 requests

---

## 📊 Performance Checks

### Response Time Targets

| Endpoint | Target | Max Acceptable |
|----------|--------|----------------|
| Login | <1s | 2s |
| Chat Message | <3s | 5s |
| Goal Creation | <4s | 8s |
| Brain Exercise | <3s | 6s |
| Dashboard Load | <1s | 2s |

### How to Test
1. Open browser DevTools (F12)
2. Go to Network tab
3. Perform action
4. Check "Time" column
5. **✗ Fail if**: Exceeds Max Acceptable

---

## 🐛 Common Issues & Quick Fixes

### Issue: "Cannot GET /"
**Cause**: Frontend not running
**Fix**:
```powershell
cd frontend
npm run dev
```

### Issue: 500 Internal Server Error
**Cause**: Backend error
**Fix**:
```powershell
cd backend
.\debug-helper.ps1 logs
# Check error.log for details
```

### Issue: "Network Error"
**Cause**: Backend not running or wrong port
**Fix**:
```powershell
cd backend
.\debug-helper.ps1 ports
# If port 4000 not in use:
npm run dev
```

### Issue: Slow Responses
**Cause**: OpenAI API delay or rate limit
**Check**:
```powershell
.\debug-helper.ps1 env
# Verify OPENAI_API_KEY is set
```

---

## 📝 Test Report Template

After completing tests, fill this out:

```
Date: [Today's Date]
Tester: [Your Name]
Build: [Git commit hash or version]

✅ PASSED (9/9)
- [ ] Servers running
- [ ] Health check
- [ ] Authentication
- [ ] Chat functionality
- [ ] Goals creation
- [ ] Brain exercises
- [ ] Dashboard rendering
- [ ] Mood check-in
- [ ] Error handling

🔴 FAILED (0/9)
[List any failures here]

⚠️ NOTES
[Any concerns or observations]

🚀 DEPLOYMENT RECOMMENDATION
[ ] APPROVE - All tests passed
[ ] REJECT - Critical failures found
[ ] CONDITIONAL - Minor issues, deploy with monitoring
```

---

## 🎯 Regression Testing (Weekly)

In addition to above, test these monthly:

### Edge Cases
- [ ] Very long chat message (>2000 chars)
- [ ] Special characters in goal title
- [ ] Multiple rapid mood check-ins
- [ ] Concurrent API requests

### Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (if Mac available)
- [ ] Edge (latest)

### Mobile Testing
- [ ] Responsive design (mobile view)
- [ ] Touch interactions work
- [ ] No horizontal scroll

---

## 🔧 Advanced Testing (Optional)

### Load Testing
```bash
# Install k6
# Create test script
k6 run load-test.js

# Target: 100 concurrent users
# Expected: <5% error rate
```

### Security Testing
```bash
# Check for vulnerabilities
npm audit

# Test rate limiting
# Send 100 requests in 1 second
# Expected: Rate limit triggered
```

---

## 📞 When to Escalate

### 🟢 Green - Deploy
- All critical path tests pass
- No error logs
- Response times acceptable
- Zero 500 errors

### 🟡 Yellow - Deploy with Monitoring
- 1-2 minor UI issues
- Slightly slow responses (but under max)
- Non-critical feature issues

### 🔴 Red - DO NOT Deploy
- Authentication broken
- Chat not working
- Goals creation failing
- Multiple 500 errors
- Critical security issue

---

## 🚀 Quick Start for New QA Engineers

### First Time Setup
1. Clone repository
2. Install dependencies: `npm install` (both frontend & backend)
3. Copy `.env.example` to `.env.development`
4. Start servers: `npm run dev` in both directories
5. Run this checklist

### Daily Testing Routine
1. Pull latest changes: `git pull`
2. Restart servers
3. Run 5-minute checklist
4. Report any issues in Slack/GitHub

### Before Each Deployment
1. Run full checklist (5 min)
2. Check API tests: `.\debug-helper.ps1 test`
3. Review error logs: `.\debug-helper.ps1 logs`
4. Fill out test report
5. Get approval from lead

---

**Last Updated**: October 16, 2025
**Version**: 1.0
**Maintained By**: QA Team
