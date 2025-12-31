import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { id, email, name, auditId } = body;

        // Check if user already exists in public table (by ID or Email)
        const { data: existingUser } = await supabaseAdmin
            .from('users')
            .select('id, email')
            .or(`id.eq.${id},email.eq.${email}`)
            .maybeSingle();

        if (existingUser) {
            // If email matches but ID is different, it's a conflict
            if (existingUser.email === email && existingUser.id !== id) {
                return NextResponse.json(
                    { error: 'Email already exists with another account' },
                    { status: 409 }
                );
            }

            // If user exists (ID match), we might still want to link the audit if provided
            if (auditId) {
                await supabaseAdmin
                    .from('audits')
                    .update({ user_id: id })
                    .eq('id', auditId)
                    .is('user_id', null);
            }
            return NextResponse.json({ success: true, message: 'User already exists' });
        }

        // Create or update the user in public table (Upsert is cleaner for race conditions)
        console.log(`[ONBOARD] Processing user: ${id} (${email})`);
        const { error: createError } = await supabaseAdmin
            .from('users')
            .upsert({
                id,
                email,
            }, {
                onConflict: 'email',
                ignoreDuplicates: true
            });

        if (createError) {
            console.error('[ONBOARD] User upsert error:', createError);
            throw createError;
        }

        // Link audit if provided
        if (auditId) {
            const { error: linkError } = await supabaseAdmin
                .from('audits')
                .update({ user_id: id })
                .eq('id', auditId)
                .is('user_id', null);

            if (linkError) {
                console.error('Audit linking error:', linkError);
                // Don't fail onboarding for this
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Onboarding API error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to onboard user' },
            { status: 500 }
        );
    }
}
