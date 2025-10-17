# Integration Tests Guide

## Overview

This directory contains comprehensive integration tests for the Luma mental wellness application. These tests verify that all features work correctly end-to-end, from authentication through all major features.

## Test Structure

### Test Suites

1. **auth-integration.test.js** (10 tests)
   - User registration
   - User login with/without Remember Me
   - Profile retrieval and updates
   - Session management
   - Token validation
   - Security validations (weak passwords, duplicate emails, etc.)

2. **chat-integration.test.js** (10 tests)
   - Conversation creation
   - Message sending and AI responses
   - Conversation history retrieval
   - Multiple conversations management
   - Message validation
   - Long message handling

3. **journal-integration.test.js** (12 tests)
   - Session creation (Present, Past, Future modes)
   - Entry creation with AI prompts
   - Follow-up entries with context
   - Session completion
   - Entry retrieval and history
   - Mode validation
   - Long entry handling

4. **goals-integration.test.js** (12 tests)
   - Goal creation with AI clarifications
   - Clarification answer submission
   - Action plan generation
   - Goal progress tracking
   - Goal completion
   - Different timeframes (1-month, 3-months, 6-months, 1-year+)
   - Goal validation

5. **tools-integration.test.js** (14 tests)
   - Brain Exercise creation and completion
   - Narrative Therapy with AI reframing
   - Future Me visualization with AI generation
   - Tool history and retrieval
   - Context validation
   - Long context handling

6. **phase3-integration.test.js** (10 tests)
   - Master Agent event logging
   - Nudge generation and retrieval
   - Nudge acceptance/dismissal
   - Feedback submission
   - Context snapshot retrieval
   - Wellness checkpoint rules
   - Risk mitigation rules
   - Engagement recovery rules

7. **phase4-langfuse-integration.test.js**
   - Langfuse observability integration
   - Trace and span creation
   - Evaluation rubrics
   - Performance monitoring

## Prerequisites

### 1. Backend Server Running

The backend server must be running on `http://localhost:4000` before running tests.

```bash
cd backend
npm run dev
```

### 2. Database Setup

Ensure all database migrations have been run:

```sql
-- Run in Supabase SQL Editor
-- 001 through 009 migrations
```

### 3. Environment Variables

Ensure your `.env` file is properly configured:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DEEPSEEK_API_KEY=your_deepseek_key
LANGFUSE_SECRET_KEY=your_langfuse_secret
LANGFUSE_PUBLIC_KEY=your_langfuse_public
LANGFUSE_HOST=https://cloud.langfuse.com
```

## Running Tests

### Run All Tests

Execute the comprehensive test runner to run all test suites in sequence:

```bash
cd backend/tests
node run-all-tests.js
```

This will:
- Check if the backend is running
- Run all test suites in order
- Generate a comprehensive summary report
- Exit with code 0 (success) or 1 (failure)

### Run Individual Test Suites

Run specific test suites individually:

```bash
# Authentication tests
node auth-integration.test.js

# Chat API tests
node chat-integration.test.js

# Journal API tests
node journal-integration.test.js

# Goals API tests
node goals-integration.test.js

# Tools API tests
node tools-integration.test.js

# Master Agent tests
node phase3-integration.test.js

# Langfuse integration tests
node phase4-langfuse-integration.test.js
```

### Run Tests in CI/CD

For continuous integration pipelines:

```bash
# Start backend in background
cd backend
npm run dev &
BACKEND_PID=$!

# Wait for backend to be ready
sleep 5

# Run tests
cd tests
node run-all-tests.js
TEST_EXIT_CODE=$?

# Cleanup
kill $BACKEND_PID

# Exit with test exit code
exit $TEST_EXIT_CODE
```

## Test Output

### Successful Test Example

```
✅ PASS - User registered successfully
   User ID: 123e4567-e89b-12d3-a456-426614174000
   Email: test@example.com
```

### Failed Test Example

```
❌ FAIL - Authentication failed: Invalid credentials
```

### Summary Report

```
╔════════════════════════════════════════════════════════════╗
║                    FINAL TEST SUMMARY                      ║
╚════════════════════════════════════════════════════════════╝

