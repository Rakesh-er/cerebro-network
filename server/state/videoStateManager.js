/**
 * Video State Manager — Authoritative video state per room.
 * The server is the single source of truth for playback time.
 */

/** @type {Map<string, {currentTime: number, isPlaying: boolean, lastUpdateTimestamp: number}>} */
const videoStates = new Map();

/**
 * Initializes video state for a new room.
 */
function initState(roomCode) {
    videoStates.set(roomCode, {
        currentTime: 0,
        isPlaying: false,
        lastUpdateTimestamp: Date.now(),
    });
}

/**
 * Gets the raw stored state for a room.
 */
function getState(roomCode) {
    return videoStates.get(roomCode) || null;
}

/**
 * Calculates the authoritative current time for a room.
 * If playing, advances time by elapsed wall-clock time since last update.
 * If paused, returns the stored currentTime.
 */
function getAuthoritativeTime(roomCode) {
    const state = videoStates.get(roomCode);
    if (!state) return 0;

    if (state.isPlaying) {
        const elapsed = (Date.now() - state.lastUpdateTimestamp) / 1000;
        return state.currentTime + elapsed;
    }

    return state.currentTime;
}

/**
 * Updates the video state for a room.
 * @param {string} roomCode
 * @param {object} update — partial: { currentTime?, isPlaying? }
 */
function updateState(roomCode, update) {
    const state = videoStates.get(roomCode);
    if (!state) return null;

    if (typeof update.currentTime === 'number') {
        state.currentTime = update.currentTime;
    }
    if (typeof update.isPlaying === 'boolean') {
        state.isPlaying = update.isPlaying;
    }

    state.lastUpdateTimestamp = Date.now();
    videoStates.set(roomCode, state);

    return state;
}

/**
 * Removes state when a room is deleted.
 */
function deleteState(roomCode) {
    videoStates.delete(roomCode);
}

module.exports = {
    initState,
    getState,
    getAuthoritativeTime,
    updateState,
    deleteState,
};
