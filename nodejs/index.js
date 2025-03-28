// server.js - Main entry point for the Socket.io server

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Configure CORS
app.use(cors());
app.use(express.json());

// Setup Socket.io with CORS
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// API key for authentication
const API_KEY = process.env.API_KEY || 'your_secure_api_key';

// Base URL for the PHP backend
const PHP_BACKEND_URL = process.env.PHP_BACKEND_URL || 'https://neerbye.com/api';

// Port for the server
const PORT = process.env.PORT || 3000;

// Track active challenges and users
const activeUsers = {};
const activeRooms = {};
const userSockets = {};

// =====================================================
// Challenge Management
// =====================================================

// Load challenge handlers
const challengeHandlers = {
  // First major convergence challenge
  'sequence_puzzle': require('./challenges/sequencePuzzle'),
  
  // Trivia challenges
  'trivia_group_a': require('./challenges/triviaGroupA'),
  'trivia_group_b': require('./challenges/triviaGroupB'),
  'trivia_group_c': require('./challenges/triviaGroupC'),
  
  // Two-player convergence challenges
  'cross_device_puzzle': require('./challenges/crossDevicePuzzle'),
  'geocaching': require('./challenges/geocaching'),
  
  // Final convergence challenge
  'combine_codes': require('./challenges/combineCodes'),
  
  // Intro challenge (for testing/onboarding)
  'intro_challenge': require('./challenges/introChallenge')
};

// Initialize all challenge handlers
Object.values(challengeHandlers).forEach(handler => {
  if (typeof handler.initialize === 'function') {
    handler.initialize(io);
  }
});

// =====================================================
// Socket.io Connection Handling
// =====================================================

