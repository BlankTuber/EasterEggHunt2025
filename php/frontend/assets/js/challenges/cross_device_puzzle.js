/**
 * Cross Device Puzzle Challenge
 * 
 * Handles interaction for the mechanical puzzle challenge where
 * Craftsman and Apprentice must coordinate actions across their devices
 */

let puzzleState = null;
let myRole = null;
let myComponents = [];
let chatMessages = [];

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the challenge interface
    const challengeContainer = document.getElementById('convergence-challenge');
    if (!challengeContainer) return;
    
    // Set up initial UI
    setupPuzzleInterface(challengeContainer);
    
    // Socket.io event listeners for this challenge type
    if (socket) {
        // Initialization
        socket.on('cross_device_init', (data) => {
            console.log('Cross Device Puzzle initialized:', data);
            
            // Store data
            myRole = data.role;
            myComponents = data.components || [];
            
            // Update UI
            updatePuzzleStatus(data.puzzleName, data.puzzleDescription, data.instructions);
            initializePuzzleComponents(data.components, data.visibleConnections);
        });
        
        // User joined/ready events
        socket.on('cross_device_user_joined', (data) => {
            updateUserStatus(data.userId, data.role, false);
        });
        
        socket.on('cross_device_user_ready', (data) => {
            updateUserStatus(data.userId, data.role, true);
            updateReadyStatus(data.craftsmanReady, data.apprenticeReady);
        });
        
        // Challenge start
        socket.on('cross_device_start', (data) => {
            startPuzzle(data.componentStates);
        });
        
        // Component updates
        socket.on('cross_device_component_update', (data) => {
            updateComponent(data.componentId, data.state, data.action, data.performedBy);
        });
        
        // Messages
        socket.on('cross_device_message', (data) => {
            addChatMessage(data);
        });
        
        // Puzzle completion
        socket.on('cross_device_puzzle_solved', (data) => {
            puzzleSolved(data);
        });
    }
});

/**
 * Set up the puzzle interface
 */
