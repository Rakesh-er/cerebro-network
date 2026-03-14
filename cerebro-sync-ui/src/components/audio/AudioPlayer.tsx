import * as React from "react"
import { motion } from "framer-motion"
import { Volume2, Mic, MicOff, Play, Pause, SkipBack, SkipForward } from "lucide-react"
import { TerminalText } from "@/components/ui/terminal-text"
import { useUIStore } from "@/store/uiStore"

interface AudioPlayerProps {
    isBroadcaster?: boolean
    /** WebRTC local stream (broadcaster's mic) */
    localStream?: MediaStream | null
    /** WebRTC remote stream (listener receives broadcaster's mic) */
    remoteStream?: MediaStream | null
    /** Whether WebRTC peer connection is established */
    webrtcConnected?: boolean
    /** Emitters — only needed when isBroadcaster=true (for file-based audio) */
    emitPlay?: (roomCode: string, currentTime: number) => void
    emitPause?: (roomCode: string, currentTime: number) => void
    emitSeek?: (roomCode: string, currentTime: number) => void
}

/**
 * AudioPlayer — handles:
 *  - Broadcaster mic: shows live mic visualization (WebRTC sends audio)
 *  - Broadcaster file: shows file controls (play/pause/seek)
 *  - Listener mic: receives WebRTC audio, plays via <audio> element
 *  - Listener file: synced playback controlled by useSocket
 */
