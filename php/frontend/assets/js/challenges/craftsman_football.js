/**
 * Craftsman Football Team Guesser Challenge
 * 
 * Challenge to identify football team emblems from their shadows/outlines
 */

// Game variables
let teams = [];
let currentTeam = 0;
let attempts = 0;
let gameCompleted = false;
let score = 0;

document.addEventListener('DOMContentLoaded', function() {
    // Find the individual challenge container
    const challengeContainer = document.getElementById('individual-challenge');
    if (!challengeContainer) return;
    
    // Create game container
    setupTeamGuesser(challengeContainer);
    
    // Initialize teams
    initializeTeams();
    
    // Show first team
    showCurrentTeam();
});

/**
 * Set up the Team Guesser interface
 */
function setupTeamGuesser(container) {
    container.innerHTML = `
        <div class="team-guesser-container">
            <div class="text-center mb-4">
                <h3>Team Emblems Challenge</h3>
                <p class="text-muted">Identify each team from their emblematic outline</p>
            </div>
            
            <div class="card mb-4">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Team <span id="team-number">1</span> of <span id="total-teams">8</span></h5>
                    <span class="badge bg-primary" id="score-badge">Score: 0</span>
                </div>
                <div class="card-body">
                    <div class="team-emblem-container text-center mb-4">
                        <div id="team-emblem" class="emblem-shadow mx-auto mb-3">
                            <!-- Team emblem shadow will be displayed here -->
                        </div>
                        
                        <div class="form-group">
                            <input type="text" id="team-guess" class="form-control form-control-lg text-center" 
                                   placeholder="Enter team name" autocomplete="off">
                            <div class="form-text text-center">Guess the team name based on the shadow outline</div>
                        </div>
                    </div>
                    
                    <div id="feedback-message" class="alert d-none mb-3">
                        <!-- Feedback will appear here -->
                    </div>
                    
                    <div class="d-flex gap-2 justify-content-center">
                        <button id="check-guess" class="btn btn-primary">Submit Guess</button>
                        <button id="skip-team" class="btn btn-outline-secondary">Skip</button>
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
                    <p>You identified <span id="final-score">0</span> out of <span id="total-score">0</span> teams!</p>
                    <p>Your builder's eye has proven keen at recognizing forms in shadow.</p>
                    <button id="complete-button" class="btn btn-success">Complete Challenge</button>
                </div>
            </div>
        </div>
    `;
    
    // Add some style for the emblem shadow
    const style = document.createElement('style');
    style.textContent = `
        .emblem-shadow {
            width: 200px;
            height: 200px;
            background-color: #333;
            mask-size: contain;
            mask-repeat: no-repeat;
            mask-position: center;
            -webkit-mask-size: contain;
            -webkit-mask-repeat: no-repeat;
            -webkit-mask-position: center;
            border-radius: 5px;
        }
        
        @keyframes correct-guess {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); background-color: #28a745; }
            100% { transform: scale(1); }
        }
        
        .correct-guess {
            animation: correct-guess 1s ease;
        }
    `;
    document.head.appendChild(style);
    
    // Set up check guess button
    const checkGuessBtn = document.getElementById('check-guess');
    const teamGuessInput = document.getElementById('team-guess');
    
    if (checkGuessBtn && teamGuessInput) {
        checkGuessBtn.addEventListener('click', function() {
            checkGuess();
        });
        
        // Also check on Enter key
        teamGuessInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                checkGuess();
            }
        });
    }
    
    // Set up skip button
    const skipBtn = document.getElementById('skip-team');
    if (skipBtn) {
        skipBtn.addEventListener('click', function() {
            skipTeam();
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
 * Initialize teams
 */
function initializeTeams() {
    // In a real implementation, these would be actual team logos with proper SVG masks
    // For simplicity, we're using font awesome icons as placeholders
    teams = [
        {
            name: 'Manchester United',
            icon: 'M60,30 C60,46.5685 46.5685,60 30,60 C13.4315,60 0,46.5685 0,30 C0,13.4315 13.4315,0 30,0 C46.5685,0 60,13.4315 60,30 Z M30,10 L10,30 L20,50 L40,50 L50,30 L30,10 Z',
            hint: 'Red Devils, based in Manchester, England',
            acceptableAnswers: ['manchester united', 'man utd', 'man united', 'manchester utd', 'man u']
        },
        {
            name: 'Barcelona',
            icon: 'M25,0 L50,0 L50,50 L0,50 L0,0 L25,0 Z M10,10 L40,10 L40,40 L10,40 L10,10 Z M15,15 L35,15 L35,35 L15,35 L15,15 Z',
            hint: 'Spanish club from Catalonia, "Més que un club"',
            acceptableAnswers: ['barcelona', 'fc barcelona', 'barca', 'fcb']
        },
        {
            name: 'Bayern Munich',
            icon: 'M50,25 C50,38.8071 38.8071,50 25,50 C11.1929,50 0,38.8071 0,25 C0,11.1929 11.1929,0 25,0 C38.8071,0 50,11.1929 50,25 Z M25,10 L10,25 L25,40 L40,25 L25,10 Z',
            hint: 'German club from Bavaria, known as "Die Roten"',
            acceptableAnswers: ['bayern munich', 'bayern', 'fc bayern', 'bayern münchen', 'fc bayern munich']
        },
        {
            name: 'Liverpool',
            icon: 'M0,0 L50,0 L50,50 L0,50 L0,0 Z M10,10 L10,40 L40,40 L40,10 L10,10 Z M20,20 L30,20 L30,30 L20,30 L20,20 Z',
            hint: 'English club from Merseyside, "You\'ll Never Walk Alone"',
            acceptableAnswers: ['liverpool', 'liverpool fc', 'lfc']
        },
        {
            name: 'Real Madrid',
            icon: 'M25,0 L45,20 L25,40 L5,20 L25,0 Z M25,10 L15,20 L25,30 L35,20 L25,10 Z',
            hint: 'Spanish club known as "Los Blancos"',
            acceptableAnswers: ['real madrid', 'madrid', 'real', 'rm']
        },
        {
            name: 'Juventus',
            icon: 'M0,0 L50,0 L50,50 L0,50 L0,0 Z M10,10 L10,40 L40,40 L40,10 L10,10 Z',
            hint: 'Italian club from Turin, known as "The Old Lady"',
            acceptableAnswers: ['juventus', 'juve', 'juventus fc', 'la vecchia signora']
        },
        {
            name: 'Arsenal',
            icon: 'M25,50 C38.8071,50 50,38.8071 50,25 C50,11.1929 38.8071,0 25,0 C11.1929,0 0,11.1929 0,25 C0,38.8071 11.1929,50 25,50 Z M25,15 L40,30 L25,45 L10,30 L25,15 Z',
            hint: 'English club from North London, "The Gunners"',
            acceptableAnswers: ['arsenal', 'arsenal fc', 'the gunners']
        },
        {
            name: 'Chelsea',
            icon: 'M50,25 C50,38.8071 38.8071,50 25,50 C11.1929,50 0,38.8071 0,25 C0,11.1929 11.1929,0 25,0 C38.8071,0 50,11.1929 50,25 Z M15,15 L35,15 L35,35 L15,35 L15,15 Z',
            hint: 'English club from West London, "The Blues"',
            acceptableAnswers: ['chelsea', 'chelsea fc', 'the blues']
        }
    ];
    
    // Shuffle teams
    teams.sort(() => Math.random() - 0.5);
}

/**
 * Show current team emblem
 */
function showCurrentTeam() {
    // Update team number
    document.getElementById('team-number').textContent = currentTeam + 1;
    document.getElementById('total-teams').textContent = teams.length;
    
    // Reset attempts
    attempts = 0;
    
    // Clear previous feedback
    const feedbackEl = document.getElementById('feedback-message');
    feedbackEl.classList.add('d-none');
    
    // Clear guess input
    document.getElementById('team-guess').value = '';
    
    // Reset hint
    document.getElementById('hint-text').classList.add('d-none');
    document.getElementById('show-hint').disabled = false;
    
    // Display team emblem shadow
    const emblemEl = document.getElementById('team-emblem');
    emblemEl.style.maskImage = `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60'><path d='${teams[currentTeam].icon}'/></svg>")`;
    emblemEl.style.webkitMaskImage = `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60'><path d='${teams[currentTeam].icon}'/></svg>")`;
}

/**
 * Check the user's guess
 */
function checkGuess() {
    const teamGuessInput = document.getElementById('team-guess');
    const userGuess = teamGuessInput.value.trim().toLowerCase();
    
    // Validate input
    if (!userGuess) {
        showFeedback('Please enter a team name', 'warning');
        return;
    }
    
    // Increment attempts
    attempts++;
    
    // Check if guess is correct
    const acceptableAnswers = teams[currentTeam].acceptableAnswers;
    if (acceptableAnswers.includes(userGuess)) {
        // Correct guess
        showFeedback(`Correct! That's ${teams[currentTeam].name}!`, 'success');
        
        // Animate the emblem
        const emblemEl = document.getElementById('team-emblem');
        emblemEl.classList.add('correct-guess');
        
        // Increment score
        score++;
        document.getElementById('score-badge').textContent = `Score: ${score}`;
        
        // Disable input and buttons
        teamGuessInput.disabled = true;
        document.getElementById('check-guess').disabled = true;
        document.getElementById('skip-team').disabled = true;
        document.getElementById('show-hint').disabled = true;
        
        // Move to next team after delay
        setTimeout(() => {
            emblemEl.classList.remove('correct-guess');
            currentTeam++;
            
            if (currentTeam < teams.length) {
                // Show next team
                showCurrentTeam();
                
                // Re-enable input and buttons
                teamGuessInput.disabled = false;
                document.getElementById('check-guess').disabled = false;
                document.getElementById('skip-team').disabled = false;
            } else {
                // All teams completed
                showCompletion();
            }
        }, 1500);
    } else {
        // Incorrect guess
        showFeedback('That\'s not correct. Try again!', 'danger');
        
        // Show hint automatically after 3 attempts
        if (attempts === 3) {
            showHint();
        }
    }
}

/**
 * Skip current team
 */
function skipTeam() {
    // Show correct answer first
    showFeedback(`The team was ${teams[currentTeam].name}`, 'info');
    
    // Disable input and buttons temporarily
    const teamGuessInput = document.getElementById('team-guess');
    teamGuessInput.disabled = true;
    document.getElementById('check-guess').disabled = true;
    document.getElementById('skip-team').disabled = true;
    
    // Move to next team after delay
    setTimeout(() => {
        currentTeam++;
        
        if (currentTeam < teams.length) {
            // Show next team
            showCurrentTeam();
            
            // Re-enable input and buttons
            teamGuessInput.disabled = false;
            document.getElementById('check-guess').disabled = false;
            document.getElementById('skip-team').disabled = false;
        } else {
            // All teams completed
            showCompletion();
        }
    }, 1500);
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
 * Show hint for current team
 */
function showHint() {
    const hintEl = document.getElementById('hint-text');
    hintEl.textContent = `Hint: ${teams[currentTeam].hint}`;
    hintEl.classList.remove('d-none');
    
    // Disable hint button after use
    document.getElementById('show-hint').disabled = true;
}

/**
 * Show completion screen
 */
function showCompletion() {
    // Show completion card
    const completionCard = document.getElementById('completion-card');
    completionCard.classList.remove('d-none');
    
    // Update final score
    document.getElementById('final-score').textContent = score;
    document.getElementById('total-score').textContent = teams.length;
    
    // Enable completion if score is sufficient (at least 60%)
    const passThreshold = Math.ceil(teams.length * 0.6);
    const completeButton = document.getElementById('complete-button');
    
    if (score >= passThreshold) {
        completeButton.disabled = false;
        completeButton.textContent = 'Complete Challenge';
        gameCompleted = true;
    } else {
        completeButton.disabled = true;
        completeButton.textContent = `Need at least ${passThreshold} correct to complete`;
        
        // Add restart option
        const restartBtn = document.createElement('button');
        restartBtn.className = 'btn btn-outline-primary mt-2';
        restartBtn.textContent = 'Try Again';
        restartBtn.addEventListener('click', function() {
            // Reset game
            currentTeam = 0;
            score = 0;
            document.getElementById('score-badge').textContent = `Score: ${score}`;
            completionCard.classList.add('d-none');
            
            // Shuffle teams again
            teams.sort(() => Math.random() - 0.5);
            
            // Start over
            showCurrentTeam();
            
            // Re-enable inputs
            document.getElementById('team-guess').disabled = false;
            document.getElementById('check-guess').disabled = false;
            document.getElementById('skip-team').disabled = false;
        });
        
        completionCard.querySelector('.card-body').appendChild(restartBtn);
    }
}