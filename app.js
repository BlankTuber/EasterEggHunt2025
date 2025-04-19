const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const gameRooms = new Map();

// Discord webhook URL
const DISCORD_WEBHOOK_URL =
    "https://discord.com/api/webhooks/1363163978766876984/E4g3_tDZXpevM7W6WsBm-fksv7ObaPtyiGt9Zz38raztOH98ouVkL-LX7lSuFqZfrHbo";

// Global game IDs
const GLOBAL_SEQUENCE_ID = "global-sequence";
const GLOBAL_TRIVIA_COMMON_ID = "global-trivia-common";
const GLOBAL_TRIVIA_TECH_ID = "global-trivia-tech";
const GLOBAL_TRIVIA_VIDEOGAMES_ID = "global-trivia-videogames";

let sequenceGameActive = false;

// Initialize global sequence game
function initializeGlobalSequenceGame() {
    const maze = generateMaze(30, 30);

    gameRooms.set(GLOBAL_SEQUENCE_ID, {
        id: GLOBAL_SEQUENCE_ID,
        type: "sequence",
        players: [],
        requiredPlayers: 5,
        started: false,
        grid: maze.grid,
        playerPositions: maze.spawns,
        targetPositions: maze.targets,
        playerSequences: new Map(),
        readyPlayers: new Set(),
        waitingPlayers: [],
        gameActive: false,
    });

    console.log("Global sequence game initialized");
}

// Initialize global trivia games
function initializeGlobalTriviaGames() {
    // Common knowledge trivia (3 players)
    initializeGlobalTriviaGame(GLOBAL_TRIVIA_COMMON_ID, "commonknowledge", 3);

    // Tech trivia (2 players)
    initializeGlobalTriviaGame(GLOBAL_TRIVIA_TECH_ID, "tech", 2);

    // Videogames trivia (2 players)
    initializeGlobalTriviaGame(GLOBAL_TRIVIA_VIDEOGAMES_ID, "videogames", 2);

    console.log("Global trivia games initialized");
}

// Initialize a global trivia game
function initializeGlobalTriviaGame(gameId, configType, requiredPlayers) {
    let questions;
    try {
        const configPath = path.join(
            __dirname,
            `configs/trivia/${configType}.json`,
        );
        if (!fs.existsSync(configPath)) {
            questions = createDefaultTriviaQuestions();
        } else {
            const configData = fs.readFileSync(configPath, "utf8");
            questions = JSON.parse(configData);
        }
    } catch (error) {
        console.error(
            `Error loading trivia questions for ${configType}:`,
            error,
        );
        questions = createDefaultTriviaQuestions();
    }

    gameRooms.set(gameId, {
        id: gameId,
        type: "trivia",
        players: [],
        requiredPlayers,
        questions,
        currentQuestion: 0,
        started: false,
        playerAnswers: new Map(),
        waitingPlayers: [],
        gameActive: false,
        configType,
        consecutiveCorrect: 0, // Add streak counter
        requiredStreak: 7, // Number of consecutive correct answers required to win
    });
}

// Initialize all global games at server startup
initializeGlobalSequenceGame();
initializeGlobalTriviaGames();

app.get("/qr-complete/:token", (req, res) => {
    const token = req.params.token;
    const activityName = req.query.activity || "Unknown Activity";
    const playerName = req.query.player || "";

    // Validate token (ensure it's at least 8 characters)
    if (!token || token.length < 8) {
        return res.status(400).json({
            success: false,
            message: "Invalid token",
        });
    }

    console.log(
        `QR code completion: ${activityName} by ${playerName || 'Anonymous'} with token ${token}`
    );

    // Send notification to Discord with improved details
    sendDiscordNotification({
        gameType: "qr_completion",
        activity: activityName,
        score: 1,
        playerName: playerName || "Anonymous",
        token: token,
        timestamp: new Date().toISOString(),
    });

    // Return a success page
    res.render("qr-success", {
        activity: activityName,
        player: playerName || "Anonymous",
        timestamp: new Date().toLocaleString(),
    });
});

