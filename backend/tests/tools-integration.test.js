/**
 * Tools API Integration Tests
 *
 * Tests the complete tools functionality including:
 * - Brain Exercise creation and completion
 * - Narrative Therapy tool with AI generation
 * - Future Me visualization tool with AI generation
 * - Tool history and retrieval
 * - Different context inputs and validations
 */

const API_BASE_URL = 'http://localhost:4000/api/v1';

// Test data
let authToken = '';
let userId = '';
let brainExerciseId = '';
let narrativeId = '';
let futureMeId = '';

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
async function runToolsTests() {
  console.log('\n========================================');
  console.log('TOOLS API INTEGRATION TESTS');
  console.log('========================================\n');

  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Authentication Setup
  console.log('[TEST 1] Authentication Setup...');
  try {
    const res = await apiCall('/auth/register', 'POST', {
      name: 'Tools Test User',
      email: `toolstest${Date.now()}@test.com`,
      password: 'ToolsTest123!'
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

  // Test 2: Create Brain Exercise
  console.log('\n[TEST 2] Create Brain Exercise...');
  try {
    const res = await apiCall('/tools/brain-exercise', 'POST', {}, authToken);

    if (res.status === 201 && res.data.data.id && res.data.data.exercises) {
      brainExerciseId = res.data.data.id;
      console.log('✅ PASS - Brain exercise created');
      console.log(`   Exercise ID: ${brainExerciseId}`);
      console.log(`   Total Exercises: ${res.data.data.exercises.length}`);
      if (res.data.data.exercises.length > 0) {
        console.log(`   Exercise 1: ${res.data.data.exercises[0].title}`);
        console.log(`   Description: ${res.data.data.exercises[0].description.substring(0, 60)}...`);
      }
      passedTests++;
    } else {
      throw new Error('Brain exercise creation failed');
    }
  } catch (error) {
    console.log('❌ FAIL - Brain exercise creation failed:', error.message);
    failedTests++;
  }

  // Test 3: Complete Brain Exercise
  console.log('\n[TEST 3] Complete Brain Exercise...');
  try {
    const res = await apiCall(`/tools/brain-exercise/${brainExerciseId}/complete`, 'POST', {}, authToken);

    if (res.status === 200 && res.data.data.completed_at) {
      console.log('✅ PASS - Brain exercise completed');
      console.log(`   Completed At: ${res.data.data.completed_at}`);
      passedTests++;
    } else {
      throw new Error('Brain exercise completion failed');
    }
  } catch (error) {
    console.log('❌ FAIL - Brain exercise completion failed:', error.message);
    failedTests++;
  }

  // Test 4: Create Narrative with AI Generation
  console.log('\n[TEST 4] Create Narrative with AI Generation...');
  try {
    const res = await apiCall('/tools/narrative', 'POST', {
      context_description: 'I have been feeling overwhelmed at work lately. My manager keeps adding new tasks without removing old ones, and I feel like I can never catch up. This makes me doubt my abilities and feel like I am failing, even though I work long hours.'
    }, authToken);

    if (res.status === 201 && res.data.data.id && res.data.data.reframed_narrative) {
      narrativeId = res.data.data.id;
      console.log('✅ PASS - Narrative created with AI reframing');
      console.log(`   Narrative ID: ${narrativeId}`);
      console.log(`   Context Length: ${res.data.data.context_description.length} chars`);
      console.log(`   Reframed Narrative: ${res.data.data.reframed_narrative.substring(0, 80)}...`);
      console.log(`   Key Insights: ${res.data.data.key_insights?.length || 0}`);
      passedTests++;
    } else {
      throw new Error('Narrative creation failed');
    }
  } catch (error) {
    console.log('❌ FAIL - Narrative creation failed:', error.message);
    failedTests++;
  }

  // Test 5: Retrieve Narrative Details
  console.log('\n[TEST 5] Retrieve Narrative Details...');
  try {
    const res = await apiCall(`/tools/narrative/${narrativeId}`, 'GET', null, authToken);

    if (res.status === 200 && res.data.data.id === narrativeId) {
      console.log('✅ PASS - Narrative details retrieved');
      console.log(`   Has Reframed Narrative: ${res.data.data.reframed_narrative ? 'Yes' : 'No'}`);
      console.log(`   Has Key Insights: ${res.data.data.key_insights?.length > 0 ? 'Yes' : 'No'}`);
      passedTests++;
    } else {
      throw new Error('Narrative retrieval failed');
    }
  } catch (error) {
    console.log('❌ FAIL - Narrative retrieval failed:', error.message);
    failedTests++;
  }

  // Test 6: Create Future Me Exercise with AI Generation
  console.log('\n[TEST 6] Create Future Me Exercise with AI Generation...');
  try {
    const res = await apiCall('/tools/future-me', 'POST', {
      goal_or_theme: 'I want to become more confident in social situations and overcome my fear of public speaking. I envision myself being able to present ideas at work meetings and enjoy conversations at social gatherings without anxiety.'
    }, authToken);

    if (res.status === 201 && res.data.data.id && res.data.data.visualization_script) {
      futureMeId = res.data.data.id;
      console.log('✅ PASS - Future Me exercise created with AI generation');
      console.log(`   Future Me ID: ${futureMeId}`);
      console.log(`   Goal Length: ${res.data.data.goal_or_theme.length} chars`);
      console.log(`   Visualization Script: ${res.data.data.visualization_script.substring(0, 80)}...`);
      console.log(`   Affirmations: ${res.data.data.affirmations?.length || 0}`);
      console.log(`   If-Then Anchors: ${res.data.data.if_then_anchors?.length || 0}`);
      passedTests++;
    } else {
      throw new Error('Future Me creation failed');
    }
  } catch (error) {
    console.log('❌ FAIL - Future Me creation failed:', error.message);
    failedTests++;
  }

  // Test 7: Retrieve Future Me Details
  console.log('\n[TEST 7] Retrieve Future Me Details...');
  try {
    const res = await apiCall(`/tools/future-me/${futureMeId}`, 'GET', null, authToken);

    if (res.status === 200 && res.data.data.id === futureMeId) {
      console.log('✅ PASS - Future Me details retrieved');
      console.log(`   Has Visualization Script: ${res.data.data.visualization_script ? 'Yes' : 'No'}`);
      console.log(`   Has Affirmations: ${res.data.data.affirmations?.length > 0 ? 'Yes' : 'No'}`);
      console.log(`   Has If-Then Anchors: ${res.data.data.if_then_anchors?.length > 0 ? 'Yes' : 'No'}`);
      passedTests++;
    } else {
      throw new Error('Future Me retrieval failed');
    }
  } catch (error) {
    console.log('❌ FAIL - Future Me retrieval failed:', error.message);
    failedTests++;
  }

  // Test 8: List All Brain Exercises
  console.log('\n[TEST 8] List All Brain Exercises...');
  try {
    const res = await apiCall('/tools/brain-exercise', 'GET', null, authToken);

    if (res.status === 200 && Array.isArray(res.data.data)) {
      console.log('✅ PASS - Brain exercises listed successfully');
      console.log(`   Total Exercises: ${res.data.data.length}`);
      passedTests++;
    } else {
      throw new Error('Brain exercise listing failed');
    }
  } catch (error) {
    console.log('❌ FAIL - Brain exercise listing failed:', error.message);
    failedTests++;
  }

  // Test 9: List All Narratives
  console.log('\n[TEST 9] List All Narratives...');
  try {
    const res = await apiCall('/tools/narrative', 'GET', null, authToken);

    if (res.status === 200 && Array.isArray(res.data.data)) {
      console.log('✅ PASS - Narratives listed successfully');
      console.log(`   Total Narratives: ${res.data.data.length}`);
      passedTests++;
    } else {
      throw new Error('Narrative listing failed');
    }
  } catch (error) {
    console.log('❌ FAIL - Narrative listing failed:', error.message);
    failedTests++;
  }

  // Test 10: List All Future Me Exercises
  console.log('\n[TEST 10] List All Future Me Exercises...');
  try {
    const res = await apiCall('/tools/future-me', 'GET', null, authToken);

    if (res.status === 200 && Array.isArray(res.data.data)) {
      console.log('✅ PASS - Future Me exercises listed successfully');
      console.log(`   Total Exercises: ${res.data.data.length}`);
      passedTests++;
    } else {
      throw new Error('Future Me listing failed');
    }
  } catch (error) {
    console.log('❌ FAIL - Future Me listing failed:', error.message);
    failedTests++;
  }

  // Test 11: Empty Context Validation for Narrative
  console.log('\n[TEST 11] Empty Context Validation for Narrative...');
  try {
    const res = await apiCall('/tools/narrative', 'POST', {
      context_description: ''
    }, authToken);

    if (res.status === 400 || res.status === 422) {
      console.log('✅ PASS - Empty context properly rejected');
      passedTests++;
    } else {
      throw new Error('Empty context should be rejected');
    }
  } catch (error) {
    console.log('❌ FAIL - Empty context validation failed:', error.message);
    failedTests++;
  }

  // Test 12: Empty Goal Validation for Future Me
  console.log('\n[TEST 12] Empty Goal Validation for Future Me...');
  try {
    const res = await apiCall('/tools/future-me', 'POST', {
      goal_or_theme: ''
    }, authToken);

    if (res.status === 400 || res.status === 422) {
      console.log('✅ PASS - Empty goal properly rejected');
      passedTests++;
    } else {
      throw new Error('Empty goal should be rejected');
    }
  } catch (error) {
    console.log('❌ FAIL - Empty goal validation failed:', error.message);
    failedTests++;
  }

  // Test 13: Long Context Handling for Narrative
  console.log('\n[TEST 13] Long Context Handling for Narrative...');
  try {
    const longContext = 'I have been dealing with multiple challenging situations in my life. '.repeat(30); // ~2000+ chars
    const res = await apiCall('/tools/narrative', 'POST', {
      context_description: longContext
    }, authToken);

    if (res.status === 201 && res.data.data.reframed_narrative) {
      console.log('✅ PASS - Long context processed successfully');
      console.log(`   Context Length: ${longContext.length} chars`);
      console.log(`   Reframed Narrative Generated: Yes`);
      passedTests++;
    } else {
      throw new Error('Long context processing failed');
    }
  } catch (error) {
    console.log('❌ FAIL - Long context handling failed:', error.message);
    failedTests++;
  }

  // Test 14: Create Multiple Brain Exercises
  console.log('\n[TEST 14] Create Multiple Brain Exercises...');
  try {
    const exercise2 = await apiCall('/tools/brain-exercise', 'POST', {}, authToken);
    const exercise3 = await apiCall('/tools/brain-exercise', 'POST', {}, authToken);

    if (exercise2.status === 201 && exercise3.status === 201) {
      console.log('✅ PASS - Multiple brain exercises created');
      console.log(`   Exercise 2 ID: ${exercise2.data.data.id}`);
      console.log(`   Exercise 3 ID: ${exercise3.data.data.id}`);
      passedTests++;
    } else {
      throw new Error('Multiple exercise creation failed');
    }
  } catch (error) {
    console.log('❌ FAIL - Multiple exercise creation failed:', error.message);
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
    console.log('🎉 ALL TOOLS API TESTS PASSED!\n');
  } else {
    console.log('⚠️  Some tests failed. Review errors above.\n');
  }
}

// Run tests
runToolsTests().catch(error => {
  console.error('\n❌ CRITICAL ERROR:', error);
  process.exit(1);
});
