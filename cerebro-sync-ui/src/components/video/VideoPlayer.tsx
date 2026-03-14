import * as React from "react"
import { useUIStore } from "@/store/uiStore"
import { useSocket } from "@/hooks/useSocket"
import { useFileTransfer } from "@/hooks/useFileTransfer"
import { useWebRTC } from "@/hooks/useWebRTC"
import { AudioPlayer } from "@/components/audio/AudioPlayer"
import { CRTOverlay } from "./CRTOverlay"
import { VideoControls } from "./VideoControls"
import { cn } from "@/lib/utils"

interface VideoPlayerProps {
    isBroadcaster?: boolean;
    className?: string;
}

export function VideoPlayer({ isBroadcaster = false, className }: VideoPlayerProps) {
    const videoRef = React.useRef<HTMLVideoElement>(null)
    const audioRef = React.useRef<HTMLAudioElement>(null)
    const fileSentRef = React.useRef(false)

    const {
        updateVideoState,
        connectionStatus,
        broadcastType,
        videoSource,
        videoSourceFile,
        sessionTerminated,
        roomCode,
    } = useUIStore()

    const { emitPlay, emitPause, emitSeek } = useSocket(videoRef, audioRef)

    // File transfer: broadcaster sends, listener receives automatically
    const { sendFile, receivedObjectURL, transferProgress, isTransferComplete } =
        useFileTransfer(isBroadcaster)

    // WebRTC: for LIVE modes (camera video OR mic audio)
    const isCamera = broadcastType === 'video' && videoSource === 'camera'
    const isMicAudio = broadcastType === 'audio'
    const needsWebRTC = isCamera || isMicAudio

    const { localStream, remoteStream, isConnected: webrtcConnected } =
        useWebRTC(isBroadcaster && needsWebRTC, needsWebRTC ? roomCode : null, isMicAudio ? 'audio' : 'video')

    // ── Broadcaster camera: attach local stream to video element ───────
    React.useEffect(() => {
        if (!isBroadcaster || !isCamera) return
        const video = videoRef.current
        if (!video || !localStream) return

        video.srcObject = localStream
        video.play().catch(() => {})
        console.log('[VIDEO] Broadcaster: camera stream attached')
        return () => { video.srcObject = null }
    }, [isBroadcaster, isCamera, localStream])

    // ── Listener camera: attach remote stream to video element ─────────
    React.useEffect(() => {
        if (isBroadcaster || !isCamera) return
        const video = videoRef.current
        if (!video || !remoteStream) return

        video.srcObject = remoteStream
        video.play().catch(() => {})
        console.log('[VIDEO] Listener: remote camera stream attached')
        return () => { video.srcObject = null }
    }, [isBroadcaster, isCamera, remoteStream])

    // ── Broadcaster file: set up video source and send file ────────────
    React.useEffect(() => {
        if (!isBroadcaster || !broadcastType || sessionTerminated) return
        if (broadcastType !== 'video' || videoSource !== 'file' || !videoSourceFile) return

        const fileURL = URL.createObjectURL(videoSourceFile)
        if (videoRef.current) videoRef.current.src = fileURL
        console.log('[VIDEO] Broadcaster: file video loaded')

        if (roomCode && !fileSentRef.current) {
            fileSentRef.current = true
            sendFile(videoSourceFile, roomCode)
        }

        return () => {
            URL.revokeObjectURL(fileURL)
            if (videoRef.current) videoRef.current.src = ''
            fileSentRef.current = false
        }
    }, [isBroadcaster, broadcastType, videoSource, videoSourceFile, sessionTerminated, roomCode, sendFile])

    // Also trigger send if roomCode becomes available after file was set
    React.useEffect(() => {
        if (isBroadcaster && roomCode && videoSource === 'file' && videoSourceFile && !fileSentRef.current) {
            fileSentRef.current = true
            sendFile(videoSourceFile, roomCode)
        }
    }, [roomCode, isBroadcaster, videoSource, videoSourceFile, sendFile])

    // ── Listener file: assign received URL ─────────────────────────────
    React.useEffect(() => {
        if (isBroadcaster || isCamera) return
        const video = videoRef.current
        if (!video || !receivedObjectURL) return

        console.log('[VIDEO] Listener: received file URL assigned')
        video.src = receivedObjectURL
        video.load()
    }, [isBroadcaster, receivedObjectURL, isCamera])

    // ── Track video element state (file mode only) ─────────────────────
    React.useEffect(() => {
        const video = videoRef.current
        if (!video || broadcastType === 'audio' || isCamera) return

        const onTimeUpdate     = () => updateVideoState({ currentTime: video.currentTime })
        const onDurationChange = () => updateVideoState({ duration: video.duration })
        const onPlay           = () => updateVideoState({ isPlaying: true })
        const onPause          = () => updateVideoState({ isPlaying: false })

        video.addEventListener('timeupdate', onTimeUpdate)
        video.addEventListener('durationchange', onDurationChange)
        video.addEventListener('play', onPlay)
        video.addEventListener('pause', onPause)
        return () => {
            video.removeEventListener('timeupdate', onTimeUpdate)
            video.removeEventListener('durationchange', onDurationChange)
            video.removeEventListener('play', onPlay)
            video.removeEventListener('pause', onPause)
        }
    }, [updateVideoState, broadcastType, isCamera])

    // ── AUDIO MODE ─────────────────────────────────────────────────────
    if (broadcastType === 'audio') {
        return (
            <div className={cn("relative flex flex-col overflow-hidden bg-black", className)}>
                <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
                    <CRTOverlay />
                    <AudioPlayer
                        ref={audioRef}
                        isBroadcaster={isBroadcaster}
                        localStream={localStream}
                        remoteStream={remoteStream}
                        webrtcConnected={webrtcConnected}
                        emitPlay={emitPlay}
                        emitPause={emitPause}
                        emitSeek={emitSeek}
                    />
                </div>
            </div>
        )
    }

    // ── VIDEO MODE — determine what overlay to show ────────────────────
    const listenerNeedsFile = !isBroadcaster && videoSource === 'file'
    const listenerReceiving = listenerNeedsFile && !isTransferComplete
    const listenerReady     = listenerNeedsFile && isTransferComplete

    const broadcasterUploading = isBroadcaster && videoSource === 'file' && transferProgress > 0 && transferProgress < 100

    const showVideo = isBroadcaster
        || listenerReady
        || (isCamera && !!remoteStream)
        || (!listenerNeedsFile && !isCamera && (connectionStatus === 'SYNCED' || connectionStatus === 'BROADCASTING'))

    const listenerWaitingCamera = !isBroadcaster && isCamera && !remoteStream

    return (
        <div className={cn("relative flex flex-col overflow-hidden bg-black", className)}>
            <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
                <CRTOverlay />

                {listenerReceiving && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 gap-5 bg-black/70">
                        <div className="w-16 h-16 border-4 border-zinc-800 border-t-[#00ff9f] rounded-full animate-spin opacity-80" />
                        <span className="font-orbitron text-xs text-[#00ff9f] tracking-[0.2em] uppercase">
                            RECEIVING VIDEO… {transferProgress}%
                        </span>
                        <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[#00ff9f] rounded-full transition-all duration-300"
                                style={{ width: `${transferProgress}%`, boxShadow: '0 0 8px #00ff9f' }}
                            />
                        </div>
                    </div>
                )}

                {broadcasterUploading && (
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-2 bg-black/60 rounded-lg px-3 py-1.5 border border-[#ffae00]/40">
                        <div className="w-3 h-3 border-2 border-[#ffae00] border-t-transparent rounded-full animate-spin" />
                        <span className="font-orbitron text-[10px] text-[#ffae00] tracking-wider">
                            SENDING {transferProgress}%
                        </span>
                    </div>
                )}

                {isCamera && showVideo && (
                    <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-red-600/80 rounded px-3 py-1 border border-red-400/40">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                        </span>
                        <span className="font-orbitron text-[10px] text-white tracking-widest font-bold">LIVE</span>
                    </div>
                )}

                {listenerWaitingCamera && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 flex-col gap-4 bg-black/60">
                        <div className="w-14 h-14 border-4 border-zinc-800 border-t-[#00ff9f] rounded-full animate-spin opacity-80" />
                        <span className="font-orbitron text-xs text-[#00ff9f] tracking-[0.2em] uppercase">
                            CONNECTING TO CAMERA…
                        </span>
                    </div>
                )}

                {!showVideo && !listenerReceiving && !listenerWaitingCamera && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 flex-col gap-4">
                        <div className="w-14 h-14 border-4 border-zinc-800 border-t-[#ff003c] rounded-full animate-spin opacity-60" />
                        <span className="font-orbitron text-xs text-zinc-500 tracking-[0.3em] uppercase">
                            {connectionStatus === 'CONNECTING' ? 'AWAITING SIGNAL...' : 'NO SIGNAL'}
                        </span>
                    </div>
                )}

                <video
                    ref={videoRef}
                    className={cn(
                        "w-full h-full object-cover transition-opacity duration-700",
                        showVideo ? "opacity-100" : "opacity-0",
                        isBroadcaster && isCamera ? "scale-x-[-1]" : ""
                    )}
                    playsInline
                    muted={isCamera || !isBroadcaster}
                    autoPlay
                />
            </div>

            {broadcastType === 'video' && videoSource === 'file' && (
                <VideoControls
                    videoRef={videoRef}
                    isBroadcaster={isBroadcaster}
                    emitPlay={emitPlay}
                    emitPause={emitPause}
                    emitSeek={emitSeek}
                />
            )}
        </div>
    )
}
