const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for now, restrict in production!
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// --- Constants --- //
const GRID_GAME_TYPE = 'grid';
const TRIVIA_GAME_TYPE = 'trivia';
const MECHANICAL_PUZZLE_TYPE = 'mechanical_puzzle';
const FINAL_CIPHER_TYPE = 'final_cipher'; // New Type
const MAX_PLAYERS = 5; // Maximum possible players server can handle in any room
const TRIVIA_TARGET_SCORE = 5;

// --- Game Config --- //
// Map stepId prefixes or specific IDs to required player counts
const REQUIRED_PLAYERS_MAP = {
    'prologue_': 5, // Grid default
    'grid_': 5,
    'trivia_group_a': 3, // Sage + Chronicler + Apprentice
    'trivia_group_b': 3, // Sage + Chronicler + Apprentice
    'trivia_group_c': 2, // Navigator + Craftsman
    'mechanical_puzzle_1': 2, // Craftsman + Apprentice
    'final_convergence_cipher': 5, // Requires 5 players
    // Add other specific stepIds or prefixes as needed
};

// Define the correct final answer for the cipher puzzle - REMOVED
// const FINAL_CIPHER_ANSWER = "CYGNUSX1"; // Example Answer - CHANGE THIS!

// --- NEW: Define the config, solution, and code phrases for the Chronarium Core ---
const FINAL_CIPHER_ROLES = ['Navigator', 'Sage', 'Chronicler', 'Craftsman', 'Apprentice'];
const FINAL_CIPHER_CONFIG_OPTIONS = {
    'Navigator': [1, 2, 3, 4], // Ring Positions
    'Sage': ['Crimson', 'Emerald', 'Azure', 'Golden'], // Prism Colors
    'Chronicler': [1, 2, 3, 4, 5], // Harmonic Levels (Target is Penultimate = 4)
    'Craftsman': ['Auxiliary', 'Keystone', 'Resonance'], // Brace Types
    'Apprentice': ['Low', 'Medium', 'High'] // Energy Thresholds
};
const FINAL_CIPHER_SOLUTION_CONFIG = {
    'Navigator': 3,
    'Sage': 'Azure',
    'Chronicler': 4, // Penultimate of 1-5
    'Craftsman': 'Keystone',
    'Apprentice': 'Medium'
};
const FINAL_CIPHER_CODE_PHRASES = {
    'Navigator': "The stars shift, but the true path follows the Third Axiom of Celestial Drift.",
    'Sage': "Wisdom reflects brightest through the Azure Prism, focusing the past.",
    'Chronicler': "Time's echo resonates strongest at the Penultimate Harmonic.",
    'Craftsman': "Stability is found when the Keystone Braces engage the core.",
    'Apprentice': "Unleash the flow, but only to the Median Threshold to prevent overload."
};

// Function to get required players, falling back to MAX_PLAYERS if not specified
function getRequiredPlayersForStep(stepId) {
    for (const prefix in REQUIRED_PLAYERS_MAP) {
        if (stepId.startsWith(prefix)) {
            return REQUIRED_PLAYERS_MAP[prefix];
        }
    }
    // Fallback if no specific rule matches
    console.warn(`No specific player count found for stepId: ${stepId}. Defaulting to ${MAX_PLAYERS}.`);
    return MAX_PLAYERS; 
}

// --- Game State --- //
const gameRooms = {}; // Structure: { roomName: { type: ..., players: {...}, state: ..., requiredPlayers: ..., gameData: {...} } }

// --- Grid Game Specific Data (Keep existing) --- //
const MAP_WIDTH = 20;
const MAP_HEIGHT = 15;
const TARGET_POSITIONS = { // Example target positions for each role
    'Navigator': { x: 18, y: 7 },
    'Sage': { x: 18, y: 5 },
    'Chronicler': { x: 18, y: 9 },
    'Craftsman': { x: 18, y: 3 },
    'Apprentice': { x: 18, y: 11 },
};
const START_POSITIONS = {
    'Navigator': { x: 1, y: 7 },
    'Sage': { x: 1, y: 5 },
    'Chronicler': { x: 1, y: 9 },
    'Craftsman': { x: 1, y: 3 },
    'Apprentice': { x: 1, y: 11 },
};
// Example Obstacles (Static for now)
const OBSTACLES = [
    {x: 5, y: 0}, {x: 5, y: 1}, {x: 5, y: 2}, {x: 5, y: 3}, {x: 5, y: 4},
    {x: 10, y: 10}, {x: 10, y: 11}, {x: 10, y: 12}, {x: 10, y: 13}, {x: 10, y: 14},
    {x: 15, y: 4}, {x: 15, y: 5}, {x: 15, y: 6}, {x: 15, y: 7}, {x: 15, y: 8}, {x: 15, y: 9}, {x: 15, y: 10},
];

