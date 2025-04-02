const GameRoom = require("../GameRoom");
const config = require("../../config");
const maps = require("./maps");

class PuzzleGame extends GameRoom {
    constructor(id) {
        super(id, config.maxPlayersPerRoom.puzzle);
        this.playerMoves = new Map(); // Track player moves
        this.playerPositions = new Map(); // Current positions of player pieces
        this.playerObjectives = new Map(); // Target positions for each player
        this.currentMapIndex = 0;
        this.currentMap = null;
    }

    setupSocketEvents(socket, io) {
        this.io = io; // Store io reference for broadcasts

        // Handle player submitting a move
        socket.on("puzzle-move", (data) => {
            const result = this.registerMove(socket.id, data.move);

            if (result) {
                // Broadcast the result to all players
                this.io.to(this.id).emit("puzzle-update", result);
            }
        });

        // Handle player ready status
        socket.on("puzzle-ready", () => {
            const updatedState = this.setPlayerReady(socket.id);

            if (updatedState) {
                this.io.to(this.id).emit("puzzle-round-started", updatedState);
            }
        });
    }

    startGame() {
        super.startGame();
        this.loadMap(this.currentMapIndex);
        this.assignObjectives();
    }

    loadMap(mapIndex) {
        if (mapIndex >= maps.length) {
            mapIndex = 0;
        }

        this.currentMapIndex = mapIndex;
        this.currentMap = maps[mapIndex];

        this.gameState.gameData = {
            map: this.currentMap.layout,
            width: this.currentMap.width,
            height: this.currentMap.height,
            obstacles: this.currentMap.obstacles,
            level: mapIndex + 1,
        };

        // Reset player positions to starting positions
        this.resetPlayerPositions();
    }

    resetPlayerPositions() {
        this.playerPositions.clear();

        // Assign starting positions
        const startingPositions = this.currentMap.startingPositions;
        const players = this.getPlayers();

        players.forEach((player, index) => {
            if (index < startingPositions.length) {
                this.playerPositions.set(player.id, {
                    x: startingPositions[index].x,
                    y: startingPositions[index].y,
                });
            }
        });
    }

    assignObjectives() {
        this.playerObjectives.clear();

        // Assign objectives (target positions to reach)
        const objectives = this.currentMap.objectives;
        const players = this.getPlayers();

        // Shuffle objectives to randomize assignments
        const shuffledObjectives = [...objectives];
        this.shuffleArray(shuffledObjectives);

        players.forEach((player, index) => {
            if (index < shuffledObjectives.length) {
                this.playerObjectives.set(player.id, {
                    x: shuffledObjectives[index].x,
                    y: shuffledObjectives[index].y,
                });
            }
        });
    }

    setPlayerReady(socketId) {
        const player = this.players.get(socketId);
        if (player) {
            player.isReady = true;

            // Check if all players are ready
            const allReady = Array.from(this.players.values()).every(
                (p) => p.isReady,
            );

            if (allReady) {
                return this.startRound();
            }
        }

        return null;
    }

    startRound() {
        // Reset player readiness
        this.players.forEach((player) => {
            player.isReady = false;
        });

        // Clear moves
        this.playerMoves.clear();

        // Return updated game state
        return this.getGameState();
    }

    registerMove(socketId, move) {
        const player = this.players.get(socketId);
        if (!player) return null;

        // Validate move (should be up, down, left, or right)
        if (!["up", "down", "left", "right"].includes(move)) {
            return null;
        }

        this.playerMoves.set(socketId, move);

        // Check if all players have submitted their moves
        if (this.playerMoves.size === this.players.size) {
            return this.executeMoves();
        }

        return {
            type: "moveReceived",
            player: player.name,
            pendingPlayers: this.getPendingPlayerNames(),
        };
    }

    getPendingPlayerNames() {
        const pendingPlayers = [];
        this.players.forEach((player) => {
            if (!this.playerMoves.has(player.id)) {
                pendingPlayers.push(player.name);
            }
        });
        return pendingPlayers;
    }

