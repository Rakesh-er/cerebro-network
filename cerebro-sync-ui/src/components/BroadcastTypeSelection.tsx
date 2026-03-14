import * as React from "react"
import { motion } from "framer-motion"
import { Mic, Video, ChevronRight } from "lucide-react"
import { TerminalText } from "@/components/ui/terminal-text"
import { cn } from "@/lib/utils"

export type BroadcastType = 'audio' | 'video'

interface BroadcastTypeSelectionProps {
    onSelect: (type: BroadcastType) => void
}

export function BroadcastTypeSelection({ onSelect }: BroadcastTypeSelectionProps) {
    const [hoveredType, setHoveredType] = React.useState<BroadcastType | null>(null)

    return (
        <motion.div
            className="fixed inset-0 flex items-center justify-center p-4 z-50"
            style={{
                background: "linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(20,20,40,0.95) 100%)",
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
                className="max-w-2xl w-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                    duration: 0.6,
                    staggerChildren: 0.15,
                    delayChildren: 0.2,
                }}
            >
                {/* Title */}
                <motion.div
                    className="text-center mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#ff003c]" />
                        <TerminalText className="text-xs text-[#ff003c]/60 tracking-[0.4em]">
                            INITIALIZATION
                        </TerminalText>
                        <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#ff003c]" />
                    </div>

                    <h2 className="text-3xl md:text-4xl font-orbitron font-bold text-white mb-3 tracking-wider">
                        SELECT BROADCAST MODE
                    </h2>

                    <TerminalText className="text-sm text-white/50 tracking-wide">
                        Choose the type of broadcast to initialize
                    </TerminalText>
                </motion.div>

                {/* Selection Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    {/* Audio Card */}
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelect('audio')}
                        onHoverStart={() => setHoveredType('audio')}
                        onHoverEnd={() => setHoveredType(null)}
                        className="relative h-48 md:h-56 focus:outline-none focus:ring-2 focus:ring-[#ff003c] rounded-lg overflow-hidden group"
                    >
                        {/* Background */}
                        <div
                            className={cn(
                                "absolute inset-0 transition-all duration-300",
                                hoveredType === 'audio'
                                    ? "bg-gradient-to-br from-[#ff003c]/20 to-[#ff003c]/5"
                                    : "bg-gradient-to-br from-[#ff003c]/10 to-[#ff003c]/0"
                            )}
                        />

                        {/* Border */}
                        <div
                            className={cn(
                                "absolute inset-0 rounded-lg pointer-events-none transition-all duration-300",
                                hoveredType === 'audio'
                                    ? "border-2 border-[#ff003c] shadow-lg shadow-[#ff003c]/30"
                                    : "border border-[#ff003c]/30"
                            )}
                        />

                        {/* Content */}
                        <div className="relative h-full flex flex-col items-center justify-center gap-4 p-6">
                            <motion.div
                                animate={hoveredType === 'audio' ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Mic
                                    className={cn(
                                        "w-16 h-16 transition-all duration-300",
                                        hoveredType === 'audio'
                                            ? "text-[#ff003c] drop-shadow-[0_0_12px_#ff003c]"
                                            : "text-[#ff003c]/60"
                                    )}
                                    style={{
                                        filter: hoveredType === 'audio'
                                            ? "drop-shadow(0 0 12px #ff003c)"
                                            : "drop-shadow(0 0 4px #ff003c)"
                                    }}
                                />
                            </motion.div>

                            <div className="text-center">
                                <h3 className="text-xl md:text-2xl font-orbitron font-bold text-white mb-1 tracking-wider">
                                    AUDIO BROADCAST
                                </h3>
                                <p className="text-sm text-white/50 font-rajdhani">
                                    Voice-only transmission
                                </p>
                            </div>

                            <motion.div
                                animate={hoveredType === 'audio' ? { x: 4, opacity: 1 } : { x: -2, opacity: 0.5 }}
                                transition={{ duration: 0.3 }}
                            >
                                <ChevronRight className="w-5 h-5 text-[#ff003c]" />
                            </motion.div>
                        </div>
                    </motion.button>

                    {/* Video Card */}
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelect('video')}
                        onHoverStart={() => setHoveredType('video')}
                        onHoverEnd={() => setHoveredType(null)}
                        className="relative h-48 md:h-56 focus:outline-none focus:ring-2 focus:ring-[#00ff9f] rounded-lg overflow-hidden group"
                    >
                        {/* Background */}
                        <div
                            className={cn(
                                "absolute inset-0 transition-all duration-300",
                                hoveredType === 'video'
                                    ? "bg-gradient-to-br from-[#00ff9f]/20 to-[#00ff9f]/5"
                                    : "bg-gradient-to-br from-[#00ff9f]/10 to-[#00ff9f]/0"
                            )}
                        />

                        {/* Border */}
                        <div
                            className={cn(
                                "absolute inset-0 rounded-lg pointer-events-none transition-all duration-300",
                                hoveredType === 'video'
                                    ? "border-2 border-[#00ff9f] shadow-lg shadow-[#00ff9f]/30"
                                    : "border border-[#00ff9f]/30"
                            )}
                        />

                        {/* Content */}
                        <div className="relative h-full flex flex-col items-center justify-center gap-4 p-6">
                            <motion.div
                                animate={hoveredType === 'video' ? { scale: 1.1, rotate: -5 } : { scale: 1, rotate: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Video
                                    className={cn(
                                        "w-16 h-16 transition-all duration-300",
                                        hoveredType === 'video'
                                            ? "text-[#00ff9f] drop-shadow-[0_0_12px_#00ff9f]"
                                            : "text-[#00ff9f]/60"
                                    )}
                                    style={{
                                        filter: hoveredType === 'video'
                                            ? "drop-shadow(0 0 12px #00ff9f)"
                                            : "drop-shadow(0 0 4px #00ff9f)"
                                    }}
                                />
                            </motion.div>

                            <div className="text-center">
                                <h3 className="text-xl md:text-2xl font-orbitron font-bold text-white mb-1 tracking-wider">
                                    VIDEO BROADCAST
                                </h3>
                                <p className="text-sm text-white/50 font-rajdhani">
                                    Video and audio transmission
                                </p>
                            </div>

                            <motion.div
                                animate={hoveredType === 'video' ? { x: 4, opacity: 1 } : { x: -2, opacity: 0.5 }}
                                transition={{ duration: 0.3 }}
                            >
                                <ChevronRight className="w-5 h-5 text-[#00ff9f]" />
                            </motion.div>
                        </div>
                    </motion.button>
                </div>

                {/* Footer Help Text */}
                <motion.div
                    className="mt-10 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <TerminalText className="text-xs text-white/30 tracking-widest">
                        SELECT MODE TO INITIALIZE SESSION
                    </TerminalText>
                </motion.div>
            </motion.div>
        </motion.div>
    )
}
