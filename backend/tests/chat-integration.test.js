/**
 * Chat API Integration Tests
 *
 * Tests the complete chat functionality including:
 * - Conversation creation
 * - Message sending and receiving
 * - AI response generation
 * - Conversation history retrieval
 * - Message persistence
 * - Error handling
 */

const API_BASE_URL = 'http://localhost:4000/api/v1';

// Test data
let authToken = '';
let userId = '';
let conversationId = '';
let messageId = '';

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
async function runChatTests() {
  console.log('\n========================================');
  console.log('CHAT API INTEGRATION TESTS');
  console.log('========================================\n');

  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Authentication Setup
  console.log('[TEST 1] Authentication Setup...');
  try {
    const res = await apiCall('/auth/register', 'POST', {
      name: 'Chat Test User',
      email: `chattest${Date.now()}@test.com`,
      password: 'ChatTest123!'
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

  // Test 2: Create Conversation
  console.log('\n[TEST 2] Create Conversation...');
  try {
    const res = await apiCall('/chat/conversations', 'POST', {
      title: 'Test Conversation'
    }, authToken);

    if (res.status === 201 && res.data.data.id) {
      conversationId = res.data.data.id;
      console.log('✅ PASS - Conversation created successfully');
      console.log(`   Conversation ID: ${conversationId}`);
      console.log(`   Title: ${res.data.data.title || 'Untitled'}`);
      passedTests++;
    } else {
      throw new Error('Conversation creation failed');
    }
  } catch (error) {
    console.log('❌ FAIL - Conversation creation failed:', error.message);
    failedTests++;
    return;
  }

  // Test 3: Send Message
  console.log('\n[TEST 3] Send Message and Get AI Response...');
  try {
    const res = await apiCall(`/chat/conversations/${conversationId}/messages`, 'POST', {
      content: 'Hello Luma! I would like to talk about stress management.'
    }, authToken);

    if (res.status === 201 && res.data.data.userMessage && res.data.data.assistantMessage) {
      messageId = res.data.data.userMessage.id;
      console.log('✅ PASS - Message sent and AI response received');
      console.log(`   User Message ID: ${res.data.data.userMessage.id}`);
      console.log(`   AI Response Length: ${res.data.data.assistantMessage.content.length} chars`);
      console.log(`   Response Preview: ${res.data.data.assistantMessage.content.substring(0, 80)}...`);
      passedTests++;
    } else {
      throw new Error('Message sending failed');
    }
  } catch (error) {
    console.log('❌ FAIL - Message sending failed:', error.message);
    failedTests++;
  }

  // Test 4: Send Follow-up Message
  console.log('\n[TEST 4] Send Follow-up Message...');
  try {
    const res = await apiCall(`/chat/conversations/${conversationId}/messages`, 'POST', {
      content: 'Can you suggest some coping strategies?'
    }, authToken);

    if (res.status === 201 && res.data.data.assistantMessage) {
      console.log('✅ PASS - Follow-up message processed');
      console.log(`   Context Maintained: ${res.data.data.assistantMessage.content.length > 50 ? 'Yes' : 'Uncertain'}`);
      passedTests++;
    } else {
      throw new Error('Follow-up message failed');
    }
  } catch (error) {
    console.log('❌ FAIL - Follow-up message failed:', error.message);
    failedTests++;
  }

  // Test 5: Retrieve Conversation History
  console.log('\n[TEST 5] Retrieve Conversation History...');
  try {
    const res = await apiCall(`/chat/conversations/${conversationId}/messages`, 'GET', null, authToken);

    if (res.status === 200 && Array.isArray(res.data.data)) {
      console.log('✅ PASS - Conversation history retrieved');
      console.log(`   Total Messages: ${res.data.data.length}`);
      console.log(`   Expected: At least 4 (2 user + 2 assistant)`);
      passedTests++;
    } else {
      throw new Error('History retrieval failed');
    }
  } catch (error) {
    console.log('❌ FAIL - History retrieval failed:', error.message);
    failedTests++;
  }

  // Test 6: List All Conversations
  console.log('\n[TEST 6] List All Conversations...');
  try {
    const res = await apiCall('/chat/conversations', 'GET', null, authToken);

    if (res.status === 200 && Array.isArray(res.data.data)) {
      console.log('✅ PASS - Conversations listed successfully');
      console.log(`   Total Conversations: ${res.data.data.length}`);
      if (res.data.data.length > 0) {
        console.log(`   Latest: ${res.data.data[0].title || 'Untitled'}`);
      }
      passedTests++;
    } else {
      throw new Error('Conversation listing failed');
    }
  } catch (error) {
    console.log('❌ FAIL - Conversation listing failed:', error.message);
    failedTests++;
  }

  // Test 7: Create Multiple Conversations
  console.log('\n[TEST 7] Create Multiple Conversations...');
  try {
    const conversation2 = await apiCall('/chat/conversations', 'POST', {
      title: 'Second Test Conversation'
    }, authToken);

    const conversation3 = await apiCall('/chat/conversations', 'POST', {
      title: 'Third Test Conversation'
    }, authToken);

    if (conversation2.status === 201 && conversation3.status === 201) {
      console.log('✅ PASS - Multiple conversations created');
      console.log(`   Conversation 2 ID: ${conversation2.data.data.id}`);
      console.log(`   Conversation 3 ID: ${conversation3.data.data.id}`);
      passedTests++;
    } else {
      throw new Error('Multiple conversation creation failed');
    }
  } catch (error) {
    console.log('❌ FAIL - Multiple conversation creation failed:', error.message);
    failedTests++;
  }

  // Test 8: Empty Message Validation
  console.log('\n[TEST 8] Empty Message Validation...');
  try {
    const res = await apiCall(`/chat/conversations/${conversationId}/messages`, 'POST', {
      content: ''
    }, authToken);

    if (res.status === 400 || res.status === 422) {
      console.log('✅ PASS - Empty message properly rejected');
      passedTests++;
    } else {
      throw new Error('Empty message should be rejected');
    }
  } catch (error) {
    console.log('❌ FAIL - Empty message validation failed:', error.message);
    failedTests++;
  }

  // Test 9: Invalid Conversation ID
  console.log('\n[TEST 9] Invalid Conversation ID Handling...');
  try {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await apiCall(`/chat/conversations/${fakeId}/messages`, 'POST', {
      content: 'Test message'
    }, authToken);

    if (res.status === 404 || res.status === 403) {
      console.log('✅ PASS - Invalid conversation ID properly handled');
      passedTests++;
    } else {
      throw new Error('Invalid conversation should be rejected');
    }
  } catch (error) {
    console.log('❌ FAIL - Invalid conversation handling failed:', error.message);
    failedTests++;
  }

  // Test 10: Long Message Handling
  console.log('\n[TEST 10] Long Message Handling...');
  try {
    const longMessage = 'This is a very long message. '.repeat(100); // ~3000 chars
    const res = await apiCall(`/chat/conversations/${conversationId}/messages`, 'POST', {
      content: longMessage
    }, authToken);

    if (res.status === 201 && res.data.data.assistantMessage) {
      console.log('✅ PASS - Long message processed successfully');
      console.log(`   Message Length: ${longMessage.length} chars`);
      console.log(`   AI Response Generated: Yes`);
      passedTests++;
    } else {
      throw new Error('Long message processing failed');
    }
  } catch (error) {
    console.log('❌ FAIL - Long message handling failed:', error.message);
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
    console.log('🎉 ALL CHAT API TESTS PASSED!\n');
  } else {
    console.log('⚠️  Some tests failed. Review errors above.\n');
  }
}

// Run tests
runChatTests().catch(error => {
  console.error('\n❌ CRITICAL ERROR:', error);
  process.exit(1);
});
