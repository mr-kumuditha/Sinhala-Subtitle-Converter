import { GoogleGenAI } from '@google/genai';

export async function translateSubtitlesToSinhala(chunks: string[]): Promise<{ translatedChunks: string[], provider: 'gemini' | 'langbly' }> {
    try {
        console.log(`[Translate] Attempting Gemini for ${chunks.length} chunks...`);
        const translatedChunks = await runGeminiTranslation(chunks);
        return { translatedChunks, provider: 'gemini' };
    } catch (geminiError: any) {
        console.warn(`[Translate] Gemini failed (${geminiError.message}). Falling back to Langbly...`);

        try {
            const translatedChunks = await runLangblyTranslation(chunks);
            return { translatedChunks, provider: 'langbly' };
        } catch (langblyError: any) {
            console.error('[Translate] Langbly Fallback Error:', langblyError);
            throw new Error(`Both Gemini and Langbly failed. Last error: ${langblyError?.message || 'Unknown error'}`);
        }
    }
}

async function runGeminiTranslation(chunks: string[]): Promise<string[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'default' });
    const envModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const model = envModel.includes('1.5') ? 'gemini-2.5-flash' : envModel;

    const prompt = `
Translate these English subtitle chunks into Sinhala (si-LK). 
Rules:
1. Preserve numbers, names, tags like <i>, <b>, and special formatting.
2. Output EXACTLY ONE translated chunk for each input chunk.
3. Keep the line breaks aligned and semantic meaning the same.
4. Separate your output chunks with the exact delimiter "---CHUNK_BOUNDARY---".
5. Do not include any extra introductory text, markdown wrappers, or explanations. 

Here are the chunks:
${chunks.map((c, i) => `[CHUNK ${i}]\n${c}`).join('\n\n')}
`;

    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
    });

    const output = response.text || '';
    const outputChunks = output
        .split('---CHUNK_BOUNDARY---')
        .map((c: string) => c.replace(/\[CHUNK \d+\]/g, '').trim())
        .filter((c: string) => c.length > 0);

    const finalChunks = [];
    for (let i = 0; i < chunks.length; i++) {
        finalChunks.push(outputChunks[i] || chunks[i]);
    }
    return finalChunks;
}

async function runLangblyTranslation(chunks: string[]): Promise<string[]> {
    const apiKey = process.env.LANGLY_API_KEY;
    if (!apiKey) {
        throw new Error("LANGLY_API_KEY is not defined in environment variables");
    }

    // Example Langbly integration (assuming a standard REST completion endpoint)
    // Replace with actual Langbly SDK/Endpoint if different
    const response = await fetch('https://api.langbly.com/v1/translate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            target_language: 'si',
            texts: chunks,
            context: 'These are movie subtitles. Preserve formatting like <i> and <b>.'
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Langbly API error: ${response.status} ${errText}`);
    }

    const data = await response.json();
    // Assuming Langbly returns { translations: ["line 1", "line 2"] }
    if (!data.translations || !Array.isArray(data.translations)) {
        throw new Error("Invalid response format from Langbly");
    }

    const outputChunks = data.translations;

    const finalChunks = [];
    for (let i = 0; i < chunks.length; i++) {
        finalChunks.push(outputChunks[i] || chunks[i]);
    }

    return finalChunks;
}
