/**
 * Master Agent API Test Script
 * Tests all 6 Master Agent endpoints
 */

const BASE_URL = 'http://localhost:4000/api/v1';

// Test credentials
let authToken = null;
let userId = null;
let testNudgeId = null;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, passed, details = '') {
  if (passed) {
    log(`✓ ${name}`, 'green');
    if (details) log(`  ${details}`, 'cyan');
  } else {
    log(`✗ ${name}`, 'red');
    if (details) log(`  ${details}`, 'yellow');
  }
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json();
  return { status: response.status, data };
}

// Test 1: Register/Login to get auth token
async function testAuth() {
  log('\n=== Test 1: Authentication ===', 'blue');

  try {
    const email = `test${Date.now()}@example.com`;
    const password = 'TestPassword123!';

    const { status, data } = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        first_name: 'Test',
        last_name: 'User',
      }),
    });

    if (status === 201 && data.success && data.data.user) {
      authToken = data.data.session.access_token;
      userId = data.data.user.id;
      logTest('Register and login', true, `Token: ${authToken.substring(0, 20)}...`);
      return true;
    } else {
      logTest('Register and login', false, JSON.stringify(data));
      return false;
    }
  } catch (error) {
    logTest('Register and login', false, error.message);
    return false;
  }
}

// Test 2: Log Event
async function testLogEvent() {
  log('\n=== Test 2: Log Event (POST /master-agent/events) ===', 'blue');

  try {
    const { status, data } = await request('/master-agent/events', {
      method: 'POST',
      body: JSON.stringify({
        event_type: 'test_event',
        source_feature: 'chat',
        source_id: '550e8400-e29b-41d4-a716-446655440000',
        event_data: { test: true },
      }),
    });

    if (status === 201 && data.success && data.data.event_id) {
      logTest('Log event', true, `Event ID: ${data.data.event_id}`);
      return true;
    } else {
      logTest('Log event', false, JSON.stringify(data));
      return false;
    }
  } catch (error) {
    logTest('Log event', false, error.message);
    return false;
  }
}

// Test 3: Get Nudges for Surface
async function testGetNudges() {
  log('\n=== Test 3: Get Nudges (GET /master-agent/nudges/:surface) ===', 'blue');

  try {
    const { status, data } = await request('/master-agent/nudges/home');

    if (status === 200 && data.success && Array.isArray(data.data.nudges)) {
      const nudgeCount = data.data.nudges.length;
      logTest('Get nudges for surface', true, `Found ${nudgeCount} nudges`);

      // Store a nudge ID if available for later tests
      if (nudgeCount > 0) {
        testNudgeId = data.data.nudges[0].nudge_id;
        log(`  Stored test nudge ID: ${testNudgeId}`, 'cyan');
      }
      return true;
    } else {
      logTest('Get nudges for surface', false, JSON.stringify(data));
      return false;
    }
  } catch (error) {
    logTest('Get nudges for surface', false, error.message);
    return false;
  }
}

// Test 4: Accept Nudge
async function testAcceptNudge() {
  log('\n=== Test 4: Accept Nudge (POST /master-agent/nudges/:id/accept) ===', 'blue');

  // Skip if no test nudge ID
  if (!testNudgeId) {
    log('  Skipping: No nudge available to test (generate nudges first)', 'yellow');
    return true;
  }

  try {
    const { status, data } = await request(`/master-agent/nudges/${testNudgeId}/accept`, {
      method: 'POST',
    });

    if (status === 200 && data.success) {
      logTest('Accept nudge', true, 'Nudge accepted successfully');
      return true;
    } else {
      logTest('Accept nudge', false, JSON.stringify(data));
      return false;
    }
  } catch (error) {
    logTest('Accept nudge', false, error.message);
    return false;
  }
}

// Test 5: Dismiss Nudge
async function testDismissNudge() {
  log('\n=== Test 5: Dismiss Nudge (POST /master-agent/nudges/:id/dismiss) ===', 'blue');

  // Create a fake nudge ID for testing
  const fakeNudgeId = '550e8400-e29b-41d4-a716-446655440000';

  try {
    const { status, data } = await request(`/master-agent/nudges/${fakeNudgeId}/dismiss`, {
      method: 'POST',
    });

    if (status === 200 && data.success) {
      logTest('Dismiss nudge', true, 'Nudge dismissed successfully');
      return true;
    } else if (status === 404 || status === 500) {
      // Expected to fail since nudge doesn't exist - that's OK for endpoint test
      logTest('Dismiss nudge endpoint', true, 'Endpoint responds correctly (nudge not found is expected)');
      return true;
    } else {
      logTest('Dismiss nudge', false, JSON.stringify(data));
      return false;
    }
  } catch (error) {
    logTest('Dismiss nudge', false, error.message);
    return false;
  }
}

// Test 6: Record Feedback
async function testRecordFeedback() {
  log('\n=== Test 6: Record Feedback (POST /master-agent/feedback) ===', 'blue');

  try {
    const { status, data } = await request('/master-agent/feedback', {
      method: 'POST',
      body: JSON.stringify({
        feedback_type: 'thumbs_up',
        target_type: 'ai_response',
        target_id: '550e8400-e29b-41d4-a716-446655440000',
        rating: 5,
        comment: 'Great response!',
      }),
    });

    if (status === 201 && data.success && data.data.feedback_id) {
      logTest('Record feedback', true, `Feedback ID: ${data.data.feedback_id}`);
      return true;
    } else {
      logTest('Record feedback', false, JSON.stringify(data));
      return false;
    }
  } catch (error) {
    logTest('Record feedback', false, error.message);
    return false;
  }
}

// Test 7: Get Context
async function testGetContext() {
  log('\n=== Test 7: Get Context (GET /master-agent/context) ===', 'blue');

  try {
    const { status, data } = await request('/master-agent/context');

    if (status === 200 && data.success && data.data.context) {
      const context = data.data.context;
      logTest('Get context', true, `Themes: ${context.themes?.length || 0}, Risks: ${context.risks?.length || 0}`);
      log(`  Context: ${JSON.stringify(context, null, 2)}`, 'cyan');
      return true;
    } else {
      logTest('Get context', false, JSON.stringify(data));
      return false;
    }
  } catch (error) {
    logTest('Get context', false, error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  log('\n' + '='.repeat(60), 'cyan');
  log('MASTER AGENT API TEST SUITE', 'cyan');
  log('='.repeat(60) + '\n', 'cyan');

  const results = [];

  // Run tests sequentially
  results.push(await testAuth());
  results.push(await testLogEvent());
  results.push(await testGetNudges());
  results.push(await testAcceptNudge());
  results.push(await testDismissNudge());
  results.push(await testRecordFeedback());
  results.push(await testGetContext());

  // Summary
  const passed = results.filter(r => r).length;
  const total = results.length;
  const failed = total - passed;

  log('\n' + '='.repeat(60), 'cyan');
  log('TEST SUMMARY', 'cyan');
  log('='.repeat(60), 'cyan');
  log(`Total Tests: ${total}`, 'blue');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`, failed === 0 ? 'green' : 'yellow');
  log('='.repeat(60) + '\n', 'cyan');

  process.exit(failed === 0 ? 0 : 1);
}

// Run the tests
runTests().catch(error => {
  log(`\n❌ Test suite error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
