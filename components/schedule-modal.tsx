"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

interface ScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ScheduleModal({ isOpen, onClose }: ScheduleModalProps) {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            document.addEventListener("keydown", handleEsc);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handleEsc);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Use createPortal to render at document root to avoid z-index issues
    if (typeof document === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-4xl h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 scale-100">
                {/* Header */}
                <div className="flex items-center justify-between p-4 px-6 border-b border-zinc-100 bg-white z-10">
                    <div>
                        <h2 className="text-xl font-bold text-zinc-900">Schedule Live Audit</h2>
                        <p className="text-sm text-zinc-500">Book a 30-min call with our conversion engineers.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-zinc-100 text-zinc-500 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Calendar Iframe */}
                <div className="flex-1 bg-zinc-50 relative">
                    <iframe
                        src="https://calendly.com/srinithinoffl/schedule-live-audit"
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        title="Schedule Live Audit"
                        className="w-full h-full"
                    ></iframe>
                </div>
            </div>
        </div>,
        document.body
    );
}
