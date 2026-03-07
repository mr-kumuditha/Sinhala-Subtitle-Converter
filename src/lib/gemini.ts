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
            console.warn(`[Translate] Both Gemini and Langbly totally failed. Injecting English [TRANSLATION_FAILED] fallback.`);

            // Absolute worst-case scenario: neither API works.
            // Do NOT crash the Next.js stream. Yield original English so the rest of the movie can translate later.
            const failedChunks = chunks.map(c => `[TRANSLATION_FAILED] ${c}`);
            return { translatedChunks: failedChunks, provider: 'langbly' };
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

    const finalChunks: string[] = [];
    const MAX_RETRIES = 3;
    const MAX_ITEMS = 40;
    const MAX_CHARS = 10000;

    // Segment incoming chunks by both array length and string weight
    const subBatches: string[][] = [];
    let currentBatch: string[] = [];
    let currentCharCount = 0;

    for (const chunk of chunks) {
        if (currentBatch.length >= MAX_ITEMS || currentCharCount + chunk.length > MAX_CHARS) {
            if (currentBatch.length > 0) subBatches.push([...currentBatch]);
            currentBatch = [];
            currentCharCount = 0;
        }
        currentBatch.push(chunk);
        currentCharCount += chunk.length;
    }
    if (currentBatch.length > 0) subBatches.push(currentBatch);

    for (let i = 0; i < subBatches.length; i++) {
        const subBatch = subBatches[i];

        // --- Throttle requests to respect Langbly load balancers ---
        if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        let response: Response | null = null;
        let lastErrText = '';
        let success = false;
        let outputChunks: string[] = [];

        // --- Exponential Backoff Retry Loop ---
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            response = await fetch(`https://api.langbly.com/language/translate/v2?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    target: 'si',
                    q: subBatch,
                    format: 'html' // Preserves <i> and <b> tags exactly like Google V2
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.data && data.data.translations && Array.isArray(data.data.translations)) {
                    outputChunks = data.data.translations.map((t: any) => t.translatedText);
                    success = true;
                    break; // Success! Break out of the retry loop
                }
            }

            lastErrText = await response.text();

            // Only retry on 503, 502, 504 or 429
            if ([503, 502, 504, 429].includes(response.status)) {
                console.warn(`[Translate] Langbly ${response.status} on attempt ${attempt}. Retrying...`);
                if (attempt < MAX_RETRIES) {
                    let backoffMs = Math.min(2000 * Math.pow(2, attempt - 1), 8000);

                    // Respect upstream Retry-After headers if Cloudflare/Langbly provides them
                    const retryAfter = response.headers.get('Retry-After');
                    if (retryAfter) {
                        const parsedRetry = parseInt(retryAfter, 10);
                        if (!isNaN(parsedRetry)) {
                            backoffMs = Math.max(backoffMs, parsedRetry * 1000);
                        }
                    }

                    await new Promise(resolve => setTimeout(resolve, backoffMs));
                }
            } else {
                // Hard fail on 400 Bad Request
                console.error(`[Translate] Langbly Hard Error ${response.status}:`, lastErrText);
                break; // Do not retry 400s
            }
        }

        // --- Partial Recovery Architecture ---
        // If the sub-batch completely failed (max retries hit or 400 error), DO NOT CRASH.
        // Yield the original English lines with a failure tag so the Next.js stream survives.
        if (!success) {
            console.error(`[Translate] Sub-batch ${i + 1}/${subBatches.length} FAILED after ${MAX_RETRIES} attempts. Falling back to English.`);
            for (let j = 0; j < subBatch.length; j++) {
                finalChunks.push(`[TRANSLATION_FAILED] ${subBatch[j]}`);
            }
        } else {
            for (let j = 0; j < subBatch.length; j++) {
                finalChunks.push(outputChunks[j] || subBatch[j]);
            }
        }
    }

    return finalChunks;
}
