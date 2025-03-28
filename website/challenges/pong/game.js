// website/challenges/pong/game.js
import GameModal from "../util/modal.js";

class PongGame {
    constructor() {
        this.canvas = document.getElementById("pongCanvas");
        this.ctx = this.canvas.getContext("2d");

        // Game objects dimensions
        this.paddleWidth = 15;
        this.paddleHeight = 100;
        this.ballSize = 16;

        // Initialize game objects
        this.player = {
            x: 30,
            y: 0, // Will be set properly in resizeCanvas()
            width: this.paddleWidth,
            height: this.paddleHeight,
            color: "#e8d4a9",
            speed: 8,
            moving: 0, // -1 up, 0 none, 1 down
        };

        this.computer = {
            x: 0, // Will be set properly in resizeCanvas()
            y: 0, // Will be set properly in resizeCanvas()
            width: this.paddleWidth,
            height: this.paddleHeight,
            color: "#e77d7d",
            speed: 5,
            difficulty: 0.85, // Higher = more accurate
        };

        // Set canvas dimensions and position game objects
        this.resizeCanvas();
        window.addEventListener("resize", () => this.resizeCanvas());

        // Score elements
        this.playerScoreElem = document.querySelector(".player-score");
        this.computerScoreElem = document.querySelector(".computer-score");

        // Game state
        this.playerScore = 0;
        this.computerScore = 0;
        this.maxScore = 5; // First to 5 wins
        this.paused = false;

        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            size: this.ballSize,
            speed: 5,
            velocityX: 5,
            velocityY: 5,
            color: "#62a0ea",
        };

        // Initialize event listeners
        this.initEventListeners();

        // Create modal
        this.modal = new GameModal();

