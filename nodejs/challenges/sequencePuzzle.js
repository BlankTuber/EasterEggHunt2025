/**
 * Sequence Puzzle Challenge Handler
 * 
 * First major convergence challenge where all five participants must 
 * coordinate their movements across devices.
 * 
 * Each player controls one piece of the puzzle. They must guide their pieces
 * to their designated sanctuaries without collision.
 */

let io;

// Initialize the challenge handler
function initialize(socketIo) {
  io = socketIo;
}

// Challenge state for each room
const roomStates = {};

// Initialize board configuration
function initializeBoard(numPlayers) {
  // Board size
  const boardSize = 10;
  
  // Generate player start positions (on opposite sides of the board)
  const startPositions = [];
  const goalPositions = [];
  
  for (let i = 0; i < numPlayers; i++) {
    // Position players around the perimeter
    let startX, startY, goalX, goalY;
    
    if (i < 2) {
      // Players on left/right sides
      startX = i === 0 ? 0 : boardSize - 1;
      startY = Math.floor(boardSize / 2) - 1 + (i % 2);
      
      goalX = i === 0 ? boardSize - 1 : 0;
      goalY = startY;
    } else {
      // Players on top/bottom sides
      startX = Math.floor(boardSize / 2) - 1 + (i % 2);
      startY = i === 2 ? 0 : boardSize - 1;
      
      goalX = startX;
      goalY = i === 2 ? boardSize - 1 : 0;
    }
    
    startPositions.push({ x: startX, y: startY });
    goalPositions.push({ x: goalX, y: goalY });
  }
  
  // Define obstacles (some random walls)
  const obstacles = [];
  
  // Add some fixed obstacles to make it challenging
  for (let i = 0; i < 5; i++) {
    const x = 2 + i * 2;
    obstacles.push({ x, y: 3 });
    obstacles.push({ x, y: 6 });
  }
  
  return {
    boardSize,
    startPositions,
    goalPositions,
    obstacles,
    currentPositions: [...startPositions],
    playerTurn: 0,
    movesHistory: [],
    completedPlayers: []
  };
}

// Handle a user joining the challenge
function onJoin(socket, data) {
  const { userId, roomId, users } = data;
  
  // Initialize room state if not exists
  if (!roomStates[roomId]) {
    roomStates[roomId] = {
      board: initializeBoard(5), // 5 players for this challenge
      playerIndex: {}, // Maps userId to player index
      ready: {}
    };
    
    // Assign player indices (based on order of joining)
    for (let i = 0; i < users.length; i++) {
      roomStates[roomId].playerIndex[users[i]] = i;
    }
  }
  
  // Get player index
  const playerIndex = roomStates[roomId].playerIndex[userId];
  
  // Send initial game state to the user
  socket.emit('sequence_puzzle_init', {
    board: roomStates[roomId].board,
    playerIndex,
    players: users,
    message: `You are Player ${playerIndex + 1}. You control the piece at position ${JSON.stringify(roomStates[roomId].board.currentPositions[playerIndex])}.`
  });
  
  // Let everyone know a player has joined
  io.to(roomId).emit('sequence_puzzle_player_joined', {
    userId,
    playerIndex,
    totalPlayers: users.length,
    currentTurn: roomStates[roomId].board.playerTurn
  });
}

// Check if a move is valid
function isValidMove(roomId, playerIndex, direction) {
  const state = roomStates[roomId];
  const board = state.board;
  const currentPos = board.currentPositions[playerIndex];
  
  // Check if it's this player's turn
  if (board.playerTurn !== playerIndex) {
    return { valid: false, reason: "Not your turn" };
  }
  
  // Calculate new position
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
    default:
      return { valid: false, reason: "Invalid direction" };
  }
  
  // Check board boundaries
  if (newX < 0 || newX >= board.boardSize || newY < 0 || newY >= board.boardSize) {
    return { valid: false, reason: "Out of bounds" };
  }
  
  // Check collision with obstacles
  if (board.obstacles.some(obs => obs.x === newX && obs.y === newY)) {
    return { valid: false, reason: "Obstacle in the way" };
  }
  
  // Check collision with other players
  if (board.currentPositions.some((pos, idx) => {
    return idx !== playerIndex && pos.x === newX && pos.y === newY;
  })) {
    return { valid: false, reason: "Another player is in that position" };
  }
  
  // Position is valid
  return { 
    valid: true,
    newPosition: { x: newX, y: newY } 
  };
}

