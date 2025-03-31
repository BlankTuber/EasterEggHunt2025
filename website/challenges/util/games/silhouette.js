import UI from "../ui.js";
import GameComponents from "../components.js";
import GameModal from "../modal.js";

class SilhouetteGame {
    constructor(options = {}) {
        this.options = {
            containerId: "game-container",
            dataSource: null,
            maxHints: 3,
            ...options,
        };

        this.gameData = null;
        this.currentSilhouette = null;
        this.currentIndex = 0;
        this.score = 0;
        this.hintsUsed = 0;

        this.container = document.getElementById(this.options.containerId);

        if (!this.container) {
            console.error("Silhouette game container not found");
            return;
        }

        // Initialize the game
        this.init();
    }

    async init() {
        try {
            // Load game data
            if (typeof this.options.dataSource === "string") {
                const response = await fetch(this.options.dataSource);
                this.gameData = await response.json();
            } else if (typeof this.options.dataSource === "object") {
                this.gameData = this.options.dataSource;
            } else {
                throw new Error("Invalid data source");
            }

            // Create game layout
            this.createGameLayout();

            // Show introduction modal
            this.showIntroModal();
        } catch (error) {
            console.error("Error initializing silhouette game:", error);
            this.showErrorModal(
                "Failed to initialize the game. Please try again.",
            );
        }
    }

    createGameLayout() {
        // Clear container
        this.container.innerHTML = "";

        // Create game layout
        const layout = GameComponents.createGameLayout(
            this.gameData.title || "Shadow Identifier Challenge",
            this.gameData.description || "Can you identify these silhouettes?",
        );

        this.container.appendChild(layout.container);
        this.gameContent = layout.content;

        // Create how to play button
        const howToPlayPages = [
            {
                title: "How to Play",
                description:
                    "You will be shown a series of silhouettes. Try to identify what each silhouette represents.",
                image: "images/tutorial/silhouette-1.jpg",
            },
            {
                title: "Making Guesses",
                description:
                    'Type your guess in the input field and click "Submit" to check your answer.',
                image: "images/tutorial/silhouette-2.jpg",
            },
            {
                title: "Using Hints",
                description:
                    "If you're stuck, you can use hints to help identify the silhouette. Each silhouette has up to 3 hints available.",
                image: "images/tutorial/silhouette-3.jpg",
            },
        ];

        GameComponents.addHowToPlay(layout.container, howToPlayPages);

        // Create score display
        this.createScoreDisplay();

        // Create silhouette display
        this.createSilhouetteDisplay();

        // Create guess input
        this.createGuessInput();

        // Create hint section
        this.createHintSection();

        // Create feedback area
        this.createFeedbackArea();

        // Load first silhouette
        this.shuffleItems();
        this.loadSilhouette();
    }

    createScoreDisplay() {
        // Create score display container
        const scoreContainer = document.createElement("div");
        scoreContainer.className = "score-container";

        // Create score tracker
        this.scoreTracker = GameComponents.createScoreTracker({
            label: "Score",
        });

        // Create progress tracker
        this.progressTracker = GameComponents.createProgressTracker(
            0,
            this.gameData.items.length,
        );

        scoreContainer.appendChild(this.scoreTracker);
        scoreContainer.appendChild(this.progressTracker);

        this.gameContent.appendChild(scoreContainer);
    }

    createSilhouetteDisplay() {
        // Create silhouette container
        this.silhouetteContainer = document.createElement("div");
        this.silhouetteContainer.className = "silhouette-container";
        this.silhouetteContainer.id = "silhouette-container";

        // Create silhouette image
        this.silhouetteImage = document.createElement("img");
        this.silhouetteImage.id = "silhouette-image";
        this.silhouetteImage.alt = "Mystery Silhouette";

        // Create overlay for effects
        const overlay = document.createElement("div");
        overlay.className = "silhouette-overlay";

        this.silhouetteContainer.appendChild(this.silhouetteImage);
        this.silhouetteContainer.appendChild(overlay);

        this.gameContent.appendChild(this.silhouetteContainer);
    }

