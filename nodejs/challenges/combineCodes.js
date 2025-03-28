/**
 * Combine Codes Challenge Handler
 * 
 * Final convergence challenge where all five champions must
 * combine their individual code segments to create a master code.
 */

let io;

// Initialize the challenge handler
function initialize(socketIo) {
  io = socketIo;
}

// Challenge state for each room
const roomStates = {};

// Code templates for different roles
const roleCodeTemplates = {
  navigator: {
    type: "numerical",
    description: "A sequence of numbers revealed through star positions",
    codeLength: 5,
    examples: ["42973", "18265", "37520", "91634"]
  },
  sage: {
    type: "textual",
    description: "Ancient words of power from forgotten texts",
    codeLength: 6,
    examples: ["MYSTIC", "ARCANE", "WISDOM", "ENERGY"]
  },
  chronicler: {
    type: "symbolic",
    description: "Esoteric symbols found in historical records",
    codeLength: 4,
    examples: ["§¥∞≈", "†‡∆∂", "©®™∑", "µπΩ∫"]
  },
  craftsman: {
    type: "structural",
    description: "Architectural patterns that form a blueprint",
    codeLength: 5,
    examples: ["TRUSS", "VAULT", "ARCH", "PILLAR"]
  },
  apprentice: {
    type: "chromatic",
    description: "A sequence of colors that forms a pattern",
    codeLength: 6,
    examples: ["RGBYCM", "YMCBGR", "MYBRCG", "CGRBMY"]
  }
};

// Generate a random code for a role
function generateRoleCode(role) {
  const template = roleCodeTemplates[role];
  
  if (!template) {
    return null;
  }
  
  return template.examples[Math.floor(Math.random() * template.examples.length)];
}

// Check if codes form a valid master code
function validateMasterCode(codes) {
  // Ensure all five codes are present
  const requiredRoles = ['navigator', 'sage', 'chronicler', 'craftsman', 'apprentice'];
  
  for (const role of requiredRoles) {
    if (!codes[role]) {
      return false;
    }
  }
  
  // Check for code interlock pattern - the last character of one code
  // should match with the first character of the next code
  const sequence = ['navigator', 'sage', 'chronicler', 'craftsman', 'apprentice'];
  
  for (let i = 0; i < sequence.length; i++) {
    const currentRole = sequence[i];
    const nextRole = sequence[(i + 1) % sequence.length];
    
    const currentCode = codes[currentRole];
    const nextCode = codes[nextRole];
    
    const lastChar = currentCode[currentCode.length - 1].toUpperCase();
    const firstChar = nextCode[0].toUpperCase();
    
    // For symbolic codes, we just check if they're in the right position
    if (currentRole === 'chronicler' || nextRole === 'chronicler') {
      continue;
    }
    
    if (lastChar !== firstChar) {
      return false;
    }
  }
  
  return true;
}

// Handle a user joining the challenge
function onJoin(socket, data) {
  const { userId, roomId, users } = data;
  
  // Initialize room state if not exists
  if (!roomStates[roomId]) {
    roomStates[roomId] = {
      userRoles: {},
      userCodes: {},
      userReady: {},
      attempts: [],
      started: false,
      completed: false,
      messages: []
    };
    
    // Assign roles based on user IDs or names
    if (users.length >= 5) {
      // Try to assign roles based on user IDs/names
      const navigatorUser = users.find(u => u.toLowerCase().includes('navigator'));
      const sageUser = users.find(u => u.toLowerCase().includes('sage'));
      const chroniclerUser = users.find(u => u.toLowerCase().includes('chronicler'));
      const craftsmanUser = users.find(u => u.toLowerCase().includes('craftsman'));
      const apprenticeUser = users.find(u => u.toLowerCase().includes('apprentice'));
      
      // If we can identify all roles, assign them
      if (navigatorUser && sageUser && chroniclerUser && craftsmanUser && apprenticeUser) {
        roomStates[roomId].userRoles[navigatorUser] = 'navigator';
        roomStates[roomId].userRoles[sageUser] = 'sage';
        roomStates[roomId].userRoles[chroniclerUser] = 'chronicler';
        roomStates[roomId].userRoles[craftsmanUser] = 'craftsman';
        roomStates[roomId].userRoles[apprenticeUser] = 'apprentice';
      } else {
        // Otherwise assign randomly
        const shuffledUsers = [...users].sort(() => 0.5 - Math.random());
        const roles = ['navigator', 'sage', 'chronicler', 'craftsman', 'apprentice'];
        
        for (let i = 0; i < Math.min(shuffledUsers.length, roles.length); i++) {
          roomStates[roomId].userRoles[shuffledUsers[i]] = roles[i];
        }
      }
      
      // Generate codes for each role
      Object.entries(roomStates[roomId].userRoles).forEach(([id, role]) => {
        roomStates[roomId].userCodes[id] = generateRoleCode(role);
        roomStates[roomId].userReady[id] = false;
      });
    }
  }
  
  // Get user's role and code
  const role = roomStates[roomId].userRoles[userId] || 'observer';
  const code = roomStates[roomId].userCodes[userId];
  
  // Send initial state to the user
  socket.emit('combine_codes_init', {
    userId,
    role,
    code,
    codeDescription: role !== 'observer' ? roleCodeTemplates[role].description : null,
    codeType: role !== 'observer' ? roleCodeTemplates[role].type : null,
    roomName: "The Chamber of Unity",
    roomDescription: "A circular room with a domed ceiling displaying constellations from across the realm. At the center stands a pedestal with five interfaces, each corresponding to a different type of code or cipher."
  });
  
  // Notify room that a new user has joined
  io.to(roomId).emit('combine_codes_user_joined', {
    userId,
    role,
    totalUsers: users.length
  });
}

