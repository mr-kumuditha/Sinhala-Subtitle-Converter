require('dotenv').config();
const apiKey = process.env.LANGLY_API_KEY;
async function test() {
  const dummyQ = Array(150).fill("Test string");
  const response = await fetch(`https://api.langbly.com/language/translate/v2?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
          q: dummyQ,
          target: 'si',
          format: 'text'
      })
  });
  const text = await response.text();
  console.log("150 strings Status:", response.status, text);

  const dummyQSmall = Array(100).fill("Test string");
  const responseSmall = await fetch(`https://api.langbly.com/language/translate/v2?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
          q: dummyQSmall,
          target: 'si',
          format: 'text'
      })
  });
  const textSmall = await responseSmall.text();
  console.log("100 strings Status:", responseSmall.status, textSmall);
}
test();
