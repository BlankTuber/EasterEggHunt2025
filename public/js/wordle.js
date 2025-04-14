let gameConfig;
let currentRow = 0;
let currentCol = 0;
let wordLength = 5;
let maxAttempts = 5;
let currentAttempt = [];
let wordsGuessed = 0;
let currentWord = "";
let wordList = [];

function init() {
    // Load game config from page
    gameConfig = JSON.parse(
        document.getElementById("gameConfigData").textContent,
    );
    wordLength = gameConfig.wordLength || 5;
    maxAttempts = gameConfig.attempts || 5;
    wordList = gameConfig.words || [];

    // Create game board
    createWordleGrid();

    // Set up keyboard listeners
    setupKeyboard();
    window.addEventListener("keydown", handleKeyPress);

    // Get first word
    getNewWord();
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

function createWordleGrid() {
    const grid = document.getElementById("wordleGrid");
    grid.innerHTML = "";

    // Create rows (max attempts)
    for (let i = 0; i < maxAttempts; i++) {
        const row = document.createElement("div");
        row.className = "wordle-row";

        // Create cells based on word length
        for (let j = 0; j < wordLength; j++) {
            const cell = document.createElement("div");
            cell.className = "wordle-cell";
            cell.dataset.row = i;
            cell.dataset.col = j;
            row.appendChild(cell);
        }

        grid.appendChild(row);
    }

    // Reset variables
    currentRow = 0;
    currentCol = 0;
    currentAttempt = [];
}

function getNewWord() {
    // Get a random word from the list
    if (wordList.length > 0) {
        currentWord =
            wordList[Math.floor(Math.random() * wordList.length)].toLowerCase();

        // Ensure word is the right length
        while (currentWord.length !== wordLength && wordList.length > 1) {
            currentWord =
                wordList[
                    Math.floor(Math.random() * wordList.length)
                ].toLowerCase();
        }
    } else {
        // Fallback words if no list is provided
        const fallbackWords = ["huset", "kaffe", "spill", "fjell", "skole"];
        currentWord =
            fallbackWords[Math.floor(Math.random() * fallbackWords.length)];
    }
}

function setupKeyboard() {
    const keyButtons = document.querySelectorAll(".key-btn");
    keyButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const key = button.getAttribute("data-key");
            handleKeyInput(key);
        });
    });
}

function handleKeyPress(e) {
    const key = e.key.toLowerCase();

    if (key === "enter") {
        handleKeyInput("enter");
    } else if (key === "backspace") {
        handleKeyInput("backspace");
    } else if (/^[a-zæøå]$/.test(key)) {
        handleKeyInput(key);
    }
}

function handleKeyInput(key) {
    if (key === "enter") {
        submitGuess();
    } else if (key === "backspace") {
        deleteLastLetter();
    } else if (/^[a-zæøå]$/.test(key) && currentCol < wordLength) {
        addLetter(key);
    }
}

function addLetter(letter) {
    if (currentCol < wordLength) {
        const cell = document.querySelector(
            `.wordle-cell[data-row="${currentRow}"][data-col="${currentCol}"]`,
        );
        cell.textContent = letter.toUpperCase();
        currentAttempt.push(letter.toLowerCase());
        currentCol++;
    }
}

function deleteLastLetter() {
    if (currentCol > 0) {
        currentCol--;
        const cell = document.querySelector(
            `.wordle-cell[data-row="${currentRow}"][data-col="${currentCol}"]`,
        );
        cell.textContent = "";
        currentAttempt.pop();
    }
}

