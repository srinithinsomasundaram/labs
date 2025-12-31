// Force rebuild: Fixed import to use createServerClient instead of createRouteHandlerClient
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
                            // usage in middleware/route handler where response is mostly ready
                            console.error('Error setting cookies:', error);
                        }
                    },
                },
            }
        );

        const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error && session?.user) {
            // Ensure user exists in public.users table (for Google OAuth users)
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

    // URL to redirect to after sign in process completes
    const nextPath = requestUrl.searchParams.get('next') || '/dashboard';
    return NextResponse.redirect(new URL(nextPath, request.url));
}
