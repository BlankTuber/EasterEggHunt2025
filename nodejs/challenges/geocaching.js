/**
 * Geocaching Challenge Handler
 * 
 * Convergence challenge for Navigator and Craftsman
 * The Navigator has coordinates, while the Craftsman has descriptive clues
 * Both must work together to find a single hidden location
 */

let io;

// Initialize the challenge handler
function initialize(socketIo) {
  io = socketIo;
}

// Challenge state for each room
const roomStates = {};

// Geocache locations database
const geocacheLocations = [
  {
    id: 'ancient_oak',
    name: 'Ancient Oak',
    coordinates: '40.7128° N, 74.0060° W',
    description: 'Hidden behind the large oak tree with twisted branches, look for a hollow near the roots covered by moss.',
    validationRules: {
      coordinates: ['40.7128° N, 74.0060° W', '40.7128°N, 74.0060°W', '40.7128N, 74.0060W'],
      keywords: ['oak', 'tree', 'hollow', 'moss', 'roots', 'twisted', 'branches']
    }
  },
  {
    id: 'crystal_cave',
    name: 'Crystal Cave',
    coordinates: '37.8651° N, 119.5383° W',
    description: 'Located inside the Crystal Cave near the shimmering waterfall. Look for a small alcove behind the largest stalactite.',
    validationRules: {
      coordinates: ['37.8651° N, 119.5383° W', '37.8651°N, 119.5383°W', '37.8651N, 119.5383W'],
      keywords: ['cave', 'crystal', 'waterfall', 'alcove', 'stalactite', 'shimmering']
    }
  },
  {
    id: 'ancient_bridge',
    name: 'Ancient Bridge',
    coordinates: '51.5074° N, 0.1278° W',
    description: 'At the eastern end of the ancient stone bridge, count three stones from the water\'s edge and look for a small compartment underneath.',
    validationRules: {
      coordinates: ['51.5074° N, 0.1278° W', '51.5074°N, 0.1278°W', '51.5074N, 0.1278W'],
      keywords: ['bridge', 'stone', 'eastern', 'water', 'edge', 'compartment', 'underneath']
    }
  },
  {
    id: 'mountain_peak',
    name: 'Mountain Peak',
    coordinates: '45.8325° N, 6.8642° E',
    description: 'Near the summit of the tallest mountain, find the weather-worn stone marker. The cache is hidden in a crevice beneath it.',
    validationRules: {
      coordinates: ['45.8325° N, 6.8642° E', '45.8325°N, 6.8642°E', '45.8325N, 6.8642E'],
      keywords: ['mountain', 'summit', 'peak', 'marker', 'stone', 'crevice', 'beneath']
    }
  },
  {
    id: 'lighthouse_point',
    name: 'Lighthouse Point',
    coordinates: '43.0481° N, 70.7425° W',
    description: 'At the base of the old lighthouse, look for a loose brick in the north-facing wall. The cache is hidden behind it.',
    validationRules: {
      coordinates: ['43.0481° N, 70.7425° W', '43.0481°N, 70.7425°W', '43.0481N, 70.7425W'],
      keywords: ['lighthouse', 'base', 'brick', 'wall', 'loose', 'north', 'behind']
    }
  }
];

// Select a random geocache location
function selectRandomGeocache() {
  return geocacheLocations[Math.floor(Math.random() * geocacheLocations.length)];
}

// Handle a user joining the challenge
function onJoin(socket, data) {
  const { userId, roomId, users } = data;
  
  // Initialize room state if not exists
  if (!roomStates[roomId]) {
    roomStates[roomId] = {
      geocache: selectRandomGeocache(),
      userRoles: {},
      userReady: {},
      started: false,
      completed: false,
      attempts: 0,
      messages: []
    };
    
    // Assign roles (Navigator and Craftsman)
    if (users.length >= 2) {
      // Find users with the right role names if available
      const navigatorUser = users.find(u => u.toLowerCase().includes('navigator'));
      const craftsmanUser = users.find(u => u.toLowerCase().includes('craftsman'));
      
      if (navigatorUser && craftsmanUser) {
        roomStates[roomId].userRoles[navigatorUser] = 'navigator';
        roomStates[roomId].userRoles[craftsmanUser] = 'craftsman';
      } else {
        // Random assignment if specific roles not found
        const shuffledUsers = [...users].sort(() => 0.5 - Math.random());
        roomStates[roomId].userRoles[shuffledUsers[0]] = 'navigator';
        roomStates[roomId].userRoles[shuffledUsers[1]] = 'craftsman';
      }
      
      // Initialize ready state
      users.forEach(user => {
        roomStates[roomId].userReady[user] = false;
      });
    }
  }
  
  // Get user's role
  const role = roomStates[roomId].userRoles[userId] || 'observer';
  
  // Prepare role-specific information
  let roleInfo = null;
  if (role === 'navigator') {
    roleInfo = roomStates[roomId].geocache.coordinates;
  } else if (role === 'craftsman') {
    roleInfo = roomStates[roomId].geocache.description;
  }
  
  // Send initial state to the user
  socket.emit('geocaching_init', {
    userId,
    role,
    clues: role === 'craftsman' ? roleInfo : null,
    coordinates: role === 'navigator' ? roleInfo : null,
    message: "Welcome to the Geocaching Challenge! Share your information with your partner to find the hidden geocache."
  });
  
  // Notify room that a new user has joined
  io.to(roomId).emit('geocaching_user_joined', {
    userId,
    role,
    totalUsers: users.length
  });
}

