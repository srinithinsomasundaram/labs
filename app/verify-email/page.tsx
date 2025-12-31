'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail } from 'lucide-react';

export default function VerifyEmailPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
            <Card className="max-w-md w-full">
                <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-8 h-8 text-purple-600" />
                    </div>
                    <CardTitle className="text-2xl">Check your email</CardTitle>
                    <CardDescription className="mt-2">
                        A sign in link has been sent to your email address
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-sm text-zinc-600">
                        Click the link in the email to sign in to your account.
                    </p>
                    <p className="text-xs text-zinc-500 mt-4">
                        If you don't see the email, check your spam folder.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
