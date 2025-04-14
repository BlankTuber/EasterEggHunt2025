// Initialize variables
let socket;
let playerName = "";
let gameConfig;
let grid = [];
let startPosition = { x: 0, y: 0 };
let targetPosition = { x: 0, y: 0 };
let playerIndex = 0;
let currentSequence = [];
let cellSize = 20; // Will be dynamically calculated
let zoomLevel = 1;
let panOffset = { x: 0, y: 0 };
let simulationRunning = false;
let allPlayerPositions = [];
let inWaitingList = false;

// Grid values
const CELL_EMPTY = 0;
const CELL_WALL = 1;
const CELL_PLAYER_START = 2;
const CELL_TARGET = 3;

document.addEventListener("DOMContentLoaded", function () {
    // Load game config
    try {
        gameConfig = JSON.parse(
            document.getElementById("gameConfigData").textContent,
        );
    } catch (error) {
        console.error("Error parsing game config:", error);
        gameConfig = { gridSize: 40, maxMoves: 100 };
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

    // Set up zoom controls
    document.getElementById("zoomIn").addEventListener("click", () => {
        if (zoomLevel < 2) {
            zoomLevel += 0.1;
            updateGridTransform();
        }
    });

    document.getElementById("zoomOut").addEventListener("click", () => {
        if (zoomLevel > 0.5) {
            zoomLevel -= 0.1;
            updateGridTransform();
        }
    });

    document.getElementById("resetView").addEventListener("click", () => {
        zoomLevel = 1;
        panOffset = { x: 0, y: 0 };
        updateGridTransform();
        centerViewOnPlayer();
    });

    // Set up sequence controls
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

    // Add drag functionality to grid
    setupGridDragging();

    // Make the grid wrapper respond to window resize
    window.addEventListener("resize", adjustGridSize);

    // Player form is handled by player-entry.ejs partial
    // It will call startGame(playerName) when submitted

    // If game info is available, update the waiting room display
    if (gameConfig.playerCount !== undefined) {
        document.getElementById("playerCount").textContent =
            gameConfig.playerCount;

        // Add waiting count info if available
        if (
            gameConfig.waitingCount !== undefined &&
            gameConfig.waitingCount > 0
        ) {
            const waitingInfo = document.createElement("p");
            waitingInfo.className = "waiting-info";
            waitingInfo.textContent = `${gameConfig.waitingCount} spillere venter i kø.`;
            document.querySelector(".players-list").appendChild(waitingInfo);
        }

        // Add game in progress info if applicable
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

    // Initialize socket connection
    socket = io();

    // Connect to the game room
    socket.emit("join-game", { gameId, playerName });

    // Socket event handlers
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

// Socket event handlers
function handlePlayerJoined(data) {
    const { player, playerCount, requiredPlayers, waitingCount } = data;

    // Update player count
    document.getElementById("playerCount").textContent = playerCount;

    // Add player to the list
    const playersList = document.getElementById("playersList");
    const playerItem = document.createElement("li");
    playerItem.textContent = player.name;
    playerItem.dataset.id = player.id;
    playersList.appendChild(playerItem);

    // Update waiting count if provided
    if (waitingCount !== undefined) {
        updateWaitingCountDisplay(waitingCount);
    }

    // If game is starting, hide waiting room and show game area
    if (playerCount === requiredPlayers) {
        document.getElementById("waitingRoom").style.display = "none";
        document.getElementById("gameArea").style.display = "block";
        adjustGridSize(); // Make sure grid fits properly
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

    // Remove player ready indicator
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

    // We're no longer in the waiting list
    inWaitingList = false;

    // Save game state
    grid = newGrid;
    startPosition = newStartPos;
    targetPosition = newTargetPos;
    playerIndex = newPlayerIndex;

    // Initialize all player positions
    allPlayerPositions = [];

    // Create grid
    createGrid();

    // Calculate appropriate cell size and adjust grid
    adjustGridSize();

    // Center view on player
    centerViewOnPlayer();

    // Reset sequence
    clearMoves();

    // Clear ready players
    document.getElementById("readyPlayers").innerHTML = "";

    // Update game status
    document.getElementById("gameStatus").textContent = "Planlegg din reise";

    // Enable controls
    enableControls(true);

    // Hide waiting room, show game area
    document.getElementById("waitingRoom").style.display = "none";
    document.getElementById("gameArea").style.display = "block";
}

function handlePlayerReady(data) {
    const { playerId, readyCount } = data;

    // Update ready players display
    const readyPlayers = document.getElementById("readyPlayers");

    // Add player to ready list if not already there
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

    // Show count
    const requiredPlayers = parseInt(
        document.getElementById("requiredPlayers").textContent,
    );
    document.getElementById(
        "gameStatus",
    ).textContent = `Spillere klare: ${readyCount}/${requiredPlayers}`;
}

function handleSequenceResult(data) {
    const { success, movements, collisionAt, message } = data;

    // Show result message
    showFeedback(message, success ? "success" : "error");

    // Animate the sequence
    simulationRunning = true;
    document.getElementById("gameStatus").textContent = "Spiller av sekvens...";
    enableControls(false);

    // Start animation
    animateMovements(movements, collisionAt, () => {
        simulationRunning = false;

        if (success) {
            document.getElementById("gameStatus").textContent =
                "Fullført! Venter på neste spill...";
        } else {
            document.getElementById("gameStatus").textContent =
                "Planlegg din reise";
            enableControls(true);
            clearMoves();
        }
    });
}

function handleWaitingList(data) {
    const { position, message } = data;

    // We're in the waiting list
    inWaitingList = true;

    // Hide regular waiting room content
    const playersList = document.querySelector(".players-list");
    const playerForm = document.querySelector(".player-form");

    if (playersList) playersList.style.display = "none";
    if (playerForm) playerForm.style.display = "none";

    // Create waiting message if it doesn't exist
    let waitingMessage = document.getElementById("waitingMessage");
    if (!waitingMessage) {
        waitingMessage = document.createElement("div");
        waitingMessage.id = "waitingMessage";
        waitingMessage.className = "waiting-message";
        document.getElementById("waitingRoom").appendChild(waitingMessage);
    }

    // Update waiting message
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

    // We're no longer in the waiting list
    inWaitingList = false;

    // Remove waiting message if it exists
    const waitingMessage = document.getElementById("waitingMessage");
    if (waitingMessage) {
        waitingMessage.remove();
    }

    // Show notification
    showFeedback(message, "success");

    // The sequence-init event will handle the rest of the game setup
}

function handleMovedToWaiting(data) {
    const { message } = data;

    // We're now in the waiting list
    inWaitingList = true;

    // Hide game area
    document.getElementById("gameArea").style.display = "none";

    // Show waiting room
    document.getElementById("waitingRoom").style.display = "block";

    // Create waiting message
    handleWaitingList({
        position: null, // We don't know our position yet
        message: message,
    });
}

function handleRoomReset(data) {
    const { message, waitingCount } = data;

    // Update waiting count if provided
    if (waitingCount !== undefined) {
        updateWaitingCountDisplay(waitingCount);
    }

    // If we're not in waiting list, show notification
    if (!inWaitingList) {
        showFeedback(message, "info");
    }
}

function handleGameReset(data) {
    // Show waiting room if we're not in waiting list
    if (!inWaitingList) {
        document.getElementById("waitingRoom").style.display = "block";
        document.getElementById("gameArea").style.display = "none";

        // Show reset message
        showFeedback(data.message, "info");
    }
}

function handleError(data) {
    showFeedback(data.message, "error");
}

// Grid and visualization functions
function createGrid() {
    const gridContainer = document.getElementById("sequenceGrid");
    gridContainer.innerHTML = "";

    const gridSize = grid.length;

    // Set grid dimensions
    gridContainer.style.gridTemplateRows = `repeat(${gridSize}, ${cellSize}px)`;
    gridContainer.style.gridTemplateColumns = `repeat(${gridSize}, ${cellSize}px)`;

    // Create cells
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const cell = document.createElement("div");
            cell.className = "sequence-cell";
            cell.dataset.x = x;
            cell.dataset.y = y;

            const cellValue = grid[y][x];

            // Apply appropriate class based on cell value
            if (cellValue === CELL_WALL) {
                // Wall cell
                cell.classList.add("wall");
            }
            // Check if this is the player's start position
            else if (x === startPosition.x && y === startPosition.y) {
                cell.classList.add("player");
                cell.style.backgroundColor = getPlayerColor(playerIndex);
                cell.textContent = (playerIndex + 1).toString();
            }
            // Check if this is the player's target position
            else if (x === targetPosition.x && y === targetPosition.y) {
                cell.classList.add("target");
                cell.style.borderColor = getPlayerColor(playerIndex);
                cell.textContent = (playerIndex + 1).toString();
            }

            gridContainer.appendChild(cell);
        }
    }
}

function updateGridTransform() {
    const gridElement = document.getElementById("sequenceGrid");
    gridElement.style.transform = `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`;
}

function centerViewOnPlayer() {
    const gridWrapper = document.querySelector(".sequence-grid-wrapper");
    const wrapperWidth = gridWrapper.clientWidth;
    const wrapperHeight = gridWrapper.clientHeight;

    // Calculate center position of player
    const playerCenterX = startPosition.x * cellSize + cellSize / 2;
    const playerCenterY = startPosition.y * cellSize + cellSize / 2;

    // Calculate scroll position to center player
    const scrollX = playerCenterX - wrapperWidth / 2;
    const scrollY = playerCenterY - wrapperHeight / 2;

    // Apply scroll
    gridWrapper.scrollLeft = scrollX;
    gridWrapper.scrollTop = scrollY;
}

function getPlayerColor(index) {
    const colors = [
        "#ff4136", // red
        "#0074d9", // blue
        "#2ecc40", // green
        "#ffdc00", // yellow
        "#b10dc9", // purple
    ];
    return colors[index % colors.length];
}

// Setup grid dragging functionality
function setupGridDragging() {
    const gridWrapper = document.querySelector(".sequence-grid-wrapper");
    let isDragging = false;
    let startX, startY, scrollLeft, scrollTop;

    gridWrapper.addEventListener("mousedown", function (e) {
        if (simulationRunning) return; // Don't allow dragging during simulation

        isDragging = true;
        startX = e.pageX - gridWrapper.offsetLeft;
        startY = e.pageY - gridWrapper.offsetTop;
        scrollLeft = gridWrapper.scrollLeft;
        scrollTop = gridWrapper.scrollTop;
        gridWrapper.style.cursor = "grabbing";
    });

    gridWrapper.addEventListener("mouseleave", function () {
        isDragging = false;
        gridWrapper.style.cursor = "grab";
    });

    gridWrapper.addEventListener("mouseup", function () {
        isDragging = false;
        gridWrapper.style.cursor = "grab";
    });

    gridWrapper.addEventListener("mousemove", function (e) {
        if (!isDragging) return;
        e.preventDefault();

        const x = e.pageX - gridWrapper.offsetLeft;
        const y = e.pageY - gridWrapper.offsetTop;
        const moveX = (x - startX) * 1.5; // Adjust sensitivity
        const moveY = (y - startY) * 1.5;

        gridWrapper.scrollLeft = scrollLeft - moveX;
        gridWrapper.scrollTop = scrollTop - moveY;
    });

    // Add touch support
    gridWrapper.addEventListener("touchstart", function (e) {
        if (simulationRunning) return;

        isDragging = true;
        startX = e.touches[0].pageX - gridWrapper.offsetLeft;
        startY = e.touches[0].pageY - gridWrapper.offsetTop;
        scrollLeft = gridWrapper.scrollLeft;
        scrollTop = gridWrapper.scrollTop;
    });

    gridWrapper.addEventListener("touchend", function () {
        isDragging = false;
    });

    gridWrapper.addEventListener("touchmove", function (e) {
        if (!isDragging) return;
        e.preventDefault();

        const x = e.touches[0].pageX - gridWrapper.offsetLeft;
        const y = e.touches[0].pageY - gridWrapper.offsetTop;
        const moveX = (x - startX) * 1.5;
        const moveY = (y - startY) * 1.5;

        gridWrapper.scrollLeft = scrollLeft - moveX;
        gridWrapper.scrollTop = scrollTop - moveY;
    });

    // Set initial cursor
    gridWrapper.style.cursor = "grab";
}

// Calculate optimal cell size based on screen size
function adjustGridSize() {
    const gridWrapper = document.querySelector(".sequence-grid-wrapper");
    if (!gridWrapper) return;

    const gridSize = grid.length;

    // Calculate the smaller of width or height
    const containerWidth = gridWrapper.clientWidth;
    const containerHeight = gridWrapper.clientHeight;
    const smallerDimension = Math.min(containerWidth, containerHeight);

    // Calculate cell size to make grid fit 1:1 in the available space
    cellSize = Math.floor((smallerDimension - 10) / gridSize);

    // Minimum cell size
    cellSize = Math.max(cellSize, 8);

    // Update grid dimensions
    const gridElement = document.getElementById("sequenceGrid");
    if (gridElement) {
        gridElement.style.gridTemplateRows = `repeat(${gridSize}, ${cellSize}px)`;
        gridElement.style.gridTemplateColumns = `repeat(${gridSize}, ${cellSize}px)`;

        // Make sure font size scales with cell size
        document.documentElement.style.setProperty(
            "--cell-font-size",
            `${Math.max(8, cellSize / 2)}px`,
        );
    }

    // Make wrapper square (1:1 aspect ratio)
    gridWrapper.style.height = `${smallerDimension}px`;
    gridWrapper.style.width = `${smallerDimension}px`;

    // Center the wrapper
    gridWrapper.style.margin = "0 auto";
}

// Sequence management
function addMove(direction) {
    if (currentSequence.length >= gameConfig.maxMoves) {
        showFeedback(
            `Du kan ikke legge til flere bevegelser (maks ${gameConfig.maxMoves})`,
            "error",
        );
        return;
    }

    // Add to sequence
    currentSequence.push(direction);

    // Update move list
    updateMoveList();

    // Show preview of path
    previewPath();
}

function removeMove(index) {
    if (index >= 0 && index < currentSequence.length) {
        // Remove the move at the given index
        currentSequence.splice(index, 1);

        // Update move list
        updateMoveList();

        // Update path preview
        previewPath();
    }
}

function clearMoves() {
    currentSequence = [];
    updateMoveList();

    // Clear path preview
    removePathPreview();
}

function updateMoveList() {
    const moveList = document.getElementById("moveList");
    moveList.innerHTML = "";

    if (currentSequence.length === 0) {
        moveList.innerHTML = "<em>Ingen bevegelser lagt til ennå</em>";
        return;
    }

    // Add each move
    currentSequence.forEach((move, index) => {
        const moveItem = document.createElement("div");
        moveItem.className = "move-item";

        // Add move number and text
        const moveText = document.createElement("span");
        moveText.className = "move-text";
        moveText.textContent = `${index + 1}: ${getDirectionText(move)}`;
        moveItem.appendChild(moveText);

        // Add remove button
        const removeBtn = document.createElement("button");
        removeBtn.className = "remove-move-btn";
        removeBtn.innerHTML = "×";
        removeBtn.title = "Fjern denne bevegelsen";
        removeBtn.addEventListener("click", (e) => {
            e.stopPropagation(); // Prevent bubbling
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
    // Remove existing preview
    removePathPreview();

    // Calculate path based on current sequence
    const path = calculatePath(startPosition, currentSequence);

    // Mark cells in the path
    path.forEach((pos, index) => {
        // Skip the start position (index 0)
        if (index === 0) return;

        const cell = document.querySelector(
            `.sequence-cell[data-x="${pos.x}"][data-y="${pos.y}"]`,
        );
        if (cell) {
            // Add path marker class
            cell.classList.add("path");

            // Store step number as data attribute
            cell.dataset.pathStep = index.toString();

            // Set player color as CSS variable
            cell.style.setProperty(
                "--player-color",
                getPlayerColor(playerIndex),
            );

            // Mark final position with a different style
            if (index === path.length - 1) {
                cell.classList.add("path-end");
            }
        }
    });

    // Check if path ends at target
    const finalPos = path[path.length - 1];
    if (finalPos.x === targetPosition.x && finalPos.y === targetPosition.y) {
        showFeedback("Ruten når målet!", "success");
    } else {
        // Show warning if path doesn't reach target
        showFeedback("Advarselse: Ruten når ikke målet", "info");
    }
}

function removePathPreview() {
    document.querySelectorAll(".sequence-cell.path").forEach((cell) => {
        cell.classList.remove("path", "path-end");
        delete cell.dataset.pathStep;
    });

    // Hide feedback
    document.getElementById("feedbackMessage").style.display = "none";
}

function calculatePath(startPos, sequence) {
    const path = [{ ...startPos }];
    let currentPos = { ...startPos };

    // Apply each move in the sequence
    sequence.forEach((move) => {
        const newPos = getNewPosition(currentPos, move);
        currentPos = newPos;
        path.push({ ...currentPos });
    });

    return path;
}

function getNewPosition(pos, direction) {
    const newPos = { ...pos };

    // Check if position has a wall
    const isWall = (x, y) => {
        if (x < 0 || y < 0 || x >= grid[0].length || y >= grid.length) {
            return true; // Out of bounds counts as wall
        }

        // Check if this position has a wall cell
        return grid[y][x] === CELL_WALL;
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
        // Stop does nothing
    }

    return newPos;
}

function submitSequence() {
    if (currentSequence.length === 0) {
        showFeedback("Du må legge til minst én bevegelse!", "error");
        return;
    }

    // Disable controls
    enableControls(false);

    // Send sequence to server
    socket.emit("submit-sequence", { gameId, sequence: currentSequence });

    // Update status
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

// Animation functions
function animateMovements(movements, collisionAt, onComplete) {
    // Remove any path preview
    removePathPreview();

    // First, show starting positions of all players
    const startingPositions = {};
    movements[0].forEach((move) => {
        startingPositions[move.player] = move.from;
    });

    // Clear existing player position markers
    clearPlayerPositionMarkers();

    // Show initial player positions
    Object.entries(startingPositions).forEach(([player, pos]) => {
        const playerIndex = parseInt(player);
        addPlayerPositionMarker(pos.x, pos.y, playerIndex);
    });

    // Create animation frames
    let step = 0;
    const maxSteps = collisionAt ? collisionAt.step + 1 : movements.length;

    const animate = () => {
        if (step >= maxSteps) {
            onComplete();
            return;
        }

        // Clear previous positions
        clearPlayerPositionMarkers();

        // Update positions for this step
        movements[step].forEach((move) => {
            const playerIdx = move.player;

            // Add player marker at current position
            addPlayerPositionMarker(move.to.x, move.to.y, playerIdx);

            // If this is a collision step, mark it
            if (
                collisionAt &&
                step === collisionAt.step &&
                collisionAt.players.includes(playerIdx)
            ) {
                markCollision(move.to.x, move.to.y);
            }
        });

        // Increment step
        step++;

        // Continue animation
        setTimeout(animate, 500);
    };

    // Start animation
    setTimeout(animate, 1000); // Small delay before starting
}

function clearPlayerPositionMarkers() {
    document.querySelectorAll(".player-position-marker").forEach((marker) => {
        marker.remove();
    });
}

function addPlayerPositionMarker(x, y, playerIndex) {
    const cell = document.querySelector(
        `.sequence-cell[data-x="${x}"][data-y="${y}"]`,
    );
    if (cell) {
        const marker = document.createElement("div");
        marker.className = "player-position-marker";
        marker.style.backgroundColor = getPlayerColor(playerIndex);
        marker.textContent = (playerIndex + 1).toString();

        // Add to cell
        cell.appendChild(marker);
    }
}

function markCollision(x, y) {
    const cell = document.querySelector(
        `.sequence-cell[data-x="${x}"][data-y="${y}"]`,
    );
    if (cell) {
        const markers = cell.querySelectorAll(".player-position-marker");
        markers.forEach((marker) => {
            marker.classList.add("collision");
        });
    }

    // Show collision message
    showFeedback(
        "Kollisjon oppdaget! Spillere krasjet med hverandre.",
        "error",
    );
}

// Helper functions
function showFeedback(message, type) {
    const feedbackElement = document.getElementById("feedbackMessage");
    feedbackElement.textContent = message;
    feedbackElement.className = `message ${type}`;
    feedbackElement.style.display = "block";
}

function updateWaitingCountDisplay(waitingCount) {
    // Remove existing waiting info
    const existingInfo = document.querySelector(".waiting-info");
    if (existingInfo) {
        existingInfo.remove();
    }

    // Add new waiting info if there are waiting players
    if (waitingCount > 0) {
        const waitingInfo = document.createElement("p");
        waitingInfo.className = "waiting-info";
        waitingInfo.textContent = `${waitingCount} spillere venter i kø.`;
        document.querySelector(".players-list").appendChild(waitingInfo);
    }
}
