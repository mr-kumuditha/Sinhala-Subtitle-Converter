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

        // 1. Parse SRT to blocks
        const blocks = parseSRT(srtContent);
        if (blocks.length === 0) {
            return NextResponse.json({ error: 'No subtitles found to translate' }, { status: 400 });
        }

        // 2. Extract text chunks to translate
        const textsToTranslate = blocks.map(b => b.text);

        // 3. Translate in batches (e.g. 150 chunks per batch to minimize API requests and respect free tier quotas)
        const BATCH_SIZE = 150;
        const translatedTexts: string[] = [];

        for (let i = 0; i < textsToTranslate.length; i += BATCH_SIZE) {
            const batch = textsToTranslate.slice(i, i + BATCH_SIZE);
            const translatedBatch = await translateSubtitlesToSinhala(batch);

            // Safety check: ensure lengths match
            if (translatedBatch.length !== batch.length) {
                console.warn(`Batch mismatch: Expected ${batch.length}, got ${translatedBatch.length}. Trying to recover...`);
            }
            translatedTexts.push(...translatedBatch);

            // Respect rate limits by adding a delay between batches if there are more remaining
            if (i + BATCH_SIZE < textsToTranslate.length) {
                await delay(3500); // 3.5 second delay
            }
        }

        // 4. Re-assemble SRT blocks
        const translatedBlocks = blocks.map((block, i) => {
            return {
                ...block,
                text: translatedTexts[i] || block.text, // fallback to original if missing
            };
        });

        // 5. Build final SRT string
        const finalSrt = buildSRT(translatedBlocks);

        // 6. DB Tracking & S3 Upload
        const session = await getServerSession(authOptions);

        if (session?.user && (session.user as any).id) {
            try {
                const userId = (session.user as any).id;
                const timestamp = Date.now();

                // Upload original to S3
                const originalKey = `uploads/${userId}/${timestamp}-original-${fileName}`;
                await uploadToS3(originalKey, srtContent, 'text/plain');

                // Upload translated to S3
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
                // We don't throw here to ensure the user still gets their translated file in the UI immediately
            }
        }

        return NextResponse.json({ translatedSrt: finalSrt }, { status: 200 });

    } catch (error: any) {
        console.error('Translation Next Server Error:', error);
        return NextResponse.json(
            { error: error.message || 'An error occurred during translation.' },
            { status: 500 }
        );
    }
}
