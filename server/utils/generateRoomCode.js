/**
 * Generates a 6-character room code.
 * Avoids ambiguous characters (0/O, 1/I/L).
 */

const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateRoomCode() {
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += CHARS[Math.floor(Math.random() * CHARS.length)];
    }
    return code;
}

module.exports = { generateRoomCode };