// --- Trivia Game Specific Data --- //
const TRIVIA_QUESTIONS = [
    {
        question: "Which planet is known as the Red Planet?",
        answers: ["Earth", "Mars", "Jupiter", "Saturn", "Venus", "Mercury", "Neptune", "Uranus", "Pluto", "Ceres", "Eris", "Makemake"],
        correctAnswer: "Mars"
    },
    {
        question: "What is the largest mammal in the world?",
        answers: ["Elephant", "Blue Whale", "Giraffe", "Hippopotamus", "Rhino", "Sperm Whale", "Fin Whale", "Sei Whale", "Humpback Whale", "Orca", "Great White Shark", "Giant Squid"],
        correctAnswer: "Blue Whale"
    },
    {
        question: "Who wrote 'Hamlet'?",
        answers: ["Charles Dickens", "William Shakespeare", "Leo Tolstoy", "Jane Austen", "Mark Twain", "George Orwell", "Homer", "Sophocles", "Euripides", "Aristophanes", "Plato", "Aristotle"],
        correctAnswer: "William Shakespeare"
    },
     {
        question: "What is the capital of France?",
        answers: ["Berlin", "Madrid", "Paris", "Rome", "London", "Lisbon", "Amsterdam", "Brussels", "Vienna", "Prague", "Warsaw", "Budapest"],
        correctAnswer: "Paris"
    },
    {
        question: "What is the chemical symbol for water?",
        answers: ["O2", "H2O", "CO2", "NaCl", "H2SO4", "HCl", "NaOH", "KOH", "NH3", "CH4", "C6H12O6", "Fe"],
        correctAnswer: "H2O"
    },
    // Add more questions as needed
];

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function getGameTypeFromStepId(stepId) {
    if (stepId.startsWith('trivia_')) {
        return TRIVIA_GAME_TYPE;
    } else if (stepId.startsWith('prologue_') || stepId.startsWith('grid_')) {
        return GRID_GAME_TYPE;
    } else if (stepId.startsWith('mechanical_puzzle_')) {
         return MECHANICAL_PUZZLE_TYPE; // New check
    } else if (stepId.startsWith('final_convergence_cipher')) {
         return FINAL_CIPHER_TYPE; // New Check
    } else {
        console.warn(`Unknown game type for stepId: ${stepId}. Defaulting to grid.`);
        return GRID_GAME_TYPE;
    }
}

function getRoomName(stepId) {
    return `room_${stepId}`;
}

// Define initial state for the mechanical puzzle
const INITIAL_MECH_PUZZLE_STATE = {
     // Apprentice components
     powerCrystal: 'off', // 'on' | 'off'
     focusLens: 0, // 0-100
     ignitionAttempted: false, // Flag for check
     // Craftsman components
     coolantValve: 'closed', // 'open' | 'closed'
     bellowsPressure: 0, // 0-100 (maybe target 60-80?)
     gearLever: 'disengaged', // 'engaged' | 'disengaged'
     // Shared status / outcome
     lastActionStatus: null // { success: bool, message: string }
};

// Define winning state conditions
const MECH_PUZZLE_WIN_CONDITIONS = {
     powerCrystal: 'on',
     focusLensMin: 70,
     focusLensMax: 85,
     coolantValve: 'open',
     bellowsPressureMin: 60,
     bellowsPressureMax: 90, // Allow some overshoot
     gearLever: 'engaged'
};

function initializeRoom(roomName, gameType, stepId) {
    if (!gameRooms[roomName]) {
        const requiredPlayers = getRequiredPlayersForStep(stepId); // Get required count
        console.log(`Initializing ${gameType} room: ${roomName} (Requires ${requiredPlayers} players)`);
        const roomData = {
            type: gameType,
            players: {},
            state: 'waiting',
            requiredPlayers: requiredPlayers, // Store required count
            gameData: {}
        };

        if (gameType === GRID_GAME_TYPE) {
            roomData.gameData = {
                map: {
                    width: MAP_WIDTH,
                    height: MAP_HEIGHT,
                    obstacles: OBSTACLES,
                    targets: TARGET_POSITIONS,
                    starts: START_POSITIONS
                }
                // Grid specific state if needed
            };
        } else if (gameType === TRIVIA_GAME_TYPE) {
            roomData.gameData = {
                score: 0,
                targetScore: TRIVIA_TARGET_SCORE,
                currentQuestionIndex: -1,
                currentQuestionText: null,
                currentCorrectAnswer: null,
                questionPool: shuffleArray([...TRIVIA_QUESTIONS]),
                lastAnswerResult: null
            };
            // DO NOT select question here - wait until game starts or resets
             Object.values(roomData.players).forEach(p => { p.currentAnswers = []; });
             // selectNextTriviaQuestion(roomName, roomData.gameData); // REMOVED
        } else if (gameType === MECHANICAL_PUZZLE_TYPE) {
             roomData.gameData = { ...INITIAL_MECH_PUZZLE_STATE }; // Initialize with defaults
        } else if (gameType === FINAL_CIPHER_TYPE) {
             // Initialize for the Chronarium Core puzzle
             const initialComponentStates = {};
             FINAL_CIPHER_ROLES.forEach(role => {
                 initialComponentStates[role] = null; // null = not set yet
             });
             roomData.gameData = {
                  componentStates: initialComponentStates,
                  lastConfigResult: null // Optional: { role: string, setting: any, message?: string }
             };
        }

        gameRooms[roomName] = roomData;
    }
    return gameRooms[roomName];
}

