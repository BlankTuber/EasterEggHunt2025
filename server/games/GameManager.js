const RoomManager = require("./RoomManager");
const TriviaGame = require("./trivia/TriviaGame");
const PuzzleGame = require("./puzzle/PuzzleGame");

class GameManager {
    constructor(io) {
        this.io = io;
        this.roomManager = new RoomManager();
        this.playerRooms = new Map(); // Maps socketId to roomId

        // Register game types
        this.gameTypes = {
            trivia: TriviaGame,
            puzzle: PuzzleGame,
        };
    }

    createGame(socket, data) {
        const { gameType, playerName } = data;

        if (!this.gameTypes[gameType]) {
            socket.emit("error", { message: `Invalid game type: ${gameType}` });
            return;
        }

        // Create a new room
        const room = this.roomManager.createRoom(
            gameType,
            this.gameTypes[gameType],
        );

        // Add player to room
        this.addPlayerToRoom(socket, room.id, playerName);

        // Emit room details back to the client
        socket.emit("game-created", {
            roomId: room.id,
            gameType,
            players: room.getPlayers(),
        });
    }

    joinGame(socket, data) {
        const { roomId, playerName } = data;

        // Check if room exists
        const room = this.roomManager.getRoom(roomId);
        if (!room) {
            socket.emit("error", { message: `Room not found: ${roomId}` });
            return;
        }

        // Add player to room
        const joinResult = this.addPlayerToRoom(socket, roomId, playerName);

        if (!joinResult.success) {
            socket.emit("error", { message: joinResult.message });
            return;
        }

        // Emit updated room details to all players in the room
        this.io.to(roomId).emit("player-joined", {
            players: room.getPlayers(),
            message: `${playerName} joined the game`,
        });

        // Check if the room is full and game can start
        if (room.isFull()) {
            room.startGame();
            this.io.to(roomId).emit("game-started", room.getGameState());
        }
    }

    addPlayerToRoom(socket, roomId, playerName) {
        const room = this.roomManager.getRoom(roomId);

        if (!room) {
            return { success: false, message: `Room not found: ${roomId}` };
        }

        // Check if room is full
        if (room.isFull()) {
            return { success: false, message: "Room is full" };
        }

        // Join the room's Socket.IO room
        socket.join(roomId);

        // Add player to the game room
        const player = room.addPlayer(socket.id, playerName);

        // Map socket ID to room ID
        this.playerRooms.set(socket.id, roomId);

        // Setup game-specific event handlers
        this.setupGameEvents(socket, room);

        return { success: true, player };
    }

    handleDisconnect(socket) {
        const roomId = this.playerRooms.get(socket.id);
        if (!roomId) return;

        const room = this.roomManager.getRoom(roomId);
        if (!room) return;

        // Remove player from room
        const playerName = room.removePlayer(socket.id);

        // Remove from tracking map
        this.playerRooms.delete(socket.id);

        // Notify other players
        if (playerName) {
            this.io.to(roomId).emit("player-left", {
                players: room.getPlayers(),
                message: `${playerName} left the game`,
            });
        }

        // If room is empty, destroy it
        if (room.isEmpty()) {
            this.roomManager.destroyRoom(roomId);
        }
    }

    setupGameEvents(socket, room) {
        // Generic game events
        socket.on("game-action", (data) => {
            const roomId = this.playerRooms.get(socket.id);
            if (!roomId) return;

            const room = this.roomManager.getRoom(roomId);
            if (!room) return;

            const result = room.handleAction(socket.id, data);

            if (result) {
                // Broadcast the result to all players in the room
                this.io.to(roomId).emit("game-update", result);
            }
        });

        // Add game-specific event listeners
        room.setupSocketEvents(socket, this.io);
    }
}

module.exports = GameManager;