export const AudioPlayer = React.forwardRef<HTMLAudioElement, AudioPlayerProps>(
    function AudioPlayer(
        { isBroadcaster = false, localStream, remoteStream, webrtcConnected, emitPlay, emitPause, emitSeek },
        ref
    ) {
        const [volume, setVolume] = React.useState(80)
        const [isMuted, setIsMuted] = React.useState(false)
        const [isPlaying, setIsPlaying] = React.useState(false)
        const [currentTime, setCurrentTime] = React.useState(0)
        const [duration, setDuration] = React.useState(0)

        const { roomCode, isPlaying: storeIsPlaying, videoSourceFile } = useUIStore()

        // Internal ref — we also expose it via forwardRef
        const internalAudioRef = React.useRef<HTMLAudioElement>(null)
        const audioRef = (ref as React.RefObject<HTMLAudioElement>) ?? internalAudioRef

        // Determine mode: live mic vs file
        const isLiveMic = !videoSourceFile // No file selected → mic mode
        const isFileMode = !!videoSourceFile

        // ── BROADCASTER MIC: local stream is captured by useWebRTC,
        //    we don't need to attach it to <audio> — WebRTC sends it.
        //    Just show the visualizer.

        // ── LISTENER MIC: attach remote stream to audio element ───────
        React.useEffect(() => {
            if (isBroadcaster || !remoteStream) return
            const el = audioRef.current
            if (!el) return

            el.srcObject = remoteStream
            el.play().catch(() => {})
            console.log("[AUDIO] Listener: remote mic stream attached via WebRTC")

            return () => {
                el.srcObject = null
            }
        }, [isBroadcaster, remoteStream])

        // ── BROADCASTER FILE: attach file source ──────────────────────
        React.useEffect(() => {
            if (!isBroadcaster || !videoSourceFile) return
            const el = audioRef.current
            if (!el) return

            const url = URL.createObjectURL(videoSourceFile)
            el.src = url
            console.log("[AUDIO] Broadcaster: file audio source set")
            return () => {
                URL.revokeObjectURL(url)
                el.src = ""
            }
        }, [isBroadcaster, videoSourceFile])

        // ── Sync listener audio element with store state (file mode) ──
        React.useEffect(() => {
            if (isBroadcaster || isLiveMic) return
            const el = audioRef.current
            if (!el) return
            if (storeIsPlaying && el.paused) {
                el.play().catch(() => {})
            } else if (!storeIsPlaying && !el.paused) {
                el.pause()
            }
        }, [storeIsPlaying, isBroadcaster, isLiveMic])

        // ── Track audio element time for controls ──────────────────────
        React.useEffect(() => {
            const el = audioRef.current
            if (!el) return

            const onTimeUpdate = () => setCurrentTime(el.currentTime)
            const onDurationChange = () => setDuration(el.duration || 0)
            const onPlay = () => setIsPlaying(true)
            const onPause = () => setIsPlaying(false)

            el.addEventListener("timeupdate", onTimeUpdate)
            el.addEventListener("durationchange", onDurationChange)
            el.addEventListener("play", onPlay)
            el.addEventListener("pause", onPause)
            return () => {
                el.removeEventListener("timeupdate", onTimeUpdate)
                el.removeEventListener("durationchange", onDurationChange)
                el.removeEventListener("play", onPlay)
                el.removeEventListener("pause", onPause)
            }
        }, [])

        // ── Broadcaster file control handlers ─────────────────────────
        const handlePlayPause = () => {
            const el = audioRef.current
            if (!el || !isBroadcaster) return
            if (isPlaying) {
                el.pause()
                if (roomCode && emitPause) emitPause(roomCode, el.currentTime)
            } else {
                el.play().catch(() => {})
                if (roomCode && emitPlay) emitPlay(roomCode, el.currentTime)
            }
        }

        const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
            const el = audioRef.current
            if (!el || !isBroadcaster) return
            const time = parseFloat(e.target.value)
            el.currentTime = time
            setCurrentTime(time)
            if (roomCode && emitSeek) emitSeek(roomCode, time)
        }

        const handleSkip = (delta: number) => {
            const el = audioRef.current
            if (!el || !isBroadcaster) return
            const newTime = Math.max(0, Math.min(duration || 0, el.currentTime + delta))
            el.currentTime = newTime
            if (roomCode && emitSeek) emitSeek(roomCode, newTime)
        }

        const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const v = parseInt(e.target.value, 10)
            setVolume(v)
            const el = audioRef.current
            if (el) el.volume = v / 100
        }

        const toggleMute = () => {
            setIsMuted(prev => {
                const newMuted = !prev
                // For broadcaster mic: actually mute/unmute the stream track
                if (isBroadcaster && localStream) {
                    localStream.getAudioTracks().forEach(track => {
                        track.enabled = !newMuted
                    })
                }
                // Also toggle local audio element volume
                const el = audioRef.current
                if (el) el.volume = newMuted ? 0 : volume / 100
                return newMuted
            })
        }

        const progress = duration ? (currentTime / duration) * 100 : 0
        const formatTime = (s: number) => {
            const m = Math.floor(s / 60)
            const sec = Math.floor(s % 60)
            return `${m}:${sec.toString().padStart(2, "0")}`
        }

        // Is the stream actually active?
        const isStreamActive = isBroadcaster ? !!localStream : (!!remoteStream || webrtcConnected)
        const showLiveAnimation = isLiveMic && (isBroadcaster ? !!localStream : isStreamActive)

        return (
            <div className="w-full h-full bg-gradient-to-b from-black/60 to-black/80 flex flex-col items-center justify-center p-8">
                {/* Hidden audio element */}
                <audio ref={audioRef} className="hidden" />

                {/* Waveform Visualization */}
                <motion.div
                    className="mb-6 flex items-center justify-center gap-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                >
                    {Array.from({ length: 12 }).map((_, i) => (
                        <motion.div
                            key={i}
                            className="w-1 bg-gradient-to-t from-[#00ff9f] to-[#00ff9f]/60 rounded-full"
                            animate={{
                                height: (isLiveMic ? showLiveAnimation : (isPlaying || storeIsPlaying))
                                    ? ["24px", "48px", "32px", "56px", "40px"]
                                    : "8px"
                            }}
                            transition={{ duration: 0.6, delay: i * 0.08, repeat: Infinity, repeatType: "reverse" }}
                        />
                    ))}
                </motion.div>

                {/* Status */}
                <motion.div
                    className="text-center mb-6"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <h2 className="text-xl md:text-2xl font-orbitron font-bold text-white mb-1 tracking-widest">
                        {isBroadcaster
                            ? (isLiveMic ? "MIC BROADCAST ACTIVE" : "AUDIO BROADCAST ACTIVE")
                            : (isLiveMic
                                ? (isStreamActive ? "LIVE AUDIO STREAM" : "CONNECTING TO MIC…")
                                : "AUDIO STREAM RECEIVED"
                            )
                        }
                    </h2>
                    <TerminalText className="text-sm text-[#00ff9f] flex items-center justify-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${showLiveAnimation || isPlaying || storeIsPlaying
                            ? "bg-[#00ff9f] animate-pulse" : "bg-zinc-600"
                            }`} />
                        {isLiveMic
                            ? (showLiveAnimation ? "LIVE" : "CONNECTING…")
                            : ((isPlaying || storeIsPlaying) ? "PLAYING" : "PAUSED")
                        }
                    </TerminalText>
                </motion.div>

                {/* Controls panel */}
                <motion.div
                    className="w-full max-w-sm bg-black/40 rounded-lg border border-[#00ff9f]/30 p-5 space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    {/* LIVE MIC: show LIVE badge + connection status, no play/pause */}
                    {isLiveMic && (
                        <div className="flex items-center justify-center gap-3 py-2">
                            <div className="flex items-center gap-2 bg-red-600/80 rounded px-4 py-2 border border-red-400/40">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                                </span>
                                <span className="font-orbitron text-xs text-white tracking-widest font-bold">
                                    {isBroadcaster ? "BROADCASTING" : (isStreamActive ? "RECEIVING" : "WAITING")}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Listener waiting for WebRTC mic connection */}
                    {isLiveMic && !isBroadcaster && !isStreamActive && (
                        <div className="flex flex-col items-center gap-3 py-2">
                            <div className="w-10 h-10 border-3 border-zinc-700 border-t-[#00ff9f] rounded-full animate-spin" />
                            <TerminalText className="text-xs text-[#00ff9f]/60">ESTABLISHING AUDIO LINK…</TerminalText>
                        </div>
                    )}

                    {/* FILE MODE: Progress bar — broadcaster only */}
                    {isFileMode && isBroadcaster && duration > 0 && (
                        <div className="space-y-1">
                            <div className="relative h-2 w-full bg-white/10 rounded-full">
                                <div
                                    className="absolute left-0 top-0 h-full bg-[#00ff9f] rounded-full transition-all"
                                    style={{ width: `${progress}%`, boxShadow: "0 0 6px #00ff9f" }}
                                />
                                <input
                                    type="range"
                                    min={0}
                                    max={duration}
                                    step={0.1}
                                    value={currentTime}
                                    onChange={handleSeek}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                            <div className="flex justify-between text-[10px] font-mono text-[#00ff9f]/50">
                                <span>{formatTime(currentTime)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                        </div>
                    )}

                    {/* FILE MODE: Play / Pause + Skip — broadcaster only */}
                    {isFileMode && isBroadcaster && (
                        <div className="flex items-center justify-center gap-3">
                            <button
                                onClick={() => handleSkip(-10)}
                                className="p-2 rounded-lg border border-[#00ff9f]/20 hover:border-[#00ff9f]/60 hover:bg-[#00ff9f]/10 transition-all"
                            >
                                <SkipBack className="w-4 h-4 text-[#00ff9f]/70" />
                            </button>

                            <button
                                onClick={handlePlayPause}
                                className="w-14 h-14 rounded-full bg-[#00ff9f] hover:bg-[#00ff9f]/80 flex items-center justify-center shadow-[0_0_20px_#00ff9f] hover:shadow-[0_0_30px_#00ff9f] transition-all"
                            >
                                {isPlaying
                                    ? <Pause className="w-6 h-6 text-black fill-current" />
                                    : <Play className="w-6 h-6 text-black fill-current ml-0.5" />
                                }
                            </button>

                            <button
                                onClick={() => handleSkip(10)}
                                className="p-2 rounded-lg border border-[#00ff9f]/20 hover:border-[#00ff9f]/60 hover:bg-[#00ff9f]/10 transition-all"
                            >
                                <SkipForward className="w-4 h-4 text-[#00ff9f]/70" />
                            </button>
                        </div>
                    )}

                    {/* Volume */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <TerminalText className="text-xs text-[#00ff9f]/60 uppercase tracking-wider">Volume</TerminalText>
                            <TerminalText className="text-sm text-[#00ff9f]">{isMuted ? "MUTED" : `${volume}%`}</TerminalText>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={volume}
                            onChange={handleVolumeChange}
                            className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[#00ff9f]"
                            style={{
                                background: `linear-gradient(to right, #00ff9f 0%, #00ff9f ${volume}%, rgba(0,255,159,0.2) ${volume}%, rgba(0,255,159,0.2) 100%)`,
                            }}
                        />
                    </div>

                    {/* Mute — broadcaster only */}
                    {isBroadcaster && (
                        <button
                            onClick={toggleMute}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-[#00ff9f]/30 hover:border-[#00ff9f]/60 hover:bg-[#00ff9f]/10 transition-all duration-300 group"
                        >
                            {isMuted ? (
                                <>
                                    <MicOff className="w-4 h-4 text-[#ff003c]" />
                                    <TerminalText className="text-sm text-[#ff003c]">MUTED</TerminalText>
                                </>
                            ) : (
                                <>
                                    <Mic className="w-4 h-4 text-[#00ff9f]" />
                                    <TerminalText className="text-sm text-[#00ff9f]">LIVE</TerminalText>
                                </>
                            )}
                        </button>
                    )}
                </motion.div>

                {/* Signal indicator */}
                <motion.div
                    className="mt-6 flex items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <Volume2 className="w-4 h-4 text-[#00ff9f]/60" />
                    <TerminalText className="text-xs text-[#00ff9f]/40">
                        {isLiveMic ? "LIVE AUDIO LINK" : "AUDIO STREAM STABLE"}
                    </TerminalText>
                    <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <motion.div
                                key={i}
                                className="w-1 h-3 bg-[#00ff9f] rounded-sm"
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 1.5, delay: i * 0.2, repeat: Infinity }}
                            />
                        ))}
                    </div>
                </motion.div>
            </div>
        )
    }
)
