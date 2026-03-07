require('dotenv').config();
const apiKey = process.env.LANGLY_API_KEY;

async function testSingle() {
  const dummyQSmall = ['Test one string with <i>tag</i>', 'Another line here.'];
  const response = await fetch(`https://api.langbly.com/language/translate/v2?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
          q: dummyQSmall,
          target: 'si',
          format: 'html'
      })
  });
  const text = await response.text();
  console.log('HTML string Status:', response.status, text);
}

testSingle();
