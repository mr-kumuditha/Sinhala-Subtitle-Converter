require('dotenv').config();
const apiKey = process.env.LANGLY_API_KEY;
async function test() {
  const response = await fetch(`https://api.langbly.com/language/translate/v2?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
          q: ["Hello world", "This is a test"],
          target: 'si',
          format: 'text'
      })
  });
  const text = await response.text();
  console.log("Status:", response.status);
  console.log("Body:", text);
}
test();
