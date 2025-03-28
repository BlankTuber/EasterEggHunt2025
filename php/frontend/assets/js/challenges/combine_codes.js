/**
 * Combine Codes Challenge
 * 
 * Final convergence challenge where all five champions must combine
 * their individual code segments to create a master code.
 */

let myRole = null;
let myCode = null;
let chatMessages = [];
let sharedCodes = {};
let submittedCodes = {};
let isSubmitting = false;

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the challenge interface
    const challengeContainer = document.getElementById('convergence-challenge');
    if (!challengeContainer) return;
    
    // Set up initial UI
    setupCombineCodesInterface(challengeContainer);
    
    // Socket.io event listeners for this challenge type
    if (socket) {
        // Initialization
        socket.on('combine_codes_init', (data) => {
            console.log('Combine Codes initialized:', data);
            
            // Store data
            myRole = data.role;
            myCode = data.code;
            
            // Update UI
            updateChallengeInfo(data);
        });
        
        // User joined/ready events
        socket.on('combine_codes_user_joined', (data) => {
            updateUserStatus(data.userId, data.role, false);
        });
        
        socket.on('combine_codes_user_ready', (data) => {
            updateReadyStatus(data);
        });
        
        // Challenge start
        socket.on('combine_codes_start', (data) => {
            startChallenge(data);
        });
        
        // Code shared
        socket.on('combine_codes_shared', (data) => {
            codeShared(data);
        });
        
        // Submission result events
        socket.on('combine_codes_success', (data) => {
            submissionSuccess(data);
        });
        
        socket.on('combine_codes_incorrect', (data) => {
            submissionFailed(data);
        });
        
        socket.on('combine_codes_hint', (data) => {
            showHint(data);
        });
        
        // Messages
        socket.on('combine_codes_message', (data) => {
            addChatMessage(data);
        });
    }
});

/**
 * Set up the combine codes interface
 */
