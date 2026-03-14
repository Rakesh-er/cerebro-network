import * as React from "react"
import { cn } from "@/lib/utils"

export interface RetroPanelProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string;
    variant?: "red" | "green" | "amber" | "dark";
    noPadding?: boolean;
}

export const RetroPanel = React.forwardRef<HTMLDivElement, RetroPanelProps>(
    ({ className, title, variant = "dark", noPadding = false, children, ...props }, ref) => {

        const variantBorder = {
            dark: "border-white/20",
            red: "border-[#ff003c] shadow-[0_0_15px_rgba(255,0,60,0.2),inset_0_0_30px_rgba(255,0,60,0.05)]",
            green: "border-[#00ff9f] shadow-[0_0_15px_rgba(0,255,159,0.2),inset_0_0_30px_rgba(0,255,159,0.05)]",
            amber: "border-[#ffae00] shadow-[0_0_15px_rgba(255,174,0,0.2),inset_0_0_30px_rgba(255,174,0,0.05)]",
        }

        const titleColor = {
            dark: "text-white/60",
            red: "text-[#ff003c]",
            green: "text-[#00ff9f]",
            amber: "text-[#ffae00]",
        }

        const titleBorder = {
            dark: "border-white/10",
            red: "border-[#ff003c]/40",
            green: "border-[#00ff9f]/40",
            amber: "border-[#ffae00]/40",
        }

        return (
            <div
                ref={ref}
                className={cn(
                    "relative rounded-sm overflow-hidden border-2 bg-black/60 backdrop-blur-sm",
                    variantBorder[variant],
                    className
                )}
                {...props}
            >
                {/* Retro grid background */}
                <div className="absolute inset-0 retro-grid opacity-100 pointer-events-none" />

                {title && (
                    <div className={cn("relative z-10 border-b px-4 py-2 bg-black/50 flex items-center justify-between", titleBorder[variant])}>
                        <span className={cn("font-orbitron uppercase tracking-[0.2em] text-xs font-bold", titleColor[variant])}>
                            {title}
                        </span>
                        <div className="flex gap-2">
                            <div className={cn("w-2 h-2 rounded-full border opacity-60", titleBorder[variant])} />
                            <div className={cn("w-2 h-2 rounded-full border opacity-40", titleBorder[variant])} />
                        </div>
                    </div>
                )}

                {/* Only apply inner padding when noPadding is false */}
                <div className={cn("relative z-10", !noPadding && "p-4")}>
                    {children}
                </div>
            </div>
        )
    }
)
RetroPanel.displayName = "RetroPanel"
