require('dotenv').config();
const apiKey = process.env.LANGLY_API_KEY;

async function testSingle() {
  const dummyQSmall = Array(40).fill('A very long subtitle string that contains a significant amount of text to test the total character payload size limits of the langbly API translation engine proxy network load balancers. '.repeat(10));
  const response = await fetch(`https://api.langbly.com/language/translate/v2?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
          q: dummyQSmall,
          target: 'si',
          format: 'text'
      })
  });
  const text = await response.text();
  console.log('Heavy string Status:', response.status, text.substring(0, 50));
}

testSingle();
