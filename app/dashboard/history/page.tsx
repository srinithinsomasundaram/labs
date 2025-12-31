"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Search, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function HistoryPage() {
    const router = useRouter();
    const [audits, setAudits] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await axios.get("/api/audit/history");
                setAudits(response.data.audits);
            } catch (error) {
                console.error("Failed to fetch history:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const handleViewReport = (audit: any) => {
        router.push(`/dashboard/report?id=${audit.id}`);
    };

    return (
        <div className="space-y-6 max-w-4xl animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-zinc-900">Audit History</h1>
                <p className="text-zinc-500">View and download your past conversion reports.</p>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-zinc-900 animate-spin" />
                </div>
            ) : (
                <div className="grid gap-4">
                    {audits.length === 0 ? (
                        <Card className="bg-white border-zinc-200 p-12 text-center text-zinc-500 shadow-sm border-dashed">
                            <div className="mx-auto w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                                <Search className="w-6 h-6 text-zinc-400" />
                            </div>
                            <p className="font-medium text-zinc-900">No audits found.</p>
                            <p className="text-sm text-zinc-400 mb-6">Run your first landing page analysis to see it here.</p>
                            <Button className="bg-zinc-900 text-white hover:bg-zinc-800" onClick={() => router.push("/dashboard")}>Run First Audit</Button>
                        </Card>
                    ) : (
                        audits.map((audit: any, i: number) => (
                            <Card key={i} className="bg-white border-zinc-200 shadow-sm hover:shadow-md hover:border-zinc-300 transition-all cursor-pointer" onClick={() => handleViewReport(audit)}>
                                <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2.5 h-2.5 rounded-full ${(audit.conversion_score || 0) > 8 ? 'bg-emerald-500' : (audit.conversion_score || 0) > 5 ? 'bg-amber-500' : 'bg-red-500'}`} />
                                            <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                                                {audit.website_url || "Untitled Audit"}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-zinc-500 pl-5">
                                            <span className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {new Date(audit.created_at || Date.now()).toLocaleDateString()}
                                            </span>
                                            <span className="text-zinc-300">|</span>
                                            <span className={`font-medium ${(audit.conversion_score || 0) > 8 ? 'text-emerald-600' : (audit.conversion_score || 0) > 5 ? 'text-amber-600' : 'text-red-600'}`}>Score: {audit.conversion_score || 'N/A'}/10</span>
                                            <span className="text-zinc-300">|</span>
                                            <span className="uppercase text-[10px] font-bold tracking-wider text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded">{audit.is_paid ? 'Paid • $3.00' : 'Free Preview'}</span>
                                        </div>
                                    </div>
                                    <Button variant="ghost" className="text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 self-start md:self-center bg-zinc-50 border border-zinc-100">
                                        View Report <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
