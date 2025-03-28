/**
 * Trivia Group B Challenge
 * Advanced trivia challenge for Sage, Chronicler, and Apprentice
 * focusing on specialized knowledge
 */

let currentQuestion = null;
let userAnswers = {};
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
        // Question received
        socket.on('trivia_b_init', (data) => {
            console.log('Trivia B initialized:', data);
            updateTriviaStatus(data.message);
        });
        
        // User ready event
        socket.on('trivia_b_user_ready', (data) => {
            updateReadyStatus(data);
        });
        
        // Question event
        socket.on('trivia_b_question', (data) => {
            updateTriviaQuestion(data);
            startTimer(data.timeLimit);
        });
        
        // User answered event
        socket.on('trivia_b_user_answered', (data) => {
            updateUserAnsweredStatus(data);
        });
        
        // Question result
        socket.on('trivia_b_question_result', (data) => {
            stopTimer();
            showQuestionResult(data);
        });
        
        // Time's up event
        socket.on('trivia_b_time_up', (data) => {
            stopTimer();
            showTimeUpMessage();
        });
        
        // Challenge complete
        socket.on('trivia_b_complete', (data) => {
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
            
            <div class="timer-container mb-3" style="display: none;">
                <div class="progress">
                    <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width: 100%"></div>
                </div>
                <div class="text-center mt-1">
                    <span id="timer-display">30</span> seconds remaining
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
                    
                    <div id="users-answered" class="text-muted small">
                        <!-- Users who have answered will be shown here -->
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
 * Update the trivia question in the UI
 */
function updateTriviaQuestion(data) {
    currentQuestion = data;
    
    // Update question info
    document.getElementById('question-number').textContent = data.questionNumber;
    document.getElementById('total-questions').textContent = data.totalQuestions;
    document.getElementById('question-category').textContent = data.category || 'Specialized';
    document.getElementById('question-text').textContent = data.question;
    
    // Show the question card
    document.getElementById('trivia-question-card').style.display = 'block';
    
    // Show timer
    document.querySelector('.timer-container').style.display = 'block';
    
    // Hide result card
    document.getElementById('result-card').style.display = 'none';
    
    // Clear users answered
    document.getElementById('users-answered').innerHTML = 'No one has answered yet.';
    
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
            
            optionBtn.addEventListener('click', function() {
                submitAnswer(index);
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
function showTimeUpMessage() {
    // Disable all option buttons
    const optionBtns = document.querySelectorAll('#options-container button');
    optionBtns.forEach(btn => {
        btn.disabled = true;
    });
    
    // Show alert
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-warning mt-3';
    alertDiv.textContent = "Time's up! Waiting for results...";
    
    const questionCard = document.getElementById('trivia-question-card');
    questionCard.querySelector('.card-body').appendChild(alertDiv);
}

/**
 * Submit an answer to the current question
 */
function submitAnswer(answerIndex) {
    if (!socket || !isConnected || !currentQuestion) return;
    
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
    
    // Save user answer
    userAnswers[currentQuestion.questionNumber] = answerIndex;
    
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
 * Update the status of which users have answered
 */
function updateUserAnsweredStatus(data) {
    const usersAnsweredEl = document.getElementById('users-answered');
    
    // Get existing users who have answered
    const existingUsers = usersAnsweredEl.querySelectorAll('.user-answered');
    const userIds = Array.from(existingUsers).map(el => el.dataset.userId);
    
    // Check if this user is already in the list
    if (!userIds.includes(data.userId)) {
        if (usersAnsweredEl.textContent.trim() === 'No one has answered yet.') {
            usersAnsweredEl.innerHTML = '';
        }
        
        const userSpan = document.createElement('span');
        userSpan.className = 'user-answered badge bg-secondary me-1';
        userSpan.dataset.userId = data.userId;
        userSpan.textContent = data.userId;
        
        usersAnsweredEl.appendChild(userSpan);
    }
}

/**
 * Show the result of a question
 */
function showQuestionResult(data) {
    // Hide timer
    document.querySelector('.timer-container').style.display = 'none';
    
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
        'The team answered correctly!' : 
        `The correct answer was option ${String.fromCharCode(65 + data.correctAnswer)}.`;
    
    // Show user answers
    let userAnswersHtml = '<div class="mt-3"><h6>Team Answers:</h6><ul class="list-group">';
    
    Object.entries(data.userAnswers).forEach(([userId, answer]) => {
        const isCorrect = answer === data.correctAnswer;
        const answerText = answer >= 0 ? 
            `Option ${String.fromCharCode(65 + answer)}` : 
            'No answer';
        
        userAnswersHtml += `
            <li class="list-group-item d-flex justify-content-between align-items-center">
                ${userId}
                <span class="badge ${isCorrect ? 'bg-success' : 'bg-danger'}">${answerText}</span>
            </li>
        `;
    });
    
    userAnswersHtml += '</ul></div>';
    
    // Add to result details
    document.getElementById('result-details').innerHTML = userAnswersHtml;
    
    // Highlight correct answer in options
    const optionBtns = document.querySelectorAll('#options-container button');
    optionBtns.forEach(btn => {
        const index = parseInt(btn.dataset.index);
        
        btn.classList.remove('btn-outline-primary', 'btn-primary', 'btn-success', 'btn-danger');
        
        if (index === data.correctAnswer) {
            btn.classList.add('btn-success');
        } else if (index === data.mostCommonAnswer && index !== data.correctAnswer) {
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