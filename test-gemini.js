require('dotenv').config({ path: '.env' });
const { GoogleGenAI } = require('@google/genai');

async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const models = await ai.models.list();
    console.log("Available Models:");
    for await (const m of models) {
        if (m.name.includes("gemini")) {
            console.log(m.name);
        }
    }
  } catch (err) {
    console.error("Error:", err);
  }
}
test();