function broadcastRoomState(roomName) {
    const room = gameRooms[roomName];
    if (room) {
        const commonPayload = {
            type: room.type,
            state: room.state,
            requiredPlayers: room.requiredPlayers,
            // Game specific common data
            score: (room.type === TRIVIA_GAME_TYPE) ? room.gameData.score : undefined,
            targetScore: (room.type === TRIVIA_GAME_TYPE) ? room.gameData.targetScore : undefined,
            lastAnswerResult: (room.type === TRIVIA_GAME_TYPE) ? room.gameData.lastAnswerResult : undefined,
            mechPuzzleState: (room.type === MECHANICAL_PUZZLE_TYPE) ? room.gameData : undefined,
            map: (room.type === GRID_GAME_TYPE) ? room.gameData.map : undefined,
            // Send state for the final cipher (Chronarium Core)
            finalCipherComponentStates: (room.type === FINAL_CIPHER_TYPE) ? room.gameData.componentStates : undefined,
            lastConfigResult: (room.type === FINAL_CIPHER_TYPE) ? room.gameData.lastConfigResult : undefined,
            // Note: Config options are constant, could be sent once or derived client-side if needed
        };

        // Send personalized state (for trivia and final cipher) or common state (for others)
        if (room.type === TRIVIA_GAME_TYPE || room.type === FINAL_CIPHER_TYPE) {
             Object.values(room.players).forEach(player => {
                  const playersInfo = Object.values(room.players).map(p => ({ role: p.role, ready: p.ready }));
                  const personalizedPayload = { ...commonPayload };
                  personalizedPayload.players = playersInfo;
                  personalizedPayload.yourRole = player.role;

                  if (room.type === TRIVIA_GAME_TYPE) {
                       personalizedPayload.currentQuestion = {
                            question: room.gameData.currentQuestionText,
                            answers: player.currentAnswers || []
                        };
                  }
                  // Add code phrase and available options for final cipher player
                  if (room.type === FINAL_CIPHER_TYPE) {
                        personalizedPayload.yourCodePhrase = FINAL_CIPHER_CODE_PHRASES[player.role] || "Code phrase not found.";
                        personalizedPayload.yourConfigOptions = FINAL_CIPHER_CONFIG_OPTIONS[player.role] || [];
                  }

                  io.to(player.socketId).emit('game_state', personalizedPayload);
             });
        } else {
             // For Grid, Mechanical Puzzle send the same state to everyone
             const playersInfo = Object.values(room.players).map(p => ({ role: p.role, ready: p.ready })); // Include ready state if needed
             const commonStatePayload = { ...commonPayload, players: playersInfo };
             io.to(roomName).emit('game_state', commonStatePayload);
        }

        const playersNow = Object.keys(room.players).length;
        console.log(`Broadcasting ${room.type} state for room ${roomName}: ${room.state}, Players: ${playersNow}/${room.requiredPlayers}, Components: ${JSON.stringify(room.gameData?.componentStates)}`);
    }
}

// --- Trivia Game Logic --- //
function selectNextTriviaQuestion(roomName, gameData) {
    if (!gameData.questionPool || gameData.questionPool.length === 0) {
        console.log(`[${roomName}] Reshuffling trivia questions pool.`);
        gameData.questionPool = shuffleArray([...TRIVIA_QUESTIONS]);
    }

    gameData.currentQuestionIndex = (gameData.currentQuestionIndex + 1) % gameData.questionPool.length;
    const nextQuestionData = gameData.questionPool[gameData.currentQuestionIndex];

    gameData.currentQuestionText = nextQuestionData.question;
    gameData.currentCorrectAnswer = nextQuestionData.correctAnswer;
    gameData.lastAnswerResult = null;

    console.log(`[${roomName}] Selected new question: "${gameData.currentQuestionText.substring(0, 30)}..."`);
    // Assign answers AFTER selecting the question
    assignAnswersToPlayers(roomName);
}