app.get("/admin/qr-generator", (req, res) => {
    res.render("qr-generator");
});

app.post("/admin/generate-qr", (req, res) => {
    const activity = req.body.activity || "Unknown Activity";
    const playerParamName = req.body.playerParamName || "player";

    // Generate a random token
    const crypto = require("crypto");
    const token = crypto.randomBytes(16).toString("hex");

    // Create URL
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const encodedActivity = encodeURIComponent(activity);
    const qrUrl = `${baseUrl}/qr-complete/${token}?activity=${encodedActivity}`;

    res.json({
        success: true,
        token: token,
        activity: activity,
        playerParamName: playerParamName,
        url: qrUrl,
        urlWithPlayerExample: `${qrUrl}&${playerParamName}=ExampleName`,
    });
});

app.get("/game/pong", (req, res) => {
    const gameConfig = {
        winScore: 10,
        winMessage:
            'Gratulerer! Du vant Pong! Fant ikke ut noen god måte å gi deg denne på: "og tanker får flyte", prøv å huske dette ;)',
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
            configType,
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
            configType,
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
    let phrases = [];
    try {
        // Try to load phrases from the config file
        const phrasesData = fs.readFileSync(
            path.join(__dirname, "configs/hangman-phrases.json"),
            "utf8",
        );
        phrases = JSON.parse(phrasesData);
    } catch (error) {
        console.error("Error loading hangman phrases:", error);
        // Fallback phrases if file can't be loaded
        phrases = [
            "Vann og rør trenger vedlikehold jevnlig",
            "Rørleggeren fikser slanger og rør i huset ditt",
            "Vi må sjekke ventiler og rør i kjelleren snart",
            "Kobber og rør brukes til vannforsyning i bygninger",
            "Han jobber med stål og rør på den nye fabrikken",
        ];
    }

    // Select a random phrase from the list
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];

    const gameConfig = {
        phrase: phrase,
        maxWrong: 6,
        winMessage:
            'Gratulerer! Du løste hangman-utfordringen! Husk "og rør" for senere ;)',
    };
    res.render("hangman", { gameConfig });
});

app.get("/game/trivia", (req, res) => {
    const triviaType = req.query.type || "common";

    // Select the appropriate global trivia game based on the type parameter
    let gameId;
    let configType;
    let requiredPlayers;

    switch (triviaType) {
        case "tech":
            gameId = GLOBAL_TRIVIA_TECH_ID;
            configType = "tech";
            requiredPlayers = 2;
            break;
        case "videogames":
            gameId = GLOBAL_TRIVIA_VIDEOGAMES_ID;
            configType = "videogames";
            requiredPlayers = 2;
            break;
        case "common":
        default:
            gameId = GLOBAL_TRIVIA_COMMON_ID;
            configType = "commonknowledge";
            requiredPlayers = 3;
    }

    const room = gameRooms.get(gameId);

    if (!room) {
        return res.render("error", {
            message: "Trivia spill ikke funnet",
        });
    }

    let playerCount = room.players.length;
    let waitingCount = room.waitingPlayers ? room.waitingPlayers.length : 0;
    let gameInProgress = room.started;

    res.render("trivia", {
        gameId,
        requiredPlayers,
        gameConfig: {
            type: configType,
            triviaType: triviaType,
            numQuestions: room.questions.length,
            playerCount: playerCount,
            waitingCount: waitingCount,
            gameInProgress: gameInProgress,
        },
    });
});

app.get("/game/sequence", (req, res) => {
    const sequenceRoom = gameRooms.get(GLOBAL_SEQUENCE_ID);

    let playerCount = sequenceRoom ? sequenceRoom.players.length : 0;
    let waitingCount = sequenceRoom ? sequenceRoom.waitingPlayers.length : 0;
    let gameInProgress = sequenceRoom ? sequenceRoom.started : false;

    res.render("sequence", {
        gameId: GLOBAL_SEQUENCE_ID,
        requiredPlayers: 5,
        gameConfig: {
            gridSize: 30,
            maxMoves: 100,
            playerCount: playerCount,
            waitingCount: waitingCount,
            gameInProgress: gameInProgress,
        },
    });
});

