'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Layers, Mail } from 'lucide-react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LoginFormContent() {
    const searchParams = useSearchParams();
    const error = searchParams.get('error');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isMagicLinkLoading, setIsMagicLinkLoading] = useState(false);

    const handleCredentialsLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        await signIn('credentials', {
            email,
            password,
            callbackUrl: '/history',
        });
        setIsLoading(false);
    };

    const handleGoogleLogin = () => {
        signIn('google', { callbackUrl: '/history' });
    };

    const handleMagicLinkLogin = async () => {
        if (!email) return alert('Please enter your email first.');
        setIsMagicLinkLoading(true);
        await signIn('email', { email, callbackUrl: '/history' });
        setIsMagicLinkLoading(false);
    };

    return (
        <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 selection:bg-primary/30">
            <Link href="/" className="flex items-center gap-2 mb-12 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 rounded-md bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center shadow-lg">
                    <Layers className="text-white w-5 h-5" />
                </div>
                <span className="text-xl font-bold tracking-tight">SiSub</span>
            </Link>

            <Card className="w-full max-w-[400px] bg-card border-border shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-blue-400 to-primary/50 opacity-50" />

                <CardHeader className="text-center pt-8 pb-4">
                    <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
                    <CardDescription className="text-muted-foreground mt-2">
                        Enter your credentials to access your history
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md">
                            Authentication failed. Please check your credentials.
                        </div>
                    )}

                    <form onSubmit={handleCredentialsLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-foreground">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="bg-background border-border"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-foreground">Password (Required for Credentials)</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="bg-background border-border"
                            />
                        </div>
                        <Button disabled={isLoading} type="submit" className="w-full mt-6 bg-foreground text-background hover:bg-foreground/90 h-11">
                            {isLoading ? 'Signing in...' : 'Sign In with Password'}
                        </Button>
                    </form>

                    <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <Button disabled={isMagicLinkLoading} onClick={handleMagicLinkLogin} variant="outline" className="bg-background border-border text-foreground hover:bg-muted" type="button">
                            <Mail className="mr-2 h-4 w-4" />
                            {isMagicLinkLoading ? 'Sending link...' : 'Send Magic Link (Requires Email above)'}
                        </Button>

                        <Button onClick={handleGoogleLogin} variant="outline" className="bg-background border-border text-foreground hover:bg-muted" type="button">
                            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                <path d="M1 1h22v22H1z" fill="none" />
                            </svg>
                            Sign in with Google
                        </Button>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-center pb-8 pt-2">
                    <p className="text-sm text-muted-foreground">
                        Don't have an account? <Link href="#" className="font-medium text-primary hover:text-primary/80 transition-colors">Sign up</Link>
                    </p>
                </CardFooter>
            </Card>
        </main>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background flex flex-col items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>}>
            <LoginFormContent />
        </Suspense>
    );
}
