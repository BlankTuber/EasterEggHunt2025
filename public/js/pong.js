"use strict";

let gameConfig;
let canvas;
let ctx;
let playerScore = 0;
let aiScore = 0;
let gameActive = false;
let playerName = "";

const PADDLE_HEIGHT = 100;
const PADDLE_WIDTH = 10;
const BALL_RADIUS = 10;
const INITIAL_BALL_SPEED = 5;
const PADDLE_SPEED_INCREASE_FACTOR = 1.2;
const AI_PADDLE_SPEED = 12;
const MAX_BOUNCE_ANGLE = Math.PI / 3;

let paddleY;
let aiPaddleY;
let ballX;
let ballY;
let ballSpeedX;
let ballSpeedY;
let winScore = 10;

const konamiCode = [
    "ArrowUp",
    "ArrowUp",
    "ArrowDown",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowLeft",
    "ArrowRight",
    "b",
    "a",
];
let konamiSequence = [];

function init() {
    try {
        gameConfig = JSON.parse(
            document.getElementById("gameConfigData")?.textContent || "{}",
        );
        winScore = parseInt(gameConfig.winScore, 10) || 10;
    } catch (e) {
        console.error("Could not parse gameConfigData:", e);
        gameConfig = {};
        winScore = 10;
    }

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
    window.addEventListener("keydown", checkKonamiCode);

    paddleY = (canvas.height - PADDLE_HEIGHT) / 2;
    aiPaddleY = (canvas.height - PADDLE_HEIGHT) / 2;
    resetBall(true);

    canvas.addEventListener("mousemove", movePaddle);
    canvas.addEventListener("touchmove", movePaddleTouch, { passive: false });
    canvas.addEventListener("touchstart", movePaddleTouch, { passive: false });

    updateScoreDisplay();
    updateInstructionsWinScore();

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
    init();
});

function checkKonamiCode(e) {
    konamiSequence.push(e.key);

    if (konamiSequence.length > konamiCode.length) {
        konamiSequence.shift();
    }

    if (konamiSequence.join(",") === konamiCode.join(",")) {
        playerScore = 9;
        updateScoreDisplay();
        konamiSequence = [];
        console.log("Konami Code activated! Score set to 9.");
    }
}

function gameLoop() {
    if (!gameActive) {
        console.log("Game loop stopped.");
        return;
    }

    const prevBallX = ballX;
    const prevBallY = ballY;

    updateAI();
    updateBall(prevBallX, prevBallY);
    draw();

    requestAnimationFrame(gameLoop);
}

function updateAI() {
    const aiPaddleCenter = aiPaddleY + PADDLE_HEIGHT / 2;
    const targetY = ballY;

    const dy = targetY - aiPaddleCenter;

    if (Math.abs(dy) > 5) {
        aiPaddleY += Math.sign(dy) * AI_PADDLE_SPEED;
    }

    aiPaddleY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, aiPaddleY));
}

function updateBall(prevBallX, prevBallY) {
    ballX += ballSpeedX;
    ballY += ballSpeedY;

    if (ballY - BALL_RADIUS <= 0 && ballSpeedY < 0) {
        ballY = BALL_RADIUS;
        ballSpeedY *= -1;
    } else if (ballY + BALL_RADIUS >= canvas.height && ballSpeedY > 0) {
        ballY = canvas.height - BALL_RADIUS;
        ballSpeedY *= -1;
    }

    const checkPaddleCollision = (paddleX, paddleEdgeX, currentPaddleY) => {
        if (
            ballY + BALL_RADIUS < currentPaddleY ||
            ballY - BALL_RADIUS > currentPaddleY + PADDLE_HEIGHT
        ) {
            return false;
        }

        const ballLeadingEdge =
            ballSpeedX < 0 ? ballX - BALL_RADIUS : ballX + BALL_RADIUS;
        const ballPrevLeadingEdge =
            ballSpeedX < 0 ? prevBallX - BALL_RADIUS : prevBallX + BALL_RADIUS;

        const crossedPaddleEdge =
            ballSpeedX < 0
                ? ballLeadingEdge <= paddleEdgeX &&
                  ballPrevLeadingEdge > paddleEdgeX
                : ballLeadingEdge >= paddleEdgeX &&
                  ballPrevLeadingEdge < paddleEdgeX;

        return crossedPaddleEdge;
    };

    if (ballSpeedX < 0 && checkPaddleCollision(0, PADDLE_WIDTH, paddleY)) {
        ballX = PADDLE_WIDTH + BALL_RADIUS;
        handlePaddleBounce(paddleY);
    } else if (
        ballSpeedX > 0 &&
        checkPaddleCollision(
            canvas.width - PADDLE_WIDTH,
            canvas.width - PADDLE_WIDTH,
            aiPaddleY,
        )
    ) {
        ballX = canvas.width - PADDLE_WIDTH - BALL_RADIUS;
        handlePaddleBounce(aiPaddleY);
    }

    if (ballX + BALL_RADIUS < 0) {
        aiScore++;
        updateScoreDisplay();
        if (checkForWin()) return;
        resetBall();
    } else if (ballX - BALL_RADIUS > canvas.width) {
        playerScore++;
        updateScoreDisplay();
        if (checkForWin()) return;
        resetBall();
    }
}