async function sendDiscordNotification(data) {
    try {
        if (DISCORD_WEBHOOK_URL === "your_discord_webhook_here") {
            console.log(
                "Discord webhook not configured. Skipping notification."
            );
            console.log("Completion data:", data);
            return;
        }

        const payload = {
            content: `**Game Completion!** (<@382546326786801675>)`,
            embeds: [
                {
                    title: "Game Completed",
                    color: 5814783,
                    fields: [
                        {
                            name: "Game Type",
                            value: data.gameType,
                            inline: true,
                        },
                        {
                            name: "Score",
                            value: data.score.toString(),
                            inline: true,
                        },
                    ],
                    timestamp: new Date().toISOString(),
                },
            ],
        };

        // Add activity info for QR completions
        if (data.gameType === "qr_completion" && data.activity) {
            payload.embeds[0].fields.push({
                name: "Activity",
                value: data.activity,
                inline: true,
            });
        }

        // Add configuration info if available
        if (data.configType) {
            payload.embeds[0].fields.push({
                name: "Config Type",
                value: data.configType,
                inline: true,
            });
        }

        // Add specific game details
        if (data.triviaType) {
            payload.embeds[0].fields.push({
                name: "Trivia Type",
                value: data.triviaType,
                inline: true,
            });
        }

        // Add player name if available
        if (data.playerName) {
            payload.embeds[0].fields.push({
                name: "Player",
                value: data.playerName,
                inline: true,
            });
        }

        // Add token for QR completions
        if (data.gameType === "qr_completion" && data.token) {
            payload.embeds[0].fields.push({
                name: "Token",
                value: data.token,
                inline: true,
            });
        }

        // Use axios instead of fetch
        const response = await axios.post(DISCORD_WEBHOOK_URL, payload);

        if (response.status !== 200) {
            console.error("Error sending Discord notification:", response.data);
        }
    } catch (error) {
        console.error("Failed to send Discord notification:", error);
    }
}

app.post("/complete-game", (req, res) => {
    const completionData = req.body;
    console.log(
        `Player completed ${completionData.gameType} game with score: ${completionData.score}`,
    );

    // Send notification to Discord
    sendDiscordNotification(completionData);

    res.status(200).json({ success: true });
});

