import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/permissions';
import { createRazorpayOrder } from '@/lib/razorpay';
import { createPayment, supabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';

const createOrderSchema = z.object({
    auditId: z.string().uuid(),
    amount: z.number().positive(),
    currency: z.string().optional(),
});

export async function POST(request: NextRequest) {
    try {
        // Require authentication
        const session = await requireAuth();
        const userId = session.user.id;

        // Parse and validate request body
        const body = await request.json();
        const { auditId, amount, currency } = createOrderSchema.parse(body);

        // Create Razorpay order
        const order = await createRazorpayOrder({
            amount: amount, // amount in paise
            currency: currency || 'INR', // Default to INR if not specified
            notes: {
                userId,
                auditId,
                type: 'audit_payment',
            },
        });

        // Safety: Ensure audit is linked to user (if it was a guest audit)
        await supabaseAdmin
            .from('audits')
            .update({ user_id: userId })
            .eq('id', auditId)
            .is('user_id', null);

        // Store payment record in database
        await createPayment(userId, auditId, order.id, amount);

        // Return order details to frontend
        return NextResponse.json({
            success: true,
            order: {
                id: order.id,
                amount: order.amount,
                currency: order.currency,
            },
        });
    } catch (error: any) {
        console.error('Create order error:', error);

        if (error.message === 'Unauthorized') {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid request data', details: error.issues },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to create payment order' },
            { status: 500 }
        );
    }
}
