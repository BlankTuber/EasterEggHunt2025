/**
 * Sequence Puzzle Challenge
 * 
 * First major convergence challenge for all five champions
 * Each player controls one piece and must coordinate to avoid collisions
 */

let gameBoard = null;
let playerIndex = -1;
let currentTurn = -1;
let boardSize = 10;
let completedPlayers = [];

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the challenge interface
    const challengeContainer = document.getElementById('convergence-challenge');
    if (!challengeContainer) return;
    
    // Set up initial UI
    setupSequenceInterface(challengeContainer);
    
    // Socket.io event listeners for this challenge type
    if (socket) {
        // Initialization
        socket.on('sequence_puzzle_init', (data) => {
            console.log('Sequence Puzzle initialized:', data);
            
            // Store data
            playerIndex = data.playerIndex;
            boardSize = data.board.boardSize;
            gameBoard = data.board;
            
            // Update UI
            updateGameStatus(data.message);
            initializeBoard(data.board);
        });
        
        // Player joined event
        socket.on('sequence_puzzle_player_joined', (data) => {
            updatePlayerStatus(data.playerIndex, data.userId);
        });
        
        // Player ready event
        socket.on('sequence_puzzle_player_ready', (data) => {
            updateReadyCount(data.readyCount, data.totalPlayers);
        });
        
        // Game start event
        socket.on('sequence_puzzle_start', (data) => {
            startGame(data.board, data.currentTurn);
        });
        
        // Move event
        socket.on('sequence_puzzle_move', (data) => {
            handlePlayerMove(data.playerIndex, data.newPosition, data.nextTurn, data.goalReached, data.completedPlayers);
        });
        
        // Invalid move event
        socket.on('sequence_puzzle_invalid_move', (data) => {
            showInvalidMoveMessage(data.reason);
        });
        
        // Puzzle complete event
        socket.on('sequence_puzzle_complete', (data) => {
            puzzleCompleted(data);
        });
    }
});

/**
 * Set up the sequence puzzle interface
 */
function setupSequenceInterface(container) {
    container.innerHTML = `
        <div class="sequence-container">
            <div class="card mb-4">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Sequence Puzzle</h5>
                    <div id="current-turn" class="badge bg-secondary">Waiting for players</div>
                </div>
                <div class="card-body">
                    <div class="game-status alert alert-info mb-4">
                        <p class="mb-0">Waiting for all players to be ready...</p>
                    </div>
                    
                    <div id="board-container" class="board-container mb-4">
                        <!-- Game board will be rendered here -->
                    </div>
                    
                    <div class="player-controls mb-4" style="display: none;">
                        <div class="d-flex gap-2 justify-content-center">
                            <button class="btn btn-outline-primary" data-direction="up">
                                <i class="bi bi-arrow-up"></i>
                            </button>
                        </div>
                        <div class="d-flex gap-2 justify-content-center my-2">
                            <button class="btn btn-outline-primary" data-direction="left">
                                <i class="bi bi-arrow-left"></i>
                            </button>
                            <button class="btn btn-outline-primary" data-direction="right">
                                <i class="bi bi-arrow-right"></i>
                            </button>
                        </div>
                        <div class="d-flex gap-2 justify-content-center">
                            <button class="btn btn-outline-primary" data-direction="down">
                                <i class="bi bi-arrow-down"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="player-legend">
                        <h6>Players</h6>
                        <div class="d-flex gap-3 flex-wrap" id="player-statuses">
                            <!-- Player statuses will be rendered here -->
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="puzzle-solved-card" class="card mb-4" style="display: none;">
                <div class="card-header bg-success text-white">
                    <h5 class="mb-0">Puzzle Solved!</h5>
                </div>
                <div class="card-body">
                    <p id="puzzle-solved-message"></p>
                </div>
            </div>
        </div>
    `;
    
    // Set up movement controls
    const controls = container.querySelectorAll('.player-controls button');
    controls.forEach(button => {
        button.addEventListener('click', function() {
            const direction = this.dataset.direction;
            movePlayer(direction);
        });
    });
    
    // Signal that we're ready for the challenge
    if (socket && isConnected) {
        setTimeout(() => {
            socket.emit('challenge_action', {
                action: 'ready',
                payload: {}
            });
        }, 1000);
    }
}

/**
 * Update game status message
 */
function updateGameStatus(message) {
    const statusEl = document.querySelector('.game-status p');
    if (statusEl) {
        statusEl.textContent = message;
    }
}

/**
 * Update player status in the UI
 */
