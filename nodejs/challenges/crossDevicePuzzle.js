/**
 * Cross Device Puzzle Challenge Handler
 * 
 * Convergence challenge for Craftsman and Apprentice
 * where they must coordinate actions across their devices to
 * solve a mechanical puzzle where each sees only half the mechanism.
 */

let io;

// Initialize the challenge handler
function initialize(socketIo) {
  io = socketIo;
}

// Challenge state for each room
const roomStates = {};

// Puzzle configurations database
const puzzleConfigurations = [
  {
    id: 1,
    name: "Gear Mechanism",
    description: "A complex gear system that requires precise coordination to align.",
    craftsman: {
      components: [
        { id: "gear1", type: "gear", position: { x: 100, y: 100 }, rotatable: true, connectedTo: "gear3" },
        { id: "gear2", type: "gear", position: { x: 250, y: 150 }, rotatable: true, connectedTo: "gear4" },
        { id: "lever1", type: "lever", position: { x: 50, y: 300 }, pullable: true, affects: "gear1" }
      ],
      visibleConnections: ["gear3", "gear4"],
      instructions: "Rotate the gears and pull the lever to align the mechanism with the Apprentice's side."
    },
    apprentice: {
      components: [
        { id: "gear3", type: "gear", position: { x: 150, y: 120 }, rotatable: true, connectedTo: "gear1" },
        { id: "gear4", type: "gear", position: { x: 300, y: 170 }, rotatable: true, connectedTo: "gear2" },
        { id: "button1", type: "button", position: { x: 400, y: 250 }, pressable: true, affects: "gear4" }
      ],
      visibleConnections: ["gear1", "gear2"],
      instructions: "Rotate your gears and press the button to complete the mechanism started by the Craftsman."
    },
    solution: [
      { componentId: "lever1", action: "pull" },
      { componentId: "gear1", action: "rotate", value: 90 },
      { componentId: "gear3", action: "rotate", value: -90 },
      { componentId: "button1", action: "press" },
      { componentId: "gear2", action: "rotate", value: 180 },
      { componentId: "gear4", action: "rotate", value: -180 }
    ]
  },
  {
    id: 2,
    name: "Circuit Board",
    description: "A split circuit board that requires proper connections across both devices.",
    craftsman: {
      components: [
        { id: "switch1", type: "switch", position: { x: 100, y: 150 }, toggleable: true, affects: "wire1" },
        { id: "wire1", type: "wire", position: { x: 200, y: 150 }, connectable: true, connectedTo: "wire3" },
        { id: "resistor1", type: "resistor", position: { x: 300, y: 200 }, adjustable: true, affects: "battery1" },
        { id: "battery1", type: "battery", position: { x: 150, y: 250 }, output: "wire1" }
      ],
      visibleConnections: ["wire3"],
      instructions: "Configure the circuit on your side by toggling switches and connecting wires. Match the output signal with the Apprentice's board."
    },
    apprentice: {
      components: [
        { id: "wire3", type: "wire", position: { x: 100, y: 150 }, connectable: true, connectedTo: "wire1" },
        { id: "led1", type: "led", position: { x: 200, y: 200 }, input: "wire3" },
        { id: "capacitor1", type: "capacitor", position: { x: 300, y: 150 }, adjustable: true, affects: "led1" },
        { id: "switch2", type: "switch", position: { x: 250, y: 250 }, toggleable: true, affects: "capacitor1" }
      ],
      visibleConnections: ["wire1"],
      instructions: "Complete the circuit by connecting wires and adjusting components to make the LED light up."
    },
    solution: [
      { componentId: "switch1", action: "toggle", value: "on" },
      { componentId: "resistor1", action: "adjust", value: 50 },
      { componentId: "capacitor1", action: "adjust", value: 25 },
      { componentId: "switch2", action: "toggle", value: "on" },
      { componentId: "wire1", action: "connect", target: "wire3" },
      { componentId: "wire3", action: "connect", target: "led1" }
    ]
  },
  {
    id: 3,
    name: "Water Flow System",
    description: "A complex plumbing system split across two devices, requiring coordination to regulate water flow.",
    craftsman: {
      components: [
        { id: "valve1", type: "valve", position: { x: 100, y: 100 }, adjustable: true, affects: "pipe1" },
        { id: "pipe1", type: "pipe", position: { x: 200, y: 150 }, connectable: true, connectedTo: "pipe3" },
        { id: "pump1", type: "pump", position: { x: 150, y: 250 }, toggleable: true, affects: "valve1" }
      ],
      visibleConnections: ["pipe3"],
      instructions: "Control the water flow from your side by adjusting valves and activating pumps. Coordinate with the Apprentice to balance the system."
    },
    apprentice: {
      components: [
        { id: "pipe3", type: "pipe", position: { x: 100, y: 150 }, connectable: true, connectedTo: "pipe1" },
        { id: "valve2", type: "valve", position: { x: 200, y: 200 }, adjustable: true, affects: "pipe3" },
        { id: "tank1", type: "tank", position: { x: 300, y: 150 }, fillable: true, input: "pipe3" }
      ],
      visibleConnections: ["pipe1"],
      instructions: "Receive the water flow and direct it to fill the tank by adjusting your valves."
    },
    solution: [
      { componentId: "pump1", action: "toggle", value: "on" },
      { componentId: "valve1", action: "adjust", value: 75 },
      { componentId: "valve2", action: "adjust", value: 50 },
      { componentId: "pipe1", action: "connect", target: "pipe3" },
      { componentId: "pipe3", action: "connect", target: "tank1" }
    ]
  }
];

