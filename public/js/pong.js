"use strict";

let gameConfig;
let canvas;
let ctx;
let playerScore = 0;
let aiScore = 0;
let gameActive = false;
let playerName = "";

// Game constants
const PADDLE_HEIGHT = 100;
const PADDLE_WIDTH = 10;
const BALL_RADIUS = 10;
const INITIAL_BALL_SPEED = 5; // Pixels per frame
const PADDLE_SPEED_INCREASE_FACTOR = 1.2; // Speed increase factor on hit (reduced slightly)
const AI_PADDLE_SPEED = 12; // AI speed (slightly increased)
const MAX_BOUNCE_ANGLE = Math.PI / 3; // ~60 degrees

// Game state variables
let paddleY;
let aiPaddleY;
let ballX;
let ballY;
let ballSpeedX;
let ballSpeedY;
let winScore = 10;

// --- Initialization ---
function init() {
    try {
        gameConfig = JSON.parse(
            document.getElementById("gameConfigData")?.textContent || "{}",
        );
        winScore = parseInt(gameConfig.winScore, 10) || 10; // Ensure it's a number
    } catch (e) {
        console.error("Could not parse gameConfigData:", e);
        gameConfig = {};
        winScore = 10;
    }

    // Get player name if available
    const playerNameInput = document.getElementById("playerName");
    if (playerNameInput) {
        playerName = playerNameInput.value.trim();
    }

    canvas = document.getElementById("pongCanvas");
    if (!canvas) {
        console.error("Canvas element #pongCanvas not found!");
        return;
    }
    ctx = canvas.getContext("2d");
    if (!ctx) {
        console.error("Could not get 2D context from canvas!");
        return;
    }

    adjustCanvasSize();
    window.addEventListener("resize", adjustCanvasSize);

    paddleY = (canvas.height - PADDLE_HEIGHT) / 2;
    aiPaddleY = (canvas.height - PADDLE_HEIGHT) / 2;
    resetBall(true);

    canvas.addEventListener("mousemove", movePaddle);
    canvas.addEventListener("touchmove", movePaddleTouch, { passive: false });
    canvas.addEventListener("touchstart", movePaddleTouch, { passive: false });

    updateScoreDisplay(); // Initial score display
    updateInstructionsWinScore(); // Update score in instructions

    if (!gameActive) {
        gameActive = true;
        console.log("Starting game loop...");
        gameLoop();
    }

    const instructions = document.getElementById("gameInstructions");
    if (instructions) {
        instructions.style.display = "block";
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const gameArea = document.querySelector(".game-area");
    if (gameArea) {
        gameArea.style.display = "block";
    }
    // The modal script is already in the HTML's DOMContentLoaded, no need to repeat here
    init();
});

// --- Game Updates ---

function gameLoop() {
    if (!gameActive) {
        console.log("Game loop stopped.");
        return;
    }

    // Store previous ball position for collision detection
    const prevBallX = ballX;
    const prevBallY = ballY; // Might need for more complex physics later

    updateAI();
    updateBall(prevBallX, prevBallY); // Pass previous position
    draw();

    requestAnimationFrame(gameLoop);
}

function updateAI() {
    const aiPaddleCenter = aiPaddleY + PADDLE_HEIGHT / 2;
    const targetY = ballY;

    // Add a slight delay or prediction based on ball direction (optional enhancement)
    // Simple follow logic:
    const dy = targetY - aiPaddleCenter;

    // Move AI paddle
    if (Math.abs(dy) > 5) {
        // Add dead zone to prevent jittering
        aiPaddleY += Math.sign(dy) * AI_PADDLE_SPEED;
    }

    // Clamp AI paddle position
    aiPaddleY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, aiPaddleY));
}