function assignAnswersToPlayers(roomName) {
     const room = gameRooms[roomName];
     if (!room || room.type !== TRIVIA_GAME_TYPE) return;

     const gameData = room.gameData;
     const correctAnswer = gameData.currentCorrectAnswer;
     const players = Object.values(room.players);
     const playerCount = players.length;
     if (playerCount === 0) return;

     const currentQuestionFullData = TRIVIA_QUESTIONS.find(q => q.question === gameData.currentQuestionText);
     if (!currentQuestionFullData) {
          console.error(`[${roomName}] Could not find full data for question: ${gameData.currentQuestionText}`);
          return;
     }
     const allIncorrectAnswers = currentQuestionFullData.answers.filter(a => a !== correctAnswer);

     let answerPool = [];
     const answersPerPlayer = 4;
     let incorrectAnswersNeeded;

     if (playerCount <= 2) {
          incorrectAnswersNeeded = (answersPerPlayer * 2) - 1;
     } else {
          incorrectAnswersNeeded = (answersPerPlayer * 3) - 1;
          if (playerCount > 3) {
               console.warn(`[${roomName}] Trivia designed for 2 or 3 players, but ${playerCount} are present. Using 11 incorrect answers.`);
          }
     }

     if (allIncorrectAnswers.length < incorrectAnswersNeeded) {
          console.error(`[${roomName}] Not enough incorrect answers for question! Need ${incorrectAnswersNeeded}, have ${allIncorrectAnswers.length}`);
          incorrectAnswersNeeded = allIncorrectAnswers.length;
     }
     
     answerPool = [correctAnswer, ...shuffleArray(allIncorrectAnswers).slice(0, incorrectAnswersNeeded)];
     shuffleArray(answerPool);

     let poolIndex = 0;
     const playerWithCorrectAnswerIndex = Math.floor(Math.random() * playerCount);
     players[playerWithCorrectAnswerIndex].currentAnswers = [correctAnswer];
     console.log(`[${roomName}] Correct answer ('${correctAnswer}') assigned to ${players[playerWithCorrectAnswerIndex].role}`);

     answerPool = answerPool.filter(a => a !== correctAnswer);
     shuffleArray(answerPool);

     players.forEach((player, index) => {
          if (index === playerWithCorrectAnswerIndex) {
               while(player.currentAnswers.length < answersPerPlayer && answerPool.length > 0) {
                    player.currentAnswers.push(answerPool.pop());
               }
          } else {
               player.currentAnswers = [];
                while(player.currentAnswers.length < answersPerPlayer && answerPool.length > 0) {
                    player.currentAnswers.push(answerPool.pop());
               }
          }
          player.currentAnswers = shuffleArray(player.currentAnswers);
          console.log(`[${roomName}] ${player.role} answers: ${player.currentAnswers.join(', ')}`);
     });

     if (answerPool.length > 0) {
          console.warn(`[${roomName}] Warning: ${answerPool.length} answers left in pool after distribution.`);
     }
}

function checkTriviaAnswer(roomName, submittedAnswer) {
    const room = gameRooms[roomName];
    if (!room || room.type !== TRIVIA_GAME_TYPE || room.state !== 'playing') return;

    const gameData = room.gameData;
    const correctAnswer = gameData.currentCorrectAnswer;
    const isCorrect = submittedAnswer === correctAnswer;

    if (isCorrect) {
        gameData.score++;
        console.log(`[${roomName}] Correct answer submitted: ${submittedAnswer}. New score: ${gameData.score}`);
        gameData.lastAnswerResult = { correct: true, answer: submittedAnswer, correctAnswer: correctAnswer };

        if (gameData.score >= gameData.targetScore) {
            console.log(`[${roomName}] Target score reached! Game finished.`);
            room.state = 'finished';
            broadcastRoomState(roomName);
            setTimeout(() => {
                Object.keys(room.players).forEach(socketId => {
                     io.to(socketId).emit('challenge_complete', { message: `Congratulations! You reached the target score of ${gameData.targetScore}.` });
                });
            }, 1000);
        } else {
            selectNextTriviaQuestion(roomName, gameData);
            assignAnswersToPlayers(roomName);
            broadcastRoomState(roomName);
        }
    } else {
        console.log(`[${roomName}] Incorrect answer submitted: ${submittedAnswer}. Correct was: ${correctAnswer}. Score reset.`);
        gameData.score = 0;
        gameData.lastAnswerResult = { correct: false, answer: submittedAnswer, correctAnswer: correctAnswer };
        selectNextTriviaQuestion(roomName, gameData);
        assignAnswersToPlayers(roomName);
        broadcastRoomState(roomName);
    }
}

// --- Grid Game Logic (Keep existing simulateGame, etc.) --- //
function checkAllGridPlayersReady(roomName) {
    const room = gameRooms[roomName];
    if (!room || Object.keys(room.players).length < MAX_PLAYERS) {
        return false;
    }
    return Object.values(room.players).every(p => p.ready);
}