// Select a random puzzle
function selectRandomPuzzle() {
  return puzzleConfigurations[Math.floor(Math.random() * puzzleConfigurations.length)];
}

// Handle a user joining the challenge
function onJoin(socket, data) {
  const { userId, roomId, users } = data;
  
  // Initialize room state if not exists
  if (!roomStates[roomId]) {
    roomStates[roomId] = {
      puzzle: selectRandomPuzzle(),
      userRoles: {},
      userReady: {},
      componentStates: {},
      actions: [],
      actionIndex: 0,
      started: false,
      completed: false,
      messages: []
    };
    
    // Assign roles (Craftsman and Apprentice)
    if (users.length >= 2) {
      // Find users with the right role names if available
      const craftsmanUser = users.find(u => u.toLowerCase().includes('craftsman'));
      const apprenticeUser = users.find(u => u.toLowerCase().includes('apprentice'));
      
      if (craftsmanUser && apprenticeUser) {
        roomStates[roomId].userRoles[craftsmanUser] = 'craftsman';
        roomStates[roomId].userRoles[apprenticeUser] = 'apprentice';
      } else {
        // Random assignment if specific roles not found
        const shuffledUsers = [...users].sort(() => 0.5 - Math.random());
        roomStates[roomId].userRoles[shuffledUsers[0]] = 'craftsman';
        roomStates[roomId].userRoles[shuffledUsers[1]] = 'apprentice';
      }
      
      // Initialize ready state and components
      users.forEach(user => {
        roomStates[roomId].userReady[user] = false;
      });
      
      // Initialize component states
      const puzzle = roomStates[roomId].puzzle;
      
      [...puzzle.craftsman.components, ...puzzle.apprentice.components].forEach(component => {
        roomStates[roomId].componentStates[component.id] = {
          position: component.position,
          rotation: 0,
          connected: component.connectedTo ? [component.connectedTo] : [],
          state: component.type === 'switch' ? 'off' : (component.type === 'valve' ? 0 : null)
        };
      });
    }
  }
  
  // Get user's role
  const role = roomStates[roomId].userRoles[userId] || 'observer';
  
  // Send initial state to the user based on their role
  socket.emit('cross_device_init', {
    userId,
    users,
    role,
    puzzleName: roomStates[roomId].puzzle.name,
    puzzleDescription: roomStates[roomId].puzzle.description,
    components: role === 'craftsman' 
      ? roomStates[roomId].puzzle.craftsman.components 
      : (role === 'apprentice' 
          ? roomStates[roomId].puzzle.apprentice.components 
          : []),
    visibleConnections: role === 'craftsman'
      ? roomStates[roomId].puzzle.craftsman.visibleConnections
      : (role === 'apprentice'
          ? roomStates[roomId].puzzle.apprentice.visibleConnections
          : []),
    instructions: role === 'craftsman'
      ? roomStates[roomId].puzzle.craftsman.instructions
      : (role === 'apprentice'
          ? roomStates[roomId].puzzle.apprentice.instructions
          : "You are observing this challenge.")
  });
  
  // Notify room that a new user has joined
  io.to(roomId).emit('cross_device_user_joined', {
    userId,
    role,
    totalUsers: users.length
  });
}

// Start the cross device challenge
function startChallenge(roomId) {
  const state = roomStates[roomId];
  state.started = true;
  
  // Reset component states if needed
  [...state.puzzle.craftsman.components, ...state.puzzle.apprentice.components].forEach(component => {
    state.componentStates[component.id] = {
      position: component.position,
      rotation: 0,
      connected: component.connectedTo ? [component.connectedTo] : [],
      state: component.type === 'switch' ? 'off' : (component.type === 'valve' ? 0 : null)
    };
  });
  
  // Send initial component states to all players
  io.to(roomId).emit('cross_device_start', {
    message: "The challenge has begun! Work together to solve the mechanical puzzle.",
    componentStates: state.componentStates
  });
}

