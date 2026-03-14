import * as React from "react"
import { useNavigate } from "react-router-dom"
import { useUIStore } from "@/store/uiStore"
import { useSocket } from "@/hooks/useSocket"
import { Button } from "@/components/ui/button"
import { TerminalText } from "@/components/ui/terminal-text"
import { RetroPanel } from "@/components/layout/RetroPanel"
import { motion, AnimatePresence } from "framer-motion"
import { Zap, ChevronLeft, WifiOff } from "lucide-react"
import { Link } from "react-router-dom"
import { InvalidSessionTypeAlert } from "@/components/InvalidSessionTypeAlert"

export function JoinPage() {
    const [code, setCode] = React.useState("")
    const [error, setError] = React.useState("")
    const [submitting, setSubmitting] = React.useState(false)
    const [selectedBroadcastType, setSelectedBroadcastType] = React.useState<'audio' | 'video' | null>(null)
    
    const { joinRoom } = useSocket()
    const navigate = useNavigate()

    // Listen for connection status to know when we've joined
    const connectionStatus = useUIStore((state) => state.connectionStatus)
    const sessionTypeError = useUIStore((state) => state.sessionTypeError)

    React.useEffect(() => {
        if (submitting && (connectionStatus === 'SYNCED' || connectionStatus === 'BROADCASTING')) {
            navigate("/listener")
        }
    }, [connectionStatus, submitting, navigate])

    // Listen for join errors
    React.useEffect(() => {
        const handleError = () => {
            // If we get OFFLINE after submitting, there was an error
            if (submitting && connectionStatus === 'OFFLINE') {
                setError("Room not found or connection failed.")
                setSubmitting(false)
            }
        }
        handleError()
    }, [connectionStatus, submitting])

    // Listen for session type errors
    React.useEffect(() => {
        if (sessionTypeError) {
            setSubmitting(false)
            // Error will be displayed by InvalidSessionTypeAlert component
        }
    }, [sessionTypeError])

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
        setCode(val)
        if (error) setError("")
    }

    const handleJoin = () => {
        if (code.length !== 6) {
            setError("Room code must be exactly 6 characters.")
            return
        }
        
        // Need to select broadcast type first
        if (!selectedBroadcastType) {
            setError("Please select a broadcast type first")
            return
        }

        setSubmitting(true)
        setError("")
        useUIStore.getState().joinBroadcast(code)
        joinRoom(code, selectedBroadcastType)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleJoin()
    }

    const handleBroadcastTypeSelect = (type: 'audio' | 'video') => {
        setSelectedBroadcastType(type)
        // Don't join immediately - wait for user to enter code
    }

    // Show invalid session type alert if validation failed
    if (sessionTypeError) {
        return (
            <InvalidSessionTypeAlert
                sessionType={sessionTypeError.sessionType}
                selectedType={sessionTypeError.selectedType}
                onDismiss={() => {
                    useUIStore.getState().setSessionTypeError(null)
                    setSelectedBroadcastType(null)
                    setSubmitting(false)
                }}
            />
        )
    }

    // Show broadcast type selection if not yet selected
    if (!selectedBroadcastType && code.length === 6) {
        return (
            <div className="w-full max-w-lg flex flex-col items-center justify-center min-h-[80vh] gap-8">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="self-start"
                >
                    <Link to="/">
                        <Button variant="ghost" size="sm" className="text-white/40 hover:text-white gap-2">
                            <ChevronLeft className="w-4 h-4" />
                            <TerminalText className="text-xs">BACK</TerminalText>
                        </Button>
                    </Link>
                </motion.div>

                {/* Broadcast Type Selection for Listeners */}
                <div className="w-full max-w-2xl">
                    <motion.div
                        className="text-center space-y-4 mb-12"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h2 className="text-2xl font-orbitron font-bold text-white tracking-wider">
                            SELECT LISTEN MODE
                        </h2>
                        <TerminalText className="text-sm text-white/50">
                            Choose how you want to receive the broadcast
                        </TerminalText>
                    </motion.div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Audio Mode */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleBroadcastTypeSelect('audio')}
                            className="p-6 border-2 border-[#ff003c]/30 hover:border-[#ff003c] bg-[#ff003c]/5 rounded-lg text-center transition-all duration-300"
                        >
                            <div className="text-xl font-orbitron text-[#ff003c] mb-2">AUDIO</div>
                            <TerminalText className="text-xs text-white/50">Voice only</TerminalText>
                        </motion.button>

                        {/* Video Mode */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleBroadcastTypeSelect('video')}
                            className="p-6 border-2 border-[#00ff9f]/30 hover:border-[#00ff9f] bg-[#00ff9f]/5 rounded-lg text-center transition-all duration-300"
                        >
                            <div className="text-xl font-orbitron text-[#00ff9f] mb-2">VIDEO</div>
                            <TerminalText className="text-xs text-white/50">Video + audio</TerminalText>
                        </motion.button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full max-w-lg flex flex-col items-center justify-center min-h-[80vh] gap-8">

            {/* Back */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="self-start"
            >
                <Link to="/">
                    <Button variant="ghost" size="sm" className="text-white/40 hover:text-white gap-2">
                        <ChevronLeft className="w-4 h-4" />
                        <TerminalText className="text-xs">BACK</TerminalText>
                    </Button>
                </Link>
            </motion.div>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-2"
            >
                <Zap className="w-10 h-10 mx-auto text-[#00ff9f] mb-4"
                    style={{ filter: "drop-shadow(0 0 10px #00ff9f)" }} />
                <h1 className="text-2xl font-orbitron font-bold text-white tracking-widest">
                    JOIN BROADCAST
                </h1>
                <TerminalText className="text-xs text-white/40">ENTER THE ROOM CODE TO TUNE IN</TerminalText>
            </motion.div>

            {/* Input Panel */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="w-full"
            >
                <RetroPanel title="SIGNAL AUTHENTICATION" variant="green" className="w-full">
                    <div className="flex flex-col gap-6 py-4">

                        {/* Room code input */}
                        <div className="flex flex-col gap-3">
                            <TerminalText className="text-xs text-white/50 block">ROOM CODE</TerminalText>
                            <input
                                type="text"
                                value={code}
                                onChange={handleInput}
                                onKeyDown={handleKeyDown}
                                placeholder="_ _ _ _ _ _"
                                maxLength={6}
                                autoFocus
                                className={`
                  w-full bg-black/60 border-2 rounded-sm px-4 py-4
                  font-orbitron text-center text-3xl tracking-[0.5em] text-white
                  placeholder:text-white/20 outline-none transition-all
                  ${error
                                        ? "border-[#ff003c] shadow-[0_0_10px_rgba(255,0,60,0.4)]"
                                        : code.length > 0
                                            ? "border-[#00ff9f] shadow-[0_0_10px_rgba(0,255,159,0.3)]"
                                            : "border-white/20 focus:border-[#00ff9f]/60"
                                    }
                `}
                            />

                            {/* Progress dots */}
                            <div className="flex justify-center gap-2">
                                {Array.from({ length: 6 }, (_, i) => (
                                    <div
                                        key={i}
                                        className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i < code.length ? "bg-[#00ff9f] shadow-[0_0_6px_#00ff9f]" : "bg-white/15"
                                            }`}
                                    />
                                ))}
                            </div>

                            {/* Error message */}
                            <AnimatePresence>
                                {error && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="text-center font-orbitron text-xs text-[#ff003c]"
                                    >
                                        ⚠ {error}
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Submit */}
                        <Button
                            variant="neon-green"
                            size="lg"
                            className="w-full h-14 text-base gap-2"
                            onClick={handleJoin}
                            disabled={submitting}
                        >
                            <WifiOff className="w-4 h-4 rotate-180" />
                            {submitting ? "CONNECTING..." : "JOIN SIGNAL"}
                        </Button>

                        <TerminalText className="text-center text-[10px] text-white/25">
                            OBTAIN THE CODE FROM YOUR BROADCASTER
                        </TerminalText>
                    </div>
                </RetroPanel>
            </motion.div>
        </div>
    )
}
