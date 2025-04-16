let gameConfig;
let currentImageIndex = 0;
let score = 0;
let images = [];
let usedImages = new Set();
let playerName = "";

function init() {
    // Load game config from page
    gameConfig = JSON.parse(
        document.getElementById("gameConfigData").textContent,
    );
    images = gameConfig.images || [];

    // Get player name if available
    const playerNameInput = document.getElementById("playerName");
    if (playerNameInput) {
        playerName = playerNameInput.value.trim();
    }

    // Listen for guesses
    document
        .getElementById("guessForm")
        .addEventListener("submit", submitGuess);

    // Display first image if available
    if (images.length > 0) {
        displayImage(getNextImage());
    }
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

function getNextImage() {
    // If all images have been used, reset
    if (usedImages.size >= images.length) {
        usedImages.clear();
    }

    // Find an unused image
    let availableImages = images.filter((img) => !usedImages.has(img.id));

    // If no unused images, get a random one
    if (availableImages.length === 0) {
        return images[Math.floor(Math.random() * images.length)];
    }

    // Get random available image
    const image =
        availableImages[Math.floor(Math.random() * availableImages.length)];
    usedImages.add(image.id);

    return image;
}

function displayImage(image) {
    if (!image) return;

    const imgElement = document.getElementById("silhouetteImage");
    imgElement.src = image.imageUrl;
    imgElement.style.filter = "brightness(0)"; // Make image a silhouette

    // Store current image for guessing
    currentImageIndex = images.findIndex((img) => img.id === image.id);

    // Reset guess field
    document.getElementById("guessInput").value = "";
    hideFeedback();
}

function submitGuess(e) {
    e.preventDefault();

    const guess = document.getElementById("guessInput").value.trim();
    if (!guess) return;

    const currentImage = images[currentImageIndex];

    // Check if guess is correct
    if (guess.toLowerCase() === currentImage.answer.toLowerCase()) {
        // Update score
        score++;
        document.getElementById("score").textContent = score;

        // Show success message
        showFeedback("Riktig! Godt jobbet!", "success");

        // Remove filter to show actual image
        document.getElementById("silhouetteImage").style.filter = "none";

        // Check win condition
        if (score >= gameConfig.requiredPoints) {
            // Send completion data to server
            const xhr = new XMLHttpRequest();
            xhr.open("POST", "/complete-game");
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.onload = function () {
                if (xhr.status === 200) {
                    showWinMessage(
                        gameConfig.winMessage ||
                            "Gratulerer! Du identifiserte alle silhuettene!",
                    );
                }
            };
            xhr.send(
                JSON.stringify({
                    gameId: getGameIdFromUrl(),
                    gameType: "silhouette",
                    score: score,
                    configType: gameConfig.configType || getConfigTypeFromUrl(),
                    playerName: playerName,
                }),
            );
        } else {
            // After 2 seconds, show new image
            setTimeout(() => {
                displayImage(getNextImage());
            }, 2000);
        }
    } else {
        // Show error message
        showFeedback("Feil gjetning. Prøv igjen!", "error");
    }
}

function getConfigTypeFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("config") || "unknown";
}

function getGameIdFromUrl() {
    const pathParts = window.location.pathname.split("/");
    return pathParts[pathParts.length - 1];
}

function showFeedback(message, type) {
    const feedbackElement = document.getElementById("feedbackMessage");
    feedbackElement.textContent = message;
    feedbackElement.className = `message ${type}`;
    feedbackElement.style.display = "block";
}

function hideFeedback() {
    document.getElementById("feedbackMessage").style.display = "none";
}
