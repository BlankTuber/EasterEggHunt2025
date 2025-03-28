// website/challenges/mathsequence/game.js
import GameModal from "../util/modal.js";

class MathSequenceGame {
    constructor() {
        // Game state
        this.currentLevel = 1;
        this.maxLevel = 8;
        this.hintsLeft = 3;
        this.sequences = this.generateSequences();
        this.currentSequence = null;

        // DOM elements
        this.sequenceDisplay = document.getElementById("sequenceDisplay");
        this.userAnswerInput = document.getElementById("userAnswer");
        this.submitBtn = document.getElementById("submitBtn");
        this.hintBtn = document.getElementById("hintBtn");
        this.levelText = document.querySelector(".current-level");
        this.progressBar = document.querySelector(".progress-bar");
        this.hintCountText = document.querySelector(".hint-count");

        // Initialize modal
        this.modal = new GameModal();

        // Initialize game
        this.initEventListeners();
        this.showStartModal();
    }

    // Generate all level sequences
    generateSequences() {
        return [
            // Level 1: Simple addition (+2)
            {
                numbers: [3, 5, 7, 9, 11],
                nextNumber: 13,
                explanation:
                    "Each number increases by 2 from the previous number.",
                hint: "Look at the difference between consecutive numbers.",
                difficulty: "Easy",
            },
            // Level 2: Simple multiplication (×2)
            {
                numbers: [2, 4, 8, 16, 32],
                nextNumber: 64,
                explanation:
                    "Each number is multiplied by 2 from the previous number.",
                hint: "Try dividing each number by the previous one.",
                difficulty: "Easy",
            },
            // Level 3: Alternating addition (+3, +2)
            {
                numbers: [5, 8, 10, 13, 15],
                nextNumber: 18,
                explanation:
                    "The sequence alternates between adding 3 and adding 2.",
                hint: "The pattern of differences repeats every two steps.",
                difficulty: "Medium",
            },
            // Level 4: Squares
            {
                numbers: [1, 4, 9, 16, 25],
                nextNumber: 36,
                explanation:
                    "These are square numbers: 1², 2², 3², 4², 5², and next is 6².",
                hint: "Try finding a formula based on the position number.",
                difficulty: "Medium",
            },
            // Level 5: Fibonacci-like (sum of previous two)
            {
                numbers: [2, 3, 5, 8, 13],
                nextNumber: 21,
                explanation:
                    "Each number is the sum of the two previous numbers.",
                hint: "Add the last two numbers together.",
                difficulty: "Medium",
            },
            // Level 6: Powers of 3
            {
                numbers: [1, 3, 9, 27, 81],
                nextNumber: 243,
                explanation:
                    "Each number is multiplied by 3 from the previous one: 3⁰, 3¹, 3², 3³, 3⁴, and next is 3⁵.",
                hint: "The ratio between consecutive terms is constant.",
                difficulty: "Medium",
            },
            // Level 7: Triangular numbers
            {
                numbers: [1, 3, 6, 10, 15],
                nextNumber: 21,
                explanation:
                    "These are triangular numbers: sum of first n integers.",
                hint: "Each number adds an increasing amount to the previous number.",
                difficulty: "Hard",
            },
            // Level 8: Quadratic sequence
            {
                numbers: [4, 7, 12, 19, 28],
                nextNumber: 39,
                explanation:
                    "The sequence follows the formula n² + 3, where n starts at 1.",
                hint: "Try finding a formula based on n².",
                difficulty: "Hard",
            },
        ];
    }

