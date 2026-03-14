import { RetroPanel } from "@/components/layout/RetroPanel"
import { VideoPlayer } from "@/components/video/VideoPlayer"
import { SystemStatus } from "@/components/indicators/SystemStatus"
import { Button } from "@/components/ui/button"
import { TerminalText } from "@/components/ui/terminal-text"
import { SessionTerminationAlert } from "@/components/SessionTerminationAlert"
import { useUIStore } from "@/store/uiStore"
import { useSocket } from "@/hooks/useSocket"
import { motion } from "framer-motion"
import { Zap, WifiOff, ChevronLeft } from "lucide-react"
import { useNavigate, Link, Navigate } from "react-router-dom"

export function ListenerConsole() {
    const { connectionStatus, roomCode, latencyMs, sessionTerminated } = useUIStore()
    const { leaveRoom } = useSocket()
    const navigate = useNavigate()

    // Guard: if no room code (direct URL access), redirect to join page
    if (!roomCode && connectionStatus === 'OFFLINE') {
        return <Navigate to="/join" replace />
    }

    const handleLeave = () => {
        leaveRoom()
        useUIStore.getState().leaveSession()
        navigate("/")
    }

    if (sessionTerminated) {
        return <SessionTerminationAlert />
    }

    const syncStatus = {
        OFFLINE:      { label: "DISCONNECTED", color: "text-red-400" },
        CONNECTING:   { label: "CONNECTING...", color: "text-yellow-400" },
        SYNCED:       { label: "LIVE", color: "text-[#00ff9f]" },
        BUFFERING:    { label: "BUFFERING", color: "text-yellow-400" },
        RECONNECTING: { label: "RECONNECTING", color: "text-orange-400" },
        BROADCASTING: { label: "RECEIVING", color: "text-[#00ff9f]" },
    }

    const status = syncStatus[connectionStatus] ?? syncStatus.OFFLINE

    return (
        <div className="w-full max-w-6xl flex flex-col gap-6">

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/10"
            >
                <div className="flex items-center gap-4">
                    <Link to="/" onClick={handleLeave}>
                        <Button variant="ghost" size="icon" className="text-white/40 hover:text-white">
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl md:text-2xl font-orbitron font-bold text-white tracking-widest flex items-center gap-3">
                            <Zap className="text-[#00ff9f]" style={{ filter: "drop-shadow(0 0 6px #00ff9f)" }} />
                            RECEIVER NODE
                        </h1>
                        <TerminalText className="text-white/40 text-xs mt-1">OBSERVER MODE // CONTROLS LOCKED</TerminalText>
                    </div>
                </div>
                <SystemStatus />
            </motion.div>

            {/* Room Code & Status Banner */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
            >
                <RetroPanel variant="green">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex flex-wrap items-center gap-6">
                            <div>
                                <TerminalText className="text-xs text-[#00ff9f]/60 block mb-1">CONNECTED TO ROOM</TerminalText>
                                <span
                                    className="font-['Press_Start_2P'] text-xl md:text-2xl text-[#00ff9f] tracking-[0.25em] block"
                                    style={{ textShadow: "0 0 15px #00ff9f" }}
                                >
                                    {roomCode ?? "------"}
                                </span>
                            </div>

                            <div className="w-px h-10 bg-white/10 hidden sm:block" />

                            <div>
                                <TerminalText className="text-xs text-[#00ff9f]/60 block mb-1">SYNC STATUS</TerminalText>
                                <div className="flex items-center gap-2">
                                    {(connectionStatus === 'SYNCED' || connectionStatus === 'BROADCASTING') && (
                                        <span className="relative flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff9f] opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00ff9f]" />
                                        </span>
                                    )}
                                    <TerminalText className={`text-base font-bold ${status.color}`}>
                                        {status.label}
                                    </TerminalText>
                                </div>
                            </div>

                            <div className="w-px h-10 bg-white/10 hidden sm:block" />

                            <div>
                                <TerminalText className="text-xs text-[#00ff9f]/60 block mb-1">LATENCY</TerminalText>
                                <TerminalText className="text-sm text-white/80">
                                    {connectionStatus === 'OFFLINE' ? "—" : `${latencyMs} ms`}
                                </TerminalText>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            className="border-red-500/30 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/60 gap-2 text-xs shrink-0"
                            onClick={handleLeave}
                        >
                            <WifiOff className="w-3.5 h-3.5" />
                            LEAVE SESSION
                        </Button>
                    </div>
                </RetroPanel>
            </motion.div>

            {/* Player */}
            <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
            >
                <RetroPanel
                    title="SECURED SIGNAL FEED — READ ONLY"
                    variant={connectionStatus === 'SYNCED' ? "green" : "dark"}
                    noPadding
                >
                    <VideoPlayer isBroadcaster={false} />

                    <div className="px-6 py-3 bg-black/50 border-t border-white/5 flex items-center justify-center gap-2">
                        <svg className="w-3 h-3 text-[#00ff9f]/40 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                        </svg>
                        <TerminalText className="text-[10px] text-white/30 tracking-widest">
                            PLAYBACK CONTROLLED BY BROADCASTER — OBSERVER MODE ACTIVE
                        </TerminalText>
                    </div>
                </RetroPanel>
            </motion.div>
        </div>
    )
}
