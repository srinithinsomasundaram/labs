"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    CreditCard,
    History,
    LayoutDashboard,
    LogOut,
    Settings,
    User,
    Zap,
    Sparkles,
    Lock,
    Loader2,
    Video,
    Menu,
    X as CloseIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";
import { createClientClient } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import { ScheduleModal } from "@/components/schedule-modal";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const { session, status } = useAuth();
    const supabase = createClientClient();
    const isPro = session?.user?.plan === "pro";
    const [loading, setLoading] = useState(false);
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Auto-close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);



    // Debug: Log Pro status
    useEffect(() => {
        console.log('DashboardLayout: Session user:', session?.user);
        console.log('DashboardLayout: isPro:', isPro);
        console.log('DashboardLayout: Plan:', session?.user?.plan);
    }, [session, isPro]);

    const handleLogout = async () => {
        try {
            setLoading(true);
            console.log('DashboardLayout: Logout initiated');

            // Safety timeout for signout
            const signOutPromise = supabase.auth.signOut();
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('SignOut timeout')), 2000)
            );

            await Promise.race([signOutPromise, timeoutPromise]).catch(err => {
                console.warn('DashboardLayout: SignOut timeout or failure, proceeding to client cleanup', err);
            });

            // Selective cleanup: Target only auth-related data
            if (typeof window !== 'undefined') {
                // 1. Clear Supabase auth tokens from Local Storage
                Object.keys(localStorage).forEach(key => {
                    if (key.includes('supabase.auth.token') || key.startsWith('sb-')) {
                        localStorage.removeItem(key);
                    }
                });

                // 2. Clear auth flags
                localStorage.removeItem('isPro');

                // 3. Clear Session Storage (if any auth data stored there)
                Object.keys(sessionStorage).forEach(key => {
                    if (key.startsWith('sb-')) {
                        sessionStorage.removeItem(key);
                    }
                });

                // 4. Clear Cookies (targeting Supabase defaults)
                const cookies = document.cookie.split(";");
                for (let i = 0; i < cookies.length; i++) {
                    const cookie = cookies[i];
                    const eqPos = cookie.indexOf("=");
                    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
                    if (name.startsWith('sb-')) {
                        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
                    }
                }
            }

            console.log('DashboardLayout: Logout successful, redirecting to home');
            window.location.href = "/";
        } catch (error) {
            console.error('DashboardLayout: Logout error', error);
            // Force redirect anyway as a fallback
            window.location.href = "/";
        } finally {
            setLoading(false);
        }
    };

    const navItems = [
        { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
        { name: "History", href: "/dashboard/history", icon: History },
        { name: "AI Copy Generator", href: "/dashboard/copy-generator", icon: Sparkles },

        { name: "Settings", href: "/dashboard/settings", icon: Settings },
    ];

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50">
                <div className="flex flex-col items-center gap-3 text-zinc-500">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <p className="text-sm font-medium">Securing your workspace…</p>
                </div>
            </div>
        );
    }

    if (status === 'unauthenticated') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50">
                <div className="text-center space-y-4 max-w-md p-6 bg-white rounded-xl shadow-sm border border-zinc-200">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                        <LogOut className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-zinc-900">Session Expired</h2>
                        <p className="text-sm text-zinc-500 mt-1">Please sign in again to access your dashboard.</p>
                    </div>
                    <Button
                        onClick={() => {
                            // Clear potential stale state
                            localStorage.clear();
                            window.location.href = '/login';
                        }}
                        className="w-full bg-zinc-900 hover:bg-zinc-800 text-white"
                    >
                        Sign In
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-[#121318] border-r border-black/60 hidden md:flex flex-col sticky top-0 h-screen text-white">
                {/* ... existing aside content ... */}
                <div className="p-6 border-b border-white/10">
                    <Link href="/dashboard">
                        <Logo showText textClassName="text-white font-semibold tracking-tight" />
                    </Link>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => (
                        <Link key={item.href} href={item.href}>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "w-full justify-start gap-3 relative h-10 font-medium",
                                    pathname === item.href
                                        ? "bg-white/10 text-white"
                                        : "text-white/60 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <item.icon className={cn("w-4 h-4", item.name === "AI Copy Generator" && "text-purple-600")} />
                                {item.name}
                            </Button>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/10">
                    {isPro && (
                        <div className="rounded-xl p-4 mb-4 border transition-all bg-gradient-to-br from-purple-600/30 to-indigo-600/30 border-purple-400/20 shadow-lg shadow-purple-900/20">
                            <div className="flex items-center gap-2 font-bold text-sm mb-2 text-white">
                                <Zap className="w-4 h-4 text-yellow-300 fill-current" />
                                <span>PRO MEMBER</span>
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-xs text-white/90">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                    <span className="font-medium">Unlimited Audits</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-white/90">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                    <span className="font-medium">AI Copy Generator</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-white/90">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                    <span className="font-medium">Full Reports</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Schedule Button */}
                    <div className="px-2 mb-4">
                        <Button
                            className="w-full bg-white/10 hover:bg-white/20 text-white border-0 justify-start gap-2 h-10 font-semibold"
                            onClick={() => setIsScheduleOpen(true)}
                        >
                            <Video className="w-4 h-4 text-emerald-400" />
                            Schedule Live Audit
                        </Button>
                    </div>

                    <div className="flex items-center gap-3 px-2 text-white">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                            <User className="w-4 h-4" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium truncate">{session?.user?.email || "User"}</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={handleLogout}
                        disabled={loading}
                        className="w-full mt-2 justify-start gap-2 text-white/70 hover:text-red-300 hover:bg-red-500/10"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin text-white/70" /> : <LogOut className="w-4 h-4" />}
                        <span className="text-sm font-medium">Sign Out</span>
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-h-screen bg-zinc-50">
                {/* Mobile Header */}
                <header className="md:hidden bg-white border-b border-zinc-200 p-4 flex items-center justify-between sticky top-0 z-20">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="text-zinc-600"
                        >
                            <Menu className="w-6 h-6" />
                        </Button>
                        <Logo size={24} showText={false} />
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-zinc-500 hover:text-red-600 gap-1.5"
                            onClick={handleLogout}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                            <span className="text-xs font-bold">Sign Out</span>
                        </Button>
                    </div>
                </header>

                {/* Mobile Navigation Drawer */}
                {isMobileMenuOpen && (
                    <div className="fixed inset-0 z-[100] md:hidden">
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />

                        {/* Drawer Content */}
                        <aside className="absolute left-0 top-0 bottom-0 w-[280px] bg-[#121318] text-white flex flex-col animate-in slide-in-from-left duration-300">
                            <div className="p-6 border-b border-white/10 flex items-center justify-between">
                                <Logo showText textClassName="text-white font-semibold" />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="text-white/60 hover:text-white"
                                >
                                    <CloseIcon className="w-5 h-5" />
                                </Button>
                            </div>

                            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                                {navItems.map((item) => (
                                    <Link key={item.href} href={item.href}>
                                        <Button
                                            variant="ghost"
                                            className={cn(
                                                "w-full justify-start gap-4 h-12 font-medium text-base",
                                                pathname === item.href
                                                    ? "bg-white/10 text-white"
                                                    : "text-white/60 hover:text-white hover:bg-white/5"
                                            )}
                                        >
                                            <item.icon className={cn("w-5 h-5", item.name === "AI Copy Generator" && "text-purple-600")} />
                                            {item.name}
                                        </Button>
                                    </Link>
                                ))}

                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setIsScheduleOpen(true);
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="w-full justify-start gap-4 h-12 font-medium text-base text-emerald-400 hover:text-emerald-300 hover:bg-white/5"
                                >
                                    <Video className="w-5 h-5" />
                                    Schedule Live Audit
                                </Button>
                            </nav>

                            <div className="p-4 border-t border-white/10">
                                <div className="flex items-center gap-3 p-2 mb-4 bg-white/5 rounded-lg border border-white/10">
                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-sm font-bold truncate">{session?.user?.email}</p>
                                        <p className="text-[10px] text-white/40 uppercase tracking-widest">{session?.user?.plan} PLAN</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    onClick={handleLogout}
                                    disabled={loading}
                                    className="w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 h-12 font-semibold"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
                                    Sign Out
                                </Button>
                            </div>
                        </aside>
                    </div>
                )}

                <div className="flex-1 p-6 md:p-8 overflow-auto">
                    <div className="mt-0">
                        {children}
                    </div>
                </div>
            </main>
            <ScheduleModal isOpen={isScheduleOpen} onClose={() => setIsScheduleOpen(false)} />
        </div>
    );
}
