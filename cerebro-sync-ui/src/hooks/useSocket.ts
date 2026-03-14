/**
 * useSocket — React hook for Socket.io connection management.
 *
 * Handles connecting/disconnecting, listening for all server events,
 * latency measurement (ping/pong), and updating the Zustand store.
 *
 * Low-latency sync strategy:
 *  - On VIDEO_PLAY / AUDIO_PLAY: apply latency-compensated time
 *    (serverTimestamp diff + half RTT) before seeking the media element.
 *  - On SYNC_TICK: use soft playback-rate nudging for small drifts (< 1 s)
 *    and a hard seek only for large drifts (≥ 1 s).
 */
import { useEffect, useRef, useCallback } from 'react';
import socket from '@/lib/socket';
import { useUIStore } from '@/store/uiStore';

/** Soft-correction drift band (seconds) — use playbackRate nudge below this */
const SOFT_DRIFT_THRESHOLD = 1.0;

/** Drift below this is ignored entirely (< 100 ms is imperceptible) */
const MIN_DRIFT_THRESHOLD = 0.1;

/** How often to send PING for latency measurement (ms) */
const PING_INTERVAL_MS = 2000;

// ── Helpers ───────────────────────────────────────────────────────────────

/**
 * Calculate how far ahead we should place the media element to compensate
 * for the time that has elapsed since the server sent the event.
 */
function getCompensatedTime(serverTimestamp: number, reportedTime: number, latencyMs: number): number {
    const networkDelay = (Date.now() - serverTimestamp) / 1000; // seconds elapsed since server sent
    const halfRtt      = latencyMs / 2 / 1000;                  // our best estimate of one-way delay
    return reportedTime + Math.max(networkDelay, halfRtt);
}

/**
 * Apply a sync correction to a media element.
 *  - drift < MIN_DRIFT   → do nothing
 *  - drift < SOFT_DRIFT  → nudge playbackRate (smooth)
 *  - drift ≥ SOFT_DRIFT  → hard seek (large gap)
 */
function applySyncCorrection(
    el: HTMLVideoElement | HTMLAudioElement | null | undefined,
    targetTime: number
): void {
    if (!el) return;
    const drift = targetTime - el.currentTime;

    if (Math.abs(drift) < MIN_DRIFT_THRESHOLD) return; // imperceptible — ignore

    if (Math.abs(drift) < SOFT_DRIFT_THRESHOLD) {
        // Nudge: play slightly faster/slower to converge
        el.playbackRate = drift > 0 ? 1.05 : 0.95;
        // Reset rate after 2 s
        setTimeout(() => { if (el) el.playbackRate = 1.0; }, 2000);
        console.log(`[SYNC] Soft correction: drift=${drift.toFixed(3)}s, rate=${el.playbackRate}`);
    } else {
        // Hard seek for large gaps
        el.currentTime = targetTime;
        el.playbackRate = 1.0;
        console.log(`[SYNC] Hard seek: drift=${drift.toFixed(3)}s → ${targetTime.toFixed(2)}s`);
    }
}

// ── Hook ──────────────────────────────────────────────────────────────────

/**
 * Hook that manages the socket lifecycle.
 * Accepts videoRef AND audioRef so sync events control the correct element.
 */
