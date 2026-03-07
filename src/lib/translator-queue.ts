import { GoogleGenAI } from '@google/genai';

// --- Types & Interfaces ---
export interface TranslationBatch {
    index: number;
    chunks: string[];
}

export interface TranslatedBatch {
    index: number;
    translatedChunks: string[];
    provider: 'gemini' | 'deepl' | 'langbly' | 'failed';
}

const MAX_RETRIES = 2;

// --- Helper: Exponential Backoff ---
async function delayExponential(attempt: number, baseMs = 2000): Promise<void> {
    const ms = Math.min(baseMs * Math.pow(2, attempt - 1), 8000);
    await new Promise(resolve => setTimeout(resolve, ms));
}

// --- Worker 1: Gemini ---
async function translateWithGemini(chunks: string[]): Promise<string[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'default' });
    const envModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const model = envModel.includes('1.5') ? 'gemini-2.5-flash' : envModel;

    const prompt = `Translate these English movie subtitle chunks into Sinhala (si-LK). Rules: 1. Preserve numbers, names, tags like <i>, <b>. 2. Output EXACTLY ONE translated chunk for each input chunk. 3. Separate your output chunks with the exact delimiter "---CHUNK_BOUNDARY---". Do not include extra text. \n\nChunks:\n${chunks.map((c, i) => `[CHUNK ${i}]\n${c}`).join('\n\n')}`;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await ai.models.generateContent({
                model: model,
                contents: prompt,
            });

            const outputChunks = (response.text || '')
                .split('---CHUNK_BOUNDARY---')
                .map((c: string) => c.replace(/\[CHUNK \d+\]/g, '').trim())
                .filter((c: string) => c.length > 0);

            if (outputChunks.length > 0) {
                // Return exact mapped length, fallback to source if mapping dropped
                return chunks.map((c, i) => outputChunks[i] || c);
            }
        } catch (err: any) {
            console.warn(`[Gemini] Attempt ${attempt} failed:`, err.message);
            if (attempt < MAX_RETRIES) await delayExponential(attempt);
        }
    }
    throw new Error('Gemini completely failed after max retries.');
}

// --- Worker 2 (Removed DeepL, unsupported language) ---
// --- Worker 3: Langbly ---
async function translateWithLangbly(chunks: string[]): Promise<string[]> {
    const apiKey = process.env.LANGLY_API_KEY;
    if (!apiKey) throw new Error("LANGLY_API_KEY is missing.");

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const res = await fetch(`https://api.langbly.com/language/translate/v2?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    target: 'si',
                    q: chunks,
                    format: 'html'
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.data && data.data.translations && Array.isArray(data.data.translations)) {
                    return data.data.translations.map((t: any) => t.translatedText);
                }
            }

            const errText = await res.text();
            console.warn(`[Langbly] Attempt ${attempt} Status ${res.status}:`, errText);

            if ([503, 502, 504, 429].includes(res.status)) {
                if (attempt < MAX_RETRIES) {
                    let backoffMs = Math.min(2000 * Math.pow(2, attempt - 1), 8000);
                    const retryAfter = res.headers.get('Retry-After');
                    if (retryAfter && !isNaN(parseInt(retryAfter, 10))) {
                        backoffMs = Math.max(backoffMs, parseInt(retryAfter, 10) * 1000);
                    }
                    await new Promise(r => setTimeout(r, backoffMs));
                }
            } else {
                break;
            }
        } catch (err: any) {
            console.warn(`[Langbly] Attempt ${attempt} exception:`, err.message);
            if (attempt < MAX_RETRIES) await delayExponential(attempt);
        }
    }
    throw new Error('Langbly completely failed after max retries.');
}

// --- Fallback Routing Logic ---
export async function processBatchParallel(batch: TranslationBatch): Promise<TranslatedBatch> {
    // 1. Primary: Gemini
    try {
        const result = await translateWithGemini(batch.chunks);
        return { index: batch.index, translatedChunks: result, provider: 'gemini' };
    } catch (e: any) {
        console.warn(`[Batch ${batch.index}] Gemini exhausted. Routing to Langbly...`);
    }

    // 2. Secondary: Langbly
    try {
        const result = await translateWithLangbly(batch.chunks);
        return { index: batch.index, translatedChunks: result, provider: 'langbly' };
    } catch (e: any) {
        console.error(`[Batch ${batch.index}] ALL WORKERS FAILED. Yielding Error Chunks.`);
    }

    // 3. Catastrophic Failure: Return Original English so stream survives
    const failedChunks = batch.chunks.map(c => `[TRANSLATION_FAILED] ${c}`);
    return { index: batch.index, translatedChunks: failedChunks, provider: 'failed' };
}
