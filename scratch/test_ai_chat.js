const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function run() {
  const url = 'http://localhost:3000/api/ai-chat';
  
  const body = {
    messages: [
      { role: 'user', content: 'por que el viernes pasado cayo tanto el mercado' }
    ],
    modelId: 'fast',
    webSearch: true,
    activeTools: []
  };

  console.log('Sending request to /api/ai-chat...');
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // We need a dummy supabase cookie or session header since the endpoint calls auth.getUser()
        // Wait, how does getUser check authorization?
        // It reads from request cookies. So we might need to mock or disable authorization for testing,
        // or pass a valid authorization header if required.
      },
      body: JSON.stringify(body)
    });

    console.log('Response Status:', res.status);
    if (!res.ok) {
      const text = await res.text();
      console.log('Error Response:', text);
      return;
    }

    const reader = res.body;
    reader.on('data', (chunk) => {
      console.log('--- CHUNK ---');
      console.log(chunk.toString());
    });

    reader.on('end', () => {
      console.log('Stream ended.');
    });

  } catch (error) {
    console.error('Fetch error:', error);
  }
}

run();
