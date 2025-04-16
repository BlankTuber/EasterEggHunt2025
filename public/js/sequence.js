let socket;
let playerName = "";
let gameConfig;
let grid = [];
let startPosition = { x: 0, y: 0 };
let targetPosition = { x: 0, y: 0 };
let playerIndex = 0;
let currentSequence = [];
let cellSize = 25;
let inWaitingList = false;
let simulationRunning = false;
let players = [];

function adjustGridForScreen() {
    if (!grid.length) return;

    const gridHeight = grid.length;
    const gridWidth = grid[0].length;
    const gridWrapper = document.querySelector(".sequence-grid-wrapper");

    const containerWidth = gridWrapper.clientWidth;

    let optimalCellSize = Math.floor(containerWidth / gridWidth);

    optimalCellSize = Math.max(optimalCellSize, 10);

    document.documentElement.style.setProperty(
        "--cell-size",
        `${optimalCellSize}px`,
    );
}

document.addEventListener("DOMContentLoaded", function () {
    try {
        gameConfig = JSON.parse(
            document.getElementById("gameConfigData").textContent,
        );
    } catch (error) {
        console.error("Error parsing game config:", error);
        gameConfig = { gridSize: 30, maxMoves: 100 };
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

    document.querySelectorAll(".direction-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            const direction = btn.dataset.direction;
            addMove(direction);
        });
    });

    document.getElementById("clearMoves").addEventListener("click", clearMoves);
    document
        .getElementById("submitSequence")
        .addEventListener("click", submitSequence);
    document.getElementById("resetView").addEventListener("click", function () {
        if (grid.length > 0) {
            createGrid();
            adjustGridForScreen();
        }
    });

    // Add keyboard controls
    document.addEventListener("keydown", function (event) {
        // Only process if game area is visible and controls are enabled
        if (
            document.getElementById("gameArea").style.display === "none" ||
            document.querySelector(".direction-btn").disabled
        ) {
            return;
        }

        // Prevent default behavior for arrow keys to avoid page scrolling
        if (
            ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(
                event.key,
            )
        ) {
            event.preventDefault();
        }

        switch (event.key) {
            case "ArrowUp":
                addMove("up");
                break;
            case "ArrowDown":
                addMove("down");
                break;
            case "ArrowLeft":
                addMove("left");
                break;
            case "ArrowRight":
                addMove("right");
                break;
            case " ": // Space bar
                addMove("stop");
                break;
        }
    });

    window.addEventListener("resize", function () {
        if (grid.length > 0) {
            adjustGridForScreen();
        }
    });

    if (gameConfig.playerCount !== undefined) {
        document.getElementById("playerCount").textContent =
            gameConfig.playerCount;

        if (
            gameConfig.waitingCount !== undefined &&
            gameConfig.waitingCount > 0
        ) {
            const waitingInfo = document.createElement("p");
            waitingInfo.className = "waiting-info";
            waitingInfo.textContent = `${gameConfig.waitingCount} spillere venter i kø.`;
            document.querySelector(".players-list").appendChild(waitingInfo);
        }

        if (gameConfig.gameInProgress) {
            const gameStatus = document.createElement("p");
            gameStatus.className = "game-status-info";
            gameStatus.innerHTML =
                "<strong>Et spill pågår allerede.</strong> Du vil bli plassert i kø hvis du registrerer deg nå.";
            document.querySelector(".player-entry").appendChild(gameStatus);
        }
    }
});

function startGame(name) {
    playerName = name;
    socket = io();
    socket.emit("join-game", { gameId, playerName });

    socket.on("player-joined", handlePlayerJoined);
    socket.on("player-left", handlePlayerLeft);
    socket.on("sequence-init", handleSequenceInit);
    socket.on("player-ready", handlePlayerReady);
    socket.on("sequence-result", handleSequenceResult);
    socket.on("waiting-list", handleWaitingList);
    socket.on("waiting-count-update", handleWaitingCountUpdate);
    socket.on("joined-from-waiting", handleJoinedFromWaiting);
    socket.on("moved-to-waiting", handleMovedToWaiting);
    socket.on("sequence-room-reset", handleRoomReset);
    socket.on("game-reset", handleGameReset);
    socket.on("error", handleError);
}

