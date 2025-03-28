/**
 * Navigator Pong Game Challenge
 * 
 * Classic Pong game implementation for the Navigator's individual challenge
 */

// Game variables
let canvas, ctx;
let ballX, ballY, ballSpeedX, ballSpeedY;
let paddle1Y, paddle2Y;
const PADDLE_HEIGHT = 100;
const PADDLE_THICKNESS = 10;
const BALL_RADIUS = 10;
let player1Score = 0;
let player2Score = 0;
const WINNING_SCORE = 5;
let showingWinScreen = false;
let gameStarted = false;
let gameCompleted = false;

document.addEventListener('DOMContentLoaded', function() {
    // Find the individual challenge container
    const challengeContainer = document.getElementById('individual-challenge');
    if (!challengeContainer) return;
    
    // Create game container
    setupPongGame(challengeContainer);
    
    // Initialize game
    initializePongGame();
});

/**
 * Set up the Pong game interface
 */
function setupPongGame(container) {
    container.innerHTML = `
        <div class="pong-game-container">
            <div class="text-center mb-3">
                <h3>The Ancient Game of Pong</h3>
                <p class="text-muted">Score ${WINNING_SCORE} points to complete the challenge</p>
            </div>
            
            <div class="game-canvas-container text-center">
                <canvas id="gameCanvas" width="800" height="500" class="border"></canvas>
            </div>
            
            <div class="text-center mt-3">
                <button id="start-game" class="btn btn-primary">Start Game</button>
                <p class="mt-2 text-muted">Use mouse to move your paddle (left side)</p>
            </div>
        </div>
    `;
    
    // Get canvas and context
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Make canvas responsive
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Set up start button
    const startButton = document.getElementById('start-game');
    if (startButton) {
        startButton.addEventListener('click', function() {
            if (!gameStarted) {
                gameStarted = true;
                this.style.display = 'none';
                startPongGame();
            } else if (showingWinScreen) {
                player1Score = 0;
                player2Score = 0;
                showingWinScreen = false;
                if (gameCompleted) {
                    this.textContent = 'Play Again';
                }
                startPongGame();
            }
        });
    }
    
    // Set up mouse handling for paddle
    canvas.addEventListener('mousemove', function(evt) {
        if (!gameStarted) return;
        
        const mousePos = calculateMousePos(evt);
        paddle1Y = mousePos.y - (PADDLE_HEIGHT/2);
    });
    
    // Handle click to restart after win
    canvas.addEventListener('click', function() {
        if (showingWinScreen) {
            player1Score = 0;
            player2Score = 0;
            showingWinScreen = false;
            startButton.style.display = 'inline-block';
            startButton.textContent = gameCompleted ? 'Play Again' : 'Continue Game';
        }
    });
}

/**
 * Make canvas responsive
 */
function resizeCanvas() {
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth;
    
    // Maintain aspect ratio
    const aspectRatio = canvas.width / canvas.height;
    const newWidth = Math.min(containerWidth, canvas.width);
    const newHeight = newWidth / aspectRatio;
    
    canvas.style.width = newWidth + 'px';
    canvas.style.height = newHeight + 'px';
}

/**
 * Calculate mouse position relative to canvas
 */
function calculateMousePos(evt) {
    const rect = canvas.getBoundingClientRect();
    const root = document.documentElement;
    const scaleX = canvas.width / parseInt(canvas.style.width);
    const scaleY = canvas.height / parseInt(canvas.style.height);
    
    const mouseX = (evt.clientX - rect.left) * scaleX;
    const mouseY = (evt.clientY - rect.top) * scaleY;
    
    return {
        x: mouseX,
        y: mouseY
    };
}

/**
 * Initialize game variables
 */
function initializePongGame() {
    // Ball position and speed
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    ballSpeedX = 10;
    ballSpeedY = 4;
    
    // Paddle positions
    paddle1Y = canvas.height / 2 - PADDLE_HEIGHT / 2;
    paddle2Y = canvas.height / 2 - PADDLE_HEIGHT / 2;
    
    // Draw initial screen
    drawEverything();
}

/**
 * Start the game loop
 */
function startPongGame() {
    // Reset ball
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    ballSpeedX = -ballSpeedX;
    
    // Start game loop
    const frameRate = 30;
    setInterval(function() {
        if (!showingWinScreen && gameStarted) {
            moveEverything();
            computerMovement();
        }
        drawEverything();
    }, 1000/frameRate);
}

