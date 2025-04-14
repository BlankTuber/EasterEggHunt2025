let gameConfig;
let currentSequence = [];
let playerSequence = [];
let isPlayingSequence = false;
let canGuess = false;
let currentLevel = 1;
let availableColors = ["red", "blue", "green", "yellow", "purple"];
let maxLevel = 7;

function init() {
    // Load game config from page
    gameConfig = JSON.parse(
        document.getElementById("gameConfigData").textContent,
    );
    maxLevel = gameConfig.levels || 7;

    if (gameConfig.colors && gameConfig.colors.length > 0) {
        availableColors = gameConfig.colors;
        updateAvailableColors(availableColors);
    }

    // Set initial opacity for all color buttons
    document.querySelectorAll(".color-btn").forEach((btn) => {
        btn.style.opacity = "0.3";
    });

    // Add listeners to color buttons
    setupColorButtons();

    // Add listeners to control buttons
    document
        .getElementById("startBtn")
        .addEventListener("click", startSequence);
    document.getElementById("resetBtn").addEventListener("click", resetGame);

    // Initialize first sequence
    generateNewSequence();

    document.getElementById("levelCount").textContent = currentLevel;
    document.getElementById("statusText").textContent =
        'Klikk på "Start sekvens" for å begynne';
}

// Auto-start the game immediately
document.addEventListener("DOMContentLoaded", function () {
    // Show game area immediately
    document.querySelector(".game-area").style.display = "block";
    // Hide player entry form if present
    const playerForm = document.querySelector(".player-form");
    if (playerForm) playerForm.style.display = "none";
    // Initialize the game
    init();
});

function setupColorButtons() {
    const colorButtons = document.querySelectorAll(".color-btn");
    colorButtons.forEach((button) => {
        button.addEventListener("click", () => {
            if (canGuess) {
                const color = button.getAttribute("data-color");
                guessColor(color);
                flashColor(button);
            }
        });
    });
}

function updateAvailableColors(colors) {
    // Hide all colors first
    document.querySelectorAll(".color-btn").forEach((btn) => {
        btn.style.display = "none";
    });

    // Only show colors defined in the configuration
    colors.forEach((color) => {
        const btn = document.querySelector(`.color-btn.${color}`);
        if (btn) {
            btn.style.display = "block";
            btn.style.opacity = "0.3"; // Set initial opacity
        }
    });
}

function generateNewSequence() {
    // Generate a sequence of colors based on current level
    currentSequence = [];
    const sequenceLength = currentLevel + 2; // Longer sequences for higher levels

    for (let i = 0; i < sequenceLength; i++) {
        const randomColor =
            availableColors[Math.floor(Math.random() * availableColors.length)];
        currentSequence.push(randomColor);
    }
}

function startSequence() {
    if (isPlayingSequence) return;

    document.getElementById("startBtn").disabled = true;
    document.getElementById("resetBtn").style.display = "none";
    document.getElementById("statusText").textContent = "Se på sekvensen...";

    // Reset player sequence
    playerSequence = [];

    // Play the sequence
    isPlayingSequence = true;
    canGuess = false;

    let i = 0;
    const interval = setInterval(() => {
        if (i < currentSequence.length) {
            const color = currentSequence[i];
            const colorBtn = document.querySelector(`.color-btn.${color}`);
            flashColor(colorBtn);
            i++;
        } else {
            clearInterval(interval);
            isPlayingSequence = false;
            canGuess = true;
            document.getElementById("statusText").textContent =
                "Din tur! Gjenta sekvensen.";
        }
    }, 1000);
}

function flashColor(button) {
    if (!button) return;

    // Flash to full opacity
    button.style.opacity = "1";

    setTimeout(() => {
        // Return to dimmed state
        button.style.opacity = "0.3";
    }, 500);
}

function guessColor(color) {
    if (!canGuess) return;

    playerSequence.push(color);

    // Check if player's sequence is correct so far
    for (let i = 0; i < playerSequence.length; i++) {
        if (playerSequence[i] !== currentSequence[i]) {
            // Wrong sequence
            canGuess = false;
            document.getElementById("statusText").textContent = "Feil sekvens!";
            showFeedback("Feil sekvens! Prøv igjen.", "error");

            // Reset for retry
            playerSequence = [];
            document.getElementById("resetBtn").style.display = "inline-block";
            document.getElementById("startBtn").disabled = false;

            return;
        }
    }

    // If player has completed the entire sequence
    if (playerSequence.length === currentSequence.length) {
        canGuess = false;
        document.getElementById("statusText").textContent = "Riktig sekvens!";
        showFeedback("Riktig! Du går videre til neste nivå.", "success");

        // Increase level
        currentLevel++;
        document.getElementById("levelCount").textContent = currentLevel;

        // Check win condition
        if (currentLevel > maxLevel) {
            // Game completed!
            const xhr = new XMLHttpRequest();
            xhr.open("POST", "/complete-game");
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.onload = function () {
                if (xhr.status === 200) {
                    showWinMessage(
                        gameConfig.winMessage ||
                            "Gratulerer! Du fullførte alle nivåene!",
                    );
                }
            };
            xhr.send(
                JSON.stringify({
                    gameId: getGameIdFromUrl(),
                    gameType: "colorseq",
                    score: currentLevel - 1,
                }),
            );
        } else {
            // Generate new sequence for next level
            generateNewSequence();

            // Reset for next sequence
            setTimeout(() => {
                resetForNextSequence();
            }, 1500);
        }
    }
}

function getGameIdFromUrl() {
    const pathParts = window.location.pathname.split("/");
    return pathParts[pathParts.length - 1];
}

function resetGame() {
    document.getElementById("resetBtn").style.display = "none";
    document.getElementById("startBtn").disabled = false;
    document.getElementById("statusText").textContent =
        'Klikk på "Start sekvens" for å begynne';

    playerSequence = [];
}

function resetForNextSequence() {
    playerSequence = [];
    document.getElementById("startBtn").disabled = false;
    document.getElementById("statusText").textContent =
        'Klikk på "Start sekvens" for å se neste sekvens';
}

function showFeedback(message, type) {
    const feedbackElement = document.getElementById("feedbackMessage");
    feedbackElement.textContent = message;
    feedbackElement.className = `message ${type}`;
    feedbackElement.style.display = "block";

    // Hide the message after a few seconds
    setTimeout(() => {
        feedbackElement.style.display = "none";
    }, 3000);
}
