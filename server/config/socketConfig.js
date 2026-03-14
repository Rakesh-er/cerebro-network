/**
 * Socket.io server configuration.
 */

const SOCKET_CONFIG = {
    cors: {
        origin: [
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:3000',
            'http://127.0.0.1:5173',
        ],
        methods: ['GET', 'POST'],
        credentials: true,
    },
    pingTimeout: 30000,
    pingInterval: 10000,
    transports: ['websocket', 'polling'],
    maxHttpBufferSize: 10 * 1024 * 1024, // 10 MB — needed for video chunk relay
};

const PORT = process.env.PORT || 5000;

module.exports = { SOCKET_CONFIG, PORT };