    executeMoves() {
        // Calculate new positions based on moves
        const newPositions = new Map();
        const moveDetails = [];

        // First calculate all new positions
        this.playerMoves.forEach((move, playerId) => {
            const player = this.players.get(playerId);
            const currentPos = this.playerPositions.get(playerId);
            if (!currentPos) return;

            const newPos = { ...currentPos };

            switch (move) {
                case "up":
                    newPos.y -= 1;
                    break;
                case "down":
                    newPos.y += 1;
                    break;
                case "left":
                    newPos.x -= 1;
                    break;
                case "right":
                    newPos.x += 1;
                    break;
            }

            newPositions.set(playerId, newPos);

            moveDetails.push({
                playerId,
                playerName: player ? player.name : "Unknown Player",
                move,
                from: currentPos,
                to: newPos,
            });
        });

        // Check for collisions with walls
        for (const [playerId, pos] of newPositions.entries()) {
            // Check boundaries
            if (
                pos.x < 0 ||
                pos.x >= this.currentMap.width ||
                pos.y < 0 ||
                pos.y >= this.currentMap.height
            ) {
                return this.handleCollision("wall", moveDetails);
            }

            // Check obstacles
            if (this.isObstacle(pos.x, pos.y)) {
                return this.handleCollision("obstacle", moveDetails);
            }
        }

        // Check for collisions between players
        const positionStrings = new Set();
        for (const [playerId, pos] of newPositions.entries()) {
            const posString = `${pos.x},${pos.y}`;
            if (positionStrings.has(posString)) {
                return this.handleCollision("player", moveDetails);
            }
            positionStrings.add(posString);
        }

        // Update positions
        newPositions.forEach((newPos, playerId) => {
            this.playerPositions.set(playerId, newPos);
        });

        // Clear moves
        this.playerMoves.clear();

        // Check if any player has reached their objective
        let allObjectivesReached = true;
        this.playerObjectives.forEach((objective, playerId) => {
            const position = this.playerPositions.get(playerId);
            if (
                !position ||
                position.x !== objective.x ||
                position.y !== objective.y
            ) {
                allObjectivesReached = false;
            }
        });

        if (allObjectivesReached) {
            return this.handleLevelComplete(moveDetails);
        }

        // Continue game
        return {
            type: "moveComplete",
            message: "Moves executed successfully",
            moves: moveDetails,
            nextState: this.getGameState(),
        };
    }

    isObstacle(x, y) {
        // Check if position contains an obstacle
        return this.currentMap.obstacles.some(
            (obs) => obs.x === x && obs.y === y,
        );
    }

    handleCollision(collisionType, moveDetails) {
        let message = "";

        switch (collisionType) {
            case "wall":
                message = "A player hit a wall! Starting over.";
                break;
            case "obstacle":
                message = "A player hit an obstacle! Starting over.";
                break;
            case "player":
                message = "Players collided! Starting over.";
                break;
        }

        // Reset player positions
        this.resetPlayerPositions();
        this.playerMoves.clear();

        return {
            type: "collision",
            collisionType,
            message,
            moves: moveDetails,
            nextState: this.getGameState(),
        };
    }

    handleLevelComplete(moveDetails) {
        // Move to next level
        this.currentMapIndex++;

        if (this.currentMapIndex >= maps.length) {
            // All levels complete, game won!
            this.gameState.status = "finished";

            return {
                type: "gameComplete",
                message: "Congratulations! You completed all levels!",
                moves: moveDetails,
                nextState: this.getGameState(),
            };
        } else {
            // Load next level
            this.loadMap(this.currentMapIndex);
            this.assignObjectives();

            return {
                type: "levelComplete",
                message: `Level ${this.currentMapIndex} complete! Moving to next level.`,
                moves: moveDetails,
                nextState: this.getGameState(),
            };
        }
    }

    getGameState() {
        const baseState = super.getGameState();

        // Add player positions and objectives
        const fullState = {
            ...baseState,
            playerPositions: Object.fromEntries(this.playerPositions),
            playerObjectives: Object.fromEntries(this.playerObjectives),
        };

        return fullState;
    }

    // Utility method to shuffle an array
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}

module.exports = PuzzleGame;
