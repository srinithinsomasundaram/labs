import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/permissions';
import { getAuditById, markAuditAsPaid, supabaseAdmin } from '@/lib/supabase';
import { analyzePage } from '@/lib/ai';
import { scrapePage } from '@/lib/scraper';

export async function POST(request: NextRequest) {
    try {
        // Require authentication
        const session = await requireAuth();
        const userId = session.user.id;

        const body = await request.json();
        const { audit_id } = body;

        if (!audit_id) {
            return NextResponse.json({ error: 'audit_id is required' }, { status: 400 });
        }

        // Get audit details
        const audit = await getAuditById(audit_id);

        if (!audit) {
            return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
        }

        // Verify ownership
        if (audit.user_id !== userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Generate or get report
        let fullReport = audit.full_report;
        if (!fullReport) {
            const scrapedData = await scrapePage(audit.website_url);
            fullReport = await analyzePage(scrapedData);
        }

        await markAuditAsPaid(audit_id, fullReport);

        return NextResponse.json({
            success: true,
            message: 'Test unlock successful',
            auditId: audit_id,
        });
    } catch (error: any) {
        console.error('[TEST UNLOCK] Error:', error.message);
        if (error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Session not found. Please log out and log in again.' }, { status: 401 });
        }
        return NextResponse.json({
            error: error.message || 'Internal server error',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