function setupCombineCodesInterface(container) {
    container.innerHTML = `
        <div class="combine-codes-container">
            <div class="row">
                <div class="col-md-8">
                    <div class="card mb-4">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0" id="room-name">The Chamber of Unity</h5>
                            <span class="badge bg-primary" id="my-role">Role</span>
                        </div>
                        <div class="card-body">
                            <div class="alert alert-info mb-4" id="challenge-status">
                                <p class="mb-0">Waiting for all champions to be ready...</p>
                            </div>
                            
                            <div id="my-code-container" class="card mb-4">
                                <div class="card-header">
                                    <h6 class="mb-0">Your Code Segment</h6>
                                </div>
                                <div class="card-body">
                                    <p class="text-muted mb-2" id="code-description">
                                        Your code segment information will appear here.
                                    </p>
                                    <div class="d-flex align-items-center">
                                        <div class="code-display p-3 bg-light rounded me-3" id="my-code-display">
                                            ...
                                        </div>
                                        <button id="share-code" class="btn btn-primary">Share Code</button>
                                    </div>
                                </div>
                            </div>
                            
                            <div id="shared-codes-container" class="card mb-4">
                                <div class="card-header">
                                    <h6 class="mb-0">Shared Code Segments</h6>
                                </div>
                                <div class="card-body">
                                    <div id="shared-codes-list" class="mb-3">
                                        <div class="text-center text-muted py-3">
                                            <small>Shared codes will appear here once they are revealed</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div id="combine-container" class="card mb-4">
                                <div class="card-header">
                                    <h6 class="mb-0">Combine Codes</h6>
                                </div>
                                <div class="card-body">
                                    <p class="text-muted mb-3">
                                        Arrange all code segments in the correct sequence to unlock the power of the Egg of Creation.
                                    </p>
                                    
                                    <div class="mb-3">
                                        <label class="form-label">Navigator's Code</label>
                                        <input type="text" class="form-control mb-2 code-input" 
                                               id="navigator-code" placeholder="Navigator's code">
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label class="form-label">Sage's Code</label>
                                        <input type="text" class="form-control mb-2 code-input" 
                                               id="sage-code" placeholder="Sage's code">
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label class="form-label">Chronicler's Code</label>
                                        <input type="text" class="form-control mb-2 code-input" 
                                               id="chronicler-code" placeholder="Chronicler's code">
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label class="form-label">Craftsman's Code</label>
                                        <input type="text" class="form-control mb-2 code-input" 
                                               id="craftsman-code" placeholder="Craftsman's code">
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label class="form-label">Apprentice's Code</label>
                                        <input type="text" class="form-control mb-2 code-input" 
                                               id="apprentice-code" placeholder="Apprentice's code">
                                    </div>
                                    
                                    <div class="d-grid">
                                        <button id="submit-combination" class="btn btn-primary">
                                            Submit Combination
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div id="hints-container" class="alert alert-warning" style="display: none;">
                                <h6>Hint:</h6>
                                <p id="hint-text" class="mb-0"></p>
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
                            <h6 class="mb-0">Champion Status</h6>
                        </div>
                        <div class="card-body p-2">
                            <div id="user-statuses" class="list-group list-group-flush">
                                <div id="navigator-status" class="list-group-item d-flex justify-content-between align-items-center">
                                    <span>Navigator</span>
                                    <span class="badge bg-secondary">Waiting</span>
                                </div>
                                <div id="sage-status" class="list-group-item d-flex justify-content-between align-items-center">
                                    <span>Sage</span>
                                    <span class="badge bg-secondary">Waiting</span>
                                </div>
                                <div id="chronicler-status" class="list-group-item d-flex justify-content-between align-items-center">
                                    <span>Chronicler</span>
                                    <span class="badge bg-secondary">Waiting</span>
                                </div>
                                <div id="craftsman-status" class="list-group-item d-flex justify-content-between align-items-center">
                                    <span>Craftsman</span>
                                    <span class="badge bg-secondary">Waiting</span>
                                </div>
                                <div id="apprentice-status" class="list-group-item d-flex justify-content-between align-items-center">
                                    <span>Apprentice</span>
                                    <span class="badge bg-secondary">Waiting</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card mb-4">
                        <div class="card-header">
                            <h6 class="mb-0">Communication</h6>
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
    
    // Set up code sharing
    const shareCodeBtn = document.getElementById('share-code');
    if (shareCodeBtn) {
        shareCodeBtn.addEventListener('click', function() {
            if (myCode && socket && isConnected) {
                socket.emit('challenge_action', {
                    action: 'share_code',
                    payload: {}
                });
                
                // Disable button after sharing
                this.disabled = true;
                this.textContent = 'Code Shared';
                
                // Also mark as shared in the UI
                updateUserStatus(null, myRole, true);
            }
        });
    }
    
    // Set up combination submission
    const submitBtn = document.getElementById('submit-combination');
    if (submitBtn) {
        submitBtn.addEventListener('click', function() {
            if (isSubmitting) return;
            
            // Get code values
            const codes = {
                navigator: document.getElementById('navigator-code').value.trim(),
                sage: document.getElementById('sage-code').value.trim(),
                chronicler: document.getElementById('chronicler-code').value.trim(),
                craftsman: document.getElementById('craftsman-code').value.trim(),
                apprentice: document.getElementById('apprentice-code').value.trim()
            };
            
            // Validate that all codes are filled
            if (!codes.navigator || !codes.sage || !codes.chronicler || 
                !codes.craftsman || !codes.apprentice) {
                updateChallengeStatus('Please fill in all code segments before submitting.');
                return;
            }
            
            // Send the combination
            if (socket && isConnected) {
                isSubmitting = true;
                
                // Update button state
                this.disabled = true;
                this.innerHTML = '<span class="loading-spinner me-2"></span> Submitting...';
                
                socket.emit('challenge_action', {
                    action: 'submit_master_code',
                    payload: { codes }
                });
                
                // Store submitted codes
                submittedCodes = codes;
            }
        });
    }
    
    // Auto-fill code inputs when shared codes are clicked
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('use-code-btn')) {
            const role = e.target.dataset.role;
            const code = e.target.dataset.code;
            
            if (role && code) {
                document.getElementById(`${role}-code`).value = code;
            }
        }
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
 * Update challenge information
 */
function updateChallengeInfo(data) {
    // Update role display
    const roleEl = document.getElementById('my-role');
    if (roleEl) {
        roleEl.textContent = data.role ? data.role.charAt(0).toUpperCase() + data.role.slice(1) : 'Observer';
    }
    
    // Update room name
    const roomNameEl = document.getElementById('room-name');
    if (roomNameEl && data.roomName) {
        roomNameEl.textContent = data.roomName;
    }
    
    // Update code display if available
    const codeDisplayEl = document.getElementById('my-code-display');
    const codeDescEl = document.getElementById('code-description');
    
    if (codeDisplayEl && data.code) {
        codeDisplayEl.textContent = data.code;
        
        // Style based on code type
        if (data.codeType === 'numerical') {
            codeDisplayEl.className = 'code-display code-numerical p-3 bg-light rounded me-3';
        } else if (data.codeType === 'textual') {
            codeDisplayEl.className = 'code-display code-textual p-3 bg-light rounded me-3';
        } else if (data.codeType === 'symbolic') {
            codeDisplayEl.className = 'code-display code-symbolic p-3 bg-light rounded me-3';
        } else if (data.codeType === 'structural') {
            codeDisplayEl.className = 'code-display code-structural p-3 bg-light rounded me-3';
        } else if (data.codeType === 'chromatic') {
            codeDisplayEl.className = 'code-display code-chromatic p-3 bg-light rounded me-3';
        } else {
            codeDisplayEl.className = 'code-display p-3 bg-light rounded me-3';
        }
    }
    
    if (codeDescEl && data.codeDescription) {
        codeDescEl.textContent = data.codeDescription;
    }
}

/**
 * Update user status in the UI
 */
function updateUserStatus(userId, role, isReady) {
    if (!role) role = myRole;
    
    const statusEl = document.getElementById(`${role}-status`);
    if (statusEl) {
        const badgeEl = statusEl.querySelector('.badge');
        
        if (isReady) {
            badgeEl.textContent = 'Ready';
            badgeEl.className = 'badge bg-success';
        }
        
        // Update the name if there's a real user ID
        if (userId) {
            statusEl.querySelector('span:first-child').textContent = `${role.charAt(0).toUpperCase() + role.slice(1)} (${userId})`;
        }
    }
}

/**
 * Update ready status information
 */
function updateReadyStatus(data) {
    const readyCount = data.readyCount;
    const totalPlayers = data.totalPlayers;
    
    updateChallengeStatus(`${readyCount} of ${totalPlayers} champions ready`);
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
 * Start the challenge
 */
function startChallenge(data) {
    // Update status
    updateChallengeStatus(data.message);
    
    // Add system message
    addChatMessage({
        userId: 'System',
        text: data.message,
        timestamp: new Date().toISOString()
    });
    
    // Show hint if provided
    if (data.hint) {
        showHint({ message: data.hint });
    }
}

/**
 * Handle shared code
 */
function codeShared(data) {
    // Store shared code
    sharedCodes[data.role] = {
        code: data.code,
        type: data.codeType,
        description: data.description
    };
    
    // Update shared codes list
    updateSharedCodesList();
    
    // Add system message
    addChatMessage({
        userId: 'System',
        text: `${data.role.charAt(0).toUpperCase() + data.role.slice(1)} has shared their code!`,
        timestamp: new Date().toISOString()
    });
    
    // Update user status
    updateUserStatus(data.userId, data.role, true);
}

/**
 * Update shared codes list
 */
function updateSharedCodesList() {
    const sharedCodesListEl = document.getElementById('shared-codes-list');
    
    if (Object.keys(sharedCodes).length === 0) {
        sharedCodesListEl.innerHTML = `
            <div class="text-center text-muted py-3">
                <small>Shared codes will appear here once they are revealed</small>
            </div>
        `;
        return;
    }
    
    // Clear the list
    sharedCodesListEl.innerHTML = '';
    
    // Add each shared code
    Object.entries(sharedCodes).forEach(([role, data]) => {
        const codeItem = document.createElement('div');
        codeItem.className = 'shared-code-item mb-3 p-3 bg-light rounded';
        
        // Style based on code type
        if (data.type === 'numerical') {
            codeItem.classList.add('code-numerical-light');
        } else if (data.type === 'textual') {
            codeItem.classList.add('code-textual-light');
        } else if (data.type === 'symbolic') {
            codeItem.classList.add('code-symbolic-light');
        } else if (data.type === 'structural') {
            codeItem.classList.add('code-structural-light');
        } else if (data.type === 'chromatic') {
            codeItem.classList.add('code-chromatic-light');
        }
        
        codeItem.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="mb-0">${role.charAt(0).toUpperCase() + role.slice(1)}'s Code</h6>
                <button class="btn btn-sm btn-outline-primary use-code-btn" 
                        data-role="${role}" data-code="${data.code}">
                    Use
                </button>
            </div>
            <div class="code-display mb-2">${data.code}</div>
            <div class="text-muted small">${data.description}</div>
        `;
        
        sharedCodesListEl.appendChild(codeItem);
    });
}

