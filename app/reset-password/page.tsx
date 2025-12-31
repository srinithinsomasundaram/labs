'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientClient } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Loader2 } from 'lucide-react';
import { Logo } from '@/components/logo';

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tokenChecked, setTokenChecked] = useState(false);

    const supabase = createClientClient();
    const router = useRouter();

    useEffect(() => {
        const ensureSession = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setTokenChecked(true);
            if (!user) {
                setError('Reset link is invalid or expired. Please request a new one.');
            }
        };
        ensureSession();
    }, [supabase]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        setError(null);
        setIsSubmitting(true);

        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) {
                setError(error.message);
            } else {
                setMessage('Password updated. Redirecting to login...');
                setTimeout(() => router.push('/login'), 2000);
            }
        } catch (err) {
            setError('Unable to update password. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#030303] p-6">
            <div className="w-full max-w-md space-y-6 text-white">
                <Logo showText={false} size={32} />
                <Card className="bg-[#121212] text-white border-white/10 shadow-2xl">
                    <CardContent className="p-8 space-y-6">
                        <div className="space-y-2">
                            <h1 className="text-2xl font-semibold">Create a new password</h1>
                            <p className="text-sm text-white/60">Choose a strong password to secure your account.</p>
                        </div>

                        {!tokenChecked ? (
                            <div className="flex items-center gap-3 text-white/70">
                                <Loader2 className="w-5 h-5 animate-spin" /> Verifying reset link...
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {message && (
                                    <div className="bg-emerald-500/10 border border-emerald-400/40 text-emerald-200 text-sm p-3 rounded-lg">
                                        {message}
                                    </div>
                                )}
                                {error && (
                                    <div className="bg-red-500/10 border border-red-400/40 text-red-200 text-sm p-3 rounded-lg">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/80">New password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 w-4 h-4 text-white/40" />
                                        <Input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            className="pl-10 bg-black/40 border-white/10 text-white placeholder:text-white/30"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/80">Confirm password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 w-4 h-4 text-white/40" />
                                        <Input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            className="pl-10 bg-black/40 border-white/10 text-white placeholder:text-white/30"
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-white text-black hover:bg-white/90"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating password...
                                        </>
                                    ) : (
                                        'Update password'
                                    )}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
