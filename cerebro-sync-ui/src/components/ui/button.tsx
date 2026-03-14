import * as React from "react"
import { cn } from "@/lib/utils"
import { Slot } from "@radix-ui/react-slot"

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    asChild?: boolean
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "neon-red" | "neon-green" | "neon-amber"
    size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"

        const base = "inline-flex items-center justify-center whitespace-nowrap rounded-sm text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 uppercase tracking-widest font-orbitron"

        const variants: Record<string, string> = {
            default: "bg-[#ff003c] text-white hover:bg-[#ff003c]/90",
            destructive: "bg-red-700 text-white hover:bg-red-700/90",
            outline: "border-2 border-white/20 bg-transparent text-white hover:bg-white/10",
            secondary: "bg-[#00ff9f] text-black hover:bg-[#00ff9f]/90",
            ghost: "hover:bg-white/10 text-white",
            link: "text-[#ff003c] underline-offset-4 hover:underline",
            "neon-red": "border-2 border-[#ff003c] text-[#ff003c] bg-transparent hover:bg-[#ff003c] hover:text-black shadow-[0_0_10px_#ff003c] hover:shadow-[0_0_25px_#ff003c] transition-all duration-300",
            "neon-green": "border-2 border-[#00ff9f] text-[#00ff9f] bg-transparent hover:bg-[#00ff9f] hover:text-black shadow-[0_0_10px_#00ff9f] hover:shadow-[0_0_25px_#00ff9f] transition-all duration-300",
            "neon-amber": "border-2 border-[#ffae00] text-[#ffae00] bg-transparent hover:bg-[#ffae00] hover:text-black shadow-[0_0_10px_#ffae00] hover:shadow-[0_0_25px_#ffae00] transition-all duration-300",
            // Keep 'neon' as alias for 'neon-red'
            neon: "border-2 border-[#ff003c] text-[#ff003c] bg-transparent hover:bg-[#ff003c] hover:text-black shadow-[0_0_10px_#ff003c] hover:shadow-[0_0_25px_#ff003c] transition-all duration-300",
        }

        const sizes: Record<string, string> = {
            default: "h-10 px-4 py-2",
            sm: "h-9 rounded-md px-3",
            lg: "h-11 rounded-md px-8",
            icon: "h-10 w-10",
        }

        return (
            <Comp
                className={cn(base, variants[variant] ?? variants.default, sizes[size], className)}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button }
