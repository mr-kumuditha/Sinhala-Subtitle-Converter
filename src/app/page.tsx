import React from 'react';
import Link from 'next/link';
import { SubtitleConverter } from '@/components/SubtitleConverter';
import { Layers, Zap, Heart, Globe, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center selection:bg-primary/30">
      {/* Navigation */}
      <nav className="w-full max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center shadow-lg">
            <Layers className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">SiSub</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <Link href="#converter" className="hover:text-foreground transition-colors">Converter</Link>
          <Link href="#how-it-works" className="hover:text-foreground transition-colors">How it works</Link>
          <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" className="hidden sm:flex items-center gap-2 text-muted-foreground">
              <LogIn className="w-4 h-4" /> Login
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="w-full max-w-6xl mx-auto px-6 py-20 md:py-32 flex flex-col lg:flex-row items-center gap-16">
        <div className="flex-1 space-y-8 text-center lg:text-left">
          <div className="inline-flex items-center px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-sm font-medium mb-4">
            <SparklesIcon className="w-4 h-4 mr-2" /> Powered by Gemini AI
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
            Convert any subtitles to <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">natural Sinhala.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed">
            Upload your English `.srt` files and get perfectly timed Sinhala subtitles in seconds. Our AI preserves emotions, context, and Sri Lankan slang perfectly.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
            <Link href="#converter">
              <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base shadow-lg shadow-primary/25">
                Start converting
              </Button>
            </Link>
            <Button size="lg" variant="secondary" className="w-full sm:w-auto h-12 px-8 text-base">
              Try as guest
            </Button>
          </div>
        </div>

        <div className="flex-1 w-full max-w-md lg:max-w-none relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-blue-500/20 blur-[100px] rounded-full" />
          <div id="converter" className="relative z-10">
            <SubtitleConverter />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="w-full max-w-6xl mx-auto px-6 py-24 border-t border-border">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">How it works</h2>
          <p className="text-muted-foreground">Get your translations done in three simple steps.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border shadow-sm">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6 text-primary">
              1
            </div>
            <h3 className="text-xl font-semibold mb-2">Upload subtitles</h3>
            <p className="text-muted-foreground leading-relaxed">Drag and drop your English `.srt` file. We automatically parse timestamps and text segments.</p>
          </div>

          <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border shadow-sm">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6 text-primary">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Translate with AI</h3>
            <p className="text-muted-foreground leading-relaxed">Our Gemini integration processes the chunks, maintaining exact line breaks and semantic meaning.</p>
          </div>

          <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border shadow-sm">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6 text-primary">
              3
            </div>
            <h3 className="text-xl font-semibold mb-2">Download Sinhala SRT</h3>
            <p className="text-muted-foreground leading-relaxed">Grab your generated `.srt` file immediately, perfectly synced and ready to use in any video player.</p>
          </div>
        </div>
      </section>

      {/* Why Sinhala-first */}
      <section className="w-full bg-card border-y border-border py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold">Why AI-powered Sinhala?</h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Standard translation tools often lose the essence of spoken dialogue. SiSub is configured specifically to handle subtitle context.
              </p>
              <ul className="space-y-4 pt-4">
                <li className="flex items-start gap-3">
                  <Heart className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-foreground">Supports Emotions</strong>
                    <span className="text-muted-foreground">"I am so mad at you" becomes a strong Sinhala expression, not just a literal word translation.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Globe className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-foreground">Sri Lankan English Slang</strong>
                    <span className="text-muted-foreground">Words like "bro", "phone", or "okay" remain natural where appropriate.</span>
                  </div>
                </li>
              </ul>
            </div>
            <div className="bg-background rounded-2xl border border-border p-8 shadow-inner font-mono text-sm leading-relaxed">
              <div className="text-muted-foreground mb-2">124</div>
              <div className="text-muted-foreground mb-4">00:05:22,100 --&gt; 00:05:25,400</div>
              <div className="text-red-400 mb-6">- I am so mad at you right now!</div>

              <div className="text-muted-foreground mt-8 mb-2">124</div>
              <div className="text-emerald-400 mb-4">00:05:22,100 --&gt; 00:05:25,400</div>
              <div className="text-foreground">- මට දැන් ඔයා එක්ක මාර තරහයි තියෙන්නේ!</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2 mb-4 md:mb-0">
          <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
            <Layers className="text-primary w-3 h-3" />
          </div>
          <span className="font-medium text-foreground">SiSub Converter</span>
        </div>
        <div className="flex gap-6">
          <Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          <Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link>
          <Link href="https://github.com" className="hover:text-foreground transition-colors">GitHub</Link>
        </div>
      </footer>
    </main>
  );
}

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}
