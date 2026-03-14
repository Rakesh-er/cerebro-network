/**
 * Room Manager — In-memory room store.
 * Manages creation, lookup, and cleanup of broadcast rooms.
 */

const { generateRoomCode } = require('../utils/generateRoomCode');

/** @type {Map<string, object>} */
const rooms = new Map();

/** Maps socket IDs to their room code for quick lookup on disconnect. */
const socketToRoom = new Map();

/**
 * Creates a new room with the given broadcaster socket.
 * @param {string} broadcasterId — socket.id of the broadcaster
 * @param {'audio' | 'video'} broadcastType — type of broadcast
 * @returns {object} the created room object
 */
function createRoom(broadcasterId, broadcastType = 'video') {
    let roomCode;
    // Ensure uniqueness
    do {
        roomCode = generateRoomCode();
    } while (rooms.has(roomCode));

    const room = {
        roomCode,
        broadcaster: broadcasterId,
        broadcastType: broadcastType,
        listeners: [],
        createdAt: Date.now(),
    };

    rooms.set(roomCode, room);
    socketToRoom.set(broadcasterId, roomCode);

    return room;
}

/**
 * Returns the room object for a given code, or null.
 */
function getRoom(roomCode) {
    return rooms.get(roomCode) || null;
}

/**
 * Deletes a room and cleans up all socket→room mappings.
 */
function deleteRoom(roomCode) {
    const room = rooms.get(roomCode);
    if (!room) return;

    // Clean up socket mappings
    socketToRoom.delete(room.broadcaster);
    room.listeners.forEach((id) => socketToRoom.delete(id));

    rooms.delete(roomCode);
}

/**
 * Adds a listener socket to a room.
 * @returns {boolean} true if added, false if room not found
 */
function addListener(roomCode, socketId) {
    const room = rooms.get(roomCode);
    if (!room) return false;

    if (!room.listeners.includes(socketId)) {
        room.listeners.push(socketId);
        socketToRoom.set(socketId, roomCode);
    }
    return true;
}

/**
 * Removes a listener socket from a room.
 */
function removeListener(roomCode, socketId) {
    const room = rooms.get(roomCode);
    if (!room) return;

    room.listeners = room.listeners.filter((id) => id !== socketId);
    socketToRoom.delete(socketId);
}

/**
 * Returns the room code associated with a socket ID, or null.
 */
function getRoomBySocketId(socketId) {
    return socketToRoom.get(socketId) || null;
}

/**
 * Returns the total user count for a room (broadcaster + listeners).
 */
function getUserCount(roomCode) {
    const room = rooms.get(roomCode);
    if (!room) return 0;
    return 1 + room.listeners.length; // broadcaster + listeners
}

module.exports = {
    createRoom,
    getRoom,
    deleteRoom,
    addListener,
    removeListener,
    getRoomBySocketId,
    getUserCount,
};
