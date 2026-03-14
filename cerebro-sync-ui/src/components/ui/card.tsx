import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "neon" }
>(({ className, variant = "default", ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "rounded-lg border bg-card text-card-foreground shadow-sm",
            variant === "neon" && "border-[var(--color-cyber-green)] shadow-[0_0_15px_var(--color-cyber-green)] bg-black/50 backdrop-blur-sm",
            className
        )}
        {...props}
    />
))
Card.displayName = "Card"

export { Card }
