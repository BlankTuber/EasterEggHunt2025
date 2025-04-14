const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Set view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Game rooms storage
const gameRooms = new Map();

// Create a single global sequence game
const GLOBAL_SEQUENCE_ID = "global-sequence";
let sequenceGameActive = false;

// Initialize the global sequence game
function initializeGlobalSequenceGame() {
    const maze = generateMaze(40, 40);

    gameRooms.set(GLOBAL_SEQUENCE_ID, {
        type: "sequence",
        players: [],
        requiredPlayers: 5,
        started: false,
        grid: maze.grid,
        playerPositions: maze.spawns,
        targetPositions: maze.targets,
        playerSequences: new Map(),
        readyPlayers: new Set(),
        waitingPlayers: [], // Queue for waiting players
        gameActive: false,
    });

    console.log("Global sequence game initialized");
}

// Initialize the global sequence game at startup
initializeGlobalSequenceGame();

// Routes
app.get("/", (req, res) => {
    res.render("index");
});

// Single player games
app.get("/game/pong", (req, res) => {
    const gameConfig = {
        winScore: 10,
        winMessage: "Gratulerer! Du vant Pong!",
    };
    res.render("pong", { gameConfig });
});

app.get("/game/silhouette", (req, res) => {
    const configType = req.query.config || "gamecharacters";
    let gameConfig;

    try {
        const configPath = path.join(
            __dirname,
            `configs/silhouette/${configType}.json`,
        );
        const configData = fs.readFileSync(configPath, "utf8");
        const images = JSON.parse(configData);
        gameConfig = {
            images,
            requiredPoints: 10,
            winMessage:
                "Gratulerer! Du klarte å identifisere alle silhuettene!",
        };
    } catch (error) {
        return res.render("error", {
            message: "Kunne ikke laste spillkonfigurasjon",
        });
    }

    res.render("silhouette", { gameConfig });
});

app.get("/game/music", (req, res) => {
    const configType = req.query.config || "videogames";
    let gameConfig;

    try {
        const configPath = path.join(
            __dirname,
            `configs/music/${configType}.json`,
        );
        const configData = fs.readFileSync(configPath, "utf8");
        const tracks = JSON.parse(configData);
        gameConfig = {
            tracks,
            requiredPoints: 10,
            winMessage: "Gratulerer! Du klarte å identifisere all musikken!",
        };
    } catch (error) {
        return res.render("error", {
            message: "Kunne ikke laste spillkonfigurasjon",
        });
    }

    res.render("music", { gameConfig });
});

app.get("/game/colorseq", (req, res) => {
    const gameConfig = {
        levels: 7,
        colors: ["red", "blue", "green", "yellow", "purple"],
        winMessage: "Gratulerer! Du fullførte alle nivåene av fargesekvenser!",
    };
    res.render("colorseq", { gameConfig });
});

app.get("/game/wordle", (req, res) => {
    let words = [];
    try {
        const wordsData = fs.readFileSync(
            path.join(__dirname, "configs/wordle-words.txt"),
            "utf8",
        );
        words = wordsData.split(/\r?\n/).filter((word) => word.length === 5);
    } catch (error) {
        console.error("Error loading Wordle words:", error);
        words = ["huset", "kaffe", "spill", "fjell", "skole"];
    }

    const gameConfig = {
        words,
        wordLength: 5,
        attempts: 5,
        requiredWins: 5,
        winMessage: "Gratulerer! Du løste alle ordene!",
    };
    res.render("wordle", { gameConfig });
});

app.get("/game/hangman", (req, res) => {
    const phrases = [
        "Dette er en norsk setning",
        "Velkommen til påskeeggjakten",
        "Programmering er gøy",
        "Samarbeid er nøkkelen til suksess",
        "Norge er et vakkert land",
    ];

    const gameConfig = {
        phrase: phrases[Math.floor(Math.random() * phrases.length)],
        maxWrong: 6,
        winMessage: "Gratulerer! Du løste hangman-utfordringen!",
    };
    res.render("hangman", { gameConfig });
});

// Multiplayer games