// Start the combine codes challenge
function startChallenge(roomId) {
  const state = roomStates[roomId];
  state.started = true;
  
  // Send the challenge details to all players
  io.to(roomId).emit('combine_codes_start', {
    message: "Your final challenge requires perfect harmony. Each of you has discovered a piece of a greater code during your journey. Only by combining these codes in the correct sequence can you unlock the power of the Egg of Creation.",
    hint: "The five code segments must interlock, with each code connecting to the next in the sequence: Navigator, Sage, Chronicler, Craftsman, Apprentice, and back to Navigator."
  });
}

// Handle user actions
function onAction(socket, data) {
  const { userId, roomId, action, payload } = data;
  
  if (!roomStates[roomId]) {
    socket.emit('error', { message: "Room not initialized" });
    return;
  }
  
  const state = roomStates[roomId];
  const role = state.userRoles[userId];
  
  switch (action) {
    case 'ready':
      // Mark player as ready
      state.userReady[userId] = true;
      
      // Check if all players are ready
      const allReady = Object.entries(state.userRoles)
        .filter(([_, r]) => r !== 'observer')
        .every(([id, _]) => state.userReady[id]);
      
      // Notify room about player readiness
      io.to(roomId).emit('combine_codes_user_ready', {
        userId,
        role,
        readyCount: Object.values(state.userReady).filter(ready => ready).length,
        totalPlayers: Object.entries(state.userRoles).filter(([_, r]) => r !== 'observer').length
      });
      
      // Start if all players are ready
      if (allReady && !state.started) {
        startChallenge(roomId);
      }
      break;
      
    case 'share_code':
      // Player shares their code with others
      if (state.started && !state.completed && role !== 'observer') {
        const code = state.userCodes[userId];
        
        if (!code) {
          socket.emit('error', { message: "No code found for your role" });
          return;
        }
        
        // Broadcast the shared code
        io.to(roomId).emit('combine_codes_shared', {
          userId,
          role,
          code,
          codeType: roleCodeTemplates[role].type,
          description: roleCodeTemplates[role].description
        });
      }
      break;
      
    case 'submit_master_code':
      // Players submit their attempt at the master code
      if (state.started && !state.completed && payload.codes) {
        const submittedCodes = payload.codes;
        
        // Record the attempt
        state.attempts.push({
          userId,
          role,
          codes: submittedCodes,
          timestamp: new Date().toISOString()
        });
        
        // Validate the master code
        const isValid = validateMasterCode(submittedCodes);
        
        if (isValid) {
          // Success! The master code is correct
          state.completed = true;
          
          io.to(roomId).emit('combine_codes_success', {
            message: "The combined codes have unlocked the power of the Egg of Creation! A projection appears, revealing a map to the true egg in your own world.",
            submittedBy: userId,
            role,
            masterCode: submittedCodes
          });
        } else {
          // Incorrect combination
          socket.emit('combine_codes_incorrect', {
            message: "The codes do not align properly. Check the sequence and ensure all codes are correctly entered.",
            attempt: state.attempts.length
          });
          
          // Share attempt with others
          socket.to(roomId).emit('combine_codes_attempt_failed', {
            userId,
            role,
            attemptNumber: state.attempts.length
          });
          
          // Provide hints based on number of attempts
          if (state.attempts.length === 3) {
            io.to(roomId).emit('combine_codes_hint', {
              message: "Remember, the codes must be arranged in the order of your journey: Navigator, Sage, Chronicler, Craftsman, Apprentice."
            });
          } else if (state.attempts.length === 5) {
            io.to(roomId).emit('combine_codes_hint', {
              message: "Look for connections between your codes. The last character of one code should match the first character of the next code in the sequence."
            });
          } else if (state.attempts.length === 7) {
            io.to(roomId).emit('combine_codes_hint', {
              message: "The symbolic code of the Chronicler connects differently. Focus on the position rather than the character matching."
            });
          }
        }
      }
      break;
      
    case 'send_message':
      // Allow players to communicate
      if (payload.message) {
        const message = {
          userId,
          role,
          text: payload.message,
          timestamp: new Date().toISOString()
        };
        
        // Store message in history
        state.messages.push(message);
        
        // Broadcast message to room
        io.to(roomId).emit('combine_codes_message', message);
      }
      break;
      
    default:
      // For any other action, just broadcast to room
      socket.to(roomId).emit('combine_codes_action', {
        userId,
        role,
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
  io.to(roomId).emit('combine_codes_challenge_completed', {
    userId,
    message: "The final challenge has been completed. The projection of the Egg of Creation has revealed the location of the true egg in your own world. Seek it out to complete your quest!"
  });
  
  return Promise.resolve(true);
}

module.exports = {
  initialize,
  onJoin,
  onAction,
  onComplete
};