function simulateGridGame(roomName) {
    const room = gameRooms[roomName];
    if (!room || room.state !== 'playing' || room.type !== GRID_GAME_TYPE) return;

    console.log(`Simulating grid game for room ${roomName}`);
    const playerPaths = {};
    const playerStates = {};
    let maxInputLength = 0;
    const map = room.gameData.map;

    Object.values(room.players).forEach(p => {
        playerStates[p.role] = { ...map.starts[p.role], collided: false, finished: false };
        playerPaths[p.role] = [{ ...playerStates[p.role] }];
        if (p.inputs.length > maxInputLength) {
            maxInputLength = p.inputs.length;
        }
    });

    let collisionDetected = false;
    let allFinished = false;

    for (let step = 0; step < maxInputLength; step++) {
        const currentPositions = {};
        const rolesInThisStep = [];

        Object.values(room.players).forEach(p => {
            if (collisionDetected || playerStates[p.role].collided || playerStates[p.role].finished) return;
            rolesInThisStep.push(p.role);
            const move = p.inputs[step];
            const currentState = playerStates[p.role];
            let nextX = currentState.x, nextY = currentState.y;

            if (move === 'up') nextY--;
            else if (move === 'down') nextY++;
            else if (move === 'left') nextX--;
            else if (move === 'right') nextX++;

            if (nextX < 0 || nextX >= map.width || nextY < 0 || nextY >= map.height) {
                console.log(`[${roomName}] ${p.role} hit a wall at step ${step}`);
                playerStates[p.role].collided = true; collisionDetected = true; return;
            }
            if (map.obstacles.some(obs => obs.x === nextX && obs.y === nextY)) {
                console.log(`[${roomName}] ${p.role} hit an obstacle at step ${step}`);
                playerStates[p.role].collided = true; collisionDetected = true; return;
            }

            currentState.x = nextX; currentState.y = nextY;
            playerPaths[p.role].push({ ...currentState });
            const posKey = `${nextX},${nextY}`;
            if (!currentPositions[posKey]) currentPositions[posKey] = [];
            currentPositions[posKey].push(p.role);
        });

        if (collisionDetected) break;

        for (const posKey in currentPositions) {
            if (currentPositions[posKey].length > 1) {
                 const collidingRoles = currentPositions[posKey].join(', ');
                 console.log(`[${roomName}] Player collision at ${posKey} involving: ${collidingRoles} at step ${step}`);
                 currentPositions[posKey].forEach(role => playerStates[role].collided = true);
                 collisionDetected = true;
            }
        }
        if (collisionDetected) break;

        rolesInThisStep.forEach(role => {
            const state = playerStates[role]; const target = map.targets[role];
            if (!state.finished && state.x === target.x && state.y === target.y) {
                 console.log(`[${roomName}] ${role} reached target at step ${step}`); state.finished = true;
            }
        });
    }

    let simulationResult;
    if (collisionDetected) {
        const firstCollider = Object.entries(playerStates).find(([_, state]) => state.collided)?.[0] || 'Someone';
        simulationResult = { success: false, reason: `${firstCollider} collided!`, paths: playerPaths };
    } else {
        allFinished = Object.values(playerStates).every(state => state.finished);
        if (allFinished) {
            simulationResult = { success: true, reason: 'All champions reached their destination!', paths: playerPaths };
            room.state = 'finished';
        } else {
            const unfinished = Object.entries(playerStates).filter(([_, state]) => !state.finished).map(([role, _]) => role).join(', ');
            simulationResult = { success: false, reason: `Not all players reached target. Waiting for: ${unfinished}`, paths: playerPaths };
        }
    }

    io.to(roomName).emit('simulation_result', simulationResult);

    if (simulationResult.success) {
        setTimeout(() => {
             Object.keys(room.players).forEach(socketId => {
                 io.to(socketId).emit('challenge_complete', { message: "Grid challenge completed!" });
             });
        }, 2000);
    }
}

// --- Common Logic --- //
function checkAllPlayersPresent(roomName) {
    const room = gameRooms[roomName];
    return room && Object.keys(room.players).length >= room.requiredPlayers;
}

function resetRoom(roomName, reason) {
    const room = gameRooms[roomName];
    if (room) {
        console.log(`Resetting room ${roomName} (${room.type}) due to: ${reason}`);
        room.state = 'waiting';
        Object.values(room.players).forEach(p => { p.ready = false; }); // Reset readiness for all types on reset

        if (room.type === TRIVIA_GAME_TYPE) {
            room.gameData.score = 0;
            room.gameData.lastAnswerResult = null;
            Object.values(room.players).forEach(p => { p.currentAnswers = []; }); // Clear old answers
            // Select the *next* question and assign answers for the waiting state
            selectNextTriviaQuestion(roomName, room.gameData);
        } else if (room.type === GRID_GAME_TYPE) {
            Object.values(room.players).forEach(p => {
                // p.ready = false; // Already done above
                p.inputs = [];
            });
        } else if (room.type === MECHANICAL_PUZZLE_TYPE) {
             room.gameData = { ...INITIAL_MECH_PUZZLE_STATE }; // Reset to initial state
        } else if (room.type === FINAL_CIPHER_TYPE) {
             // Reset the Chronarium Core puzzle state
             const initialComponentStates = {};
             FINAL_CIPHER_ROLES.forEach(role => {
                 initialComponentStates[role] = null;
             });
             room.gameData.componentStates = initialComponentStates;
             room.gameData.lastConfigResult = null;
        }

        io.to(roomName).emit('game_reset', { reason: reason }); // Generic reset signal
        broadcastRoomState(roomName); // Send updated states
    }
}