// Trivia game
app.get("/game/trivia", (req, res) => {
    const configType = req.query.config || "commonknowledge";
    const requiredPlayers = parseInt(req.query.players || 3, 10);

    let questions;
    try {
        const configPath = path.join(
            __dirname,
            `configs/trivia/${configType}.json`,
        );
        if (!fs.existsSync(configPath)) {
            // Create a default questions set if file doesn't exist
            questions = createDefaultTriviaQuestions();
        } else {
            const configData = fs.readFileSync(configPath, "utf8");
            questions = JSON.parse(configData);
        }
    } catch (error) {
        console.error("Error loading trivia questions:", error);
        questions = createDefaultTriviaQuestions();
    }

    const gameId = uuidv4();
    gameRooms.set(gameId, {
        type: "trivia",
        players: [],
        requiredPlayers,
        questions,
        currentQuestion: 0,
        started: false,
        playerAnswers: new Map(),
    });

    res.render("trivia", {
        gameId,
        requiredPlayers,
        gameConfig: {
            type: configType,
            numQuestions: questions.length,
        },
    });
});

// Sequence game - global instance
app.get("/game/sequence", (req, res) => {
    const sequenceRoom = gameRooms.get(GLOBAL_SEQUENCE_ID);

    // Create stats about current game
    let playerCount = sequenceRoom ? sequenceRoom.players.length : 0;
    let waitingCount = sequenceRoom ? sequenceRoom.waitingPlayers.length : 0;
    let gameInProgress = sequenceRoom ? sequenceRoom.started : false;

    res.render("sequence", {
        gameId: GLOBAL_SEQUENCE_ID,
        requiredPlayers: 5,
        gameConfig: {
            gridSize: 40,
            maxMoves: 100,
            playerCount: playerCount,
            waitingCount: waitingCount,
            gameInProgress: gameInProgress,
        },
    });
});

// Game completion endpoint for single-player games
app.post("/complete-game", (req, res) => {
    const { gameId, gameType, score } = req.body;
    console.log(`Player completed ${gameType} game with score: ${score}`);

    // In a real app, you might want to store this information

    res.status(200).json({ success: true });
});

