import { motion } from "framer-motion"
import { AlertCircle } from "lucide-react"
import { TerminalText } from "@/components/ui/terminal-text"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"

interface InvalidSessionTypeAlertProps {
    sessionType: 'audio' | 'video'
    selectedType: 'audio' | 'video'
    onDismiss?: () => void
}

export function InvalidSessionTypeAlert({
    sessionType,
    selectedType,
    onDismiss,
}: InvalidSessionTypeAlertProps) {
    const getMessageText = () => {
        if (sessionType === 'audio' && selectedType === 'video') {
            return {
                title: "INVALID SESSION TYPE",
                message: "This session is an AUDIO broadcast. You cannot join with VIDEO mode.",
                hint: "Please return and join as an AUDIO listener."
            }
        } else if (sessionType === 'video' && selectedType === 'audio') {
            return {
                title: "INVALID SESSION TYPE",
                message: "This session is a VIDEO broadcast. You cannot join with AUDIO mode.",
                hint: "Please return and join as a VIDEO listener."
            }
        }
        return {
            title: "SESSION MISMATCH",
            message: "Your broadcast type does not match this session.",
            hint: "Please return and select the correct broadcast type."
        }
    }

    const { title, message, hint } = getMessageText()

    return (
        <motion.div
            className="fixed inset-0 flex items-center justify-center p-4 z-50"
            style={{
                background: "linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(40,0,0,0.95) 100%)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            {/* Animated background grid */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="w-full h-full" style={{
                    backgroundImage: "linear-gradient(0deg, transparent 24%, rgba(255,0,60,0.08) 25%, rgba(255,0,60,0.08) 26%, transparent 27%, transparent 74%, rgba(255,0,60,0.08) 75%, rgba(255,0,60,0.08) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255,0,60,0.08) 25%, rgba(255,0,60,0.08) 26%, transparent 27%, transparent 74%, rgba(255,0,60,0.08) 75%, rgba(255,0,60,0.08) 76%, transparent 77%, transparent)",
                    backgroundSize: "50px 50px",
                }} />
            </div>

            <motion.div
                className="max-w-md w-full"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
            >
                {/* Alert Box */}
                <div className="relative border-2 border-[#ff003c] bg-black/80 rounded-lg overflow-hidden shadow-2xl shadow-[#ff003c]/20">
                    {/* Top glow line */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ff003c]/0 via-[#ff003c] to-[#ff003c]/0" />

                    {/* Content */}
                    <div className="p-8 space-y-6">
                        {/* Icon */}
                        <motion.div
                            className="flex justify-center"
                            animate={{ rotate: [0, -5, 5, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <div className="relative">
                                <AlertCircle
                                    className="w-16 h-16 text-[#ff003c]"
                                    style={{ filter: "drop-shadow(0 0 12px #ff003c)" }}
                                />
                            </div>
                        </motion.div>

                        {/* Title */}
                        <div className="text-center">
                            <h2 className="text-2xl md:text-3xl font-orbitron font-bold text-white mb-3 tracking-wider">
                                {title}
                            </h2>
                        </div>

                        {/* Message */}
                        <div className="text-center space-y-3">
                            <TerminalText className="text-sm text-[#ff003c]">
                                ⚠ {message}
                            </TerminalText>
                            <TerminalText className="text-xs text-white/50">
                                {hint}
                            </TerminalText>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-gradient-to-r from-[#ff003c]/0 via-[#ff003c]/30 to-[#ff003c]/0" />

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <Link to="/" className="flex-1">
                                <Button
                                    variant="neon-red"
                                    size="lg"
                                    className="w-full"
                                    onClick={onDismiss}
                                >
                                    RETURN HOME
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Bottom glow line */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ff003c]/0 via-[#ff003c] to-[#ff003c]/0" />
                </div>

                {/* Help text */}
                <motion.p
                    className="text-center text-[10px] text-white/30 mt-6 tracking-widest font-rajdhani"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    SESSION VALIDATION ERROR
                </motion.p>
            </motion.div>
        </motion.div>
    )
}
