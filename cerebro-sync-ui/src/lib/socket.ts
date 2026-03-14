/**
 * Socket.io client singleton instance.
 * Connects to the backend sync server via VITE_SOCKET_SERVER_URL env var.
 */
import { io, Socket } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SOCKET_SERVER_URL || 'https://cerebro-network.onrender.com';

export const socket: Socket = io(SERVER_URL, {
    autoConnect: false,          // We connect manually via the hook
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    transports: ['websocket', 'polling'],
});

export default socket;
