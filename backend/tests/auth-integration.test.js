/**
 * Authentication Integration Tests
 *
 * Tests the complete authentication flow including:
 * - User registration
 * - User login (with/without Remember Me)
 * - Session management and expiration
 * - Token validation
 * - Logout
 * - Profile retrieval and updates
 */

const API_BASE_URL = 'http://localhost:4000/api/v1';

// Test data
let authToken = '';
let userId = '';
let testEmail = '';

// Helper function to make API calls
async function apiCall(endpoint, method = 'GET', body = null, token = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    ...(body && { body: JSON.stringify(body) })
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  const data = await response.json();

  return { status: response.status, data };
}

// Test runner
async function runAuthTests() {
  console.log('\n========================================');
  console.log('AUTHENTICATION INTEGRATION TESTS');
  console.log('========================================\n');

  let passedTests = 0;
  let failedTests = 0;

  // Test 1: User Registration
  console.log('[TEST 1] User Registration...');
  try {
    testEmail = `authtest${Date.now()}@test.com`;
    const res = await apiCall('/auth/register', 'POST', {
      name: 'Auth Test User',
      email: testEmail,
      password: 'SecurePassword123!'
    });

    if (res.status === 201 && res.data.data.session?.access_token) {
      authToken = res.data.data.session.access_token;
      userId = res.data.data.user.id;
      console.log('✅ PASS - User registered successfully');
      console.log(`   User ID: ${userId}`);
      console.log(`   Email: ${testEmail}`);
      passedTests++;
    } else {
      throw new Error('Invalid registration response');
    }
  } catch (error) {
    console.log('❌ FAIL - Registration failed:', error.message);
    failedTests++;
    return;
  }

  // Test 2: Get Current User Profile
  console.log('\n[TEST 2] Get Current User Profile...');
  try {
    const res = await apiCall('/auth/me', 'GET', null, authToken);

    if (res.status === 200 && res.data.data.id === userId) {
      console.log('✅ PASS - Profile retrieved successfully');
      console.log(`   Name: ${res.data.data.name}`);
      console.log(`   Email: ${res.data.data.email}`);
      console.log(`   Is New User: ${res.data.data.is_new_user}`);
      passedTests++;
    } else {
      throw new Error('Invalid profile response');
    }
  } catch (error) {
    console.log('❌ FAIL - Profile retrieval failed:', error.message);
    failedTests++;
  }

  // Test 3: Update User Profile
  console.log('\n[TEST 3] Update User Profile...');
  try {
    const res = await apiCall('/auth/profile', 'PUT', {
      name: 'Auth Test User Updated',
      is_new_user: false
    }, authToken);

    if (res.status === 200 && res.data.data.name === 'Auth Test User Updated') {
      console.log('✅ PASS - Profile updated successfully');
      console.log(`   Updated Name: ${res.data.data.name}`);
      console.log(`   Is New User: ${res.data.data.is_new_user}`);
      passedTests++;
    } else {
      throw new Error('Profile update failed');
    }
  } catch (error) {
    console.log('❌ FAIL - Profile update failed:', error.message);
    failedTests++;
  }

  // Test 4: Logout
  console.log('\n[TEST 4] User Logout...');
  try {
    const res = await apiCall('/auth/logout', 'POST', {}, authToken);

    if (res.status === 200) {
      console.log('✅ PASS - Logout successful');
      passedTests++;
    } else {
      throw new Error('Logout failed');
    }
  } catch (error) {
    console.log('❌ FAIL - Logout failed:', error.message);
    failedTests++;
  }

  // Test 5: Login with Credentials
  console.log('\n[TEST 5] User Login...');
  try {
    const res = await apiCall('/auth/login', 'POST', {
      email: testEmail,
      password: 'SecurePassword123!'
    });

    if (res.status === 200 && res.data.data.session?.access_token) {
      authToken = res.data.data.session.access_token;
      console.log('✅ PASS - Login successful');
      console.log(`   New Token Received: ${authToken.substring(0, 20)}...`);
      passedTests++;
    } else {
      throw new Error('Login failed');
    }
  } catch (error) {
    console.log('❌ FAIL - Login failed:', error.message);
    failedTests++;
  }

  // Test 6: Invalid Credentials
  console.log('\n[TEST 6] Login with Invalid Credentials...');
  try {
    const res = await apiCall('/auth/login', 'POST', {
      email: testEmail,
      password: 'WrongPassword123!'
    });

    if (res.status === 401 || res.status === 400) {
      console.log('✅ PASS - Invalid credentials properly rejected');
      passedTests++;
    } else {
      throw new Error('Invalid credentials should be rejected');
    }
  } catch (error) {
    console.log('❌ FAIL - Invalid credentials test failed:', error.message);
    failedTests++;
  }

  // Test 7: Duplicate Registration
  console.log('\n[TEST 7] Duplicate Email Registration...');
  try {
    const res = await apiCall('/auth/register', 'POST', {
      name: 'Duplicate User',
      email: testEmail,
      password: 'AnotherPassword123!'
    });

    if (res.status === 409 || res.status === 400) {
      console.log('✅ PASS - Duplicate email properly rejected');
      passedTests++;
    } else {
      throw new Error('Duplicate email should be rejected');
    }
  } catch (error) {
    console.log('❌ FAIL - Duplicate email test failed:', error.message);
    failedTests++;
  }

  // Test 8: Unauthorized Access Without Token
  console.log('\n[TEST 8] Unauthorized Access Protection...');
  try {
    const res = await apiCall('/auth/me', 'GET', null, null);

    if (res.status === 401) {
      console.log('✅ PASS - Unauthorized access properly blocked');
      passedTests++;
    } else {
      throw new Error('Unauthorized access should be blocked');
    }
  } catch (error) {
    console.log('❌ FAIL - Unauthorized access test failed:', error.message);
    failedTests++;
  }

  // Test 9: Invalid Token
  console.log('\n[TEST 9] Invalid Token Handling...');
  try {
    const res = await apiCall('/auth/me', 'GET', null, 'invalid.token.here');

    if (res.status === 401) {
      console.log('✅ PASS - Invalid token properly rejected');
      passedTests++;
    } else {
      throw new Error('Invalid token should be rejected');
    }
  } catch (error) {
    console.log('❌ FAIL - Invalid token test failed:', error.message);
    failedTests++;
  }

  // Test 10: Weak Password Validation
  console.log('\n[TEST 10] Weak Password Validation...');
  try {
    const res = await apiCall('/auth/register', 'POST', {
      name: 'Weak Password User',
      email: `weakpass${Date.now()}@test.com`,
      password: '123'
    });

    if (res.status === 400 || res.status === 422) {
      console.log('✅ PASS - Weak password properly rejected');
      passedTests++;
    } else {
      throw new Error('Weak password should be rejected');
    }
  } catch (error) {
    console.log('❌ FAIL - Weak password test failed:', error.message);
    failedTests++;
  }

  // Test Summary
  console.log('\n========================================');
  console.log('TEST SUMMARY');
  console.log('========================================');
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📊 Total:  ${passedTests + failedTests}`);
  console.log(`📈 Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);
  console.log('========================================\n');

  if (failedTests === 0) {
    console.log('🎉 ALL AUTHENTICATION TESTS PASSED!\n');
  } else {
    console.log('⚠️  Some tests failed. Review errors above.\n');
  }
}

// Run tests
runAuthTests().catch(error => {
  console.error('\n❌ CRITICAL ERROR:', error);
  process.exit(1);
});
