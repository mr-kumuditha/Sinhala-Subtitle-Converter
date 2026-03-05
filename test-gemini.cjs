const { GoogleGenAI } = require('@google/genai');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

async function test() {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.list();
    for await (const m of response) {
        if (m.name.includes("gemini")) {
            console.log(m.name);
        }
    }
}
test().catch(console.error);
