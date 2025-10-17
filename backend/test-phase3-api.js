/**
 * Quick Phase 3 Master Agent API Test
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api/v1';

async function testPhase3() {
  try {
    console.log('\n🧪 Testing Phase 3 Master Agent APIs...\n');

    // Step 1: Register
    console.log('1️⃣ Registering test user...');
    const email = `phase3test${Date.now()}@example.com`;
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      email,
      password: 'TestPassword123!',
      name: 'Phase3 Tester',
    });

    const token = registerResponse.data.data.session.access_token;
    console.log('✅ Registered:', email.substring(0, 30) + '...');

    // Step 2: Log an event
    console.log('\n2️⃣ Logging event (goal_created)...');
    const eventResponse = await axios.post(
      `${BASE_URL}/master-agent/events`,
      {
        event_type: 'goal_created',
        source_feature: 'goals',
        source_id: '550e8400-e29b-41d4-a716-446655440000',
        event_data: {
          goal_title: 'Learn Spanish',
          category: 'personal-growth',
          timeframe: '6-months',
        },
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log('✅ Event logged:', eventResponse.data.data.event_id.substring(0, 20) + '...');

    // Step 3: Get nudges
    console.log('\n3️⃣ Getting nudges for home surface...');
    const nudgesResponse = await axios.get(`${BASE_URL}/master-agent/nudges/home`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log('✅ Nudges retrieved:', nudgesResponse.data.data.nudges.length, 'nudges');

    // Step 4: Record feedback
    console.log('\n4️⃣ Recording thumbs_up feedback...');
    const feedbackResponse = await axios.post(
      `${BASE_URL}/master-agent/feedback`,
      {
        feedback_type: 'thumbs_up',
        target_type: 'ai_response',
        target_id: '880e8400-e29b-41d4-a716-446655440000',
        comment: 'Very helpful!',
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log('✅ Feedback recorded:', feedbackResponse.data.data.feedback_id.substring(0, 20) + '...');

    // Step 5: Get context summary
    console.log('\n5️⃣ Getting context summary...');
    const contextResponse = await axios.get(`${BASE_URL}/master-agent/context`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log('✅ Context retrieved');
    console.log('   Themes:', contextResponse.data.data.context.themes || 'none');
    console.log('   Risks:', contextResponse.data.data.context.risks || 'none');
    console.log('   Momentum:', contextResponse.data.data.context.momentum || '0');

    console.log('\n✅ All Phase 3 API tests passed!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Error:`, error.response.data);
    } else {
      console.error(`   ${error.message}`);
    }
    console.log('');
    process.exit(1);
  }
}

testPhase3();
