let gameConfig;
let wrongGuesses = 0;
let guessedLetters = [];
let phrase = "";
let displayPhrase = "";
let maxWrong = 6;
let playerName = "";

function init() {
    // Load game config from page
    gameConfig = JSON.parse(
        document.getElementById("gameConfigData").textContent,
    );
    phrase = gameConfig.phrase || "Dette er en norsk eksempelsetning";
    maxWrong = gameConfig.maxWrong || 6;

    // Get player name if available
    const playerNameInput = document.getElementById("playerName");
    if (playerNameInput) {
        playerName = playerNameInput.value.trim();
    }

    // Create keyboard
    createKeyboard();

    // Initialize game state
    resetGame();
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

function getGameIdFromUrl() {
    const pathParts = window.location.pathname.split("/");
    return pathParts[pathParts.length - 1];
}

function createKeyboard() {
    const keyboard = document.getElementById("hangmanKeyboard");
    keyboard.innerHTML = "";

    const letters = "abcdefghijklmnopqrstuvwxyzæøå".split("");

    letters.forEach((letter) => {
        const button = document.createElement("button");
        button.className = "hangman-key";
        button.textContent = letter.toUpperCase();
        button.dataset.letter = letter;

        button.addEventListener("click", () => {
            guessLetter(letter);
        });

        keyboard.appendChild(button);
    });
}

function updateKeyboard() {
    // Mark used letters
    guessedLetters.forEach((letter) => {
        const key = document.querySelector(
            `.hangman-key[data-letter="${letter}"]`,
        );
        if (key) {
            key.classList.add("used");
            key.disabled = true;
        }
    });
}

function resetGame() {
    wrongGuesses = 0;
    guessedLetters = [];

    // Reset keyboard
    const keys = document.querySelectorAll(".hangman-key");
    keys.forEach((key) => {
        key.classList.remove("used");
        key.disabled = false;
    });

    // Reset image
    document.getElementById("hangmanImage").src = "/images/hangman/0.png";
    document.getElementById("wrongGuesses").textContent = "0";

    // Generate display phrase
    updateDisplayPhrase();

    // Remove any feedback
    document.getElementById("feedbackMessage").style.display = "none";
}

function guessLetter(letter) {
    if (guessedLetters.includes(letter)) return;

    // Add letter to guessed letters
    guessedLetters.push(letter);

    // Check if letter is in the phrase
    const normalizedPhrase = phrase.toLowerCase();
    if (!normalizedPhrase.includes(letter.toLowerCase())) {
        wrongGuesses++;
        document.getElementById("wrongGuesses").textContent = wrongGuesses;
        document.getElementById(
            "hangmanImage",
        ).src = `/images/hangman/${wrongGuesses}.png`;
    }

    // Update display
    updateDisplayPhrase();
    updateKeyboard();

    // Check game state
    checkGameState();
}

function updateDisplayPhrase() {
    let display = "";

    for (const char of phrase) {
        if (char === " ") {
            display += " ";
        } else if (/[a-zA-ZæøåÆØÅ]/.test(char)) {
            if (guessedLetters.includes(char.toLowerCase())) {
                display += char;
            } else {
                display += "_";
            }
        } else {
            display += char;
        }
    }

    displayPhrase = display;

    // Update display
    const wordContainer = document.getElementById("hangmanWord");
    wordContainer.innerHTML = "";

    for (let i = 0; i < displayPhrase.length; i++) {
        const letterContainer = document.createElement("div");

        if (displayPhrase[i] === " ") {
            letterContainer.className = "hangman-letter space";
        } else {
            letterContainer.className = "hangman-letter";
            letterContainer.textContent = displayPhrase[i];
        }

        wordContainer.appendChild(letterContainer);
    }
}

function checkGameState() {
    // Check if player won
    if (!displayPhrase.includes("_")) {
        // Player won!
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/complete-game");
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onload = function () {
            if (xhr.status === 200) {
                showWinMessage(
                    gameConfig.winMessage || "Gratulerer! Du gjettet frasen!",
                );
            }
        };
        xhr.send(
            JSON.stringify({
                gameId: getGameIdFromUrl(),
                gameType: "hangman",
                score: 1,
                playerName: playerName,
                phrase:
                    phrase.substring(0, 20) + (phrase.length > 20 ? "..." : ""), // Include a preview of the phrase
            }),
        );
    }
    // Check if player lost
    else if (wrongGuesses >= maxWrong) {
        // Show full phrase
        showFeedback(`Beklager, du tapte. Frasen var: "${phrase}"`, "error");

        // Reset game after 3 seconds
        setTimeout(() => {
            resetGame();
        }, 3000);
    }
}

function showFeedback(message, type) {
    const feedbackElement = document.getElementById("feedbackMessage");
    feedbackElement.textContent = message;
    feedbackElement.className = `message ${type}`;
    feedbackElement.style.display = "block";
}
