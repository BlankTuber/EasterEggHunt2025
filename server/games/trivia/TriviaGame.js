const GameRoom = require("../GameRoom");
const questions = require("./questions");
const config = require("../../config");

class TriviaGame extends GameRoom {
    constructor(id) {
        super(id, config.maxPlayersPerRoom.trivia);
        this.playerAnswers = new Map(); // Track player answers
        this.usedQuestions = new Set(); // Track used questions to avoid repeats
        this.playerChoices = new Map(); // Track which options each player sees
    }

    setupSocketEvents(socket, io) {
        this.io = io; // Store io reference for broadcasts

        // Handle player submitting an answer
        socket.on("trivia-answer", (data) => {
            const result = this.processAnswer(socket.id, data.answer);

            if (result) {
                // Broadcast the result to all players
                this.io.to(this.id).emit("trivia-result", result);
            }
        });

        // Handle player ready status
        socket.on("trivia-ready", () => {
            const updatedState = this.setPlayerReady(socket.id);

            if (updatedState) {
                this.io.to(this.id).emit("trivia-round-started", updatedState);
            }
        });
    }

    startGame() {
        super.startGame();
        this.gameState.gameData = this.generateQuestion();
        this.distributeChoices();
    }

    generateQuestion() {
        // Get unused questions
        const availableQuestions = questions.filter(
            (q) => !this.usedQuestions.has(q.id),
        );

        // If all questions have been used, reset usedQuestions
        if (availableQuestions.length === 0) {
            this.usedQuestions.clear();
            availableQuestions.push(...questions);
        }

        // Select a random question
        const questionIndex = Math.floor(
            Math.random() * availableQuestions.length,
        );
        const question = availableQuestions[questionIndex];

        // Mark as used
        this.usedQuestions.add(question.id);

        return {
            id: question.id,
            text: question.text,
            correctAnswer: question.correctAnswer,
            options: question.options,
            category: question.category,
        };
    }

    distributeChoices() {
        this.playerChoices.clear();
        this.playerAnswers.clear();

        const allOptions = this.gameState.gameData.options;
        const correctAnswer = this.gameState.gameData.correctAnswer;

        // Ensure correct answer is in all player choices
        const players = this.getPlayers();

        players.forEach((player) => {
            // Shuffle options for each player
            const shuffledOptions = [...allOptions];
            this.shuffleArray(shuffledOptions);

            // Ensure correct answer is included
            if (!shuffledOptions.includes(correctAnswer)) {
                shuffledOptions.pop(); // Remove the last option
                shuffledOptions.push(correctAnswer); // Add correct answer
                this.shuffleArray(shuffledOptions); // Re-shuffle
            }

            // Select 4 options for this player
            const playerOptions = shuffledOptions.slice(0, 4);
            this.playerChoices.set(player.id, playerOptions);
        });
    }

    setPlayerReady(socketId) {
        const player = this.players.get(socketId);
        if (player) {
            player.isReady = true;

            // Check if all players are ready
            const allReady = Array.from(this.players.values()).every(
                (p) => p.isReady,
            );

            if (allReady) {
                return this.startRound();
            }
        }

        return null;
    }

    startRound() {
        // Reset player readiness
        this.players.forEach((player) => {
            player.isReady = false;
        });

        // Generate new question
        this.gameState.gameData = this.generateQuestion();
        this.gameState.currentRound++;

        // Distribute choices to players
        this.distributeChoices();

        // Return updated game state
        return this.getGameState();
    }

    processAnswer(socketId, answer) {
        const player = this.players.get(socketId);
        if (!player) return null;

        this.playerAnswers.set(socketId, answer);

        // Check if all players have answered
        if (this.playerAnswers.size === this.players.size) {
            return this.evaluateRound();
        }

        return {
            type: "answerReceived",
            player: player.name,
            pendingPlayers: this.getPendingPlayerNames(),
        };
    }

    getPendingPlayerNames() {
        const pendingPlayers = [];
        this.players.forEach((player) => {
            if (!this.playerAnswers.has(player.id)) {
                pendingPlayers.push(player.name);
            }
        });
        return pendingPlayers;
    }

    evaluateRound() {
        const correctAnswer = this.gameState.gameData.correctAnswer;
        let allCorrect = true;
        const playerResults = [];

        // Check if all answers are correct
        this.playerAnswers.forEach((answer, playerId) => {
            const player = this.players.get(playerId);
            const isCorrect = answer === correctAnswer;

            playerResults.push({
                name: player ? player.name : "Unknown Player",
                answer,
                isCorrect,
            });

            if (!isCorrect) {
                allCorrect = false;
            }
        });

        if (allCorrect) {
            // All answers correct, advance to next round
            const nextState = this.startRound();

            return {
                type: "roundSuccess",
                message: "All answers correct!",
                playerResults,
                correctAnswer,
                nextState,
            };
        } else {
            // Failed, restart game
            this.resetGame();
            this.startGame();

            return {
                type: "roundFailure",
                message: "Someone answered incorrectly. Starting over!",
                playerResults,
                correctAnswer,
                nextState: this.getGameState(),
            };
        }
    }

    getGameState() {
        const baseState = super.getGameState();

        // Add player-specific choices
        const stateWithChoices = {
            ...baseState,
            playerChoices: {},
        };

        this.playerChoices.forEach((choices, playerId) => {
            stateWithChoices.playerChoices[playerId] = choices;
        });

        return stateWithChoices;
    }

    // Utility method to shuffle an array
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}

module.exports = TriviaGame;
