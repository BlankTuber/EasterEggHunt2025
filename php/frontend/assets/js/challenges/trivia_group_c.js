/**
 * Trivia Group C Challenge
 * Tech-focused trivia for Navigator and Craftsman
 * This involves turn-based gameplay where players alternate answering
 */

let currentQuestion = null;
let activePlayer = null;
let isMyTurn = false;
let timer = null;
let timeLeft = 0;

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the challenge interface
    const challengeContainer = document.getElementById('convergence-challenge');
    if (!challengeContainer) return;
    
    // Set up initial UI
    setupTriviaInterface(challengeContainer);
    
    // Socket.io event listeners for this challenge type
    if (socket) {
        // Initialization
        socket.on('trivia_c_init', (data) => {
            console.log('Trivia C initialized:', data);
            updateTriviaStatus(data.message);
        });
        
        // User ready event
        socket.on('trivia_c_user_ready', (data) => {
            updateReadyStatus(data);
        });
        
        // Question event
        socket.on('trivia_c_question', (data) => {
            updateTriviaQuestion(data);
            startTimer(data.timeLimit);
            
            // Check if it's this user's turn
            const currentUserId = localStorage.getItem('current_user_id') || '';
            isMyTurn = (data.activePlayer === currentUserId);
            
            // Update turn indicator
            updateTurnIndicator(data.activePlayer);
        });
        
        // Answer result
        socket.on('trivia_c_answer_result', (data) => {
            stopTimer();
            showAnswerResult(data);
        });
        
        // Time's up event
        socket.on('trivia_c_time_up', (data) => {
            stopTimer();
            showTimeUpMessage(data);
        });
        
        // Hint received
        socket.on('trivia_c_hint', (data) => {
            showHint(data);
        });
        
        // Challenge complete
        socket.on('trivia_c_complete', (data) => {
            showTriviaComplete(data);
        });
    }
});

/**
 * Set up the trivia interface
 */
