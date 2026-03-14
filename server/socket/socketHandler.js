/**
 * Socket Handler — Main event wiring for all client↔server interactions.
 * Handles room creation, joining, video controls, latency, and disconnections.
 */

const { CLIENT_EVENTS, SERVER_EVENTS } = require('./socketEvents');
const roomManager = require('../rooms/roomManager');
const videoState = require('../state/videoStateManager');
const syncEngine = require('../sync/syncEngine');
const { validateRoomCode, validateVideoAction } = require('../middleware/validation');
const { getSignalStrength } = require('../utils/latencyCalculator');

/**
 * Registers all socket event handlers.
 * @param {import('socket.io').Server} io
 */
function registerSocketHandlers(io) {
    io.on('connection', (socket) => {
        console.log(`[CONNECT] ${socket.id}`);

        // ── CREATE ROOM (Broadcaster) ──────────────────────────────────
        socket.on(CLIENT_EVENTS.CREATE_ROOM, (data = {}, callback) => {
            const broadcastType = data.broadcastType || 'video';
            const videoSource = data.videoSource || 'camera'; // 'camera' or 'file'
            const room = roomManager.createRoom(socket.id, broadcastType);
            room.videoSource = videoSource; // Store video source in room
            videoState.initState(room.roomCode);
            socket.join(room.roomCode);

            // Start the sync tick engine for this room
            syncEngine.startSyncTick(io, room.roomCode);

            const response = {
                roomCode: room.roomCode,
                connectedUsers: roomManager.getUserCount(room.roomCode),
                broadcastType: room.broadcastType,
                videoSource: room.videoSource,
            };

            // Support both callback and event-based responses
            if (typeof callback === 'function') {
                callback(response);
            }
            socket.emit(SERVER_EVENTS.ROOM_CREATED, response);

            console.log(`[ROOM CREATED] ${room.roomCode} (${broadcastType}, ${videoSource}) by ${socket.id}`);
        });

        // ── JOIN ROOM (Listener) ──────────────────────────────────────
        socket.on(CLIENT_EVENTS.JOIN_ROOM, (data, callback) => {
            const roomCode = typeof data === 'string' ? data : data?.roomCode;
            const selectedBroadcastType = data?.selectedBroadcastType;

            if (!validateRoomCode(roomCode)) {
                const err = { error: 'Invalid room code format.' };
                if (typeof callback === 'function') callback(err);
                socket.emit(SERVER_EVENTS.ROOM_JOIN_ERROR, err);
                return;
            }

            const room = roomManager.getRoom(roomCode);
            if (!room) {
                const err = { error: 'Room not found.' };
                if (typeof callback === 'function') callback(err);
                socket.emit(SERVER_EVENTS.ROOM_JOIN_ERROR, err);
                return;
            }

            // Validate that the selected broadcast type matches the room's broadcast type
            if (selectedBroadcastType && selectedBroadcastType !== room.broadcastType) {
                const err = {
                    error: `Session type mismatch. This is a ${room.broadcastType} broadcast.`,
                    errorType: 'INVALID_SESSION_TYPE',
                    sessionType: room.broadcastType,
                    selectedType: selectedBroadcastType,
                };
                if (typeof callback === 'function') callback(err);
                socket.emit(SERVER_EVENTS.ROOM_JOIN_ERROR, err);
                console.log(`[JOIN ERROR] ${socket.id} tried to join ${roomCode} with ${selectedBroadcastType} but it's a ${room.broadcastType} room`);
                return;
            }

            // Add listener to room
            roomManager.addListener(roomCode, socket.id);
            socket.join(roomCode);

            // Send authoritative video state to the new listener
            const authTime = videoState.getAuthoritativeTime(roomCode);
            const state = videoState.getState(roomCode);

            const syncPayload = {
                roomCode,
                currentTime: authTime,
                isPlaying: state ? state.isPlaying : false,
                broadcastType: room.broadcastType,
                videoSource: room.videoSource,
                serverTimestamp: Date.now(),
            };

            socket.emit(SERVER_EVENTS.SYNC_STATE, syncPayload);
            socket.emit(SERVER_EVENTS.ROOM_JOINED, { roomCode });

            if (typeof callback === 'function') {
                callback({ success: true, ...syncPayload });
            }

            // Notify all room members of updated user count
            const userCount = roomManager.getUserCount(roomCode);
            io.to(roomCode).emit(SERVER_EVENTS.USER_COUNT_UPDATE, { connectedUsers: userCount });

            console.log(`[JOINED] ${socket.id} → room ${roomCode} (${userCount} users)`);
        });

        // ── REQUEST FILE (Listener asks for buffered file after mounting) ──
        // This solves the race condition: the listener's UI navigates to
        // /listener AFTER JOIN_ROOM completes, so the VideoPlayer component
        // mounts and registers its FILE_* listeners BEFORE emitting this.
        socket.on(CLIENT_EVENTS.REQUEST_FILE, () => {
            const roomCode = roomManager.getRoomBySocketId(socket.id);
            if (!roomCode) return;

            const room = roomManager.getRoom(roomCode);
            if (!room) return;

            // Only replay if we have a completed file transfer buffered
            if (room.fileShare && room.fileShare.complete && room.fileChunks) {
                console.log(`[FILE REPLAY] Sending ${room.fileChunks.length} buffered chunks to ${socket.id}`);

                socket.emit(SERVER_EVENTS.FILE_START, {
                    fileName: room.fileShare.fileName,
                    fileType: room.fileShare.fileType,
                    fileSize: room.fileShare.fileSize,
                    totalChunks: room.fileShare.totalChunks,
                });

                for (let i = 0; i < room.fileChunks.length; i++) {
                    socket.emit(SERVER_EVENTS.FILE_CHUNK, {
                        chunkIndex: i,
                        totalChunks: room.fileShare.totalChunks,
                        chunk: room.fileChunks[i],
                    });
                }

                socket.emit(SERVER_EVENTS.FILE_END, {
                    fileName: room.fileShare.fileName,
                    fileType: room.fileShare.fileType,
                });
            }
        });

        // ── WEBRTC SIGNALING ───────────────────────────────────────────
        // Server acts as a signaling relay for WebRTC peer connections
        // (camera mode: broadcaster → listener video stream)

        socket.on(CLIENT_EVENTS.WEBRTC_OFFER, (data) => {
            const { roomCode, offer, targetSocketId } = data;
            const room = roomManager.getRoom(roomCode);
            if (!room || room.broadcaster !== socket.id) return;

            // Send offer to specific listener
            if (targetSocketId) {
                io.to(targetSocketId).emit(SERVER_EVENTS.WEBRTC_OFFER, {
                    offer,
                    senderSocketId: socket.id,
                });
            } else {
                // Broadcast offer to all listeners
                socket.to(roomCode).emit(SERVER_EVENTS.WEBRTC_OFFER, {
                    offer,
                    senderSocketId: socket.id,
                });
            }
        });

        socket.on(CLIENT_EVENTS.WEBRTC_ANSWER, (data) => {
            const { roomCode, answer, targetSocketId } = data;
            // Send answer to the broadcaster
            if (targetSocketId) {
                io.to(targetSocketId).emit(SERVER_EVENTS.WEBRTC_ANSWER, {
                    answer,
                    senderSocketId: socket.id,
                });
            }
        });

        socket.on(CLIENT_EVENTS.WEBRTC_ICE_CANDIDATE, (data) => {
            const { roomCode, candidate, targetSocketId } = data;
            if (targetSocketId) {
                io.to(targetSocketId).emit(SERVER_EVENTS.WEBRTC_ICE_CANDIDATE, {
                    candidate,
                    senderSocketId: socket.id,
                });
            } else {
                socket.to(roomCode).emit(SERVER_EVENTS.WEBRTC_ICE_CANDIDATE, {
                    candidate,
                    senderSocketId: socket.id,
                });
            }
        });

        // ── WEBRTC_READY (Listener signals it is ready for a WebRTC offer) ──
        socket.on(CLIENT_EVENTS.WEBRTC_READY, () => {
            const roomCode = roomManager.getRoomBySocketId(socket.id);
            if (!roomCode) return;

            const room = roomManager.getRoom(roomCode);
            if (!room || !room.broadcaster) return;

            console.log(`[WEBRTC] Listener ${socket.id} ready — telling broadcaster ${room.broadcaster} to send offer`);

            // Tell the broadcaster to create an offer for this specific listener
            io.to(room.broadcaster).emit(SERVER_EVENTS.WEBRTC_READY, {
                listenerSocketId: socket.id,
            });
        });

        // ── PLAY VIDEO ─────────────────────────────────────────────────
        socket.on(CLIENT_EVENTS.PLAY_VIDEO, (data) => {
            if (!validateVideoAction(data)) return;

            const room = roomManager.getRoom(data.roomCode);
            if (!room || room.broadcaster !== socket.id) return; // Only broadcaster can control

            videoState.updateState(data.roomCode, {
                currentTime: data.currentTime,
                isPlaying: true,
            });

            // Broadcast to all listeners (not the broadcaster)
            socket.to(data.roomCode).emit(SERVER_EVENTS.VIDEO_PLAY, {
                currentTime: data.currentTime,
                serverTimestamp: Date.now(),
            });

            console.log(`[PLAY] room ${data.roomCode} at ${data.currentTime.toFixed(2)}s`);
        });

        // ── PAUSE VIDEO ────────────────────────────────────────────────
        socket.on(CLIENT_EVENTS.PAUSE_VIDEO, (data) => {
            if (!validateVideoAction(data)) return;

            const room = roomManager.getRoom(data.roomCode);
            if (!room || room.broadcaster !== socket.id) return;

            videoState.updateState(data.roomCode, {
                currentTime: data.currentTime,
                isPlaying: false,
            });

            socket.to(data.roomCode).emit(SERVER_EVENTS.VIDEO_PAUSE, {
                currentTime: data.currentTime,
                serverTimestamp: Date.now(),
            });

            console.log(`[PAUSE] room ${data.roomCode} at ${data.currentTime.toFixed(2)}s`);
        });

        // ── SEEK VIDEO (with seek lock) ────────────────────────────────
        socket.on(CLIENT_EVENTS.SEEK_VIDEO, (data) => {
            if (!validateVideoAction(data)) return;

            const room = roomManager.getRoom(data.roomCode);
            if (!room || room.broadcaster !== socket.id) return;

            const state = videoState.getState(data.roomCode);
            const wasPlaying = state ? state.isPlaying : false;

            // Step 1: Pause listeners temporarily (seek lock)
            videoState.updateState(data.roomCode, {
                currentTime: data.currentTime,
                isPlaying: false,
            });

            // Step 2: Send seek command to all listeners
            socket.to(data.roomCode).emit(SERVER_EVENTS.VIDEO_SEEK, {
                currentTime: data.currentTime,
                resumePlaying: wasPlaying,
                serverTimestamp: Date.now(),
            });

            // Step 3: If was playing, resume after a brief delay (seek lock release)
            if (wasPlaying) {
                setTimeout(() => {
                    videoState.updateState(data.roomCode, {
                        currentTime: data.currentTime,
                        isPlaying: true,
                    });
                }, 200);
            }

            console.log(`[SEEK] room ${data.roomCode} → ${data.currentTime.toFixed(2)}s`);
        });

        // ── PING / PONG (Latency measurement) ──────────────────────────
        socket.on(CLIENT_EVENTS.PING, (data) => {
            socket.emit(SERVER_EVENTS.PONG, {
                clientTimestamp: data?.clientTimestamp || Date.now(),
                serverTimestamp: Date.now(),
            });
        });

        // ── REQUEST_SYNC ───────────────────────────────────────────────
        socket.on(CLIENT_EVENTS.REQUEST_SYNC, () => {
            const roomCode = roomManager.getRoomBySocketId(socket.id);
            if (!roomCode) return;

            const authTime = videoState.getAuthoritativeTime(roomCode);
            const state = videoState.getState(roomCode);

            socket.emit(SERVER_EVENTS.SYNC_STATE, {
                roomCode,
                currentTime: authTime,
                isPlaying: state ? state.isPlaying : false,
                serverTimestamp: Date.now(),
            });
        });

        // ── FILE TRANSFER: START ───────────────────────────────────────
        // Broadcaster announces a file is about to be sent
        socket.on(CLIENT_EVENTS.FILE_START, (data) => {
            const room = roomManager.getRoom(data.roomCode);
            if (!room || room.broadcaster !== socket.id) return;

            // Store metadata on room so late-joining listeners can be informed
            room.fileShare = {
                fileName: data.fileName,
                fileType: data.fileType,
                fileSize: data.fileSize,
                totalChunks: data.totalChunks,
                complete: false,
            };
            // Initialize chunk buffer for server-side storage
            room.fileChunks = new Array(data.totalChunks);

            // Relay to all listeners
            socket.to(data.roomCode).emit(SERVER_EVENTS.FILE_START, {
                fileName: data.fileName,
                fileType: data.fileType,
                fileSize: data.fileSize,
                totalChunks: data.totalChunks,
            });

            console.log(`[FILE] Start – room ${data.roomCode}, file: ${data.fileName}, size: ${(data.fileSize / 1024 / 1024).toFixed(2)} MB, chunks: ${data.totalChunks}`);
        });

        // ── FILE TRANSFER: CHUNK ───────────────────────────────────────
        // Relay a binary chunk from broadcaster to listeners
        socket.on(CLIENT_EVENTS.FILE_CHUNK, (data) => {
            const room = roomManager.getRoom(data.roomCode);
            if (!room || room.broadcaster !== socket.id) return;

            socket.to(data.roomCode).emit(SERVER_EVENTS.FILE_CHUNK, {
                chunkIndex: data.chunkIndex,
                totalChunks: data.totalChunks,
                chunk: data.chunk,
            });

            // Buffer chunk on server for late-joining listeners
            if (room.fileChunks) {
                room.fileChunks[data.chunkIndex] = data.chunk;
            }
        });

        // ── FILE TRANSFER: END ─────────────────────────────────────────
        // Broadcaster signals all chunks sent
        socket.on(CLIENT_EVENTS.FILE_END, (data) => {
            const room = roomManager.getRoom(data.roomCode);
            if (!room || room.broadcaster !== socket.id) return;

            if (room.fileShare) room.fileShare.complete = true;

            socket.to(data.roomCode).emit(SERVER_EVENTS.FILE_END, {
                fileName: data.fileName,
                fileType: data.fileType,
            });

            console.log(`[FILE] Complete – room ${data.roomCode}, file: ${data.fileName}`);
        });

        // ── LEAVE ROOM ─────────────────────────────────────────────────
        socket.on(CLIENT_EVENTS.LEAVE_ROOM, () => {
            handleDisconnect(io, socket);
        });

        // ── TERMINATE SESSION (Host/Broadcaster) ────────────────────────
        socket.on(CLIENT_EVENTS.TERMINATE_SESSION, async () => {
            const roomCode = roomManager.getRoomBySocketId(socket.id);
            if (!roomCode) return;

            const room = roomManager.getRoom(roomCode);
            if (!room || room.broadcaster !== socket.id) {
                console.log(`[TERMINATE DENIED] ${socket.id} attempted to terminate room ${roomCode} (not broadcaster)`);
                return;
            }

            console.log(`[SESSION TERMINATED] room ${roomCode} by broadcaster ${socket.id}`);

            // Broadcast termination message to all users in the room
            io.to(roomCode).emit(SERVER_EVENTS.SESSION_TERMINATED, {
                roomCode,
                message: 'The host has ended the session.',
                timestamp: Date.now(),
            });

            // Clean up
            syncEngine.stopSyncTick(roomCode);
            videoState.deleteState(roomCode);
            roomManager.deleteRoom(roomCode);

            // Disconnect all sockets from the room
            const sockets = (await io.in(roomCode).fetchSockets()) ?? [];
            for (const s of sockets) {
                s.leave(roomCode);
                s.disconnect(true);
            }
        });

        // ── DISCONNECT ─────────────────────────────────────────────────
        socket.on('disconnect', (reason) => {
            console.log(`[DISCONNECT] ${socket.id} (${reason})`);
            handleDisconnect(io, socket);
        });
    });
}

/**
 * Handles cleanup when a socket disconnects or leaves.
 */
function handleDisconnect(io, socket) {
    const roomCode = roomManager.getRoomBySocketId(socket.id);
    if (!roomCode) return;

    const room = roomManager.getRoom(roomCode);
    if (!room) return;

    if (room.broadcaster === socket.id) {
        // Broadcaster left → end the entire broadcast
        console.log(`[BROADCAST ENDED] room ${roomCode}`);

        io.to(roomCode).emit(SERVER_EVENTS.BROADCAST_ENDED, { roomCode });

        // Clean up
        syncEngine.stopSyncTick(roomCode);
        videoState.deleteState(roomCode);
        roomManager.deleteRoom(roomCode);
    } else {
        // Listener left
        roomManager.removeListener(roomCode, socket.id);
        socket.leave(roomCode);

        const userCount = roomManager.getUserCount(roomCode);
        io.to(roomCode).emit(SERVER_EVENTS.USER_COUNT_UPDATE, { connectedUsers: userCount });

        console.log(`[LEFT] ${socket.id} from room ${roomCode} (${userCount} users remaining)`);
    }
}

module.exports = { registerSocketHandlers };