// Check if player has reached goal
function checkGoalReached(roomId, playerIndex) {
  const state = roomStates[roomId];
  const board = state.board;
  const currentPos = board.currentPositions[playerIndex];
  const goalPos = board.goalPositions[playerIndex];
  
  return currentPos.x === goalPos.x && currentPos.y === goalPos.y;
}

// Check if all players have completed the challenge
function checkAllCompleted(roomId) {
  const state = roomStates[roomId];
  return state.board.completedPlayers.length === state.board.startPositions.length;
}

// Handle user actions
function onAction(socket, data) {
  const { userId, roomId, action, payload } = data;
  
  if (!roomStates[roomId] || !(userId in roomStates[roomId].playerIndex)) {
    socket.emit('error', { message: "Room not initialized or player not registered" });
    return;
  }
  
  const playerIndex = roomStates[roomId].playerIndex[userId];
  
  switch (action) {
    case 'ready':
      // Mark player as ready
      roomStates[roomId].ready[userId] = true;
      
      // Check if all players are ready
      const allReady = Object.keys(roomStates[roomId].playerIndex).every(id => 
        roomStates[roomId].ready[id]
      );
      
      if (allReady) {
        // Start the game - player 0 goes first
        io.to(roomId).emit('sequence_puzzle_start', {
          board: roomStates[roomId].board,
          currentTurn: 0
        });
      } else {
        // Notify room about player readiness
        io.to(roomId).emit('sequence_puzzle_player_ready', {
          userId,
          playerIndex,
          readyCount: Object.keys(roomStates[roomId].ready).length,
          totalPlayers: Object.keys(roomStates[roomId].playerIndex).length
        });
      }
      break;
      
    case 'move':
      // Handle player move
      const direction = payload.direction;
      const moveResult = isValidMove(roomId, playerIndex, direction);
      
      if (moveResult.valid) {
        // Update player position
        roomStates[roomId].board.currentPositions[playerIndex] = moveResult.newPosition;
        
        // Add to moves history
        roomStates[roomId].board.movesHistory.push({
          player: playerIndex,
          from: data.currentPositions[playerIndex],
          to: moveResult.newPosition,
          direction
        });
        
        // Check if reached goal
        const goalReached = checkGoalReached(roomId, playerIndex);
        if (goalReached && !roomStates[roomId].board.completedPlayers.includes(playerIndex)) {
          roomStates[roomId].board.completedPlayers.push(playerIndex);
        }
        
        // Next player's turn (skip completed players)
        let nextTurn = (playerIndex + 1) % roomStates[roomId].board.startPositions.length;
        while (roomStates[roomId].board.completedPlayers.includes(nextTurn)) {
          nextTurn = (nextTurn + 1) % roomStates[roomId].board.startPositions.length;
          
          // If we've checked all players, all must be complete
          if (nextTurn === playerIndex) {
            break;
          }
        }
        
        roomStates[roomId].board.playerTurn = nextTurn;
        
        // Broadcast move to room
        io.to(roomId).emit('sequence_puzzle_move', {
          playerIndex,
          newPosition: moveResult.newPosition,
          nextTurn,
          goalReached,
          completedPlayers: roomStates[roomId].board.completedPlayers
        });
        
        // Check if all players completed
        if (checkAllCompleted(roomId)) {
          io.to(roomId).emit('sequence_puzzle_complete', {
            message: "Congratulations! All players have reached their goals.",
            movesHistory: roomStates[roomId].board.movesHistory
          });
        }
      } else {
        // Invalid move
        socket.emit('sequence_puzzle_invalid_move', {
          reason: moveResult.reason
        });
      }
      break;
      
    default:
      // For any other action, just broadcast to room
      socket.to(roomId).emit('sequence_puzzle_action', {
        userId,
        playerIndex,
        action,
        payload
      });
  }
}

// Handle challenge completion
function onComplete(socket, data) {
  const { userId, roomId } = data;
  
  // Clean up room state
  delete roomStates[roomId];
  
  // Broadcast completion to room
  io.to(roomId).emit('sequence_puzzle_challenge_completed', {
    userId,
    message: "The sequence puzzle has been completed. The paths to the five provinces have been revealed!"
  });
  
  return Promise.resolve(true);
}

module.exports = {
  initialize,
  onJoin,
  onAction,
  onComplete
};