// Socket.io connection handling
io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    // Join game room
    socket.on("join-game", ({ gameId, playerName }) => {
        const room = gameRooms.get(gameId);
        if (!room) {
            socket.emit("error", { message: "Spill ikke funnet" });
            return;
        }

        // Special handling for global sequence game
        if (gameId === GLOBAL_SEQUENCE_ID) {
            handleSequenceJoin(socket, room, playerName);
            return;
        }

        // Regular game room joining logic
        if (room.started) {
            socket.emit("error", { message: "Spillet har allerede startet" });
            return;
        }

        if (room.players.length >= room.requiredPlayers) {
            socket.emit("error", { message: "Spillet er fullt" });
            return;
        }

        // Add player to the room
        const player = {
            id: socket.id,
            name: playerName,
            score: 0,
        };

        room.players.push(player);
        socket.join(gameId);

        // Notify all players in the room
        io.to(gameId).emit("player-joined", {
            player,
            playerCount: room.players.length,
            requiredPlayers: room.requiredPlayers,
        });

        // Check if enough players to start
        if (room.players.length === room.requiredPlayers) {
            startGame(gameId, room);
        }
    });

    // Handle trivia game answer selection
    socket.on("select-answer", ({ gameId, answerId }) => {
        const room = gameRooms.get(gameId);
        if (!room || room.type !== "trivia" || !room.started) return;

        // Record this player's answer
        room.playerAnswers.set(socket.id, answerId);

        // Notify others that this player has answered
        io.to(gameId).emit("player-answered", { playerId: socket.id });

        // Check if all players have answered
        if (room.playerAnswers.size === room.players.length) {
            checkTriviaAnswer(gameId, room);
        }
    });

    // Handle sequence game moves
    socket.on("submit-sequence", ({ gameId, sequence }) => {
        const room = gameRooms.get(gameId);
        if (!room || room.type !== "sequence" || !room.started) return;

        // Store this player's sequence
        room.playerSequences.set(socket.id, sequence);
        room.readyPlayers.add(socket.id);

        // Notify others that this player is ready
        io.to(gameId).emit("player-ready", {
            playerId: socket.id,
            readyCount: room.readyPlayers.size,
        });

        // Check if all players have submitted their sequences
        if (room.readyPlayers.size === room.players.length) {
            executeSequences(gameId, room);
        }
    });

    // Handle player disconnection
    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);

        // Find any games this player was in
        for (const [gameId, room] of gameRooms.entries()) {
            const playerIndex = room.players.findIndex(
                (p) => p.id === socket.id,
            );
            if (playerIndex !== -1) {
                room.players.splice(playerIndex, 1);
                io.to(gameId).emit("player-left", {
                    playerId: socket.id,
                    playerCount: room.players.length,
                });

                // If the game was already started, reset it
                if (
                    room.started &&
                    room.players.length < room.requiredPlayers
                ) {
                    io.to(gameId).emit("game-reset", {
                        message:
                            "En spiller forlot spillet. Venter på flere spillere...",
                    });
                    room.started = false;

                    // Reset game-specific state
                    if (room.type === "trivia") {
                        room.currentQuestion = 0;
                        room.playerAnswers.clear();
                    } else if (room.type === "sequence") {
                        room.playerSequences.clear();
                        room.readyPlayers.clear();

                        // If this is the global sequence game, move players from waiting list
                        if (gameId === GLOBAL_SEQUENCE_ID) {
                            checkSequenceWaitingList(room);
                        }
                    }
                }

                // If no players left and not the global sequence game, remove the room
                if (
                    room.players.length === 0 &&
                    gameId !== GLOBAL_SEQUENCE_ID
                ) {
                    gameRooms.delete(gameId);
                }

                break; // Player can only be in one game
            }

            // Check if the player was in the waiting list for sequence game
            if (
                gameId === GLOBAL_SEQUENCE_ID &&
                room.waitingPlayers.some((p) => p.id === socket.id)
            ) {
                room.waitingPlayers = room.waitingPlayers.filter(
                    (p) => p.id !== socket.id,
                );
                // No need to notify anyone about waiting players leaving
            }
        }
    });
});

// Special handling for sequence game joining
function handleSequenceJoin(socket, room, playerName) {
    // Create player object
    const player = {
        id: socket.id,
        name: playerName,
        score: 0,
    };

    // If game is not in progress and has space, add directly
    if (!room.started && room.players.length < room.requiredPlayers) {
        room.players.push(player);
        socket.join(GLOBAL_SEQUENCE_ID);

        // Notify all players in the room
        io.to(GLOBAL_SEQUENCE_ID).emit("player-joined", {
            player,
            playerCount: room.players.length,
            requiredPlayers: room.requiredPlayers,
            waitingCount: room.waitingPlayers.length,
        });

        // Check if we now have enough players to start
        if (room.players.length === room.requiredPlayers) {
            startGame(GLOBAL_SEQUENCE_ID, room);
        }
    }
    // Otherwise, add to waiting list
    else {
        room.waitingPlayers.push(player);
        socket.join(GLOBAL_SEQUENCE_ID + "-waiting");

        // Send special "waiting" notification to this player
        socket.emit("waiting-list", {
            position: room.waitingPlayers.length,
            message: `Du er nummer ${room.waitingPlayers.length} i køen. Vennligst vent...`,
        });

        // Notify all players about waiting count
        io.to(GLOBAL_SEQUENCE_ID).emit("waiting-count-update", {
            waitingCount: room.waitingPlayers.length,
        });
    }
}

