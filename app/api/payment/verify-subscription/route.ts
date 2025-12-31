import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/permissions';
import { supabaseAdmin, updateUserPlan } from '@/lib/supabase';
import crypto from 'crypto';
import { z } from 'zod';

const verifySubscriptionSchema = z.object({
    razorpay_payment_id: z.string(),
    razorpay_subscription_id: z.string(),
    razorpay_signature: z.string(),
});

export async function POST(request: NextRequest) {
    try {
        // Require authentication
        const session = await requireAuth();
        const userId = session.user.id;

        // Parse and validate request body
        const body = await request.json();
        const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } =
            verifySubscriptionSchema.parse(body);

        // Verify Razorpay subscription signature
        // For subscriptions, the signature is verified using payment_id + subscription_id
        const secret = process.env.RAZORPAY_KEY_SECRET!;
        const generated_signature = crypto
            .createHmac('sha256', secret)
            .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
            .digest('hex');

        if (generated_signature !== razorpay_signature) {
            console.error('Subscription verification failed: Invalid signature');
            return NextResponse.json(
                { error: 'Invalid payment signature' },
                { status: 400 }
            );
        }

        await supabaseAdmin.from('users').upsert({
            id: userId,
            email: session.user.email ?? '',
            name: session.user.name || session.user.email || 'User',
            plan: 'pro',
        }, { onConflict: 'id' });

        // Update subscription in database
        await supabaseAdmin
            .from('subscriptions')
            .update({ status: 'active' })
            .eq('razorpay_subscription_id', razorpay_subscription_id);

        // Update user plan to Pro
        await updateUserPlan(userId, 'pro');

        return NextResponse.json({
            success: true,
            message: 'Subscription verified and plan updated to Pro',
        });
    } catch (error: any) {
        console.error('Subscription verification error:', error);

        if (error.message === 'Unauthorized') {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'Subscription verification failed' },
            { status: 500 }
        );
    }
}
