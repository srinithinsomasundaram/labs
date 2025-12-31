import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/permissions';
import { getUserAudits } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    try {
        const session = await requireAuth();
        const userId = session.user.id;

        const audits = await getUserAudits(userId);

        return NextResponse.json({ audits });
    } catch (error: any) {
        console.error('Fetch audits error:', error);

        if (error.message === 'Unauthorized') {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to fetch audits' },
            { status: 500 }
        );
    }
}
