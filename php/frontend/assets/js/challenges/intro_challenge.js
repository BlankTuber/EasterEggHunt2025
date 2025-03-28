/**
 * Introduction Challenge
 * 
 * A simple introduction to the game mechanics and interface
 */

let currentStep = 0;
const totalSteps = 3;

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the challenge interface
    const challengeContainer = document.getElementById('convergence-challenge');
    if (!challengeContainer) return;
    
    // Set up initial UI
    setupIntroInterface(challengeContainer);
    
    // Socket.io event listeners for this challenge type
    if (socket) {
        // Welcome message
        socket.on('intro_message', (data) => {
            updateIntroMessage(data.message);
            setupIntroSteps(data.steps);
        });
        
        // User joined event
        socket.on('intro_user_joined', (data) => {
            addStatusMessage(`${data.userId} has joined the introduction.`);
        });
        
        // User completed step event
        socket.on('intro_step_completed', (data) => {
            addStatusMessage(`${data.userId} has completed step ${data.step}.`);
        });
        
        // User ready event
        socket.on('intro_user_ready', (data) => {
            addStatusMessage(`${data.userId} is ready to begin the journey.`);
        });
        
        // Introduction completion ready
        socket.on('intro_complete_ready', (data) => {
            showCompletionMessage(data.message);
        });
        
        // Acknowledgement (for debugging)
        socket.on('intro_acknowledgement', (data) => {
            console.log('Acknowledgement:', data);
        });
    }
});

/**
 * Set up the introduction interface
 */