function setupTriviaInterface(container) {
    container.innerHTML = `
        <div class="trivia-container">
            <div class="trivia-status alert alert-info mb-4">
                <p class="mb-0">Waiting for all players to be ready...</p>
            </div>
            
            <div class="turn-indicator mb-3 alert alert-secondary" style="display: none;">
                <strong>Current Player:</strong> <span id="active-player">Waiting...</span>
            </div>
            
            <div class="timer-container mb-3" style="display: none;">
                <div class="progress">
                    <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width: 100%"></div>
                </div>
                <div class="text-center mt-1">
                    <span id="timer-display">20</span> seconds remaining
                </div>
            </div>
            
            <div class="card" id="trivia-question-card" style="display: none;">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Question <span id="question-number">1</span> of <span id="total-questions">5</span></h5>
                    <span class="badge bg-info" id="question-category">Category</span>
                </div>
                <div class="card-body">
                    <p class="lead mb-4" id="question-text">Question will appear here...</p>
                    
                    <div id="options-container" class="mb-4">
                        <!-- Options will be populated here -->
                    </div>
                    
                    <div id="hint-container" class="alert alert-info" style="display: none;">
                        <strong>Hint:</strong> <span id="hint-text"></span>
                    </div>
                </div>
                <div class="card-footer">
                    <div class="row">
                        <div class="col-6">
                            <div id="my-turn-controls" style="display: none;">
                                <p class="text-success"><strong>It's your turn!</strong></p>
                            </div>
                            <div id="not-my-turn-controls" style="display: none;">
                                <p class="text-muted">Waiting for other player to answer...</p>
                                <input type="text" id="hint-input" class="form-control mb-2" placeholder="Send a hint to help...">
                                <button id="send-hint" class="btn btn-outline-primary btn-sm">Send Hint</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card mt-4" id="result-card" style="display: none;">
                <div class="card-body">
                    <h5 id="result-title">Result</h5>
                    <p id="result-message"></p>
                    <div id="result-details"></div>
                </div>
            </div>
        </div>
    `;
    
    // Set up hint sending
    const sendHintBtn = document.getElementById('send-hint');
    if (sendHintBtn) {
        sendHintBtn.addEventListener('click', function() {
            const hintInput = document.getElementById('hint-input');
            const hint = hintInput.value.trim();
            
            if (hint && socket && isConnected) {
                socket.emit('challenge_action', {
                    action: 'hint',
                    payload: { hint }
                });
                
                // Clear input
                hintInput.value = '';
                
                // Show confirmation
                sendHintBtn.textContent = 'Hint Sent!';
                sendHintBtn.disabled = true;
                
                setTimeout(() => {
                    sendHintBtn.textContent = 'Send Hint';
                    sendHintBtn.disabled = false;
                }, 2000);
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
 * Update trivia status message
 */
function updateTriviaStatus(message) {
    const statusEl = document.querySelector('.trivia-status p');
    if (statusEl) {
        statusEl.textContent = message;
    }
}

/**
 * Update ready status
 */
function updateReadyStatus(data) {
    updateTriviaStatus(`${data.readyCount} of ${data.totalUsers} players ready`);
}

/**
 * Update turn indicator
 */
function updateTurnIndicator(playerId) {
    const turnIndicator = document.querySelector('.turn-indicator');
    const activePlayerEl = document.getElementById('active-player');
    
    if (turnIndicator && activePlayerEl) {
        turnIndicator.style.display = 'block';
        activePlayerEl.textContent = playerId;
        
        // Highlight if it's this user's turn
        if (isMyTurn) {
            turnIndicator.classList.remove('alert-secondary');
            turnIndicator.classList.add('alert-success');
            document.getElementById('my-turn-controls').style.display = 'block';
            document.getElementById('not-my-turn-controls').style.display = 'none';
        } else {
            turnIndicator.classList.remove('alert-success');
            turnIndicator.classList.add('alert-secondary');
            document.getElementById('my-turn-controls').style.display = 'none';
            document.getElementById('not-my-turn-controls').style.display = 'block';
        }
    }
}

/**
 * Update the trivia question in the UI
 */
function updateTriviaQuestion(data) {
    currentQuestion = data;
    activePlayer = data.activePlayer;
    
    // Update question info
    document.getElementById('question-number').textContent = data.questionNumber;
    document.getElementById('total-questions').textContent = data.totalQuestions;
    document.getElementById('question-category').textContent = data.category || 'Technology';
    document.getElementById('question-text').textContent = data.question;
    
    // Show the question card
    document.getElementById('trivia-question-card').style.display = 'block';
    
    // Show timer if it's my turn
    document.querySelector('.timer-container').style.display = isMyTurn ? 'block' : 'none';
    
    // Hide result card
    document.getElementById('result-card').style.display = 'none';
    
    // Hide hint
    document.getElementById('hint-container').style.display = 'none';
    
    // Populate options
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    if (data.options && data.options.length) {
        data.options.forEach((option, index) => {
            const optionBtn = document.createElement('button');
            optionBtn.className = 'btn btn-outline-primary d-block w-100 text-start mb-2 p-3';
            optionBtn.dataset.index = index;
            optionBtn.innerHTML = `
                <span class="option-letter">${String.fromCharCode(65 + index)}.</span>
                ${option}
            `;
            
            // Only enable if it's my turn
            optionBtn.disabled = !isMyTurn;
            
            optionBtn.addEventListener('click', function() {
                if (isMyTurn) {
                    submitAnswer(index);
                }
            });
            
            optionsContainer.appendChild(optionBtn);
        });
    }
    
    // Update status
    updateTriviaStatus(`Question ${data.questionNumber} of ${data.totalQuestions} - ${data.category}`);
}

/**
 * Start the timer for the current question
 */
function startTimer(seconds) {
    // Only start timer if it's my turn
    if (!isMyTurn) return;
    
    stopTimer();
    
    timeLeft = seconds;
    updateTimerDisplay();
    
    const progressBar = document.querySelector('.progress-bar');
    progressBar.style.width = '100%';
    
    // Start countdown
    timer = setInterval(() => {
        timeLeft--;
        
        if (timeLeft <= 0) {
            stopTimer();
            return;
        }
        
        // Update timer display
        updateTimerDisplay();
        
        // Update progress bar
        const percentage = (timeLeft / seconds) * 100;
        progressBar.style.width = `${percentage}%`;
        
        // Change color when time is running low
        if (timeLeft <= 5) {
            progressBar.classList.remove('bg-primary', 'bg-warning');
            progressBar.classList.add('bg-danger');
        } else if (timeLeft <= 10) {
            progressBar.classList.remove('bg-primary', 'bg-danger');
            progressBar.classList.add('bg-warning');
        }
    }, 1000);
}

/**
 * Stop the timer
 */
function stopTimer() {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
}

/**
 * Update timer display
 */
function updateTimerDisplay() {
    const timerDisplay = document.getElementById('timer-display');
    if (timerDisplay) {
        timerDisplay.textContent = timeLeft;
    }
}

/**
 * Show time's up message
 */
function showTimeUpMessage(data) {
    // Only relevant if it was my turn
    if (!isMyTurn) return;
    
    // Disable all option buttons
    const optionBtns = document.querySelectorAll('#options-container button');
    optionBtns.forEach(btn => {
        btn.disabled = true;
    });
    
    // Show alert
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-warning mt-3';
    alertDiv.textContent = "Time's up! The correct answer was option " + 
                           String.fromCharCode(65 + data.correctAnswer) + ".";
    
    const questionCard = document.getElementById('trivia-question-card');
    questionCard.querySelector('.card-body').appendChild(alertDiv);
}

/**
 * Submit an answer to the current question
 */
function submitAnswer(answerIndex) {
    if (!socket || !isConnected || !currentQuestion || !isMyTurn) return;
    
    // Disable all option buttons
    const optionBtns = document.querySelectorAll('#options-container button');
    optionBtns.forEach(btn => {
        btn.disabled = true;
        
        // Highlight selected answer
        if (parseInt(btn.dataset.index) === answerIndex) {
            btn.classList.remove('btn-outline-primary');
            btn.classList.add('btn-primary');
        }
    });
    
    // Send answer to server
    socket.emit('challenge_action', {
        action: 'answer',
        payload: {
            answerIndex,
            questionNumber: currentQuestion.questionNumber
        }
    });
}

/**
 * Show a hint
 */
function showHint(data) {
    const hintContainer = document.getElementById('hint-container');
    const hintText = document.getElementById('hint-text');
    
    if (hintContainer && hintText) {
        hintText.textContent = data.hint;
        hintContainer.style.display = 'block';
    }
}

/**
 * Show the result of an answer
 */
function showAnswerResult(data) {
    // Show the result card
    const resultCard = document.getElementById('result-card');
    resultCard.style.display = 'block';
    
    // Set result title
    const resultTitle = document.getElementById('result-title');
    resultTitle.textContent = data.isCorrect ? 'Correct Answer!' : 'Incorrect Answer';
    resultTitle.className = data.isCorrect ? 'text-success' : 'text-danger';
    
    // Set result message
    document.getElementById('result-message').textContent = 
        data.isCorrect ? 
        `${data.userId} answered correctly!` : 
        `${data.userId} answered incorrectly. The correct answer was option ${String.fromCharCode(65 + data.correctAnswer)}.`;
    
    // Highlight correct answer in options
    const optionBtns = document.querySelectorAll('#options-container button');
    optionBtns.forEach(btn => {
        const index = parseInt(btn.dataset.index);
        
        btn.classList.remove('btn-outline-primary', 'btn-primary', 'btn-success', 'btn-danger');
        
        if (index === data.correctAnswer) {
            btn.classList.add('btn-success');
        } else if (index === data.answerIndex && index !== data.correctAnswer) {
            btn.classList.add('btn-danger');
        } else {
            btn.classList.add('btn-outline-secondary');
        }
    });
}

/**
 * Show the final trivia results
 */
function showTriviaComplete(data) {
    // Hide question card
    document.getElementById('trivia-question-card').style.display = 'none';
    
    // Hide timer
    document.querySelector('.timer-container').style.display = 'none';
    
    // Hide turn indicator
    document.querySelector('.turn-indicator').style.display = 'none';
    
    // Show result card
    const resultCard = document.getElementById('result-card');
    resultCard.style.display = 'block';
    
    // Set result title
    const resultTitle = document.getElementById('result-title');
    resultTitle.textContent = data.passed ? 'Challenge Completed!' : 'Challenge Failed';
    resultTitle.className = data.passed ? 'text-success' : 'text-danger';
    
    // Set result message
    document.getElementById('result-message').textContent = data.message;
    
    // Show details
    const resultDetails = document.getElementById('result-details');
    resultDetails.innerHTML = `
        <div class="mt-3">
            <p><strong>Score:</strong> ${data.totalScore} out of ${data.maxPossibleScore} (${data.successPercentage}%)</p>
            
            <div class="progress mb-4">
                <div class="progress-bar ${data.passed ? 'bg-success' : 'bg-danger'}" 
                     role="progressbar" 
                     style="width: ${data.successPercentage}%" 
                     aria-valuenow="${data.successPercentage}" 
                     aria-valuemin="0" 
                     aria-valuemax="100">
                    ${data.successPercentage}%
                </div>
            </div>
            
            <h6>Individual Scores:</h6>
            <ul class="list-group">
                ${Object.entries(data.scores).map(([userId, score]) => `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        ${userId}
                        <span class="badge bg-primary">${score} points</span>
                    </li>
                `).join('')}
            </ul>
        </div>
    `;
    
    // Enable the complete challenge button if passed
    if (data.passed) {
        const completeBtn = document.getElementById('complete-challenge');
        if (completeBtn) {
            completeBtn.disabled = false;
        }
        
        // Update status
        updateTriviaStatus('Challenge completed successfully! Click the "Complete Challenge" button to continue.');
    } else {
        // Update status
        updateTriviaStatus('Challenge failed. You can try again.');
    }
}