function updatePlayerStatus(index, userId) {
    const playerStatusesEl = document.getElementById('player-statuses');
    
    // Check if player status element already exists
    let playerStatusEl = document.querySelector(`.player-status[data-player-index="${index}"]`);
    
    if (!playerStatusEl) {
        // Create new player status element
        playerStatusEl = document.createElement('div');
        playerStatusEl.className = 'player-status';
        playerStatusEl.dataset.playerIndex = index;
        
        // Get player color
        const playerColor = getPlayerColor(index);
        
        playerStatusEl.innerHTML = `
            <div class="player-marker" style="background-color: ${playerColor};"></div>
            <span>Player ${index + 1}</span>
        `;
        
        playerStatusesEl.appendChild(playerStatusEl);
    }
    
    // Update player name if user ID is provided
    if (userId) {
        playerStatusEl.querySelector('span').textContent = `Player ${index + 1} (${userId})`;
    }
    
    // Highlight if it's the current player
    if (index === playerIndex) {
        playerStatusEl.classList.add('current-player');
    }
}

/**
 * Update ready count
 */
function updateReadyCount(readyCount, totalPlayers) {
    updateGameStatus(`${readyCount} of ${totalPlayers} players ready`);
    
    if (readyCount === totalPlayers) {
        updateGameStatus('All players ready! Starting game...');
    }
}

/**
 * Initialize the game board
 */
function initializeBoard(board) {
    const boardContainerEl = document.getElementById('board-container');
    
    // Create board grid
    const boardEl = document.createElement('div');
    boardEl.className = 'board';
    boardEl.style.gridTemplateColumns = `repeat(${board.boardSize}, 1fr)`;
    boardEl.style.gridTemplateRows = `repeat(${board.boardSize}, 1fr)`;
    
    // Create cells
    for (let y = 0; y < board.boardSize; y++) {
        for (let x = 0; x < board.boardSize; x++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.x = x;
            cell.dataset.y = y;
            
            // Check if this is a player's start position
            const playerAtPosition = board.startPositions.findIndex(pos => pos.x === x && pos.y === y);
            if (playerAtPosition !== -1) {
                cell.classList.add('player-start');
                cell.dataset.player = playerAtPosition;
                
                // Add player marker
                const playerMarker = document.createElement('div');
                playerMarker.className = 'player-marker';
                playerMarker.dataset.player = playerAtPosition;
                playerMarker.style.backgroundColor = getPlayerColor(playerAtPosition);
                cell.appendChild(playerMarker);
            }
            
            // Check if this is a player's goal position
            const playerGoalAtPosition = board.goalPositions.findIndex(pos => pos.x === x && pos.y === y);
            if (playerGoalAtPosition !== -1) {
                cell.classList.add('player-goal');
                cell.dataset.playerGoal = playerGoalAtPosition;
                
                // Add goal indicator
                const goalIndicator = document.createElement('div');
                goalIndicator.className = 'goal-indicator';
                goalIndicator.style.borderColor = getPlayerColor(playerGoalAtPosition);
                cell.appendChild(goalIndicator);
            }
            
            // Check if this is an obstacle
            const isObstacle = board.obstacles.some(obs => obs.x === x && obs.y === y);
            if (isObstacle) {
                cell.classList.add('obstacle');
            }
            
            boardEl.appendChild(cell);
        }
    }
    
    // Clear board container and add the new board
    boardContainerEl.innerHTML = '';
    boardContainerEl.appendChild(boardEl);
    
    // Add some basic CSS for the board
    const style = document.createElement('style');
    style.textContent = `
        .board {
            display: grid;
            gap: 2px;
            background-color: #ccc;
            padding: 2px;
            border-radius: 4px;
            width: 100%;
            max-width: 400px;
            margin: 0 auto;
        }
        
        .cell {
            aspect-ratio: 1/1;
            background-color: #fff;
            border-radius: 2px;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .player-marker {
            width: 80%;
            height: 80%;
            border-radius: 50%;
            z-index: 2;
        }
        
        .goal-indicator {
            width: 90%;
            height: 90%;
            border: 2px dashed;
            border-radius: 50%;
            position: absolute;
            z-index: 1;
        }
        
        .obstacle {
            background-color: #333;
        }
        
        .player-status {
            display: flex;
            align-items: center;
            gap: 5px;
            padding: 5px 10px;
            border-radius: 4px;
            background-color: #f8f9fa;
        }
        
        .player-status .player-marker {
            width: 15px;
            height: 15px;
        }
        
        .current-player {
            font-weight: bold;
            border: 1px solid #333;
        }
        
        .completed-player {
            background-color: #d4edda;
        }
    `;
    document.head.appendChild(style);
}

