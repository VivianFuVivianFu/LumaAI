# Alternative API Testing Methods - Comprehensive Guide

## Overview

This guide provides **3 alternative methods** to test Phase 3 (Master Agent) APIs when Postman tests are failing or difficult to maintain.

---

## Method 1: Node.js Test Script ⭐ **RECOMMENDED**

### Overview
A standalone JavaScript test suite that runs via Node.js command line. No GUI required, fully automated, includes color-coded output.

### Location
`backend/tests/test-phase3-master-agent.js`

### Advantages
✅ **Automated**: Run with single command
✅ **No Dependencies**: Works with Node.js 18+ (native fetch)
✅ **Color Output**: Easy to read results
✅ **Fast**: Runs in 10-30 seconds
✅ **CI/CD Ready**: Can be integrated into GitHub Actions
✅ **Self-Contained**: Creates test user, generates data, cleans up

### How to Use

#### Step 1: Ensure Backend is Running
```bash
cd backend
npm run dev

# Wait for:
# ✅ Database connection successful
# 🚀 Luma Backend Server Started on Port 4000
```

#### Step 2: Run Test Suite
```bash
node backend/tests/test-phase3-master-agent.js
```

#### Expected Output
```
╔═══════════════════════════════════════════════════════════╗
║        Phase 3 Master Agent API Test Suite               ║
║        Alternative to Postman                             ║
╚═══════════════════════════════════════════════════════════╝

━━━ 1. Authentication ━━━
✓ Registered user: phase3test1760333921@example.com
✓ User ID: 1a52bdb4-cb4f-4b6a-9b62-e8ecc6e1a99f

━━━ 2. Create Prerequisite Data ━━━
✓ Created goal: 0fbf6079-4c2e-46e7-b8e9-7464b75ef441
✓ Created journal session: abc-123-def
✓ Created mood check-in

━━━ 3. Event Logging ━━━
✓ Logged goal_created event: event-id-here
✓ Logged journal_completed event
✓ Logged mood_checkin event

━━━ 4. Get Nudges ━━━
ℹ home: No nudges (expected for new user)
ℹ chat: No nudges (expected for new user)
ℹ journal: No nudges (expected for new user)
ℹ goals: No nudges (expected for new user)
ℹ tools: No nudges (expected for new user)

━━━ 5. Nudge Interactions ━━━
⚠ No nudges available - skipping interaction tests
ℹ This is NORMAL for new users with minimal activity

━━━ 6. Record Feedback ━━━
✓ Recorded thumbs_up feedback: feedback-id-here
✓ Recorded thumbs_down feedback
✓ Recorded implicit_positive feedback

━━━ 7. Get Context Summary ━━━
✓ Retrieved context summary
ℹ   Active goals: 1
ℹ   Mood trend: improving
ℹ   Momentum score: 0.3
ℹ   Top themes: confidence, growth

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Test Suite Completed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Tests Passed:   20/20
  Success Rate:   100%
  Duration:       15.42s

Note: Empty nudges are EXPECTED for new users.
      Nudges require specific trigger conditions (see documentation).
```

### What It Tests
1. ✅ User registration and authentication
2. ✅ Create goal (prerequisite data)
3. ✅ Create journal session (prerequisite data)
4. ✅ Create mood check-in (prerequisite data)
5. ✅ Log goal_created event
6. ✅ Log journal_completed event
7. ✅ Log mood_checkin event
8. ✅ Get nudges for all 5 surfaces (home, chat, journal, goals, tools)
9. ✅ Accept nudge (if available)
10. ✅ Record thumbs_up feedback
11. ✅ Record thumbs_down feedback
12. ✅ Record implicit feedback
13. ✅ Get context summary

### Customization
Edit `backend/tests/test-phase3-master-agent.js` to:
- Add more test cases
- Modify timeout values
- Change test data
- Add assertions

---

## Method 2: cURL + Bash Script

### Overview
A shell script that uses cURL commands to test APIs. Works on any Unix-like system (Mac, Linux, WSL on Windows).