    initEventListeners() {
        // Submit button
        this.submitBtn.addEventListener("click", () => this.checkAnswer());

        // Allow Enter key to submit
        this.userAnswerInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                this.checkAnswer();
            }
        });

        // Hint button
        this.hintBtn.addEventListener("click", () => this.showHint());

        // Number pad for mobile
        document.querySelectorAll(".num-button").forEach((button) => {
            button.addEventListener("click", () => {
                const value = button.getAttribute("data-value");

                if (value === "delete") {
                    this.userAnswerInput.value =
                        this.userAnswerInput.value.slice(0, -1);
                } else if (value === "submit") {
                    this.checkAnswer();
                } else {
                    this.userAnswerInput.value += value;
                }
            });
        });

        // Check for mobile and show number pad
        const isMobile = () =>
            window.innerWidth <= 768 || "ontouchstart" in window;

        const updateNumberPad = () => {
            const sequenceControls =
                document.querySelector(".sequence-controls");
            if (isMobile()) {
                sequenceControls.style.display = "block";
            } else {
                sequenceControls.style.display = "none";
            }
        };

        window.addEventListener("load", updateNumberPad);
        window.addEventListener("resize", updateNumberPad);
    }

    showStartModal() {
        this.modal.setContent(`
      <h2 style="text-align: center; margin-bottom: 20px; font-family: 'MedievalSharp', cursive;">Arcane Number Sequence Challenge</h2>
      <p style="margin-bottom: 15px;">Discover the hidden patterns in these arcane number sequences!</p>
      <p style="margin-bottom: 20px;">Solve the mysteries by finding the next number in each magical sequence.</p>
      <div style="text-align: center;">
        <button id="startButton" class="fantasy-button">Begin Challenge</button>
      </div>
    `);

        this.modal.show();

        document.getElementById("startButton").addEventListener("click", () => {
            this.modal.hide();
            this.startGame();
        });
    }

    startGame() {
        this.currentLevel = 1;
        this.hintsLeft = 3;
        this.updateHintCount();
        this.loadLevel(this.currentLevel);
    }

    loadLevel(level) {
        // Update level display
        this.levelText.textContent = level;
        this.progressBar.style.width = `${(level / this.maxLevel) * 100}%`;

        // Get the current sequence
        this.currentSequence = this.sequences[level - 1];

        // Clear previous sequence display
        this.sequenceDisplay.innerHTML = "";

        // Create and add number elements
        this.currentSequence.numbers.forEach((number) => {
            const numberElement = document.createElement("div");
            numberElement.classList.add("sequence-number");
            numberElement.textContent = number;
            this.sequenceDisplay.appendChild(numberElement);
        });

        // Clear user input
        this.userAnswerInput.value = "";
        this.userAnswerInput.focus();
    }

    checkAnswer() {
        const userAnswer = parseInt(this.userAnswerInput.value);

        if (isNaN(userAnswer)) {
            this.showErrorModal("Please enter a valid number.");
            return;
        }

        if (userAnswer === this.currentSequence.nextNumber) {
            this.handleCorrectAnswer();
        } else {
            this.handleIncorrectAnswer();
        }
    }

    handleCorrectAnswer() {
        // Show success animation
        this.userAnswerInput.classList.add("correct-answer");
        setTimeout(() => {
            this.userAnswerInput.classList.remove("correct-answer");
        }, 1000);

        // Show success modal
        this.modal.setContent(`
      <h2 style="text-align: center; margin-bottom: 20px; font-family: 'MedievalSharp', cursive; color: #6da832;">Correct!</h2>
      <p style="margin-bottom: 15px;">The next number in the sequence is indeed ${
          this.currentSequence.nextNumber
      }.</p>
      <p style="margin-bottom: 20px;"><strong>Pattern:</strong> ${
          this.currentSequence.explanation
      }</p>
      ${
          this.currentLevel === this.maxLevel
              ? `
        <div style="text-align: center;">
          <button id="finishButton" class="fantasy-button">Complete Challenge</button>
        </div>
      `
              : `
        <div style="text-align: center;">
          <button id="nextButton" class="fantasy-button">Next Sequence</button>
        </div>
      `
      }
    `);

        this.modal.show();

        if (this.currentLevel === this.maxLevel) {
            document
                .getElementById("finishButton")
                .addEventListener("click", () => {
                    this.completeChallenge();
                    this.modal.hide();
                    this.showVictoryModal();
                });
        } else {
            document
                .getElementById("nextButton")
                .addEventListener("click", () => {
                    this.currentLevel++;
                    this.loadLevel(this.currentLevel);
                    this.modal.hide();
                });
        }
    }

    handleIncorrectAnswer() {
        // Show error animation
        this.userAnswerInput.classList.add("incorrect-answer");
        setTimeout(() => {
            this.userAnswerInput.classList.remove("incorrect-answer");
        }, 500);

        // Show error modal
        this.modal.setContent(`
      <h2 style="text-align: center; margin-bottom: 20px; font-family: 'MedievalSharp', cursive; color: #e77d7d;">Incorrect</h2>
      <p style="margin-bottom: 15px;">That's not the right number in the sequence.</p>
      <p style="margin-bottom: 20px;">Try again or use a hint to help discover the pattern.</p>
      <div style="text-align: center;">
        <button id="tryAgainButton" class="fantasy-button">Try Again</button>
      </div>
    `);

        this.modal.show();

        document
            .getElementById("tryAgainButton")
            .addEventListener("click", () => {
                this.modal.hide();
                this.userAnswerInput.value = "";
                this.userAnswerInput.focus();
            });
    }

    showHint() {
        if (this.hintsLeft <= 0) {
            this.showErrorModal("You have no hints remaining!");
            return;
        }

        this.hintsLeft--;
        this.updateHintCount();

        this.modal.setContent(`
      <h2 style="text-align: center; margin-bottom: 20px; font-family: 'MedievalSharp', cursive; color: #a367dc;">Magical Hint</h2>
      <p style="margin-bottom: 20px; text-align: center;">${this.currentSequence.hint}</p>
      <div style="text-align: center;">
        <button id="closeHintButton" class="fantasy-button">Continue</button>
      </div>
    `);

        this.modal.show();

        document
            .getElementById("closeHintButton")
            .addEventListener("click", () => {
                this.modal.hide();
                this.userAnswerInput.focus();
            });
    }

    updateHintCount() {
        this.hintCountText.textContent = `(${this.hintsLeft})`;

        // Disable hint button if no hints left
        if (this.hintsLeft <= 0) {
            this.hintBtn.disabled = true;
            this.hintBtn.style.opacity = 0.5;
        }
    }

    showErrorModal(message) {
        this.modal.setContent(`
      <h2 style="text-align: center; margin-bottom: 20px; font-family: 'MedievalSharp', cursive; color: #e77d7d;">Error</h2>
      <p style="margin-bottom: 20px; text-align: center;">${message}</p>
      <div style="text-align: center;">
        <button id="closeErrorButton" class="fantasy-button">Okay</button>
      </div>
    `);

        this.modal.show();

        document
            .getElementById("closeErrorButton")
            .addEventListener("click", () => {
                this.modal.hide();
                this.userAnswerInput.focus();
            });
    }

    showVictoryModal() {
        this.modal.setContent(`
      <h2 style="text-align: center; margin-bottom: 20px; font-family: 'MedievalSharp', cursive; color: #6da832;">Victory!</h2>
      <p style="margin-bottom: 15px; text-align: center;">You have mastered all the arcane number sequences!</p>
      <p style="margin-bottom: 20px; text-align: center;">Your wisdom and insight have proven worthy of the ancient mathematical arts.</p>
      <div style="text-align: center;">
        <button id="restartButton" class="fantasy-button">Play Again</button>
      </div>
    `);

        this.modal.show();

        document
            .getElementById("restartButton")
            .addEventListener("click", () => {
                this.modal.hide();
                this.startGame();
            });
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
    const game = new MathSequenceGame();
});
