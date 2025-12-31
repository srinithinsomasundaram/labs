"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Copy, ArrowRight, CheckCircle, AlertTriangle, Zap, Download, Terminal, Lightbulb, Target, PenTool } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";

export default function CopyGeneratorPage() {
    const router = useRouter();
    const { session, status } = useAuth();

    const [url, setUrl] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState("");
    const [history, setHistory] = useState<any[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    // Controlled Tabs state
    const [activeTab, setActiveTab] = useState("creative");
    const [isTabLoading, setIsTabLoading] = useState(false);

    useEffect(() => {
        // Load history from localStorage
        const savedHistory = localStorage.getItem("copy_generator_history");
        if (savedHistory) {
            setHistory(JSON.parse(savedHistory));
        }
    }, []);

    const loadingSteps = [
        "Initializing behavioral scan...",
        "Deconstructing value proposition...",
        "Analyzing sentiment patterns...",
        "Identifying conversion blockers...",
        "Drafting hypnotic hooks...",
        "Polishing final copy...",
    ];

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        setIsTabLoading(true);
        setTimeout(() => setIsTabLoading(false), 600);
    };

    const handleDownloadPDF = async () => {
        try {
            const { toPng } = await import('html-to-image');
            const { jsPDF } = await import('jspdf');

            const element = document.getElementById('copy-results-content');
            if (!element) return;

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

            const customPdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: [pdfWidth, pdfHeight + 20]
            });

            customPdf.addImage(dataUrl, 'PNG', 0, 10, pdfWidth, pdfHeight);
            customPdf.save(`Copy_Reengineering_Strategy.pdf`);

        } catch (error) {
            console.error('Download failed', error);
            window.print();
        }
    };

    const handleGenerate = async () => {
        if (!url) return;
        setIsAnalyzing(true);
        setLoadingStep(0);
        setError("");

        const stepInterval = setInterval(() => {
            setLoadingStep(prev => (prev + 1) % loadingSteps.length);
        }, 1500);

        try {
            const res = await fetch("/api/generate-copy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            });
            const data = await res.json();

            clearInterval(stepInterval);
            setIsAnalyzing(false);

            if (data.error) {
                setError(data.error);
            } else {
                setResult(data.copyResult);

                // Save to history
                const historyItem = {
                    url,
                    result: data.copyResult,
                    timestamp: new Date().toISOString(),
                };
                const updatedHistory = [historyItem, ...history].slice(0, 20); // Keep last 20
                setHistory(updatedHistory);
                localStorage.setItem("copy_generator_history", JSON.stringify(updatedHistory));
            }
        } catch (err) {
            clearInterval(stepInterval);
            setIsAnalyzing(false);
            setError("Failed to generate copy. Please try again.");
        }
    };

    // Show upgrade prompt for non-Pro users
    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-zinc-100 rounded-full border-t-purple-600 animate-spin"></div>
                    <p className="text-zinc-500 font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    const loadHistoryItem = (item: any) => {
        setUrl(item.url);
        setResult(item.result);
        setShowHistory(false);
    };

    return (
        <div className="space-y-8 max-w-5xl animate-in fade-in duration-700 pb-20">
            {/* History Toggle */}
            {!isAnalyzing && history.length > 0 && (
                <div className="flex justify-end">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowHistory(!showHistory)}
                        className="text-zinc-600 hover:text-zinc-900"
                    >
                        {showHistory ? "Hide History" : `View History (${history.length})`}
                    </Button>
                </div>
            )}

            {/* History Panel */}
            {showHistory && (
                <Card className="bg-white border-zinc-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-zinc-900">Recent Copy Generations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {history.map((item, i) => (
                                <div
                                    key={i}
                                    onClick={() => loadHistoryItem(item)}
                                    className="p-4 bg-zinc-50 rounded-lg border border-zinc-100 hover:bg-white hover:border-purple-200 cursor-pointer transition-all group"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-zinc-900 truncate">{item.url}</p>
                                            <p className="text-xs text-zinc-500 mt-1">
                                                {new Date(item.timestamp).toLocaleDateString()} at {new Date(item.timestamp).toLocaleTimeString()}
                                            </p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-purple-600 shrink-0" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Minimal Header */}
            {!result && !isAnalyzing && (
                <div className="space-y-6 max-w-3xl pt-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold uppercase tracking-wider">
                        <Sparkles className="w-3 h-3 fill-current" /> Conversion Engine v2.0
                    </div>
                    <h1 className="text-5xl font-extrabold tracking-tight text-zinc-900 leading-[1.1]">
                        What would you like to <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">rewrite today?</span>
                    </h1>
                    <p className="text-xl text-zinc-500 max-w-2xl leading-relaxed">
                        Enter your landing page URL. Our AI consultant will analyze your messaging logic and rewrite it for maximum conversion.
                    </p>
                </div>
            )}

            {/* Magical Input Section */}
            {!result && !isAnalyzing && (
                <div className="max-w-2xl relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
                    <Card className="relative bg-white border-zinc-200 shadow-2xl shadow-purple-900/5 overflow-hidden">
                        <CardContent className="p-2 flex items-center gap-2">
                            <div className="pl-4 pr-2">
                                <Terminal className="w-5 h-5 text-zinc-400" />
                            </div>
                            <input
                                placeholder="Paste your URL here (e.g., https://myapp.com)"
                                className="flex-1 h-14 bg-transparent border-none text-lg text-zinc-900 placeholder:text-zinc-400 focus:ring-0 focus:outline-none"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                            />
                            <Button
                                onClick={handleGenerate}
                                disabled={!url}
                                size="lg"
                                className="h-12 px-8 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl shadow-lg transition-all hover:scale-[1.02]"
                            >
                                Ignite <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </CardContent>
                    </Card>
                    {error && <p className="mt-4 text-red-500 font-medium flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {error}</p>}

                    <div className="mt-8 flex gap-8 text-sm text-zinc-400">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" /> Sentiment Analysis
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" /> Behavioral Psych
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" /> Conversion Logic
                        </div>
                    </div>
                </div>
            )}

            {/* Immersive Loading State */}
            {isAnalyzing && (
                <div className="max-w-2xl py-20 animate-in fade-in duration-500">
                    <div className="space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-12 h-12 border-4 border-zinc-100 rounded-full"></div>
                                <div className="w-12 h-12 border-4 border-purple-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-zinc-900">Analyzing Architecture...</h3>
                                <p className="text-zinc-500">Please wait while we deconstruct your copy.</p>
                            </div>
                        </div>

                        <div className="bg-zinc-950 rounded-xl p-6 font-mono text-sm shadow-2xl">
                            <div className="flex items-center gap-2 text-zinc-500 border-b border-zinc-800 pb-3 mb-3">
                                <Terminal className="w-4 h-4" /> root@conversion-engine:~/analysis
                            </div>
                            <div className="space-y-2">
                                <p className="text-green-500">✔ Connection established</p>
                                <p className="text-green-500">✔ Content scraped successfully</p>
                                <p className="text-zinc-300 flex items-center gap-2">
                                    <span className="animate-pulse text-purple-400">➜</span>
                                    {loadingSteps[loadingStep]}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Premium Results Interface */}
            {result && (
                <div id="copy-results-content" className="animate-in slide-in-from-bottom-10 duration-700 space-y-8 bg-white p-6 rounded-2xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-bold text-zinc-900">Analysis Complete</h2>
                            <p className="text-zinc-500">Here is your re-engineered messaging strategy.</p>
                        </div>
                        <Button onClick={() => setResult(null)} variant="outline" className="border-zinc-200 hover:bg-zinc-50">
                            Analyze New URL
                        </Button>
                    </div>

                    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                        <TabsList className="bg-zinc-100 p-1 rounded-xl mb-8 w-full md:w-auto h-auto grid grid-cols-1 md:inline-flex md:grid-cols-none">
                            <TabsTrigger value="diagnosis" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-red-600 text-zinc-500 font-medium transition-all">
                                <AlertTriangle className="w-4 h-4 mr-2" /> Current Diagnosis
                            </TabsTrigger>
                            <TabsTrigger value="creative" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-purple-600 text-zinc-500 font-medium transition-all">
                                <Sparkles className="w-4 h-4 mr-2" /> Creative Rewrites
                            </TabsTrigger>
                            <TabsTrigger value="strategy" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 text-zinc-500 font-medium transition-all">
                                <Target className="w-4 h-4 mr-2" /> Strategic CTAs
                            </TabsTrigger>
                        </TabsList>

                        <div className="relative min-h-[400px]">
                            {isTabLoading && (
                                <div className="absolute inset-0 z-10 bg-zinc-50/50 backdrop-blur-[2px] flex items-start justify-center pt-20 animate-in fade-in duration-200">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-10 h-10 border-4 border-purple-100 rounded-full border-t-purple-600 animate-spin shadow-lg"></div>
                                        <p className="text-sm font-medium text-purple-900 animate-pulse">Running analysis module...</p>
                                    </div>
                                </div>
                            )}

                            {/* DIAGNOSIS TAB */}
                            <TabsContent value="diagnosis" className={cn("space-y-6 duration-300", isTabLoading ? "opacity-0" : "animate-in slide-in-from-bottom-4 fade-in")}>
                                <Card className="bg-red-50/50 border-red-100 border-l-4 border-l-red-500 shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-red-700">
                                            Critical Issues Detected
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                                                    <span className="text-red-600 font-bold">1</span>
                                                </div>
                                                <span className="font-bold text-zinc-900 uppercase tracking-wide text-sm">Headline Logic</span>
                                            </div>
                                            <p className="text-zinc-700 leading-relaxed p-4 bg-white rounded-lg border border-red-100">
                                                "{result.diagnosis.headline_weakness}"
                                            </p>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                                                    <span className="text-red-600 font-bold">2</span>
                                                </div>
                                                <span className="font-bold text-zinc-900 uppercase tracking-wide text-sm">Call-to-Action</span>
                                            </div>
                                            <p className="text-zinc-700 leading-relaxed p-4 bg-white rounded-lg border border-red-100">
                                                "{result.diagnosis.cta_weakness}"
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* CREATIVE TAB */}
                            <TabsContent value="creative" className={cn("space-y-8 duration-300", isTabLoading ? "opacity-0" : "animate-in slide-in-from-bottom-4 fade-in")}>
                                {/* Headlines */}
                                <div className="grid gap-6">
                                    <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                                        <Zap className="w-5 h-5 text-yellow-500 fill-current" /> High-Converting Headlines
                                    </h3>
                                    {result.headlines.map((item: any, i: number) => (
                                        <div key={i} className="group relative bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm hover:shadow-xl hover:border-purple-200 transition-all duration-300">
                                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <CopyButton text={item.option} variant="secondary" className="bg-zinc-100 hover:bg-white" />
                                            </div>
                                            <div className="space-y-3 pr-10">
                                                <div className="inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-500 group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
                                                    {item.tag}
                                                </div>
                                                <h4 className="text-xl md:text-2xl font-bold text-zinc-900 leading-tight">
                                                    {item.option}
                                                </h4>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Subheads */}
                                <div className="grid gap-6 pt-6 border-t border-zinc-100">
                                    <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                                        <PenTool className="w-5 h-5 text-zinc-400" /> Supporting Sub-Headlines
                                    </h3>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {result.subheadlines.map((sub: string, i: number) => (
                                            <div key={i} className="p-5 bg-zinc-50 rounded-xl border border-zinc-100 flex items-start gap-4 group hover:bg-white hover:border-zinc-300 transition-all">
                                                <p className="text-zinc-700 leading-relaxed flex-1">{sub}</p>
                                                <CopyButton text={sub} variant="ghost" className="h-8 w-8 text-zinc-400 group-hover:text-zinc-900" />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Value Props - New Section */}
                                {result.value_props && (
                                    <div className="grid gap-6 pt-6 border-t border-zinc-100">
                                        <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                                            <Target className="w-5 h-5 text-zinc-400" /> Value Proposition Hooks
                                        </h3>
                                        <div className="grid gap-3">
                                            {result.value_props.map((prop: string, i: number) => (
                                                <div key={i} className="p-4 bg-purple-50/50 rounded-lg border border-purple-100 flex items-start gap-3 group hover:bg-purple-50 transition-colors">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 shrink-0" />
                                                    <p className="text-purple-900/80 font-medium leading-relaxed flex-1">{prop}</p>
                                                    <CopyButton text={prop} variant="ghost" className="h-6 w-6 text-purple-300 group-hover:text-purple-700" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </TabsContent>

                            {/* STRATEGY TAB */}
                            <TabsContent value="strategy" className={cn("space-y-8 duration-300", isTabLoading ? "opacity-0" : "animate-in slide-in-from-bottom-4 fade-in")}>
                                <div className="grid md:grid-cols-2 gap-8">
                                    <Card className="bg-white border-zinc-200 shadow-sm h-full">
                                        <CardHeader>
                                            <CardTitle className="text-lg text-zinc-900">Button Copy Architecture</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-8">
                                            <div>
                                                <span className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-3 block">Primary (High Friction)</span>
                                                <div className="flex flex-wrap gap-3">
                                                    {result.ctas.primary.map((cta: string, i: number) => (
                                                        <CopyButton2 key={i} text={cta} className="bg-purple-600 text-white hover:bg-purple-700 border-transparent shadow-md hover:scale-105 transition-transform" />
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-3 block">Secondary (Low Friction)</span>
                                                <div className="flex flex-wrap gap-3">
                                                    {result.ctas.secondary.map((cta: string, i: number) => (
                                                        <CopyButton2 key={i} text={cta} className="text-zinc-600 hover:text-zinc-900 bg-white border-zinc-200 hover:bg-zinc-50 shadow-sm" variant="outline" />
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100 text-sm text-yellow-800 flex items-start gap-3">
                                                <Lightbulb className="w-5 h-5 text-yellow-600 shrink-0" />
                                                <p>{result.ctas.explanation}</p>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100 shadow-sm h-full">
                                        <CardHeader>
                                            <CardTitle className="text-lg text-indigo-900">Placement Strategy</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div className="flex gap-4">
                                                <div className="bg-white p-2.5 rounded-xl h-fit border border-indigo-100 shadow-sm shrink-0">
                                                    <Target className="w-6 h-6 text-indigo-600" />
                                                </div>
                                                <p className="text-indigo-900/80 leading-relaxed font-medium">
                                                    {result.placement}
                                                </p>
                                            </div>
                                            <div className="pt-6 border-t border-indigo-100/50">
                                                <Button variant="outline" className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50 h-12" onClick={handleDownloadPDF}>
                                                    <Download className="w-4 h-4 mr-2" /> Download Full Strategy PDF
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            )}
        </div>
    );
}

function CopyButton({ text, variant = "ghost", className, showText = false }: { text: string, variant?: "ghost" | "secondary" | "outline", className?: string, showText?: boolean }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Button
            variant={variant}
            size={variant === "ghost" && !showText ? "icon" : "sm"}
            className={className}
            onClick={handleCopy}
        >
            {copied ? <CheckCircle className="w-4 h-4 text-emerald-500 animate-in zoom-in spin-in-180 duration-300" /> : <Copy className="w-4 h-4" />}
            {showText && <span className="ml-2">{copied ? "Copied" : "Copy"}</span>}
        </Button>
    )
}

function CopyButton2({ text, className, variant = "outline" }: { text: string, className?: string, variant?: "ghost" | "outline" }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <Button variant={variant} className={className} onClick={handleCopy}>
            {text} {copied ? <CheckCircle className="w-3 h-3 ml-2 text-emerald-500 animate-in zoom-in" /> : null}
        </Button>
    )
}
