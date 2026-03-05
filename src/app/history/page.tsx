import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getDownloadUrl } from '@/lib/s3';
import type { SubtitleJob, SubtitleJobFile } from '@prisma/client';

type JobWithFile = SubtitleJob & { jobFile: SubtitleJobFile | null };

export default function HistoryPage() {
    return <HistoryContent />;
}

async function HistoryContent() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect('/api/auth/signin');
    }

    const userId = (session.user as { id?: string }).id;

    const jobs = await prisma.subtitleJob.findMany({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' },
        include: { jobFile: true }
    });

    const jobsWithUrls = await Promise.all(jobs.map(async (job: JobWithFile) => {
        let downloadUrl: string | null = null;
        if (job.status === 'SUCCESS' && job.jobFile?.translatedFilePath) {
            try {
                downloadUrl = await getDownloadUrl(job.jobFile.translatedFilePath);
            } catch (err) {
                console.error("Failed to generate download url", err);
            }
        }
        return { ...job, downloadUrl };
    }));

    return (
        <main className="min-h-screen bg-neutral-950 text-neutral-50 flex flex-col items-center py-12 px-4">
            <div className="max-w-4xl w-full">
                <h1 className="text-3xl font-bold mb-8">Translation History</h1>

                {jobsWithUrls.length === 0 ? (
                    <p className="text-neutral-400">No translations yet. Go convert a file!</p>
                ) : (
                    <div className="grid gap-4">
                        {jobsWithUrls.map((job: JobWithFile & { downloadUrl: string | null }) => (
                            <Card key={job.id} className="bg-neutral-900 border-neutral-800 text-neutral-100">
                                <CardHeader>
                                    <CardTitle className="text-lg text-emerald-400">
                                        {job.originalFileName}
                                    </CardTitle>
                                    <CardDescription className="text-neutral-400">
                                        {new Date(job.createdAt).toLocaleString()}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm">
                                                {job.sourceLanguage} → {job.targetLanguage}
                                            </span>
                                            {job.downloadUrl && (
                                                <a href={job.downloadUrl} className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors inline-flex items-center gap-1 mt-1 font-medium">
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                    Download
                                                </a>
                                            )}
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full ${job.status === 'SUCCESS'
                                            ? 'bg-emerald-900/50 text-emerald-400'
                                            : job.status === 'FAILED'
                                                ? 'bg-red-900/50 text-red-400'
                                                : 'bg-yellow-900/50 text-yellow-400'
                                            }`}>
                                            {job.status}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
