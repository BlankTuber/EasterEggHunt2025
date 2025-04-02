class GameRoom {
    constructor(id, maxPlayers) {
        this.id = id;
        this.maxPlayers = maxPlayers;
        this.players = new Map(); // Maps socketId to player object
        this.gameState = {
            status: "waiting", // waiting, playing, finished
            currentRound: 0,
            gameData: null,
        };
    }

    addPlayer(socketId, playerName) {
        if (this.isFull()) {
            return null;
        }

        const player = {
            id: socketId,
            name: playerName,
            isReady: false,
            joinTime: Date.now(),
        };

        this.players.set(socketId, player);
        return player;
    }

    removePlayer(socketId) {
        const player = this.players.get(socketId);
        if (player) {
            this.players.delete(socketId);
            return player.name;
        }
        return null;
    }

    getPlayers() {
        return Array.from(this.players.values());
    }

    isFull() {
        return this.players.size >= this.maxPlayers;
    }

    isEmpty() {
        return this.players.size === 0;
    }

    getGameState() {
        return {
            ...this.gameState,
            players: this.getPlayers(),
        };
    }

    startGame() {
        this.gameState.status = "playing";
        this.gameState.currentRound = 1;
        // To be implemented by subclasses
    }

    endGame() {
        this.gameState.status = "finished";
        // To be implemented by subclasses
    }

    resetGame() {
        this.gameState.status = "waiting";
        this.gameState.currentRound = 0;
        this.gameState.gameData = null;
        // To be implemented by subclasses
    }

    setupSocketEvents(socket, io) {
        // To be implemented by subclasses
    }

    handleAction(socketId, action) {
        // To be implemented by subclasses
        return null;
    }
}

module.exports = GameRoom;
