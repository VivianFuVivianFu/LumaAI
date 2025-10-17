/**
 * Test Goals API Connection
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api/v1';

async function testGoalsAPI() {
  try {
    console.log('\n🧪 Testing Goals API Connection...\n');

    // Step 1: Register a test user
    console.log('1️⃣ Registering test user...');
    const email = `goalstest${Date.now()}@example.com`;
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      email,
      password: 'TestPassword123!',
      name: 'Goals Tester',
    });

    if (!registerResponse.data.success) {
      throw new Error('Registration failed');
    }

    const token = registerResponse.data.data.session.access_token;
    console.log('✅ User registered successfully');
    console.log(`   Token: ${token.substring(0, 30)}...`);

    // Step 2: Test Get All Goals (should be empty)
    console.log('\n2️⃣ Testing GET /goals...');
    const getGoalsResponse = await axios.get(`${BASE_URL}/goals`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log('✅ Goals endpoint connected');
    console.log(`   Goals count: ${getGoalsResponse.data.data.length}`);

    // Step 3: Test Create Goal
    console.log('\n3️⃣ Testing POST /goals...');
    const createGoalResponse = await axios.post(
      `${BASE_URL}/goals`,
      {
        title: 'Learn to play guitar',
        category: 'personal-growth',
        timeframe: '3-months',
        description: 'Master 10 basic chords and play 3 songs',
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log('✅ Goal created successfully');
    console.log(`   Goal ID: ${createGoalResponse.data.data.id}`);
    console.log(`   Title: ${createGoalResponse.data.data.title}`);

    // Step 4: Test Get All Goals (should have 1)
    console.log('\n4️⃣ Testing GET /goals (after creation)...');
    const getGoalsResponse2 = await axios.get(`${BASE_URL}/goals`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log('✅ Goals retrieved successfully');
    console.log(`   Goals count: ${getGoalsResponse2.data.data.length}`);

    console.log('\n✅ All Goals API tests passed!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(`   ${error.message}`);
    }
    console.log('');
    process.exit(1);
  }
}

testGoalsAPI();
