import { getUserById, getUserSubscription } from './supabase';
import { getServerClient } from './supabase-server';

/**
 * Get current authenticated user session
 */
// Get current authenticated user
export async function getSession() {
    try {
        const supabase = await getServerClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) return null;

        // Try to get user from public.users table - find by email to handle provide/id mismatches
        const { supabaseAdmin } = await import('./supabase');
        const { data: dbUser } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single();

        // Return user object compatible with session structure
        return {
            user: {
                id: dbUser?.id || user.id, // Use the DB ID if found, else original auth ID
                email: user.email!,
                name: dbUser?.name || user.user_metadata?.full_name || 'User',
                plan: dbUser?.plan || 'free'
            }
        };
    } catch (e: any) {
        return null;
    }
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth() {
    const session = await getSession();

    if (!session || !session.user?.email) {
        throw new Error('Unauthorized');
    }

    return session;
}

/**
 * Check if user can access a specific audit
 */
export async function canAccessAudit(auditId: string, userId: string): Promise<boolean> {
    const { supabaseAdmin } = await import('./supabase');

    const { data, error } = await supabaseAdmin
        .from('audits')
        .select('user_id')
        .eq('id', auditId)
        .single();

    if (error || !data) return false;

    return data.user_id === userId;
}

/**
 * Check if user has active Pro subscription
 */
export async function hasActivePro(userId: string): Promise<boolean> {
    const subscription = await getUserSubscription(userId);

    if (!subscription) return false;

    // Check if subscription is active and not expired
    if (subscription.status !== 'active') return false;

    const now = new Date();
    const periodEnd = new Date(subscription.current_period_end);

    return periodEnd > now;
}