function submitGuess() {
    if (currentAttempt.length !== wordLength) {
        showFeedback(`Ordet må være ${wordLength} bokstaver langt!`, "error");
        return;
    }

    const guess = currentAttempt.join("");

    // Process guess
    const result = processGuess(guess);

    // Update board with result
    updateBoardWithResult(result.letters);

    // Check if word was guessed correctly
    if (result.correct) {
        // Update words guessed count
        wordsGuessed++;
        document.getElementById("wordsGuessed").textContent = wordsGuessed;

        // Show feedback
        showFeedback("Riktig! Du gjettet ordet!", "success");

        // Check win condition
        if (wordsGuessed >= gameConfig.requiredWins) {
            // Send completion data to server
            const xhr = new XMLHttpRequest();
            xhr.open("POST", "/complete-game");
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.onload = function () {
                if (xhr.status === 200) {
                    showWinMessage(
                        gameConfig.winMessage ||
                            "Gratulerer! Du gjettet alle ordene!",
                    );
                }
            };
            xhr.send(
                JSON.stringify({
                    gameId: getGameIdFromUrl(),
                    gameType: "wordle",
                    score: wordsGuessed,
                }),
            );
        } else {
            // Get a new word
            setTimeout(() => {
                resetBoard();
                getNewWord();
            }, 1500);
        }
    } else {
        // Update row and attempt
        currentRow++;
        currentCol = 0;
        currentAttempt = [];

        // Check if max attempts reached
        if (currentRow >= maxAttempts) {
            showFeedback(`Beklager, ordet var "${currentWord}"`, "error");

            // Reset for next word
            setTimeout(() => {
                resetBoard();
                getNewWord();
            }, 2000);
        }
    }
}

function processGuess(guess) {
    // Normalize guess and word
    const normalizedGuess = guess.toLowerCase();
    const normalizedWord = currentWord.toLowerCase();

    // Check for exact match
    if (normalizedGuess === normalizedWord) {
        return {
            correct: true,
            letters: Array(normalizedWord.length).fill("green"),
        };
    }

    // Process letter by letter
    const result = { correct: false, letters: [] };
    const letterCounts = {};

    // Count letters in the word
    for (const letter of normalizedWord) {
        letterCounts[letter] = (letterCounts[letter] || 0) + 1;
    }

    // First pass: mark correct positions
    for (let i = 0; i < normalizedGuess.length; i++) {
        const guessLetter = normalizedGuess[i];

        if (i < normalizedWord.length && guessLetter === normalizedWord[i]) {
            result.letters[i] = "green";
            letterCounts[guessLetter]--;
        } else {
            result.letters[i] = "gray";
        }
    }

    // Second pass: mark correct letters in wrong positions
    for (let i = 0; i < normalizedGuess.length; i++) {
        const guessLetter = normalizedGuess[i];

        if (
            result.letters[i] !== "green" &&
            letterCounts[guessLetter] &&
            letterCounts[guessLetter] > 0
        ) {
            result.letters[i] = "yellow";
            letterCounts[guessLetter]--;
        }
    }

    return result;
}

function updateBoardWithResult(result) {
    for (let i = 0; i < result.length; i++) {
        const cell = document.querySelector(
            `.wordle-cell[data-row="${currentRow}"][data-col="${i}"]`,
        );
        cell.classList.add(result[i]);

        // Update keyboard
        const letter = currentAttempt[i];
        const keyButton = document.querySelector(
            `.key-btn[data-key="${letter}"]`,
        );

        if (keyButton) {
            // Only upgrade key color if it's "better"
            if (result[i] === "green") {
                keyButton.className = "key-btn green";
            } else if (
                result[i] === "yellow" &&
                !keyButton.classList.contains("green")
            ) {
                keyButton.className = "key-btn yellow";
            } else if (
                result[i] === "gray" &&
                !keyButton.classList.contains("green") &&
                !keyButton.classList.contains("yellow")
            ) {
                keyButton.className = "key-btn gray";
            }
        }
    }
}

function resetBoard() {
    // Remove all letters from the board
    const cells = document.querySelectorAll(".wordle-cell");
    cells.forEach((cell) => {
        cell.textContent = "";
        cell.className = "wordle-cell";
    });

    // Reset keyboard colors
    const keys = document.querySelectorAll(".key-btn");
    keys.forEach((key) => {
        key.className = "key-btn";
    });

    // Reset variables
    currentRow = 0;
    currentCol = 0;
    currentAttempt = [];
}

function showFeedback(message, type) {
    const feedbackElement = document.getElementById("feedbackMessage");
    feedbackElement.textContent = message;
    feedbackElement.className = `message ${type}`;
    feedbackElement.style.display = "block";

    // Hide after 3 seconds
    setTimeout(() => {
        feedbackElement.style.display = "none";
    }, 3000);
}
