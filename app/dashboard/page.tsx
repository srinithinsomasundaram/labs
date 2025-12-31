"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, ArrowRight, Clock, Plus, TrendingUp, Search, Loader2, X, Sparkles, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { AuditLoading } from "@/components/audit-loading";
import axios from "axios";
import { Suspense } from "react";

function DashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { session, status } = useAuth();
    const [recentAudits, setRecentAudits] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        totalAudits: 0,
        avgScore: 0,
        timeSaved: 0,
        monthlyGrowth: 0,
    });
    const [showModal, setShowModal] = useState(false);
    const [url, setUrl] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const isPro = session?.user?.plan === "pro";
    const [showUpgradeSuccess, setShowUpgradeSuccess] = useState(false);
    const [auditPrice, setAuditPrice] = useState("$3");

    useEffect(() => {
        const checkLocation = async () => {
            try {
                const res = await fetch('https://ipapi.co/json/');
                const data = await res.json();
                if (data.country_code === 'IN') {
                    setAuditPrice("₹249");
                }
            } catch (error) {
                console.warn('Geolocation failed, defaulting to USD:', error);
            }
        };
        checkLocation();
    }, []);

    // Check if user just upgraded
    useEffect(() => {
        if (searchParams.get('upgraded') === 'true' && isPro) {
            setShowUpgradeSuccess(true);
            // Remove the query param from URL without reload
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        }
    }, [searchParams, isPro]);

    const fetchAudits = async () => {
        try {
            const response = await axios.get("/api/audit/history");
            const audits = response.data.audits.map((a: any) => ({
                id: a.id,
                url: a.website_url,
                score: a.conversion_score,
                result: a.full_report,
                date: a.created_at,
                purchasedAt: a.created_at,
            }));

            setRecentAudits(audits);

            // Calculate statistics
            const totalAudits = audits.length;
            const avgScore = audits.length > 0
                ? audits.reduce((sum: number, audit: any) => sum + (audit.score || 0), 0) / audits.length
                : 0;

            const timeSaved = totalAudits * 4;
            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

            const recentCount = audits.filter((a: any) => new Date(a.date) >= thirtyDaysAgo).length;
            const previousCount = audits.filter((a: any) => {
                const date = new Date(a.date);
                return date >= sixtyDaysAgo && date < thirtyDaysAgo;
            }).length;

            const monthlyGrowth = previousCount > 0
                ? ((recentCount - previousCount) / previousCount) * 100
                : recentCount > 0 ? 100 : 0;

            setStats({
                totalAudits,
                avgScore: Math.round(avgScore * 10) / 10,
                timeSaved,
                monthlyGrowth: Math.round(monthlyGrowth * 10) / 10,
            });
        } catch (error) {
            console.error("Failed to fetch audits:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (status === "authenticated") {
            fetchAudits();
        } else if (status === "unauthenticated") {
            const destination = typeof window !== 'undefined'
                ? window.location.pathname + window.location.search
                : '/dashboard';
            router.push(`/login?callback=${encodeURIComponent(destination)}`);
        }
    }, [status, router]);

    const handleNewAudit = async () => {
        if (!url) return;
        setIsAnalyzing(true);

        const formattedUrl = url.startsWith("http") ? url : `https://${url}`;

        try {
            const response = await axios.post("/api/audit/create", { url: formattedUrl });
            const { audit, success } = response.data;

            if (success) {
                if (audit.isPaid) {
                    // Pro user: Redirect to report with ID
                    router.push(`/dashboard/report?id=${audit.id}`);
                } else {
                    // Free user: Redirect to payment (optionally with ID for context)
                    router.push(`/payment?id=${audit.id}`);
                }
            }
        } catch (error: any) {
            console.error("Audit creation failed:", error);
            const detail = error.response?.data?.details || error.response?.data?.error || error.message;
            alert(`Failed to create audit: ${detail}`);
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="space-y-8 max-w-7xl animate-in fade-in duration-500">
            {/* Upgrade Success Notification */}
            {showUpgradeSuccess && (
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 p-6 shadow-2xl animate-in slide-in-from-top-4 duration-700">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowUpgradeSuccess(false)}
                        className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/10"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                    <div className="flex items-start gap-4 pr-12">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                            <Sparkles className="w-6 h-6 text-white fill-current" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-2xl font-bold text-white mb-2">🎉 Welcome to Pro!</h3>
                            <p className="text-white/90 mb-4">Your account has been upgraded. Here's what you can do now:</p>
                            <div className="grid md:grid-cols-3 gap-4">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-emerald-300" />
                                    <span className="text-white font-medium">Unlimited Audits</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-emerald-300" />
                                    <span className="text-white font-medium">AI Copy Generator</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-emerald-300" />
                                    <span className="text-white font-medium">Full Reports</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Dashboard</h1>
                    <p className="text-sm text-zinc-500">Track your conversion progress</p>
                </div>
                <Button
                    onClick={() => setShowModal(true)}
                    className="bg-zinc-900 hover:bg-zinc-800 text-white font-semibold h-10 px-6 shadow-sm rounded-lg"
                    disabled={status === "loading"}
                >
                    <Plus className="w-4 h-4 mr-2" /> New Audit
                </Button>
            </div>

            {(isLoading || status === "loading") ? (
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-10 h-10 text-zinc-900 animate-spin" />
                        <p className="text-zinc-500 font-medium">Loading your dashboard...</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Statistics Cards - Enhanced Design */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-xs font-medium text-purple-700">Total Audits</CardTitle>
                                <div className="p-2 bg-purple-100 rounded-lg text-purple-700">
                                    <Activity className="h-4 w-4" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-zinc-900">{stats.totalAudits}</div>
                                <div className="flex items-center gap-1 mt-1">
                                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                                    <p className="text-xs text-emerald-600 font-bold">+{stats.monthlyGrowth}% this month</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-xs font-medium text-blue-700">Avg Score</CardTitle>
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <TrendingUp className="h-4 w-4 text-blue-600" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-baseline gap-1">
                                    <div className="text-2xl font-bold text-blue-900">{stats.avgScore}</div>
                                    <span className="text-sm text-blue-400 font-medium">/10</span>
                                </div>
                                <p className="text-xs text-blue-600 mt-1">Health index</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-green-50 to-white border-green-100 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-xs font-medium text-green-700">Time Saved</CardTitle>
                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                    <Clock className="h-4 w-4 text-green-600" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-baseline gap-1">
                                    <div className="text-2xl font-bold text-green-900">{stats.timeSaved}</div>
                                    <span className="text-sm text-green-400 font-medium">hrs</span>
                                </div>
                                <p className="text-xs text-green-600 mt-1">vs manual</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Audits Section - Full Width */}
                    <Card className="bg-white border-zinc-200 shadow-sm">
                        <CardHeader className="border-b border-zinc-100 pb-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg font-bold text-zinc-900">Recent Audits</CardTitle>
                                    <CardDescription className="text-xs text-zinc-500 mt-0.5">
                                        {recentAudits.length === 0 ? 'No audits yet' : `${recentAudits.length} audit${recentAudits.length !== 1 ? 's' : ''}`}
                                    </CardDescription>
                                </div>
                                {recentAudits.length > 0 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.location.href = '/dashboard/history'}
                                        className="border-zinc-200 hover:bg-zinc-50"
                                    >
                                        View All
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {recentAudits.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Activity className="w-8 h-8 text-zinc-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-zinc-900 mb-2">No audits yet</h3>
                                    <p className="text-zinc-500 mb-6">Start your first conversion audit to see insights here</p>
                                    <Button
                                        onClick={() => setShowModal(true)}
                                        className="bg-zinc-900 hover:bg-zinc-800 text-white"
                                    >
                                        <Plus className="w-4 h-4 mr-2" /> Create First Audit
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {recentAudits.slice(0, 5).map((audit, i) => (
                                        <div
                                            key={i}
                                            onClick={() => {
                                                router.push(`/dashboard/report?id=${audit.id}`);
                                            }}
                                            className="group flex items-center justify-between p-4 bg-zinc-50 rounded-lg border border-zinc-100 hover:border-purple-200 hover:bg-white transition-all cursor-pointer"
                                        >
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                {/* Score Badge */}
                                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${audit.score > 8 ? 'bg-emerald-100' :
                                                    audit.score > 5 ? 'bg-amber-100' :
                                                        'bg-red-100'
                                                    }`}>
                                                    <div className="text-center">
                                                        <div className={`text-lg font-bold ${audit.score > 8 ? 'text-emerald-700' :
                                                            audit.score > 5 ? 'text-amber-700' :
                                                                'text-red-700'
                                                            }`}>
                                                            {audit.score}
                                                        </div>
                                                        <div className="text-[9px] text-zinc-500 font-medium">/10</div>
                                                    </div>
                                                </div>

                                                {/* URL and Date */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm text-zinc-900 truncate group-hover:text-purple-700 transition-colors">
                                                        {audit.url}
                                                    </p>
                                                    <p className="text-xs text-zinc-500 mt-0.5">
                                                        {audit.purchasedAt ? new Date(audit.purchasedAt).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        }) : audit.date}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Arrow Icon */}
                                            <ArrowRight className="w-5 h-5 text-zinc-300 group-hover:text-purple-600 group-hover:translate-x-1 transition-all shrink-0" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* New Audit Modal */}
                    {showModal && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 animate-in zoom-in duration-300">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-zinc-900">New Conversion Audit</h2>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            setShowModal(false);
                                            setUrl("");
                                        }}
                                        className="text-zinc-400 hover:text-zinc-900"
                                    >
                                        <X className="w-5 h-5" />
                                    </Button>
                                </div>

                                {isAnalyzing ? (
                                    <div className="py-8">
                                        <AuditLoading
                                            title="Analyzing website..."
                                            subtitle="Our AI is scanning your landing page for conversion leaks..."
                                            className="min-h-0"
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-4 mb-6">
                                            <div>
                                                <label className="text-sm font-medium text-zinc-700 mb-2 block">Website URL</label>
                                                <div className="relative">
                                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
                                                    <Input
                                                        type="url"
                                                        placeholder="https://yourwebsite.com"
                                                        value={url}
                                                        onChange={(e) => setUrl(e.target.value)}
                                                        onKeyDown={(e) => e.key === "Enter" && handleNewAudit()}
                                                        className="pl-12 h-14 text-lg border-zinc-200 focus-visible:ring-purple-500"
                                                        autoFocus
                                                    />
                                                </div>
                                            </div>

                                            {!isPro && (
                                                <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                                                    <p className="text-sm text-amber-900">
                                                        <span className="font-bold">💳 Payment Required:</span> This audit costs {auditPrice}. You'll be redirected to payment.
                                                    </p>
                                                </div>
                                            )}

                                            {isPro && (
                                                <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                                                    <p className="text-sm text-purple-900">
                                                        <span className="font-bold">✨ Pro Member:</span> Unlimited audits included. Your report will be generated instantly.
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-3">
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setShowModal(false);
                                                    setUrl("");
                                                }}
                                                className="flex-1 h-12 border-zinc-200 hover:bg-zinc-50"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={handleNewAudit}
                                                disabled={!url}
                                                className="flex-1 h-12 bg-zinc-900 hover:bg-zinc-800 text-white font-bold"
                                            >
                                                {isPro ? "Generate Audit" : "Continue to Payment"}
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 text-zinc-900 animate-spin" />
            </div>
        }>
            <DashboardContent />
        </Suspense>
    );
}