function handlePlayerJoined(data) {
    const { player, playerCount, requiredPlayers, waitingCount } = data;
    document.getElementById("playerCount").textContent = playerCount;

    // Add player to the internal players list
    players.push(player);

    const playersList = document.getElementById("playersList");
    const playerItem = document.createElement("li");
    playerItem.textContent = player.name;
    playerItem.dataset.id = player.id;
    playersList.appendChild(playerItem);

    if (waitingCount !== undefined) {
        updateWaitingCountDisplay(waitingCount);
    }

    if (playerCount === requiredPlayers) {
        document.getElementById("waitingRoom").style.display = "none";
        document.getElementById("gameArea").style.display = "block";
    }
}

function handlePlayerLeft(data) {
    const { playerId, playerCount } = data;
    document.getElementById("playerCount").textContent = playerCount;

    // Remove player from internal list
    players = players.filter((p) => p.id !== playerId);

    const playerItem = document.querySelector(
        `#playersList li[data-id="${playerId}"]`,
    );
    if (playerItem) {
        playerItem.remove();
    }

    const readyIndicator = document.querySelector(
        `#readyPlayers .player-status[data-id="${playerId}"]`,
    );
    if (readyIndicator) {
        readyIndicator.remove();
    }
}

function handleSequenceInit(data) {
    const {
        grid: newGrid,
        startPosition: newStartPos,
        targetPosition: newTargetPos,
        playerIndex: newPlayerIndex,
    } = data;
    inWaitingList = false;
    grid = newGrid;
    startPosition = newStartPos;
    targetPosition = newTargetPos;
    playerIndex = newPlayerIndex;

    createGrid();
    adjustGridForScreen();

    clearMoves();
    document.getElementById("readyPlayers").innerHTML = "";
    document.getElementById("gameStatus").textContent = "Planlegg din reise";
    enableControls(true);
    document.getElementById("waitingRoom").style.display = "none";
    document.getElementById("gameArea").style.display = "block";
}

function handlePlayerReady(data) {
    const { playerId, readyCount } = data;
    const readyPlayers = document.getElementById("readyPlayers");

    if (
        !document.querySelector(
            `#readyPlayers .player-status[data-id="${playerId}"]`,
        )
    ) {
        const playerItem = document.querySelector(
            `#playersList li[data-id="${playerId}"]`,
        );
        if (playerItem) {
            const statusIndicator = document.createElement("div");
            statusIndicator.className = "player-status";
            statusIndicator.dataset.id = playerId;
            statusIndicator.textContent = playerItem.textContent;
            readyPlayers.appendChild(statusIndicator);
        }
    }

    const requiredPlayers = parseInt(
        document.getElementById("requiredPlayers").textContent,
    );
    document.getElementById(
        "gameStatus",
    ).textContent = `Spillere klare: ${readyCount}/${requiredPlayers}`;
}

function handleSequenceResult(data) {
    const { success, movements, collisionAt, message, wallCollisions } = data;
    showFeedback(message, success ? "success" : "error");

    simulationRunning = true;
    document.getElementById("gameStatus").textContent = "Spiller av sekvens...";
    enableControls(false);

    // Clear any existing trails
    clearTrails();

    animateMovements(movements, collisionAt, wallCollisions, () => {
        simulationRunning = false;

        if (success) {
            document.getElementById("gameStatus").textContent =
                "Fullført! Venter på neste spill...";

            // Send game completion notification to server
            const xhr = new XMLHttpRequest();
            xhr.open("POST", "/complete-game");
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.send(
                JSON.stringify({
                    gameId: gameId,
                    gameType: "sequence",
                    score: 1,
                    playerName: playerName,
                    players: getPlayerNames(),
                }),
            );
        } else {
            // Add 1 second delay before resetting to see the end state
            setTimeout(() => {
                document.getElementById("gameStatus").textContent =
                    "Planlegg din reise";
                enableControls(true);
                clearMoves();
                createGrid();
                adjustGridForScreen();
            }, 1000);
        }
    });
}

function getPlayerNames() {
    return players.map((p) => p.name).join(", ");
}

