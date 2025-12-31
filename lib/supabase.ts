import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/auth-helpers-nextjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window !== 'undefined') {
        console.error('CRITICAL: Supabase environment variables are missing! Authentication will not work.');
    }
}

const validUrl = supabaseUrl || 'https://placeholder.supabase.co';
const validKey = supabaseAnonKey || 'placeholder';

export const supabase = createClient(validUrl, validKey);

// Client for browser/client-side operations (singleton)
let browserClient: any = null;

export const createClientClient = () => {
    if (typeof window === 'undefined') return supabase;

    if (!browserClient) {
        if (!supabaseUrl || !supabaseAnonKey) {
            browserClient = supabase;
        } else {
            console.log('[SUPABASE] Initializing stable browser client');
            browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
        }
    }
    return browserClient;
};

// Admin client for server-side operations (bypasses RLS)
const validServiceKey = supabaseServiceKey || 'placeholder';
export const supabaseAdmin = createClient(validUrl, validServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Database types
export interface User {
    id: string;
    email: string;
    name: string | null;
    plan: 'free' | 'pro';
    created_at: string;
}

export interface Audit {
    id: string;
    user_id: string;
    website_url: string;
    conversion_score: number | null;
    preview_issues: any;
    full_report: any;
    is_paid: boolean;
    created_at: string;
    status?: 'analyzing' | 'completed' | 'failed';
}

export interface Payment {
    id: string;
    user_id: string;
    audit_id: string | null;
    razorpay_order_id: string;
    razorpay_payment_id: string | null;
    amount: number;
    status: 'pending' | 'completed' | 'failed';
    created_at: string;
}

export interface Subscription {
    id: string;
    user_id: string;
    razorpay_subscription_id: string;
    status: 'pending' | 'active' | 'cancelled' | 'expired';
    current_period_end: string;
    created_at: string;
}

// Helper functions (Internal use or background)
export async function getUserById(userId: string): Promise<User | null> {
    const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) return null;
    return data;
}

export async function createAudit(userId: string, websiteUrl: string, previewIssues: any) {
    const { data, error } = await supabaseAdmin
        .from('audits')
        .insert({
            user_id: userId,
            website_url: websiteUrl,
            preview_issues: previewIssues,
            is_paid: false
        })
        .select()
        .single();

    if (error) throw error;
    return data as Audit;
}

export async function getAuditById(auditId: string): Promise<Audit | null> {
    const { data, error } = await supabaseAdmin
        .from('audits')
        .select('*')
        .eq('id', auditId)
        .single();

    if (error) return null;
    return data;
}

export async function markAuditAsPaid(auditId: string, fullReport: any) {
    const { data, error } = await supabaseAdmin
        .from('audits')
        .update({
            is_paid: true,
            full_report: fullReport
        })
        .eq('id', auditId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getUserAudits(userId: string): Promise<Audit[]> {
    const { data, error } = await supabaseAdmin
        .from('audits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) return [];
    return data;
}

export async function createPayment(
    userId: string,
    auditId: string | null,
    razorpayOrderId: string,
    amount: number
) {
    const { data, error } = await supabaseAdmin
        .from('payments')
        .insert({
            user_id: userId,
            audit_id: auditId,
            razorpay_order_id: razorpayOrderId,
            amount,
            status: 'pending'
        })
        .select()
        .single();

    if (error) throw error;
    return data as Payment;
}

export async function updatePaymentStatus(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    status: 'completed' | 'failed'
) {
    const { data, error } = await supabaseAdmin
        .from('payments')
        .update({
            razorpay_payment_id: razorpayPaymentId,
            status
        })
        .eq('razorpay_order_id', razorpayOrderId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getUserSubscription(userId: string): Promise<Subscription | null> {
    const { data, error } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

    if (error) return null;
    return data;
}

export async function updateUserPlan(userId: string, plan: 'free' | 'pro') {
    const { data, error } = await supabaseAdmin
        .from('users')
        .update({ plan })
        .eq('id', userId)
        .select()
        .single();

    if (error) throw error;
    return data;
}
export async function deleteUser(userId: string) {
    // 1. Delete from public.users (cascade might handle this, but being explicit)
    const { error: publicError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', userId);

    if (publicError) {
        console.error('Error deleting from public.users:', publicError);
        // Continue anyway to try deleting from auth
    }

    // 2. Delete from auth.users
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
        throw authError;
    }

    return { success: true };
}