    createGuessInput() {
        // Create guess container
        const guessContainer = document.createElement("div");
        guessContainer.className = "guess-container";

        // Create guess input
        this.guessInput = UI.createInput(
            "Who or what is this?",
            null,
            "guess-input",
        );
        this.guessInput.id = "guess-input";

        // Add keypress event for enter key
        this.guessInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                this.checkAnswer();
            }
        });

        // Create submit button
        const submitBtn = UI.createButton("Submit", () => this.checkAnswer());

        guessContainer.appendChild(this.guessInput);
        guessContainer.appendChild(submitBtn);

        this.gameContent.appendChild(guessContainer);
    }

    createHintSection() {
        // Create hints container
        const hintsContainer = document.createElement("div");
        hintsContainer.className = "hints-container";

        // Create hint text area
        this.hintText = document.createElement("div");
        this.hintText.className = "hint-text";
        this.hintText.id = "hint-text";

        // Create hint button
        this.hintBtn = UI.createButton("Get Hint", () => this.showHint());

        // Create skip button
        const skipBtn = UI.createButton("Skip", () => this.skipSilhouette());

        hintsContainer.appendChild(this.hintText);
        hintsContainer.appendChild(this.hintBtn);
        hintsContainer.appendChild(skipBtn);

        this.gameContent.appendChild(hintsContainer);
    }

    createFeedbackArea() {
        // Create feedback area
        this.feedback = document.createElement("div");
        this.feedback.className = "feedback";
        this.feedback.id = "feedback";

        this.gameContent.appendChild(this.feedback);
    }

    shuffleItems() {
        // Shuffle items
        this.gameData.items = [...this.gameData.items].sort(
            () => Math.random() - 0.5,
        );
    }

    loadSilhouette() {
        // Reset UI
        this.silhouetteContainer.classList.remove("reveal");
        this.guessInput.value = "";
        this.feedback.textContent = "";
        this.feedback.className = "feedback";
        this.hintText.textContent = "";
        this.hintsUsed = 0;
        this.hintBtn.disabled = false;
        this.hintBtn.style.opacity = "1";

        // Check if game is over
        if (this.currentIndex >= this.gameData.items.length) {
            this.gameOver();
            return;
        }

        // Load current silhouette
        this.currentSilhouette = this.gameData.items[this.currentIndex];
        this.silhouetteImage.src = this.currentSilhouette.image;

        // Update progress
        this.progressTracker.update(this.currentIndex + 1);

        // Focus on input
        this.guessInput.focus();
    }

    checkAnswer() {
        const guess = this.guessInput.value.trim().toLowerCase();

        if (guess === "") {
            this.showFeedback("Please enter a guess!", "error");
            return;
        }

        const correctAnswers = Array.isArray(this.currentSilhouette.answers)
            ? this.currentSilhouette.answers.map((a) => a.toLowerCase())
            : [this.currentSilhouette.name.toLowerCase()];

        // Check if answer is correct
        if (correctAnswers.includes(guess)) {
            this.handleCorrectAnswer();
        } else {
            this.handleIncorrectAnswer();
        }
    }

    handleCorrectAnswer() {
        // Update score
        this.score++;
        this.scoreTracker.updateScore(this.score);

        // Show feedback
        this.showFeedback(
            `Correct! That's ${this.currentSilhouette.name}.`,
            "success",
        );

        // Reveal silhouette
        this.silhouetteContainer.classList.add("reveal");
        this.silhouetteContainer.classList.add("correct-answer");

        // Wait before moving to next
        setTimeout(() => {
            this.silhouetteContainer.classList.remove("correct-answer");
            this.currentIndex++;
            this.loadSilhouette();
        }, 1500);
    }

    handleIncorrectAnswer() {
        // Show feedback
        this.showFeedback("Sorry, that's not correct. Try again!", "error");

        // Shake input
        this.guessInput.classList.add("shake-animation");
        setTimeout(() => {
            this.guessInput.classList.remove("shake-animation");
        }, 500);
    }

    showHint() {
        if (
            this.hintsUsed >= this.currentSilhouette.hints.length ||
            this.hintsUsed >= this.options.maxHints
        ) {
            this.hintText.textContent = "No more hints available!";
            return;
        }

        this.hintText.textContent =
            this.currentSilhouette.hints[this.hintsUsed];
        this.hintsUsed++;

        // Disable hint button if no more hints
        if (
            this.hintsUsed >= this.currentSilhouette.hints.length ||
            this.hintsUsed >= this.options.maxHints
        ) {
            this.hintBtn.disabled = true;
            this.hintBtn.style.opacity = "0.5";
        }
    }

    skipSilhouette() {
        // Reveal silhouette
        this.silhouetteContainer.classList.add("reveal");

        // Show feedback
        this.showFeedback(`This was ${this.currentSilhouette.name}.`, "error");

        // Wait before moving to next
        setTimeout(() => {
            this.currentIndex++;
            this.loadSilhouette();
        }, 1500);
    }

    showFeedback(message, type) {
        this.feedback.textContent = message;
        this.feedback.className = `feedback ${type}`;
    }

    gameOver() {
        const percentage = Math.round(
            (this.score / this.gameData.items.length) * 100,
        );

        // Create result modal
        const modal = new GameModal();

        if (percentage === 100) {
            // Perfect score - complete challenge
            GameComponents.handleGameCompletion();

            modal.setContent(`
                <h2 style="text-align: center; margin-bottom: 20px; color: var(--color-success);">Perfect Score!</h2>
                <p style="margin-bottom: 20px; text-align: center;">
                    You got them all! Score: ${this.score} out of ${this.gameData.items.length}
                </p>
            `);

            modal.addButton("Complete", () => {
                modal.hide();
                this.restartGame();
            });
        } else {
            modal.setContent(`
                <h2 style="text-align: center; margin-bottom: 20px;">Game Complete!</h2>
                <p style="margin-bottom: 20px; text-align: center;">
                    You scored ${this.score} out of ${this.gameData.items.length} (${percentage}%)
                </p>
            `);

            modal.addButton("Play Again", () => {
                modal.hide();
                this.restartGame();
            });
        }

        modal.show();
    }

    restartGame() {
        // Reset game state
        this.currentIndex = 0;
        this.score = 0;
        this.scoreTracker.updateScore(0);

        // Reshuffle items
        this.shuffleItems();

        // Load first silhouette
        this.loadSilhouette();
    }

    showIntroModal() {
        const modal = new GameModal();
        modal.setContent(`
            <h2 style="text-align: center; margin-bottom: 20px;">${
                this.gameData.title || "Shadow Identifier Challenge"
            }</h2>
            <p style="margin-bottom: 20px; text-align: center;">
                ${
                    this.gameData.description ||
                    "Can you identify these silhouettes?"
                }
            </p>
        `);

        modal.addButton("Start Game", () => modal.hide());
        modal.show();
    }

    showErrorModal(message) {
        const modal = new GameModal();
        modal.setContent(`
            <h2 style="text-align: center; margin-bottom: 20px; color: var(--color-error);">Error</h2>
            <p style="margin-bottom: 20px; text-align: center;">
                ${message}
            </p>
        `);

        modal.addButton("Reload", () => window.location.reload());
        modal.show();
    }
}

export default SilhouetteGame;
