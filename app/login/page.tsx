'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClientClient } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Loader2, Lock, Chrome, CheckCircle, ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/logo';
import { Suspense } from 'react';

const highlights = [
    'Unlimited landing page audits',
    'AI copy suggestions tuned for SaaS',
    'Battle-tested conversion playbooks',
];

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callback = searchParams.get('callback') || '/dashboard';
    const { status } = useAuth();
    const supabase = createClientClient();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(searchParams.get('error') === 'email-exists' ? 'This email is already registered. Please sign in.' : '');

    useEffect(() => {
        if (status === 'authenticated') {
            const auditId = searchParams.get('auditId');
            const resultCallback = auditId && !callback.includes('id=')
                ? `${callback}${callback.includes('?') ? '&' : '?'}id=${auditId}`
                : callback;
            window.location.href = resultCallback;
        }
    }, [status, callback, searchParams]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const { error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                if (authError.message.includes('Invalid login credentials')) {
                    setError('Invalid email or password. If you signed up with Google, please use the Google sign-in button.');
                } else if (authError.message.includes('Email not confirmed')) {
                    setError('Please confirm your email address before signing in. Check your inbox for a confirmation link.');
                } else {
                    setError(authError.message);
                }
            } else {
                const auditId = searchParams.get('auditId');
                const resultCallback = auditId && !callback.includes('id=')
                    ? `${callback}${callback.includes('?') ? '&' : '?'}id=${auditId}`
                    : callback;

                window.location.href = resultCallback;
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const auditId = searchParams.get('auditId');
            const resultCallback = auditId && !callback.includes('id=')
                ? `${callback}${callback.includes('?') ? '&' : '?'}id=${auditId}`
                : callback;

            const { error: authError } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(resultCallback)}`,
                },
            });
            if (authError) setError(authError.message);
        } catch (err) {
            console.error('Google login error:', err);
            setError('Failed to initiate Google login');
        }
    };

    const showForm = status === 'unauthenticated';

    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-[#030303] text-white">
            <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-[#151718] via-[#0c0c0c] to-[#030303] px-12 py-12 border-r border-white/10">
                <div className="space-y-6">
                    <Logo showText textClassName="text-white text-2xl font-semibold" priority />
                    <div className="space-y-4">
                        <p className="text-sm uppercase tracking-[0.35em] text-white/60 font-semibold">Conversion Engineering Lab</p>
                        <h2 className="text-4xl font-semibold leading-tight">
                            Ship faster, test smarter, and convert more visitors with AI-first workflows.
                        </h2>
                        <p className="text-white/70">Trusted by top SaaS teams to move from copy guessing to scientific experimentation.</p>
                    </div>
                </div>
                <div className="space-y-4">
                    {highlights.map((item) => (
                        <div key={item} className="flex items-center gap-3 text-white/80">
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm font-medium">{item}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex items-center justify-center p-6 lg:p-10 bg-white text-zinc-900">
                <div className="w-full max-w-md space-y-6">
                    <div className="flex items-center justify-between">
                        <Logo size={36} showText={false} />
                        <Link href="/">
                            <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-zinc-900">
                                <ArrowLeft className="w-4 h-4 mr-2" /> Home
                            </Button>
                        </Link>
                    </div>

                    <Card className="border-zinc-100 shadow-2xl shadow-zinc-900/5">
                        <CardContent className="p-8 space-y-6">
                            <div className="space-y-2 text-center">
                                <h1 className="text-2xl font-bold">Welcome back</h1>
                                <p className="text-sm text-zinc-500">Sign in to keep optimizing your funnel.</p>
                            </div>

                            {status === 'loading' && (
                                <div className="flex flex-col items-center justify-center py-8 gap-4">
                                    <Loader2 className="w-8 h-8 text-zinc-900 animate-spin" />
                                    <p className="text-sm text-zinc-500">Establishing secure connection...</p>
                                </div>
                            )}

                            {status === 'authenticated' && (
                                <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
                                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-zinc-900">Signed in successfully!</p>
                                        <p className="text-sm text-zinc-500">Redirecting you to your workspace...</p>
                                    </div>
                                </div>
                            )}

                            {showForm && (
                                <>
                                    {error && (
                                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-2 border border-red-100">
                                            {error}
                                        </div>
                                    )}

                                    <form onSubmit={handleLogin} className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-zinc-700">Email address</label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                                                <Input
                                                    type="email"
                                                    placeholder="you@example.com"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required
                                                    className="pl-10 h-11"
                                                    disabled={isLoading}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm font-medium text-zinc-700">
                                                <label>Password</label>
                                                <Link href="/forgot-password" className="text-purple-600 hover:underline">
                                                    Forgot password?
                                                </Link>
                                            </div>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                                                <Input
                                                    type="password"
                                                    placeholder="••••••••"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    required
                                                    className="pl-10 h-11"
                                                    disabled={isLoading}
                                                />
                                            </div>
                                        </div>

                                        <Button
                                            type="submit"
                                            className="w-full h-11 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Signing in...
                                                </>
                                            ) : (
                                                'Sign in'
                                            )}
                                        </Button>
                                    </form>

                                    <div className="relative my-6">
                                        <div className="absolute inset-0 flex items-center">
                                            <span className="w-full border-t border-zinc-200" />
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-white px-2 text-zinc-500">Or sign in with</span>
                                        </div>
                                    </div>

                                    <Button
                                        variant="outline"
                                        className="w-full h-11 border-zinc-200"
                                        onClick={handleGoogleLogin}
                                        disabled={isLoading}
                                    >
                                        <Chrome className="w-4 h-4 mr-2" />
                                        Continue with Google
                                    </Button>

                                    <p className="text-sm text-center text-zinc-500">
                                        Don't have an account?{' '}
                                        <Link
                                            href={`/signup?callback=${encodeURIComponent(callback)}${searchParams.get('auditId') ? `&auditId=${searchParams.get('auditId')}` : ''}`}
                                            className="text-purple-600 hover:underline font-semibold"
                                        >
                                            Sign up
                                        </Link>
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#030303] text-white">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
