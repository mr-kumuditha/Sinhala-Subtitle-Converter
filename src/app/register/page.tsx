'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Layers } from 'lucide-react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });

            if (res.ok) {
                // Instantly sign them in after successful registration
                await signIn('credentials', {
                    email,
                    password,
                    callbackUrl: '/history',
                });
            } else {
                const data = await res.json();
                setError(data.message || 'Registration failed.');
                setIsLoading(false); // Only set to false if registration failed. If successful, NextAuth redirects.
            }
        } catch (err) {
            setError('An unexpected error occurred.');
            setIsLoading(false);
        }
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
                    <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
                    <CardDescription className="text-muted-foreground mt-2">
                        Enter your details below to get started
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-foreground">Full Name</Label>
                            <Input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="John Doe"
                                className="bg-background border-border"
                                required
                            />
                        </div>
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
                            <Label htmlFor="password" className="text-foreground">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="bg-background border-border"
                                minLength={6}
                                required
                            />
                        </div>
                        <Button disabled={isLoading} type="submit" className="w-full mt-6 bg-foreground text-background hover:bg-foreground/90 h-11">
                            {isLoading ? 'Creating account...' : 'Sign Up'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center pb-8 pt-2">
                    <p className="text-sm text-muted-foreground">
                        Already have an account? <Link href="/login" className="font-medium text-primary hover:text-primary/80 transition-colors">Sign in</Link>
                    </p>
                </CardFooter>
            </Card>
        </main>
    );
}
