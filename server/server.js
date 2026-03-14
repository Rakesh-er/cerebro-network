/**
 * Cerebro Code Red Synchronizer — Server Entry Point
 * Express + Socket.io real-time video synchronization server.
 */

require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const { SOCKET_CONFIG, PORT } = require('./config/socketConfig');
const { registerSocketHandlers } = require('./socket/socketHandler');

// ── Express App ────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'Cerebro Code Red Synchronizer',
        status: 'ONLINE',
        timestamp: new Date().toISOString(),
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

// ── HTTP + Socket.io Server ────────────────────────────────────────
const server = http.createServer(app);
const io = new Server(server, SOCKET_CONFIG);

// Register all socket event handlers
registerSocketHandlers(io);

// ── Start Server ───────────────────────────────────────────────────
server.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║   CEREBRO CODE RED SYNCHRONIZER — SERVER    ║');
    console.log('╠══════════════════════════════════════════════╣');
    console.log(`║   Status:  ONLINE                           ║`);
    console.log(`║   Port:    ${String(PORT).padEnd(33)}║`);
    console.log(`║   Time:    ${new Date().toISOString().padEnd(33)}║`);
    console.log('╚══════════════════════════════════════════════╝');
    console.log('');
});