/**
 * Reset ball when point is scored
 */
function ballReset() {
    if (player1Score >= WINNING_SCORE || player2Score >= WINNING_SCORE) {
        showingWinScreen = true;
        
        // Check if player won
        if (player1Score >= WINNING_SCORE) {
            gameCompleted = true;
            
            // Enable the challenge completion button
            const completeBtn = document.getElementById('complete-challenge');
            if (completeBtn) {
                completeBtn.disabled = false;
            }
        }
    }
    
    ballSpeedX = -ballSpeedX;
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
}

/**
 * Computer AI movement
 */
function computerMovement() {
    const paddle2YCenter = paddle2Y + (PADDLE_HEIGHT / 2);
    
    if (paddle2YCenter < ballY - 35) {
        paddle2Y += 6;
    } else if (paddle2YCenter > ballY + 35) {
        paddle2Y -= 6;
    }
}

/**
 * Move game elements
 */
function moveEverything() {
    // Move ball
    ballX += ballSpeedX;
    ballY += ballSpeedY;
    
    // Left side (player)
    if (ballX < PADDLE_THICKNESS + BALL_RADIUS) {
        if (ballY > paddle1Y && ballY < paddle1Y + PADDLE_HEIGHT) {
            ballSpeedX = -ballSpeedX;
            
            // Adjust Y speed based on where ball hits paddle
            const deltaY = ballY - (paddle1Y + PADDLE_HEIGHT / 2);
            ballSpeedY = deltaY * 0.35;
        } else {
            // Computer scores
            player2Score++;
            ballReset();
        }
    }
    
    // Right side (computer)
    if (ballX > canvas.width - PADDLE_THICKNESS - BALL_RADIUS) {
        if (ballY > paddle2Y && ballY < paddle2Y + PADDLE_HEIGHT) {
            ballSpeedX = -ballSpeedX;
            
            // Adjust Y speed based on where ball hits paddle
            const deltaY = ballY - (paddle2Y + PADDLE_HEIGHT / 2);
            ballSpeedY = deltaY * 0.35;
        } else {
            // Player scores
            player1Score++;
            ballReset();
        }
    }
    
    // Top and bottom edges
    if (ballY < BALL_RADIUS || ballY > canvas.height - BALL_RADIUS) {
        ballSpeedY = -ballSpeedY;
    }
}

/**
 * Draw game elements
 */
function drawEverything() {
    // Clear canvas
    drawRect(0, 0, canvas.width, canvas.height, '#000');
    
    // Draw win screen
    if (showingWinScreen) {
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        
        if (player1Score >= WINNING_SCORE) {
            ctx.font = '30px Arial';
            ctx.fillText("You Won!", canvas.width/2, 200);
            ctx.font = '20px Arial';
            ctx.fillText("Challenge Completed!", canvas.width/2, 250);
            ctx.fillText("Click to Continue", canvas.width/2, 300);
        } else if (player2Score >= WINNING_SCORE) {
            ctx.font = '30px Arial';
            ctx.fillText("Computer Won", canvas.width/2, 200);
            ctx.font = '20px Arial';
            ctx.fillText("Click to Try Again", canvas.width/2, 250);
        }
        
        return;
    }
    
    // Draw net
    drawNet();
    
    // Draw left paddle (player)
    drawRect(0, paddle1Y, PADDLE_THICKNESS, PADDLE_HEIGHT, 'white');
    
    // Draw right paddle (computer)
    drawRect(canvas.width - PADDLE_THICKNESS, paddle2Y, PADDLE_THICKNESS, PADDLE_HEIGHT, 'white');
    
    // Draw ball
    drawCircle(ballX, ballY, BALL_RADIUS, 'white');
    
    // Draw scores
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(player1Score, canvas.width/2 - 50, 50);
    ctx.textAlign = 'left';
    ctx.fillText(player2Score, canvas.width/2 + 50, 50);
}

/**
 * Draw rectangle
 */
function drawRect(leftX, topY, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(leftX, topY, width, height);
}

/**
 * Draw circle
 */
function drawCircle(centerX, centerY, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI*2, true);
    ctx.fill();
}

/**
 * Draw net
 */
function drawNet() {
    for (let i = 0; i < canvas.height; i += 40) {
        drawRect(canvas.width/2 - 1, i, 2, 20, 'white');
    }
}