/**
 * Handle successful submission
 */
function submissionSuccess(data) {
    // Reset submitting state
    isSubmitting = false;
    
    // Reset submit button
    const submitBtn = document.getElementById('submit-combination');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Combination';
    }
    
    // Show completion card
    const completeCard = document.getElementById('challenge-complete-card');
    completeCard.style.display = 'block';
    
    // Set message
    document.getElementById('challenge-complete-message').textContent = data.message;
    
    // Add system message
    addChatMessage({
        userId: 'System',
        text: `Success! ${data.submittedBy} has unlocked the master code!`,
        timestamp: new Date().toISOString()
    });
    
    // Update status
    updateChallengeStatus('The Egg of Creation has been unlocked! Challenge completed.');
    
    // Enable the complete challenge button
    const completeBtn = document.getElementById('complete-challenge');
    if (completeBtn) {
        completeBtn.disabled = false;
    }
}

/**
 * Handle failed submission
 */
function submissionFailed(data) {
    // Reset submitting state
    isSubmitting = false;
    
    // Reset submit button
    const submitBtn = document.getElementById('submit-combination');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Combination';
    }
    
    // Show error message
    updateChallengeStatus(data.message);
    
    // Add system message
    addChatMessage({
        userId: 'System',
        text: `Attempt #${data.attempt} failed: ${data.message}`,
        timestamp: new Date().toISOString()
    });
}

/**
 * Show a hint
 */
function showHint(data) {
    const hintsContainer = document.getElementById('hints-container');
    const hintText = document.getElementById('hint-text');
    
    if (hintsContainer && hintText) {
        hintText.textContent = data.message;
        hintsContainer.style.display = 'block';
    }
    
    // Add system message
    addChatMessage({
        userId: 'System',
        text: `Hint: ${data.message}`,
        timestamp: new Date().toISOString()
    });
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