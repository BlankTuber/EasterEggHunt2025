import UI from "../ui.js";
import GameComponents from "../components.js";
import GameModal from "../modal.js";

class ArcadeGame {
    constructor(options = {}) {
        this.options = {
            containerId: "game-container",
            type: "pong", // pong, whack-a-mole, memory, etc.
            winCondition: { type: "score", value: 5 },
            difficulty: "normal",
            ...options,
        };

        this.container = document.getElementById(this.options.containerId);

        if (!this.container) {
            console.error("Arcade game container not found");
            return;
        }

        // Game state
        this.gameActive = false;
        this.paused = true;

        // Initialize the game
        this.init();
    }

    init() {
        // Create game layout
        this.createGameLayout();

        // Show introduction modal
        this.showIntroModal();
    }

    createGameLayout() {
        // Clear container
        this.container.innerHTML = "";

        // Create game layout based on type
        switch (this.options.type) {
            case "pong":
                this.createPongLayout();
                break;
            case "whack-a-mole":
                this.createWhackAMoleLayout();
                break;
            case "memory":
                this.createMemoryLayout();
                break;
            default:
                this.createDefaultLayout();
        }
    }

    createDefaultLayout() {
        // Create game layout
        const layout = GameComponents.createGameLayout(
            "Arcade Challenge",
            "Test your gaming skills to continue your journey.",
        );

        this.container.appendChild(layout.container);
        this.gameContent = layout.content;

        // Create canvas
        this.canvas = document.createElement("canvas");
        this.canvas.id = "game-canvas";
        this.canvas.className = "game-canvas";
        this.ctx = this.canvas.getContext("2d");

        this.gameContent.appendChild(this.canvas);

        // Create touch controls
        this.createTouchControls();
    }

    createPongLayout() {
        // Create game layout
        const layout = GameComponents.createGameLayout(
            "Fantasy Pong Challenge",
            "Defeat your opponent to continue your journey.",
        );

        this.container.appendChild(layout.container);
        this.gameContent = layout.content;

        // Create how to play button
        const howToPlayPages = [
            {
                title: "How to Play",
                description:
                    "Control your paddle to prevent the ball from passing your side. Score points by getting the ball past your opponent's paddle.",
                image: "images/tutorial/pong-1.jpg",
            },
            {
                title: "Controls",
                description:
                    "Use your mouse, touch, or arrow keys to move your paddle up and down.",
                image: "images/tutorial/pong-2.jpg",
            },
            {
                title: "Winning",
                description:
                    "The first player to reach 5 points wins the game.",
                image: "images/tutorial/pong-3.jpg",
            },
        ];

        GameComponents.addHowToPlay(layout.container, howToPlayPages);

        // Create score display
        this.createScoreDisplay();

        // Create canvas
        this.canvas = document.createElement("canvas");
        this.canvas.id = "pongCanvas";
        this.canvas.className = "game-canvas";
        this.ctx = this.canvas.getContext("2d");

        this.gameContent.appendChild(this.canvas);

        // Create touch controls
        this.createTouchControls();

        // Set canvas dimensions
        this.resizeCanvas();
        window.addEventListener("resize", () => this.resizeCanvas());
    }

    createWhackAMoleLayout() {
        // Create game layout
        const layout = GameComponents.createGameLayout(
            "Whack-a-Mole Challenge",
            "Test your reflexes to continue your journey.",
        );

        this.container.appendChild(layout.container);
        this.gameContent = layout.content;

        // Create how to play button
        const howToPlayPages = [
            {
                title: "How to Play",
                description:
                    "Tap or click on the creatures as they appear. The faster you are, the more points you earn.",
                image: "images/tutorial/whack-1.jpg",
            },
            {
                title: "Scoring",
                description:
                    "Each successful hit earns you points. Consecutive hits earn bonus points.",
                image: "images/tutorial/whack-2.jpg",
            },
            {
                title: "Winning",
                description:
                    "Reach the target score within the time limit to win.",
                image: "images/tutorial/whack-3.jpg",
            },
        ];

        GameComponents.addHowToPlay(layout.container, howToPlayPages);

        // Create score display
        this.createScoreDisplay();

        // Create game grid
        this.createWhackAMoleGrid();
    }