io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    socket.on("join-game", ({ gameId, playerName }) => {
        const room = gameRooms.get(gameId);
        if (!room) {
            socket.emit("error", { message: "Spill ikke funnet" });
            return;
        }

        if (gameId === GLOBAL_SEQUENCE_ID) {
            handleSequenceJoin(socket, room, playerName);
            return;
        } else if (
            gameId === GLOBAL_TRIVIA_COMMON_ID ||
            gameId === GLOBAL_TRIVIA_TECH_ID ||
            gameId === GLOBAL_TRIVIA_VIDEOGAMES_ID
        ) {
            handleTriviaJoin(socket, room, playerName, gameId);
            return;
        }

        if (room.started) {
            socket.emit("error", { message: "Spillet har allerede startet" });
            return;
        }

        if (room.players.length >= room.requiredPlayers) {
            socket.emit("error", { message: "Spillet er fullt" });
            return;
        }

        const player = {
            id: socket.id,
            name: playerName,
            score: 0,
        };

        room.players.push(player);
        socket.join(gameId);

        io.to(gameId).emit("player-joined", {
            player,
            playerCount: room.players.length,
            requiredPlayers: room.requiredPlayers,
        });

        if (room.players.length === room.requiredPlayers) {
            startGame(gameId, room);
        }
    });

    socket.on("select-answer", ({ gameId, answerId }) => {
        const room = gameRooms.get(gameId);
        if (!room || room.type !== "trivia" || !room.started) return;

        // If this is the first answer, process it
        if (room.playerAnswers.size === 0) {
            room.playerAnswers.set(socket.id, answerId);

            // Notify everyone that this player has answered
            io.to(gameId).emit("player-answered", { playerId: socket.id });

            // Immediately check the answer
            checkTriviaAnswer(gameId, room);
        }
    });

    socket.on("submit-sequence", ({ gameId, sequence }) => {
        const room = gameRooms.get(gameId);
        if (!room || room.type !== "sequence" || !room.started) return;

        room.playerSequences.set(socket.id, sequence);
        room.readyPlayers.add(socket.id);

        io.to(gameId).emit("player-ready", {
            playerId: socket.id,
            readyCount: room.readyPlayers.size,
        });

        if (room.readyPlayers.size === room.players.length) {
            executeSequences(gameId, room);
        }
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);

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

                if (
                    room.started &&
                    room.players.length < room.requiredPlayers
                ) {
                    io.to(gameId).emit("game-reset", {
                        message:
                            "En spiller forlot spillet. Venter på flere spillere...",
                    });
                    room.started = false;

                    if (room.type === "trivia") {
                        room.currentQuestion = 0;
                        room.playerAnswers.clear();

                        // Check waiting list for global trivia games
                        if (
                            gameId === GLOBAL_TRIVIA_COMMON_ID ||
                            gameId === GLOBAL_TRIVIA_TECH_ID ||
                            gameId === GLOBAL_TRIVIA_VIDEOGAMES_ID
                        ) {
                            checkTriviaWaitingList(room);
                        }
                    } else if (room.type === "sequence") {
                        room.playerSequences.clear();
                        room.readyPlayers.clear();

                        if (gameId === GLOBAL_SEQUENCE_ID) {
                            checkSequenceWaitingList(room);
                        }
                    }
                }

                if (
                    room.players.length === 0 &&
                    gameId !== GLOBAL_SEQUENCE_ID &&
                    gameId !== GLOBAL_TRIVIA_COMMON_ID &&
                    gameId !== GLOBAL_TRIVIA_TECH_ID &&
                    gameId !== GLOBAL_TRIVIA_VIDEOGAMES_ID
                ) {
                    gameRooms.delete(gameId);
                }

                break;
            }

            // Check waiting lists for global games
            if (
                (gameId === GLOBAL_SEQUENCE_ID ||
                    gameId === GLOBAL_TRIVIA_COMMON_ID ||
                    gameId === GLOBAL_TRIVIA_TECH_ID ||
                    gameId === GLOBAL_TRIVIA_VIDEOGAMES_ID) &&
                room.waitingPlayers &&
                room.waitingPlayers.some((p) => p.id === socket.id)
            ) {
                room.waitingPlayers = room.waitingPlayers.filter(
                    (p) => p.id !== socket.id,
                );

                // Update waiting count for remaining players
                io.to(gameId).emit("waiting-count-update", {
                    waitingCount: room.waitingPlayers.length,
                });
            }
        }
    });
});

function handleTriviaJoin(socket, room, playerName, gameId) {
    const player = {
        id: socket.id,
        name: playerName,
        score: 0,
    };

    // Initialize waiting players array if it doesn't exist
    if (!room.waitingPlayers) {
        room.waitingPlayers = [];
    }

    if (!room.started && room.players.length < room.requiredPlayers) {
        room.players.push(player);
        socket.join(gameId);

        io.to(gameId).emit("player-joined", {
            player,
            playerCount: room.players.length,
            requiredPlayers: room.requiredPlayers,
            waitingCount: room.waitingPlayers.length,
        });

        if (room.players.length === room.requiredPlayers) {
            startGame(gameId, room);
        }
    } else {
        room.waitingPlayers.push(player);
        socket.join(gameId + "-waiting");

        socket.emit("waiting-list", {
            position: room.waitingPlayers.length,
            message: `Du er nummer ${room.waitingPlayers.length} i køen. Vennligst vent...`,
        });

        io.to(gameId).emit("waiting-count-update", {
            waitingCount: room.waitingPlayers.length,
        });
    }
}

