/**
 * Sync Engine — Periodic authoritative timestamp broadcaster.
 * Sends SYNC_TICK events every 10 seconds to keep all listeners aligned.
 */

const { SERVER_EVENTS } = require('../socket/socketEvents');
const { getAuthoritativeTime, getState } = require('../state/videoStateManager');

/** @type {Map<string, NodeJS.Timeout>} */
const syncIntervals = new Map();

const SYNC_INTERVAL_MS = 2000; // 2 seconds — tight enough for real-time sync

/**
 * Starts periodic sync ticks for a room.
 * @param {import('socket.io').Server} io
 * @param {string} roomCode
 */
function startSyncTick(io, roomCode) {
    // Clear any existing interval for this room
    stopSyncTick(roomCode);

    const interval = setInterval(() => {
        const state = getState(roomCode);
        if (!state) {
            stopSyncTick(roomCode);
            return;
        }

        const authTime = getAuthoritativeTime(roomCode);

        io.to(roomCode).emit(SERVER_EVENTS.SYNC_TICK, {
            currentTime: authTime,
            isPlaying: state.isPlaying,
            serverTimestamp: Date.now(),
        });
    }, SYNC_INTERVAL_MS);

    syncIntervals.set(roomCode, interval);
}

/**
 * Stops sync ticks for a room.
 */
function stopSyncTick(roomCode) {
    const interval = syncIntervals.get(roomCode);
    if (interval) {
        clearInterval(interval);
        syncIntervals.delete(roomCode);
    }
}

module.exports = { startSyncTick, stopSyncTick };
