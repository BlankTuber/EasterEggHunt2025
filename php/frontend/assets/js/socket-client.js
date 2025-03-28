/**
 * Kingdom Hunt Socket.io Client
 * Handles real-time communication with the Socket.io server
 */

// Configuration
const SOCKET_SERVER_URL = 'http://localhost:3000'; // Change to your socket server URL

// Global variables
let socket;
let isConnected = false;
let currentChallenge = null;
let currentRoom = null;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Connect to Socket.io server if authentication token exists
    const token = localStorage.getItem('kingdom_hunt_token');
    if (token) {
        initializeSocket(token);
    }
    
    // Handle convergence ready button
    const readyBtn = document.getElementById('convergence-ready');
    if (readyBtn) {
        readyBtn.addEventListener('click', function() {
            const convergenceId = this.dataset.convergenceId;
            if (!convergenceId || !socket || !isConnected) return;
            
            // Notify server that user is ready
            socket.emit('challenge_action', {
                action: 'ready',
                payload: {}
            });
            
            // Update UI
            this.disabled = true;
            this.innerHTML = 'Waiting for others...';
            
            // Also update server via REST API
            fetch('/api/convergence/ready', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify({ convergence_id: convergenceId })
            })
            .then(response => response.json())
            .catch(error => console.error('Error:', error));
        });
    }
});

/**
 * Initialize Socket.io connection
 */
function initializeSocket(token) {
    // Create socket connection
    socket = io(SOCKET_SERVER_URL);
    
    // Connection event
    socket.on('connect', () => {
        console.log('Connected to Socket.io server');
        isConnected = true;
        
        // Authenticate with the server
        socket.emit('authenticate', { token });
    });
    
    // Authentication response
    socket.on('authenticated', (data) => {
        if (data.success) {
            console.log('Successfully authenticated with Socket.io server');
            
            // Check if we're on a challenge page
            const challengeContainer = document.getElementById('challenge-container');
            if (challengeContainer) {
                const challengeId = challengeContainer.dataset.challengeId;
                const challengeCode = challengeContainer.dataset.challengeCode;
                
                if (challengeId && challengeCode) {
                    // Join the challenge room
                    joinChallenge(challengeId, challengeCode);
                }
            }
        } else {
            console.error('Failed to authenticate with Socket.io server:', data.error);
        }
    });
    
    // Disconnection event
    socket.on('disconnect', () => {
        console.log('Disconnected from Socket.io server');
        isConnected = false;
    });
    
    // Error handling
    socket.on('error', (error) => {
        console.error('Socket.io error:', error);
    });
    
    // Challenge joined event
    socket.on('challenge_joined', (data) => {
        console.log('Joined challenge room:', data);
        currentRoom = data.roomId;
        
        // Update UI if needed
        updateRoomStatus(data);
    });
    
    // User joined event
    socket.on('user_joined', (data) => {
        console.log('User joined:', data);
        
        // Update UI if needed
        const usersContainer = document.getElementById('room-users');
        if (usersContainer) {
            // Add user to the list
            const userItem = document.createElement('div');
            userItem.className = 'user-status';
            userItem.dataset.userId = data.userId;
            userItem.innerHTML = `
                <div class="status-indicator"></div>
                <span>${data.userId}</span>
            `;
            usersContainer.appendChild(userItem);
        }
    });
    
    // User ready event
    socket.on('user_ready', (data) => {
        console.log('User ready:', data);
        
        // Update UI if needed
        const userItem = document.querySelector(`.user-status[data-user-id="${data.userId}"]`);
        if (userItem) {
            userItem.classList.add('ready');
            const indicator = userItem.querySelector('.status-indicator');
            if (indicator) {
                indicator.classList.add('ready');
            }
        }
    });
    
    // Convergence ready event
    socket.on('convergence_ready', (data) => {
        console.log('Convergence ready:', data);
        
        // Reload the page to show updated status
        window.location.reload();
    });
    
    // Challenge completed event
    socket.on('challenge_completed', (data) => {
        console.log('Challenge completed:', data);
        
        // Show success message
        showAlert('Challenge completed successfully!', 'success');
        
        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = '/?page=dashboard';
        }, 1500);
    });
    
    // ====== Challenge-specific event handlers ======
    
    // These would be more specific to each challenge type
    setupChallengeEventHandlers();
}

/**
 * Join a challenge room
 */
function joinChallenge(challengeId, challengeCode) {
    if (!socket || !isConnected) return;
    
    currentChallenge = {
        id: challengeId,
        code: challengeCode
    };
    
    socket.emit('join_challenge', {
        challengeId,
        challengeCode
    });
}

/**
 * Update room status UI
 */
function updateRoomStatus(data) {
    const usersContainer = document.getElementById('room-users');
    if (!usersContainer) return;
    
    // Clear existing users
    usersContainer.innerHTML = '';
    
    // Add each user
    data.users.forEach(userId => {
        const userItem = document.createElement('div');
        userItem.className = 'user-status';
        userItem.dataset.userId = userId;
        
        // Check if user is ready
        const isReady = data.state === 'ready';
        if (isReady) {
            userItem.classList.add('ready');
        }
        
        userItem.innerHTML = `
            <div class="status-indicator ${isReady ? 'ready' : ''}"></div>
            <span>${userId}</span>
        `;
        usersContainer.appendChild(userItem);
    });
    
    // Update challenge state
    const stateContainer = document.getElementById('challenge-state');
    if (stateContainer) {
        stateContainer.textContent = data.state;
        
        if (data.state === 'ready') {
            const readyBtn = document.getElementById('convergence-ready');
            if (readyBtn) {
                readyBtn.disabled = true;
                readyBtn.textContent = 'All Players Ready!';
                
                // Automatically reload after a delay to start the challenge
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            }
        }
    }
}

/**
 * Setup challenge-specific event handlers
 */
function setupChallengeEventHandlers() {
    // Each challenge type will have its own specific event handlers
    
    // Example: Handle trivia challenge events
    socket.on('trivia_a_question', (data) => {
        updateTriviaQuestion(data);
    });
    
    socket.on('trivia_a_user_answered', (data) => {
        updateUserAnsweredStatus(data);
    });
    
    socket.on('trivia_a_question_result', (data) => {
        showQuestionResult(data);
    });
    
    // Example: Handle sequence puzzle events
    socket.on('sequence_puzzle_init', (data) => {
        initializeSequencePuzzle(data);
    });
    
    socket.on('sequence_puzzle_move', (data) => {
        updatePuzzleMove(data);
    });
}

/**
 * Complete a challenge
 */
function completeChallenge(challengeId, result = {}) {
    if (!socket || !isConnected) return;
    
    socket.emit('complete_challenge', {
        challengeId,
        result
    });
}

// These functions would be implemented based on specific challenge needs
function updateTriviaQuestion(data) {
    // Implementation would depend on the specific structure of your trivia UI
    console.log('Received trivia question:', data);
}

function updateUserAnsweredStatus(data) {
    console.log('User answered:', data);
}

function showQuestionResult(data) {
    console.log('Question result:', data);
}

function initializeSequencePuzzle(data) {
    console.log('Initialize sequence puzzle:', data);
}

function updatePuzzleMove(data) {
    console.log('Puzzle move:', data);
}