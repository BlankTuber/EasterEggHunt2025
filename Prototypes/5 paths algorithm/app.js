// Server code (app.js)
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Game state
const gridSize = 5;
const maxPlayers = 5;
const players = new Map();
const goalPositions = new Map(); // Map player IDs to their goal positions
let nextPlayerId = 1;
let gameInProgress = false;
let playersReady = new Set();
let winners = new Set();

// Available starting positions
const startPositions = [
    { x: 0, y: 0 },
    { x: 0, y: 4 },
    { x: 4, y: 0 },
    { x: 2, y: 0 },
    { x: 2, y: 4 }
];

// Goal positions (opposite of starting positions)
const availableGoalPositions = [
    { x: 4, y: 4 },
    { x: 4, y: 0 },
    { x: 0, y: 4 },
    { x: 2, y: 4 },
    { x: 2, y: 0 }
];

// Find an available starting position and assign a goal
function getAvailableStartPosition() {
    const usedStartIndices = new Set();
    const usedGoalIndices = new Set();
    
    // Track which positions are already used
    for (const [pid, player] of players.entries()) {
        for (let i = 0; i < startPositions.length; i++) {
            if (player.x === startPositions[i].x && player.y === startPositions[i].y) {
                usedStartIndices.add(i);
            }
        }
        
        const goalPos = goalPositions.get(pid);
        if (goalPos) {
            for (let i = 0; i < availableGoalPositions.length; i++) {
                if (goalPos.x === availableGoalPositions[i].x && goalPos.y === availableGoalPositions[i].y) {
                    usedGoalIndices.add(i);
                }
            }
        }
    }
    
    // Find first available starting position
    for (let i = 0; i < startPositions.length; i++) {
        if (!usedStartIndices.has(i)) {
            // Find a goal position that's not already assigned to someone
            let goalIndex;
            for (let j = 0; j < availableGoalPositions.length; j++) {
                if (!usedGoalIndices.has(j)) {
                    goalIndex = j;
                    break;
                }
            }
            
            if (goalIndex !== undefined) {
                return {
                    startPosition: startPositions[i],
                    goalPosition: availableGoalPositions[goalIndex],
                    startIndex: i,
                    goalIndex: goalIndex
                };
            }
        }
    }
    
    return null; // No available position
}

// Check if a position is valid (not occupied and within bounds)
function isValidMove(newX, newY, playerId) {
    // Check bounds
    if (newX < 0 || newX >= gridSize || newY < 0 || newY >= gridSize) {
        return false;
    }
    
    // Check collisions with other players
    for (const [id, player] of players.entries()) {
        if (id !== playerId && player.x === newX && player.y === newY) {
            return false;
        }
    }
    
    return true;
}

// Broadcast game state to all clients
function broadcastGameState() {
    const gameState = {
        players: Array.from(players.entries()).map(([id, player]) => ({
            id,
            x: player.x,
            y: player.y,
            color: player.color,
            instructions: player.instructions,
            isExecuting: player.isExecuting,
            isReady: playersReady.has(id),
            hasWon: winners.has(id)
        })),
        goalPositions: Array.from(goalPositions.entries()).map(([id, pos]) => ({
            playerId: id,
            x: pos.x,
            y: pos.y
        })),
        gameInProgress,
        readyCount: playersReady.size,
        totalPlayers: players.size,
        winners: Array.from(winners)
    };
    
    const message = JSON.stringify({
        type: 'gameState',
        data: gameState
    });
    
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// Handle WebSocket connections
wss.on('connection', (ws) => {
    // If maximum players reached, reject connection
    if (players.size >= maxPlayers) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Game is full. Please try again later.'
        }));
        ws.close();
        return;
    }
    
    // Assign player ID and starting position
    const playerId = nextPlayerId++;
    const positionInfo = getAvailableStartPosition();
    
    if (!positionInfo) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'No available starting positions.'
        }));
        ws.close();
        return;
    }
    
    // Create player with random color
    const colors = ['#FF5252', '#4CAF50', '#2196F3', '#FFC107', '#9C27B0'];
    const playerColor = colors[(playerId - 1) % colors.length];
    
    players.set(playerId, {
        x: positionInfo.startPosition.x,
        y: positionInfo.startPosition.y,
        color: playerColor,
        instructions: [],
        isExecuting: false,
        startIndex: positionInfo.startIndex
    });
    
    // Assign goal position
    goalPositions.set(playerId, {
        x: positionInfo.goalPosition.x,
        y: positionInfo.goalPosition.y,
        goalIndex: positionInfo.goalIndex
    });
    
    // Send player their ID
    ws.send(JSON.stringify({
        type: 'init',
        playerId
    }));
    
    // Broadcast updated game state
    broadcastGameState();
    
    // Handle messages from clients
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            const player = players.get(data.playerId);
            
            if (!player) return;
            
            switch (data.type) {
                case 'addInstruction':
                    player.instructions.push(data.direction);
                    break;
                    
                case 'clearInstructions':
                    player.instructions = [];
                    break;
                    
                case 'setReady':
                    if (gameInProgress) return;
                    if (player.instructions.length === 0) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'You need to add at least one instruction before getting ready.'
                        }));
                        return;
                    }
                    
                    // Toggle ready status
                    if (playersReady.has(data.playerId)) {
                        playersReady.delete(data.playerId);
                    } else {
                        playersReady.add(data.playerId);
                        
                        // Check if all players are ready
                        if (playersReady.size === players.size && players.size >= 2) {
                            startGameExecution();
                        }
                    }
                    broadcastGameState();
                    break;
                    
                case 'resetGame':
                    if (gameInProgress) return;
                    resetAllPlayers();
                    break;
            }
            
            broadcastGameState();
        } catch (error) {
            console.error('Invalid message:', error);
        }
    });
    
    // Function to start game execution when all players are ready
