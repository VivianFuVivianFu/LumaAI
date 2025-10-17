// Simple test to verify OpenAI connection
require('dotenv').config({ path: '.env.development' });
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testOpenAI() {
  console.log('🧪 Testing OpenAI API connection...\n');

  try {
    console.log('API Key present:', !!process.env.OPENAI_API_KEY);
    console.log('API Key starts with:', process.env.OPENAI_API_KEY?.substring(0, 10) + '...\n');

    console.log('Sending test message to OpenAI...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are Luma, a supportive AI wellness companion.'
        },
        {
          role: 'user',
          content: 'Hi, how are you today?'
        }
      ],
      temperature: 0.7,
      max_tokens: 100,
    });

    console.log('✅ OpenAI API connection successful!\n');
    console.log('Response from Luma:');
    console.log(completion.choices[0].message.content);
    console.log('\n✅ Chat function is properly connected to OpenAI API!');

  } catch (error) {
    console.error('❌ OpenAI API Error:', error.message);
    if (error.status) {
      console.error('Status:', error.status);
    }
    if (error.type) {
      console.error('Type:', error.type);
    }
  }
}

testOpenAI();