// Start the geocaching challenge
function startChallenge(roomId) {
  const state = roomStates[roomId];
  state.started = true;
  
  // Send message to all players
  io.to(roomId).emit('geocaching_start', {
    message: "The challenge has begun! Use your combined knowledge to find the hidden geocache."
  });
}

// Validate geocache submission
function validateGeocacheSubmission(roomId, coordinates, description) {
  const state = roomStates[roomId];
  const geocache = state.geocache;
  
  // Increment attempts
  state.attempts++;
  
  // Check coordinates
  const coordinatesMatch = geocache.validationRules.coordinates.some(
    validCoord => coordinates.toLowerCase().includes(validCoord.toLowerCase())
  );
  
  // Check description keywords
  const descriptionWords = description.toLowerCase().split(/\s+/);
  const keywordsFound = geocache.validationRules.keywords.filter(
    keyword => descriptionWords.some(word => word.includes(keyword.toLowerCase()))
  );
  
  // Calculate match percentage for description (at least 3 keywords or 40% of total keywords)
  const keywordThreshold = Math.max(3, Math.ceil(geocache.validationRules.keywords.length * 0.4));
  const descriptionMatch = keywordsFound.length >= keywordThreshold;
  
  // Both coordinates and description need to match
  const isCorrect = coordinatesMatch && descriptionMatch;
  
  // Generate hints if not correct
  let hint = null;
  if (!isCorrect) {
    if (!coordinatesMatch && !descriptionMatch) {
      hint = "Both coordinates and description seem incorrect. Double-check your information and try again.";
    } else if (!coordinatesMatch) {
      hint = "The coordinates don't match. Make sure they're in the correct format.";
    } else if (!descriptionMatch) {
      hint = `The description is missing key details. Try including more specific elements (${keywordsFound.length}/${keywordThreshold} keywords found).`;
    }
  }
  
  return {
    isCorrect,
    hint,
    coordinatesMatch,
    descriptionMatch,
    keywordsFound,
    keywordsRequired: keywordThreshold,
    attempts: state.attempts
  };
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
      
      // Check if both required players are ready
      const navigatorReady = Object.entries(state.userRoles)
        .filter(([id, r]) => r === 'navigator')
        .every(([id]) => state.userReady[id]);
      
      const craftsmanReady = Object.entries(state.userRoles)
        .filter(([id, r]) => r === 'craftsman')
        .every(([id]) => state.userReady[id]);
      
      // Notify room about player readiness
      io.to(roomId).emit('geocaching_user_ready', {
        userId,
        role,
        navigatorReady,
        craftsmanReady
      });
      
      // Start if both key roles are ready
      if (navigatorReady && craftsmanReady && !state.started) {
        startChallenge(roomId);
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
        io.to(roomId).emit('geocaching_message', message);
      }
      break;
      
    case 'submit_geocache':
      // Handle geocache submission
      if (state.started && !state.completed && payload.coordinates && payload.description) {
        const { coordinates, description } = payload;
        
        // Validate submission
        const validation = validateGeocacheSubmission(roomId, coordinates, description);
        
        if (validation.isCorrect) {
          // Mark challenge as completed
          state.completed = true;
          
          // Send success message to all players
          io.to(roomId).emit('geocaching_location_found', {
            foundBy: userId,
            locationId: state.geocache.id,
            message: `Congratulations! You found the ${state.geocache.name} geocache! Your combined knowledge and skills have led you to the hidden treasure.`
          });
        } else {
          // Send error message with hint
          socket.emit('geocaching_guess_result', {
            correct: false,
            validation,
            hint: validation.hint
          });
        }
      }
      break;
      
    default:
      // For any other action, just broadcast to room
      socket.to(roomId).emit('geocaching_action', {
        userId,
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
  io.to(roomId).emit('geocaching_complete', {
    userId,
    message: "The geocaching challenge has been completed. You have successfully found the hidden location by combining your knowledge!"
  });
  
  return Promise.resolve(true);
}

module.exports = {
  initialize,
  onJoin,
  onAction,
  onComplete
};