function updateBall(prevBallX, prevBallY) {
    // Move Ball
    ballX += ballSpeedX;
    ballY += ballSpeedY;

    // --- Collision Detection ---

    // Top/Bottom Wall Collision
    if (ballY - BALL_RADIUS <= 0 && ballSpeedY < 0) {
        ballY = BALL_RADIUS;
        ballSpeedY *= -1;
    } else if (ballY + BALL_RADIUS >= canvas.height && ballSpeedY > 0) {
        ballY = canvas.height - BALL_RADIUS;
        ballSpeedY *= -1;
    }

    // Paddle Collision Check function
    const checkPaddleCollision = (paddleX, paddleEdgeX, currentPaddleY) => {
        // Basic vertical alignment check first (quick exit)
        if (
            ballY + BALL_RADIUS < currentPaddleY ||
            ballY - BALL_RADIUS > currentPaddleY + PADDLE_HEIGHT
        ) {
            return false;
        }

        // Check if the ball crossed the paddle's front edge in this frame
        const ballLeadingEdge =
            ballSpeedX < 0 ? ballX - BALL_RADIUS : ballX + BALL_RADIUS;
        const ballPrevLeadingEdge =
            ballSpeedX < 0 ? prevBallX - BALL_RADIUS : prevBallX + BALL_RADIUS;

        const crossedPaddleEdge =
            ballSpeedX < 0
                ? ballLeadingEdge <= paddleEdgeX &&
                  ballPrevLeadingEdge > paddleEdgeX // Moving left, crossed right edge of paddle area
                : ballLeadingEdge >= paddleEdgeX &&
                  ballPrevLeadingEdge < paddleEdgeX; // Moving right, crossed left edge of paddle area

        return crossedPaddleEdge;
    };

    // Player Paddle Collision (Left)
    if (ballSpeedX < 0 && checkPaddleCollision(0, PADDLE_WIDTH, paddleY)) {
        //console.log(`Player collision: BallX=${ballX.toFixed(1)}, PrevX=${prevBallX.toFixed(1)}, PaddleY=${paddleY.toFixed(1)}, BallY=${ballY.toFixed(1)}`);
        // Ball crossed the paddle line (PADDLE_WIDTH) this frame
        ballX = PADDLE_WIDTH + BALL_RADIUS; // Correct position
        handlePaddleBounce(paddleY);
    }
    // AI Paddle Collision (Right)
    else if (
        ballSpeedX > 0 &&
        checkPaddleCollision(
            canvas.width - PADDLE_WIDTH,
            canvas.width - PADDLE_WIDTH,
            aiPaddleY,
        )
    ) {
        //console.log(`AI collision: BallX=${ballX.toFixed(1)}, PrevX=${prevBallX.toFixed(1)}, AIPaddleY=${aiPaddleY.toFixed(1)}, BallY=${ballY.toFixed(1)}`);
        // Ball crossed the AI paddle line (canvas.width - PADDLE_WIDTH) this frame
        ballX = canvas.width - PADDLE_WIDTH - BALL_RADIUS; // Correct position
        handlePaddleBounce(aiPaddleY);
    }

    // --- Scoring ---
    if (ballX + BALL_RADIUS < 0) {
        // Ball passed left edge
        aiScore++;
        updateScoreDisplay();
        if (checkForWin()) return; // Stop if game ended
        resetBall();
    } else if (ballX - BALL_RADIUS > canvas.width) {
        // Ball passed right edge
        playerScore++;
        updateScoreDisplay();
        if (checkForWin()) return; // Stop if game ended
        resetBall();
    }
}

function handlePaddleBounce(currentPaddleY) {
    // Calculate bounce angle based on where it hit the paddle
    const paddleCenterY = currentPaddleY + PADDLE_HEIGHT / 2;
    const intersectY = paddleCenterY - ballY;
    const normalizedIntersect = Math.max(
        -1,
        Math.min(1, intersectY / (PADDLE_HEIGHT / 2)),
    ); // Clamp between -1 and 1
    const bounceAngle = normalizedIntersect * MAX_BOUNCE_ANGLE;

    // Calculate new speed magnitude
    const currentSpeed = Math.sqrt(
        ballSpeedX * ballSpeedX + ballSpeedY * ballSpeedY,
    );
    const newSpeed = currentSpeed * PADDLE_SPEED_INCREASE_FACTOR;

    // Determine direction based on which paddle was hit (implicitly by ballSpeedX before reversal)
    const direction = ballSpeedX < 0 ? 1 : -1; // If ball was moving left (<0), new X is positive (1)

    ballSpeedX = direction * newSpeed * Math.cos(bounceAngle);
    ballSpeedY = -newSpeed * Math.sin(bounceAngle); // Y increases downwards, sin is opposite

    // --- DEBUG ---
    // console.log(`Bounce: Angle=${(bounceAngle * 180 / Math.PI).toFixed(1)}deg, Speed=${newSpeed.toFixed(2)}, VX=${ballSpeedX.toFixed(2)}, VY=${ballSpeedY.toFixed(2)}`);
}

function resetBall(initial = false) {
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;

    let angle = (Math.random() * Math.PI) / 2 - Math.PI / 4; // -45 to +45 degrees
    if (Math.random() > 0.5) angle += Math.PI; // Flip 180 degrees sometimes

    // Serve towards loser, or random if initial serve
    const direction = initial
        ? Math.random() > 0.5
            ? 1
            : -1
        : ballSpeedX > 0
        ? -1
        : 1; // If ballSpeedX was positive (AI scored), serve left (-1)

    ballSpeedX = direction * INITIAL_BALL_SPEED * Math.cos(angle);
    ballSpeedY = INITIAL_BALL_SPEED * Math.sin(angle);
    // console.log(`Reset Ball: VX=${ballSpeedX.toFixed(2)}, VY=${ballSpeedY.toFixed(2)}`);
}

