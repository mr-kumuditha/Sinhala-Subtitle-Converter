import { GoogleGenAI } from '@google/genai';

export async function translateSubtitlesToSinhala(chunks: string[]): Promise<string[]> {
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

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });

        const output = response.text || '';
        const outputChunks = output
            .split('---CHUNK_BOUNDARY---')
            .map((c: string) => c.replace(/\[CHUNK \d+\]/g, '').trim())
            .filter((c: string) => c.length > 0);

        if (outputChunks.length !== chunks.length) {
            console.warn(`Mismatch in chunk count. Expected ${chunks.length}, got ${outputChunks.length}.`);
            // If the delimiter failed, let's try a fallback splitting or returning original.
            // E.g. returning the first N chunks we could parse.
        }

        // Ensure we return the exact length by padding or truncating if there was a parsing issue.
        const finalChunks = [];
        for (let i = 0; i < chunks.length; i++) {
            finalChunks.push(outputChunks[i] || chunks[i]);
        }

        return finalChunks;
    } catch (error: any) {
        console.error('Gemini Translation Error:', error);
        throw new Error(`Gemini API Error: ${error?.message || 'Unknown error'}`);
    }
}
