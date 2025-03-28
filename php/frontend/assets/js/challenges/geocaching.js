/**
 * Geocaching Challenge
 * 
 * Convergence challenge for Navigator and Craftsman
 * The Navigator has coordinates, while the Craftsman has descriptive clues
 * Both must work together to find a single hidden location
 */

let myRole = null;
let myInformation = null;
let chatMessages = [];
let geocacheFound = false;

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the challenge interface
    const challengeContainer = document.getElementById('convergence-challenge');
    if (!challengeContainer) return;
    
    // Set up initial UI
    setupGeocachingInterface(challengeContainer);
    
    // Socket.io event listeners for this challenge type
    if (socket) {
        // Initialization
        socket.on('geocaching_init', (data) => {
            console.log('Geocaching Challenge initialized:', data);
            
            // Store data
            myRole = data.role;
            myInformation = data.clues || data.coordinates;
            
            // Update UI
            updateChallengeStatus(data.message || 'Share your information to find the hidden geocache!');
            initializeGeocachingInfo(myRole, myInformation);
        });
        
        // User joined/ready events
        socket.on('geocaching_user_joined', (data) => {
            updateUserStatus(data.userId, data.role, false);
        });
        
        socket.on('geocaching_user_ready', (data) => {
            updateUserStatus(data.userId, data.role, true);
            updateReadyStatus(data);
        });
        
        // Challenge start
        socket.on('geocaching_start', (data) => {
            startGeocaching(data);
        });
        
        // Guess result
        socket.on('geocaching_guess_result', (data) => {
            showGuessResult(data);
        });
        
        // Location found
        socket.on('geocaching_location_found', (data) => {
            locationFound(data);
        });
        
        // Messages
        socket.on('geocaching_message', (data) => {
            addChatMessage(data);
        });
        
        // Challenge completion
        socket.on('geocaching_complete', (data) => {
            challengeCompleted(data);
        });
    }
});

/**
 * Set up the geocaching interface
 */