// --- Drawing ---
function draw() {
    // Clear canvas
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw middle line
    ctx.strokeStyle = "#FFF";
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw paddles
    ctx.fillStyle = "#FFF";
    ctx.fillRect(0, paddleY, PADDLE_WIDTH, PADDLE_HEIGHT); // Player
    ctx.fillRect(
        canvas.width - PADDLE_WIDTH,
        aiPaddleY,
        PADDLE_WIDTH,
        PADDLE_HEIGHT,
    ); // AI

    // Draw ball
    ctx.beginPath();
    ctx.arc(ballX, ballY, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
}

// --- Utility Functions ---

function adjustCanvasSize() {
    const container = canvas.parentElement;
    if (!container) return;

    // Simple approach: Fit width, keep aspect ratio defined by initial canvas attributes
    const aspectRatio = canvas.height / canvas.width;
    canvas.width = container.clientWidth;
    canvas.height = container.clientWidth * aspectRatio;

    // Re-center paddles after resize (important)
    paddleY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, paddleY));
    aiPaddleY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, aiPaddleY));
}

function movePaddle(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleY = canvas.height / rect.height;
    const relativeY = (e.clientY - rect.top) * scaleY;
    paddleY = Math.max(
        0,
        Math.min(canvas.height - PADDLE_HEIGHT, relativeY - PADDLE_HEIGHT / 2),
    );
}

function movePaddleTouch(e) {
    e.preventDefault();
    if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        const scaleY = canvas.height / rect.height;
        const relativeY = (e.touches[0].clientY - rect.top) * scaleY;
        paddleY = Math.max(
            0,
            Math.min(
                canvas.height - PADDLE_HEIGHT,
                relativeY - PADDLE_HEIGHT / 2,
            ),
        );
    }
}

function updateScoreDisplay() {
    const playerScoreEl = document.getElementById("playerScore"); // Use playerScore ID
    const aiScoreEl = document.getElementById("aiScore"); // Use aiScore ID
    if (playerScoreEl) playerScoreEl.textContent = playerScore;
    if (aiScoreEl)
        aiScoreEl.textContent = aiScore; // Update AI score if element exists
    else {
        // Fallback if only the old "score" ID exists
        const oldScoreEl = document.getElementById("score");
        if (oldScoreEl && !playerScoreEl) oldScoreEl.textContent = playerScore;
    }
}

function updateInstructionsWinScore() {
    const winScoreEl = document.getElementById("winScoreDisplay"); // Optional: Span in instructions
    if (winScoreEl) {
        winScoreEl.textContent = winScore;
    } else {
        // Update the paragraph directly if span doesn't exist (less ideal)
        const instructionsP = document.querySelector("#gameInstructions p");
        if (instructionsP) {
            instructionsP.textContent = `Bruk musen eller fingeren (på berøringsskjerm) for å flytte rekkerten. Først til å score ${winScore} poeng vinner!`;
        }
    }
}

function checkForWin() {
    let winner = null;
    let message = "";

    if (playerScore >= winScore) {
        winner = "Player";
        message =
            gameConfig?.winMessage ||
            `Gratulerer! Du vant ${playerScore}-${aiScore}! og tanker får flyte`;
        gameActive = false;
        sendCompletionData(); // Send data only if player wins
        // Use the existing modal function from the HTML
        if (typeof showWinMessage === "function") {
            showWinMessage(message);
        } else {
            alert(message); // Fallback
        }
        return true; // Game has ended
    } else if (aiScore >= winScore) {
        winner = "AI";
        message =
            gameConfig?.loseMessage ||
            `Beklager! AI vant ${aiScore}-${playerScore}!`;
        gameActive = false;
        console.log(message); // Log loss message to console
        alert(message); // Simple alert for loss, as there's no loss modal
        return true; // Game has ended
    }
    return false; // Game continues
}

function sendCompletionData() {
    const gameId = getGameIdFromUrl();
    if (!gameId) {
        console.warn("Could not determine gameId from URL. Score not saved.");
        return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/complete-game", true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

    xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
            console.log("Game completion data sent successfully.");
        } else {
            console.error(
                "Error sending game completion data:",
                xhr.status,
                xhr.statusText,
            );
        }
    };
    xhr.onerror = function () {
        console.error("Network error sending game completion data.");
    };

    const dataToSend = {
        gameId: gameId,
        gameType: "pong",
        score: playerScore,
        aiScore: aiScore,
        playerName: playerName,
    };

    try {
        xhr.send(JSON.stringify(dataToSend));
    } catch (e) {
        console.error("Error trying to send JSON data:", e);
    }
}

function getGameIdFromUrl() {
    const pathParts = window.location.pathname.split("/");
    const nonEmptyParts = pathParts.filter((part) => part.length > 0);
    return nonEmptyParts.length > 0
        ? nonEmptyParts[nonEmptyParts.length - 1]
        : null;
}