function handleWaitingList(data) {
    const { position, message } = data;
    inWaitingList = true;

    const playersList = document.querySelector(".players-list");
    const playerForm = document.querySelector(".player-form");

    if (playersList) playersList.style.display = "none";
    if (playerForm) playerForm.style.display = "none";

    let waitingMessage = document.getElementById("waitingMessage");
    if (!waitingMessage) {
        waitingMessage = document.createElement("div");
        waitingMessage.id = "waitingMessage";
        waitingMessage.className = "waiting-message";
        document.getElementById("waitingRoom").appendChild(waitingMessage);
    }

    waitingMessage.innerHTML = `
        <h3>Du står i kø</h3>
        <p>${message}</p>
        <div class="waiting-animation">
            <span>●</span><span>●</span><span>●</span>
        </div>
        <p>Vennligst vent, nettleseren vil automatisk oppdateres når det er din tur.</p>
    `;
}

function handleWaitingCountUpdate(data) {
    const { waitingCount } = data;
    updateWaitingCountDisplay(waitingCount);
}

function handleJoinedFromWaiting(data) {
    const { message } = data;
    inWaitingList = false;

    const waitingMessage = document.getElementById("waitingMessage");
    if (waitingMessage) {
        waitingMessage.remove();
    }

    showFeedback(message, "success");
}

function handleMovedToWaiting(data) {
    const { message } = data;
    inWaitingList = true;

    document.getElementById("gameArea").style.display = "none";
    document.getElementById("waitingRoom").style.display = "block";

    handleWaitingList({
        position: null,
        message: message,
    });
}

function handleRoomReset(data) {
    const { message, waitingCount } = data;

    if (waitingCount !== undefined) {
        updateWaitingCountDisplay(waitingCount);
    }

    if (!inWaitingList) {
        showFeedback(message, "info");
    }
}

function handleGameReset(data) {
    if (!inWaitingList) {
        document.getElementById("waitingRoom").style.display = "block";
        document.getElementById("gameArea").style.display = "none";
        showFeedback(data.message, "info");
    }
}

function handleError(data) {
    showFeedback(data.message, "error");
}

function createGrid() {
    const gridContainer = document.getElementById("sequenceGrid");
    gridContainer.innerHTML = "";

    const gridHeight = grid.length;
    const gridWidth = grid[0].length;

    document.documentElement.style.setProperty("--grid-cols", gridWidth);
    document.documentElement.style.setProperty("--grid-rows", gridHeight);

    gridContainer.style.gridTemplateRows = `repeat(${gridHeight}, var(--cell-size))`;
    gridContainer.style.gridTemplateColumns = `repeat(${gridWidth}, var(--cell-size))`;

    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            const cell = document.createElement("div");
            cell.className = "sequence-cell";
            cell.dataset.x = x;
            cell.dataset.y = y;

            if (grid[y][x] === 1) {
                cell.classList.add("wall");
            }

            if (x === startPosition.x && y === startPosition.y) {
                cell.classList.add(`player-${playerIndex}`);
                cell.textContent = (playerIndex + 1).toString();
            }

            if (x === targetPosition.x && y === targetPosition.y) {
                cell.classList.add(`target-${playerIndex}`);
                cell.textContent = "T";
            }

            gridContainer.appendChild(cell);
        }
    }
}

function addMove(direction) {
    if (currentSequence.length >= gameConfig.maxMoves) {
        showFeedback(
            `Du kan ikke legge til flere bevegelser (maks ${gameConfig.maxMoves})`,
            "error",
        );
        return;
    }

    currentSequence.push(direction);
    updateMoveList();
    previewPath();
}

function removeMove(index) {
    if (index >= 0 && index < currentSequence.length) {
        currentSequence.splice(index, 1);
        updateMoveList();
        previewPath();
    }
}

function clearMoves() {
    currentSequence = [];
    updateMoveList();
    removePathPreview();
}

function updateMoveList() {
    const moveList = document.getElementById("moveList");
    moveList.innerHTML = "";

    if (currentSequence.length === 0) {
        moveList.innerHTML = "<em>Ingen bevegelser lagt til ennå</em>";
        return;
    }

    currentSequence.forEach((move, index) => {
        const moveItem = document.createElement("div");
        moveItem.className = "move-item";

        const moveText = document.createElement("span");
        moveText.className = "move-text";
        moveText.textContent = `${index + 1}: ${getDirectionText(move)}`;
        moveItem.appendChild(moveText);

        const removeBtn = document.createElement("button");
        removeBtn.className = "remove-move-btn";
        removeBtn.innerHTML = "×";
        removeBtn.title = "Fjern denne bevegelsen";
        removeBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            removeMove(index);
        });
        moveItem.appendChild(removeBtn);

        moveList.appendChild(moveItem);
    });
}

