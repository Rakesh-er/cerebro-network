import * as React from "react"
import { motion } from "framer-motion"
import { AlertTriangle } from "lucide-react"
import { TerminalText } from "@/components/ui/terminal-text"
import { useUIStore } from "@/store/uiStore"
import { useNavigate } from "react-router-dom"

export function SessionTerminationAlert() {
    const { sessionTerminated, terminationMessage } = useUIStore()
    const navigate = useNavigate()

    React.useEffect(() => {
        if (sessionTerminated) {
            const timer = setTimeout(() => {
                navigate("/")
            }, 4000)
            return () => clearTimeout(timer)
        }
    }, [sessionTerminated, navigate])

    if (!sessionTerminated) return null

    return (
        <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className="max-w-md text-center"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: "spring", damping: 20 }}
            >
                {/* Icon */}
                <motion.div
                    animate={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                    className="flex justify-center mb-4"
                >
                    <AlertTriangle className="w-12 h-12 text-[#ff003c]" style={{ filter: "drop-shadow(0 0 12px #ff003c)" }} />
                </motion.div>

                {/* Title */}
                <h2 className="text-2xl md:text-3xl font-orbitron font-bold text-white mb-3 tracking-wider">
                    SESSION ENDED
                </h2>

                {/* Message */}
                <TerminalText className="text-sm text-white/70 mb-6 block">
                    {terminationMessage || "The broadcast session has been terminated by the host."}
                </TerminalText>

                {/* Status */}
                <TerminalText className="text-xs text-[#ff003c] uppercase tracking-widest">
                    Redirecting in 4 seconds...
                </TerminalText>

                {/* Progress bar */}
                <motion.div
                    className="mt-4 h-1 bg-gradient-to-r from-[#ff003c] to-[#ff003c]/30 rounded-full overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <motion.div
                        className="h-full bg-[#ff003c]"
                        animate={{ x: ["0%", "100%"] }}
                        transition={{ duration: 4, ease: "linear" }}
                    />
                </motion.div>
            </motion.div>
        </motion.div>
    )
}
