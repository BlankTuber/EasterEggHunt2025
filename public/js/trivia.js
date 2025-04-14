// Initialize variables
let socket;
let playerName = "";
let gameConfig;
let myOptions = [];
let selectedAnswerId = null;
let hasAnswered = false;

document.addEventListener("DOMContentLoaded", function () {
    // Load game config
    try {
        gameConfig = JSON.parse(
            document.getElementById("gameConfigData").textContent,
        );
    } catch (error) {
        console.error("Error parsing game config:", error);
        gameConfig = { type: "unknown", numQuestions: "?" };
    }

    // Set up share link
    const shareLink = document.getElementById("shareLink");
    shareLink.value = window.location.href;

    // Copy link button
    document.getElementById("copyLink").addEventListener("click", function () {
        shareLink.select();
        document.execCommand("copy");
        this.textContent = "Kopiert!";
        setTimeout(() => {
            this.textContent = "Kopier";
        }, 2000);
    });

    // Player form is handled by player-entry.ejs partial
    // It will call startGame(playerName) when submitted
});

function startGame(name) {
    playerName = name;

    // Initialize socket connection
    socket = io();

    // Connect to the game room
    socket.emit("join-game", { gameId, playerName });

    // Socket event handlers
    socket.on("player-joined", handlePlayerJoined);
    socket.on("player-left", handlePlayerLeft);
    socket.on("trivia-question", handleTriviaQuestion);
    socket.on("trivia-options", handleTriviaOptions);
    socket.on("player-answered", handlePlayerAnswered);
    socket.on("answer-result", handleAnswerResult);
    socket.on("game-completed", handleGameCompleted);
    socket.on("game-reset", handleGameReset);
    socket.on("error", handleError);
}

// Socket event handlers
function handlePlayerJoined(data) {
    const { player, playerCount, requiredPlayers } = data;

    // Update player count
    document.getElementById("playerCount").textContent = playerCount;

    // Add player to the list
    const playersList = document.getElementById("playersList");
    const playerItem = document.createElement("li");
    playerItem.textContent = player.name;
    playerItem.dataset.id = player.id;
    playersList.appendChild(playerItem);

    // If game is starting, hide waiting room and show game area
    if (playerCount === requiredPlayers) {
        document.getElementById("waitingRoom").style.display = "none";
        document.getElementById("gameArea").style.display = "block";
    }
}

function handlePlayerLeft(data) {
    const { playerId, playerCount } = data;

    // Update player count
    document.getElementById("playerCount").textContent = playerCount;

    // Remove player from the list
    const playerItem = document.querySelector(
        `#playersList li[data-id="${playerId}"]`,
    );
    if (playerItem) {
        playerItem.remove();
    }

    // Remove player status indicator
    const statusIndicator = document.querySelector(
        `.player-status[data-id="${playerId}"]`,
    );
    if (statusIndicator) {
        statusIndicator.remove();
    }
}

function handleTriviaQuestion(data) {
    const { question, currentQuestion, totalQuestions } = data;

    // Reset state for new question
    selectedAnswerId = null;
    hasAnswered = false;
    myOptions = [];

    // Update question display
    document.getElementById("questionText").textContent = question;
    document.getElementById("questionNumber").textContent = currentQuestion;
    document.getElementById("totalQuestions").textContent = totalQuestions;

    // Clear options container
    const optionsContainer = document.getElementById("optionsContainer");
    optionsContainer.innerHTML = "";

    // Clear feedback message
    const feedbackMessage = document.getElementById("feedbackMessage");
    feedbackMessage.style.display = "none";

    // Reset player status indicators
    resetPlayerStatusIndicators();
}

function handleTriviaOptions(data) {
    const { options } = data;
    myOptions = options;

    // Display my options
    const optionsContainer = document.getElementById("optionsContainer");

    options.forEach((option) => {
        const optionBtn = document.createElement("button");
        optionBtn.className = "option-btn";
        optionBtn.textContent = option.text;
        optionBtn.dataset.id = option.id;

        optionBtn.addEventListener("click", function () {
            if (hasAnswered) return;

            // Deselect any previously selected option
            document.querySelectorAll(".option-btn").forEach((btn) => {
                btn.classList.remove("selected");
            });

            // Select this option
            this.classList.add("selected");
            selectedAnswerId = option.id;
        });

        optionsContainer.appendChild(optionBtn);
    });

    // Add submit button
    const submitBtn = document.createElement("button");
    submitBtn.className = "btn";
    submitBtn.id = "submitAnswer";
    submitBtn.textContent = "Send Svar";
    submitBtn.style.marginTop = "20px";

    submitBtn.addEventListener("click", function () {
        if (hasAnswered || !selectedAnswerId) return;

        // Submit answer
        socket.emit("select-answer", { gameId, answerId: selectedAnswerId });

        // Mark as answered
        hasAnswered = true;
        this.disabled = true;

        // Update status
        showFeedback("Svar sendt! Venter på andre spillere...", "info");
    });

    optionsContainer.appendChild(submitBtn);
}

function handlePlayerAnswered(data) {
    const { playerId } = data;

    // Update player status indicator
    const statusIndicator = document.querySelector(
        `.player-status[data-id="${playerId}"]`,
    );
    if (statusIndicator) {
        statusIndicator.classList.add("answered");
    }
}

function handleAnswerResult(data) {
    const { correct, message } = data;

    // Show result message
    showFeedback(message, correct ? "success" : "error");

    // Highlight correct answer if available
    if (correct) {
        // We don't know which option was correct, so we can't highlight it
        // This information wasn't sent from the server
    }
}

function handleGameCompleted(data) {
    showFeedback(data.message, "success");
}

function handleGameReset(data) {
    // Show waiting room again
    document.getElementById("waitingRoom").style.display = "block";
    document.getElementById("gameArea").style.display = "none";

    // Show reset message
    showFeedback(data.message, "info");
}

function handleError(data) {
    showFeedback(data.message, "error");
}

// Helper functions
function resetPlayerStatusIndicators() {
    // Create player status indicators
    const playersStatus = document.querySelector(".players-status");
    playersStatus.innerHTML = "";

    const playersList = document.querySelectorAll("#playersList li");
    playersList.forEach((playerItem) => {
        const statusIndicator = document.createElement("div");
        statusIndicator.className = "player-status";
        statusIndicator.dataset.id = playerItem.dataset.id;
        statusIndicator.textContent = playerItem.textContent;
        playersStatus.appendChild(statusIndicator);
    });
}

function showFeedback(message, type) {
    const feedbackElement = document.getElementById("feedbackMessage");
    feedbackElement.textContent = message;
    feedbackElement.className = `message ${type}`;
    feedbackElement.style.display = "block";
}
