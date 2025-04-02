const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const config = require("./config");
const GameManager = require("./games/GameManager");

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server and Socket.IO instance
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: config.clientOrigin,
        methods: ["GET", "POST"],
    },
});

// Initialize game manager
const gameManager = new GameManager(io);

// Basic route for server health check
app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK" });
});

// Socket.IO connection handling
io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Handle player joining a game
    socket.on("join-game", (data) => {
        gameManager.joinGame(socket, data);
    });

    // Handle player creating a new game
    socket.on("create-game", (data) => {
        gameManager.createGame(socket, data);
    });

    // Handle player disconnection
    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
        gameManager.handleDisconnect(socket);
    });
});

// Start server
server.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
});