export function useSocket(
    videoRef?: React.RefObject<HTMLVideoElement | null>,
    audioRef?: React.RefObject<HTMLAudioElement | null>
) {
    const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const latencyRef      = useRef<number>(0); // kept in a ref for real-time access inside callbacks
    const store           = useUIStore;

    // ── Connect & Disconnect ─────────────────────────────────────────
    useEffect(() => {
        if (!socket.connected) {
            socket.connect();
        }

        // Socket.io connection lifecycle
        socket.on('connect', () => {
            console.log('[SOCKET] Connected:', socket.id);
        });

        socket.on('disconnect', (reason) => {
            console.log('[SOCKET] Disconnected:', reason);
            store.getState().setConnectionStatus('OFFLINE');
        });

        socket.on('reconnect_attempt', () => {
            store.getState().setConnectionStatus('RECONNECTING');
        });

        socket.on('reconnect', () => {
            console.log('[SOCKET] Reconnected');
            const roomCode = store.getState().roomCode;
            if (roomCode) {
                socket.emit('REQUEST_SYNC');
            }
        });

        // ── Server → Client Events ───────────────────────────────────

        socket.on('ROOM_CREATED', (data: { roomCode: string; connectedUsers: number; broadcastType?: 'audio' | 'video' }) => {
            store.getState().setRoomCode(data.roomCode);
            store.getState().setConnectionStatus('BROADCASTING');
            store.getState().setConnectedUsers(data.connectedUsers);
            if (data.broadcastType) {
                store.getState().setBroadcastType(data.broadcastType);
            }
        });

        socket.on('ROOM_JOINED', (data: { roomCode: string }) => {
            store.getState().setRoomCode(data.roomCode);
            store.getState().setConnectionStatus('SYNCED');
        });

        socket.on('ROOM_JOIN_ERROR', (data: {
            error: string;
            errorType?: 'INVALID_SESSION_TYPE';
            sessionType?: 'audio' | 'video';
            selectedType?: 'audio' | 'video';
        }) => {
            console.error('[SOCKET] Join error:', data.error);
            store.getState().setConnectionStatus('OFFLINE');
            if (data.errorType === 'INVALID_SESSION_TYPE' && data.sessionType && data.selectedType) {
                store.getState().setSessionTypeError({ sessionType: data.sessionType, selectedType: data.selectedType });
            }
        });

        // SYNC_STATE — sent to a newly joined listener; authoritative full state
        socket.on('SYNC_STATE', (data: {
            currentTime: number;
            isPlaying: boolean;
            broadcastType?: 'audio' | 'video';
            videoSource?: 'camera' | 'file';
            serverTimestamp?: number;
        }) => {
            store.getState().updateVideoState({
                currentTime: data.currentTime,
                isPlaying: data.isPlaying,
            });
            if (data.broadcastType) store.getState().setBroadcastType(data.broadcastType);
            if (data.videoSource)   store.getState().setVideoSource(data.videoSource);

            const latency = latencyRef.current;
            const serverTs = data.serverTimestamp ?? Date.now();
            const compensated = getCompensatedTime(serverTs, data.currentTime, latency);

            const el = videoRef?.current ?? audioRef?.current;
            if (el) {
                el.currentTime = compensated;
                if (data.isPlaying) {
                    el.play().catch(() => { });
                } else {
                    el.pause();
                }
            }
        });

        // VIDEO_PLAY — host pressed play (works for both video and audio rooms)
        socket.on('VIDEO_PLAY', (data: { currentTime: number; serverTimestamp?: number }) => {
            const latency    = latencyRef.current;
            const serverTs   = data.serverTimestamp ?? Date.now();
            const compensated = getCompensatedTime(serverTs, data.currentTime, latency);

            store.getState().updateVideoState({ currentTime: compensated, isPlaying: true });

            const el = videoRef?.current ?? audioRef?.current;
            if (el) {
                el.currentTime = compensated;
                el.playbackRate = 1.0;
                el.play().catch(() => { });
            }
        });

        // VIDEO_PAUSE — host pressed pause
        socket.on('VIDEO_PAUSE', (data: { currentTime: number; serverTimestamp?: number }) => {
            const latency   = latencyRef.current;
            const serverTs  = data.serverTimestamp ?? Date.now();
            const compensated = getCompensatedTime(serverTs, data.currentTime, latency);

            store.getState().updateVideoState({ currentTime: compensated, isPlaying: false });

            const el = videoRef?.current ?? audioRef?.current;
            if (el) {
                el.currentTime = compensated;
                el.playbackRate = 1.0;
                el.pause();
            }
        });

        // VIDEO_SEEK — host seeked
        socket.on('VIDEO_SEEK', (data: { currentTime: number; resumePlaying: boolean; serverTimestamp?: number }) => {
            const latency   = latencyRef.current;
            const serverTs  = data.serverTimestamp ?? Date.now();
            const compensated = getCompensatedTime(serverTs, data.currentTime, latency);

            store.getState().updateVideoState({ currentTime: compensated });

            const el = videoRef?.current ?? audioRef?.current;
            if (el) {
                el.currentTime = compensated;
                el.playbackRate = 1.0;
                if (data.resumePlaying) {
                    setTimeout(() => {
                        el.play().catch(() => { });
                        store.getState().updateVideoState({ isPlaying: true });
                    }, 100);
                } else {
                    el.pause();
                    store.getState().updateVideoState({ isPlaying: false });
                }
            }
        });

        // SYNC_TICK — periodic authoritative tick from server; soft-correct drift
        socket.on('SYNC_TICK', (data: { currentTime: number; isPlaying: boolean; serverTimestamp?: number }) => {
            const latency   = latencyRef.current;
            const serverTs  = data.serverTimestamp ?? Date.now();
            const compensated = getCompensatedTime(serverTs, data.currentTime, latency);

            // Update store with authoritative play state
            store.getState().updateVideoState({ isPlaying: data.isPlaying });

            const el = videoRef?.current ?? audioRef?.current;
            if (el && data.isPlaying) {
                applySyncCorrection(el, compensated);
            }
        });

        socket.on('USER_COUNT_UPDATE', (data: { connectedUsers: number }) => {
            store.getState().setConnectedUsers(data.connectedUsers);
        });

        socket.on('BROADCAST_ENDED', () => {
            console.log('[SOCKET] Broadcast ended');
            store.getState().setConnectionStatus('OFFLINE');
            store.getState().updateVideoState({ isPlaying: false });
            const el = videoRef?.current ?? audioRef?.current;
            if (el) el.pause();
        });

        socket.on('SESSION_TERMINATED', (data: { message: string }) => {
            console.log('[SOCKET] Session terminated:', data.message);
            store.getState().setSessionTerminated(true, data.message);
            store.getState().updateVideoState({ isPlaying: false });
            const el = videoRef?.current ?? audioRef?.current;
            if (el) el.pause();
        });

        socket.on('PONG', (data: { clientTimestamp: number }) => {
            const rtt     = Date.now() - data.clientTimestamp;
            const latency = Math.round(rtt / 2);
            latencyRef.current = latency;
            store.getState().setLatency(latency);

            let strength: 'STRONG' | 'MEDIUM' | 'WEAK' = 'STRONG';
            if (latency > 150) strength = 'WEAK';
            else if (latency > 50) strength = 'MEDIUM';
            store.getState().setSignalStrength(strength);
        });

        // ── Latency Ping Interval ──────────────────────────────────────
        pingIntervalRef.current = setInterval(() => {
            if (socket.connected) {
                socket.emit('PING', { clientTimestamp: Date.now() });
            }
        }, PING_INTERVAL_MS);

        // ── Cleanup ────────────────────────────────────────────────────
        return () => {
            if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
            socket.off('connect');
            socket.off('disconnect');
            socket.off('reconnect_attempt');
            socket.off('reconnect');
            socket.off('ROOM_CREATED');
            socket.off('ROOM_JOINED');
            socket.off('ROOM_JOIN_ERROR');
            socket.off('SYNC_STATE');
            socket.off('VIDEO_PLAY');
            socket.off('VIDEO_PAUSE');
            socket.off('VIDEO_SEEK');
            socket.off('SYNC_TICK');
            socket.off('USER_COUNT_UPDATE');
            socket.off('BROADCAST_ENDED');
            socket.off('SESSION_TERMINATED');
            socket.off('PONG');
        };
    }, [videoRef, audioRef]);

    // ── Emitters for components to call ──────────────────────────────
    const createRoom = useCallback(() => {
        const broadcastType = store.getState().broadcastType;
        const videoSource   = store.getState().videoSource;
        socket.emit('CREATE_ROOM', { broadcastType, videoSource });
    }, []);

    const joinRoom = useCallback((roomCode: string, selectedBroadcastType?: 'audio' | 'video') => {
        store.getState().setConnectionStatus('CONNECTING');
        socket.emit('JOIN_ROOM', { roomCode: roomCode.toUpperCase(), selectedBroadcastType });
    }, []);

    const emitPlay = useCallback((roomCode: string, currentTime: number) => {
        socket.emit('PLAY_VIDEO', { roomCode, currentTime });
    }, []);

    const emitPause = useCallback((roomCode: string, currentTime: number) => {
        socket.emit('PAUSE_VIDEO', { roomCode, currentTime });
    }, []);

    const emitSeek = useCallback((roomCode: string, currentTime: number) => {
        socket.emit('SEEK_VIDEO', { roomCode, currentTime });
    }, []);

    const leaveRoom = useCallback(() => {
        socket.emit('LEAVE_ROOM');
        store.getState().setConnectionStatus('OFFLINE');
        store.getState().setRoomCode(null);
        store.getState().setConnectedUsers(0);
        store.getState().setLatency(0);
        store.getState().updateVideoState({ isPlaying: false });
    }, []);

    const terminateSession = useCallback(() => {
        socket.emit('TERMINATE_SESSION');
        store.getState().setSessionTerminated(true, 'Session ended by host.');
    }, []);

    return {
        socket,
        createRoom,
        joinRoom,
        emitPlay,
        emitPause,
        emitSeek,
        leaveRoom,
        terminateSession,
    };
}
