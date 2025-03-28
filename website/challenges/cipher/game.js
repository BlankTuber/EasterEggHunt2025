// Import the modal component
import GameModal from "../util/modal.js";

// Shift cipher game
document.addEventListener("DOMContentLoaded", () => {
    // Game elements
    const encryptedMessageEl = document.getElementById("encrypted-message");
    const decryptedMessageEl = document.getElementById("decrypted-message");
    const shiftValueEl = document.getElementById("shift-value");
    const decreaseBtn = document.getElementById("decrease-btn");
    const increaseBtn = document.getElementById("increase-btn");
    const answerInput = document.getElementById("answer-input");
    const submitBtn = document.getElementById("submit-btn");
    const hintBtn = document.getElementById("hint-btn");
    const hintText = document.getElementById("hint-text");
    const progressValue = document.getElementById("progress-value");
    const progressBar = document.getElementById("progress-bar");

    // Initialize modal
    const modal = new GameModal();

    // Game state
    let currentShift = 0;
    let currentLevel = 0;
    let hintsUsed = 0;
    let maxHints = 3;

    // Game data - original messages, answers, and hints
    const cipherData = [
        {
            original:
                "THERE IS A SECRET WORD AT THE END OF THIS MESSAGE THE WORD IS KNOWLEDGE",
            shift: 23,
            answer: "KNOWLEDGE",
            hints: [
                "Try shifting the alphabet by 1 position",
                "Look for common words like 'THE' and 'IS'",
                "The secret word is at the end of the message",
            ],
        },
        {
            original:
                "CIPHER IS A MYSTICAL MESSAGE IN THE CHALLENGE THE ANSWER WORD IS HIDDEN",
            shift: 11,
            answer: "HIDDEN",
            hints: [
                "Try looking for common patterns like 'THE' and 'IS'",
                "This message uses a larger shift value",
                "The answer is a word related to secrets",
            ],
        },
        {
            original: "PLEASE CONSIDER ANSWERING WITH THE WORD CRYPTOGRAPHY",
            shift: 8,
            answer: "CRYPTOGRAPHY",
            hints: [
                "The shift value is small",
                "Look for common words like 'WITH' and 'THE'",
                "The answer is the study of secure communications",
            ],
        },
        {
            original:
                "THERE ARE MANY TYPES OF CIPHERS THIS IS A CAESAR CIPHER WITH THE SECRET WORD DECODED",
            shift: 19,
            answer: "DECODED",
            hints: [
                "Try to identify the word 'CIPHER' in the encrypted text",
                "This is named after a famous Roman emperor",
                "The secret word describes what you've successfully done",
            ],
        },
        {
            original:
                "CONGRATULATIONS YOU HAVE COMPLETED ALL CIPHERS THE FINAL WORD IS MASTERY",
            shift: 1,
            answer: "MASTERY",
            hints: [
                "It's similar to the first cipher's shift",
                "The first word should be 'CONGRATULATIONS'",
                "The final word describes expertise in a skill",
            ],
        },
    ];

    // Initialize game
    initGame();

    function initGame() {
        // Reset game state
        currentLevel = 0;
        hintsUsed = 0;

        // Load first level
        loadLevel(currentLevel);

        // Set up event listeners
        decreaseBtn.addEventListener("click", () => updateShift(-1));
        increaseBtn.addEventListener("click", () => updateShift(1));
        submitBtn.addEventListener("click", checkAnswer);
        hintBtn.addEventListener("click", showHint);

        // Allow submitting with Enter key
        answerInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                checkAnswer();
            }
        });

        // Show welcome modal
        showWelcomeModal();
    }

    function loadLevel(level) {
        // Get current level data
        const levelData = cipherData[level];

        // Reset shift
        currentShift = 0;
        shiftValueEl.textContent = currentShift;

        // Encrypt the original message with the level's shift
        const encrypted = applyShift(levelData.original, levelData.shift);

        // Set encrypted message
        encryptedMessageEl.textContent = encrypted;

        // Update decrypted message
        updateDecryptedMessage();

        // Reset input and hint
        answerInput.value = "";
        hintText.textContent = "Look for common words in English.";
        hintsUsed = 0;

        // Update progress
        progressValue.textContent = `${level + 1}/${cipherData.length}`;
        const progressPercent = ((level + 1) / cipherData.length) * 100;
        progressBar.style.width = `${progressPercent}%`;

        // Re-enable hint button
        hintBtn.disabled = false;
        hintBtn.style.opacity = "1";
    }

    function updateShift(change) {
        // Update shift value
        currentShift = (currentShift + change + 26) % 26;
        shiftValueEl.textContent = currentShift;

        // Update decrypted message
        updateDecryptedMessage();
    }

    function updateDecryptedMessage() {
        const encrypted = encryptedMessageEl.textContent;
        // For decryption, we need to apply the opposite of the current shift
        const decrypted = applyShift(encrypted, -currentShift);
        decryptedMessageEl.textContent = decrypted;
    }

    function applyShift(text, shift) {
        // For encryption, we use a positive shift
        // For decryption, we use a negative shift
        // We handle this in the calls to this function
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

    function checkAnswer() {
        const userAnswer = answerInput.value.trim().toUpperCase();
        const correctAnswer = cipherData[currentLevel].answer.toUpperCase();

        if (userAnswer === correctAnswer) {
            // Correct answer
            handleCorrectAnswer();
        } else {
            // Incorrect answer
            handleIncorrectAnswer();
        }
    }

    function handleCorrectAnswer() {
        // Visual feedback
        decryptedMessageEl.classList.add("correct-answer");
        setTimeout(() => {
            decryptedMessageEl.classList.remove("correct-answer");
        }, 1500);

        // Check if this was the last level
        if (currentLevel === cipherData.length - 1) {
            // Game completed
            showCompletionModal();
        } else {
            // Show success message
            modal.setContent(`
        <h2 style="text-align: center; margin-bottom: 20px; color: #6da832;">Correct!</h2>
        <p style="margin-bottom: 20px; text-align: center;">
          You've successfully deciphered the message!
        </p>
      `);
            modal.addButton("Continue", () => {
                modal.hide();
                // Load next level
                currentLevel++;
                loadLevel(currentLevel);
            });
            modal.show();
        }
    }

    function handleIncorrectAnswer() {
        // Visual feedback
        answerInput.classList.add("incorrect-answer");
        setTimeout(() => {
            answerInput.classList.remove("incorrect-answer");
        }, 500);

        // Show error message
        modal.setContent(`
      <h2 style="text-align: center; margin-bottom: 20px; color: #e77d7d;">Incorrect</h2>
      <p style="margin-bottom: 20px; text-align: center;">
        That's not the right answer. Keep trying!
      </p>
    `);
        modal.addButton("Try Again", () => {
            modal.hide();
            answerInput.focus();
        });
        modal.show();
    }

    function showHint() {
        if (hintsUsed >= maxHints) {
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

        // Show a hint
        const hint = cipherData[currentLevel].hints[hintsUsed];
        hintText.textContent = hint;

        // If this level has a specific shift value, and we're showing the last hint,
        // automatically apply the correct shift
        if (hintsUsed === 2 && cipherData[currentLevel].shift !== undefined) {
            currentShift = cipherData[currentLevel].shift;
            shiftValueEl.textContent = currentShift;
            updateDecryptedMessage();
        }

        hintsUsed++;

        // Disable hint button if all hints used
        if (hintsUsed >= maxHints) {
            hintBtn.disabled = true;
            hintBtn.style.opacity = "0.5";
        }
    }

    function showWelcomeModal() {
        modal.setContent(`
      <h2 style="text-align: center; margin-bottom: 20px;">Ancient Cipher Challenge</h2>
      <p style="margin-bottom: 10px;">
        You've discovered ancient encrypted messages that need to be deciphered!
      </p>
      <p style="margin-bottom: 10px;">
        These messages use a "shift cipher" where each letter is replaced by another letter a fixed number of positions away in the alphabet.
      </p>
      <p style="margin-bottom: 10px;">
        Use the + and - buttons to adjust the shift value and uncover the hidden message. When you find the secret word, enter it in the answer box.
      </p>
      <p style="margin-bottom: 20px;">
        Good luck, cryptographer!
      </p>
    `);
        modal.addButton("Begin Challenge", () => modal.hide());
        modal.show();
    }

    function showCompletionModal() {
        modal.setContent(`
      <h2 style="text-align: center; margin-bottom: 20px; color: #6da832;">Challenge Complete!</h2>
      <p style="margin-bottom: 10px; text-align: center;">
        Congratulations! You've successfully deciphered all the ancient messages!
      </p>
      <p style="margin-bottom: 20px; text-align: center;">
        You've proven yourself to be a master cryptographer.
      </p>
    `);
        modal.addButton("Finish", () => {
            modal.hide();
            completeChallenge();
        });
        modal.show();
    }

    function completeChallenge() {
        // Generate a UUID for challenge completion
        const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
            /[xy]/g,
            function (c) {
                const r = (Math.random() * 16) | 0,
                    v = c == "x" ? r : (r & 0x3) | 0x8;
                return v.toString(16);
            },
        );

        // Send completion request
        fetch("/complete", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: `challengeId=${uuid}`,
        })
            .then((response) => {
                console.log("Challenge completed:", response.status);
            })
            .catch((error) => {
                console.error("Error completing challenge:", error);
            });
    }
});