// --- Mechanical Puzzle Logic --- //
function handleMechanicalAction(roomName, playerRole, action) {
     const room = gameRooms[roomName];
     if (!room || room.type !== MECHANICAL_PUZZLE_TYPE || room.state !== 'playing') return;

     const gameData = room.gameData;
     gameData.lastActionStatus = null; // Clear previous status
     let broadcastNeeded = true;

     const component = action.component;
     const value = action.value; // Optional value for slider/dial

     console.log(`[${roomName}] Received action from ${playerRole}: ${component}` + (value !== undefined ? ` (${value})` : ''));

     // --- Apprentice Actions --- //
     if (playerRole === 'Apprentice') {
          if (component === 'powerCrystal') {
               gameData.powerCrystal = (gameData.powerCrystal === 'off') ? 'on' : 'off';
               gameData.lastActionStatus = { success: true, message: `Power Crystal set to ${gameData.powerCrystal}` };
          } else if (component === 'focusLens') {
               const numericValue = parseInt(value, 10);
               if (!isNaN(numericValue) && numericValue >= 0 && numericValue <= 100) {
                    gameData.focusLens = numericValue;
                    gameData.lastActionStatus = { success: true, message: `Focus Lens set to ${gameData.focusLens}` };
               } else {
                    gameData.lastActionStatus = { success: false, message: `Invalid value for Focus Lens.` };
               }
          } else if (component === 'ignitionRune') {
               // --- CHECK WIN CONDITION --- //
               const win = MECH_PUZZLE_WIN_CONDITIONS;
               let failReason = null;

               if (gameData.powerCrystal !== win.powerCrystal) failReason = "Power Crystal is off!";
               else if (gameData.coolantValve !== win.coolantValve) failReason = "Coolant Valve is closed!";
               else if (gameData.gearLever !== win.gearLever) failReason = "Gear Lever is disengaged!";
               else if (gameData.bellowsPressure < win.bellowsPressureMin || gameData.bellowsPressure > win.bellowsPressureMax) failReason = `Bellows Pressure out of range (${gameData.bellowsPressure})!`;
               else if (gameData.focusLens < win.focusLensMin || gameData.focusLens > win.focusLensMax) failReason = `Focus Lens out of range (${gameData.focusLens})!`;

               if (failReason) {
                    console.log(`[${roomName}] Ignition failed: ${failReason}`);
                    gameData.lastActionStatus = { success: false, message: `Ignition Failed: ${failReason}` };
                    // Optional: Reset some state on failure? e.g., pressure? or just show message.
                    // gameData.bellowsPressure = 0; 
               } else {
                    // SUCCESS!
                    console.log(`[${roomName}] Ignition Successful! Puzzle Complete.`);
                    room.state = 'finished';
                    gameData.lastActionStatus = { success: true, message: "Arcane Forge Ignited Successfully!" };
                    broadcastNeeded = true; // Ensure final state is sent
                    broadcastRoomState(roomName);
                    // Send completion signal
                    setTimeout(() => {
                         Object.keys(room.players).forEach(socketId => {
                              io.to(socketId).emit('challenge_complete', { message: "Forge activated!" });
                         });
                    }, 1000);
                    return; // Don't need further broadcast below if game finished
               }
          }
     }
     // --- Craftsman Actions --- //
     else if (playerRole === 'Craftsman') {
          if (component === 'coolantValve') {
               gameData.coolantValve = (gameData.coolantValve === 'closed') ? 'open' : 'closed';
               gameData.lastActionStatus = { success: true, message: `Coolant Valve set to ${gameData.coolantValve}` };
          } else if (component === 'bellowsPump') {
               // Increase pressure, maybe with a cap
               gameData.bellowsPressure = Math.min(100, gameData.bellowsPressure + 10); // Increase by 10 per pump
               gameData.lastActionStatus = { success: true, message: `Bellows pumped! Pressure: ${gameData.bellowsPressure}` };
          } else if (component === 'gearLever') {
               // Prerequisite check: Maybe requires minimum pressure?
               if (gameData.bellowsPressure >= MECH_PUZZLE_WIN_CONDITIONS.bellowsPressureMin / 2) { // e.g. require half min pressure
                    gameData.gearLever = (gameData.gearLever === 'disengaged') ? 'engaged' : 'disengaged';
                    gameData.lastActionStatus = { success: true, message: `Gear Lever ${gameData.gearLever}` };
               } else {
                    gameData.lastActionStatus = { success: false, message: `Cannot engage gear, pressure too low (${gameData.bellowsPressure})!` };
               }
          }
     }

     if (broadcastNeeded) {
         broadcastRoomState(roomName);
     }
}