### Create Test Script
```bash
# Save as: backend/tests/test-phase3.sh
#!/bin/bash

BASE_URL="http://localhost:4000/api/v1"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "━━━ Phase 3 Master Agent API Tests ━━━"
echo ""

# Test 1: Register user
echo -e "${BLUE}Test 1: Register User${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test$(date +%s)@example.com\",\"password\":\"Test123!\",\"name\":\"Tester\"}")

ACCESS_TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -n "$ACCESS_TOKEN" ]; then
    echo -e "${GREEN}✓ User registered${NC}"
else
    echo -e "${RED}✗ Registration failed${NC}"
    exit 1
fi

# Test 2: Log Event
echo -e "${BLUE}Test 2: Log Event${NC}"
EVENT_RESPONSE=$(curl -s -X POST "$BASE_URL/master-agent/events" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "event_type": "goal_created",
    "source_feature": "goals",
    "source_id": "test-id",
    "event_data": {"test": true}
  }')

if echo $EVENT_RESPONSE | grep -q '"event_id"'; then
    echo -e "${GREEN}✓ Event logged${NC}"
else
    echo -e "${RED}✗ Event logging failed${NC}"
fi

# Test 3: Get Nudges
echo -e "${BLUE}Test 3: Get Nudges${NC}"
NUDGES_RESPONSE=$(curl -s -X GET "$BASE_URL/master-agent/nudges/home" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo $NUDGES_RESPONSE | grep -q '"nudges"'; then
    NUDGE_COUNT=$(echo $NUDGES_RESPONSE | grep -o '"nudges":\[' | wc -l)
    echo -e "${GREEN}✓ Nudges retrieved (count: array)${NC}"
else
    echo -e "${RED}✗ Nudges retrieval failed${NC}"
fi

# Test 4: Record Feedback
echo -e "${BLUE}Test 4: Record Feedback${NC}"
FEEDBACK_RESPONSE=$(curl -s -X POST "$BASE_URL/master-agent/feedback" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "feedback_type": "thumbs_up",
    "target_type": "ai_response",
    "target_id": "test-id",
    "rating": 5
  }')

if echo $FEEDBACK_RESPONSE | grep -q '"feedback_id"'; then
    echo -e "${GREEN}✓ Feedback recorded${NC}"
else
    echo -e "${RED}✗ Feedback recording failed${NC}"
fi

# Test 5: Get Context
echo -e "${BLUE}Test 5: Get Context Summary${NC}"
CONTEXT_RESPONSE=$(curl -s -X GET "$BASE_URL/master-agent/context" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo $CONTEXT_RESPONSE | grep -q '"context"'; then
    echo -e "${GREEN}✓ Context retrieved${NC}"
else
    echo -e "${RED}✗ Context retrieval failed${NC}"
fi

echo ""
echo -e "${GREEN}━━━ All Tests Completed ━━━${NC}"
```

### Usage
```bash
chmod +x backend/tests/test-phase3.sh
./backend/tests/test-phase3.sh
```

---

## Method 3: Postman CLI (Newman)

### Overview
Run Postman collections from command line using Newman. Best for CI/CD integration.

### Installation
```bash
npm install -g newman
npm install -g newman-reporter-htmlextra  # Optional: HTML reports
```

### Usage

#### Basic Run
```bash
newman run backend/tests/Phase3_Master_Agent.postman_collection.json \
  --environment backend/tests/Luma_Local.postman_environment.json
```

#### With HTML Report
```bash
newman run backend/tests/Phase3_Master_Agent.postman_collection.json \
  --environment backend/tests/Luma_Local.postman_environment.json \
  --reporters cli,htmlextra \
  --reporter-htmlextra-export ./test-report.html
```