function handleSequenceJoin(socket, room, playerName) {
    const player = {
        id: socket.id,
        name: playerName,
        score: 0,
    };

    if (!room.started && room.players.length < room.requiredPlayers) {
        room.players.push(player);
        socket.join(GLOBAL_SEQUENCE_ID);

        io.to(GLOBAL_SEQUENCE_ID).emit("player-joined", {
            player,
            playerCount: room.players.length,
            requiredPlayers: room.requiredPlayers,
            waitingCount: room.waitingPlayers.length,
        });

        if (room.players.length === room.requiredPlayers) {
            startGame(GLOBAL_SEQUENCE_ID, room);
        }
    } else {
        room.waitingPlayers.push(player);
        socket.join(GLOBAL_SEQUENCE_ID + "-waiting");

        socket.emit("waiting-list", {
            position: room.waitingPlayers.length,
            message: `Du er nummer ${room.waitingPlayers.length} i køen. Vennligst vent...`,
        });

        io.to(GLOBAL_SEQUENCE_ID).emit("waiting-count-update", {
            waitingCount: room.waitingPlayers.length,
        });
    }
}

function checkTriviaWaitingList(room) {
    // Safety check to prevent infinite loops
    let processedCount = 0;
    const maxToProcess = room.waitingPlayers.length;

    while (
        room.players.length < room.requiredPlayers &&
        room.waitingPlayers.length > 0 &&
        processedCount < maxToProcess
    ) {
        processedCount++;
        const nextPlayer = room.waitingPlayers.shift();
        const playerSocket = io.sockets.sockets.get(nextPlayer.id);

        if (playerSocket) {
            room.players.push(nextPlayer);

            playerSocket.emit("joined-from-waiting", {
                message: "Det er nå din tur å spille!",
            });

            io.to(room.id).emit("player-joined", {
                player: nextPlayer,
                playerCount: room.players.length,
                requiredPlayers: room.requiredPlayers,
                waitingCount: room.waitingPlayers.length,
            });

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
            console.log("Player disconnected while waiting:", nextPlayer.id);
        }
    }

    if (room.players.length === room.requiredPlayers) {
        startGame(room.id, room);
    }
}

function checkSequenceWaitingList(room) {
    // Safety check to prevent infinite loops
    let processedCount = 0;
    const maxToProcess = room.waitingPlayers.length;

    while (
        room.players.length < room.requiredPlayers &&
        room.waitingPlayers.length > 0 &&
        processedCount < maxToProcess
    ) {
        processedCount++;
        const nextPlayer = room.waitingPlayers.shift();
        const playerSocket = io.sockets.sockets.get(nextPlayer.id);

        if (playerSocket) {
            room.players.push(nextPlayer);

            playerSocket.emit("joined-from-waiting", {
                message: "Det er nå din tur å spille!",
            });

            io.to(GLOBAL_SEQUENCE_ID).emit("player-joined", {
                player: nextPlayer,
                playerCount: room.players.length,
                requiredPlayers: room.requiredPlayers,
                waitingCount: room.waitingPlayers.length,
            });

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
            console.log("Player disconnected while waiting:", nextPlayer.id);
        }
    }

    if (room.players.length === room.requiredPlayers) {
        startGame(GLOBAL_SEQUENCE_ID, room);
    }
}

function startGame(gameId, room) {
    room.started = true;

    if (room.type === "trivia") {
        startTriviaRound(gameId, room);
    } else if (room.type === "sequence") {
        startSequenceGame(gameId, room);
    }
}

