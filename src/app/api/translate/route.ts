import { NextResponse } from 'next/server';
import { parseSRT, buildSRT } from '@/lib/srt';
import { translateSubtitlesToSinhala } from '@/lib/gemini';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const { srtContent } = await request.json();

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

        // 3. Translate in batches (e.g. 50 chunks per batch to respect API limits & accuracy limits)
        const BATCH_SIZE = 40;
        const translatedTexts: string[] = [];

        for (let i = 0; i < textsToTranslate.length; i += BATCH_SIZE) {
            const batch = textsToTranslate.slice(i, i + BATCH_SIZE);
            const translatedBatch = await translateSubtitlesToSinhala(batch);

            // Safety check: ensure lengths match
            if (translatedBatch.length !== batch.length) {
                console.warn(`Batch mismatch: Expected ${batch.length}, got ${translatedBatch.length}. Trying to recover...`);
            }
            translatedTexts.push(...translatedBatch);
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

        // 6. DB Tracking
        const session = await getServerSession(authOptions);

        // NOTE: In production you would upload `srtContent` and `finalSrt` to S3 / Supabase Storage
        // For this example, if the user is authenticated, we log the job with strings in DB or just paths
        if (session?.user && (session.user as any).id) {
            try {
                await prisma.subtitleJob.create({
                    data: {
                        userId: (session.user as any).id,
                        originalFileName: 'upload.srt',
                        sourceLanguage: 'English',
                        targetLanguage: 'Sinhala',
                        status: 'SUCCESS',
                        jobFile: {
                            create: {
                                originalFilePath: 'stored_in_cache', // MOCK storage URL
                                translatedFilePath: 'stored_in_cache', // MOCK storage URL
                            }
                        }
                    }
                });
            } catch (dbErr) {
                console.error('Failed to log job:', dbErr);
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
