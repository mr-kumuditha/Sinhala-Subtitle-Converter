import { NextResponse } from 'next/server';
import { parseSRT, buildSRT } from '@/lib/srt';
import { translateSubtitlesToSinhala } from '@/lib/gemini';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadToS3 } from '@/lib/s3';
import { processBatchParallel, TranslationBatch } from '@/lib/translator-queue';
import pLimit from 'p-limit';
import { LRUCache } from 'lru-cache'; // 2GB VPS Memory Fix

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const maxDuration = 60; // Max duration for Vercel Hobby plan
export const dynamic = 'force-dynamic'; // Force Next.js real-time streaming

// LRU RAM Cache: Prevents infinite Map memory leaks on 2GB VPS (Max 5,000 sentences)
const translationCache = new LRUCache<string, string>({
    max: 5000,
});

export async function POST(request: Request) {
    try {
        const { srtContent, fileName = 'upload.srt' } = await request.json();

        if (!srtContent || typeof srtContent !== 'string') {
            return NextResponse.json({ error: 'Invalid or missing srtContent' }, { status: 400 });
        }

        const session = await getServerSession(authOptions);
        const encoder = new TextEncoder();

        const stream = new ReadableStream({
            async start(controller) {
                // --- Keep-alive Ping to prevent Nginx 60s proxy timeout drops ---
                const keepAlive = setInterval(() => {
                    try {
                        // Send 2048 bytes of whitespace to forcefully flush Nginx proxy buffers
                        controller.enqueue(encoder.encode(' '.repeat(2048) + '\n'));
                    } catch (e) {
                        clearInterval(keepAlive);
                    }
                }, 15000); // 15 seconds ping

                try {
                    // Send 2048 bytes of whitespace immediately to forcefully flush Next.js/Nginx proxy buffers
                    controller.enqueue(encoder.encode(' '.repeat(2048) + '\n'));
                    controller.enqueue(encoder.encode(JSON.stringify({ progress: 5 }) + '\n'));

                    // 1. Parse SRT to blocks
                    const blocks = parseSRT(srtContent);
                    if (blocks.length === 0) {
                        controller.enqueue(encoder.encode(JSON.stringify({ error: 'No subtitles found to translate' }) + '\n'));
                        controller.close();
                        return;
                    }

                    // --- Pre-Processing: Heuristics, Cache, & Deduplication ---
                    controller.enqueue(encoder.encode(JSON.stringify({ progress: 10 }) + '\n'));

                    const finalTranslations: string[] = new Array(blocks.length).fill('');
                    const uniquePhrases = new Set<string>();
                    const phraseToIndices = new Map<string, number[]>();

                    for (let i = 0; i < blocks.length; i++) {
                        // 2GB VPS Garbage Collection Yield: Breathe every 1000 lines so V8 cleans heap
                        if (i > 0 && i % 1000 === 0) {
                            await new Promise(r => setTimeout(r, 0));
                        }

                        // 1. Formatting Sanitizer: Strip problematic music tokens
                        let text = blocks[i].text.replace(/♪|♫|♬/g, '').trim();

                        // 2. Heuristic Noise Squelcher: Skip [Music], (Applause)
                        if (/^\[.*?\]$/.test(text) || /^\(.*?\)$/.test(text) || text.length === 0) {
                            finalTranslations[i] = text; // Keep in English
                            continue;
                        }

                        // 3. Global LRU Cache Hit
                        if (translationCache.has(text)) {
                            finalTranslations[i] = translationCache.get(text)!;
                            continue;
                        }

                        // 4. Register Unique Phrase for Translation Loop
                        uniquePhrases.add(text);
                        if (!phraseToIndices.has(text)) {
                            phraseToIndices.set(text, []);
                        }
                        phraseToIndices.get(text)!.push(i);
                    }

                    const textsToTranslate = Array.from(uniquePhrases);

                    // --- Advanced Weight-Based Batching Algorithm ---
                    const batches: TranslationBatch[] = [];
                    const MAX_ITEMS = 50;
                    const MAX_CHARS = 2000;

                    let currentBatchChunks: string[] = [];
                    let currentCharCount = 0;
                    let batchIndex = 0;

                    for (const text of textsToTranslate) {
                        if (currentBatchChunks.length >= MAX_ITEMS || currentCharCount + text.length > MAX_CHARS) {
                            if (currentBatchChunks.length > 0) {
                                batches.push({ index: batchIndex++, chunks: [...currentBatchChunks] });
                            }
                            currentBatchChunks = [];
                            currentCharCount = 0;
                        }
                        currentBatchChunks.push(text);
                        currentCharCount += text.length;
                    }
                    if (currentBatchChunks.length > 0) {
                        batches.push({ index: batchIndex++, chunks: currentBatchChunks });
                    }

                    // If absolutely everything was cached or dropped, skip APIs entirely
                    if (batches.length > 0) {
                        let completedBatches = 0;
                        const totalBatches = batches.length;

                        // Max 3 parallel workers strict clamping for 2GB VPS limits
                        const limit = pLimit(3);

                        // Dispatch all workers concurrently
                        const parallelJobs = batches.map(batch => limit(async () => {
                            const translatedBatch = await processBatchParallel(batch);
                            completedBatches++;

                            // Calculate progress from 10% to 85% dynamically as workers finish
                            const currentProgress = 10 + Math.floor((completedBatches / totalBatches) * 75);
                            controller.enqueue(encoder.encode(JSON.stringify({ progress: currentProgress }) + '\n'));

                            return translatedBatch;
                        }));

                        // Wait for all workers to finish their fallback routes
                        const completedResults = await Promise.all(parallelJobs);

                        // --- Post-Processing: Cache Hydration & Reconstruction ---
                        for (let rIdx = 0; rIdx < completedResults.length; rIdx++) {
                            // 2GB VPS Garbage Collection Yield: Breathe every 10 batches array reconstruction
                            if (rIdx > 0 && rIdx % 10 === 0) {
                                await new Promise(r => setTimeout(r, 0));
                            }

                            const res = completedResults[rIdx];
                            const originalChunks = batches[res.index].chunks;
                            const translatedChunks = res.translatedChunks;

                            for (let j = 0; j < originalChunks.length; j++) {
                                const originalText = originalChunks[j];
                                const translatedText = translatedChunks[j] || originalText; // Fallback mapping

                                // Hydrate LRU Global Cache for next subtitle file
                                translationCache.set(originalText, translatedText);

                                // Distribute to all identical instances in this file
                                const indices = phraseToIndices.get(originalText) || [];
                                for (const idx of indices) {
                                    finalTranslations[idx] = translatedText;
                                }
                            }
                        }
                    } else {
                        // Fast-path: 100% Cache Hit
                        controller.enqueue(encoder.encode(JSON.stringify({ progress: 85 }) + '\n'));
                    }

                    // --- Assembly ---
                    controller.enqueue(encoder.encode(JSON.stringify({ progress: 90 }) + '\n'));
                    const translatedBlocks = blocks.map((block, i) => {
                        return { ...block, text: finalTranslations[i] };
                    });

                    // 6. Build final SRT string
                    const finalSrt = buildSRT(translatedBlocks);
                    controller.enqueue(encoder.encode(JSON.stringify({ progress: 95 }) + '\n'));

                    // 7. DB Tracking & S3 Upload
                    if (session?.user && (session.user as any).id) {
                        try {
                            const userId = (session.user as any).id;
                            const timestamp = Date.now();

                            const originalKey = `uploads/${userId}/${timestamp}-original-${fileName}`;
                            await uploadToS3(originalKey, srtContent, 'text/plain');

                            const translatedKey = `uploads/${userId}/${timestamp}-translated-${fileName}`;
                            await uploadToS3(translatedKey, finalSrt, 'text/plain');

                            await prisma.subtitleJob.create({
                                data: {
                                    userId: userId,
                                    originalFileName: fileName,
                                    sourceLanguage: 'English',
                                    targetLanguage: 'Sinhala',
                                    status: 'SUCCESS',
                                    jobFile: {
                                        create: {
                                            originalFilePath: originalKey,
                                            translatedFilePath: translatedKey,
                                        }
                                    }
                                }
                            });
                        } catch (dbErr) {
                            console.error('Failed to log job or upload to S3:', dbErr);
                        }
                    }

                    controller.enqueue(encoder.encode(JSON.stringify({ translatedSrt: finalSrt, progress: 100 }) + '\n'));
                    clearInterval(keepAlive);
                    controller.close();
                } catch (streamErr: any) {
                    clearInterval(keepAlive);
                    console.error("Stream Error:", streamErr);
                    controller.enqueue(encoder.encode(JSON.stringify({ error: streamErr.message || "An error occurred during translation" }) + '\n'));
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'application/x-ndjson',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no',
            },
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'An error occurred during translation setup.' },
            { status: 500 }
        );
    }
}
