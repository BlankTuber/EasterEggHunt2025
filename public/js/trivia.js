let socket;
let playerName = "";
let gameConfig;
let myOptions = [];
let hasAnswered = false;
let currentStreak = 0;
let requiredStreak = 7;

document.addEventListener("DOMContentLoaded", function () {
    try {
        gameConfig = JSON.parse(
            document.getElementById("gameConfigData").textContent,
        );
    } catch (error) {
        console.error("Error parsing game config:", error);
        gameConfig = { type: "unknown", numQuestions: "?" };
    }

    const shareLink = document.getElementById("shareLink");
    shareLink.value = window.location.href;

    document.getElementById("copyLink").addEventListener("click", function () {
        shareLink.select();
        document.execCommand("copy");
        this.textContent = "Kopiert!";
        setTimeout(() => {
            this.textContent = "Kopier";
        }, 2000);
    });

    // Create streak counter element if it doesn't exist
    if (!document.getElementById("streakCounter")) {
        const gameHeader = document.querySelector(".game-header");
        if (gameHeader) {
            const streakDisplay = document.createElement("div");
            streakDisplay.className = "game-score";
            streakDisplay.innerHTML = `<span>Streak: <span id="streakCount">0</span>/<span id="requiredStreak">${requiredStreak}</span></span>`;
            gameHeader.appendChild(streakDisplay);
        }
    }
});

