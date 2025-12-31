"use client";

import { useEffect, useState } from "react";
import { AuditResult, AuditResultData } from "@/components/audit-result";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, ExternalLink, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { AuditLoading } from "@/components/audit-loading";

export default function ReportPage() {
    const router = useRouter();
    const [result, setResult] = useState<AuditResultData | null>(null);
    const [url, setUrl] = useState("");
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [reportDate, setReportDate] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const auditId = searchParams.get("id");

        if (auditId) {
            // Fetch from API
            const fetchAudit = async () => {
                try {
                    const response = await axios.get(`/api/audit/${auditId}`);
                    const audit = response.data.audit;

                    if (audit.is_paid || audit.full_report) {
                        setResult(audit.full_report);
                        setUrl(audit.website_url);
                        setReportDate(audit.created_at);
                        setIsUnlocked(true);
                    } else {
                        // Construct a partial result for preview mode
                        setResult({
                            score: audit.conversion_score || 0,
                            summary: "Purchase full report to unlock complete analysis and specific fixing instructions.",
                            audit_items: audit.preview_issues || [],
                            quick_wins: []
                        });
                        setUrl(audit.website_url);
                        setReportDate(audit.created_at);
                        setIsUnlocked(false);
                    }
                } catch (error) {
                    console.error("Failed to fetch audit:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchAudit();
        } else {
            const saved = localStorage.getItem("current_report");
            if (saved) {
                const parsed = JSON.parse(saved);
                setResult(parsed.result || parsed);
                setUrl(parsed.url || "your-site.com");
                setReportDate(parsed.purchasedAt || parsed.date || new Date().toISOString());
                setIsUnlocked(true); // Always unlocked if viewing from dashboard
            }
            setIsLoading(false);
        }
    }, []);

    const handlePayment = () => {
        const searchParams = new URLSearchParams(window.location.search);
        const auditId = searchParams.get("id");
        if (auditId) {
            router.push(`/payment?id=${auditId}`);
        } else {
            router.push("/dashboard");
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center">
                <AuditLoading
                    title="Opening your report..."
                    subtitle="Fetching your latest conversion optimization data..."
                />
            </div>
        );
    }

    if (!result) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ArrowLeft className="w-8 h-8 text-zinc-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-zinc-900">No audit found</h2>
                    <p className="text-zinc-500">This report may have been deleted or doesn't exist.</p>
                    <Link href="/dashboard">
                        <Button className="bg-zinc-900 hover:bg-zinc-800 text-white mt-4">
                            Back to Dashboard
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl animate-in fade-in duration-500">
            {/* Enhanced Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-100">
                <div className="flex items-start gap-4">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="icon" className="shrink-0 hover:bg-zinc-100">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-zinc-500">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(reportDate).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                            })}</span>
                        </div>
                        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Conversion Audit Report</h1>
                        <div className="flex items-center gap-2 mt-2">
                            <ExternalLink className="w-4 h-4 text-zinc-400" />
                            <a
                                href={url.startsWith('http') ? url : `https://${url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-600 hover:text-purple-700 font-medium hover:underline"
                            >
                                {url}
                            </a>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-zinc-200 hover:bg-zinc-50 text-zinc-700"
                        onClick={() => {
                            if (navigator.share) {
                                navigator.share({
                                    title: 'Conversion Audit Report',
                                    text: `Check out my conversion audit for ${url}`,
                                    url: window.location.href,
                                });
                            }
                        }}
                    >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                    </Button>
                    <Link href="/dashboard">
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-900"
                        >
                            New Audit
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Audit Result Component */}
            <AuditResult
                result={result}
                isUnlocked={isUnlocked}
                onUnlock={handlePayment}
                mode="dashboard"
                url={url}
            />
        </div>
    );
}
