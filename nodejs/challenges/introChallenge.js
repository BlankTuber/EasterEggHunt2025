/**
 * Intro Challenge Handler
 * 
 * A simple introduction challenge to familiarize players with the system
 * This can be used to test connectivity and player coordination
 */

let io;

// Initialize the challenge handler
function initialize(socketIo) {
  io = socketIo;
}

// Handle a user joining the challenge
function onJoin(socket, data) {
  const { userId, roomId, users } = data;
  
  // Send welcome message to the user
  socket.emit('intro_message', {
    message: "Welcome to the Kingdom of Neerbye! This is a simple introduction to help you get familiar with the system.",
    steps: [
      "Read the introduction text on your screen",
      "Click the glowing elements to interact with them",
      "Press the 'Continue' button when you're ready to proceed"
    ]
  });
  
  // Notify room that a new user has joined
  socket.to(roomId).emit('intro_user_joined', {
    userId,
    totalUsers: users.length
  });
}

// Handle user actions
function onAction(socket, data) {
  const { userId, roomId, action, payload } = data;
  
  switch (action) {
    case 'step_completed':
      // When user completes a step, broadcast to others
      socket.to(roomId).emit('intro_step_completed', {
        userId,
        step: payload.step
      });
      
      // If this is the final step, notify user
      if (payload.step === 'final') {
        socket.emit('intro_complete_ready', {
          message: "You've completed the introduction! You are now ready to begin your journey."
        });
      }
      break;
      
    case 'ready':
      // When user signals they're ready, notify others
      socket.to(roomId).emit('intro_user_ready', {
        userId
      });
      
      // Check if all users are ready (would normally query the room state)
      // For intro, just acknowledge
      socket.emit('intro_acknowledgement', {
        message: "Your readiness has been acknowledged."
      });
      break;
      
    default:
      // For any other action, just broadcast to room
      socket.to(roomId).emit('intro_action', {
        userId,
        action,
        payload
      });
  }
}

// Handle challenge completion
function onComplete(socket, data) {
  const { userId, roomId } = data;
  
  // Broadcast completion to room
  io.to(roomId).emit('intro_challenge_completed', {
    userId,
    message: "The introduction has been completed. Your journey now begins!"
  });
  
  return Promise.resolve(true);
}

module.exports = {
  initialize,
  onJoin,
  onAction,
  onComplete
};