    createMemoryLayout() {
        // Create game layout
        const layout = GameComponents.createGameLayout(
            "Memory Card Challenge",
            "Find matching pairs to continue your journey.",
        );

        this.container.appendChild(layout.container);
        this.gameContent = layout.content;

        // Create how to play button
        const howToPlayPages = [
            {
                title: "How to Play",
                description:
                    "Flip cards to find matching pairs. Remember the positions of the cards you've seen.",
                image: "images/tutorial/memory-1.jpg",
            },
            {
                title: "Matching",
                description:
                    "When you find a matching pair, they'll remain face up. Otherwise, they'll flip back face down.",
                image: "images/tutorial/memory-2.jpg",
            },
            {
                title: "Winning",
                description: "Match all pairs to complete the challenge.",
                image: "images/tutorial/memory-3.jpg",
            },
        ];

        GameComponents.addHowToPlay(layout.container, howToPlayPages);

        // Create score display
        this.createScoreDisplay();

        // Create memory grid
        this.createMemoryGrid();
    }

    createScoreDisplay() {
        // Create score container
        const scoreBoard = document.createElement("div");
        scoreBoard.className = "score-board";

        // Create player score
        this.playerScore = document.createElement("div");
        this.playerScore.className = "player-score";
        this.playerScore.textContent = "0";

        // Create computer/opponent score
        this.computerScore = document.createElement("div");
        this.computerScore.className = "computer-score";
        this.computerScore.textContent = "0";

        scoreBoard.appendChild(this.playerScore);
        scoreBoard.appendChild(this.computerScore);

        this.gameContent.appendChild(scoreBoard);
    }

    createWhackAMoleGrid() {
        // Create grid container
        const gridContainer = document.createElement("div");
        gridContainer.className = "whack-grid";

        // Create holes
        for (let i = 0; i < 9; i++) {
            const hole = document.createElement("div");
            hole.className = "whack-hole";

            const mole = document.createElement("div");
            mole.className = "whack-mole";
            mole.dataset.index = i;

            hole.appendChild(mole);
            gridContainer.appendChild(hole);

            // Add event listener
            mole.addEventListener("click", () => this.whackMole(mole));
            mole.addEventListener("touchstart", (e) => {
                e.preventDefault();
                this.whackMole(mole);
            });
        }

        this.gameContent.appendChild(gridContainer);
    }

    createMemoryGrid() {
        // Create grid container
        const gridContainer = document.createElement("div");
        gridContainer.className = "memory-grid";

        // Define card symbols (pairs)
        const symbols = ["🐉", "🧙", "🏰", "⚔️", "🛡️", "📜", "🔮", "🧪"];
        const pairs = [...symbols, ...symbols];

        // Shuffle cards
        const shuffledCards = this.shuffleArray(pairs);

        // Create cards
        for (let i = 0; i < shuffledCards.length; i++) {
            const card = document.createElement("div");
            card.className = "memory-card";
            card.dataset.symbol = shuffledCards[i];
            card.dataset.index = i;

            const cardBack = document.createElement("div");
            cardBack.className = "card-back";
            cardBack.textContent = "?";

            const cardFront = document.createElement("div");
            cardFront.className = "card-front";
            cardFront.textContent = shuffledCards[i];

            card.appendChild(cardBack);
            card.appendChild(cardFront);
            gridContainer.appendChild(card);

            // Add event listener
            card.addEventListener("click", () => this.flipCard(card));
        }

        this.gameContent.appendChild(gridContainer);
    }

    createTouchControls() {
        // Create controls based on game type
        switch (this.options.type) {
            case "pong":
                this.createPongControls();
                break;
            default:
                // No specific controls for other games
                break;
        }
    }

