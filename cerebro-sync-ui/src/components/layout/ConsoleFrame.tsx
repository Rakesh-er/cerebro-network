import * as React from "react"
import { cn } from "@/lib/utils"

interface ConsoleFrameProps extends React.HTMLAttributes<HTMLDivElement> {
    scanlines?: boolean;
}

export function ConsoleFrame({ className, children, scanlines = true, ...props }: ConsoleFrameProps) {
    return (
        <div
            className={cn(
                "min-h-screen bg-[#050505] text-white overflow-hidden relative",
                className
            )}
            {...props}
        >
            {/* Vignette */}
            <div className="pointer-events-none fixed inset-0 z-50" style={{ boxShadow: "inset 0 0 150px rgba(0,0,0,0.9)" }} />

            {/* Scanlines */}
            {scanlines && (
                <div
                    className="pointer-events-none fixed inset-0 z-40 scanlines opacity-100"
                />
            )}

            {/* Flicker */}
            {scanlines && (
                <div className="pointer-events-none fixed inset-0 z-30 bg-white/[0.02] animate-flicker mix-blend-overlay" />
            )}

            {/* Ambient red glow at bottom */}
            <div className="pointer-events-none fixed bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-[#ff003c]/5 blur-[80px] z-0" />

            <main className="relative z-10 min-h-screen w-full flex flex-col items-center p-4 md:p-8">
                {children}
            </main>
        </div>
    )
}
