let gameConfig;
let currentImageIndex = 0;
let score = 0;
let images = [];
let usedImages = new Set();
let playerName = "";
let wrongGuessCount = 0;

function init() {
    gameConfig = JSON.parse(
        document.getElementById("gameConfigData").textContent,
    );
    images = gameConfig.images || [];

    const playerNameInput = document.getElementById("playerName");
    if (playerNameInput) {
        playerName = playerNameInput.value.trim();
    }

    document
        .getElementById("guessForm")
        .addEventListener("submit", submitGuess);

    if (images.length > 0) {
        displayImage(getNextImage());
    }
}

document.addEventListener("DOMContentLoaded", function () {
    document.querySelector(".game-area").style.display = "block";
    const playerForm = document.querySelector(".player-form");
    if (playerForm) playerForm.style.display = "none";
    init();
});

function getNextImage() {
    if (usedImages.size >= images.length) {
        usedImages.clear();
    }

    let availableImages = images.filter((img) => !usedImages.has(img.id));

    if (availableImages.length === 0) {
        return images[Math.floor(Math.random() * images.length)];
    }

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

    currentImageIndex = images.findIndex((img) => img.id === image.id);

    document.getElementById("guessInput").value = "";
    hideFeedback();

    wrongGuessCount = 0;
}

function submitGuess(e) {
    e.preventDefault();

    const guess = document.getElementById("guessInput").value.trim();
    if (!guess) return;

    const currentImage = images[currentImageIndex];

    const currentAnswer = currentImage.answer.toLowerCase();
    const userGuess = guess.toLowerCase();

    const answerWords = currentAnswer.split(/\s+/);

    const isCorrect =
        currentAnswer === userGuess ||
        answerWords.includes(userGuess) ||
        (userGuess.length >= 3 && currentAnswer.includes(userGuess)) ||
        (currentAnswer.length >= 3 && userGuess.includes(currentAnswer));

    if (isCorrect) {
        score++;
        document.getElementById("score").textContent = score;

        showFeedback("Riktig! Godt jobbet!", "success");

        document.getElementById("silhouetteImage").style.filter = "none";

        if (score >= gameConfig.requiredPoints) {
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
            setTimeout(() => {
                displayImage(getNextImage());
            }, 2000);
        }
    } else {
        wrongGuessCount++;

        if (wrongGuessCount >= 3) {
            score = 0;
            document.getElementById("score").textContent = score;

            showFeedback(
                "3 feil gjetninger! Spillet blir nullstilt. Start på nytt!",
                "error",
            );

            setTimeout(() => {
                displayImage(getNextImage());
            }, 2000);
        } else {
            showFeedback(
                `Feil gjetning. Du har ${3 - wrongGuessCount} forsøk igjen.`,
                "error",
            );
        }
    }
}

function getGameIdFromUrl() {
    const pathParts = window.location.pathname.split("/");
    return pathParts[pathParts.length - 1];
}

function getConfigTypeFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("config") || "unknown";
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