    createPongControls() {
        // Create control buttons container
        const controlButtons = document.createElement("div");
        controlButtons.className = "control-buttons";

        // Create up button
        const upBtn = document.createElement("div");
        upBtn.className = "control-btn up-btn";
        upBtn.innerHTML = "<span>▲</span>";

        // Create down button
        const downBtn = document.createElement("div");
        downBtn.className = "control-btn down-btn";
        downBtn.innerHTML = "<span>▼</span>";

        controlButtons.appendChild(upBtn);
        controlButtons.appendChild(downBtn);

        this.container.appendChild(controlButtons);

        // Add event handlers
        const handleUpStart = () => {
            if (this.player) this.player.moving = -1;
        };

        const handleUpEnd = () => {
            if (this.player && this.player.moving === -1) {
                this.player.moving = 0;
            }
        };

        const handleDownStart = () => {
            if (this.player) this.player.moving = 1;
        };

        const handleDownEnd = () => {
            if (this.player && this.player.moving === 1) {
                this.player.moving = 0;
            }
        };

        // Add touch events
        upBtn.addEventListener("touchstart", handleUpStart);
        upBtn.addEventListener("touchend", handleUpEnd);
        downBtn.addEventListener("touchstart", handleDownStart);
        downBtn.addEventListener("touchend", handleDownEnd);

        // Add mouse events for desktop testing
        upBtn.addEventListener("mousedown", handleUpStart);
        upBtn.addEventListener("mouseup", handleUpEnd);
        upBtn.addEventListener("mouseleave", handleUpEnd);
        downBtn.addEventListener("mousedown", handleDownStart);
        downBtn.addEventListener("mouseup", handleDownEnd);
        downBtn.addEventListener("mouseleave", handleDownEnd);

        // Show/hide buttons based on device
        const updateControlsVisibility = () => {
            const isMobile =
                window.innerWidth <= 768 || "ontouchstart" in window;
            controlButtons.style.display = isMobile ? "flex" : "none";
        };

        window.addEventListener("load", updateControlsVisibility);
        window.addEventListener("resize", updateControlsVisibility);
    }

    resizeCanvas() {
        if (!this.canvas) return;

        // Set canvas size to match container
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;

        // Reposition game objects if needed
        if (this.options.type === "pong") {
            this.repositionPongObjects();
        }
    }

    repositionPongObjects() {
        if (!this.player || !this.computer || !this.ball) return;

        // Position player paddle
        this.player.x = 30;
        this.player.y = this.canvas.height / 2 - this.player.height / 2;

        // Position computer paddle
        this.computer.x = this.canvas.width - 30 - this.computer.width;
        this.computer.y = this.canvas.height / 2 - this.computer.height / 2;

        // Reset ball position
        this.resetBall();
    }

    startGame() {
        this.gameActive = true;
        this.paused = false;

        switch (this.options.type) {
            case "pong":
                this.startPongGame();
                break;
            case "whack-a-mole":
                this.startWhackAMoleGame();
                break;
            case "memory":
                // Memory game starts immediately, no additional setup needed
                break;
            default:
                // Generic game start
                this.gameLoop();
        }
    }

    startPongGame() {
        // Initialize game objects
        this.initPongObjects();

        // Set up event listeners
        this.setupPongControls();

        // Start game loop
        this.gameLoop();
    }

    initPongObjects() {
        // Game objects dimensions
        this.paddleWidth = 15;
        this.paddleHeight = 100;
        this.ballSize = 16;

        // Initialize player paddle
        this.player = {
            x: 30,
            y: this.canvas.height / 2 - this.paddleHeight / 2,
            width: this.paddleWidth,
            height: this.paddleHeight,
            color: "#e8d4a9",
            speed: 8,
            moving: 0, // -1 up, 0 none, 1 down
        };

        // Initialize computer paddle
        this.computer = {
            x: this.canvas.width - 30 - this.paddleWidth,
            y: this.canvas.height / 2 - this.paddleHeight / 2,
            width: this.paddleWidth,
            height: this.paddleHeight,
            color: "#e77d7d",
            speed: 5,
            difficulty: this.getDifficultyValue(),
        };

        // Initialize ball
        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            size: this.ballSize,
            speed: 5,
            velocityX: 5,
            velocityY: 5,
            color: "#62a0ea",
        };

