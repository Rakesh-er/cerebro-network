import * as React from "react"
import { RetroPanel } from "@/components/layout/RetroPanel"
import { VideoPlayer } from "@/components/video/VideoPlayer"
import { SystemStatus } from "@/components/indicators/SystemStatus"
import { Button } from "@/components/ui/button"
import { TerminalText } from "@/components/ui/terminal-text"
import { BroadcastTypeSelection } from "@/components/BroadcastTypeSelection"
import { VideoSourceSelection } from "@/components/VideoSourceSelection"
import { useUIStore } from "@/store/uiStore"
import { useSocket } from "@/hooks/useSocket"
import { motion } from "framer-motion"
import { Radio, ShieldAlert, Copy, Check, ChevronLeft } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

export function BroadcasterConsole() {
    const { isBroadcasting, roomCode, connectedUsers, broadcastType, videoSource, setBroadcastType, setVideoSource, sessionTerminated } = useUIStore()
    const { createRoom, terminateSession } = useSocket()
    const [copied, setCopied] = React.useState(false)
    const navigate = useNavigate()

    React.useEffect(() => {
        // Only create room if broadcast type AND video source (if video) are selected
        const shouldCreateRoom = broadcastType && !useUIStore.getState().isBroadcasting &&
            (broadcastType === 'audio' || (broadcastType === 'video' && videoSource))
        
        if (shouldCreateRoom) {
            useUIStore.getState().startBroadcast()
            createRoom()
        }
    }, [broadcastType, videoSource])

    // If session was terminated, show message and return to home
    React.useEffect(() => {
        if (sessionTerminated) {
            setTimeout(() => {
                navigate("/")
            }, 3000)
        }
    }, [sessionTerminated, navigate])

    const handleCopy = () => {
        if (roomCode) {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(roomCode).catch(() => { })
            }
            setCopied(true)
            setTimeout(() => setCopied(false), 2500)
        }
    }

    const handleTerminate = () => {
        if (confirm('Are you sure you want to end this broadcast for all viewers?')) {
            terminateSession()
            useUIStore.getState().stopBroadcast()
            setTimeout(() => navigate("/"), 1500)
        }
    }

    // Show termination message if session was ended
    if (sessionTerminated) {
        return (
            <div className="w-full max-w-6xl flex flex-col items-center justify-center gap-6 py-12">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <h2 className="text-2xl md:text-3xl font-orbitron font-bold text-white mb-3 tracking-wider">
                        SESSION ENDED
                    </h2>
                    <TerminalText className="text-[#00ff9f] text-sm mb-6">
                        The broadcast has been terminated. Returning to home...
                    </TerminalText>
                    <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    >
                        <div className="w-12 h-12 border-4 border-[#00ff9f] border-t-transparent rounded-full mx-auto" />
                    </motion.div>
                </motion.div>
            </div>
        )
    }

    // Show broadcast type selection if not yet selected
    if (!broadcastType) {
        return <BroadcastTypeSelection onSelect={setBroadcastType} />
    }

    // For video broadcast, show video source selection if not yet selected
    if (broadcastType === 'video' && !videoSource) {
        const handleVideoSourceSelect = (source: 'file' | 'camera', file?: File) => {
            setVideoSource(source, file)
        }
        return <VideoSourceSelection onSelect={handleVideoSourceSelect} />
    }

    return (
        <div className="w-full max-w-6xl flex flex-col gap-6">

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/10"
            >
                <div className="flex items-center gap-4">
                    <Link to="/" onClick={handleTerminate}>
                        <Button variant="ghost" size="icon" className="text-white/40 hover:text-white">
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl md:text-2xl font-orbitron font-bold text-white tracking-widest flex items-center gap-3">
                            <Radio className="text-[#ffae00]" style={{ filter: "drop-shadow(0 0 6px #ffae00)" }} />
                            BROADCAST CONTROL
                        </h1>
                        <TerminalText className="text-white/40 text-xs mt-1">AUTHORIZATION: OMEGA // CLEARANCE: GRANTED</TerminalText>
                    </div>
                </div>
                <SystemStatus />
            </motion.div>

            {/* Room Code Banner */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
            >
                <RetroPanel variant="amber">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                            <TerminalText className="text-xs text-[#ffae00]/60 block mb-2">ROOM CODE — SHARE WITH LISTENERS</TerminalText>
                            <span
                                className="font-['Press_Start_2P'] text-3xl md:text-4xl text-[#ffae00] tracking-[0.3em] block"
                                style={{ textShadow: "0 0 20px #ffae00, 0 0 40px rgba(255,174,0,0.4)" }}
                            >
                                {roomCode ?? "......"}
                            </span>
                        </div>
                        <Button
                            variant="neon-amber"
                            className="gap-2 min-w-[140px]"
                            onClick={handleCopy}
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copied ? "COPIED!" : "COPY CODE"}
                        </Button>
                    </div>
                </RetroPanel>
            </motion.div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Video Player */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.25 }}
                    className="lg:col-span-2"
                >
                    <RetroPanel title="PRIMARY OPTICAL FEED" variant={isBroadcasting ? "amber" : "dark"} noPadding>
                        <VideoPlayer isBroadcaster={true} />
                    </RetroPanel>
                </motion.div>

                {/* Sidebar */}
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 }}
                    className="flex flex-col gap-4"
                >
                    {/* Stats */}
                    <RetroPanel title="SESSION STATUS" variant="amber">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <TerminalText className="text-xs text-white/50">MODE</TerminalText>
                                <TerminalText color="amber" className="text-sm">BROADCASTING</TerminalText>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <TerminalText className="text-xs text-white/50">USERS CONNECTED</TerminalText>
                                <TerminalText color="green" className="text-sm">{connectedUsers}</TerminalText>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <TerminalText className="text-xs text-white/50">ENCRYPTION</TerminalText>
                                <TerminalText color="red" className="text-sm">AES-256</TerminalText>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <TerminalText className="text-xs text-white/50">RELAY NODES</TerminalText>
                                <TerminalText color="amber" className="text-sm">{isBroadcasting ? "4 ACTIVE" : "STANDBY"}</TerminalText>
                            </div>
                        </div>
                    </RetroPanel>

                    {/* Signal Log */}
                    <RetroPanel title="SIGNAL MATRIX" className="flex-1">
                        <div className="font-mono text-[11px] space-y-1 leading-relaxed">
                            {isBroadcasting ? (
                                <>
                                    <p className="text-[#00ff9f]">{'>'} SIGNAL ACTIVE</p>
                                    <p className="text-[#00ff9f]/50">{'>'} ROUTING TO NODES...</p>
                                    <p className="text-[#00ff9f]/50">{'>'} PKT_LOSS: 0.001%</p>
                                    <p className="text-[#00ff9f]/50">{'>'} SYNC_PULSE: 15ms</p>
                                    <p className="text-[#00ff9f] animate-pulse">{'>'} TRANSMITTING ■■■■░░░</p>
                                </>
                            ) : (
                                <>
                                    <p className="text-white/30">{'>'} RELAY DORMANT</p>
                                    <p className="text-white/30 animate-pulse">{'>'} _</p>
                                </>
                            )}
                        </div>
                    </RetroPanel>

                    {/* Terminate */}
                    <Button
                        variant="neon-red"
                        size="lg"
                        className="w-full h-14 text-sm gap-2"
                        onClick={handleTerminate}
                    >
                        <ShieldAlert className="w-5 h-5" />
                        TERMINATE BROADCAST
                    </Button>
                </motion.div>
            </div>
        </div>
    )
}
