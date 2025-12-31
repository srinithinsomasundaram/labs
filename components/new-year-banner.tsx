"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";

export function NewYearBanner() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const dismissed = localStorage.getItem("new-year-banner-2026-dismissed");
        if (!dismissed) {
            setIsVisible(true);
        }
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem("new-year-banner-2026-dismissed", "true");
    };

    if (!isVisible) return null;

    return (
        <div className="relative isolate flex items-center gap-x-6 overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 px-6 py-2.5 sm:px-3.5 sm:before:flex-1">
            <div className="flex flex-1 items-center justify-center text-center">
                <p className="text-sm leading-6 text-white flex items-center gap-x-2 whitespace-nowrap overflow-hidden">
                    <PartyPopper className="w-4 h-4 animate-bounce shrink-0" />
                    <strong className="font-bold text-xs sm:text-base">Happy 2026! 🚀✨</strong>
                    <span className="opacity-40 shrink-0">|</span>
                    <span className="text-[10px] sm:text-sm font-medium">
                        <span className="sm:hidden">10x your conversions this year!</span>
                        <span className="hidden sm:inline">2026 is your year for 10x conversions!</span>
                    </span>
                    <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse shrink-0" />
                </p>
            </div>
            <div className="flex flex-1 justify-end">
                <button
                    type="button"
                    onClick={handleDismiss}
                    className="-m-3 p-3 focus-visible:outline-offset-[-4px] text-white/80 hover:text-white"
                >
                    <span className="sr-only">Dismiss</span>
                    <X className="h-5 w-5" aria-hidden="true" />
                </button>
            </div>
        </div>
    );
}