// Check sequence waiting list and add players if possible
function checkSequenceWaitingList(room) {
    while (
        room.players.length < room.requiredPlayers &&
        room.waitingPlayers.length > 0
    ) {
        // Move a player from waiting list to active players
        const nextPlayer = room.waitingPlayers.shift();
        const playerSocket = io.sockets.sockets.get(nextPlayer.id);

        if (playerSocket) {
            // Add to active players
            room.players.push(nextPlayer);

            // Move from waiting room to active room (technically they're already in the main room)
            // playerSocket.leave(GLOBAL_SEQUENCE_ID + "-waiting");

            // Notify the player they're now active
            playerSocket.emit("joined-from-waiting", {
                message: "Det er nå din tur å spille!",
            });

            // Notify all players
            io.to(GLOBAL_SEQUENCE_ID).emit("player-joined", {
                player: nextPlayer,
                playerCount: room.players.length,
                requiredPlayers: room.requiredPlayers,
                waitingCount: room.waitingPlayers.length,
            });

            // Update waiting players about their position
            room.waitingPlayers.forEach((waitingPlayer, index) => {
                const waitingSocket = io.sockets.sockets.get(waitingPlayer.id);
                if (waitingSocket) {
                    waitingSocket.emit("waiting-list", {
                        position: index + 1,
                        message: `Du er nummer ${
                            index + 1
                        } i køen. Vennligst vent...`,
                    });
                }
            });
        } else {
            // Player disconnected while waiting, just remove them
            console.log("Player disconnected while waiting:", nextPlayer.id);
        }
    }

    // Check if we now have enough players to start a new game
    if (room.players.length === room.requiredPlayers) {
        startGame(GLOBAL_SEQUENCE_ID, room);
    }
}

// Game logic functions

function startGame(gameId, room) {
    room.started = true;

    if (room.type === "trivia") {
        startTriviaRound(gameId, room);
    } else if (room.type === "sequence") {
        startSequenceGame(gameId, room);
    }
}

function startTriviaRound(gameId, room) {
    // Clear previous answers
    room.playerAnswers.clear();

    if (room.currentQuestion >= room.questions.length) {
        // Game completed
        io.to(gameId).emit("game-completed", {
            message: "Gratulerer! Dere fullførte alle spørsmålene!",
        });
        return;
    }

    const question = room.questions[room.currentQuestion];

    // For each player, randomly select 4 options from the 12 possible
    // Ensure that only one player gets the correct answer
    const allOptions = [...question.options];
    const correctOption = allOptions.find((opt) => opt.correct);
    const wrongOptions = allOptions.filter((opt) => !opt.correct);

    // Distribute options to players
    const playerOptions = {};

    // Randomly select one player to get the correct answer
    const luckyPlayerIndex = Math.floor(Math.random() * room.players.length);

    room.players.forEach((player, idx) => {
        const playerOpts = [];

        // If this player gets the correct answer, include it
        if (idx === luckyPlayerIndex) {
            playerOpts.push(correctOption);

            // Add 3 random wrong answers
            const shuffledWrong = shuffleArray([...wrongOptions]);
            for (let i = 0; i < 3 && i < shuffledWrong.length; i++) {
                playerOpts.push(shuffledWrong[i]);
            }
        } else {
            // This player only gets wrong answers
            const shuffledWrong = shuffleArray([...wrongOptions]);
            for (let i = 0; i < 4 && i < shuffledWrong.length; i++) {
                playerOpts.push(shuffledWrong[i]);
            }
        }

        // Shuffle the options
        playerOptions[player.id] = shuffleArray(playerOpts);
    });

    // Send the current question to all players
    io.to(gameId).emit("trivia-question", {
        question: question.text,
        currentQuestion: room.currentQuestion + 1,
        totalQuestions: room.questions.length,
    });

    // Send each player their specific options
    room.players.forEach((player) => {
        const socket = io.sockets.sockets.get(player.id);
        if (socket) {
            socket.emit("trivia-options", {
                options: playerOptions[player.id],
            });
        }
    });
}

function checkTriviaAnswer(gameId, room) {
    const question = room.questions[room.currentQuestion];
    const correctOptionId = question.options.find((opt) => opt.correct).id;

    // Check if any player selected the correct answer
    let correct = false;
    for (const [playerId, answerId] of room.playerAnswers.entries()) {
        if (answerId === correctOptionId) {
            correct = true;
            break;
        }
    }

    if (correct) {
        // Move to next question
        room.currentQuestion++;
        io.to(gameId).emit("answer-result", {
            correct: true,
            message: "Riktig svar! Går videre til neste spørsmål...",
        });

        // Short delay before next question
        setTimeout(() => {
            startTriviaRound(gameId, room);
        }, 3000);
    } else {
        // Wrong answer, restart the current question
        io.to(gameId).emit("answer-result", {
            correct: false,
            message: "Feil svar! Prøv igjen...",
        });

        // Short delay before restarting
        setTimeout(() => {
            startTriviaRound(gameId, room);
        }, 3000);
    }
}