function setupIntroInterface(container) {
    container.innerHTML = `
        <div class="intro-challenge-container">
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="mb-0">Welcome to the Kingdom of Neerbye</h5>
                </div>
                <div class="card-body">
                    <div class="mb-4">
                        <img src="/frontend/assets/img/logo.png" alt="Kingdom Hunt" class="img-fluid mx-auto d-block" style="max-width: 150px;">
                    </div>
                    
                    <div class="alert alert-info mb-4" id="intro-message">
                        <p class="mb-0">Loading introduction...</p>
                    </div>
                    
                    <div id="intro-steps-container" class="mb-4">
                        <h6>Complete these steps:</h6>
                        <div id="intro-steps" class="list-group">
                            <!-- Steps will be added here -->
                        </div>
                    </div>
                    
                    <div id="status-messages" class="mb-4">
                        <h6>Status:</h6>
                        <div class="status-container bg-light p-3 rounded" style="max-height: 150px; overflow-y: auto;">
                            <div class="text-muted text-center">
                                <small>Status messages will appear here</small>
                            </div>
                        </div>
                    </div>
                    
                    <div id="interactive-element" class="mb-4 text-center">
                        <div class="interactive-box p-4 bg-light rounded">
                            <i class="bi bi-hand-index" style="font-size: 2rem;"></i>
                            <p>Click this box to interact</p>
                        </div>
                    </div>
                    
                    <div class="d-grid">
                        <button id="continue-button" class="btn btn-primary" disabled>
                            Continue to Next Step
                        </button>
                    </div>
                </div>
            </div>
            
            <div id="intro-complete-card" class="card mb-4" style="display: none;">
                <div class="card-header bg-success text-white">
                    <h5 class="mb-0">Introduction Completed!</h5>
                </div>
                <div class="card-body">
                    <p id="completion-message"></p>
                    <div class="d-grid">
                        <button id="complete-intro" class="btn btn-success">
                            Begin Your Journey
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Set up interactive element
    const interactiveBox = document.querySelector('.interactive-box');
    if (interactiveBox) {
        interactiveBox.addEventListener('click', function() {
            if (currentStep === 1) {
                // Mark step 2 as completed
                completeStep(1);
                
                // Update interactive element
                this.innerHTML = `
                    <i class="bi bi-check-circle-fill text-success" style="font-size: 2rem;"></i>
                    <p>Excellent! You've interacted with the element.</p>
                `;
                
                // Send step completion to server
                if (socket && isConnected) {
                    socket.emit('challenge_action', {
                        action: 'step_completed',
                        payload: { step: 2 }
                    });
                }
            }
        });
    }
    
    // Set up continue button
    const continueBtn = document.getElementById('continue-button');
    if (continueBtn) {
        continueBtn.addEventListener('click', function() {
            currentStep++;
            
            if (currentStep >= totalSteps) {
                // Complete the final step
                completeStep(2);
                
                // Send completion to server
                if (socket && isConnected) {
                    socket.emit('challenge_action', {
                        action: 'step_completed',
                        payload: { step: 'final' }
                    });
                }
                
                // Disable the button
                this.disabled = true;
                this.textContent = 'Completing Introduction...';
            } else {
                // Complete the current step
                completeStep(currentStep - 1);
                
                // Update continue button
                if (currentStep === totalSteps - 1) {
                    this.textContent = 'Complete Introduction';
                }
                
                // Send step completion to server
                if (socket && isConnected) {
                    socket.emit('challenge_action', {
                        action: 'step_completed',
                        payload: { step: currentStep }
                    });
                }
            }
        });
    }
    
    // Set up complete intro button
    const completeIntroBtn = document.getElementById('complete-intro');
    if (completeIntroBtn) {
        completeIntroBtn.addEventListener('click', function() {
            // Enable the challenge completion button
            const completeBtn = document.getElementById('complete-challenge');
            if (completeBtn) {
                completeBtn.disabled = false;
            }
            
            // Notify server that user is ready
            if (socket && isConnected) {
                socket.emit('challenge_action', {
                    action: 'ready',
                    payload: {}
                });
            }
            
            // Update button
            this.disabled = true;
            this.textContent = 'Ready!';
        });
    }
}

/**
 * Update the introduction message
 */
function updateIntroMessage(message) {
    const messageEl = document.getElementById('intro-message');
    if (messageEl) {
        messageEl.innerHTML = `<p class="mb-0">${message}</p>`;
    }
}

/**
 * Set up the introduction steps
 */
function setupIntroSteps(steps) {
    const stepsContainer = document.getElementById('intro-steps');
    if (!stepsContainer || !steps || !steps.length) return;
    
    // Clear the container
    stepsContainer.innerHTML = '';
    
    // Add each step
    steps.forEach((step, index) => {
        const stepEl = document.createElement('div');
        stepEl.className = 'list-group-item d-flex justify-content-between align-items-center';
        stepEl.innerHTML = `
            <div>
                <span class="step-number">${index + 1}.</span> ${step}
            </div>
            <span class="badge bg-secondary step-badge step-${index}">Pending</span>
        `;
        
        stepsContainer.appendChild(stepEl);
    });
    
    // Complete the first step automatically
    setTimeout(() => {
        completeStep(0);
        
        // Send step completion to server
        if (socket && isConnected) {
            socket.emit('challenge_action', {
                action: 'step_completed',
                payload: { step: 1 }
            });
        }
    }, 2000);
}

/**
 * Mark a step as completed
 */
function completeStep(stepIndex) {
    const stepBadge = document.querySelector(`.step-${stepIndex}`);
    if (stepBadge) {
        stepBadge.className = 'badge bg-success step-badge step-' + stepIndex;
        stepBadge.textContent = 'Completed';
    }
    
    // Enable continue button if appropriate
    const continueBtn = document.getElementById('continue-button');
    if (continueBtn) {
        if (stepIndex === 0) {
            continueBtn.disabled = false;
        } else if (stepIndex === 1) {
            continueBtn.disabled = false;
        }
    }
}

/**
 * Add a status message
 */
function addStatusMessage(message) {
    const statusContainer = document.querySelector('.status-container');
    
    // Clear placeholder if this is the first message
    if (statusContainer.querySelector('.text-muted')) {
        statusContainer.innerHTML = '';
    }
    
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = 'status-message mb-1';
    messageEl.innerHTML = `
        <small>${message}</small>
    `;
    
    statusContainer.appendChild(messageEl);
    
    // Scroll to bottom
    statusContainer.scrollTop = statusContainer.scrollHeight;
}

/**
 * Show completion message
 */
function showCompletionMessage(message) {
    // Show the completion card
    const completeCard = document.getElementById('intro-complete-card');
    completeCard.style.display = 'block';
    
    // Set message
    document.getElementById('completion-message').textContent = message;
    
    // Scroll to the card
    completeCard.scrollIntoView({ behavior: 'smooth' });
}