// --- Final Cipher Logic (NEW Chronarium Core Logic) --- //
function handleCoreConfiguration(roomName, playerRole, settingValue) {
     const room = gameRooms[roomName];
     if (!room || room.type !== FINAL_CIPHER_TYPE || room.state !== 'playing') return { broadcastNeeded: false, gameWon: false };

     const gameData = room.gameData;
     const componentStates = gameData.componentStates;

     console.log(`[${roomName}] Received configuration attempt from ${playerRole} with setting ${JSON.stringify(settingValue)}.`);

     // Input Validation
     if (!FINAL_CIPHER_CONFIG_OPTIONS.hasOwnProperty(playerRole)) {
          console.warn(`[${roomName}] Invalid role attempted configuration: ${playerRole}`);
          gameData.lastConfigResult = { role: playerRole, setting: settingValue, message: `Internal error: Unknown role ${playerRole}` };
          return { broadcastNeeded: true, gameWon: false };
     }
     const allowedOptions = FINAL_CIPHER_CONFIG_OPTIONS[playerRole];
     if (!allowedOptions.includes(settingValue)) {
           console.warn(`[${roomName}] Invalid setting value submitted by ${playerRole}: ${settingValue}. Allowed: ${allowedOptions}`);
           gameData.lastConfigResult = { role: playerRole, setting: settingValue, message: `Invalid setting for ${playerRole}: ${settingValue}` };
           return { broadcastNeeded: true, gameWon: false };
      }

     // Update the state for this player's component
     componentStates[playerRole] = settingValue;
     gameData.lastConfigResult = { role: playerRole, setting: settingValue }; // Simple feedback: setting applied
     console.log(`[${roomName}] Configuration updated for ${playerRole}. New state: ${JSON.stringify(componentStates)}`);

     // Check for win condition (all components must be set and match the solution)
     let allSetAndCorrect = true;
     for (const role of FINAL_CIPHER_ROLES) {
         if (componentStates[role] === null || componentStates[role] !== FINAL_CIPHER_SOLUTION_CONFIG[role]) {
             allSetAndCorrect = false;
             break;
         }
     }

     if (allSetAndCorrect) {
          console.log(`[${roomName}] Correct configuration achieved! Chronarium Core aligned!`);
          room.state = 'finished';
          return { broadcastNeeded: true, gameWon: true }; // Signal win
     } else {
          // Configuration updated, but not (yet) the winning one
          return { broadcastNeeded: true, gameWon: false };
     }
}

