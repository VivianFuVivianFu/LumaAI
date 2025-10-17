/**
 * Journal API Integration Tests
 *
 * Tests the complete journal functionality including:
 * - Session creation (Present, Past, Future modes)
 * - Entry creation with AI prompts
 * - Follow-up entries
 * - Session completion
 * - Entry retrieval and history
 * - AI prompt generation
 */

const API_BASE_URL = 'http://localhost:4000/api/v1';

// Test data
let authToken = '';
let userId = '';
let sessionId = '';
let entryId = '';

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
async function runJournalTests() {
  console.log('\n========================================');
  console.log('JOURNAL API INTEGRATION TESTS');
  console.log('========================================\n');

  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Authentication Setup
  console.log('[TEST 1] Authentication Setup...');
  try {
    const res = await apiCall('/auth/register', 'POST', {
      name: 'Journal Test User',
      email: `journaltest${Date.now()}@test.com`,
      password: 'JournalTest123!'
    });

    if (res.status === 201 && res.data.data.session?.access_token) {
      authToken = res.data.data.session.access_token;
      userId = res.data.data.user.id;
      console.log('✅ PASS - Authentication successful');
      passedTests++;
    } else {
      throw new Error('Authentication failed');
    }
  } catch (error) {
    console.log('❌ FAIL - Authentication failed:', error.message);
    failedTests++;
    return;
  }

  // Test 2: Create Present Mode Session
  console.log('\n[TEST 2] Create Present Mode Session...');
  try {
    const res = await apiCall('/journal/sessions', 'POST', {
      mode: 'present'
    }, authToken);

    if (res.status === 201 && res.data.data.id) {
      sessionId = res.data.data.id;
      console.log('✅ PASS - Present mode session created');
      console.log(`   Session ID: ${sessionId}`);
      console.log(`   Mode: ${res.data.data.mode}`);
      console.log(`   Starting Prompt: ${res.data.data.starting_prompt.substring(0, 60)}...`);
      passedTests++;
    } else {
      throw new Error('Session creation failed');
    }
  } catch (error) {
    console.log('❌ FAIL - Session creation failed:', error.message);
    failedTests++;
    return;
  }

  // Test 3: Create First Journal Entry
  console.log('\n[TEST 3] Create First Journal Entry...');
  try {
    const res = await apiCall(`/journal/sessions/${sessionId}/entries`, 'POST', {
      content: 'Today I am feeling grateful for the small moments of peace I found during my morning walk. The fresh air helped clear my mind.'
    }, authToken);

    if (res.status === 201 && res.data.data.entry && res.data.data.ai_prompt) {
      entryId = res.data.data.entry.id;
      console.log('✅ PASS - First entry created with AI prompt');
      console.log(`   Entry ID: ${entryId}`);
      console.log(`   Content Length: ${res.data.data.entry.content.length} chars`);
      console.log(`   AI Prompt: ${res.data.data.ai_prompt.substring(0, 60)}...`);
      passedTests++;
    } else {
      throw new Error('Entry creation failed');
    }
  } catch (error) {
    console.log('❌ FAIL - Entry creation failed:', error.message);
    failedTests++;
  }

  // Test 4: Create Follow-up Entry
  console.log('\n[TEST 4] Create Follow-up Entry...');
  try {
    const res = await apiCall(`/journal/sessions/${sessionId}/entries`, 'POST', {
      content: 'The walk made me realize I need to prioritize self-care more often. Sometimes I get too caught up in daily stress.'
    }, authToken);

    if (res.status === 201 && res.data.data.ai_prompt) {
      console.log('✅ PASS - Follow-up entry created');
      console.log(`   Contextual AI Prompt: ${res.data.data.ai_prompt.substring(0, 60)}...`);
      passedTests++;
    } else {
      throw new Error('Follow-up entry failed');
    }
  } catch (error) {
    console.log('❌ FAIL - Follow-up entry failed:', error.message);
    failedTests++;
  }

  // Test 5: Retrieve Session Entries
  console.log('\n[TEST 5] Retrieve Session Entries...');
  try {
    const res = await apiCall(`/journal/sessions/${sessionId}/entries`, 'GET', null, authToken);

    if (res.status === 200 && Array.isArray(res.data.data)) {
      console.log('✅ PASS - Session entries retrieved');
      console.log(`   Total Entries: ${res.data.data.length}`);
      console.log(`   Expected: At least 2`);
      passedTests++;
    } else {
      throw new Error('Entry retrieval failed');
    }
  } catch (error) {
    console.log('❌ FAIL - Entry retrieval failed:', error.message);
    failedTests++;
  }

  // Test 6: Complete Session
  console.log('\n[TEST 6] Complete Journal Session...');
  try {
    const res = await apiCall(`/journal/sessions/${sessionId}/complete`, 'POST', {}, authToken);

    if (res.status === 200 && res.data.data.completed_at) {
      console.log('✅ PASS - Session completed successfully');
      console.log(`   Completed At: ${res.data.data.completed_at}`);
      console.log(`   Duration: ${res.data.data.duration_seconds || 'N/A'} seconds`);
      passedTests++;
    } else {
      throw new Error('Session completion failed');
    }
  } catch (error) {
    console.log('❌ FAIL - Session completion failed:', error.message);
    failedTests++;
  }

  // Test 7: Create Past Mode Session
  console.log('\n[TEST 7] Create Past Mode Session...');
  try {
    const res = await apiCall('/journal/sessions', 'POST', {
      mode: 'past'
    }, authToken);

    if (res.status === 201 && res.data.data.mode === 'past') {
      console.log('✅ PASS - Past mode session created');
      console.log(`   Mode: ${res.data.data.mode}`);
      console.log(`   Starting Prompt: ${res.data.data.starting_prompt.substring(0, 60)}...`);
      passedTests++;
    } else {
      throw new Error('Past mode session creation failed');
    }
  } catch (error) {
    console.log('❌ FAIL - Past mode session creation failed:', error.message);
    failedTests++;
  }

  // Test 8: Create Future Mode Session
  console.log('\n[TEST 8] Create Future Mode Session...');
  try {
    const res = await apiCall('/journal/sessions', 'POST', {
      mode: 'future'
    }, authToken);

    if (res.status === 201 && res.data.data.mode === 'future') {
      console.log('✅ PASS - Future mode session created');
      console.log(`   Mode: ${res.data.data.mode}`);
      console.log(`   Starting Prompt: ${res.data.data.starting_prompt.substring(0, 60)}...`);
      passedTests++;
    } else {
      throw new Error('Future mode session creation failed');
    }
  } catch (error) {
    console.log('❌ FAIL - Future mode session creation failed:', error.message);
    failedTests++;
  }

  // Test 9: List All Sessions
  console.log('\n[TEST 9] List All Journal Sessions...');
  try {
    const res = await apiCall('/journal/sessions', 'GET', null, authToken);

    if (res.status === 200 && Array.isArray(res.data.data)) {
      console.log('✅ PASS - Sessions listed successfully');
      console.log(`   Total Sessions: ${res.data.data.length}`);
      console.log(`   Modes: ${res.data.data.map(s => s.mode).join(', ')}`);
      passedTests++;
    } else {
      throw new Error('Session listing failed');
    }
  } catch (error) {
    console.log('❌ FAIL - Session listing failed:', error.message);
    failedTests++;
  }

  // Test 10: Empty Entry Validation
  console.log('\n[TEST 10] Empty Entry Validation...');
  try {
    const res = await apiCall('/journal/sessions', 'POST', {
      mode: 'present'
    }, authToken);

    if (res.status === 201) {
      const emptyEntryRes = await apiCall(`/journal/sessions/${res.data.data.id}/entries`, 'POST', {
        content: ''
      }, authToken);

      if (emptyEntryRes.status === 400 || emptyEntryRes.status === 422) {
        console.log('✅ PASS - Empty entry properly rejected');
        passedTests++;
      } else {
        throw new Error('Empty entry should be rejected');
      }
    } else {
      throw new Error('Session creation failed');
    }
  } catch (error) {
    console.log('❌ FAIL - Empty entry validation failed:', error.message);
    failedTests++;
  }

  // Test 11: Invalid Mode Validation
  console.log('\n[TEST 11] Invalid Mode Validation...');
  try {
    const res = await apiCall('/journal/sessions', 'POST', {
      mode: 'invalid_mode'
    }, authToken);

    if (res.status === 400 || res.status === 422) {
      console.log('✅ PASS - Invalid mode properly rejected');
      passedTests++;
    } else {
      throw new Error('Invalid mode should be rejected');
    }
  } catch (error) {
    console.log('❌ FAIL - Invalid mode validation failed:', error.message);
    failedTests++;
  }

  // Test 12: Long Entry Handling
  console.log('\n[TEST 12] Long Entry Handling...');
  try {
    const longSession = await apiCall('/journal/sessions', 'POST', {
      mode: 'present'
    }, authToken);

    if (longSession.status === 201) {
      const longContent = 'This is a very long journal entry about my day and my thoughts. '.repeat(50); // ~3000+ chars
      const longEntryRes = await apiCall(`/journal/sessions/${longSession.data.data.id}/entries`, 'POST', {
        content: longContent
      }, authToken);

      if (longEntryRes.status === 201 && longEntryRes.data.data.ai_prompt) {
        console.log('✅ PASS - Long entry processed successfully');
        console.log(`   Entry Length: ${longContent.length} chars`);
        console.log(`   AI Prompt Generated: Yes`);
        passedTests++;
      } else {
        throw new Error('Long entry processing failed');
      }
    } else {
      throw new Error('Session creation failed');
    }
  } catch (error) {
    console.log('❌ FAIL - Long entry handling failed:', error.message);
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
    console.log('🎉 ALL JOURNAL API TESTS PASSED!\n');
  } else {
    console.log('⚠️  Some tests failed. Review errors above.\n');
  }
}

// Run tests
runJournalTests().catch(error => {
  console.error('\n❌ CRITICAL ERROR:', error);
  process.exit(1);
});
