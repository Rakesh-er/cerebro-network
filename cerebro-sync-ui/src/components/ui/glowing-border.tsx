import * as React from "react"
import { cn } from "@/lib/utils"

export interface GlowingBorderProps extends React.HTMLAttributes<HTMLDivElement> {
    color?: "red" | "green" | "amber"
}

export const GlowingBorder = React.forwardRef<HTMLDivElement, GlowingBorderProps>(
    ({ className, color = "amber", children, ...props }, ref) => {

        const colorClasses = {
            red: "border-[#ff003c] shadow-[0_0_15px_#ff003c]",
            green: "border-[#00ff9f] shadow-[0_0_15px_#00ff9f]",
            amber: "border-[#ffae00] shadow-[0_0_15px_#ffae00]",
        }

        return (
            <div
                ref={ref}
                className={cn(
                    "rounded-sm border-2 p-1",
                    colorClasses[color],
                    className
                )}
                {...props}
            >
                {children}
            </div>
        )
    }
)
GlowingBorder.displayName = "GlowingBorder"
