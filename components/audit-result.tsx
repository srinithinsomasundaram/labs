import { ArrowRight, CheckCircle, Lock, XCircle, AlertTriangle, Zap, Download, Star, ChevronDown, ChevronUp, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

export interface AuditResultData {
    score: number;
    summary: string;
    audit_items: {
        category: string;
        status: "✅" | "⚠️" | "❌";
        analysis: string;
        fix: string;
        why: string;
    }[];
    quick_wins: string[];
    roadmap_to_100?: {
        phase_1: { title: string; tasks: string[] };
        phase_2: { title: string; tasks: string[] };
        phase_3: { title: string; tasks: string[] };
    };
    seo_analysis?: {
        score: number;
        diagnosis: string;
        keywords: { term: string; intent: string; value: string }[];
        fixes: string[];
    };
    competitor_analysis?: {
        competitor: string;
        what_they_do_better: string;
        how_to_apply: string;
    }[];
}

interface AuditResultProps {
    result: AuditResultData;
    isUnlocked: boolean;
    onUnlock: () => void;
    mode: "landing" | "dashboard" | "preview";
    url?: string;
}

export function AuditResult({ result, isUnlocked, onUnlock, mode, url }: AuditResultProps) {
    const router = useRouter();
    const { session } = useAuth();
    const isPro = session?.user?.plan === "pro";
    // Pro users have everything unlocked
    const effectiveIsUnlocked = isPro ? true : isUnlocked;
    const isLocked = !effectiveIsUnlocked;

    const items = Array.isArray(result?.audit_items) ? result.audit_items : [];
    // For preview/locked mode, we show at most 2 items as a teaser
    const previewItems = items.filter(i => i.status === "❌" || i.status === "⚠️").slice(0, 2);
    const displayItems = isLocked ? (previewItems.length > 0 ? previewItems : items.slice(0, 2)) : items;

    const handleDownloadPDF = async () => {
        try {
            const { toPng } = await import('html-to-image');
            const { jsPDF } = await import('jspdf');

            const element = document.getElementById('audit-report-content');
            if (!element) return;

            // Show a loading text or toast here if possible?

            const dataUrl = await toPng(element, {
                quality: 0.95,
                backgroundColor: '#ffffff',
                filter: (node) => {
                    if (node instanceof HTMLElement) {
                        return !node.classList.contains('print:hidden') && !node.classList.contains('hide-for-pdf');
                    }
                    return true;
                }
            });

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const imgProps = pdf.getImageProperties(dataUrl);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            // Create a PDF with the exact height of the content
            const customPdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: [pdfWidth, pdfHeight + 20] // Add some visual padding height
            });

            customPdf.addImage(dataUrl, 'PNG', 0, 10, pdfWidth, pdfHeight);
            customPdf.save(`Conversion_Audit_Report.pdf`);

        } catch (error) {
            console.error('Download failed', error);
            // Fallback
            window.print();
        }
    };

    return (
        <div className="w-full text-left space-y-8 animate-in fade-in duration-700 print:space-y-4">
            <div id="audit-report-content" className="space-y-6 md:space-y-8 bg-white p-4 md:p-8 rounded-xl">
                {/* Scorecard Header - Mobile Optimized */}
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between p-6 md:p-8 rounded-2xl bg-white border border-zinc-200 shadow-sm relative overflow-hidden">
                    <div className="space-y-2 relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="bg-purple-100 p-1.5 rounded text-purple-700">
                                <BarChart2 className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold text-purple-700 uppercase tracking-widest">Audit Report</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-zinc-900 tracking-tight">Conversion Score</h2>
                        {url && <p className="text-zinc-500 font-medium">Target: <span className="text-zinc-900">{url}</span></p>}
                        <p className="text-zinc-400 mt-2 text-xs uppercase tracking-widest font-bold print:hidden flex items-center gap-2">
                            Status:
                            <span className={cn("px-2 py-0.5 rounded-full text-white text-[10px]", effectiveIsUnlocked ? "bg-green-500" : "bg-zinc-500")}>
                                {effectiveIsUnlocked ? "UNLOCKED" : "PREVIEW MODE"}
                            </span>
                        </p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 items-center w-full md:w-auto justify-between md:justify-end">
                        {/* Action Button (Unlocked Download vs Locked Purchase) */}
                        {effectiveIsUnlocked ? (
                            <Button variant="outline" onClick={handleDownloadPDF} className="hidden md:flex gap-2 border-zinc-200 hover:bg-zinc-50 text-zinc-700 print:hidden">
                                <Download className="w-4 h-4" /> Download PDF
                            </Button>
                        ) : (
                            <Button
                                onClick={onUnlock}
                                className="flex gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold animate-pulse-slow print:hidden px-6"
                            >
                                <Lock className="w-4 h-4" /> Purchase Full Report - $3
                            </Button>
                        )}

                        <div className="text-right">
                            <div className={cn("text-5xl md:text-7xl font-black tracking-tighter flex items-baseline justify-end",
                                (result?.score || 0) < 5 ? "text-red-500" : (result?.score || 0) < 8 ? "text-yellow-500" : "text-green-500"
                            )}>
                                {result?.score || 0}<span className="text-2xl md:text-3xl text-zinc-300 font-medium">/10</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="relative">
                    {/* Light/Frosted Blur Overlay for Locked Mode */}
                    {isLocked && (
                        <div className="absolute inset-x-0 top-[200px] bottom-0 bg-white/60 backdrop-blur-md z-20 flex flex-col items-center pt-24 text-center pointer-events-auto no-print">
                            <div className="p-8 mx-4 rounded-2xl bg-white border border-zinc-200 shadow-xl max-w-lg w-full animate-in zoom-in duration-300">
                                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Lock className="w-6 h-6 text-purple-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-zinc-900 mb-2">Unlock Full Analysis</h3>
                                <p className="text-zinc-500 mb-8 leading-relaxed">Get specific engineering fixes for Traffic, Trust, CTAs, and Mobile conversion.</p>
                                <Button onClick={onUnlock} size="lg" className="w-full h-14 text-lg bg-zinc-900 hover:bg-zinc-800 text-white font-bold shadow-lg shadow-zinc-200/50 rounded-xl">
                                    Unlock Full Report - $3
                                </Button>
                                <p className="text-xs text-zinc-400 mt-4 uppercase tracking-wider font-medium">One-time payment • Instant Access</p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* The Summary */}
                        <Card className="bg-white border-zinc-200 shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-zinc-900">
                                    📝 Executive Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-lg text-zinc-600 leading-relaxed italic">"{result.summary}"</p>
                            </CardContent>
                        </Card>

                        {/* The Roadmap Analysis */}
                        <div className="space-y-6 pt-6">
                            <h3 className="text-2xl font-bold text-zinc-900 px-1">Detailed Roadmap Analysis</h3>
                            <div className="relative pl-8 md:pl-12 space-y-12 before:absolute before:left-[15px] md:before:left-[19px] before:top-2 before:h-full before:w-0.5 before:bg-zinc-200">
                                {displayItems.map((item, i) => (
                                    <RoadmapItem key={i} item={item} index={i} isLocked={isLocked} />
                                ))}
                            </div>
                        </div>

                        {/* Quick Wins Section */}
                        {result.quick_wins && result.quick_wins.length > 0 && (
                            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100 shadow-sm mt-8">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-green-900">
                                        <Zap className="w-5 h-5 text-green-600 fill-current" /> Quick Wins (24h Impact)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-3">
                                        {result.quick_wins.map((win, i) => (
                                            <li key={i} className="flex items-start gap-3 text-green-900">
                                                <div className="w-5 h-5 rounded-full bg-green-200/50 flex items-center justify-center shrink-0 mt-0.5">
                                                    <CheckCircle className="w-3.5 h-3.5 text-green-700" />
                                                </div>
                                                <span className="leading-relaxed font-medium">{win}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}

                        {/* Roadmap to 100% Section */}
                        {effectiveIsUnlocked && result.roadmap_to_100 && (
                            <div className="space-y-6 pt-8">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-bold text-zinc-900">Strategic Roadmap to 100%</h3>
                                        <p className="text-zinc-500 text-sm">Follow these phases to achieve maximum conversion engineering efficiency.</p>
                                    </div>
                                    <div className="flex items-center gap-2 bg-zinc-100 px-3 py-1.5 rounded-full">
                                        <div className="w-24 h-2 bg-zinc-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-purple-600 transition-all duration-1000"
                                                style={{ width: `${(result.score || 0) * 10}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-bold text-zinc-600">{(result.score || 0) * 10}% Complete</span>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-3 gap-6">
                                    {[result.roadmap_to_100.phase_1, result.roadmap_to_100.phase_2, result.roadmap_to_100.phase_3].map((phase, i) => (
                                        <Card key={i} className={cn(
                                            "border-zinc-200 shadow-sm transition-all hover:shadow-md",
                                            i === 0 ? "bg-white" : i === 1 ? "bg-white" : "bg-white"
                                        )}>
                                            <CardHeader className="pb-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm",
                                                        i === 0 ? "bg-purple-100 text-purple-700" :
                                                            i === 1 ? "bg-blue-100 text-blue-700" :
                                                                "bg-emerald-100 text-emerald-700"
                                                    )}>
                                                        {i + 1}
                                                    </div>
                                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                                        {i === 0 ? "Immediate" : i === 1 ? "Week 2-4" : "Ongoing"}
                                                    </span>
                                                </div>
                                                <CardTitle className="text-base font-bold text-zinc-900 leading-tight">
                                                    {phase.title}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <ul className="space-y-3">
                                                    {phase.tasks.map((task, j) => (
                                                        <li key={j} className="flex items-start gap-2.5">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 mt-1.5 shrink-0" />
                                                            <span className="text-xs text-zinc-600 font-medium leading-relaxed">{task}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* SEO & Keyword Strategy Section */}
                        {effectiveIsUnlocked && result.seo_analysis && (
                            <div className="space-y-6 pt-8">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-bold text-zinc-900">Advanced SEO & Keyword Strategy</h3>
                                        <p className="text-zinc-500 text-sm">Professional audit of keyword saturation and search intent alignment.</p>
                                    </div>
                                    <div className="flex items-baseline gap-1 text-2xl font-black text-indigo-600">
                                        {result.seo_analysis.score}<span className="text-xs text-zinc-400">/10 SEO</span>
                                    </div>
                                </div>

                                <Card className="border-indigo-100 bg-indigo-50/30 overflow-hidden">
                                    <CardContent className="p-0">
                                        <div className="p-6 border-b border-indigo-100">
                                            <p className="text-zinc-700 leading-relaxed italic">
                                                "{result.seo_analysis.diagnosis}"
                                            </p>
                                        </div>
                                        <div className="grid md:grid-cols-2">
                                            <div className="p-6 border-b md:border-b-0 md:border-r border-indigo-100 bg-white">
                                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">High-Intent Keywords</h4>
                                                <div className="space-y-3">
                                                    {result.seo_analysis.keywords.map((kw, i) => (
                                                        <div key={i} className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                                                            <div>
                                                                <p className="text-sm font-bold text-zinc-900">{kw.term}</p>
                                                                <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-tight">{kw.intent}</p>
                                                            </div>
                                                            <span className={cn(
                                                                "text-[10px] font-bold px-2 py-0.5 rounded",
                                                                kw.value === 'High' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                                                            )}>
                                                                {kw.value} Value
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="p-6 bg-white">
                                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">SEO Structural Fixes</h4>
                                                <ul className="space-y-3">
                                                    {result.seo_analysis.fixes.map((fix, i) => (
                                                        <li key={i} className="flex items-start gap-3">
                                                            <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                                                                <ArrowRight className="w-3 h-3 text-indigo-600" />
                                                            </div>
                                                            <span className="text-xs text-zinc-600 font-medium leading-relaxed">{fix}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Competitor Analysis */}

                    </div>
                </div>
            </div>
        </div>
    );
}

function RoadmapItem({ item, index, isLocked }: { item: any, index: number, isLocked: boolean }) {
    const locked = isLocked && index >= 2;

    if (locked) {
        return (
            <div className="relative opacity-60 blur-[1px] select-none pointer-events-none grayscale">
                <div className="absolute -left-[42px] md:-left-[58px] top-0 w-8 h-8 md:w-10 md:h-10 rounded-full border-4 border-white bg-zinc-200 flex items-center justify-center z-10 shadow-sm">
                    <Lock className="w-4 h-4 text-zinc-400" />
                </div>
                <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6">
                    <div className="h-6 w-1/3 bg-zinc-200 rounded mb-4" />
                    <div className="h-4 w-full bg-zinc-100 rounded mb-2" />
                    <div className="h-4 w-2/3 bg-zinc-100 rounded" />
                </div>
            </div>
        );
    }

    const statusColor = item.status === "✅" ? "text-emerald-600 bg-emerald-50 border-emerald-200" :
        item.status === "⚠️" ? "text-amber-600 bg-amber-50 border-amber-200" :
            "text-red-600 bg-red-50 border-red-200";

    const iconColor = item.status === "✅" ? "bg-emerald-500" :
        item.status === "⚠️" ? "bg-amber-500" :
            "bg-red-500";

    return (
        <div className="relative animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${index * 100}ms` }}>
            <div className={cn("absolute -left-[42px] md:-left-[58px] top-0 w-8 h-8 md:w-10 md:h-10 rounded-full border-4 border-white flex items-center justify-center z-10 shadow-md", iconColor)}>
                {item.status === "✅" ? <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-white" /> :
                    item.status === "⚠️" ? <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-white" /> :
                        <XCircle className="w-4 h-4 md:w-5 md:h-5 text-white" />}
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-5 md:p-6 pb-4">
                    <div className="flex items-start justify-between gap-4 mb-3">
                        <h4 className="text-lg md:text-xl font-bold text-zinc-900 leading-tight">{item.category}</h4>
                        <span className={cn("text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider", statusColor)}>
                            {item.status === "✅" ? "Optimized" : item.status === "⚠️" ? "Warning" : "Critical"}
                        </span>
                    </div>
                    <p className="text-zinc-600 leading-relaxed text-sm md:text-base mb-4">
                        {item.analysis}
                    </p>

                    {item.status !== "✅" && (
                        <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100/50">
                            <div className="flex items-center gap-2 mb-2 text-indigo-700 font-bold text-sm uppercase tracking-wide">
                                <Zap className="w-3.5 h-3.5 fill-indigo-700" />
                                Engineering Fix
                            </div>
                            <p className="text-zinc-900 font-medium text-sm md:text-base">
                                {item.fix}
                            </p>
                        </div>
                    )}
                </div>
                {item.why && (
                    <div className="bg-zinc-50 border-t border-zinc-100 px-5 md:px-6 py-3 text-xs md:text-sm text-zinc-500">
                        <span className="font-semibold text-zinc-600">Why:</span> {item.why}
                    </div>
                )}
            </div>
        </div>
    );
}
