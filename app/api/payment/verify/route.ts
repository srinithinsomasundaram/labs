import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/permissions';
import { verifyRazorpaySignature } from '@/lib/razorpay';
import { updatePaymentStatus, getAuditById, markAuditAsPaid, supabaseAdmin, updateUserPlan } from '@/lib/supabase';
import { analyzePage } from '@/lib/ai';
import { scrapePage } from '@/lib/scraper';
import { paymentVerificationSchema } from '@/lib/validation';
import { z } from 'zod';

export async function POST(request: NextRequest) {
    try {
        // Require authentication
        const session = await requireAuth();
        const userId = session.user.id;

        // Parse and validate request body
        const body = await request.json();
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, audit_id, upgrade } =
            paymentVerificationSchema.parse(body);

        const isUpgrade = Boolean(upgrade);

        // Verify Razorpay signature
        const isValid = verifyRazorpaySignature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        );

        if (!isValid) {
            // Update payment status as failed
            await updatePaymentStatus(razorpay_order_id, razorpay_payment_id, 'failed');

            return NextResponse.json(
                { error: 'Invalid payment signature' },
                { status: 400 }
            );
        }

        // Update payment status as completed
        await updatePaymentStatus(razorpay_order_id, razorpay_payment_id, 'completed');

        if (isUpgrade) {
            const currentPeriodEnd = new Date();
            currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);

            await supabaseAdmin.from('users').upsert({
                id: userId,
                email: session.user.email ?? '',
                name: session.user.name || session.user.email || 'User',
                plan: 'pro',
            }, { onConflict: 'id' });

            await supabaseAdmin.from('subscriptions').insert({
                user_id: userId,
                razorpay_subscription_id: `manual_${razorpay_order_id}`,
                status: 'active',
                current_period_end: currentPeriodEnd.toISOString(),
            });

            await updateUserPlan(userId, 'pro');

            return NextResponse.json({
                success: true,
                message: 'Upgrade payment verified and plan set to Pro',
            });
        }

        if (!audit_id) {
            return NextResponse.json(
                { error: 'audit_id is required for audit verification' },
                { status: 400 }
            );
        }

        // Get audit details
        const audit = await getAuditById(audit_id);

        if (!audit) {
            return NextResponse.json(
                { error: 'Audit not found' },
                { status: 404 }
            );
        }

        // Verify ownership
        if (audit.user_id !== userId) {
            return NextResponse.json(
                { error: 'Unauthorized access to audit' },
                { status: 403 }
            );
        }

        // Check if report already exists in DB
        if (audit.full_report) {
            console.log('Using existing AI report for:', audit.website_url);
            await markAuditAsPaid(audit_id, audit.full_report);
        } else {
            // Generate full AI report if not exists (fallback)
            console.log('Generating full AI report for:', audit.website_url);
            const scrapedData = await scrapePage(audit.website_url);
            const fullReport = await analyzePage(scrapedData);
            await markAuditAsPaid(audit_id, fullReport);
        }

        return NextResponse.json({
            success: true,
            message: 'Payment verified and report generated',
            auditId: audit_id,
        });
    } catch (error: any) {
        console.error('Payment verification error:', error);

        if (error.message === 'Unauthorized') {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid verification payload', details: error.issues },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Payment verification failed' },
            { status: 500 }
        );
    }
}