        // Start the game
        this.showStartModal();
    }

    resizeCanvas() {
        // Keep the canvas responsive
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;

        // Reposition paddles after resize
        this.player.x = 30;
        this.player.y = this.canvas.height / 2 - this.paddleHeight / 2;

        this.computer.x = this.canvas.width - 30 - this.paddleWidth;
        this.computer.y = this.canvas.height / 2 - this.paddleHeight / 2;
    }

    initEventListeners() {
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

        // Touch controls for mobile (canvas)
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

        // On-screen control buttons for mobile
        const upButton = document.querySelector(".up-btn");
        const downButton = document.querySelector(".down-btn");

        // Function to check if device is likely mobile
        const isMobile = () =>
            window.innerWidth <= 768 || "ontouchstart" in window;

        // Up button controls
        const handleUpStart = () => {
            this.player.moving = -1;
        };

        const handleUpEnd = () => {
            if (this.player.moving === -1) {
                this.player.moving = 0;
            }
        };

        // Down button controls
        const handleDownStart = () => {
            this.player.moving = 1;
        };

        const handleDownEnd = () => {
            if (this.player.moving === 1) {
                this.player.moving = 0;
            }
        };

        // Add touch events for mobile
        upButton.addEventListener("touchstart", handleUpStart);
        upButton.addEventListener("touchend", handleUpEnd);
        downButton.addEventListener("touchstart", handleDownStart);
        downButton.addEventListener("touchend", handleDownEnd);

        // Add mouse events for desktop testing
        upButton.addEventListener("mousedown", handleUpStart);
        upButton.addEventListener("mouseup", handleUpEnd);
        upButton.addEventListener("mouseleave", handleUpEnd);
        downButton.addEventListener("mousedown", handleDownStart);
        downButton.addEventListener("mouseup", handleDownEnd);
        downButton.addEventListener("mouseleave", handleDownEnd);

        // Show/hide control buttons based on device
        window.addEventListener("load", () => {
            const controlButtons = document.querySelector(".control-buttons");
            if (isMobile()) {
                controlButtons.style.display = "block";
            } else {
                controlButtons.style.display = "none";
            }
        });

        window.addEventListener("resize", () => {
            const controlButtons = document.querySelector(".control-buttons");
            if (isMobile()) {
                controlButtons.style.display = "block";
            } else {
                controlButtons.style.display = "none";
            }
        });
    }

    showStartModal() {
        this.paused = true;
        this.modal.setContent(`
      <h2 style="text-align: center; margin-bottom: 20px; font-family: 'MedievalSharp', cursive;">Fantasy Pong Challenge</h2>
      <p style="margin-bottom: 15px;">Defeat the magical opponent by being the first to score 5 points!</p>
      <p style="margin-bottom: 20px;">Use your mouse, touch, or arrow keys to move your paddle.</p>
      <div style="text-align: center;">
        <button id="startButton" class="fantasy-button">Begin Quest</button>
      </div>
    `);

        document.getElementById("startButton").addEventListener("click", () => {
            this.modal.hide();
            this.paused = false;
            this.resetBall();
            this.loop();
        });

        this.modal.show();
    }

    showWinModal() {
        this.paused = true;
        this.modal.setContent(`
      <h2 style="text-align: center; margin-bottom: 20px; font-family: 'MedievalSharp', cursive; color: #6da832;">Victory!</h2>
      <p style="margin-bottom: 20px; text-align: center;">You have defeated your opponent ${this.playerScore} to ${this.computerScore}!</p>
      <div style="text-align: center;">
        <button id="nextButton" class="fantasy-button">Continue Journey</button>
      </div>
    `);

        document.getElementById("nextButton").addEventListener("click", () => {
            this.completeChallenge();
            this.modal.hide();
            this.resetGame();
        });

        this.modal.show();
    }

    showLoseModal() {
        this.paused = true;
        this.modal.setContent(`
      <h2 style="text-align: center; margin-bottom: 20px; font-family: 'MedievalSharp', cursive; color: #e77d7d;">Defeat</h2>
      <p style="margin-bottom: 20px; text-align: center;">You were bested ${this.computerScore} to ${this.playerScore}.</p>
      <div style="text-align: center;">
        <button id="retryButton" class="fantasy-button">Try Again</button>
      </div>
    `);

        document.getElementById("retryButton").addEventListener("click", () => {
            this.modal.hide();
            this.resetGame();
        });

        this.modal.show();
    }

    resetGame() {
        this.playerScore = 0;
        this.computerScore = 0;
        this.updateScoreDisplay();
        this.resetBall();
        this.paused = false;
        this.loop();
    }

    resetBall() {
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height / 2;

        // Random direction with preference to go towards the player that just lost
        this.ball.velocityX = this.ball.speed * (Math.random() > 0.5 ? 1 : -1);
        this.ball.velocityY = this.ball.speed * (Math.random() > 0.5 ? 1 : -1);
    }

    updateScoreDisplay() {
        this.playerScoreElem.textContent = this.playerScore;
        this.computerScoreElem.textContent = this.computerScore;
    }

    // Game loop
    loop() {
        if (this.paused) return;

        this.update();
        this.draw();

        requestAnimationFrame(() => this.loop());
    }

    update() {
        // Move player paddle
        if (this.player.moving === -1) {
            this.player.y = Math.max(0, this.player.y - this.player.speed);
        } else if (this.player.moving === 1) {
            this.player.y = Math.min(
                this.canvas.height - this.player.height,
                this.player.y + this.player.speed,
            );
        }

        // Computer AI - smoother movement
        // Target position is the ball's y-position, centered on the paddle
        const targetY =
            this.ball.y + this.ball.size / 2 - this.computer.height / 2;

        // Calculate distance to target
        const distance = targetY - this.computer.y;

        // Move a percentage of the distance each frame for smooth following
        // Higher difficulty = moves faster toward the ball
        this.computer.y += distance * 0.1 * this.computer.difficulty;

        // Keep within canvas
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
            this.computerScore++;
            this.updateScoreDisplay();
            this.resetBall();

            // Check for game end
            if (this.computerScore >= this.maxScore) {
                this.showLoseModal();
            }
        } else if (this.ball.x > this.canvas.width - this.ball.size) {
            // Player scores
            this.playerScore++;
            this.updateScoreDisplay();
            this.resetBall();

            // Check for game end
            if (this.playerScore >= this.maxScore) {
                this.showWinModal();
            }
        }

        // Ball collision with paddles
        // First, check for player paddle collision
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

        // Next, check for computer paddle collision
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
    }

    sparkles = [];

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

    draw() {
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
        this.updateSparkles();
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

    completeChallenge() {
        // Generate a UUID
        const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
            /[xy]/g,
            function (c) {
                const r = (Math.random() * 16) | 0,
                    v = c == "x" ? r : (r & 0x3) | 0x8;
                return v.toString(16);
            },
        );

        // Send POST request to indicate completion
        fetch("/complete", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: `challengeId=${uuid}`,
        })
            .then((response) => {
                console.log(
                    "Challenge completed with status:",
                    response.status,
                );
            })
            .catch((error) => {
                console.error("Error completing challenge:", error);
            });
    }
}

// Initialize the game when DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
    const game = new PongGame();
});