function startTriviaRound(gameId, room) {
    room.playerAnswers.clear();

    // Wrapped condition: continue indefinitely until 7 consecutive correct answers
    if (room.consecutiveCorrect >= room.requiredStreak) {
        io.to(gameId).emit("game-completed", {
            message: `Gratulerer! Dere fullførte ${room.requiredStreak} spørsmål på rad!`,
        });

        // Delay the reset to give players time to see the completion message
        setTimeout(() => {
            resetTriviaGame(gameId, room);
        }, 8000);
        return;
    }

    const question = room.questions[room.currentQuestion];

    const allOptions = [...question.options];
    const correctOption = allOptions.find((opt) => opt.correct);
    const wrongOptions = allOptions.filter((opt) => !opt.correct);

    const shuffledWrongOptions = shuffleArray([...wrongOptions]);

    const playerOptions = {};

    // Create a shuffled array of player indices to ensure random distribution
    const playerIndices = room.players.map((_, idx) => idx);
    const shuffledPlayerIndices = shuffleArray([...playerIndices]);
    const luckyPlayerIndex = shuffledPlayerIndices[0];

    let nextWrongOptionIndex = 0;

    room.players.forEach((player, idx) => {
        const playerOpts = [];

        if (idx === luckyPlayerIndex) {
            // This player gets the correct answer
            playerOpts.push(correctOption);

            for (let i = 0; i < 3; i++) {
                if (nextWrongOptionIndex < shuffledWrongOptions.length) {
                    playerOpts.push(
                        shuffledWrongOptions[nextWrongOptionIndex++],
                    );
                } else {
                    nextWrongOptionIndex = 0;
                    playerOpts.push(
                        shuffledWrongOptions[nextWrongOptionIndex++],
                    );
                }
            }
        } else {
            // This player only gets wrong answers
            for (let i = 0; i < 4; i++) {
                if (nextWrongOptionIndex < shuffledWrongOptions.length) {
                    playerOpts.push(
                        shuffledWrongOptions[nextWrongOptionIndex++],
                    );
                } else {
                    nextWrongOptionIndex = 0;
                    playerOpts.push(
                        shuffledWrongOptions[nextWrongOptionIndex++],
                    );
                }
            }
        }

        playerOptions[player.id] = shuffleArray(playerOpts);
    });

    io.to(gameId).emit("trivia-question", {
        question: question.text,
        currentQuestion: room.currentQuestion + 1,
        totalQuestions: room.questions.length,
        streak: room.consecutiveCorrect, // Send current streak to clients
        requiredStreak: room.requiredStreak, // Send required streak to clients
    });

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

    // Get the first (and only) answer that was submitted
    const [playerId, answerId] = Array.from(room.playerAnswers.entries())[0];
    const correct = answerId === correctOptionId;

    if (correct) {
        // Increment streak counter
        room.consecutiveCorrect++;
        room.currentQuestion++;

        // Check if we've reached the required streak
        if (room.consecutiveCorrect >= room.requiredStreak) {
            io.to(gameId).emit("answer-result", {
                correct: true,
                message: `Riktig svar! Dere har ${room.requiredStreak} riktige på rad og har vunnet!`,
                streak: room.consecutiveCorrect,
            });

            // Game completed
            setTimeout(() => {
                io.to(gameId).emit("game-completed", {
                    message: `Gratulerer! Dere har svart riktig på ${room.requiredStreak} spørsmål på rad!`,
                });

                // Delay the reset to give players time to see the completion message
                setTimeout(() => {
                    resetTriviaGame(gameId, room);
                }, 8000);
            }, 3000);

            return;
        }

        io.to(gameId).emit("answer-result", {
            correct: true,
            message: `Riktig svar! Går videre til neste spørsmål... (${room.consecutiveCorrect} riktige på rad)`,
            streak: room.consecutiveCorrect,
        });
    } else {
        // Reset streak counter on wrong answer
        room.consecutiveCorrect = 0;
        room.currentQuestion++;

        io.to(gameId).emit("answer-result", {
            correct: false,
            message:
                "Feil svar! Streaken din er tilbakestilt. Prøv igjen med et nytt spørsmål...",
            streak: 0,
        });
    }

    // If we've gone through all questions, wrap back to the beginning
    if (room.currentQuestion >= room.questions.length) {
        room.currentQuestion = 0;
    }

    // Go to next question after a delay
    setTimeout(() => {
        startTriviaRound(gameId, room);
    }, 3000);
}

function resetTriviaGame(gameId, room) {
    room.started = false;
    room.gameActive = false;
    room.currentQuestion = 0;
    room.playerAnswers.clear();
    room.consecutiveCorrect = 0; // Reset streak counter

    // Move current players to waiting list
    for (let i = room.players.length - 1; i >= 0; i--) {
        const player = room.players[i];
        room.waitingPlayers.unshift(player);

        const socket = io.sockets.sockets.get(player.id);
        if (socket) {
            socket.emit("moved-to-waiting", {
                message: "Spillet er fullført. Du er nå i ventelisten.",
            });
        }
    }

    room.players = [];

    checkTriviaWaitingList(room);

    io.to(gameId).emit("trivia-room-reset", {
        message: "Et nytt spill starter snart...",
        waitingCount: room.waitingPlayers.length,
    });
}