Test Suites:
  ✅ auth-integration.test.js              PASSED
  ✅ chat-integration.test.js              PASSED
  ✅ journal-integration.test.js           PASSED
  ✅ goals-integration.test.js             PASSED
  ✅ tools-integration.test.js             PASSED
  ✅ phase3-integration.test.js            PASSED
  ✅ phase4-langfuse-integration.test.js   PASSED

────────────────────────────────────────────────────────────
Total Test Suites:    7
Passed Test Suites:   7 ✅
Failed Test Suites:   0 ❌
Success Rate:         100.0%
Total Duration:       45.32s
────────────────────────────────────────────────────────────

🎉 ALL TEST SUITES PASSED! 🎉
✨ Your Luma application is production-ready! ✨
```

## Test Coverage

### Total Tests: 78 Integration Tests

- Authentication: 10 tests
- Chat: 10 tests
- Journal: 12 tests
- Goals: 12 tests
- Tools: 14 tests
- Master Agent: 10 tests
- Langfuse: 10 tests

### Features Covered

✅ User registration and login
✅ Session management and expiration
✅ AI-powered chat conversations
✅ Journal sessions with AI prompts (Present/Past/Future)
✅ Goal setting with AI clarifications
✅ Action plan generation
✅ Brain exercises
✅ Narrative therapy with AI reframing
✅ Future Me visualization with AI generation
✅ Master Agent event logging
✅ Intelligent nudge system
✅ User feedback collection
✅ Context integration
✅ Langfuse observability and evaluation

## Troubleshooting

### Backend Not Running

**Error:**
```
❌ ERROR: Backend server is not running!
```

**Solution:**
```bash
cd backend
npm run dev
```

### Database Connection Issues

**Error:**
```
❌ FAIL - Authentication failed: Database connection error
```

**Solution:**
- Check `.env` file has correct Supabase credentials
- Verify Supabase project is active
- Run database migrations

### API Timeout

**Error:**
```
❌ FAIL - Request timeout
```

**Solution:**
- Check backend logs for errors
- Verify DeepSeek API key is valid
- Ensure sufficient API credits

### Test Data Conflicts

**Error:**
```
❌ FAIL - Duplicate email error
```

**Solution:**
- Tests use unique timestamps in email addresses
- If issue persists, manually clean test data from database

## Best Practices

### 1. Run Tests Before Deployment

Always run the full test suite before deploying to production:

```bash
node run-all-tests.js
```

### 2. Keep Tests Independent

Each test suite:
- Creates its own test user
- Uses unique identifiers
- Cleans up after itself (where applicable)

### 3. Monitor Test Performance

Track test execution time to identify performance issues:

```bash
time node run-all-tests.js
```

### 4. Review Failed Tests Immediately

When tests fail:
1. Read the error message carefully
2. Check backend logs
3. Verify database state
4. Test manually via Postman/curl
5. Fix the issue
6. Re-run tests

## Adding New Tests

To add new integration tests:

1. Create a new test file: `feature-integration.test.js`
2. Follow the existing test structure:
   - Authentication setup
   - Feature-specific tests
   - Validation tests
   - Edge case tests
   - Test summary
3. Add to `run-all-tests.js` testFiles array
4. Update this guide with new test coverage

## Related Documentation

- [Backend API Documentation](../README.md)
- [Database Schema](../database/README.md)
- [Postman Collection](./API_Testing_Collection.postman.json)
- [Phase 3 Master Agent](./test-phase3-master-agent.js)
- [Phase 4 Langfuse](./phase4-langfuse-integration.test.js)

## Support

If you encounter issues with the tests:

1. Check backend logs: `backend/logs/`
2. Review database state in Supabase dashboard
3. Verify all environment variables are set
4. Ensure all dependencies are installed: `npm install`
5. Check Node.js version: `node --version` (should be 18+)

---

**Last Updated:** October 2025
**Test Suite Version:** 1.0.0
**Total Test Coverage:** 78 integration tests across 7 suites
