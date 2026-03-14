import { useUIStore } from "@/store/uiStore"
import { Button } from "@/components/ui/button"
import { Play, Pause, SkipBack, SkipForward } from "lucide-react"
import { TimecodeDisplay } from "./TimecodeDisplay"
import * as React from "react"

interface VideoControlsProps {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    isBroadcaster: boolean;
    emitPlay?: (roomCode: string, currentTime: number) => void;
    emitPause?: (roomCode: string, currentTime: number) => void;
    emitSeek?: (roomCode: string, currentTime: number) => void;
}

export function VideoControls({ videoRef, isBroadcaster, emitPlay, emitPause, emitSeek }: VideoControlsProps) {

    const { isPlaying, currentTime, duration, updateVideoState, roomCode } = useUIStore()

    const handlePlayPause = () => {
        if (!isBroadcaster || !videoRef.current) return
        if (isPlaying) {
            videoRef.current.pause()
            updateVideoState({ isPlaying: false })
            if (roomCode && emitPause) emitPause(roomCode, videoRef.current.currentTime)
        } else {
            videoRef.current.play()
            updateVideoState({ isPlaying: true })
            if (roomCode && emitPlay) emitPlay(roomCode, videoRef.current.currentTime)
        }
    }

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isBroadcaster || !videoRef.current) return
        const time = parseFloat(e.target.value)
        videoRef.current.currentTime = time
        updateVideoState({ currentTime: time })
        if (roomCode && emitSeek) emitSeek(roomCode, time)
    }

    const progress = duration ? (currentTime / duration) * 100 : 0

    return (
        <div className="flex flex-col gap-3 px-4 py-4 bg-[#050505] border-t border-white/10">
            {/* Progress Bar */}
            <div className="relative h-2 w-full bg-white/10 rounded-full group cursor-pointer">
                <div
                    className="absolute left-0 top-0 h-full bg-[#ff003c] rounded-full transition-all"
                    style={{ width: `${progress}%`, boxShadow: progress > 0 ? '0 0 8px #ff003c' : 'none' }}
                />
                {/* Seek thumb dot */}
                {isBroadcaster && (
                    <div
                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-[0_0_6px_#ff003c] transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ left: `${progress}%` }}
                    />
                )}
                <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    step={0.1}
                    onChange={handleSeek}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    disabled={!isBroadcaster}
                />
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        disabled={!isBroadcaster}
                        className="text-white/50 hover:text-[#ff003c] hover:bg-white/5 disabled:opacity-30"
                        onClick={() => {
                            if (videoRef.current && isBroadcaster) {
                                const newTime = Math.max(0, currentTime - 10)
                                videoRef.current.currentTime = newTime
                                if (roomCode && emitSeek) emitSeek(roomCode, newTime)
                            }
                        }}
                    >
                        <SkipBack className="w-4 h-4" />
                    </Button>

                    <Button
                        size="icon"
                        onClick={handlePlayPause}
                        disabled={!isBroadcaster}
                        className="w-12 h-12 rounded-full bg-[#ff003c] hover:bg-[#ff003c]/80 text-white shadow-[0_0_15px_#ff003c] hover:shadow-[0_0_25px_#ff003c] disabled:opacity-30 transition-all"
                    >
                        {isPlaying
                            ? <Pause className="w-5 h-5 fill-current" />
                            : <Play className="w-5 h-5 fill-current ml-0.5" />
                        }
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        disabled={!isBroadcaster}
                        className="text-white/50 hover:text-[#ff003c] hover:bg-white/5 disabled:opacity-30"
                        onClick={() => {
                            if (videoRef.current && isBroadcaster) {
                                const newTime = Math.min(duration, currentTime + 10)
                                videoRef.current.currentTime = newTime
                                if (roomCode && emitSeek) emitSeek(roomCode, newTime)
                            }
                        }}
                    >
                        <SkipForward className="w-4 h-4" />
                    </Button>
                </div>

                <TimecodeDisplay />
            </div>

            {!isBroadcaster && (
                <div className="text-center">
                    <span className="font-orbitron text-[10px] text-[#00ff9f]/60 tracking-widest">CONTROLS LOCKED — OBSERVER MODE</span>
                </div>
            )}
        </div>
    )
}
