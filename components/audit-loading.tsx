"use client";

import { Zap } from "lucide-react";

interface AuditLoadingProps {
    title?: string;
    subtitle?: string;
    progress?: number;
    className?: string;
}

export function AuditLoading({
    title = "Analyzing website...",
    subtitle = "Identifying conversion opportunities...",
    progress,
    className = ""
}: AuditLoadingProps) {
    return (
        <div className={`flex items-center justify-center w-full min-h-[40vh] p-4 ${className}`}>
            <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="relative w-24 h-24 mx-auto">
                    <div className="absolute inset-0 border-4 border-zinc-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Zap className="w-8 h-8 text-purple-600 fill-current animate-pulse" />
                    </div>
                </div>

                <div className="space-y-3">
                    <h2 className="text-2xl font-bold text-zinc-900">{title}</h2>
                    <p className="text-zinc-500 font-medium">{subtitle}</p>
                </div>

                {progress !== undefined && (
                    <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-purple-600 transition-all duration-300 ease-out"
                            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
