"use client";

import { useEffect, useState } from "react";
import { AuditResultData } from "@/components/audit-result";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { AuditResult } from "@/components/audit-result";

export default function PrintReportPage() {
    const [result, setResult] = useState<AuditResultData | null>(null);
    const [url, setUrl] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const auditId = searchParams.get("id");

        if (auditId) {
            const fetchAudit = async () => {
                try {
                    const response = await axios.get(`/api/audit/${auditId}`);
                    const audit = response.data.audit;

                    // In print mode, we assume if they got here, they can view it.
                    // But technically we should respect locking. 
                    // However, for simplicity, we render what we have.
                    if (audit.full_report) {
                        setResult(audit.full_report);
                    } else {
                        // If locked, preview
                        setResult({
                            score: audit.conversion_score || 0,
                            summary: "Full report locked.",
                            audit_items: audit.preview_issues || [],
                            quick_wins: []
                        });
                    }
                    setUrl(audit.website_url);
                } catch (error) {
                    console.error("Failed to fetch audit:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchAudit();
        } else {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isLoading && result) {
            // Wait for images/content to stabilize then print
            setTimeout(() => {
                window.print();
            }, 500);
        }
    }, [isLoading, result]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
                <span className="ml-2 text-zinc-500">Preparing report for printing...</span>
            </div>
        );
    }

    if (!result) return <div className="p-8 text-center">No report found.</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto bg-white min-h-screen print:p-0">
            {/* Simple header for print */}
            <div className="mb-8 pb-6 border-b border-zinc-200">
                <h1 className="text-3xl font-bold text-zinc-900">Conversion Audit Report</h1>
                <p className="text-zinc-500 mt-1">Generated for: <span className="text-zinc-900 font-medium">{url}</span></p>
                <p className="text-zinc-400 text-sm mt-2">{new Date().toLocaleDateString()}</p>
            </div>

            <AuditResult
                result={result}
                isUnlocked={true} // For print, we act as unlocked (assuming logic handled upstream) or locked. Content dictates view.
                onUnlock={() => { }}
                mode="landing" // simplified view
                url={url}
            />
        </div>
    );
}