#### Expected Output
```
Newman

Luma API - Phase 3 Master Agent

→ Setup: Get Auth Token / Register Test User
  POST http://localhost:4000/api/v1/auth/register [201 Created, 2.1KB, 543ms]
  ✓  User registered successfully

→ 1. Event Logging / 1.1 Log Event - Goal Created
  POST http://localhost:4000/api/v1/master-agent/events [201 Created, 215B, 32ms]
  ✓  Event logged successfully

→ 2. Get Nudges / 2.1 Get Nudges - Home Surface
  GET http://localhost:4000/api/v1/master-agent/nudges/home [200 OK, 187B, 18ms]
  ✓  Nudges retrieved

→ 3. Feedback / 3.1 Record Thumbs Up
  POST http://localhost:4000/api/v1/master-agent/feedback [201 Created, 189B, 25ms]
  ✓  Feedback recorded

→ 4. Context / 4.1 Get Context Summary
  GET http://localhost:4000/api/v1/master-agent/context [200 OK, 512B, 89ms]
  ✓  Context retrieved

┌─────────────────────────┬───────────────────┬───────────────────┐
│                         │          executed │            failed │
├─────────────────────────┼───────────────────┼───────────────────┤
│              iterations │                 1 │                 0 │
├─────────────────────────┼───────────────────┼───────────────────┤
│                requests │                 7 │                 0 │
├─────────────────────────┼───────────────────┼───────────────────┤
│            test-scripts │                14 │                 0 │
├─────────────────────────┼───────────────────┼───────────────────┤
│      prerequest-scripts │                 7 │                 0 │
├─────────────────────────┼───────────────────┼───────────────────┤
│              assertions │                 7 │                 0 │
├─────────────────────────┴───────────────────┴───────────────────┤
│ total run duration: 1.2s                                        │
├─────────────────────────────────────────────────────────────────┤
│ total data received: 3.2KB (approx)                             │
├─────────────────────────────────────────────────────────────────┤
│ average response time: 108ms [min: 18ms, max: 543ms, s.d.: 178ms] │
└─────────────────────────────────────────────────────────────────┘
```

---

## Method 4: Thunder Client (VS Code Extension)

### Overview
Lightweight REST API client built into VS Code. Great alternative to Postman with better IDE integration.

### Installation
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search "Thunder Client"
4. Click Install

### Import Collection
1. Click Thunder Client icon in sidebar
2. Click "Collections" tab
3. Click "..." menu → Import
4. Select `backend/tests/Phase3_Master_Agent.postman_collection.json`
5. Set Environment:
   - Click "Env" tab
   - Create new environment: "Luma Local"
   - Add variable: `base_url = http://localhost:4000/api/v1`

### Run Tests
1. Select "Luma API - Phase 3 Master Agent" collection
2. Click "Run All" button
3. View results in Thunder Client panel

### Advantages
✅ **Integrated in VS Code**: No need to switch applications
✅ **Lightweight**: Faster than Postman
✅ **Git-Friendly**: Collections stored as JSON
✅ **Free**: No paid features or account required
✅ **Keyboard Shortcuts**: Full VS Code integration

---

## Method 5: REST Client Extension (VS Code)

### Overview
Test APIs directly in `.http` files with VS Code extension. Great for version-controlled test files.

### Installation
1. Open VS Code
2. Install "REST Client" extension by Huachao Mao

### Create Test File
Create `backend/tests/phase3-api-tests.http`:

```http
### Variables
@base_url = http://localhost:4000/api/v1
@access_token = {{register_user.response.body.data.session.access_token}}

### 1. Register User
# @name register_user
POST {{base_url}}/auth/register
Content-Type: application/json

{
  "email": "test{{$timestamp}}@example.com",
  "password": "TestPass123!",
  "name": "API Tester"
}

### 2. Log Event - Goal Created
POST {{base_url}}/master-agent/events
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "event_type": "goal_created",
  "source_feature": "goals",
  "source_id": "test-goal-id",
  "event_data": {
    "goal_title": "Learn Spanish",
    "category": "personal-growth"
  }
}

### 3. Get Nudges - Home Surface
GET {{base_url}}/master-agent/nudges/home
Authorization: Bearer {{access_token}}

### 4. Record Feedback - Thumbs Up
POST {{base_url}}/master-agent/feedback
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "feedback_type": "thumbs_up",
  "target_type": "ai_response",
  "target_id": "test-id",
  "rating": 5,
  "comment": "Very helpful!"
}

### 5. Get Context Summary
GET {{base_url}}/master-agent/context
Authorization: Bearer {{access_token}}
```

### Usage
1. Open `phase3-api-tests.http` in VS Code
2. Click "Send Request" link above each request
3. View response in split view
4. Chain requests using `@name` and response references

### Advantages
✅ **Version Controlled**: `.http` files tracked in git
✅ **No Extra Tools**: Just VS Code extension
✅ **Variables**: Dynamic values and response chaining
✅ **Fast**: Click to test, instant feedback
✅ **Documentation**: Test file IS documentation

