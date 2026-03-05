import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { SubtitleJob } from '@prisma/client';

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
    });

    return (
        <main className="min-h-screen bg-neutral-950 text-neutral-50 flex flex-col items-center py-12 px-4">
            <div className="max-w-4xl w-full">
                <h1 className="text-3xl font-bold mb-8">Translation History</h1>

                {jobs.length === 0 ? (
                    <p className="text-neutral-400">No translations yet. Go convert a file!</p>
                ) : (
                    <div className="grid gap-4">
                        {jobs.map((job: SubtitleJob) => (
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
                                        <span className="text-sm">
                                            {job.sourceLanguage} → {job.targetLanguage}
                                        </span>
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
