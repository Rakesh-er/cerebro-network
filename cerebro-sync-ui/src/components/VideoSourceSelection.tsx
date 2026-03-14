import * as React from "react"
import { motion } from "framer-motion"
import { Upload, Camera, ChevronRight } from "lucide-react"
import { TerminalText } from "@/components/ui/terminal-text"
import { cn } from "@/lib/utils"

export type VideoSourceType = 'file' | 'camera'

interface VideoSourceSelectionProps {
    onSelect: (source: VideoSourceType, file?: File) => void
}

export function VideoSourceSelection({ onSelect }: VideoSourceSelectionProps) {
    const [hoveredSource, setHoveredSource] = React.useState<VideoSourceType | null>(null)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file && file.type.startsWith('video/')) {
            onSelect('file', file)
        } else if (file) {
            alert('Please select a valid video file')
        }
        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

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
                    backgroundImage: "linear-gradient(0deg, transparent 24%, rgba(0,255,159,0.08) 25%, rgba(0,255,159,0.08) 26%, transparent 27%, transparent 74%, rgba(0,255,159,0.08) 75%, rgba(0,255,159,0.08) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(0,255,159,0.08) 25%, rgba(0,255,159,0.08) 26%, transparent 27%, transparent 74%, rgba(0,255,159,0.08) 75%, rgba(0,255,159,0.08) 76%, transparent 77%, transparent)",
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
                        <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#00ff9f]" />
                        <TerminalText className="text-xs text-[#00ff9f]/60 tracking-[0.4em]">
                            VIDEO SOURCE
                        </TerminalText>
                        <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#00ff9f]" />
                    </div>

                    <h2 className="text-3xl md:text-4xl font-orbitron font-bold text-white mb-3 tracking-wider">
                        SELECT VIDEO SOURCE
                    </h2>

                    <TerminalText className="text-sm text-white/50 tracking-wide">
                        Choose where to stream video from
                    </TerminalText>
                </motion.div>

                {/* Selection Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    {/* Camera Card */}
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelect('camera')}
                        onHoverStart={() => setHoveredSource('camera')}
                        onHoverEnd={() => setHoveredSource(null)}
                        className="relative h-48 md:h-56 focus:outline-none focus:ring-2 focus:ring-[#00ff9f] rounded-lg overflow-hidden group"
                    >
                        {/* Background */}
                        <div
                            className={cn(
                                "absolute inset-0 transition-all duration-300",
                                hoveredSource === 'camera'
                                    ? "bg-gradient-to-br from-[#00ff9f]/20 to-[#00ff9f]/5"
                                    : "bg-gradient-to-br from-[#00ff9f]/10 to-[#00ff9f]/0"
                            )}
                        />

                        {/* Border */}
                        <div
                            className={cn(
                                "absolute inset-0 rounded-lg pointer-events-none transition-all duration-300",
                                hoveredSource === 'camera'
                                    ? "border-2 border-[#00ff9f] shadow-lg shadow-[#00ff9f]/30"
                                    : "border border-[#00ff9f]/30"
                            )}
                        />

                        {/* Content */}
                        <div className="relative h-full flex flex-col items-center justify-center gap-4 p-6">
                            <motion.div
                                animate={hoveredSource === 'camera' ? { scale: 1.1, rotate: -5 } : { scale: 1, rotate: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Camera
                                    className={cn(
                                        "w-16 h-16 transition-all duration-300",
                                        hoveredSource === 'camera'
                                            ? "text-[#00ff9f] drop-shadow-[0_0_12px_#00ff9f]"
                                            : "text-[#00ff9f]/60"
                                    )}
                                    style={{
                                        filter: hoveredSource === 'camera'
                                            ? "drop-shadow(0 0 12px #00ff9f)"
                                            : "drop-shadow(0 0 4px #00ff9f)"
                                    }}
                                />
                            </motion.div>

                            <div className="text-center">
                                <h3 className="text-xl md:text-2xl font-orbitron font-bold text-white mb-1 tracking-wider">
                                    USE CAMERA
                                </h3>
                                <p className="text-sm text-white/50 font-rajdhani">
                                    Live camera feed
                                </p>
                            </div>

                            <motion.div
                                animate={hoveredSource === 'camera' ? { x: 4, opacity: 1 } : { x: -2, opacity: 0.5 }}
                                transition={{ duration: 0.3 }}
                            >
                                <ChevronRight className="w-5 h-5 text-[#00ff9f]" />
                            </motion.div>
                        </div>
                    </motion.button>

                    {/* Upload File Card */}
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => fileInputRef.current?.click()}
                        onHoverStart={() => setHoveredSource('file')}
                        onHoverEnd={() => setHoveredSource(null)}
                        className="relative h-48 md:h-56 focus:outline-none focus:ring-2 focus:ring-[#ffae00] rounded-lg overflow-hidden group"
                    >
                        {/* Background */}
                        <div
                            className={cn(
                                "absolute inset-0 transition-all duration-300",
                                hoveredSource === 'file'
                                    ? "bg-gradient-to-br from-[#ffae00]/20 to-[#ffae00]/5"
                                    : "bg-gradient-to-br from-[#ffae00]/10 to-[#ffae00]/0"
                            )}
                        />

                        {/* Border */}
                        <div
                            className={cn(
                                "absolute inset-0 rounded-lg pointer-events-none transition-all duration-300",
                                hoveredSource === 'file'
                                    ? "border-2 border-[#ffae00] shadow-lg shadow-[#ffae00]/30"
                                    : "border border-[#ffae00]/30"
                            )}
                        />

                        {/* Content */}
                        <div className="relative h-full flex flex-col items-center justify-center gap-4 p-6">
                            <motion.div
                                animate={hoveredSource === 'file' ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Upload
                                    className={cn(
                                        "w-16 h-16 transition-all duration-300",
                                        hoveredSource === 'file'
                                            ? "text-[#ffae00] drop-shadow-[0_0_12px_#ffae00]"
                                            : "text-[#ffae00]/60"
                                    )}
                                    style={{
                                        filter: hoveredSource === 'file'
                                            ? "drop-shadow(0 0 12px #ffae00)"
                                            : "drop-shadow(0 0 4px #ffae00)"
                                    }}
                                />
                            </motion.div>

                            <div className="text-center">
                                <h3 className="text-xl md:text-2xl font-orbitron font-bold text-white mb-1 tracking-wider">
                                    UPLOAD FILE
                                </h3>
                                <p className="text-sm text-white/50 font-rajdhani">
                                    Stream a video file
                                </p>
                            </div>

                            <motion.div
                                animate={hoveredSource === 'file' ? { x: 4, opacity: 1 } : { x: -2, opacity: 0.5 }}
                                transition={{ duration: 0.3 }}
                            >
                                <ChevronRight className="w-5 h-5 text-[#ffae00]" />
                            </motion.div>
                        </div>
                    </motion.button>
                </div>

                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {/* Footer Help Text */}
                <motion.div
                    className="mt-10 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <TerminalText className="text-xs text-white/30 tracking-widest">
                        SELECT SOURCE TO INITIALIZE VIDEO STREAM
                    </TerminalText>
                </motion.div>
            </motion.div>
        </motion.div>
    )
}
