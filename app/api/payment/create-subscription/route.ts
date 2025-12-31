import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/permissions';
import { createRazorpaySubscription } from '@/lib/razorpay';
import { supabaseAdmin, updateUserPlan } from '@/lib/supabase';
import { z } from 'zod';

const createSubscriptionSchema = z.object({
    planId: z.string(),
});

export async function POST(request: NextRequest) {
    try {
        // Require authentication
        const session = await requireAuth();
        const userId = session.user.id;

        // Parse request body
        const body = await request.json();
        console.log('[create-subscription] received body', body, 'for user', userId);
        const { planId } = createSubscriptionSchema.parse(body);

        if (!planId) {
            throw new Error('Plan ID is missing from the request body');
        }

        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            throw new Error('Razorpay keys are missing on the server');
        }

        // Create Razorpay subscription (await it!)
        const subscription: any = await createRazorpaySubscription({
            plan_id: planId,
            customer_notify: 1,
            total_count: 12, // 12 months
            notes: {
                userId,
                type: 'pro_subscription',
            },
        });

        // Calculate subscription period end (30 days from now)
        const currentPeriodEnd = new Date();
        currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);

        // Store subscription in database
        await supabaseAdmin.from('subscriptions').insert({
            user_id: userId,
            razorpay_subscription_id: subscription.id,
            status: 'pending', // Set to pending until verified
            current_period_end: currentPeriodEnd.toISOString(),
        });

        return NextResponse.json({
            success: true,
            subscription: {
                id: subscription.id,
                status: subscription.status,
            },
        });
    } catch (error: any) {
        console.error('Create subscription error:', error);

        if (error.message === 'Unauthorized') {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const message = error?.message || 'Failed to create subscription';
        const status = error?.name === 'RazorpaySubscriptionError' ? 400 : 500;

        return NextResponse.json(
            { error: message },
            { status }
        );
    }
}
