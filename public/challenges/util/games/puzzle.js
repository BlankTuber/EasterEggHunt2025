import UI from "../ui.js";
import GameComponents from "../components.js";
import GameModal from "../modal.js";

class PuzzleGame {
    constructor(options = {}) {
        this.options = {
            containerId: "game-container",
            type: "cipher", // cipher, sequence, etc.
            maxHints: 3,
            levels: [],
            ...options,
        };

        this.container = document.getElementById(this.options.containerId);

        if (!this.container) {
            console.error("Puzzle game container not found");
            return;
        }

        // Game state
        this.currentLevel = 0;
        this.hintsUsed = 0;
        this.maxHints = this.options.maxHints;
        this.gameActive = false;

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
            case "cipher":
                this.createCipherLayout();
                break;
            case "sequence":
                this.createSequenceLayout();
                break;
            default:
                this.createDefaultLayout();
        }
    }

    createDefaultLayout() {
        // Create game layout
        const layout = GameComponents.createGameLayout(
            "Puzzle Challenge",
            "Solve the puzzle to continue your journey.",
        );

        this.container.appendChild(layout.container);
        this.gameContent = layout.content;

        // Create how to play button
        const howToPlayPages = [
            {
                title: "How to Play",
                description:
                    "This is a puzzle challenge. Follow the instructions to solve each level.",
                image: "images/tutorial/puzzle-1.jpg",
            },
            {
                title: "Using Hints",
                description:
                    "If you get stuck, you can use hints to help solve the puzzle.",
                image: "images/tutorial/puzzle-2.jpg",
            },
        ];

        GameComponents.addHowToPlay(layout.container, howToPlayPages);

        // Create progress tracker
        this.progressTracker = GameComponents.createProgressTracker(
            1,
            this.options.levels.length,
        );
        this.gameContent.appendChild(this.progressTracker);

        // Create puzzle content area
        this.puzzleArea = document.createElement("div");
        this.puzzleArea.className = "puzzle-area";
        this.gameContent.appendChild(this.puzzleArea);

        // Create input area
        this.createInputArea();

        // Create hint area
        this.createHintArea();
    }

    createCipherLayout() {
        // Create game layout
        const layout = GameComponents.createGameLayout(
            "Cipher Challenge",
            "Decrypt the encoded messages to reveal hidden words.",
        );

        this.container.appendChild(layout.container);
        this.gameContent = layout.content;

        // Create how to play button
        const howToPlayPages = [
            {
                title: "How to Play",
                description:
                    "This is a cipher challenge. You'll see encrypted messages that you need to decrypt.",
                image: "images/tutorial/cipher-1.jpg",
            },
            {
                title: "Decryption",
                description:
                    "Use the shift controls to try different letter shifts. Each letter in the encrypted message is replaced by another letter a fixed number of positions away in the alphabet.",
                image: "images/tutorial/cipher-2.jpg",
            },
            {
                title: "Answer Submission",
                description:
                    "Once you've decrypted the message, enter the secret word in the answer box and submit.",
                image: "images/tutorial/cipher-3.jpg",
            },
        ];

        GameComponents.addHowToPlay(layout.container, howToPlayPages);

        // Create progress tracker
        this.progressTracker = GameComponents.createProgressTracker(
            1,
            this.options.levels.length,
        );
        this.gameContent.appendChild(this.progressTracker);

        // Create message containers
        this.createMessageContainers();

        // Create shift controls
        this.createShiftControls();

        // Create input area
        this.createInputArea();

        // Create hint area
        this.createHintArea();
    }

    createSequenceLayout() {
        // Create game layout
        const layout = GameComponents.createGameLayout(
            "Sequence Challenge",
            "Identify the pattern and find the next number in each sequence.",
        );

        this.container.appendChild(layout.container);
        this.gameContent = layout.content;

        // Create how to play button
        const howToPlayPages = [
            {
                title: "How to Play",
                description:
                    "This is a sequence challenge. You'll see a series of numbers following a pattern.",
                image: "images/tutorial/sequence-1.jpg",
            },
            {
                title: "Finding Patterns",
                description:
                    "Look for mathematical patterns in the numbers. What operation connects each number to the next?",
                image: "images/tutorial/sequence-2.jpg",
            },
            {
                title: "Answer Submission",
                description:
                    "Once you've identified the pattern, enter the next number in the sequence and submit.",
                image: "images/tutorial/sequence-3.jpg",
            },
        ];

        GameComponents.addHowToPlay(layout.container, howToPlayPages);

        // Create progress tracker
        this.progressTracker = GameComponents.createProgressTracker(
            1,
            this.options.levels.length,
        );
        this.gameContent.appendChild(this.progressTracker);

        // Create sequence display
        this.createSequenceDisplay();

        // Create input area
        this.createInputArea();

        // Create hint area
        this.createHintArea();
    }

    createMessageContainers() {
        // Create message container for encrypted text
        const encryptedContainer = document.createElement("div");
        encryptedContainer.className = "message-container";

        const encryptedLabel = document.createElement("div");
        encryptedLabel.className = "message-label";
        encryptedLabel.textContent = "Encrypted Message:";

        this.encryptedMessage = document.createElement("div");
        this.encryptedMessage.className = "message encrypted";
        this.encryptedMessage.id = "encrypted-message";

        encryptedContainer.appendChild(encryptedLabel);
        encryptedContainer.appendChild(this.encryptedMessage);

        // Create message container for decrypted text
        const decryptedContainer = document.createElement("div");
        decryptedContainer.className = "message-container";

        const decryptedLabel = document.createElement("div");
        decryptedLabel.className = "message-label";
        decryptedLabel.textContent = "Decrypted Message:";

        this.decryptedMessage = document.createElement("div");
        this.decryptedMessage.className = "message decrypted";
        this.decryptedMessage.id = "decrypted-message";

        decryptedContainer.appendChild(decryptedLabel);
        decryptedContainer.appendChild(this.decryptedMessage);

        this.gameContent.appendChild(encryptedContainer);
        this.gameContent.appendChild(decryptedContainer);
    }

    createShiftControls() {
        // Create controls container
        const controls = document.createElement("div");
        controls.className = "shift-controls";

        // Create decrease button
        const decreaseBtn = document.createElement("button");
        decreaseBtn.id = "decrease-btn";
        decreaseBtn.className = "fantasy-button control-btn";
        decreaseBtn.textContent = "−";
        decreaseBtn.addEventListener("click", () => this.updateShift(-1));

        // Create shift display
        const shiftDisplay = document.createElement("div");
        shiftDisplay.className = "shift-display";

        const shiftLabel = document.createElement("span");
        shiftLabel.textContent = "Shift: ";

        this.shiftValue = document.createElement("span");
        this.shiftValue.id = "shift-value";
        this.shiftValue.textContent = "0";

        shiftDisplay.appendChild(shiftLabel);
        shiftDisplay.appendChild(this.shiftValue);

        // Create increase button
        const increaseBtn = document.createElement("button");
        increaseBtn.id = "increase-btn";
        increaseBtn.className = "fantasy-button control-btn";
        increaseBtn.textContent = "+";
        increaseBtn.addEventListener("click", () => this.updateShift(1));

        controls.appendChild(decreaseBtn);
        controls.appendChild(shiftDisplay);
        controls.appendChild(increaseBtn);

        this.gameContent.appendChild(controls);
    }

    createSequenceDisplay() {
        // Create sequence display container
        const sequenceDisplay = document.createElement("div");
        sequenceDisplay.className = "sequence-display";

        // Create sequence numbers container
        this.sequenceNumbers = document.createElement("div");
        this.sequenceNumbers.className = "sequence-numbers";
        this.sequenceNumbers.id = "sequenceDisplay";

        // Create question mark
        const questionMark = document.createElement("div");
        questionMark.className = "sequence-question";
        questionMark.textContent = "?";

        sequenceDisplay.appendChild(this.sequenceNumbers);
        sequenceDisplay.appendChild(questionMark);

        this.gameContent.appendChild(sequenceDisplay);
    }

    createInputArea() {
        // Create input container
        const inputContainer = document.createElement("div");
        inputContainer.className = "input-container";

        // Create answer input
        this.answerInput = document.createElement("input");
        this.answerInput.type = "text";
        this.answerInput.id = "answer-input";
        this.answerInput.className = "answer-input";
        this.answerInput.placeholder = "Enter your answer...";

        // Add enter key event
        this.answerInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                this.checkAnswer();
            }
        });

        // Create submit button
        this.submitBtn = UI.createButton("Submit Answer", () =>
            this.checkAnswer(),
        );

        inputContainer.appendChild(this.answerInput);
        inputContainer.appendChild(this.submitBtn);

        this.gameContent.appendChild(inputContainer);
    }

    createHintArea() {
        // Create hints container
        const hintsContainer = document.createElement("div");
        hintsContainer.className = "hints";

        // Create hint text
        const hintTextContainer = document.createElement("p");
        hintTextContainer.innerHTML =
            'Hint: <span id="hint-text">Look for patterns or common words.</span>';

        this.hintText = hintTextContainer.querySelector("#hint-text");

        // Create hint button
        this.hintBtn = UI.createButton("Get Hint", () => this.showHint());

        hintsContainer.appendChild(hintTextContainer);
        hintsContainer.appendChild(this.hintBtn);

        this.gameContent.appendChild(hintsContainer);
    }

    loadLevel(level) {
        // Get current level data
        this.currentLevel = level;
        const levelData = this.options.levels[level];

        if (!levelData) {
            console.error("Level data not found");
            return;
        }

        // Update progress
        this.progressTracker.update(level + 1);

        // Reset hints
        this.hintsUsed = 0;
        this.hintText.textContent = "Look for patterns or common words.";
        this.hintBtn.disabled = false;
        this.hintBtn.style.opacity = "1";

        // Clear answer input
        this.answerInput.value = "";

        // Load level based on game type
        switch (this.options.type) {
            case "cipher":
                this.loadCipherLevel(levelData);
                break;
            case "sequence":
                this.loadSequenceLevel(levelData);
                break;
            default:
                this.loadDefaultLevel(levelData);
        }
    }

    loadCipherLevel(levelData) {
        // Reset shift
        this.currentShift = 0;
        this.shiftValue.textContent = this.currentShift;

        // Set encrypted message
        this.encryptedMessage.textContent = levelData.encrypted || "";

        // Update decrypted message
        this.updateDecryptedMessage();
    }

    loadSequenceLevel(levelData) {
        // Clear sequence display
        this.sequenceNumbers.innerHTML = "";

        // Add number elements
        levelData.numbers.forEach((number) => {
            const numberElement = document.createElement("div");
            numberElement.className = "sequence-number";
            numberElement.textContent = number;
            this.sequenceNumbers.appendChild(numberElement);
        });
    }

    loadDefaultLevel(levelData) {
        // Set puzzle content
        if (this.puzzleArea) {
            this.puzzleArea.innerHTML = "";

            if (levelData.content) {
                this.puzzleArea.innerHTML = levelData.content;
            }
        }
    }

    updateShift(change) {
        // Only applies to cipher game
        if (this.options.type !== "cipher") return;

        // Update shift value (wrapping around 0-25)
        this.currentShift = (this.currentShift + change + 26) % 26;
        this.shiftValue.textContent = this.currentShift;

        // Update decrypted message
        this.updateDecryptedMessage();
    }

    updateDecryptedMessage() {
        // Only applies to cipher game
        if (this.options.type !== "cipher" || !this.encryptedMessage) return;

        const encrypted = this.encryptedMessage.textContent;
        // For decryption, we apply the opposite of the current shift
        const decrypted = this.applyShift(encrypted, -this.currentShift);
        this.decryptedMessage.textContent = decrypted;
    }

    applyShift(text, shift) {
        // Cipher shifting algorithm
        return text
            .split("")
            .map((char) => {
                // Only shift letters, leave punctuation and spaces as is
                if (/[A-Z]/i.test(char)) {
                    const code = char.charCodeAt(0);
                    const isUpperCase = code >= 65 && code <= 90;
                    const base = isUpperCase ? 65 : 97;

                    // Apply shift formula with proper modulo for negative numbers
                    return String.fromCharCode(
                        ((((code - base + shift) % 26) + 26) % 26) + base,
                    );
                }
                return char;
            })
            .join("");
    }

    checkAnswer() {
        const userAnswer = this.answerInput.value.trim().toUpperCase();

        if (userAnswer === "") {
            this.showErrorModal("Please enter an answer");
            return;
        }

        const levelData = this.options.levels[this.currentLevel];
        const correctAnswer = levelData.answer.toUpperCase();

        if (userAnswer === correctAnswer) {
            this.handleCorrectAnswer();
        } else {
            this.handleIncorrectAnswer();
        }
    }

    handleCorrectAnswer() {
        // Visual feedback
        if (this.options.type === "cipher" && this.decryptedMessage) {
            this.decryptedMessage.classList.add("correct-answer");
            setTimeout(() => {
                this.decryptedMessage.classList.remove("correct-answer");
            }, 1500);
        } else {
            this.answerInput.classList.add("correct-answer");
            setTimeout(() => {
                this.answerInput.classList.remove("correct-answer");
            }, 1500);
        }

        // Get current level data
        const currentLevelData = this.options.levels[this.currentLevel];

        // Check if this was the last level
        if (this.currentLevel >= this.options.levels.length - 1) {
            this.showCompletionModal();
        } else {
            // Show success message
            const modal = new GameModal();
            modal.setContent(`
                <h2 style="text-align: center; margin-bottom: 20px; color: var(--color-success);">Correct!</h2>
                <p style="margin-bottom: 20px; text-align: center;">
                    ${
                        currentLevelData.successMessage ||
                        "You've successfully solved the puzzle!"
                    }
                </p>
            `);

            modal.addButton("Continue", () => {
                modal.hide();
                // Load next level
                this.loadLevel(this.currentLevel + 1);
            });

            modal.show();
        }
    }

    handleIncorrectAnswer() {
        // Visual feedback
        this.answerInput.classList.add("shake-animation");
        setTimeout(() => {
            this.answerInput.classList.remove("shake-animation");
        }, 500);

        // Show error message
        const modal = new GameModal();
        modal.setContent(`
            <h2 style="text-align: center; margin-bottom: 20px; color: var(--color-error);">Incorrect</h2>
            <p style="margin-bottom: 20px; text-align: center;">
                That's not the right answer. Keep trying!
            </p>
        `);

        modal.addButton("Try Again", () => {
            modal.hide();
            this.answerInput.focus();
        });

        modal.show();
    }

    showHint() {
        if (this.hintsUsed >= this.maxHints) {
            const modal = new GameModal();
            modal.setContent(`
                <h2 style="text-align: center; margin-bottom: 20px;">No More Hints</h2>
                <p style="margin-bottom: 20px; text-align: center;">
                    You've used all available hints for this level.
                </p>
            `);

            modal.addButton("OK", () => modal.hide());
            modal.show();
            return;
        }

        // Get current level data
        const levelData = this.options.levels[this.currentLevel];

        // Show a hint
        const hint = levelData.hints && levelData.hints[this.hintsUsed];
        if (hint) {
            this.hintText.textContent = hint;
        }

        // Special actions for the last hint (e.g., auto-shift for cipher)
        if (
            this.hintsUsed === 2 &&
            this.options.type === "cipher" &&
            levelData.shift !== undefined
        ) {
            this.currentShift = levelData.shift;
            this.shiftValue.textContent = this.currentShift;
            this.updateDecryptedMessage();
        }

        this.hintsUsed++;

        // Disable hint button if all hints used
        if (this.hintsUsed >= this.maxHints) {
            this.hintBtn.disabled = true;
            this.hintBtn.style.opacity = "0.5";
        }
    }

    showCompletionModal() {
        const modal = new GameModal();
        modal.setContent(`
            <h2 style="text-align: center; margin-bottom: 20px; color: var(--color-success);">Challenge Complete!</h2>
            <p style="margin-bottom: 20px; text-align: center;">
                Congratulations! You've successfully completed all levels!
            </p>
        `);

        modal.addButton("Finish", () => {
            modal.hide();
            GameComponents.handleGameCompletion();
        });

        modal.show();
    }

    showIntroModal() {
        let title, description;

        // Set title and description based on game type
        switch (this.options.type) {
            case "cipher":
                title = "Ancient Cipher Challenge";
                description =
                    "You've discovered ancient encrypted messages that need to be deciphered! Use the shift controls to decode the messages and find the hidden words.";
                break;
            case "sequence":
                title = "Arcane Number Sequence";
                description =
                    "Discover the hidden patterns in these arcane number sequences! Find the next number in each magical sequence.";
                break;
            default:
                title = "Puzzle Challenge";
                description = "Solve the puzzle to continue your journey.";
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
            this.gameActive = true;
            this.loadLevel(0);
        });

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

        modal.addButton("OK", () => modal.hide());
        modal.show();
    }
}

export default PuzzleGame;
