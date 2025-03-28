/**
 * Navigator Math Sequence Challenge
 * 
 * Math pattern recognition puzzle for the Navigator
 */

// Game variables
let sequences = [];
let currentSequence = 0;
let attempts = 0;
let gameCompleted = false;

document.addEventListener('DOMContentLoaded', function() {
    // Find the individual challenge container
    const challengeContainer = document.getElementById('individual-challenge');
    if (!challengeContainer) return;
    
    // Create game container
    setupMathSequence(challengeContainer);
    
    // Initialize sequences
    initializeSequences();
    
    // Show first sequence
    showCurrentSequence();
});

/**
 * Set up the Math Sequence interface
 */
function setupMathSequence(container) {
    container.innerHTML = `
        <div class="math-sequence-container">
            <div class="text-center mb-4">
                <h3>Mathematical Sequences</h3>
                <p class="text-muted">Find the pattern and complete each sequence</p>
            </div>
            
            <div class="card mb-4">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Sequence <span id="sequence-number">1</span> of <span id="total-sequences">5</span></h5>
                    <span class="badge bg-primary" id="attempts-badge">Attempts: 0</span>
                </div>
                <div class="card-body">
                    <div class="sequence-display mb-4 text-center">
                        <div id="sequence-numbers" class="d-flex justify-content-center flex-wrap gap-2 mb-3">
                            <!-- Sequence numbers will be inserted here -->
                        </div>
                        
                        <div class="missing-number-container">
                            <input type="number" id="user-answer" class="form-control form-control-lg text-center" placeholder="?">
                            <div class="form-text text-center">Enter the next number in the sequence</div>
                        </div>
                    </div>
                    
                    <div id="feedback-message" class="alert d-none mb-3">
                        <!-- Feedback will appear here -->
                    </div>
                    
                    <div class="d-grid">
                        <button id="check-answer" class="btn btn-primary">Check Answer</button>
                    </div>
                </div>
            </div>
            
            <div class="text-center" id="hint-container">
                <button id="show-hint" class="btn btn-outline-secondary btn-sm">Need a Hint?</button>
                <div id="hint-text" class="alert alert-info mt-2 d-none"></div>
            </div>
            
            <div id="completion-card" class="card mt-4 d-none">
                <div class="card-header bg-success text-white">
                    <h5 class="mb-0">Challenge Completed!</h5>
                </div>
                <div class="card-body text-center">
                    <p>You have successfully completed all sequences.</p>
                    <p>The patterns of mathematics have revealed their secrets to you.</p>
                    <button id="complete-button" class="btn btn-success">Complete Challenge</button>
                </div>
            </div>
        </div>
    `;
    
    // Set up check answer button
    const checkAnswerBtn = document.getElementById('check-answer');
    const userAnswerInput = document.getElementById('user-answer');
    
    if (checkAnswerBtn && userAnswerInput) {
        checkAnswerBtn.addEventListener('click', function() {
            checkAnswer();
        });
        
        // Also check on Enter key
        userAnswerInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                checkAnswer();
            }
        });
    }
    
    // Set up hint button
    const hintBtn = document.getElementById('show-hint');
    if (hintBtn) {
        hintBtn.addEventListener('click', function() {
            showHint();
        });
    }
    
    // Set up complete button
    const completeBtn = document.getElementById('complete-button');
    if (completeBtn) {
        completeBtn.addEventListener('click', function() {
            // Enable the challenge completion button
            const challengeCompleteBtn = document.getElementById('complete-challenge');
            if (challengeCompleteBtn) {
                challengeCompleteBtn.disabled = false;
                
                // Scroll to it
                challengeCompleteBtn.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
}

/**
 * Initialize sequence puzzles
 */
function initializeSequences() {
    sequences = [
        {
            numbers: [2, 4, 6, 8, 10],
            next: 12,
            pattern: 'Add 2 to each number',
            hint: 'Look at the difference between consecutive numbers'
        },
        {
            numbers: [1, 3, 9, 27, 81],
            next: 243,
            pattern: 'Multiply each number by 3',
            hint: 'Try dividing each number by the previous one'
        },
        {
            numbers: [1, 4, 9, 16, 25],
            next: 36,
            pattern: 'Square numbers: 1², 2², 3², 4², 5², 6²',
            hint: 'These are perfect squares of consecutive integers'
        },
        {
            numbers: [1, 1, 2, 3, 5, 8],
            next: 13,
            pattern: 'Fibonacci sequence: each number is the sum of the two preceding ones',
            hint: 'Add the last two numbers to get the next one'
        },
        {
            numbers: [3, 7, 15, 31, 63],
            next: 127,
            pattern: 'Double the previous number and add 1',
            hint: 'Think about powers of 2 with a small adjustment'
        }
    ];
}

/**
 * Show the current sequence
 */
function showCurrentSequence() {
    // Update sequence number
    document.getElementById('sequence-number').textContent = currentSequence + 1;
    document.getElementById('total-sequences').textContent = sequences.length;
    
    // Reset attempts for this sequence
    attempts = 0;
    document.getElementById('attempts-badge').textContent = 'Attempts: 0';
    
    // Clear previous feedback
    const feedbackEl = document.getElementById('feedback-message');
    feedbackEl.classList.add('d-none');
    
    // Clear answer input
    document.getElementById('user-answer').value = '';
    
    // Reset hint
    document.getElementById('hint-text').classList.add('d-none');
    document.getElementById('show-hint').disabled = false;
    
    // Display sequence numbers
    const sequenceDisplay = document.getElementById('sequence-numbers');
    sequenceDisplay.innerHTML = '';
    
    sequences[currentSequence].numbers.forEach(num => {
        const numElement = document.createElement('div');
        numElement.className = 'sequence-number';
        numElement.style.cssText = 'width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; background-color: #f8f9fa; border-radius: 5px; font-weight: bold; font-size: 1.5rem;';
        numElement.textContent = num;
        sequenceDisplay.appendChild(numElement);
    });
    
    // Add question mark for next number
    const questionMark = document.createElement('div');
    questionMark.className = 'sequence-number missing';
    questionMark.style.cssText = 'width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; background-color: #e2e3e5; border-radius: 5px; font-weight: bold; font-size: 1.5rem; color: #6c757d;';
    questionMark.textContent = '?';
    sequenceDisplay.appendChild(questionMark);
}

/**
 * Check the user's answer
 */
function checkAnswer() {
    const userAnswerInput = document.getElementById('user-answer');
    const userAnswer = parseInt(userAnswerInput.value);
    
    // Validate input
    if (isNaN(userAnswer)) {
        showFeedback('Please enter a valid number', 'warning');
        return;
    }
    
    // Increment attempts
    attempts++;
    document.getElementById('attempts-badge').textContent = `Attempts: ${attempts}`;
    
    // Check answer
    const correctAnswer = sequences[currentSequence].next;
    if (userAnswer === correctAnswer) {
        // Correct answer
        showFeedback(`Correct! The pattern is: ${sequences[currentSequence].pattern}`, 'success');
        
        // Update the question mark to show correct answer
        const questionMark = document.querySelector('.sequence-number.missing');
        questionMark.textContent = correctAnswer;
        questionMark.style.backgroundColor = '#d4edda';
        questionMark.style.color = '#155724';
        
        // Disable input and buttons
        userAnswerInput.disabled = true;
        document.getElementById('check-answer').disabled = true;
        document.getElementById('show-hint').disabled = true;
        
        // Move to next sequence after delay
        setTimeout(() => {
            currentSequence++;
            
            if (currentSequence < sequences.length) {
                // Show next sequence
                showCurrentSequence();
                
                // Re-enable input and buttons
                userAnswerInput.disabled = false;
                document.getElementById('check-answer').disabled = false;
            } else {
                // All sequences completed
                document.getElementById('completion-card').classList.remove('d-none');
                gameCompleted = true;
            }
        }, 2000);
    } else {
        // Incorrect answer
        showFeedback('That\'s not correct. Try again!', 'danger');
        
        // Show hint automatically after 3 attempts
        if (attempts === 3) {
            showHint();
        }
    }
}

/**
 * Show feedback message
 */
function showFeedback(message, type) {
    const feedbackEl = document.getElementById('feedback-message');
    feedbackEl.textContent = message;
    feedbackEl.className = `alert alert-${type}`;
}

/**
 * Show hint for current sequence
 */
function showHint() {
    const hintEl = document.getElementById('hint-text');
    hintEl.textContent = `Hint: ${sequences[currentSequence].hint}`;
    hintEl.classList.remove('d-none');
    
    // Disable hint button after use
    document.getElementById('show-hint').disabled = true;
}