function handlePaddleBounce(currentPaddleY) {
    const paddleCenterY = currentPaddleY + PADDLE_HEIGHT / 2;
    const intersectY = paddleCenterY - ballY;
    const normalizedIntersect = Math.max(
        -1,
        Math.min(1, intersectY / (PADDLE_HEIGHT / 2)),
    );
    const bounceAngle = normalizedIntersect * MAX_BOUNCE_ANGLE;

    const currentSpeed = Math.sqrt(
        ballSpeedX * ballSpeedX + ballSpeedY * ballSpeedY,
    );
    const newSpeed = currentSpeed * PADDLE_SPEED_INCREASE_FACTOR;

    const direction = ballSpeedX < 0 ? 1 : -1;

    ballSpeedX = direction * newSpeed * Math.cos(bounceAngle);
    ballSpeedY = -newSpeed * Math.sin(bounceAngle);
}

function resetBall(initial = false) {
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;

    let angle = (Math.random() * Math.PI) / 2 - Math.PI / 4;
    if (Math.random() > 0.5) angle += Math.PI;

    const direction = initial
        ? Math.random() > 0.5
            ? 1
            : -1
        : ballSpeedX > 0
        ? -1
        : 1;

    ballSpeedX = direction * INITIAL_BALL_SPEED * Math.cos(angle);
    ballSpeedY = INITIAL_BALL_SPEED * Math.sin(angle);
}

function draw() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#FFF";
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#FFF";
    ctx.fillRect(0, paddleY, PADDLE_WIDTH, PADDLE_HEIGHT);
    ctx.fillRect(
        canvas.width - PADDLE_WIDTH,
        aiPaddleY,
        PADDLE_WIDTH,
        PADDLE_HEIGHT,
    );

    ctx.beginPath();
    ctx.arc(ballX, ballY, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
}

function adjustCanvasSize() {
    const container = canvas.parentElement;
    if (!container) return;

    const aspectRatio = canvas.height / canvas.width;
    canvas.width = container.clientWidth;
    canvas.height = container.clientWidth * aspectRatio;

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
    const playerScoreEl = document.getElementById("playerScore");
    const aiScoreEl = document.getElementById("aiScore");
    if (playerScoreEl) playerScoreEl.textContent = playerScore;
    if (aiScoreEl) aiScoreEl.textContent = aiScore;
    else {
        const oldScoreEl = document.getElementById("score");
        if (oldScoreEl && !playerScoreEl) oldScoreEl.textContent = playerScore;
    }
}

function updateInstructionsWinScore() {
    const winScoreEl = document.getElementById("winScoreDisplay");
    if (winScoreEl) {
        winScoreEl.textContent = winScore;
    } else {
        const instructionsP = document.querySelector("#gameInstructions p");
        if (instructionsP) {
            instructionsP.textContent = `Bruk musen eller fingeren (på berøringsskjerm) for å flytte rekkerten. Først til å score ${winScore} poeng vinner!`;
        }
    }
}

function checkForWin() {
    if (playerScore >= winScore) {
        const message =
            gameConfig?.winMessage ||
            `Gratulerer! Du vant ${playerScore}-${aiScore}! og tanker får flyte`;
        gameActive = false;
        sendCompletionData();
        if (typeof showWinMessage === "function") {
            showWinMessage(message);
        } else {
            alert(message);
        }
        return true;
    } else if (aiScore >= winScore) {
        const message =
            gameConfig?.loseMessage ||
            `Beklager! AI vant ${aiScore}-${playerScore}!`;
        alert(message);

        // Reset game instead of ending
        playerScore = 0;
        aiScore = 0;
        updateScoreDisplay();
        resetBall(true);
        gameActive = true;

        return false;
    }
    return false;
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
