'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { UploadCloud, CheckCircle2, AlertCircle, FileText, Settings2, Download, Eye } from 'lucide-react';

export function SubtitleConverter() {
    const [file, setFile] = useState<File | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [resultSrt, setResultSrt] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setResultSrt(null);
            setError(null);
        }
    };

    const handleConvert = async () => {
        if (!file) return;

        try {
            setIsTranslating(true);
            setError(null);
            setProgress(10); // Start progress

            const text = await file.text();

            setProgress(30);

            const response = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ srtContent: text, fileName: file.name }),
            });

            if (!response.ok) {
                throw new Error(await response.text());
            }

            const data = await response.json();

            setProgress(100);
            setResultSrt(data.translatedSrt);

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'An error occurred during translation.';
            setError(message);
            setProgress(0);
        } finally {
            setIsTranslating(false);
        }
    };

    const handleDownload = () => {
        if (!resultSrt) return;

        const blob = new Blob([resultSrt], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `[Sinhala] ${file?.name || 'subtitles.srt'}`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <Card className="w-full bg-card border-border shadow-2xl relative overflow-hidden">
            {/* Soft top gradient line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-blue-400 to-primary/50 opacity-50" />

            <div className="p-8">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
                        <Settings2 className="w-6 h-6 text-primary" /> Convert subtitles to Sinhala
                    </h2>
                    <p className="text-muted-foreground text-sm">Upload an .srt file to translate to Sinhala automatically.</p>
                </div>

                <div className="flex items-center gap-3 mb-8 text-sm font-medium">
                    <div className="flex items-center gap-2 text-primary">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">1</div>
                        Upload
                    </div>
                    <div className="w-8 h-px bg-border" />
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">2</div>
                        Options
                    </div>
                    <div className="w-8 h-px bg-border" />
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">3</div>
                        Convert & Download
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Step 1: Upload */}
                    <div className="space-y-3">
                        <Label className="text-foreground font-semibold" htmlFor="file">1. Upload SRT File</Label>
                        <div
                            className="group relative border border-dashed border-border hover:border-primary/50 transition-all duration-300 rounded-xl p-10 flex flex-col items-center justify-center bg-background/50 cursor-pointer overflow-hidden"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".srt"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                            {file ? (
                                <div className="flex flex-col items-center gap-2 relative z-10">
                                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-2">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <span className="text-primary text-lg font-medium">{file.name}</span>
                                    <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-3 relative z-10">
                                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-2 group-hover:text-primary group-hover:bg-primary/20 transition-colors">
                                        <UploadCloud className="w-6 h-6" />
                                    </div>
                                    <span className="text-muted-foreground font-medium">Drop your .srt file here or click to browse</span>
                                    <span className="text-xs text-muted-foreground/60">Max 5 MB - Currently supports SRT</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Step 2: Options */}
                    <div className="space-y-4">
                        <Label className="text-foreground font-semibold flex items-center gap-2">
                            2. Translation Options
                        </Label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Source Language</Label>
                                <Input disabled value="Auto detect" className="bg-background border-border text-muted-foreground shadow-sm h-11" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Target Language</Label>
                                <Input disabled value="Sinhala (si-LK)" className="bg-background border-border text-primary font-medium shadow-sm h-11" />
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 pt-2">
                            <label className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background/50 cursor-pointer hover:bg-muted/50 transition-colors">
                                <input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary" defaultChecked />
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-foreground">Keep Sri Lankan English words</span>
                                    <span className="text-xs text-muted-foreground">Leaves words like "bro", "phone", "okay" in English</span>
                                </div>
                            </label>
                            <label className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background/50 cursor-pointer hover:bg-muted/50 transition-colors">
                                <input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary" defaultChecked />
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-foreground">Preserve strong emotions</span>
                                    <span className="text-xs text-muted-foreground">Emotion-aware translation keeps angry, sad, or funny tones</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Status / Errors */}
                    {error && (
                        <div className="bg-destructive/10 text-destructive-foreground p-4 rounded-lg border border-destructive/20 text-sm flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-destructive" />
                            <div>
                                <strong className="block font-medium text-destructive mb-1">Translation Failed</strong>
                                <span className="text-destructive/80">{error}</span>
                            </div>
                        </div>
                    )}

                    {isTranslating && (
                        <div className="space-y-3 bg-muted/30 p-4 rounded-lg border border-border">
                            <div className="flex justify-between text-sm font-medium text-primary">
                                <span>{progress < 30 ? 'Reading subtitles...' : progress < 90 ? 'Talking to AI...' : 'Building Sinhala SRT...'}</span>
                                <span>{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2 bg-background" />
                        </div>
                    )}

                    {/* Step 3: Result */}
                    {resultSrt && !isTranslating && (
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="flex items-start justify-between">
                                <div className="flex gap-3">
                                    <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
                                    <div>
                                        <h4 className="text-primary font-bold text-lg">Ready! Sinhala subtitles generated.</h4>
                                        <p className="text-sm text-muted-foreground mt-1">Translations preserve all original timestamps.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <Button onClick={handleDownload} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 flex items-center gap-2">
                                    <Download className="w-4 h-4" /> Download .srt
                                </Button>
                                <Button variant="outline" className="flex items-center gap-2">
                                    <Eye className="w-4 h-4" /> Preview
                                </Button>
                            </div>

                            <div className="bg-background p-5 rounded-lg border border-border text-sm font-mono text-muted-foreground h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                                {resultSrt.substring(0, 800)}...
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <CardFooter className="px-8 py-5 bg-background border-t border-border flex justify-end gap-3">
                <Button
                    variant="ghost"
                    onClick={() => { setFile(null); setResultSrt(null); setError(null); }}
                    className="text-muted-foreground hover:text-foreground"
                    disabled={isTranslating}
                >
                    Reset
                </Button>
                <Button
                    disabled={!file || isTranslating}
                    onClick={handleConvert}
                    className="min-w-32 bg-foreground text-background hover:bg-foreground/90 shadow-md transition-all duration-200"
                >
                    {isTranslating ? 'Converting...' : 'Convert to Sinhala'}
                </Button>
            </CardFooter>
        </Card>
    );
}