function startGameExecution() {
    if (gameInProgress || playersReady.size < 2 || playersReady.size !== players.size) return;
    
    gameInProgress = true;
    winners.clear();
    broadcastGameState();
    
    // Reset all players to their starting positions
    for (const [id, player] of players.entries()) {
        const startPos = startPositions[player.startIndex];
        player.x = startPos.x;
        player.y = startPos.y;
        player.isExecuting = true;
    }
    
    // Track player positions at each step
    const playerPositions = new Map();
    const maxInstructionLength = Math.max(...Array.from(players.values()).map(p => p.instructions.length));
    let step = 0;
    
    const executeStep = () => {
        if (step >= maxInstructionLength) {
            finishGameExecution();
            return;
        }
        
        // Clear positions for this step
        playerPositions.clear();
        const collisions = new Set();
        const movesThisStep = new Map();
        
        // Calculate intended moves for each player
        for (const [id, player] of players.entries()) {
            if (step < player.instructions.length) {
                const direction = player.instructions[step];
                let newX = player.x;
                let newY = player.y;
                
                switch (direction) {
                    case 'up':
                        newY--;
                        break;
                    case 'down':
                        newY++;
                        break;
                    case 'left':
                        newX--;
                        break;
                    case 'right':
                        newX++;
                        break;
                }
                
                // Store the intended move
                if (newX >= 0 && newX < gridSize && newY >= 0 && newY < gridSize) {
                    movesThisStep.set(id, { x: newX, y: newY });
                }
            }
        }
        
        // Check for collisions between players' intended positions
        for (const [id1, pos1] of movesThisStep.entries()) {
            const posKey = `${pos1.x},${pos1.y}`;
            
            // Check if another player is already planning to move here
            if (playerPositions.has(posKey)) {
                const id2 = playerPositions.get(posKey);
                collisions.add(id1);
                collisions.add(id2);
            } else {
                playerPositions.set(posKey, id1);
            }
            
            // Check if another player is already at this position
            for (const [id2, player2] of players.entries()) {
                if (id1 !== id2 && player2.x === pos1.x && player2.y === pos1.y) {
                    collisions.add(id1);
                    break;
                }
            }
        }
        
        // Apply valid moves
        for (const [id, pos] of movesThisStep.entries()) {
            if (!collisions.has(id)) {
                const player = players.get(id);
                player.x = pos.x;
                player.y = pos.y;
                
                // Check if player reached their goal
                const goal = goalPositions.get(id);
                if (goal && player.x === goal.x && player.y === goal.y) {
                    winners.add(id);
                }
            }
        }
        
        step++;
        broadcastGameState();
        
        // Schedule next step
        setTimeout(executeStep, 500);
    };
    
    // Start executing steps
    executeStep();
}

// Function to finish game execution
function finishGameExecution() {
    gameInProgress = false;
    playersReady.clear();
    
    for (const player of players.values()) {
        player.isExecuting = false;
    }
    
    broadcastGameState();
}

// Function to reset all players
function resetAllPlayers() {
    playersReady.clear();
    winners.clear();
    
    for (const [id, player] of players.entries()) {
        const startPos = startPositions[player.startIndex];
        player.x = startPos.x;
        player.y = startPos.y;
        player.instructions = [];
        player.isExecuting = false;
    }
    
    broadcastGameState();
}

// Handle disconnections
ws.on('close', () => {
    players.delete(playerId);
    playersReady.delete(playerId);
    
    // If a player disconnects and the game was waiting for them, start if everyone else is ready
    if (!gameInProgress && playersReady.size === players.size && players.size >= 2) {
        startGameExecution();
    }
    
    broadcastGameState();
});
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});