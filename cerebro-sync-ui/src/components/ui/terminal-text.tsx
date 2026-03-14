import * as React from "react"
import { cn } from "@/lib/utils"

export interface TerminalTextProps extends React.HTMLAttributes<HTMLSpanElement> {
    glow?: boolean;
    color?: "green" | "red" | "amber" | "white";
}

export const TerminalText = React.forwardRef<HTMLSpanElement, TerminalTextProps>(
    ({ className, glow = false, color = "white", ...props }, ref) => {
        const colorClasses = {
            green: glow ? "text-[#00ff9f] drop-shadow-[0_0_8px_#00ff9f]" : "text-[#00ff9f]",
            red: glow ? "text-[#ff003c] drop-shadow-[0_0_8px_#ff003c]" : "text-[#ff003c]",
            amber: glow ? "text-[#ffae00] drop-shadow-[0_0_8px_#ffae00]" : "text-[#ffae00]",
            white: "text-white/80",
        }

        return (
            <span
                ref={ref}
                className={cn(
                    "font-orbitron uppercase tracking-widest text-sm",
                    colorClasses[color],
                    className
                )}
                {...props}
            />
        )
    }
)
TerminalText.displayName = "TerminalText"
