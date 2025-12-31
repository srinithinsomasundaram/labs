import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/permissions';
import { supabaseAdmin, updateUserPlan, markAuditAsPaid, getAuditById } from '@/lib/supabase';
import { scrapePage } from '@/lib/scraper';
import { analyzePage } from '@/lib/ai';

export async function POST(request: NextRequest) {
    try {
        // Require authentication
        const session = await requireAuth();
        const userId = session.user.id;

        const body = await request.json();
        const { type, auditId, testMode } = body;

        // Security check: Only allow if testMode is explicitly true
        // and potentially check for a dev environment or a specific header
        if (testMode !== true) {
            return NextResponse.json({ error: 'Invalid test mode' }, { status: 400 });
        }

        console.log(`API: Test Payment Bypass triggered by ${userId} for type: ${type}`);

        if (type === 'pro') {
            await supabaseAdmin.from('users').upsert({
                id: userId,
                email: session.user.email ?? '',
                name: session.user.name || session.user.email || 'User',
                plan: 'pro',
            }, { onConflict: 'id' });

            // 1. Update user plan to Pro
            await updateUserPlan(userId, 'pro');

            // 2. Mock a subscription record
            const currentPeriodEnd = new Date();
            currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);

            await supabaseAdmin.from('subscriptions').insert({
                user_id: userId,
                razorpay_subscription_id: `test_sub_${Date.now()}`,
                status: 'active',
                current_period_end: currentPeriodEnd.toISOString(),
            });

            return NextResponse.json({
                success: true,
                message: 'Test Pro activation successful',
            });
        }

        if (type === 'audit' && auditId) {
            // 1. Get audit details
            const audit = await getAuditById(auditId);
            if (!audit) {
                return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
            }

            // 2. Mark as paid
            if (audit.full_report) {
                await markAuditAsPaid(auditId, audit.full_report);
            } else {
                console.log('Generating full AI report for test unlock:', audit.website_url);
                const scrapedData = await scrapePage(audit.website_url);
                const fullReport = await analyzePage(scrapedData);
                await markAuditAsPaid(auditId, fullReport);
            }

            return NextResponse.json({
                success: true,
                message: 'Test Audit unlock successful',
            });
        }

        return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });

    } catch (error: any) {
        console.error('Test bypass error:', error);
        return NextResponse.json(
            { error: 'Failed to process test activation' },
            { status: 500 }
        );
    }
}
