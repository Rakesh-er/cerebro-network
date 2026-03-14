/**
 * Validation helpers for socket event payloads.
 */

/**
 * Validates a room code format: exactly 6 alphanumeric characters.
 */
function validateRoomCode(roomCode) {
    if (!roomCode || typeof roomCode !== 'string') return false;
    return /^[A-Z0-9]{6}$/.test(roomCode);
}

/**
 * Validates a video action payload (must include roomCode and currentTime).
 */
function validateVideoAction(data) {
    if (!data || typeof data !== 'object') return false;
    if (!validateRoomCode(data.roomCode)) return false;
    if (typeof data.currentTime !== 'number' || data.currentTime < 0) return false;
    return true;
}

module.exports = { validateRoomCode, validateVideoAction };
