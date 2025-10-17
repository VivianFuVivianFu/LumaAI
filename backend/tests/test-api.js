#!/usr/bin/env node

/**
 * Luma API Testing Script (Node.js)
 * Cross-platform API testing without external dependencies
 *
 * Usage: node test-api.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:4000';
const API_BASE = '/api/v1';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
};

// Test state
let testsPassed = 0;
let testsFailed = 0;
let accessToken = '';
let userId = '';
let conversationId = '';
let sessionId = '';
let goalId = '';

// Utility: Make HTTP request
function makeRequest(method, path, data = null, useAuth = false) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: `${API_BASE}${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (useAuth && accessToken) {
      options.headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const req = http.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : {};
          resolve({
            statusCode: res.statusCode,
            body: jsonBody,
            rawBody: body,
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: null,
            rawBody: body,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Utility: Test endpoint
async function testEndpoint(name, method, path, data = null, useAuth = false, expectedStatus = null) {
  process.stdout.write(`Testing: ${name}... `);

  try {
    const response = await makeRequest(method, path, data, useAuth);
    const status = response.statusCode;
    const isSuccess = expectedStatus ? status === expectedStatus : (status >= 200 && status < 300);

    if (isSuccess) {
      console.log(`${colors.green}PASS${colors.reset} (HTTP ${status})`);
      testsPassed++;
      return response;
    } else {
      console.log(`${colors.red}FAIL${colors.reset} (HTTP ${status})`);
      console.log('Response:', response.rawBody.substring(0, 200));
      testsFailed++;
      return response;
    }
  } catch (error) {
    console.log(`${colors.red}ERROR${colors.reset}`);
    console.log('Error:', error.message);
    testsFailed++;
    return null;
  }
}

// Main test flow
async function runTests() {
  console.log('================================================');
  console.log('      LUMA API TESTING - Phase 2.5');
  console.log('================================================');
  console.log('');

  // 1. HEALTH CHECK
  console.log(`${colors.blue}=== 1. Health Check ===${colors.reset}`);
  await testEndpoint('Health Check', 'GET', '/health');
  console.log('');

  // 2. AUTHENTICATION
  console.log(`${colors.blue}=== 2. Authentication ===${colors.reset}`);

  const timestamp = Date.now();
  const testEmail = `testuser${timestamp}@gmail.com`;

  console.log(`Registering user: ${testEmail}`);
  const registerData = {
    name: 'Test User',
    email: testEmail,
    password: 'TestPassword123!',
  };

  const registerResponse = await testEndpoint(
    'Register User',
    'POST',
    '/auth/register',
    registerData,
    false,
    201
  );

  if (registerResponse && registerResponse.body && registerResponse.body.data) {
    accessToken = registerResponse.body.data.session?.access_token || '';
    userId = registerResponse.body.data.user?.id || '';

    if (accessToken) {
      console.log(`${colors.green}✓ Registration successful${colors.reset}`);
      console.log(`Access Token: ${accessToken.substring(0, 20)}...`);
      console.log(`User ID: ${userId}`);
    } else {
      console.log(`${colors.red}✗ No access token received${colors.reset}`);
    }
  } else {
    console.log(`${colors.red}✗ Registration failed${colors.reset}`);
    process.exit(1);
  }
  console.log('');

  await testEndpoint('Get Current User', 'GET', '/auth/me', null, true);
  console.log('');

  // 3. DASHBOARD
  console.log(`${colors.blue}=== 3. Dashboard ===${colors.reset}`);
  const moodData = { mood_value: 4, notes: 'Feeling good today!' };
  await testEndpoint('Submit Mood Check-in', 'POST', '/dashboard/mood-checkin', moodData, true, 201);
  await testEndpoint('Get Dashboard Stats', 'GET', '/dashboard/stats', null, true);
  await testEndpoint('Get Mood History', 'GET', '/dashboard/mood-history?days=30', null, true);
  console.log('');

  // 4. CHAT
  console.log(`${colors.blue}=== 4. Chat ===${colors.reset}`);
  const convData = { title: 'My First Chat' };
  const convResponse = await testEndpoint('Create Conversation', 'POST', '/chat', convData, true, 201);

  if (convResponse && convResponse.body && convResponse.body.data) {
    conversationId = convResponse.body.data.conversation?.id || '';
    console.log(`${colors.green}✓ Conversation ID: ${conversationId}${colors.reset}`);
  }
  console.log('');

  if (conversationId) {
    const msgData = { message: 'Hello Luma, how are you today?' };
    await testEndpoint('Send Message', 'POST', `/chat/${conversationId}/messages`, msgData, true, 201);
    await testEndpoint('Get Conversation', 'GET', `/chat/${conversationId}`, null, true);
  } else {
    console.log(`${colors.yellow}⚠ Skipping message tests (no conversation ID)${colors.reset}`);
  }

  await testEndpoint('Get All Conversations', 'GET', '/chat', null, true);
  console.log('');

  // 5. JOURNAL
  console.log(`${colors.blue}=== 5. Journal ===${colors.reset}`);
  const journalData = { mode: 'present-virtues', title: 'Reflecting on my strengths' };
  const journalResponse = await testEndpoint('Create Journal Session', 'POST', '/journal', journalData, true, 201);

  if (journalResponse && journalResponse.body && journalResponse.body.data) {
    sessionId = journalResponse.body.data.session?.id || '';
    console.log(`${colors.green}✓ Session ID: ${sessionId}${colors.reset}`);
  }
  console.log('');

  if (sessionId) {
    const entryData = {
      content: 'Today I realize I am really good at problem-solving. When challenges come up, I stay calm and think through solutions methodically.',
    };
    await testEndpoint('Create Journal Entry', 'POST', `/journal/${sessionId}/entries`, entryData, true, 201);
    await testEndpoint('Get Session', 'GET', `/journal/${sessionId}`, null, true);
  } else {
    console.log(`${colors.yellow}⚠ Skipping entry tests (no session ID)${colors.reset}`);
  }

  await testEndpoint('Get All Sessions', 'GET', '/journal', null, true);
  console.log('');

  // 6. GOALS
  console.log(`${colors.blue}=== 6. Goals ===${colors.reset}`);
  const goalData = {
    title: 'Learn Spanish',
    description: 'I want to become conversational in Spanish',
    category: 'personal-growth',
    timeframe: '6-months',
  };
  const goalResponse = await testEndpoint('Create Goal', 'POST', '/goals', goalData, true, 201);

  if (goalResponse && goalResponse.body && goalResponse.body.data) {
    goalId = goalResponse.body.data.goal?.id || '';
    console.log(`${colors.green}✓ Goal ID: ${goalId}${colors.reset}`);
  }
  console.log('');

  await testEndpoint('Get All Goals', 'GET', '/goals', null, true);
  if (goalId) {
    await testEndpoint('Get Single Goal', 'GET', `/goals/${goalId}`, null, true);
  }
  console.log('');

  // 7. TOOLS
  console.log(`${colors.blue}=== 7. Tools ===${colors.reset}`);
  const brainData = {
    context_description: 'I keep thinking I am not good enough',
    original_thought: 'I am a fraud',
  };
  await testEndpoint('Create Brain Exercise', 'POST', '/tools/brain', brainData, true, 201);

  const narrativeData = {
    context_description: 'I have been feeling stuck since losing my job',
  };
  await testEndpoint('Create Narrative', 'POST', '/tools/narrative', narrativeData, true, 201);

  const futureData = {
    goal_or_theme: 'I want to feel confident speaking up in meetings',
  };
  await testEndpoint('Create Future Me Exercise', 'POST', '/tools/future-me', futureData, true, 201);

  await testEndpoint('Get Brain Exercises', 'GET', '/tools/brain', null, true);
  console.log('');

  // 8. MEMORY
  console.log(`${colors.blue}=== 8. Memory ===${colors.reset}`);
  await testEndpoint('Get Memory Settings', 'GET', '/memory/settings', null, true);
  await testEndpoint('Get Memory Blocks', 'GET', '/memory/blocks', null, true);

  const searchData = { query: 'confidence and self-worth', limit: 5 };
  await testEndpoint('Search Memory', 'POST', '/memory/search', searchData, true);

  await testEndpoint('Get Memory Insights', 'GET', '/memory/insights', null, true);
  console.log('');

  // SUMMARY
  console.log('================================================');
  console.log('              TEST SUMMARY');
  console.log('================================================');
  console.log(`Tests Passed: ${colors.green}${testsPassed}${colors.reset}`);
  console.log(`Tests Failed: ${colors.red}${testsFailed}${colors.reset}`);
  console.log(`Total Tests: ${testsPassed + testsFailed}`);
  console.log('');

  if (testsFailed === 0) {
    console.log(`${colors.green}✓ All tests passed!${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`${colors.red}✗ Some tests failed!${colors.reset}`);
    process.exit(1);
  }
}

// Run tests
console.log('Starting API tests...\n');
runTests().catch((error) => {
  console.error('Test suite error:', error);
  process.exit(1);
});
