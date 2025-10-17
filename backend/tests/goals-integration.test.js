/**
 * Goals API Integration Tests
 *
 * Tests the complete goals functionality including:
 * - Goal creation with AI clarifications
 * - Goal retrieval and listing
 * - Goal updates and progress tracking
 * - Action plan generation
 * - Goal completion
 * - Different goal timeframes (1-month, 3-months, 6-months, 1-year+)
 */

const API_BASE_URL = 'http://localhost:4000/api/v1';

// Test data
let authToken = '';
let userId = '';
let goalId = '';
let actionPlanId = '';

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
async function runGoalsTests() {
  console.log('\n========================================');
  console.log('GOALS API INTEGRATION TESTS');
  console.log('========================================\n');

  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Authentication Setup
  console.log('[TEST 1] Authentication Setup...');
  try {
    const res = await apiCall('/auth/register', 'POST', {
      name: 'Goals Test User',
      email: `goalstest${Date.now()}@test.com`,
      password: 'GoalsTest123!'
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

  // Test 2: Create Goal with AI Clarifications
  console.log('\n[TEST 2] Create Goal with AI Clarifications...');
  try {
    const res = await apiCall('/goals', 'POST', {
      title: 'Improve my mental wellness through daily mindfulness practice',
      timeframe: '3-months'
    }, authToken);

    if (res.status === 201 && res.data.data.goal && res.data.data.clarifications) {
      goalId = res.data.data.goal.id;
      console.log('✅ PASS - Goal created with AI clarifications');
      console.log(`   Goal ID: ${goalId}`);
      console.log(`   Title: ${res.data.data.goal.title}`);
      console.log(`   Timeframe: ${res.data.data.goal.timeframe}`);
      console.log(`   Clarifications: ${res.data.data.clarifications.length} questions`);
      if (res.data.data.clarifications.length > 0) {
        console.log(`   Example: ${res.data.data.clarifications[0].substring(0, 60)}...`);
      }
      passedTests++;
    } else {
      throw new Error('Goal creation failed');
    }
  } catch (error) {
    console.log('❌ FAIL - Goal creation failed:', error.message);
    failedTests++;
    return;
  }

  // Test 3: Submit Clarification Answers
  console.log('\n[TEST 3] Submit Clarification Answers...');
  try {
    const res = await apiCall(`/goals/${goalId}/clarifications`, 'POST', {
      answers: [
        'I want to practice meditation for 10 minutes every morning',
        'Success means feeling calmer and more centered throughout my day',
        'I sometimes struggle with consistency, but I am motivated to build this habit'
      ]
    }, authToken);

    if (res.status === 200 && res.data.data.clarifications_completed) {
      console.log('✅ PASS - Clarification answers submitted');
      console.log(`   Clarifications Completed: ${res.data.data.clarifications_completed}`);
      passedTests++;
    } else {
      throw new Error('Clarification submission failed');
    }
  } catch (error) {
    console.log('❌ FAIL - Clarification submission failed:', error.message);
    failedTests++;
  }

  // Test 4: Generate Action Plan
  console.log('\n[TEST 4] Generate Action Plan...');
  try {
    const res = await apiCall(`/goals/${goalId}/action-plan`, 'POST', {}, authToken);

    if (res.status === 201 && res.data.data.id && res.data.data.steps) {
      actionPlanId = res.data.data.id;
      console.log('✅ PASS - Action plan generated');
      console.log(`   Action Plan ID: ${actionPlanId}`);
      console.log(`   Total Steps: ${res.data.data.steps.length}`);
      console.log(`   Step 1: ${res.data.data.steps[0].title}`);
      console.log(`   Step 1 Actions: ${res.data.data.steps[0].actions.length}`);
      passedTests++;
    } else {
      throw new Error('Action plan generation failed');
    }
  } catch (error) {
    console.log('❌ FAIL - Action plan generation failed:', error.message);
    failedTests++;
  }

  // Test 5: Retrieve Goal Details
  console.log('\n[TEST 5] Retrieve Goal Details...');
  try {
    const res = await apiCall(`/goals/${goalId}`, 'GET', null, authToken);

    if (res.status === 200 && res.data.data.id === goalId) {
      console.log('✅ PASS - Goal details retrieved');
      console.log(`   Title: ${res.data.data.title}`);
      console.log(`   Status: ${res.data.data.status}`);
      console.log(`   Progress: ${res.data.data.progress_percentage || 0}%`);
      console.log(`   Has Action Plan: ${res.data.data.action_plan ? 'Yes' : 'No'}`);
      passedTests++;
    } else {
      throw new Error('Goal retrieval failed');
    }
  } catch (error) {
    console.log('❌ FAIL - Goal retrieval failed:', error.message);
    failedTests++;
  }

  // Test 6: Update Goal Progress
  console.log('\n[TEST 6] Update Goal Progress...');
  try {
    const res = await apiCall(`/goals/${goalId}`, 'PUT', {
      progress_percentage: 25,
      status: 'in_progress'
    }, authToken);

    if (res.status === 200 && res.data.data.progress_percentage === 25) {
      console.log('✅ PASS - Goal progress updated');
      console.log(`   Progress: ${res.data.data.progress_percentage}%`);
      console.log(`   Status: ${res.data.data.status}`);
      passedTests++;
    } else {
      throw new Error('Goal update failed');
    }
  } catch (error) {
    console.log('❌ FAIL - Goal update failed:', error.message);
    failedTests++;
  }

  // Test 7: List All Goals
  console.log('\n[TEST 7] List All Goals...');
  try {
    const res = await apiCall('/goals', 'GET', null, authToken);

    if (res.status === 200 && Array.isArray(res.data.data)) {
      console.log('✅ PASS - Goals listed successfully');
      console.log(`   Total Goals: ${res.data.data.length}`);
      passedTests++;
    } else {
      throw new Error('Goal listing failed');
    }
  } catch (error) {
    console.log('❌ FAIL - Goal listing failed:', error.message);
    failedTests++;
  }

  // Test 8: Create Goals with Different Timeframes
  console.log('\n[TEST 8] Create Goals with Different Timeframes...');
  try {
    const timeframes = ['1-month', '6-months', '1-year+'];
    let allCreated = true;

    for (const timeframe of timeframes) {
      const res = await apiCall('/goals', 'POST', {
        title: `Test goal for ${timeframe} timeframe`,
        timeframe: timeframe
      }, authToken);

      if (res.status !== 201) {
        allCreated = false;
        console.log(`  ❌ Failed to create goal with ${timeframe} timeframe`);
      }
    }

    if (allCreated) {
      console.log('✅ PASS - Goals with different timeframes created');
      console.log(`   Tested: ${timeframes.join(', ')}`);
      passedTests++;
    } else {
      throw new Error('Some timeframes failed');
    }
  } catch (error) {
    console.log('❌ FAIL - Timeframe testing failed:', error.message);
    failedTests++;
  }

  // Test 9: Complete Goal
  console.log('\n[TEST 9] Complete Goal...');
  try {
    const res = await apiCall(`/goals/${goalId}`, 'PUT', {
      status: 'completed',
      progress_percentage: 100
    }, authToken);

    if (res.status === 200 && res.data.data.status === 'completed') {
      console.log('✅ PASS - Goal completed successfully');
      console.log(`   Status: ${res.data.data.status}`);
      console.log(`   Progress: ${res.data.data.progress_percentage}%`);
      passedTests++;
    } else {
      throw new Error('Goal completion failed');
    }
  } catch (error) {
    console.log('❌ FAIL - Goal completion failed:', error.message);
    failedTests++;
  }

  // Test 10: Empty Title Validation
  console.log('\n[TEST 10] Empty Title Validation...');
  try {
    const res = await apiCall('/goals', 'POST', {
      title: '',
      timeframe: '3-months'
    }, authToken);

    if (res.status === 400 || res.status === 422) {
      console.log('✅ PASS - Empty title properly rejected');
      passedTests++;
    } else {
      throw new Error('Empty title should be rejected');
    }
  } catch (error) {
    console.log('❌ FAIL - Empty title validation failed:', error.message);
    failedTests++;
  }

  // Test 11: Invalid Timeframe Validation
  console.log('\n[TEST 11] Invalid Timeframe Validation...');
  try {
    const res = await apiCall('/goals', 'POST', {
      title: 'Test goal',
      timeframe: 'invalid-timeframe'
    }, authToken);

    if (res.status === 400 || res.status === 422) {
      console.log('✅ PASS - Invalid timeframe properly rejected');
      passedTests++;
    } else {
      throw new Error('Invalid timeframe should be rejected');
    }
  } catch (error) {
    console.log('❌ FAIL - Invalid timeframe validation failed:', error.message);
    failedTests++;
  }

  // Test 12: Long Goal Title Handling
  console.log('\n[TEST 12] Long Goal Title Handling...');
  try {
    const longTitle = 'I want to achieve a very ambitious and detailed goal that involves multiple aspects of my life and will require significant effort and planning over an extended period of time. This goal encompasses personal growth, professional development, and lifestyle changes.';
    const res = await apiCall('/goals', 'POST', {
      title: longTitle,
      timeframe: '1-year+'
    }, authToken);

    if (res.status === 201 && res.data.data.clarifications) {
      console.log('✅ PASS - Long title processed successfully');
      console.log(`   Title Length: ${longTitle.length} chars`);
      console.log(`   Clarifications Generated: Yes`);
      passedTests++;
    } else {
      throw new Error('Long title processing failed');
    }
  } catch (error) {
    console.log('❌ FAIL - Long title handling failed:', error.message);
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
    console.log('🎉 ALL GOALS API TESTS PASSED!\n');
  } else {
    console.log('⚠️  Some tests failed. Review errors above.\n');
  }
}

// Run tests
runGoalsTests().catch(error => {
  console.error('\n❌ CRITICAL ERROR:', error);
  process.exit(1);
});