function getDirectionText(direction) {
    switch (direction) {
        case "up":
            return "Opp";
        case "right":
            return "Høyre";
        case "down":
            return "Ned";
        case "left":
            return "Venstre";
        case "stop":
            return "Vent";
        default:
            return direction;
    }
}

function previewPath() {
    removePathPreview();

    const path = calculatePath(startPosition, currentSequence);

    const lastThreeSteps = [];
    if (path.length > 1) {
        for (let i = Math.max(1, path.length - 3); i < path.length; i++) {
            lastThreeSteps.push(path[i]);
        }
    }

    lastThreeSteps.forEach((pos) => {
        const cell = document.querySelector(
            `.sequence-cell[data-x="${pos.x}"][data-y="${pos.y}"]`,
        );
        if (cell) {
            cell.classList.add(`path-${playerIndex}`);
        }
    });

    const finalPos = path[path.length - 1];
    if (finalPos.x === targetPosition.x && finalPos.y === targetPosition.y) {
        showFeedback("Ruten når målet!", "success");
    } else {
        showFeedback("Advarselse: Ruten når ikke målet", "info");
    }
}

function removePathPreview() {
    for (let i = 0; i < 5; i++) {
        document
            .querySelectorAll(`.sequence-cell.path-${i}`)
            .forEach((cell) => {
                cell.classList.remove(`path-${i}`);
            });
    }

    document.getElementById("feedbackMessage").style.display = "none";
}

function clearTrails() {
    for (let i = 0; i < 5; i++) {
        document
            .querySelectorAll(`.sequence-cell.trail-${i}`)
            .forEach((cell) => {
                cell.classList.remove(`trail-${i}`);
            });
    }
}

function calculatePath(startPos, sequence) {
    const path = [{ ...startPos }];
    let currentPos = { ...startPos };

    sequence.forEach((move) => {
        const newPos = getNewPosition(currentPos, move);
        currentPos = newPos;
        path.push({ ...currentPos });
    });

    return path;
}

function getNewPosition(pos, direction) {
    const newPos = { ...pos };

    const isWall = (x, y) => {
        if (x < 0 || y < 0 || x >= grid[0].length || y >= grid.length) {
            return true;
        }
        return grid[y][x] === 1;
    };

    switch (direction) {
        case "left":
            if (!isWall(newPos.x - 1, newPos.y)) {
                newPos.x--;
            }
            break;
        case "right":
            if (!isWall(newPos.x + 1, newPos.y)) {
                newPos.x++;
            }
            break;
        case "up":
            if (!isWall(newPos.x, newPos.y - 1)) {
                newPos.y--;
            }
            break;
        case "down":
            if (!isWall(newPos.x, newPos.y + 1)) {
                newPos.y++;
            }
            break;
    }

    return newPos;
}

function submitSequence() {
    if (currentSequence.length === 0) {
        showFeedback("Du må legge til minst én bevegelse!", "error");
        return;
    }

    enableControls(false);
    socket.emit("submit-sequence", { gameId, sequence: currentSequence });
    document.getElementById("gameStatus").textContent =
        "Venter på andre spillere...";
    showFeedback("Sekvens sendt! Venter på andre spillere...", "info");
}

function enableControls(enabled) {
    document.querySelectorAll(".direction-btn").forEach((btn) => {
        btn.disabled = !enabled;
    });

    document.getElementById("clearMoves").disabled = !enabled;
    document.getElementById("submitSequence").disabled = !enabled;
}

