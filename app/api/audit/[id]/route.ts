import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, canAccessAudit } from '@/lib/permissions';
import { getAuditById } from '@/lib/supabase';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Await params in Next.js 15+
        const { id: auditId } = await params;

        // Require authentication
        const session = await requireAuth();
        const userId = session.user.id;

        // Check if user can access this audit
        const hasAccess = await canAccessAudit(auditId, userId);

        if (!hasAccess) {
            return NextResponse.json(
                { error: 'Unauthorized access to audit' },
                { status: 403 }
            );
        }

        // Get audit from database
        const audit = await getAuditById(auditId);

        if (!audit) {
            return NextResponse.json(
                { error: 'Audit not found' },
                { status: 404 }
            );
        }

        // Return preview if unpaid, full report if paid
        if (!audit.is_paid) {
            return NextResponse.json({
                success: true,
                audit: {
                    id: audit.id,
                    website_url: audit.website_url,
                    conversion_score: audit.conversion_score,
                    preview_issues: audit.preview_issues,
                    is_paid: false,
                    message: 'Purchase full report to unlock complete analysis',
                },
            });
        }

        // Return full report for paid audits
        return NextResponse.json({
            success: true,
            audit: {
                id: audit.id,
                website_url: audit.website_url,
                conversion_score: audit.conversion_score,
                full_report: audit.full_report,
                is_paid: true,
                created_at: audit.created_at,
            },
        });
    } catch (error: any) {
        console.error('Get audit error:', error);

        if (error.message === 'Unauthorized') {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to fetch audit' },
            { status: 500 }
        );
    }
}
