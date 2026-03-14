import { create } from 'zustand'

export type ConnectionStatus = 'OFFLINE' | 'CONNECTING' | 'SYNCED' | 'BUFFERING' | 'RECONNECTING' | 'BROADCASTING'

export type SignalStrength = 'STRONG' | 'MEDIUM' | 'WEAK' | 'NONE'

export type BroadcastType = 'audio' | 'video'

export type VideoSource = 'camera' | 'file' | null

interface UIState {
    // Room / Session
    roomCode: string | null
    isBroadcasting: boolean
    broadcastType: BroadcastType | null
    videoSource: VideoSource
    videoSourceFile: File | null
    sessionTypeError: { sessionType: 'audio' | 'video'; selectedType: 'audio' | 'video' } | null
    connectionStatus: ConnectionStatus
    latencyMs: number
    connectedUsers: number
    signalStrength: SignalStrength
    sessionTerminated: boolean
    terminationMessage: string | null

    // Video State
    isPlaying: boolean
    currentTime: number
    duration: number
    volume: number

    // Setters (called by useSocket hook)
    setConnectionStatus: (status: ConnectionStatus) => void
    setRoomCode: (code: string | null) => void
    setBroadcastType: (type: BroadcastType | null) => void
    setVideoSource: (source: VideoSource, file?: File | null) => void
    setSessionTypeError: (error: { sessionType: 'audio' | 'video'; selectedType: 'audio' | 'video' } | null) => void
    setConnectedUsers: (count: number) => void
    setLatency: (ms: number) => void
    setSignalStrength: (strength: SignalStrength) => void
    setBroadcasting: (value: boolean) => void
    setSessionTerminated: (terminated: boolean, message: string | null) => void
    updateVideoState: (state: Partial<{ isPlaying: boolean; currentTime: number; duration: number; volume: number }>) => void

    // High-level actions (used by UI components — these now just update local state;
    // actual socket emits are done via the useSocket hook emitters)
    startBroadcast: () => void
    stopBroadcast: () => void
    joinBroadcast: (code: string) => void
    leaveSession: () => void
}

export const useUIStore = create<UIState>((set) => ({
    roomCode: null,
    isBroadcasting: false,
    broadcastType: null,
    videoSource: null,
    videoSourceFile: null,
    sessionTypeError: null,
    connectionStatus: 'OFFLINE',
    latencyMs: 0,
    connectedUsers: 0,
    signalStrength: 'NONE',
    sessionTerminated: false,
    terminationMessage: null,

    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,

    // ── Setters (for useSocket hook) ──────────────────────────────
    setConnectionStatus: (status) => set({
        connectionStatus: status,
        isBroadcasting: status === 'BROADCASTING',
    }),

    setRoomCode: (code) => set({ roomCode: code }),

    setBroadcastType: (type) => set({ broadcastType: type }),

    setVideoSource: (source, file = null) => set({ 
        videoSource: source,
        videoSourceFile: file ?? null
    }),

    setSessionTypeError: (error) => set({ sessionTypeError: error }),

    setConnectedUsers: (count) => set({ connectedUsers: count }),

    setLatency: (ms) => set({ latencyMs: ms }),

    setSignalStrength: (strength) => set({ signalStrength: strength }),

    setBroadcasting: (value) => set({ isBroadcasting: value }),

    setSessionTerminated: (terminated, message) => set({
        sessionTerminated: terminated,
        terminationMessage: message,
        connectionStatus: terminated ? 'OFFLINE' : 'BROADCASTING',
    }),

    updateVideoState: (newState) => set((state) => ({ ...state, ...newState })),

    // ── High-level actions (local state only) ─────────────────────
    // The actual socket.emit calls are made by useSocket hook emitters.
    // These actions just set the optimistic local UI state.

    startBroadcast: () => set({
        isBroadcasting: true,
        connectionStatus: 'BROADCASTING',
        connectedUsers: 1,
        sessionTerminated: false,
        terminationMessage: null,
    }),

    stopBroadcast: () => set({
        isBroadcasting: false,
        connectionStatus: 'OFFLINE',
        connectedUsers: 0,
        isPlaying: false,
        roomCode: null,
        broadcastType: null,
        videoSource: null,
        videoSourceFile: null,
        latencyMs: 0,
        signalStrength: 'NONE',
        sessionTerminated: false,
        terminationMessage: null,
        sessionTypeError: null,
    }),

    joinBroadcast: (code: string) => set({
        connectionStatus: 'CONNECTING',
        roomCode: code.toUpperCase(),
        sessionTerminated: false,
        terminationMessage: null,
        sessionTypeError: null,
    }),

    leaveSession: () => set({
        connectionStatus: 'OFFLINE',
        roomCode: null,
        connectedUsers: 0,
        isPlaying: false,
        latencyMs: 0,
        signalStrength: 'NONE',
        sessionTerminated: false,
        terminationMessage: null,
        sessionTypeError: null,
    }),
}))