// Check if the puzzle is solved
function checkPuzzleSolved(roomId) {
  const state = roomStates[roomId];
  const solution = state.puzzle.solution;
  
  // Simple solution check: all required actions should be performed in some order
  const requiredActions = new Set();
  
  solution.forEach(step => {
    requiredActions.add(`${step.componentId}_${step.action}`);
  });
  
  state.actions.forEach(action => {
    requiredActions.delete(`${action.componentId}_${action.action}`);
  });
  
  // If all required actions have been performed, the puzzle is solved
  return requiredActions.size === 0;
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
      const craftsmanReady = Object.entries(state.userRoles)
        .filter(([id, r]) => r === 'craftsman')
        .every(([id]) => state.userReady[id]);
      
      const apprenticeReady = Object.entries(state.userRoles)
        .filter(([id, r]) => r === 'apprentice')
        .every(([id]) => state.userReady[id]);
      
      // Notify room about player readiness
      io.to(roomId).emit('cross_device_user_ready', {
        userId,
        role,
        craftsmanReady,
        apprenticeReady
      });
      
      // Start if both key roles are ready
      if (craftsmanReady && apprenticeReady && !state.started) {
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
        io.to(roomId).emit('cross_device_message', message);
      }
      break;
      
    case 'component_action':
      // Handle action on a component
      if (state.started && !state.completed && payload.componentId && payload.action) {
        const componentId = payload.componentId;
        const componentAction = payload.action;
        const value = payload.value;
        
        // Check if this component belongs to the user's role
        const userComponents = role === 'craftsman' 
          ? state.puzzle.craftsman.components 
          : state.puzzle.apprentice.components;
        
        const component = userComponents.find(c => c.id === componentId);
        
        if (!component) {
          socket.emit('error', { message: "You cannot interact with this component" });
          return;
        }
        
        // Update component state based on action
        switch (componentAction) {
          case 'rotate':
            if (component.rotatable) {
              state.componentStates[componentId].rotation = (state.componentStates[componentId].rotation + value) % 360;
            }
            break;
            
          case 'toggle':
            if (component.toggleable) {
              state.componentStates[componentId].state = value;
            }
            break;
            
          case 'adjust':
            if (component.adjustable) {
              state.componentStates[componentId].state = value;
            }
            break;
            
          case 'connect':
            if (component.connectable && payload.target) {
              if (!state.componentStates[componentId].connected.includes(payload.target)) {
                state.componentStates[componentId].connected.push(payload.target);
              }
            }
            break;
            
          case 'pull':
            if (component.pullable) {
              state.componentStates[componentId].state = 'pulled';
            }
            break;
            
          case 'press':
            if (component.pressable) {
              state.componentStates[componentId].state = 'pressed';
            }
            break;
        }
        
        // Record the action
        state.actions.push({
          componentId,
          action: componentAction,
          value,
          timestamp: new Date().toISOString(),
          userId,
          role
        });
        
        // Broadcast the component update to all players
        io.to(roomId).emit('cross_device_component_update', {
          componentId,
          state: state.componentStates[componentId],
          action: componentAction,
          performedBy: role
        });
        
        // Check if puzzle is solved
        if (checkPuzzleSolved(roomId)) {
          state.completed = true;
          
          io.to(roomId).emit('cross_device_puzzle_solved', {
            message: "Congratulations! You have successfully solved the mechanical puzzle by working together.",
            actions: state.actions
          });
        }
      }
      break;
      
    case 'restart':
      // Only allow restart if game is completed
      if (state.completed) {
        // Reset the puzzle
        state.puzzle = selectRandomPuzzle();
        state.componentStates = {};
        state.actions = [];
        state.actionIndex = 0;
        state.started = false;
        state.completed = false;
        
        // Keep players as ready
        Object.keys(state.userReady).forEach(id => {
          state.userReady[id] = true;
        });
        
        // Initialize new component states
        [...state.puzzle.craftsman.components, ...state.puzzle.apprentice.components].forEach(component => {
          state.componentStates[component.id] = {
            position: component.position,
            rotation: 0,
            connected: component.connectedTo ? [component.connectedTo] : [],
            state: component.type === 'switch' ? 'off' : (component.type === 'valve' ? 0 : null)
          };
        });
        
        // Send new puzzle to players
        Object.entries(state.userRoles).forEach(([id, role]) => {
          if (role === 'craftsman' || role === 'apprentice') {
            io.to(id).emit('cross_device_init', {
              userId: id,
              role,
              puzzleName: state.puzzle.name,
              puzzleDescription: state.puzzle.description,
              components: role === 'craftsman' 
                ? state.puzzle.craftsman.components 
                : state.puzzle.apprentice.components,
              visibleConnections: role === 'craftsman'
                ? state.puzzle.craftsman.visibleConnections
                : state.puzzle.apprentice.visibleConnections,
              instructions: role === 'craftsman'
                ? state.puzzle.craftsman.instructions
                : state.puzzle.apprentice.instructions
            });
          }
        });
        
        // Start the new challenge
        startChallenge(roomId);
      }
      break;
      
    default:
      // For any other action, just broadcast to room
      socket.to(roomId).emit('cross_device_action', {
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
  io.to(roomId).emit('cross_device_challenge_completed', {
    userId,
    message: "The cross-device puzzle challenge has been completed. Your ability to work together across boundaries has opened the way forward!"
  });
  
  return Promise.resolve(true);
}

module.exports = {
  initialize,
  onJoin,
  onAction,
  onComplete
};