function startSequenceGame(gameId, room) {
    room.gameActive = true;

    const maze = generateMaze(30, 30);
    room.grid = maze.grid;
    room.playerPositions = maze.spawns;
    room.targetPositions = maze.targets;

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

    room.playerSequences.clear();
    room.readyPlayers.clear();
}

function executeSequences(gameId, room) {
    const playerCount = room.players.length;
    const positions = [...room.playerPositions];
    let success = true;
    let collisionAt = null;
    const wallCollisions = {};

    let maxSteps = 0;
    room.playerSequences.forEach((sequence) => {
        maxSteps = Math.max(maxSteps, sequence.length);
    });

    const sequences = [];
    room.players.forEach((player) => {
        const seq = room.playerSequences.get(player.id) || [];
        sequences.push(seq);
    });

    const movements = [];
    for (let step = 0; step < maxSteps; step++) {
        const stepMovements = [];
        const stepWallCollisions = [];

        for (let i = 0; i < playerCount; i++) {
            const action =
                step < sequences[i].length ? sequences[i][step] : "stop";

            // Store initial position before movement
            const currentPos = { ...positions[i] };

            // Calculate new position
            const newPos = calculateNewPosition(currentPos, action, room.grid);

            // Check for wall collision
            if (isWallBlocking(currentPos, action, room.grid)) {
                stepWallCollisions.push({
                    player: i,
                    position: { ...currentPos },
                    direction: action,
                });
            }

            stepMovements.push({
                player: i,
                from: { ...currentPos },
                to: { ...newPos },
                action,
            });

            positions[i] = newPos;
        }

        // Record wall collisions
        if (stepWallCollisions.length > 0) {
            wallCollisions[step] = stepWallCollisions;
        }

        // Check for player-player collisions
        for (let i = 0; i < playerCount; i++) {
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

        // If there was a player collision, stop simulation
        if (!success) break;

        // If there was a wall collision, stop simulation after recording this step
        if (stepWallCollisions.length > 0) {
            success = false;
            break;
        }
    }

    // If no collisions occurred, check if all players reached their targets
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

    // Send results to clients, including all players' target positions
    io.to(gameId).emit("sequence-result", {
        success,
        movements,
        collisionAt,
        wallCollisions,
        targetPositions: room.targetPositions,
        message: success
            ? "Gratulerer! Alle nådde sine mål!"
            : Object.keys(wallCollisions).length > 0
            ? "En eller flere spillere forsøkte å gå gjennom vegger. Prøv igjen!"
            : collisionAt
            ? "Kollisjon oppdaget! Spillere krasjet med hverandre."
            : "En eller flere spillere nådde ikke målet. Prøv igjen!",
    });

    if (success) {
        // If successful, notify about completion but DON'T reset
        const data = {
            gameId: gameId,
            gameType: "sequence",
            score: 1,
            players: room.players.map((p) => p.name).join(", "),
        };

        const http = require("http");
        const options = {
            hostname: "localhost",
            port: process.env.PORT || 3000,
            path: "/complete-game",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
        };

        const req = http.request(options);
        req.write(JSON.stringify(data));
        req.end();
    } else {
        // If failed, reset player sequences and ready players for another attempt
        room.playerSequences.clear();
        room.readyPlayers.clear();
    }
}

function isWallBlocking(pos, direction, grid) {
    switch (direction) {
        case "left":
            return pos.x <= 0 || grid[pos.y][pos.x - 1] === 1;
        case "right":
            return pos.x >= grid[0].length - 1 || grid[pos.y][pos.x + 1] === 1;
        case "up":
            return pos.y <= 0 || grid[pos.y - 1][pos.x] === 1;
        case "down":
            return pos.y >= grid.length - 1 || grid[pos.y + 1][pos.x] === 1;
        default:
            return false;
    }
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
            break;
    }

    return newPos;
}