/**
 * Get color for a player based on index
 */
function getPlayerColor(index) {
    const colors = ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00'];
    return colors[index % colors.length];
}

/**
 * Start the game
 */
function startGame(board, turn) {
    gameBoard = board;
    currentTurn = turn;
    
    // Update UI
    updateGameStatus('Game started! Wait for your turn to move.');
    updateTurnIndicator();
    
    // Show player controls
    const controlsEl = document.querySelector('.player-controls');
    if (controlsEl) {
        controlsEl.style.display = 'block';
    }
    
    // Update board with current positions
    updateBoardPositions();
}

/**
 * Update turn indicator
 */
function updateTurnIndicator() {
    const turnEl = document.getElementById('current-turn');
    
    if (currentTurn === playerIndex) {
        turnEl.textContent = 'Your Turn';
        turnEl.className = 'badge bg-success';
        updateGameStatus('It\'s your turn! Choose a direction to move.');
        
        // Enable controls
        enableControls(true);
    } else {
        turnEl.textContent = `Player ${currentTurn + 1}'s Turn`;
        turnEl.className = 'badge bg-secondary';
        updateGameStatus(`Waiting for Player ${currentTurn + 1} to move...`);
        
        // Disable controls
        enableControls(false);
    }
}

/**
 * Enable or disable movement controls
 */
function enableControls(enabled) {
    const buttons = document.querySelectorAll('.player-controls button');
    buttons.forEach(button => {
        button.disabled = !enabled;
    });
}

/**
 * Update board with current positions
 */
function updateBoardPositions() {
    if (!gameBoard) return;
    
    // Clear existing player markers
    document.querySelectorAll('.cell .player-marker').forEach(marker => {
        marker.remove();
    });
    
    // Add current player positions
    gameBoard.currentPositions.forEach((pos, index) => {
        // Skip completed players
        if (completedPlayers.includes(index)) return;
        
        const cell = document.querySelector(`.cell[data-x="${pos.x}"][data-y="${pos.y}"]`);
        if (cell) {
            const playerMarker = document.createElement('div');
            playerMarker.className = 'player-marker';
            playerMarker.dataset.player = index;
            playerMarker.style.backgroundColor = getPlayerColor(index);
            cell.appendChild(playerMarker);
        }
    });
}

/**
 * Move player in specified direction
 */
function movePlayer(direction) {
    if (currentTurn !== playerIndex || !gameBoard) return;
    
    // Determine new position
    const currentPos = gameBoard.currentPositions[playerIndex];
    let newX = currentPos.x;
    let newY = currentPos.y;
    
    switch(direction) {
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
    
    // Send move to server
    if (socket && isConnected) {
        socket.emit('challenge_action', {
            action: 'move',
            payload: {
                direction,
                currentPositions: gameBoard.currentPositions
            }
        });
        
        // Disable controls while waiting for response
        enableControls(false);
        updateGameStatus('Moving...');
    }
}

/**
 * Handle a player's move
 */
function handlePlayerMove(playerIdx, newPosition, nextTurn, goalReached, newCompletedPlayers) {
    // Update board state
    gameBoard.currentPositions[playerIdx] = newPosition;
    currentTurn = nextTurn;
    completedPlayers = newCompletedPlayers;
    
    // Update board
    updateBoardPositions();
    
    // Update turn indicator
    updateTurnIndicator();
    
    // Update player status if goal reached
    if (goalReached) {
        const playerStatusEl = document.querySelector(`.player-status[data-player-index="${playerIdx}"]`);
        if (playerStatusEl) {
            playerStatusEl.classList.add('completed-player');
        }
    }
}

/**
 * Show invalid move message
 */
function showInvalidMoveMessage(reason) {
    updateGameStatus(`Invalid move: ${reason}. Try another direction.`);
    
    // Re-enable controls
    enableControls(true);
}

/**
 * Puzzle completed
 */
function puzzleCompleted(data) {
    // Show completed message
    updateGameStatus('Puzzle completed! All players have reached their goals.');
    
    // Disable controls
    enableControls(false);
    
    // Show solved card
    const solvedCard = document.getElementById('puzzle-solved-card');
    solvedCard.style.display = 'block';
    
    // Set message
    document.getElementById('puzzle-solved-message').textContent = data.message;
    
    // Enable the complete challenge button
    const completeBtn = document.getElementById('complete-challenge');
    if (completeBtn) {
        completeBtn.disabled = false;
    }
}