function startSequenceGame(gameId, room) {
    // Set game as active
    room.gameActive = true;

    // Generate new maze
    const maze = generateMaze(40, 40);
    room.grid = maze.grid;
    room.playerPositions = maze.spawns;
    room.targetPositions = maze.targets;

    // Send initial game state to all players
    room.players.forEach((player, index) => {
        const socket = io.sockets.sockets.get(player.id);
        if (socket) {
            socket.emit("sequence-init", {
                grid: room.grid,
                startPosition: room.playerPositions[index],
                targetPosition: room.targetPositions[index],
                playerIndex: index,
            });
        }
    });

    // Reset sequences and ready players
    room.playerSequences.clear();
    room.readyPlayers.clear();
}

function executeSequences(gameId, room) {
    // Simulate the movement of all players simultaneously
    const playerCount = room.players.length;
    const positions = [...room.playerPositions];
    let success = true;
    let collisionAt = null;

    // Get the longest sequence length
    let maxSteps = 0;
    room.playerSequences.forEach((sequence) => {
        maxSteps = Math.max(maxSteps, sequence.length);
    });

    // Create sequences array for each player
    const sequences = [];
    room.players.forEach((player) => {
        const seq = room.playerSequences.get(player.id) || [];
        sequences.push(seq);
    });

    // Simulate step by step
    const movements = [];
    for (let step = 0; step < maxSteps; step++) {
        const stepMovements = [];

        // Calculate new positions
        for (let i = 0; i < playerCount; i++) {
            const action =
                step < sequences[i].length ? sequences[i][step] : "stop";
            const newPos = calculateNewPosition(
                positions[i],
                action,
                room.grid,
            );

            stepMovements.push({
                player: i,
                from: { ...positions[i] },
                to: { ...newPos },
                action,
            });

            positions[i] = newPos;
        }

        // Check for collisions
        for (let i = 0; i < playerCount; i++) {
            // Check for player collisions
            for (let j = i + 1; j < playerCount; j++) {
                if (
                    positions[i].x === positions[j].x &&
                    positions[i].y === positions[j].y
                ) {
                    success = false;
                    collisionAt = { step, players: [i, j] };
                    break;
                }
            }
            if (!success) break;
        }

        movements.push(stepMovements);
        if (!success) break;
    }

    // Check if all players reached their targets
    if (success) {
        for (let i = 0; i < playerCount; i++) {
            if (
                positions[i].x !== room.targetPositions[i].x ||
                positions[i].y !== room.targetPositions[i].y
            ) {
                success = false;
                break;
            }
        }
    }

    // Send the result to all players
    io.to(gameId).emit("sequence-result", {
        success,
        movements,
        collisionAt,
        message: success
            ? "Gratulerer! Alle nådde sine mål!"
            : "En eller flere spillere nådde ikke målet. Prøv igjen!",
    });

    // If successful, prepare for next game
    if (success) {
        // Reset the room for a new game
        setTimeout(() => {
            resetSequenceGame(room);
        }, 5000); // Give players time to celebrate before resetting
    } else {
        // Reset for next attempt
        room.playerSequences.clear();
        room.readyPlayers.clear();
    }
}

function resetSequenceGame(room) {
    // Mark as not started
    room.started = false;
    room.gameActive = false;

    // Clear all game state
    room.playerSequences.clear();
    room.readyPlayers.clear();

    // Move current players to waiting list in reverse order (so they get to play again eventually)
    for (let i = room.players.length - 1; i >= 0; i--) {
        const player = room.players[i];
        room.waitingPlayers.unshift(player);

        // Notify player they're now in the waiting list
        const socket = io.sockets.sockets.get(player.id);
        if (socket) {
            socket.emit("moved-to-waiting", {
                message: "Spillet er fullført. Du er nå i ventelisten.",
            });
        }
    }

    // Clear active players
    room.players = [];

    // Check waiting list for new players
    checkSequenceWaitingList(room);

    // Notify all connected clients about the room reset
    io.to(GLOBAL_SEQUENCE_ID).emit("sequence-room-reset", {
        message: "Et nytt spill starter snart...",
        waitingCount: room.waitingPlayers.length,
    });
}

