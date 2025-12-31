import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    if (code) {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            );
                        } catch (error) {
                            console.error('Error setting cookies:', error);
                        }
                    },
                },
            }
        );

        const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error && session?.user) {
            console.log(`[AUTH CALLBACK] Syncing user: ${session.user.id}`);
            const { error: syncError } = await supabaseAdmin
                .from('users')
                .upsert({
                    id: session.user.id,
                    email: session.user.email!,
                }, {
                    onConflict: 'email',
                    ignoreDuplicates: true
                });

            if (syncError) {
                console.error('[AUTH CALLBACK] Sync failed:', syncError);
            }
        }
    }

    // Use production base URL for redirect
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5757';
    const nextPath = requestUrl.searchParams.get('next') || '/dashboard';
    return NextResponse.redirect(`${baseUrl}${nextPath}`);
}
