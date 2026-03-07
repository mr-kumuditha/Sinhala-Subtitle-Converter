import { NextResponse } from 'next/server';
import { parseSRT, buildSRT } from '@/lib/srt';
import { translateSubtitlesToSinhala } from '@/lib/gemini';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadToS3 } from '@/lib/s3';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const maxDuration = 60; // Max duration for Vercel Hobby plan

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
                try {
                    controller.enqueue(encoder.encode(JSON.stringify({ progress: 5 }) + '\n'));

                    // 1. Parse SRT to blocks
                    const blocks = parseSRT(srtContent);
                    if (blocks.length === 0) {
                        controller.enqueue(encoder.encode(JSON.stringify({ error: 'No subtitles found to translate' }) + '\n'));
                        controller.close();
                        return;
                    }

                    // 2. Extract text chunks to translate
                    const textsToTranslate = blocks.map(b => b.text);

                    // 3. Translate in batches
                    const BATCH_SIZE = 400;
                    const translatedTexts: string[] = [];
                    const totalBatches = Math.ceil(textsToTranslate.length / BATCH_SIZE);

                    controller.enqueue(encoder.encode(JSON.stringify({ progress: 10 }) + '\n'));

                    for (let i = 0; i < textsToTranslate.length; i += BATCH_SIZE) {
                        const batch = textsToTranslate.slice(i, i + BATCH_SIZE);
                        const batchNum = Math.floor(i / BATCH_SIZE) + 1;

                        const result = await translateSubtitlesToSinhala(batch);
                        const translatedBatch = result.translatedChunks;

                        translatedTexts.push(...translatedBatch);

                        // Calculate progress from 10% to 85%
                        const currentProgress = 10 + Math.floor((batchNum / totalBatches) * 75);
                        controller.enqueue(encoder.encode(JSON.stringify({ progress: currentProgress }) + '\n'));
                    }

                    // 4. Re-assemble SRT blocks
                    controller.enqueue(encoder.encode(JSON.stringify({ progress: 90 }) + '\n'));
                    const translatedBlocks = blocks.map((block, i) => {
                        return {
                            ...block,
                            text: translatedTexts[i] || block.text,
                        };
                    });

                    // 5. Build final SRT string
                    const finalSrt = buildSRT(translatedBlocks);
                    controller.enqueue(encoder.encode(JSON.stringify({ progress: 95 }) + '\n'));

                    // 6. DB Tracking & S3 Upload
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
                    controller.close();
                } catch (streamErr: any) {
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
            },
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'An error occurred during translation setup.' },
            { status: 500 }
        );
    }
}