// --- Socket.IO Event Handlers --- //
io.on('connection', (socket) => {
    let { role, step } = socket.handshake.query;
    if (!role || !step) {
        console.log('Connection attempt without role or step. Disconnecting.');
        socket.disconnect(true);
        return;
    }
    role = role.substring(0, 15);
    step = step.substring(0, 30);

    const gameType = getGameTypeFromStepId(step);
    const roomName = getRoomName(step);
    const room = initializeRoom(roomName, gameType, step);

    if (Object.keys(room.players).length >= room.requiredPlayers) {
        console.log(`Room ${roomName} is full (${room.requiredPlayers} players). Disconnecting ${role}.`);
        socket.emit('error_message', { message: `Sorry, the room is currently full (${room.requiredPlayers} players).` });
        socket.disconnect(true);
        return;
    }

    console.log(`User ${role} (${socket.id}) connected to ${gameType} room ${roomName}.`);
    socket.join(roomName);

    // Add player BEFORE checking game state / assigning answers
    room.players[socket.id] = { role: role, socketId: socket.id, ready: false, currentAnswers: [] };
    if (gameType === GRID_GAME_TYPE) room.players[socket.id].inputs = [];

    let needsBroadcasting = true; // Flag to control broadcasting

    // Handle joining mid-game for trivia
    if (room.type === TRIVIA_GAME_TYPE && room.state === 'playing') {
        console.warn(`[${roomName}] Player ${role} joined mid-game. Resetting room.`);
        resetRoom(roomName, `${role} joined mid-game.`);
        needsBroadcasting = false; // resetRoom already broadcasts
    } 
    // Auto-start Logic (applies to Trivia, Mechanical Puzzle, Final Cipher)
    else if ((room.type === TRIVIA_GAME_TYPE || room.type === MECHANICAL_PUZZLE_TYPE || room.type === FINAL_CIPHER_TYPE) && room.state === 'waiting') {
         if (checkAllPlayersPresent(roomName)) {
             console.log(`[${roomName}] Required players reached (${room.requiredPlayers}). Auto-starting ${room.type} game.`);
             if(room.type === TRIVIA_GAME_TYPE) {
                 selectNextTriviaQuestion(roomName, room.gameData);
             }
             // No specific setup needed for mech puzzle or final cipher start besides setting state
             room.state = 'playing';
             // Broadcast will happen below
         } else {
             console.log(`[${roomName}] Waiting for more players (${Object.keys(room.players).length}/${room.requiredPlayers})...`);
             // Ensure initial state is set for trivia if needed
             if(room.type === TRIVIA_GAME_TYPE && !room.gameData.currentQuestionText) {
                 selectNextTriviaQuestion(roomName, room.gameData);
             } else if (room.type === TRIVIA_GAME_TYPE) {
                 assignAnswersToPlayers(roomName); // Reassign answers if someone joins/leaves while waiting
             }
              // No specific action needed for mech puzzle or final cipher while waiting
         }
    }

    // Broadcast state if not handled by resetRoom or other logic
    if (needsBroadcasting) {
        broadcastRoomState(roomName);
    }

    socket.on('disconnect', () => {
        console.log(`User ${role} (${socket.id}) disconnected from room ${roomName}`);
        if (room.players[socket.id]) {
             delete room.players[socket.id];
        }

        if (Object.keys(room.players).length === 0) {
            console.log(`Room ${roomName} is empty, deleting.`);
            delete gameRooms[roomName];
        } else {
            if (room.state === 'playing' || room.state === 'finished') {
                 resetRoom(roomName, `${role} disconnected.`);
            } else {
                 broadcastRoomState(roomName);
            }
        }
    });

    socket.on('player_ready', (data) => {
        if (room.type !== GRID_GAME_TYPE || !room.players[socket.id] || room.state !== 'waiting') return;

        room.players[socket.id].ready = true;
        room.players[socket.id].inputs = data.inputs || [];
        console.log(`[${roomName}] Grid Player ${role} is ready...`);
        broadcastRoomState(roomName);

        if (Object.keys(room.players).length === room.requiredPlayers && Object.values(room.players).every(p => p.ready)) {
            console.log(`All ${room.requiredPlayers} players in grid room ${roomName} are ready. Starting simulation.`);
            room.state = 'playing';
            broadcastRoomState(roomName);
            simulateGridGame(roomName);
        }
    });

    socket.on('submit_answer', (data) => {
        if (room.type !== TRIVIA_GAME_TYPE || !room.players[socket.id] || room.state !== 'playing') return;

        const submittedAnswer = data.answer;
        console.log(`[${roomName}] Player ${role} submitted answer: ${submittedAnswer}`);
        checkTriviaAnswer(roomName, submittedAnswer);
    });

    socket.on('submit_mech_action', (action) => {
         if (room.type !== MECHANICAL_PUZZLE_TYPE || !room.players[socket.id] || room.state !== 'playing') return;
         
         // Get the role of the player sending the action
         const playerRole = room.players[socket.id].role; 
         // Basic validation: Does role match allowed components? (Could be more robust)
         const isApprenticeAction = ['powerCrystal', 'focusLens', 'ignitionRune'].includes(action.component);
         const isCraftsmanAction = ['coolantValve', 'bellowsPump', 'gearLever'].includes(action.component);

         if ((playerRole === 'Apprentice' && isApprenticeAction) || (playerRole === 'Craftsman' && isCraftsmanAction)) {
              handleMechanicalAction(roomName, playerRole, action);
         } else {
              console.warn(`[${roomName}] Player ${playerRole} attempted invalid action: ${action.component}`);
              // Optionally send an error back to the specific client?
              // socket.emit('action_error', { message: 'Invalid action for your role.' });
         }
    });

    // --- NEW: Final Cipher Configuration Handler ---
    socket.on('submit_configuration', (data) => {
        const room = gameRooms[roomName]; // Get room associated with this socket connection
        if (!room || room.type !== FINAL_CIPHER_TYPE || !room.players[socket.id] || room.state !== 'playing') {
             console.warn(`[${roomName}] Invalid 'submit_configuration' received from ${socket.id}. State: ${room?.state}, Type: ${room?.type}`);
             return; // Ignore if game not in correct state/type
        }
        // Validate data structure - expects { setting: value }
        if (!data || data.setting === undefined) { // Allow null/0/false as settings
             console.warn(`[${roomName}] Invalid data format for 'submit_configuration' from ${socket.id}. Expected { setting: value }. Data:`, data);
             return;
        }

        const playerRole = room.players[socket.id].role;
        const settingValue = data.setting;

        const { broadcastNeeded, gameWon } = handleCoreConfiguration(roomName, playerRole, settingValue);

        if (broadcastNeeded) {
            broadcastRoomState(roomName); // Send updated component states/result to all players
        }

        if (gameWon) {
            // Send completion signal after a short delay
            setTimeout(() => {
                 Object.keys(room.players).forEach(socketId => {
                      io.to(socketId).emit('challenge_complete', { message: "Chronarium Core Aligned! Convergence Achieved!" });
                 });
            }, 1000);
        }
    });

});

// --- Server Start --- //
server.listen(PORT, () => {
    console.log(`Multiplayer server listening on *:${PORT}`);
});