/**
 * useWebRTC — WebRTC peer connection for live camera streaming.
 *
 * BROADCASTER: captures camera via getUserMedia, creates RTCPeerConnection,
 *   adds tracks, sends offer via Socket.IO signaling.
 *
 * LISTENER: receives offer, creates answer, receives remote stream,
 *   returns it so VideoPlayer can attach it to the <video> element.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import socket from '@/lib/socket';

const ICE_SERVERS: RTCConfiguration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

interface WebRTCState {
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    isConnected: boolean;
}

export function useWebRTC(isBroadcaster: boolean, roomCode: string | null, mode: 'video' | 'audio' = 'video') {
    const [state, setState] = useState<WebRTCState>({
        localStream: null,
        remoteStream: null,
        isConnected: false,
    });

    const pcRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);

    // ── Cleanup helper ────────────────────────────────────────────────
    const cleanup = useCallback(() => {
        if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
        }
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => t.stop());
            localStreamRef.current = null;
        }
        setState({ localStream: null, remoteStream: null, isConnected: false });
    }, []);

    // ── BROADCASTER ───────────────────────────────────────────────────
    useEffect(() => {
        if (!isBroadcaster || !roomCode) return;

        let cancelled = false;

        const initBroadcaster = async () => {
            try {
                // 1. Get media based on mode
                const constraints = mode === 'audio'
                    ? { audio: true }
                    : { video: true, audio: true };
                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }

                localStreamRef.current = stream;
                setState(prev => ({ ...prev, localStream: stream }));
                console.log(`[WEBRTC] Broadcaster: ${mode} stream acquired`);

                // 2. When a listener signals it's ready, send them an offer
                const handleListenerReady = async (data: { listenerSocketId: string }) => {
                    console.log('[WEBRTC] Broadcaster: listener ready, creating offer for', data.listenerSocketId);
                    await createOfferForRoom(stream, roomCode, data.listenerSocketId);
                };

                socket.on('WEBRTC_READY', handleListenerReady);

                // 3. Handle answer from listener
                socket.on('WEBRTC_ANSWER', async (data: { answer: RTCSessionDescriptionInit; senderSocketId: string }) => {
                    const pc = pcRef.current;
                    if (!pc) return;
                    try {
                        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
                        console.log('[WEBRTC] Broadcaster: remote description set');
                    } catch (err) {
                        console.error('[WEBRTC] Error setting remote description:', err);
                    }
                });

                // 4. Handle ICE candidates from listener
                socket.on('WEBRTC_ICE_CANDIDATE', async (data: { candidate: RTCIceCandidateInit; senderSocketId: string }) => {
                    const pc = pcRef.current;
                    if (!pc) return;
                    try {
                        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                    } catch (err) {
                        console.error('[WEBRTC] Error adding ICE candidate:', err);
                    }
                });

            } catch (error) {
                console.error('[WEBRTC] Failed to get camera:', error);
            }
        };

        const createOfferForRoom = async (stream: MediaStream, code: string, targetSocketId?: string) => {
            // Close previous connection if any
            if (pcRef.current) pcRef.current.close();

            const pc = new RTCPeerConnection(ICE_SERVERS);
            pcRef.current = pc;

            // Add local tracks
            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            // ICE candidates → send to listener via server
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('WEBRTC_ICE_CANDIDATE', {
                        roomCode: code,
                        candidate: event.candidate.toJSON(),
                    });
                }
            };

            pc.onconnectionstatechange = () => {
                console.log('[WEBRTC] Broadcaster connection state:', pc.connectionState);
                if (pc.connectionState === 'connected') {
                    setState(prev => ({ ...prev, isConnected: true }));
                }
            };

            // Create and send offer
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            socket.emit('WEBRTC_OFFER', {
                roomCode: code,
                offer: pc.localDescription,
                targetSocketId,
            });
            console.log('[WEBRTC] Broadcaster: offer sent to', targetSocketId || 'room');
        };

        initBroadcaster();

        return () => {
            cancelled = true;
            socket.off('WEBRTC_READY');
            socket.off('WEBRTC_ANSWER');
            socket.off('WEBRTC_ICE_CANDIDATE');
            cleanup();
        };
    }, [isBroadcaster, roomCode, cleanup]);

    // ── LISTENER ──────────────────────────────────────────────────────
    useEffect(() => {
        if (isBroadcaster || !roomCode) return;

        // Handle offer from broadcaster
        const handleOffer = async (data: { offer: RTCSessionDescriptionInit; senderSocketId: string }) => {
            console.log('[WEBRTC] Listener: received offer from', data.senderSocketId);

            // Close previous connection if any
            if (pcRef.current) pcRef.current.close();

            const pc = new RTCPeerConnection(ICE_SERVERS);
            pcRef.current = pc;

            // Collect remote stream tracks
            const remoteStream = new MediaStream();

            pc.ontrack = (event) => {
                console.log('[WEBRTC] Listener: received track', event.track.kind);
                remoteStream.addTrack(event.track);
                setState(prev => ({ ...prev, remoteStream }));
            };

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('WEBRTC_ICE_CANDIDATE', {
                        roomCode,
                        candidate: event.candidate.toJSON(),
                        targetSocketId: data.senderSocketId,
                    });
                }
            };

            pc.onconnectionstatechange = () => {
                console.log('[WEBRTC] Listener connection state:', pc.connectionState);
                if (pc.connectionState === 'connected') {
                    setState(prev => ({ ...prev, isConnected: true }));
                }
            };

            try {
                await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                socket.emit('WEBRTC_ANSWER', {
                    roomCode,
                    answer: pc.localDescription,
                    targetSocketId: data.senderSocketId,
                });
                console.log('[WEBRTC] Listener: answer sent');
            } catch (err) {
                console.error('[WEBRTC] Error creating answer:', err);
            }
        };

        // Handle ICE candidates from broadcaster
        const handleIce = async (data: { candidate: RTCIceCandidateInit; senderSocketId: string }) => {
            const pc = pcRef.current;
            if (!pc) return;
            try {
                await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            } catch (err) {
                console.error('[WEBRTC] Error adding ICE candidate:', err);
            }
        };

        socket.on('WEBRTC_OFFER', handleOffer);
        socket.on('WEBRTC_ICE_CANDIDATE', handleIce);

        // Signal readiness AFTER handlers are registered
        console.log('[WEBRTC] Listener: signaling WEBRTC_READY');
        socket.emit('WEBRTC_READY');

        return () => {
            socket.off('WEBRTC_OFFER', handleOffer);
            socket.off('WEBRTC_ICE_CANDIDATE', handleIce);
            cleanup();
        };
    }, [isBroadcaster, roomCode, cleanup]);

    return state;
}
