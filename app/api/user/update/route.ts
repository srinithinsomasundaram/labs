import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/permissions';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        const session = await requireAuth();
        const userId = session.user.id;

        const body = await request.json();
        const { name } = body;

        if (!name || typeof name !== 'string') {
            return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('users')
            .update({ name })
            .eq('id', userId);

        if (error) {
            console.error('Failed to update user name:', error);
            return NextResponse.json({ error: 'Failed to update user name' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Display name updated' });
    } catch (error: any) {
        console.error('Update user error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