        // Initialize score
        this.pongScore = {
            player: 0,
            computer: 0,
        };

        // Update score display
        this.updateScoreDisplay();

        // Initialize sparkles array
        this.sparkles = [];
    }

    getDifficultyValue() {
        // Return difficulty value based on option
        switch (this.options.difficulty) {
            case "easy":
                return 0.7;
            case "normal":
                return 0.85;
            case "hard":
                return 0.95;
            default:
                return 0.85;
        }
    }

    setupPongControls() {
        // Keyboard controls
        document.addEventListener("keydown", (e) => {
            if (e.key === "ArrowUp") {
                this.player.moving = -1;
            } else if (e.key === "ArrowDown") {
                this.player.moving = 1;
            }
        });

        document.addEventListener("keyup", (e) => {
            if (e.key === "ArrowUp" && this.player.moving === -1) {
                this.player.moving = 0;
            } else if (e.key === "ArrowDown" && this.player.moving === 1) {
                this.player.moving = 0;
            }
        });

        // Mouse controls
        this.canvas.addEventListener("mousemove", (e) => {
            const canvasRect = this.canvas.getBoundingClientRect();
            const mouseY = e.clientY - canvasRect.top;
            this.player.y = mouseY - this.player.height / 2;

            // Keep paddle within canvas
            this.player.y = Math.max(
                0,
                Math.min(
                    this.canvas.height - this.player.height,
                    this.player.y,
                ),
            );
        });

        // Touch controls for canvas
        this.canvas.addEventListener("touchmove", (e) => {
            e.preventDefault();
            const canvasRect = this.canvas.getBoundingClientRect();
            const touchY = e.touches[0].clientY - canvasRect.top;
            this.player.y = touchY - this.player.height / 2;

            // Keep paddle within canvas
            this.player.y = Math.max(
                0,
                Math.min(
                    this.canvas.height - this.player.height,
                    this.player.y,
                ),
            );
        });
    }

    startWhackAMoleGame() {
        // Initialize game state
        this.whackScore = 0;
        this.updateWhackScore(0);

        // Set game duration
        this.gameStartTime = Date.now();
        this.gameDuration = 60000; // 60 seconds

        // Start spawning moles
        this.nextMoleTimeout = setTimeout(() => this.spawnMole(), 1000);

        // Start timer
        this.timerInterval = setInterval(() => this.updateWhackTimer(), 1000);
    }

    gameLoop() {
        if (this.paused) return;

        switch (this.options.type) {
            case "pong":
                this.updatePong();
                this.drawPong();
                break;
            default:
                // Generic game loop
                this.update();
                this.draw();
        }

        requestAnimationFrame(() => this.gameLoop());
    }

    updatePong() {
        // Move player paddle
        if (this.player.moving === -1) {
            this.player.y = Math.max(0, this.player.y - this.player.speed);
        } else if (this.player.moving === 1) {
            this.player.y = Math.min(
                this.canvas.height - this.player.height,
                this.player.y + this.player.speed,
            );
        }

        // Computer AI
        const targetY =
            this.ball.y + this.ball.size / 2 - this.computer.height / 2;
        const distance = targetY - this.computer.y;
        this.computer.y += distance * 0.1 * this.computer.difficulty;

        // Keep computer paddle within canvas
        this.computer.y = Math.max(
            0,
            Math.min(
                this.canvas.height - this.computer.height,
                this.computer.y,
            ),
        );

        // Move ball
        this.ball.x += this.ball.velocityX;
        this.ball.y += this.ball.velocityY;

        // Ball collision with top and bottom walls
        if (
            this.ball.y < 0 ||
            this.ball.y > this.canvas.height - this.ball.size
        ) {
            this.ball.velocityY = -this.ball.velocityY;

            // Keep ball within canvas
            this.ball.y =
                this.ball.y < 0 ? 0 : this.canvas.height - this.ball.size;
        }

        // Ball collision with left and right walls (scoring)
        if (this.ball.x < 0) {
            // Computer scores
            this.pongScore.computer++;
            this.updateScoreDisplay();
            this.resetBall();

            // Check for game end
            if (this.pongScore.computer >= this.options.winCondition.value) {
                this.showLoseModal();
            }
        } else if (this.ball.x > this.canvas.width - this.ball.size) {
            // Player scores
            this.pongScore.player++;
            this.updateScoreDisplay();
            this.resetBall();

            // Check for game end
            if (this.pongScore.player >= this.options.winCondition.value) {
                this.showWinModal();
            }
        }

        // Ball collision with paddles
        // Player paddle collision
        if (
            this.ball.x < this.player.x + this.player.width &&
            this.ball.x + this.ball.size > this.player.x &&
            this.ball.y < this.player.y + this.player.height &&
            this.ball.y + this.ball.size > this.player.y
        ) {
            // Ball hit player paddle
            this.ball.velocityX = -this.ball.velocityX * 1.05; // Increase speed slightly

            // Calculate angle based on where the ball hit the paddle
            const hitPosition =
                (this.ball.y - this.player.y) / this.player.height;
            const angle = hitPosition * 2 - 1; // -1 to 1
            this.ball.velocityY = this.ball.speed * angle * 1.5;

            // Add sparkle effect
            this.createSparkle(this.player.x + this.player.width, this.ball.y);
        }

        // Computer paddle collision
        if (
            this.ball.x < this.computer.x + this.computer.width &&
            this.ball.x + this.ball.size > this.computer.x &&
            this.ball.y < this.computer.y + this.computer.height &&
            this.ball.y + this.ball.size > this.computer.y
        ) {
            // Ball hit computer paddle
            this.ball.velocityX = -this.ball.velocityX * 1.05; // Increase speed slightly

            // Calculate angle based on where the ball hit the paddle
            const hitPosition =
                (this.ball.y - this.computer.y) / this.computer.height;
            const angle = hitPosition * 2 - 1; // -1 to 1
            this.ball.velocityY = this.ball.speed * angle * 1.5;

            // Add sparkle effect
            this.createSparkle(this.computer.x, this.ball.y);
        }

        // Update sparkles
        this.updateSparkles();
    }

    drawPong() {
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw center line
        this.ctx.beginPath();
        this.ctx.setLineDash([10, 15]);
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = "rgba(232, 212, 169, 0.3)";
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Draw sparkles
        this.drawSparkles();

        // Draw player paddle with glow effect
        this.ctx.shadowColor = "#e8d4a9";
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = this.player.color;
        this.ctx.fillRect(
            this.player.x,
            this.player.y,
            this.player.width,
            this.player.height,
        );

        // Draw computer paddle with glow effect
        this.ctx.shadowColor = "#e77d7d";
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = this.computer.color;
        this.ctx.fillRect(
            this.computer.x,
            this.computer.y,
            this.computer.width,
            this.computer.height,
        );

        // Turn off shadow for the ball
        this.ctx.shadowBlur = 0;

        // Draw the ball with gradient
        const gradient = this.ctx.createRadialGradient(
            this.ball.x + this.ball.size / 2,
            this.ball.y + this.ball.size / 2,
            0,
            this.ball.x + this.ball.size / 2,
            this.ball.y + this.ball.size / 2,
            this.ball.size,
        );
        gradient.addColorStop(0, "#a9e8e1");
        gradient.addColorStop(1, "#62a0ea");

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(
            this.ball.x + this.ball.size / 2,
            this.ball.y + this.ball.size / 2,
            this.ball.size / 2,
            0,
            Math.PI * 2,
        );
        this.ctx.fill();
    }

    createSparkle(x, y) {
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;

            this.sparkles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 1 + Math.random() * 3,
                color: `hsl(${Math.random() * 60 + 40}, 100%, 70%)`,
                alpha: 1,
                decay: 0.02 + Math.random() * 0.03,
            });
        }
    }

    updateSparkles() {
        for (let i = this.sparkles.length - 1; i >= 0; i--) {
            const sparkle = this.sparkles[i];

            sparkle.x += sparkle.vx;
            sparkle.y += sparkle.vy;
            sparkle.alpha -= sparkle.decay;

            if (sparkle.alpha <= 0) {
                this.sparkles.splice(i, 1);
            }
        }
    }

    drawSparkles() {
        for (const sparkle of this.sparkles) {
            this.ctx.beginPath();
            this.ctx.arc(sparkle.x, sparkle.y, sparkle.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = sparkle.color.replace(
                ")",
                `, ${sparkle.alpha})`,
            );
            this.ctx.fill();
        }
    }

    resetBall() {
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height / 2;

        // Random direction with preference to go towards the player that just lost
        this.ball.velocityX = this.ball.speed * (Math.random() > 0.5 ? 1 : -1);
        this.ball.velocityY = this.ball.speed * (Math.random() > 0.5 ? 1 : -1);
    }

    updateScoreDisplay() {
        if (this.playerScore && this.computerScore) {
            this.playerScore.textContent = this.pongScore.player;
            this.computerScore.textContent = this.pongScore.computer;
        }
    }

    spawnMole() {
        if (!this.gameActive) return;

        // Get all moles
        const moles = document.querySelectorAll(".whack-mole");
        if (!moles.length) return;

        // Randomly select a mole
        const randomIndex = Math.floor(Math.random() * moles.length);
        const mole = moles[randomIndex];

        // Make mole appear
        mole.classList.add("active");

        // Hide mole after random time
        const stayUpTime = 1000 + Math.random() * 1000; // 1-2 seconds
        setTimeout(() => {
            if (mole.classList.contains("active")) {
                mole.classList.remove("active");
            }

            // Schedule next mole
            if (this.gameActive) {
                const nextMoleDelay = 500 + Math.random() * 1000; // 0.5-1.5 seconds
                this.nextMoleTimeout = setTimeout(
                    () => this.spawnMole(),
                    nextMoleDelay,
                );
            }
        }, stayUpTime);
    }

    whackMole(mole) {
        if (!mole.classList.contains("active")) return;

        // Remove active class
        mole.classList.remove("active");

        // Add hit animation
        mole.classList.add("hit");
        setTimeout(() => {
            mole.classList.remove("hit");
        }, 300);

        // Update score
        this.updateWhackScore(this.whackScore + 1);

        // Check win condition
        if (this.whackScore >= this.options.winCondition.value) {
            this.gameActive = false;
            clearTimeout(this.nextMoleTimeout);
            clearInterval(this.timerInterval);
            this.showWinModal();
        }
    }

    updateWhackScore(score) {
        this.whackScore = score;
        this.playerScore.textContent = score;
    }

    updateWhackTimer() {
        const timeElapsed = Date.now() - this.gameStartTime;
        const timeLeft = Math.max(0, this.gameDuration - timeElapsed);

        // Update timer display
        this.computerScore.textContent = Math.ceil(timeLeft / 1000);

        // Check if time is up
        if (timeLeft <= 0) {
            this.gameActive = false;
            clearTimeout(this.nextMoleTimeout);
            clearInterval(this.timerInterval);

            // Check score against win condition
            if (this.whackScore >= this.options.winCondition.value) {
                this.showWinModal();
            } else {
                this.showLoseModal();
            }
        }
    }

    flipCard(card) {
        // Check if card is already flipped or matched
        if (
            card.classList.contains("flipped") ||
            card.classList.contains("matched")
        ) {
            return;
        }

        // Flip the card
        card.classList.add("flipped");

        // Check if two cards are flipped
        const flippedCards = document.querySelectorAll(
            ".memory-card.flipped:not(.matched)",
        );

        if (flippedCards.length === 2) {
            // Disable further flips temporarily
            this.lockBoard = true;

            // Check for match
            setTimeout(() => this.checkForMatch(flippedCards), 1000);
        }
    }

    checkForMatch(cards) {
        const [card1, card2] = cards;

        if (card1.dataset.symbol === card2.dataset.symbol) {
            // Match found
            card1.classList.add("matched");
            card2.classList.add("matched");

            // Update score
            this.updateMemoryScore(this.memoryScore + 1);

            // Check if all pairs are matched
            const allMatched =
                document.querySelectorAll(".memory-card.matched").length === 16; // Assuming 8 pairs

            if (allMatched) {
                this.showWinModal();
            }
        } else {
            // No match, flip cards back
            card1.classList.remove("flipped");
            card2.classList.remove("flipped");
        }

        // Unlock board
        this.lockBoard = false;
    }

    updateMemoryScore(score) {
        this.memoryScore = score;
        this.playerScore.textContent = score;

        // Update max score
        this.computerScore.textContent = "8"; // Total number of pairs
    }

    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    showWinModal() {
        this.paused = true;

        const modal = new GameModal();
        modal.setContent(`
            <h2 style="text-align: center; margin-bottom: 20px; color: var(--color-success);">Victory!</h2>
            <p style="margin-bottom: 20px; text-align: center;">
                You have successfully completed the challenge!
            </p>
        `);

        modal.addButton("Continue Journey", () => {
            modal.hide();
            this.completeChallenge();
        });

        modal.show();
    }

    showLoseModal() {
        this.paused = true;

        const modal = new GameModal();
        modal.setContent(`
            <h2 style="text-align: center; margin-bottom: 20px; color: var(--color-error);">Defeat</h2>
            <p style="margin-bottom: 20px; text-align: center;">
                You were not able to complete the challenge. Would you like to try again?
            </p>
        `);

        modal.addButton("Try Again", () => {
            modal.hide();
            this.resetGame();
        });

        modal.show();
    }

    resetGame() {
        this.gameActive = true;
        this.paused = false;

        switch (this.options.type) {
            case "pong":
                // Reset score
                this.pongScore.player = 0;
                this.pongScore.computer = 0;
                this.updateScoreDisplay();

                // Reset ball
                this.resetBall();

                // Start game loop
                this.gameLoop();
                break;
            case "whack-a-mole":
                // Clear existing timeouts/intervals
                clearTimeout(this.nextMoleTimeout);
                clearInterval(this.timerInterval);

                // Restart game
                this.startWhackAMoleGame();
                break;
            case "memory":
                // Reset memory grid
                const cards = document.querySelectorAll(".memory-card");
                cards.forEach((card) => {
                    card.classList.remove("flipped", "matched");
                });

                // Reset score
                this.memoryScore = 0;
                this.updateMemoryScore(0);
                break;
            default:
                // Generic reset
                this.gameLoop();
        }
    }

    completeChallenge() {
        // Complete the challenge
        GameComponents.handleGameCompletion();
    }

    showIntroModal() {
        let title, description;

        // Set title and description based on game type
        switch (this.options.type) {
            case "pong":
                title = "Fantasy Pong Challenge";
                description =
                    "Defeat the magical opponent by being the first to score 5 points!";
                break;
            case "whack-a-mole":
                title = "Whack-a-Mole Challenge";
                description =
                    "Test your reflexes by whacking creatures as they appear!";
                break;
            case "memory":
                title = "Memory Card Challenge";
                description =
                    "Find all matching pairs to complete the challenge!";
                break;
            default:
                title = "Arcade Challenge";
                description =
                    "Test your gaming skills to continue your journey.";
        }

        const modal = new GameModal();
        modal.setContent(`
            <h2 style="text-align: center; margin-bottom: 20px;">${title}</h2>
            <p style="margin-bottom: 20px; text-align: center;">
                ${description}
            </p>
        `);

        modal.addButton("Begin Challenge", () => {
            modal.hide();
            this.startGame();
        });

        modal.show();
    }
}

export default ArcadeGame;
