import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export interface RazorpayOrderOptions {
    amount: number; // in paise (₹1 = 100)
    currency?: string;
    receipt?: string;
    notes?: Record<string, string>;
}

export interface RazorpaySubscriptionOptions {
    plan_id: string;
    customer_notify: number;
    total_count: number;
    notes?: Record<string, string>;
}

/**
 * Create a Razorpay order for one-time payment
 */
export async function createRazorpayOrder(options: RazorpayOrderOptions) {
    try {
        const order = await razorpay.orders.create({
            amount: options.amount,
            currency: options.currency || 'INR',
            receipt: options.receipt || `receipt_${Date.now()}`,
            notes: options.notes || {},
        });

        return order;
    } catch (error) {
        console.error('Razorpay order creation failed:', error);
        throw new Error('Failed to create payment order');
    }
}

/**
 * Verify Razorpay payment signature
 */
export function verifyRazorpaySignature(
    orderId: string,
    paymentId: string,
    signature: string
): boolean {
    try {
        const text = `${orderId}|${paymentId}`;
        const generated_signature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(text)
            .digest('hex');

        return generated_signature === signature;
    } catch (error) {
        console.error('Signature verification failed:', error);
        return false;
    }
}

/**
 * Create a Razorpay subscription
 */
export async function createRazorpaySubscription(options: RazorpaySubscriptionOptions) {
    try {
        const subscription = await razorpay.subscriptions.create({
            plan_id: options.plan_id,
            customer_notify: options.customer_notify as 0 | 1,
            total_count: options.total_count,
            notes: options.notes || {},
        });

        return subscription;
    } catch (error: any) {
        console.error('Razorpay subscription creation failed:', error);
        const err = new Error(error?.message || 'Failed to create subscription');
        err.name = 'RazorpaySubscriptionError';
        throw err;
    }
}

/**
 * Cancel a Razorpay subscription
 */
export async function cancelRazorpaySubscription(subscriptionId: string) {
    try {
        const subscription = await razorpay.subscriptions.cancel(subscriptionId);
        return subscription;
    } catch (error) {
        console.error('Razorpay subscription cancellation failed:', error);
        throw new Error('Failed to cancel subscription');
    }
}

/**
 * Fetch subscription details
 */
export async function fetchRazorpaySubscription(subscriptionId: string) {
    try {
        const subscription = await razorpay.subscriptions.fetch(subscriptionId);
        return subscription;
    } catch (error) {
        console.error('Razorpay subscription fetch failed:', error);
        throw new Error('Failed to fetch subscription');
    }
}

export default razorpay;