function generateMaze(width, height) {
    const grid = Array(height)
        .fill()
        .map(() => Array(width).fill(1));

    const startX = 1;
    const startY = 1;

    grid[startY][startX] = 0;

    const directions = [
        { dx: 2, dy: 0 },
        { dx: 0, dy: 2 },
        { dx: -2, dy: 0 },
        { dx: 0, dy: -2 },
    ];

    function carvePath(x, y) {
        const shuffledDirs = shuffleArray([...directions]);

        for (const dir of shuffledDirs) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;

            if (
                nx > 0 &&
                nx < width - 1 &&
                ny > 0 &&
                ny < height - 1 &&
                grid[ny][nx] === 1
            ) {
                grid[ny][nx] = 0;
                grid[y + dir.dy / 2][x + dir.dx / 2] = 0;
                carvePath(nx, ny);
            }
        }
    }

    carvePath(startX, startY);

    // Add some random passages
    for (let i = 0; i < Math.min(40, (width * height) / 50); i++) {
        const x = 2 + Math.floor((Math.random() * (width - 4)) / 2) * 2;
        const y = 2 + Math.floor((Math.random() * (height - 4)) / 2) * 2;
        if (grid[y][x] === 1) {
            grid[y][x] = 0;

            const dir = directions[Math.floor(Math.random() * 4)];
            const nx = x + dir.dx / 2;
            const ny = y + dir.dy / 2;

            if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1) {
                grid[ny][nx] = 0;
            }
        }
    }

    // Create some open areas (limit based on grid size)
    const areas = Math.min(5, Math.floor((width * height) / 200));
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

    const spawns = [];
    const targets = [];
    const playerCount = 5;

    // Generate spawn and target points with a maximum number of attempts
    // to prevent infinite loops
    for (let i = 0; i < playerCount; i++) {
        let spawnX, spawnY, targetX, targetY;
        let valid = false;
        let attempts = 0;
        const maxAttempts = 100;

        while (!valid && attempts < maxAttempts) {
            attempts++;
            spawnX = 1 + Math.floor(Math.random() * (width - 2));
            spawnY = 1 + Math.floor(Math.random() * (height - 2));

            if (grid[spawnY][spawnX] === 0) {
                valid = true;

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

        // If we couldn't find a valid spawn after maxAttempts, pick any open cell
        if (!valid) {
            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    if (grid[y][x] === 0) {
                        spawnX = x;
                        spawnY = y;
                        valid = true;
                        break;
                    }
                }
                if (valid) break;
            }
        }

        spawns.push({ x: spawnX, y: spawnY });

        valid = false;
        attempts = 0;

        while (!valid && attempts < maxAttempts) {
            attempts++;
            targetX = 1 + Math.floor(Math.random() * (width - 2));
            targetY = 1 + Math.floor(Math.random() * (height - 2));

            if (grid[targetY][targetX] === 0) {
                const spawnDistance = Math.sqrt(
                    Math.pow(spawnX - targetX, 2) +
                        Math.pow(spawnY - targetY, 2),
                );

                // Accept closer targets for smaller grids
                const minDistance = Math.min(
                    20,
                    Math.floor((width * height) / 45),
                );

                if (spawnDistance >= minDistance) {
                    valid = true;

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

        // If we couldn't find a valid target, find any open cell far from spawn
        if (!valid) {
            let bestDistance = 0;
            let bestX = spawnX;
            let bestY = spawnY;

            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    if (grid[y][x] === 0) {
                        const distance = Math.sqrt(
                            Math.pow(x - spawnX, 2) + Math.pow(y - spawnY, 2),
                        );
                        if (distance > bestDistance) {
                            bestDistance = distance;
                            bestX = x;
                            bestY = y;
                        }
                    }
                }
            }

            targetX = bestX;
            targetY = bestY;
        }

        targets.push({ x: targetX, y: targetY });
    }

    return { grid, spawns, targets };
}

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

function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