function calculateNewPosition(pos, action, grid) {
    const newPos = { ...pos };

    switch (action) {
        case "left":
            if (newPos.x > 0 && grid[newPos.y][newPos.x - 1] !== 1) {
                newPos.x--;
            }
            break;
        case "right":
            if (
                newPos.x < grid[0].length - 1 &&
                grid[newPos.y][newPos.x + 1] !== 1
            ) {
                newPos.x++;
            }
            break;
        case "up":
            if (newPos.y > 0 && grid[newPos.y - 1][newPos.x] !== 1) {
                newPos.y--;
            }
            break;
        case "down":
            if (
                newPos.y < grid.length - 1 &&
                grid[newPos.y + 1][newPos.x] !== 1
            ) {
                newPos.y++;
            }
            break;
        case "stop":
        default:
            // Do nothing
            break;
    }

    return newPos;
}

// Maze generation function using a recursive backtracking algorithm
function generateMaze(width, height) {
    // Initialize grid with walls (1 = wall, 0 = path)
    const grid = Array(height)
        .fill()
        .map(() => Array(width).fill(1));

    // Start at a random cell
    const startX = 1;
    const startY = 1;

    // Mark the starting cell as path
    grid[startY][startX] = 0;

    // Define directions: right, down, left, up
    const directions = [
        { dx: 2, dy: 0 },
        { dx: 0, dy: 2 },
        { dx: -2, dy: 0 },
        { dx: 0, dy: -2 },
    ];

    // Recursive function to carve paths
    function carvePath(x, y) {
        // Shuffle directions
        const shuffledDirs = shuffleArray([...directions]);

        // Try each direction
        for (const dir of shuffledDirs) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;

            // Check if the new position is within bounds and still a wall
            if (
                nx > 0 &&
                nx < width - 1 &&
                ny > 0 &&
                ny < height - 1 &&
                grid[ny][nx] === 1
            ) {
                // Carve a path
                grid[ny][nx] = 0;
                // Carve the cell between this one and the next
                grid[y + dir.dy / 2][x + dir.dx / 2] = 0;
                // Continue carving from new position
                carvePath(nx, ny);
            }
        }
    }

    // Start carving paths
    carvePath(startX, startY);

    // Add a few more random paths to create cycles/loops in the maze
    for (let i = 0; i < 40; i++) {
        const x = 2 + Math.floor((Math.random() * (width - 4)) / 2) * 2;
        const y = 2 + Math.floor((Math.random() * (height - 4)) / 2) * 2;
        if (grid[y][x] === 1) {
            grid[y][x] = 0;

            // Open a random neighbor
            const dir = directions[Math.floor(Math.random() * 4)];
            const nx = x + dir.dx / 2;
            const ny = y + dir.dy / 2;

            if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1) {
                grid[ny][nx] = 0;
            }
        }
    }

    // Create some open areas
    const areas = 5;
    for (let a = 0; a < areas; a++) {
        const areaX = 5 + Math.floor(Math.random() * (width - 10));
        const areaY = 5 + Math.floor(Math.random() * (height - 10));
        const areaWidth = 3 + Math.floor(Math.random() * 4);
        const areaHeight = 3 + Math.floor(Math.random() * 4);

        for (let y = areaY; y < Math.min(areaY + areaHeight, height - 1); y++) {
            for (
                let x = areaX;
                x < Math.min(areaX + areaWidth, width - 1);
                x++
            ) {
                grid[y][x] = 0;
            }
        }
    }

    // Generate player spawn points (at least 5 cells apart)
    const spawns = [];
    const targets = [];
    const playerCount = 5;

    for (let i = 0; i < playerCount; i++) {
        let spawnX, spawnY, targetX, targetY;
        let valid = false;

        // Find valid spawn
        while (!valid) {
            spawnX = 1 + Math.floor(Math.random() * (width - 2));
            spawnY = 1 + Math.floor(Math.random() * (height - 2));

            if (grid[spawnY][spawnX] === 0) {
                valid = true;

                // Check distance from other spawns
                for (const spawn of spawns) {
                    const distance = Math.sqrt(
                        Math.pow(spawn.x - spawnX, 2) +
                            Math.pow(spawn.y - spawnY, 2),
                    );
                    if (distance < 5) {
                        valid = false;
                        break;
                    }
                }
            }
        }

        spawns.push({ x: spawnX, y: spawnY });

        // Find valid target (far from spawn and other targets)
        valid = false;
        while (!valid) {
            targetX = 1 + Math.floor(Math.random() * (width - 2));
            targetY = 1 + Math.floor(Math.random() * (height - 2));

            if (grid[targetY][targetX] === 0) {
                // Check distance from spawn
                const spawnDistance = Math.sqrt(
                    Math.pow(spawnX - targetX, 2) +
                        Math.pow(spawnY - targetY, 2),
                );

                if (spawnDistance >= 20) {
                    valid = true;

                    // Check distance from other targets
                    for (const target of targets) {
                        const distance = Math.sqrt(
                            Math.pow(target.x - targetX, 2) +
                                Math.pow(target.y - targetY, 2),
                        );
                        if (distance < 5) {
                            valid = false;
                            break;
                        }
                    }
                }
            }
        }

        targets.push({ x: targetX, y: targetY });
    }

    return { grid, spawns, targets };
}