---

## Comparison Matrix

| Method | Setup Time | Automation | CI/CD Ready | GUI | Learning Curve |
|--------|-----------|-----------|-------------|-----|----------------|
| **Node.js Script** ⭐ | 0 min | ✅ Full | ✅ Yes | ❌ No | Low |
| **cURL/Bash** | 5 min | ✅ Full | ✅ Yes | ❌ No | Medium |
| **Newman (Postman CLI)** | 2 min | ✅ Full | ✅ Yes | ❌ No | Low |
| **Thunder Client** | 2 min | ⚠️ Manual | ❌ No | ✅ Yes | Very Low |
| **REST Client (.http)** | 1 min | ⚠️ Manual | ⚠️ Partial | ✅ Yes | Low |
| **Postman GUI** | 0 min | ⚠️ Manual | ⚠️ Via Newman | ✅ Yes | Low |

---

## Recommended Workflow

### For Development (Daily Testing)
1. **Use REST Client (.http files)** for quick manual tests
2. **Use Thunder Client** for interactive debugging
3. **Run Node.js script** before commits

### For CI/CD Pipeline
1. **Use Node.js script** as primary test runner
2. **Use Newman** if you prefer Postman collections
3. Generate HTML reports for test results

### For Documentation
1. **Maintain `.http` files** as live documentation
2. **Keep Postman collection** for team sharing
3. **Update Node.js script** as source of truth

---

## Troubleshooting

### Issue: "fetch is not defined"
**Solution**: Upgrade to Node.js 18+ or install node-fetch
```bash
npm install node-fetch
# Then add to script: import fetch from 'node-fetch';
```

### Issue: "Connection refused"
**Solution**: Ensure backend is running on port 4000
```bash
curl http://localhost:4000/api/v1/health
# Should return: {"success":true,"message":"Luma API is running"}
```

### Issue: "401 Unauthorized"
**Solution**: Token expired, re-register or login
```bash
# Get new token
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"new@test.com","password":"Test123!","name":"Tester"}'
```

### Issue: "Nudges always empty"
**Solution**: This is EXPECTED for new users. See [PHASE3_API_ANALYSIS.md](PHASE3_API_ANALYSIS.md) for how to generate nudges.

---

## Best Practices

### 1. Always Test Authentication First
```javascript
// Bad: Hardcode token
const token = 'eyJhbGci...';

// Good: Get token dynamically
const registerRes = await register();
const token = registerRes.data.session.access_token;
```

### 2. Handle Empty Nudges Gracefully
```javascript
// Bad: Assume nudges exist
const nudgeId = nudges[0].id; // ERROR if empty

// Good: Check array first
if (nudges.length > 0) {
  const nudgeId = nudges[0].id;
} else {
  console.log('No nudges (expected for new user)');
}
```

### 3. Use Timeouts for AI Endpoints
```javascript
// Goals API calls OpenAI (10-30s response time)
const response = await fetch(url, {
  ...options,
  signal: AbortSignal.timeout(60000), // 60 second timeout
});
```

### 4. Log Useful Information
```javascript
// Bad: Silent failure
if (!response.ok) return;

// Good: Descriptive logging
if (!response.ok) {
  console.error(`Failed: ${response.status} ${response.statusText}`);
  console.error(await response.text());
}
```

---

## Next Steps

1. ✅ **Choose your preferred testing method** from above
2. ✅ **Run initial test** to verify setup
3. ✅ **Integrate into workflow** (CI/CD or daily dev)
4. ✅ **Document failures** and share with team
5. ✅ **Keep tests updated** as APIs evolve

---

## Additional Resources

- [PHASE3_API_ANALYSIS.md](PHASE3_API_ANALYSIS.md) - Detailed API analysis
- [GOALS_API_FIX_PERMANENT.md](GOALS_API_FIX_PERMANENT.md) - Goals API fix documentation
- [Phase 3 Foundation Complete](PHASE3_FOUNDATION_COMPLETE.md) - Phase 3 overview
- [Postman Collection](backend/tests/Phase3_Master_Agent.postman_collection.json) - Original collection

---

**Last Updated**: 2025-10-13
**Maintained By**: Development Team
**Status**: Production Ready