function setupPuzzleInterface(container) {
    container.innerHTML = `
        <div class="puzzle-container">
            <div class="row">
                <div class="col-md-8">
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5 class="mb-0" id="puzzle-name">Loading puzzle...</h5>
                        </div>
                        <div class="card-body">
                            <p class="mb-3" id="puzzle-description"></p>
                            
                            <div class="alert alert-info" id="puzzle-instructions"></div>
                            
                            <div class="user-status-container mb-4">
                                <div class="d-flex gap-2 mb-2">
                                    <div class="user-status" id="craftsman-status">
                                        <div class="status-indicator"></div>
                                        <span>Craftsman</span>
                                    </div>
                                    <div class="user-status" id="apprentice-status">
                                        <div class="status-indicator"></div>
                                        <span>Apprentice</span>
                                    </div>
                                </div>
                                <div id="ready-status" class="text-muted">Waiting for players to be ready...</div>
                            </div>
                            
                            <div id="puzzle-playground" class="puzzle-playground bg-light p-3 rounded" style="min-height: 300px; display: none;">
                                <div class="text-center text-muted py-5">
                                    Puzzle loading...
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
                    
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Your Components</h5>
                        </div>
                        <div class="card-body">
                            <div id="component-list" class="component-list">
                                <div class="text-center text-muted py-3">
                                    <small>Component list will appear here</small>
                                </div>
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
 * Update the puzzle status information
 */
function updatePuzzleStatus(name, description, instructions) {
    document.getElementById('puzzle-name').textContent = name || 'Cross Device Puzzle';
    document.getElementById('puzzle-description').textContent = description || 'Work together to solve this mechanical puzzle.';
    document.getElementById('puzzle-instructions').textContent = instructions || 'Follow the instructions to complete the puzzle.';
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
function updateReadyStatus(craftsmanReady, apprenticeReady) {
    const readyStatusEl = document.getElementById('ready-status');
    
    if (craftsmanReady && apprenticeReady) {
        readyStatusEl.textContent = 'Both players are ready! The puzzle will start momentarily...';
        readyStatusEl.className = 'text-success';
    } else if (craftsmanReady) {
        readyStatusEl.textContent = 'Craftsman is ready. Waiting for Apprentice...';
        readyStatusEl.className = 'text-muted';
    } else if (apprenticeReady) {
        readyStatusEl.textContent = 'Apprentice is ready. Waiting for Craftsman...';
        readyStatusEl.className = 'text-muted';
    } else {
        readyStatusEl.textContent = 'Waiting for players to be ready...';
        readyStatusEl.className = 'text-muted';
    }
}

/**
 * Initialize the puzzle components
 */
function initializePuzzleComponents(components, visibleConnections) {
    const componentListEl = document.getElementById('component-list');
    componentListEl.innerHTML = '';
    
    if (!components || components.length === 0) {
        componentListEl.innerHTML = '<div class="text-center text-muted py-3"><small>No components available</small></div>';
        return;
    }
    
    // Create component list
    components.forEach(component => {
        const componentCard = document.createElement('div');
        componentCard.className = 'card mb-2 component-card';
        componentCard.dataset.componentId = component.id;
        
        // Get component type icon
        const iconClass = getComponentIcon(component.type);
        
        componentCard.innerHTML = `
            <div class="card-body p-2">
                <div class="d-flex align-items-center">
                    <div class="component-icon me-2">
                        <i class="${iconClass}"></i>
                    </div>
                    <div>
                        <h6 class="mb-0">${component.id}</h6>
                        <div class="text-muted small">${component.type}</div>
                    </div>
                </div>
                <div class="component-actions mt-2">
                    <!-- Component-specific actions will be added here -->
                </div>
            </div>
        `;
        
        // Add component-specific actions
        const actionsContainer = componentCard.querySelector('.component-actions');
        
        // Different components have different actions
        if (component.rotatable) {
            addRotationControls(actionsContainer, component.id);
        }
        
        if (component.toggleable) {
            addToggleControls(actionsContainer, component.id);
        }
        
        if (component.adjustable) {
            addAdjustmentControls(actionsContainer, component.id);
        }
        
        if (component.pullable) {
            addPullControls(actionsContainer, component.id);
        }
        
        if (component.pressable) {
            addPressControls(actionsContainer, component.id);
        }
        
        if (component.connectable) {
            addConnectionControls(actionsContainer, component.id, visibleConnections);
        }
        
        componentListEl.appendChild(componentCard);
    });
    
    // Also prepare the puzzle playground
    initializePuzzlePlayground(components, visibleConnections);
}

/**
 * Get icon class for component type
 */
function getComponentIcon(type) {
    switch (type.toLowerCase()) {
        case 'gear':
            return 'bi bi-gear-fill';
        case 'lever':
            return 'bi bi-toggle-on';
        case 'button':
            return 'bi bi-record-circle';
        case 'switch':
            return 'bi bi-toggle-off';
        case 'wire':
            return 'bi bi-lightning-charge';
        case 'resistor':
            return 'bi bi-slash-lg';
        case 'capacitor':
            return 'bi bi-battery-half';
        case 'led':
            return 'bi bi-lightbulb';
        case 'battery':
            return 'bi bi-battery-full';
        case 'valve':
            return 'bi bi-asterisk';
        case 'pipe':
            return 'bi bi-dash-lg';
        case 'pump':
            return 'bi bi-arrow-clockwise';
        case 'tank':
            return 'bi bi-droplet-fill';
        default:
            return 'bi bi-question-circle';
    }
}

/**
 * Add rotation controls for a component
 */
function addRotationControls(container, componentId) {
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'd-flex gap-2';
    controlsDiv.innerHTML = `
        <button class="btn btn-sm btn-outline-primary" data-action="rotate" data-value="-90" data-component-id="${componentId}">
            <i class="bi bi-arrow-counterclockwise"></i> -90°
        </button>
        <button class="btn btn-sm btn-outline-primary" data-action="rotate" data-value="90" data-component-id="${componentId}">
            <i class="bi bi-arrow-clockwise"></i> +90°
        </button>
    `;
    
    // Add event listeners
    controlsDiv.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', handleComponentAction);
    });
    
    container.appendChild(controlsDiv);
}

/**
 * Add toggle controls for a component
 */
function addToggleControls(container, componentId) {
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'd-flex gap-2';
    controlsDiv.innerHTML = `
        <button class="btn btn-sm btn-outline-primary" data-action="toggle" data-value="on" data-component-id="${componentId}">
            <i class="bi bi-toggle-on"></i> On
        </button>
        <button class="btn btn-sm btn-outline-primary" data-action="toggle" data-value="off" data-component-id="${componentId}">
            <i class="bi bi-toggle-off"></i> Off
        </button>
    `;
    
    // Add event listeners
    controlsDiv.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', handleComponentAction);
    });
    
    container.appendChild(controlsDiv);
}

/**
 * Add adjustment controls for a component
 */
function addAdjustmentControls(container, componentId) {
    const controlsDiv = document.createElement('div');
    controlsDiv.innerHTML = `
        <div class="mb-2">Adjust value:</div>
        <input type="range" class="form-range" min="0" max="100" value="0" id="adjustment-${componentId}">
        <div class="d-flex justify-content-between">
            <span class="small">0</span>
            <span class="small">50</span>
            <span class="small">100</span>
        </div>
        <button class="btn btn-sm btn-primary mt-2" data-action="adjust" data-component-id="${componentId}">
            Apply
        </button>
    `;
    
    // Add event listener for the apply button
    const applyBtn = controlsDiv.querySelector('button');
    applyBtn.addEventListener('click', function() {
        const slider = document.getElementById(`adjustment-${componentId}`);
        const value = parseInt(slider.value);
        
        if (socket && isConnected) {
            socket.emit('challenge_action', {
                action: 'component_action',
                payload: {
                    componentId,
                    action: 'adjust',
                    value
                }
            });
        }
    });
    
    container.appendChild(controlsDiv);
}

/**
 * Add pull controls for a component
 */
function addPullControls(container, componentId) {
    const controlsDiv = document.createElement('div');
    controlsDiv.innerHTML = `
        <button class="btn btn-sm btn-primary" data-action="pull" data-component-id="${componentId}">
            <i class="bi bi-arrow-down-circle"></i> Pull
        </button>
    `;
    
    // Add event listener
    controlsDiv.querySelector('button').addEventListener('click', handleComponentAction);
    
    container.appendChild(controlsDiv);
}

/**
 * Add press controls for a component
 */
function addPressControls(container, componentId) {
    const controlsDiv = document.createElement('div');
    controlsDiv.innerHTML = `
        <button class="btn btn-sm btn-primary" data-action="press" data-component-id="${componentId}">
            <i class="bi bi-hand-index-thumb"></i> Press
        </button>
    `;
    
    // Add event listener
    controlsDiv.querySelector('button').addEventListener('click', handleComponentAction);
    
    container.appendChild(controlsDiv);
}

/**
 * Add connection controls for a component
 */
function addConnectionControls(container, componentId, visibleConnections) {
    const controlsDiv = document.createElement('div');
    controlsDiv.innerHTML = `
        <div class="mb-2">Connect to:</div>
        <select class="form-select form-select-sm mb-2" id="connection-${componentId}">
            <option value="">Select component...</option>
            ${visibleConnections.map(conn => `<option value="${conn}">${conn}</option>`).join('')}
        </select>
        <button class="btn btn-sm btn-primary" data-action="connect" data-component-id="${componentId}">
            <i class="bi bi-link"></i> Connect
        </button>
    `;
    
    // Add event listener for the connect button
    const connectBtn = controlsDiv.querySelector('button');
    connectBtn.addEventListener('click', function() {
        const select = document.getElementById(`connection-${componentId}`);
        const target = select.value;
        
        if (target && socket && isConnected) {
            socket.emit('challenge_action', {
                action: 'component_action',
                payload: {
                    componentId,
                    action: 'connect',
                    target
                }
            });
        }
    });
    
    container.appendChild(controlsDiv);
}

/**
 * Initialize the puzzle playground (visual representation)
 */
function initializePuzzlePlayground(components, visibleConnections) {
    const playgroundEl = document.getElementById('puzzle-playground');
    
    // For simplicity, we'll just show a diagram of components and connections
    // In a real implementation, this would be a more sophisticated interactive visualization
    
    playgroundEl.innerHTML = '<div class="text-center mb-4"><strong>Interactive Diagram</strong></div>';
    
    // Create SVG diagram container
    const svgContainer = document.createElement('div');
    svgContainer.className = 'svg-container';
    svgContainer.innerHTML = `
        <svg id="puzzle-svg" width="100%" height="250" class="border rounded bg-white">
            <!-- Components will be added here -->
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#333" />
                </marker>
            </defs>
        </svg>
    `;
    
    playgroundEl.appendChild(svgContainer);
    
    // Create legend
    const legendDiv = document.createElement('div');
    legendDiv.className = 'legend mt-3';
    legendDiv.innerHTML = `
        <div class="d-flex flex-wrap gap-3 justify-content-center">
            <div class="d-flex align-items-center">
                <div class="square bg-primary me-1"></div>
                <small>Your components</small>
            </div>
            <div class="d-flex align-items-center">
                <div class="square bg-secondary me-1"></div>
                <small>Other player's components</small>
            </div>
            <div class="d-flex align-items-center">
                <div class="square bg-success me-1"></div>
                <small>Connected components</small>
            </div>
        </div>
    `;
    
    // Add some basic CSS for the legend
    const style = document.createElement('style');
    style.textContent = `
        .legend .square {
            width: 16px;
            height: 16px;
            border-radius: 2px;
        }
    `;
    document.head.appendChild(style);
    
    playgroundEl.appendChild(legendDiv);
    
    // Show the playground
    playgroundEl.style.display = 'block';
}

/**
 * Start the puzzle when both players are ready
 */
function startPuzzle(componentStates) {
    puzzleState = componentStates;
    
    // Show a message
    addChatMessage({
        userId: 'System',
        text: 'The puzzle has begun! Work together to solve the mechanical puzzle.',
        timestamp: new Date().toISOString()
    });
    
    // Redraw the puzzle with initial states
    updatePuzzlePlayground(componentStates);
}

/**
 * Update the puzzle playground with new component states
 */
function updatePuzzlePlayground(componentStates) {
    // In a real implementation, this would update the visual representation
    // For simplicity, we'll just add a message
    addChatMessage({
        userId: 'System',
        text: 'Puzzle state updated.',
        timestamp: new Date().toISOString()
    });
}

/**
 * Update a component state
 */
function updateComponent(componentId, state, action, performedBy) {
    // Update the puzzle state
    if (puzzleState && puzzleState[componentId]) {
        puzzleState[componentId] = state;
    }
    
    // Update the component in the UI
    const componentCard = document.querySelector(`.component-card[data-component-id="${componentId}"]`);
    if (componentCard) {
        // Visual update based on action
        componentCard.classList.add('highlight-update');
        setTimeout(() => {
            componentCard.classList.remove('highlight-update');
        }, 1000);
    }
    
    // Add message about the action
    addChatMessage({
        userId: 'System',
        text: `${performedBy} ${action}ed component ${componentId}`,
        timestamp: new Date().toISOString()
    });
    
    // Update the puzzle playground
    updatePuzzlePlayground(puzzleState);
}

/**
 * Handle a component action
 */
function handleComponentAction(e) {
    const btn = e.currentTarget;
    const componentId = btn.dataset.componentId;
    const action = btn.dataset.action;
    const value = btn.dataset.value;
    
    if (componentId && action && socket && isConnected) {
        socket.emit('challenge_action', {
            action: 'component_action',
            payload: {
                componentId,
                action,
                value
            }
        });
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
 * Show the puzzle solved message
 */
function puzzleSolved(data) {
    // Show solved card
    const solvedCard = document.getElementById('puzzle-solved-card');
    solvedCard.style.display = 'block';
    
    // Set message
    document.getElementById('puzzle-solved-message').textContent = data.message;
    
    // Add message to chat
    addChatMessage({
        userId: 'System',
        text: 'Congratulations! You have successfully solved the puzzle!',
        timestamp: new Date().toISOString()
    });
    
    // Enable the complete challenge button
    const completeBtn = document.getElementById('complete-challenge');
    if (completeBtn) {
        completeBtn.disabled = false;
    }
}