"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

export const LOGO_SRC = "/generated-image%20(2).png";

type LogoProps = {
    size?: number;
    showText?: boolean;
    className?: string;
    textClassName?: string;
    priority?: boolean;
};

export function Logo({
    size = 36,
    showText = true,
    className,
    textClassName,
    priority = false,
}: LogoProps) {
    return (
        <span className={cn("inline-flex items-center gap-3", className)}>
            <Image
                src={LOGO_SRC}
                width={size}
                height={size}
                alt="Conversion Engineering Lab"
                priority={priority}
                className="rounded-xl object-cover"
            />
            {showText && (
                <span className={cn("font-semibold tracking-tight text-zinc-900", textClassName)}>
                    Conversion Engineering Lab
                </span>
            )}
        </span>
    );
}