io.on('connection', (socket) => {
  console.log(`New connection: ${socket.id}`);
  let userId = null;

  // Handle authentication
  socket.on('authenticate', async (data) => {
    try {
      const { token } = data;
      
      // Validate the token with the PHP backend
      const response = await axios.get(`${PHP_BACKEND_URL}/user`, {
        headers: { 'Authorization': token }
      });
      
      if (response.data && response.data.user_id) {
        userId = response.data.user_id;
        
        // Store user info
        activeUsers[userId] = {
          socketId: socket.id,
          currentChallenge: null,
          currentRoom: null,
          ...response.data
        };
        
        userSockets[socket.id] = userId;
        
        // Join a room with the user's ID for direct messages
        socket.join(userId);
        
        console.log(`User authenticated: ${userId}`);
        socket.emit('authenticated', { success: true, userId });
      } else {
        socket.emit('authenticated', { success: false, error: 'Invalid token' });
      }
    } catch (error) {
      console.error('Authentication error:', error.message);
      socket.emit('authenticated', { success: false, error: 'Authentication failed' });
    }
  });

  // Handle joining a challenge
  socket.on('join_challenge', async (data) => {
    try {
      if (!userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }
      
      const { challengeId, challengeCode } = data;
      
      // Validate that user can access this challenge (via PHP backend)
      const response = await axios.get(`${PHP_BACKEND_URL}/challenge/current`, {
        headers: { 'Authorization': activeUsers[userId].token }
      });
      
      if (response.data && response.data.challenge && response.data.challenge.id == challengeId) {
        const roomId = `challenge_${challengeCode}_${challengeId}`;
        
        // Leave previous room if any
        if (activeUsers[userId].currentRoom) {
          socket.leave(activeUsers[userId].currentRoom);
        }
        
        // Join new room
        socket.join(roomId);
        activeUsers[userId].currentRoom = roomId;
        activeUsers[userId].currentChallenge = challengeCode;
        
        // Initialize room if it doesn't exist
        if (!activeRooms[roomId]) {
          activeRooms[roomId] = {
            challengeId,
            challengeCode,
            users: [],
            state: 'waiting',
            startedAt: null,
            data: {}
          };
        }
        
        // Add user to room
        if (!activeRooms[roomId].users.includes(userId)) {
          activeRooms[roomId].users.push(userId);
        }
        
        // Notify others in the room
        socket.to(roomId).emit('user_joined', { userId, room: roomId });
        
        // Send room info to user
        socket.emit('challenge_joined', {
          roomId,
          users: activeRooms[roomId].users,
          state: activeRooms[roomId].state,
          data: activeRooms[roomId].data
        });
        
        console.log(`User ${userId} joined challenge ${challengeCode} in room ${roomId}`);
        
        // Check if the challenge has a specific handler
        if (challengeHandlers[challengeCode] && typeof challengeHandlers[challengeCode].onJoin === 'function') {
          challengeHandlers[challengeCode].onJoin(socket, {
            userId,
            roomId,
            users: activeRooms[roomId].users,
            challenge: response.data.challenge
          });
        }
      } else {
        socket.emit('error', { message: 'Challenge not available or not authorized' });
      }
    } catch (error) {
      console.error('Join challenge error:', error.message);
      socket.emit('error', { message: 'Failed to join challenge' });
    }
  });

  // Handle completing a challenge
  socket.on('complete_challenge', async (data) => {
    try {
      if (!userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }
      
      const { challengeId, result } = data;
      
      // Notify PHP backend about completion
      await axios.post(`${PHP_BACKEND_URL}/challenge/complete`, {
        challenge_id: challengeId
      }, {
        headers: { 'Authorization': activeUsers[userId].token }
      });
      
      console.log(`User ${userId} completed challenge ${challengeId}`);
      
      // If in a room, notify others
      if (activeUsers[userId].currentRoom) {
        const roomId = activeUsers[userId].currentRoom;
        
        // Check if challenge has specific completion handler
        if (activeUsers[userId].currentChallenge && 
            challengeHandlers[activeUsers[userId].currentChallenge] && 
            typeof challengeHandlers[activeUsers[userId].currentChallenge].onComplete === 'function') {
          
          await challengeHandlers[activeUsers[userId].currentChallenge].onComplete(socket, {
            userId,
            roomId,
            challengeId,
            result
          });
        }
        
        // Mark room as completed
        if (activeRooms[roomId]) {
          activeRooms[roomId].state = 'completed';
          io.to(roomId).emit('challenge_completed', { userId, roomId });
        }
      }
      
      socket.emit('completion_confirmed', { success: true });
    } catch (error) {
      console.error('Complete challenge error:', error.message);
      socket.emit('error', { message: 'Failed to complete challenge' });
    }
  });

  // Handle user actions in challenges
  socket.on('challenge_action', (data) => {
    if (!userId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }
    
    const { action, payload } = data;
    const roomId = activeUsers[userId].currentRoom;
    const challengeCode = activeUsers[userId].currentChallenge;
    
    if (!roomId || !challengeCode) {
      socket.emit('error', { message: 'Not in an active challenge' });
      return;
    }
    
    console.log(`Challenge action from ${userId}: ${action} in ${challengeCode}`);
    
    // Forward action to the appropriate challenge handler
    if (challengeHandlers[challengeCode] && typeof challengeHandlers[challengeCode].onAction === 'function') {
      challengeHandlers[challengeCode].onAction(socket, {
        userId,
        roomId,
        action,
        payload
      });
    } else {
      // Default behavior: broadcast action to room
      socket.to(roomId).emit('user_action', { userId, action, payload });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Connection closed: ${socket.id}`);
    
    if (userId && activeUsers[userId]) {
      const roomId = activeUsers[userId].currentRoom;
      
      // Notify room if user was in one
      if (roomId && activeRooms[roomId]) {
        socket.to(roomId).emit('user_left', { userId, room: roomId });
        
        // Remove user from room
        activeRooms[roomId].users = activeRooms[roomId].users.filter(id => id !== userId);
        
        // Clean up empty rooms
        if (activeRooms[roomId].users.length === 0) {
          delete activeRooms[roomId];
        }
      }
      
      // Clean up user tracking
      delete userSockets[socket.id];
      delete activeUsers[userId];
    }
  });
});

// =====================================================
// API Endpoints
// =====================================================

// Middleware to verify API key
const verifyApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
};

// Notify endpoint - used by PHP backend to notify users
app.post('/notify', verifyApiKey, (req, res) => {
  try {
    const { event, data } = req.body;
    
    if (!event || !data) {
      return res.status(400).json({ error: 'Missing event or data' });
    }
    
    console.log(`Notify event: ${event}`, data);
    
    // Handle different event types
    switch (event) {
      case 'challenge_completed':
        // Broadcast to specific user
        if (data.user_id && io.sockets.adapter.rooms.has(data.user_id)) {
          io.to(data.user_id).emit('challenge_update', { 
            type: 'completed',
            challengeId: data.challenge_id
          });
        }
        break;
        
      case 'convergence_update':
        // Broadcast to users involved in a convergence
        if (data.convergence_id) {
          // Find the room for this convergence
          const roomId = Object.keys(activeRooms).find(key => 
            activeRooms[key].challengeId == data.convergence_id
          );
          
          if (roomId) {
            io.to(roomId).emit('convergence_update', {
              convergenceId: data.convergence_id,
              userId: data.user_id,
              ready: data.ready
            });
          }
        }
        break;
        
      case 'convergence_ready':
        // All users are ready for a convergence
        if (data.convergence_id) {
          // Find the room for this convergence
          const roomId = Object.keys(activeRooms).find(key => 
            activeRooms[key].challengeId == data.convergence_id
          );
          
          if (roomId) {
            activeRooms[roomId].state = 'ready';
            io.to(roomId).emit('convergence_ready', {
              convergenceId: data.convergence_id
            });
          }
        }
        break;
        
      case 'intro_completed':
        // User completed intro
        if (data.user_id && io.sockets.adapter.rooms.has(data.user_id)) {
          io.to(data.user_id).emit('intro_completed');
        }
        break;
        
      default:
        // Forward unknown events directly
        io.emit(event, data);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Notify error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Status endpoint - Get active connections and rooms
app.get('/status', verifyApiKey, (req, res) => {
  res.json({
    activeUsers: Object.keys(activeUsers).length,
    activeRooms: Object.keys(activeRooms).length,
    rooms: activeRooms
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});