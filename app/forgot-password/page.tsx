'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClientClient } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { Logo } from '@/components/logo';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClientClient();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setMessage(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) {
                setError(error.message);
            } else {
                setMessage('Check your inbox for a secure password reset link.');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#030303] p-6">
            <div className="w-full max-w-md space-y-8 text-white">
                <div className="flex items-center justify-between">
                    <Logo showText={false} size={32} />
                    <Link href="/login">
                        <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to login
                        </Button>
                    </Link>
                </div>

                <Card className="bg-[#121212] text-white border-white/10 shadow-2xl">
                    <CardContent className="space-y-6 p-8">
                        <div className="space-y-2">
                            <h1 className="text-2xl font-semibold">Reset your password</h1>
                            <p className="text-sm text-white/60">Enter the email associated with your account and we'll send instructions to reset your password.</p>
                        </div>

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

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/80">Email address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 w-4 h-4 text-white/40" />
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="founder@startup.com"
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
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending reset link...
                                    </>
                                ) : (
                                    'Send reset instructions'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
