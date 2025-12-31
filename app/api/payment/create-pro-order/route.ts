import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/permissions';
import { createRazorpayOrder } from '@/lib/razorpay';
import { createPayment } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        const session = await requireAuth();
        const userId = session.user.id;
        const body = await request.json().catch(() => ({}));

        const amount = body.amount || Number(process.env.PRO_MONTHLY_PRICE || 24900);
        const currency = body.currency || 'INR';

        if (!amount || Number.isNaN(amount)) {
            throw new Error('Invalid amount');
        }

        const order = await createRazorpayOrder({
            amount,
            currency,
            notes: {
                userId,
                type: 'pro_upgrade',
            },
        });

        await createPayment(userId, null, order.id, amount);

        return NextResponse.json({
            success: true,
            order: {
                id: order.id,
                amount: order.amount,
                currency: order.currency,
            },
        });
    } catch (error: any) {
        console.error('Create pro order error:', error);

        if (error.message === 'Unauthorized') {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: error?.message || 'Failed to initiate upgrade payment' },
            { status: 500 }
        );
    }
}