// Create default trivia questions if no config is found
function createDefaultTriviaQuestions() {
    return [
        {
            text: "Hva er hovedstaden i Norge?",
            options: [
                { id: "a1", text: "Bergen", correct: false },
                { id: "a2", text: "Trondheim", correct: false },
                { id: "a3", text: "Oslo", correct: true },
                { id: "a4", text: "Stavanger", correct: false },
                { id: "a5", text: "Kristiansand", correct: false },
                { id: "a6", text: "Tromsø", correct: false },
                { id: "a7", text: "Ålesund", correct: false },
                { id: "a8", text: "Drammen", correct: false },
                { id: "a9", text: "Bodø", correct: false },
                { id: "a10", text: "Fredrikstad", correct: false },
                { id: "a11", text: "Lillehammer", correct: false },
                { id: "a12", text: "Hamar", correct: false },
            ],
        },
        {
            text: "Hvilket år ble Norge selvstendig fra Sverige?",
            options: [
                { id: "b1", text: "1814", correct: false },
                { id: "b2", text: "1905", correct: true },
                { id: "b3", text: "1945", correct: false },
                { id: "b4", text: "1901", correct: false },
                { id: "b5", text: "1899", correct: false },
                { id: "b6", text: "1921", correct: false },
                { id: "b7", text: "1867", correct: false },
                { id: "b8", text: "1917", correct: false },
                { id: "b9", text: "1809", correct: false },
                { id: "b10", text: "1884", correct: false },
                { id: "b11", text: "1850", correct: false },
                { id: "b12", text: "1910", correct: false },
            ],
        },
        {
            text: "Hvilken norsk forfatter skrev 'Sult'?",
            options: [
                { id: "c1", text: "Henrik Ibsen", correct: false },
                { id: "c2", text: "Sigrid Undset", correct: false },
                { id: "c3", text: "Knut Hamsun", correct: true },
                { id: "c4", text: "Camilla Collett", correct: false },
                { id: "c5", text: "Bjørnstjerne Bjørnson", correct: false },
                { id: "c6", text: "Jo Nesbø", correct: false },
                { id: "c7", text: "Alexander Kielland", correct: false },
                { id: "c8", text: "Amalie Skram", correct: false },
                { id: "c9", text: "Jonas Lie", correct: false },
                { id: "c10", text: "Dag Solstad", correct: false },
                { id: "c11", text: "Olav Duun", correct: false },
                { id: "c12", text: "Jens Bjørneboe", correct: false },
            ],
        },
    ];
}

// Utility function to shuffle array
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
