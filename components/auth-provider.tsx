'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClientClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

type Session = {
    user: {
        id: string;
        email: string;
        name?: string | null;
        plan: 'free' | 'pro';
    } | null;
};

type AuthContextType = {
    session: Session | null;
    status: 'loading' | 'authenticated' | 'unauthenticated';
};

const AuthContext = createContext<AuthContextType>({
    session: null,
    status: 'loading',
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
    const supabase = createClientClient();
    const router = useRouter();

    useEffect(() => {
        let mounted = true;
        let timeout: NodeJS.Timeout;

        const setAuthStatus = (newStatus: 'authenticated' | 'unauthenticated') => {
            if (mounted) {
                if (timeout) clearTimeout(timeout);
                setStatus(newStatus);
            }
        };

        const fetchSession = async () => {
            // Safety timeout: If session check takes more than 10s, fallback
            timeout = setTimeout(() => {
                if (mounted && status === 'loading') {
                    console.warn('AuthProvider: Session check timed out, falling back to unauthenticated');
                    setAuthStatus('unauthenticated');
                }
            }, 10000);

            try {
                console.log('AuthProvider: Checking session...');
                const { data: { user: supabaseUser }, error } = await supabase.auth.getUser();

                if (!mounted) return;

                if (error || !supabaseUser) {
                    console.log('AuthProvider: No active user session');
                    setSession(null);
                    setAuthStatus('unauthenticated');
                    return;
                }

                console.log('AuthProvider: User found, setting authenticated immediately');

                // Set authenticated status immediately to prevent timeout
                setAuthStatus('authenticated');

                // Set initial session with temporary plan
                setSession({
                    user: {
                        id: supabaseUser.id,
                        email: supabaseUser.email!,
                        name: supabaseUser.user_metadata?.full_name || null,
                        plan: 'free', // Temporary, will be updated
                    }
                });

                // Fetch user plan from database (non-blocking)
                console.log('AuthProvider: Fetching user plan from database...');
                try {
                    const { data: userData, error: userError } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', supabaseUser.id)
                        .single();

                    console.log('AuthProvider: User data from DB:', userData);
                    if (userError) {
                        console.error('AuthProvider: Error fetching user data:', userError);
                    }

                    if (mounted && userData) {
                        console.log('AuthProvider: Updating session with plan:', userData.plan);
                        // Force a new session object to trigger re-render
                        setSession({
                            user: {
                                id: supabaseUser.id,
                                email: supabaseUser.email!,
                                name: userData.name || supabaseUser.user_metadata?.full_name || null,
                                plan: userData.plan || 'free',
                            }
                        });
                    }
                } catch (error) {
                    console.error('AuthProvider: Error in plan fetch:', error);
                    // Continue with default plan
                }
            } catch (error) {
                console.error('AuthProvider session fetch error:', error);
                setAuthStatus('unauthenticated');
            }
        };

        fetchSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, currentSession: any) => {
            console.log('AuthProvider: Auth state change:', event, currentSession?.user?.email);

            if (!mounted) return;

            if (currentSession) {
                // Set authenticated status immediately
                setAuthStatus('authenticated');

                // Set initial session
                setSession({
                    user: {
                        id: currentSession.user.id,
                        email: currentSession.user.email!,
                        name: currentSession.user.user_metadata?.full_name || null,
                        plan: 'free', // Temporary
                    }
                });

                // Fetch plan from database (non-blocking)
                console.log('AuthProvider: Auth state changed, fetching user plan...');
                try {
                    const { data: userData, error: userError } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', currentSession.user.id)
                        .single();

                    console.log('AuthProvider: User data from DB (state change):', userData);
                    if (userError) {
                        console.error('AuthProvider: Error fetching user data (state change):', userError);
                    }

                    if (mounted && userData) {
                        console.log('AuthProvider: Updating session with plan (state change):', userData.plan);
                        // Force new session object to trigger re-render
                        setSession({
                            user: {
                                id: currentSession.user.id,
                                email: currentSession.user.email!,
                                name: userData.name || currentSession.user.user_metadata?.full_name || null,
                                plan: userData.plan || 'free',
                            }
                        });
                    }
                } catch (error) {
                    console.error('AuthProvider: Error in plan fetch (state change):', error);
                }
            } else if (event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
                setSession(null);
                setAuthStatus('unauthenticated');
            }

            if (event !== 'INITIAL_SESSION') {
                router.refresh();
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [router]);

    return (
        <AuthContext.Provider value={{ session, status }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);

// Mock NextAuth useSession for backward compatibility where possible
export const useSession = () => {
    const { session, status } = useAuth();
    return { data: session, status };
};