function animateMovements(movements, collisionAt, wallCollisions, onComplete) {
    removePathPreview();
    clearPlayerMarkers();
    clearTrails();

    let step = 0;
    const maxSteps = collisionAt ? collisionAt.step + 1 : movements.length;
    const trailHistory = {};

    // Initialize trail history for each player
    for (let i = 0; i < 5; i++) {
        trailHistory[i] = [];
    }

    const startingPositions = {};
    if (movements[0]) {
        movements[0].forEach((move) => {
            startingPositions[move.player] = move.from;
            addPlayerMarker(move.from.x, move.from.y, move.player);
            // Add starting position to trail history
            trailHistory[move.player].push(move.from);
        });
    }

    function nextStep() {
        if (step >= maxSteps) {
            onComplete();
            return;
        }

        clearPlayerMarkers();

        // Add trails for previous positions
        for (let playerIdx in trailHistory) {
            trailHistory[playerIdx].forEach((pos) => {
                const trailCell = document.querySelector(
                    `.sequence-cell[data-x="${pos.x}"][data-y="${pos.y}"]`,
                );
                if (trailCell) {
                    trailCell.classList.add(`trail-${playerIdx}`);
                }
            });
        }

        if (movements[step]) {
            movements[step].forEach((move) => {
                // Add current position to trail history
                trailHistory[move.player].push(move.to);

                // Display player markers at current position
                addPlayerMarker(move.to.x, move.to.y, move.player);

                // Check for collision with another player
                if (
                    collisionAt &&
                    step === collisionAt.step &&
                    collisionAt.players.includes(move.player)
                ) {
                    markCollision(move.to.x, move.to.y);
                }

                // Check for wall collision
                if (
                    wallCollisions &&
                    wallCollisions[step] &&
                    wallCollisions[step].some((wc) => wc.player === move.player)
                ) {
                    const wallCollision = wallCollisions[step].find(
                        (wc) => wc.player === move.player,
                    );
                    if (wallCollision) {
                        markWallCollision(
                            move.to.x,
                            move.to.y,
                            wallCollision.direction,
                        );
                    }
                }
            });
        }

        step++;
        setTimeout(nextStep, 500);
    }

    setTimeout(nextStep, 1000);
}

function clearPlayerMarkers() {
    for (let i = 0; i < 5; i++) {
        document
            .querySelectorAll(`.sequence-cell.player-${i}`)
            .forEach((cell) => {
                cell.classList.remove(`player-${i}`);
                cell.textContent = "";
            });
    }
}

function addPlayerMarker(x, y, playerIdx) {
    const cell = document.querySelector(
        `.sequence-cell[data-x="${x}"][data-y="${y}"]`,
    );
    if (cell) {
        cell.classList.add(`player-${playerIdx}`);
        cell.textContent = (playerIdx + 1).toString();
    }
}

function markCollision(x, y) {
    const cell = document.querySelector(
        `.sequence-cell[data-x="${x}"][data-y="${y}"]`,
    );
    if (cell) {
        cell.style.boxShadow = "0 0 8px 2px red";
        cell.style.border = "2px solid white";
    }

    showFeedback(
        "Kollisjon oppdaget! Spillere krasjet med hverandre.",
        "error",
    );
}

function markWallCollision(x, y, direction) {
    const cell = document.querySelector(
        `.sequence-cell[data-x="${x}"][data-y="${y}"]`,
    );
    if (cell) {
        cell.classList.add("wall-collision");
    }

    // Show feedback about wall collision
    showFeedback(
        `En spiller forsøkte å gå gjennom en vegg (${getDirectionText(
            direction,
        )})`,
        "error",
    );
}

function getPlayerColor(index) {
    const colors = ["#ff4136", "#0074d9", "#2ecc40", "#ffdc00", "#b10dc9"];
    return colors[index % colors.length];
}

function getPlayerRgb(index) {
    const rgbValues = [
        "255, 65, 54",
        "0, 116, 217",
        "46, 204, 64",
        "255, 220, 0",
        "177, 13, 201",
    ];
    return rgbValues[index % rgbValues.length];
}

function showFeedback(message, type) {
    const feedbackElement = document.getElementById("feedbackMessage");
    feedbackElement.textContent = message;
    feedbackElement.className = `message ${type}`;
    feedbackElement.style.display = "block";
}

function updateWaitingCountDisplay(waitingCount) {
    const existingInfo = document.querySelector(".waiting-info");
    if (existingInfo) {
        existingInfo.remove();
    }

    if (waitingCount > 0) {
        const waitingInfo = document.createElement("p");
        waitingInfo.className = "waiting-info";
        waitingInfo.textContent = `${waitingCount} spillere venter i kø.`;
        document.querySelector(".players-list").appendChild(waitingInfo);
    }
}