function startGame(name) {
    playerName = name;

    socket = io();

    socket.emit("join-game", { gameId, playerName });

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

function handlePlayerJoined(data) {
    const { player, playerCount, requiredPlayers } = data;

    document.getElementById("playerCount").textContent = playerCount;

    const playersList = document.getElementById("playersList");
    const playerItem = document.createElement("li");
    playerItem.textContent = player.name;
    playerItem.dataset.id = player.id;
    playersList.appendChild(playerItem);

    if (playerCount === requiredPlayers) {
        document.getElementById("waitingRoom").style.display = "none";
        document.getElementById("gameArea").style.display = "block";
    }
}

function handlePlayerLeft(data) {
    const { playerId, playerCount } = data;

    document.getElementById("playerCount").textContent = playerCount;

    const playerItem = document.querySelector(
        `#playersList li[data-id="${playerId}"]`,
    );
    if (playerItem) {
        playerItem.remove();
    }

    const statusIndicator = document.querySelector(
        `.player-status[data-id="${playerId}"]`,
    );
    if (statusIndicator) {
        statusIndicator.remove();
    }
}

function handleTriviaQuestion(data) {
    const {
        question,
        currentQuestion,
        totalQuestions,
        streak,
        requiredStreak,
    } = data;

    hasAnswered = false;
    myOptions = [];

    document.getElementById("questionText").textContent = question;
    document.getElementById("questionNumber").textContent = currentQuestion;
    document.getElementById("totalQuestions").textContent = totalQuestions;

    // Update streak counter if provided
    if (streak !== undefined) {
        currentStreak = streak;
        const streakCount = document.getElementById("streakCount");
        if (streakCount) {
            streakCount.textContent = streak;
        }
    }

    // Update required streak if provided
    if (requiredStreak !== undefined) {
        const requiredStreakElement = document.getElementById("requiredStreak");
        if (requiredStreakElement) {
            requiredStreakElement.textContent = requiredStreak;
        }
    }

    // Update the instruction text with streak information
    updateInstructionText();

    const feedbackMessage = document.getElementById("feedbackMessage");
    feedbackMessage.style.display = "none";

    resetPlayerStatusIndicators();
}

function updateInstructionText() {
    const instructionText = document.querySelector(".instruction-text");
    if (instructionText) {
        instructionText.innerHTML = `
            <strong>Viktig:</strong> Svar riktig på 7 spørsmål på rad for å vinne! 
            Feil svar nullstiller streaken. 
            Kun én spiller har det riktige svaret blant sine alternativer.
            Diskuter med de andre spillerne for å finne ut hvem som har det riktige svaret.
            Nåværende streak: <strong>${currentStreak}</strong> av <strong>${requiredStreak}</strong> riktige.
        `;
        instructionText.style.backgroundColor = "#e8f4fd";
        instructionText.style.color = "#0d6efd";
        instructionText.style.borderLeft = "4px solid #0d6efd";
    }
}

function handleTriviaOptions(data) {
    const { options } = data;
    myOptions = options;

    const optionsContainer = document.getElementById("optionsContainer");
    optionsContainer.innerHTML = "";

    options.forEach((option) => {
        const optionBtn = document.createElement("button");
        optionBtn.className = "option-btn";
        optionBtn.textContent = option.text;
        optionBtn.dataset.id = option.id;

        optionBtn.addEventListener("click", function () {
            if (hasAnswered) return;

            // Submit answer immediately when clicked
            socket.emit("select-answer", { gameId, answerId: option.id });
            hasAnswered = true;

            // Disable all options after an answer is selected
            disableAllOptions();

            showFeedback(
                "Ditt svar er sendt! Dette er gruppens endelige svar.",
                "info",
            );
        });

        optionsContainer.appendChild(optionBtn);
    });
}

function disableAllOptions() {
    const optionButtons = document.querySelectorAll(".option-btn");
    optionButtons.forEach((btn) => {
        btn.disabled = true;
        btn.style.opacity = "0.6";
        btn.style.cursor = "not-allowed";
    });
}

function handlePlayerAnswered(data) {
    const { playerId } = data;

    const statusIndicator = document.querySelector(
        `.player-status[data-id="${playerId}"]`,
    );
    if (statusIndicator) {
        statusIndicator.classList.add("answered");
    }

    // Disable all options for all players once any player has answered
    disableAllOptions();
}

function handleAnswerResult(data) {
    const { correct, message, streak } = data;

    // Update streak counter if provided
    if (streak !== undefined) {
        currentStreak = streak;
        const streakCount = document.getElementById("streakCount");
        if (streakCount) {
            streakCount.textContent = streak;
        }

        // Also update the instruction text with current streak
        updateInstructionText();
    }

    showFeedback(message, correct ? "success" : "error");
}

function getGameIdFromUrl() {
    const pathParts = window.location.pathname.split("/");
    return pathParts[pathParts.length - 1];
}

function handleGameCompleted(data) {
    // Send completion data to server (like other games do)
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/complete-game");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onload = function () {
        console.log("Completion data sent to server");
    };

    // Get gameId from URL path and trivia type from config
    const triviaType = gameConfig.triviaType || "common";
    const configType = gameConfig.type || "commonknowledge";

    xhr.send(
        JSON.stringify({
            gameId: getGameIdFromUrl(),
            gameType: "trivia",
            score: requiredStreak, // Use the required streak as score
            triviaType: triviaType,
            configType: configType,
            playerName: playerName,
            players: getPlayerNames(),
        }),
    );

    // Show big completion message
    const gameArea = document.getElementById("gameArea");

    // Create a completion overlay
    const completionOverlay = document.createElement("div");
    completionOverlay.className = "completion-overlay";
    completionOverlay.style.position = "fixed";
    completionOverlay.style.top = "0";
    completionOverlay.style.left = "0";
    completionOverlay.style.width = "100%";
    completionOverlay.style.height = "100%";
    completionOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    completionOverlay.style.display = "flex";
    completionOverlay.style.justifyContent = "center";
    completionOverlay.style.alignItems = "center";
    completionOverlay.style.zIndex = "1000";

    const completionMessage = document.createElement("div");
    completionMessage.className = "completion-message";
    completionMessage.style.backgroundColor = "white";
    completionMessage.style.padding = "30px";
    completionMessage.style.borderRadius = "10px";
    completionMessage.style.maxWidth = "80%";
    completionMessage.style.textAlign = "center";
    completionMessage.style.boxShadow = "0 5px 15px rgba(0, 0, 0, 0.3)";

    const completionTitle = document.createElement("h2");
    completionTitle.textContent = "Gratulerer!";
    completionTitle.style.color = "#28a745";
    completionTitle.style.marginBottom = "15px";

    const completionText = document.createElement("p");
    completionText.textContent = data.message;
    completionText.style.fontSize = "18px";
    completionText.style.marginBottom = "20px";

    const waitingText = document.createElement("p");
    waitingText.textContent = "Venter på å starte et nytt spill...";
    waitingText.style.fontSize = "14px";
    waitingText.style.color = "#666";

    completionMessage.appendChild(completionTitle);
    completionMessage.appendChild(completionText);
    completionMessage.appendChild(waitingText);
    completionOverlay.appendChild(completionMessage);

    document.body.appendChild(completionOverlay);

    // Regular feedback message
    showFeedback(data.message, "success");

    // Reset streak counter for visual feedback
    currentStreak = 0;
    const streakCount = document.getElementById("streakCount");
    if (streakCount) {
        streakCount.textContent = "0";
    }

    // Update instruction text one last time
    updateInstructionText();

    // Remove the overlay after some time
    setTimeout(() => {
        document.body.removeChild(completionOverlay);
    }, 7000);
}

function getPlayerNames() {
    const playerItems = document.querySelectorAll("#playersList li");
    const names = [];
    playerItems.forEach((item) => {
        names.push(item.textContent);
    });
    return names.join(", ");
}

function handleGameReset(data) {
    document.getElementById("waitingRoom").style.display = "block";
    document.getElementById("gameArea").style.display = "none";

    // Reset streak counter
    currentStreak = 0;
    const streakCount = document.getElementById("streakCount");
    if (streakCount) {
        streakCount.textContent = "0";
    }

    showFeedback(data.message, "info");
}

function handleError(data) {
    showFeedback(data.message, "error");
}

function resetPlayerStatusIndicators() {
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
