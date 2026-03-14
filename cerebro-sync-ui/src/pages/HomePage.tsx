import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { TerminalText } from "@/components/ui/terminal-text"
import { motion } from "framer-motion"
import { Radio, Zap } from "lucide-react"

export function HomePage() {
    return (
        <div className="w-full max-w-2xl flex flex-col items-center justify-center min-h-[80vh] gap-10">

            {/* Logo Block */}
            <motion.div
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9 }}
                className="text-center space-y-4"
            >
                <div className="flex items-center justify-center gap-4 mb-2">
                    <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#ff003c]" />
                    <TerminalText className="text-[10px] text-[#ff003c]/60 tracking-[0.4em]">CLASSIFIED SYSTEM</TerminalText>
                    <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#ff003c]" />
                </div>

                <h1
                    className="text-5xl md:text-7xl font-['Press_Start_2P'] text-[#ff003c] leading-tight"
                    style={{ textShadow: "0 0 20px #ff003c, 0 0 40px rgba(255,0,60,0.5)" }}
                >
                    CEREBRO
                </h1>

                <div>
                    <TerminalText color="green" glow className="text-sm md:text-base tracking-[0.35em] block">
                        CODE RED SYNCHRONIZER
                    </TerminalText>
                    <div className="flex items-center justify-center gap-2 mt-3">
                        <span className="w-2 h-2 rounded-full bg-[#00ff9f] animate-pulse" />
                        <TerminalText className="text-xs text-white/40 tracking-widest">TERMINAL ONLINE</TerminalText>
                        <span className="w-2 h-2 rounded-full bg-[#00ff9f] animate-pulse" />
                    </div>
                </div>
            </motion.div>

            {/* Divider */}
            <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
            />

            {/* Action Buttons */}
            <div className="flex flex-col gap-5 w-full max-w-sm">
                <motion.div
                    initial={{ opacity: 0, x: -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.7, delay: 0.6 }}
                    whileHover={{ scale: 1.02 }}
                >
                    <Link to="/broadcaster">
                        <Button
                            variant="neon-amber"
                            size="lg"
                            className="w-full h-16 text-base gap-3"
                        >
                            <Radio className="w-5 h-5" />
                            START BROADCAST
                        </Button>
                    </Link>
                    <p className="text-center text-white/30 text-xs font-rajdhani mt-2 tracking-wider">
                        Create a session and get a room code
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.7, delay: 0.75 }}
                    whileHover={{ scale: 1.02 }}
                >
                    <Link to="/join">
                        <Button
                            variant="neon-green"
                            size="lg"
                            className="w-full h-16 text-base gap-3"
                        >
                            <Zap className="w-5 h-5" />
                            JOIN BROADCAST
                        </Button>
                    </Link>
                    <p className="text-center text-white/30 text-xs font-rajdhani mt-2 tracking-wider">
                        Enter a room code to tune in
                    </p>
                </motion.div>
            </div>

            {/* Footer link */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
            >
                <Link to="/debug">
                    <TerminalText className="text-[10px] text-white/25 hover:text-white/50 transition-colors cursor-pointer tracking-[0.3em]">
                        [ DIAGNOSTICS ]
                    </TerminalText>
                </Link>
            </motion.div>
        </div>
    )
}