function setupGeocachingInterface(container) {
    container.innerHTML = `
        <div class="geocaching-container">
            <div class="row">
                <div class="col-md-8">
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5 class="mb-0">Hidden Location Challenge</h5>
                        </div>
                        <div class="card-body">
                            <div class="alert alert-info mb-4" id="challenge-status">
                                <p class="mb-0">Waiting for players to be ready...</p>
                            </div>
                            
                            <div class="user-status-container mb-4">
                                <div class="d-flex gap-2 mb-2">
                                    <div class="user-status" id="navigator-status">
                                        <div class="status-indicator"></div>
                                        <span>Navigator</span>
                                    </div>
                                    <div class="user-status" id="craftsman-status">
                                        <div class="status-indicator"></div>
                                        <span>Craftsman</span>
                                    </div>
                                </div>
                                <div id="ready-status" class="text-muted">Waiting for players to be ready...</div>
                            </div>
                            
                            <div id="my-info-card" class="card mb-4">
                                <div class="card-header">
                                    <h6 class="mb-0" id="my-info-title">My Information</h6>
                                </div>
                                <div class="card-body">
                                    <p id="my-info-desc" class="text-muted mb-3">
                                        Share this information with your partner.
                                    </p>
                                    <div id="my-info-content" class="bg-light p-3 rounded">
                                        <!-- Information will be displayed here -->
                                    </div>
                                </div>
                            </div>
                            
                            <div id="geocache-container" class="mb-4" style="display: none;">
                                <div class="card">
                                    <div class="card-header">
                                        <h6 class="mb-0">Find the Geocache</h6>
                                    </div>
                                    <div class="card-body">
                                        <p class="mb-3">Work together to determine the exact location of the geocache:</p>
                                        
                                        <div class="mb-3">
                                            <label for="coordinates-input" class="form-label">Coordinates</label>
                                            <input type="text" class="form-control" id="coordinates-input" 
                                                   placeholder="e.g., 40.7128° N, 74.0060° W">
                                            <div class="form-text">The Navigator should provide precise coordinates</div>
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label for="description-input" class="form-label">Location Description</label>
                                            <textarea class="form-control" id="description-input" rows="3" 
                                                      placeholder="e.g., Hidden behind the large oak tree..."></textarea>
                                            <div class="form-text">The Craftsman should provide the detailed description</div>
                                        </div>
                                        
                                        <button id="submit-guess" class="btn btn-primary">Submit Geocache Location</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div id="challenge-complete-card" class="card mb-4" style="display: none;">
                        <div class="card-header bg-success text-white">
                            <h5 class="mb-0">Challenge Completed!</h5>
                        </div>
                        <div class="card-body">
                            <p id="challenge-complete-message"></p>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-4">
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5 class="mb-0">Communication</h5>
                        </div>
                        <div class="card-body">
                            <div id="chat-container" class="chat-container mb-3">
                                <div class="chat-messages" id="chat-messages">
                                    <div class="text-center text-muted py-3">
                                        <small>Messages will appear here</small>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="input-group">
                                <input type="text" id="chat-input" class="form-control" placeholder="Type a message...">
                                <button id="send-message" class="btn btn-primary">Send</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Set up chat messaging
    const sendMessageBtn = document.getElementById('send-message');
    const chatInput = document.getElementById('chat-input');
    
    if (sendMessageBtn && chatInput) {
        sendMessageBtn.addEventListener('click', function() {
            const message = chatInput.value.trim();
            if (message && socket && isConnected) {
                socket.emit('challenge_action', {
                    action: 'send_message',
                    payload: { message }
                });
                
                // Clear input
                chatInput.value = '';
            }
        });
        
        // Also send on Enter key
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessageBtn.click();
            }
        });
    }
    
    // Set up geocache submission
    const submitGuessBtn = document.getElementById('submit-guess');
    if (submitGuessBtn) {
        submitGuessBtn.addEventListener('click', function() {
            const coordinates = document.getElementById('coordinates-input').value.trim();
            const description = document.getElementById('description-input').value.trim();
            
            if (coordinates && description && socket && isConnected) {
                // Disable button during submission
                this.disabled = true;
                this.innerHTML = '<span class="loading-spinner me-2"></span> Submitting...';
                
                socket.emit('challenge_action', {
                    action: 'submit_geocache',
                    payload: {
                        coordinates,
                        description
                    }
                });
            } else {
                // Show error if fields are empty
                updateChallengeStatus('Both coordinates and description are required to find the geocache!');
            }
        });
    }
    
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
 * Update challenge status message
 */
function updateChallengeStatus(message) {
    const statusEl = document.getElementById('challenge-status');
    if (statusEl) {
        statusEl.innerHTML = `<p class="mb-0">${message}</p>`;
    }
}

/**
 * Update user status in the UI
 */
function updateUserStatus(userId, role, isReady) {
    const statusEl = document.getElementById(`${role}-status`);
    if (statusEl) {
        if (isReady) {
            statusEl.classList.add('ready');
            statusEl.querySelector('.status-indicator').classList.add('ready');
        }
        
        // Update the name if there's a real user ID
        if (userId && userId !== role) {
            statusEl.querySelector('span').textContent = `${role} (${userId})`;
        }
    }
}

/**
 * Update ready status information
 */
function updateReadyStatus(data) {
    const readyStatusEl = document.getElementById('ready-status');
    
    if (data.navigatorReady && data.craftsmanReady) {
        readyStatusEl.textContent = 'Both players are ready! The challenge will start momentarily...';
        readyStatusEl.className = 'text-success';
    } else if (data.navigatorReady) {
        readyStatusEl.textContent = 'Navigator is ready. Waiting for Craftsman...';
        readyStatusEl.className = 'text-muted';
    } else if (data.craftsmanReady) {
        readyStatusEl.textContent = 'Craftsman is ready. Waiting for Navigator...';
        readyStatusEl.className = 'text-muted';
    } else {
        readyStatusEl.textContent = 'Waiting for players to be ready...';
        readyStatusEl.className = 'text-muted';
    }
}

/**
 * Initialize geocaching information
 */
function initializeGeocachingInfo(role, information) {
    const infoTitleEl = document.getElementById('my-info-title');
    const infoDescEl = document.getElementById('my-info-desc');
    const infoContentEl = document.getElementById('my-info-content');
    
    if (role === 'navigator') {
        infoTitleEl.textContent = 'My Coordinates';
        infoDescEl.textContent = 'Share these coordinates with the Craftsman, who has the location description.';
        
        // Format coordinates information
        if (typeof information === 'string') {
            infoContentEl.innerHTML = `
                <div class="coordinates-info">
                    <h6>Secret Geocache Coordinates:</h6>
                    <div class="code-display code-numerical p-3">${information}</div>
                </div>
            `;
        } else {
            infoContentEl.textContent = 'No coordinates available.';
        }
    } else if (role === 'craftsman') {
        infoTitleEl.textContent = 'My Location Description';
        infoDescEl.textContent = 'Share this description with the Navigator, who has the coordinates.';
        
        // Format description information
        if (typeof information === 'string') {
            infoContentEl.innerHTML = `
                <div class="location-description">
                    <h6>Secret Geocache Description:</h6>
                    <p class="p-3 bg-white border rounded">${information}</p>
                </div>
            `;
        } else {
            infoContentEl.textContent = 'No description available.';
        }
    } else {
        infoTitleEl.textContent = 'Observer Information';
        infoDescEl.textContent = 'You are observing this challenge.';
        infoContentEl.textContent = 'Please watch as the Navigator and Craftsman work together.';
    }
}

/**
 * Start the geocaching challenge
 */
function startGeocaching(data) {
    // Show the geocache submission form
    document.getElementById('geocache-container').style.display = 'block';
    
    // Update status
    updateChallengeStatus('The challenge has begun! Work together to find the hidden geocache.');
    
    // Add system message
    addChatMessage({
        userId: 'System',
        text: 'The geocaching challenge has begun! Share your information to find the hidden geocache.',
        timestamp: new Date().toISOString()
    });
    
    // Pre-fill input based on role
    if (myRole === 'navigator' && myInformation) {
        document.getElementById('coordinates-input').value = myInformation;
    } else if (myRole === 'craftsman' && myInformation) {
        document.getElementById('description-input').value = myInformation;
    }
}

/**
 * Show guess result
 */
function showGuessResult(data) {
    // Re-enable submit button
    const submitBtn = document.getElementById('submit-guess');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Geocache Location';
    }
    
    if (data.correct) {
        // Show success alert
        updateChallengeStatus('Correct! You found the geocache!');
        
        // Mark as found
        geocacheFound = true;
        
        // Trigger location found process
        locationFound(data);
    } else {
        // Show error alert with hint if provided
        let message = 'Incorrect guess. Try again!';
        if (data.hint) {
            message += ` Hint: ${data.hint}`;
        }
        updateChallengeStatus(message);
        
        // Add system message
        addChatMessage({
            userId: 'System',
            text: `Your guess was incorrect. ${data.hint ? 'Hint: ' + data.hint : ''}`,
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * Handle location found
 */
function locationFound(data) {
    // Update status
    updateChallengeStatus('Congratulations! You found the geocache!');
    
    // Show completion card
    const completeCard = document.getElementById('challenge-complete-card');
    completeCard.style.display = 'block';
    
    // Set message
    document.getElementById('challenge-complete-message').textContent = data.message || 'You successfully found the hidden geocache by combining your knowledge!';
    
    // Add system message
    addChatMessage({
        userId: 'System',
        text: 'Success! You found the geocache! Challenge completed.',
        timestamp: new Date().toISOString()
    });
    
    // Disable input fields and submit button
    document.getElementById('coordinates-input').disabled = true;
    document.getElementById('description-input').disabled = true;
    document.getElementById('submit-guess').disabled = true;
    
    // Enable the complete challenge button
    const completeBtn = document.getElementById('complete-challenge');
    if (completeBtn) {
        completeBtn.disabled = false;
    }
}

/**
 * Add a chat message
 */
function addChatMessage(message) {
    chatMessages.push(message);
    
    const chatMessagesEl = document.getElementById('chat-messages');
    
    // Clear "no messages" placeholder if this is the first message
    if (chatMessages.length === 1) {
        chatMessagesEl.innerHTML = '';
    }
    
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = 'chat-message';
    
    // Format timestamp
    const timestamp = new Date(message.timestamp);
    const timeString = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Style system messages differently
    const isSystem = message.userId === 'System';
    if (isSystem) {
        messageEl.classList.add('system-message');
    }
    
    // Set message content
    messageEl.innerHTML = `
        <div class="message-header">
            <strong>${message.userId}</strong>
            <small class="text-muted">${timeString}</small>
        </div>
        <div class="message-body">
            ${message.text}
        </div>
    `;
    
    chatMessagesEl.appendChild(messageEl);
    
    // Scroll to bottom
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

/**
 * Show challenge completion
 */
function challengeCompleted(data) {
    // Update status
    updateChallengeStatus('Challenge completed! You have found the geocache.');
    
    // Add system message if not already added
    if (!geocacheFound) {
        addChatMessage({
            userId: 'System',
            text: 'Congratulations! You have completed the geocaching challenge!',
            timestamp: new Date().toISOString()
        });
        
        // Show completion card
        const completeCard = document.getElementById('challenge-complete-card');
        completeCard.style.display = 'block';
        
        // Set message
        document.getElementById('challenge-complete-message').textContent = data.message || 'You have successfully completed the geocaching challenge!';
    }
}