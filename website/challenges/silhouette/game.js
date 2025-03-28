// Silhouette identification game
document.addEventListener("DOMContentLoaded", () => {
    // Game elements
    const gameTitle = document.getElementById("game-title");
    const silhouetteImage = document.getElementById("silhouette-image");
    const silhouetteContainer = document.getElementById("silhouette-container");
    const guessInput = document.getElementById("guess-input");
    const submitBtn = document.getElementById("submit-btn");
    const hintBtn = document.getElementById("hint-btn");
    const skipBtn = document.getElementById("skip-btn");
    const hintText = document.getElementById("hint-text");
    const feedback = document.getElementById("feedback");
    const scoreDisplay = document.getElementById("score");
    const totalDisplay = document.getElementById("total");

    // Modal elements
    const modal = document.getElementById("modal");
    const closeBtn = document.querySelector(".close-btn");
    const modalTitle = document.getElementById("modal-title");
    const modalText = document.getElementById("modal-text");
    const modalPrimaryBtn = document.getElementById("modal-primary-btn");

    // Game state
    let gameData = null;
    let currentSilhouette = null;
    let currentIndex = 0;
    let score = 0;
    let hintsUsed = 0;
    let maxHints = 3;

    // Initialize game
    init();

    async function init() {
        try {
            // Load game data based on URL parameter
            const urlParams = new URLSearchParams(window.location.search);
            const theme = urlParams.get("theme") || "games";

            const response = await fetch(`data/${theme}.json`);
            gameData = await response.json();

            // Set up game
            setupGame();
        } catch (error) {
            console.error("Error loading game data:", error);
            showModal(
                "Error",
                "Failed to load game data. Please try again.",
                "Reload",
                () => window.location.reload(),
            );
        }
    }

    function setupGame() {
        // Set game title
        gameTitle.textContent = gameData.title || "Shadow Identifier Challenge";

        // Update total display
        totalDisplay.textContent = gameData.items.length;

        // Shuffle items
        gameData.items = shuffleArray([...gameData.items]);

        // Show first silhouette
        loadSilhouette();

        // Set up event listeners
        submitBtn.addEventListener("click", checkAnswer);
        guessInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                checkAnswer();
            }
        });

        hintBtn.addEventListener("click", showHint);
        skipBtn.addEventListener("click", skipSilhouette);
        closeBtn.addEventListener("click", closeModal);

        // Close modal if user clicks outside of it
        window.onclick = (event) => {
            if (event.target === modal) {
                closeModal();
            }
        };
    }

    function loadSilhouette() {
        // Reset UI
        silhouetteContainer.classList.remove("reveal");
        guessInput.value = "";
        feedback.textContent = "";
        feedback.className = "feedback";
        hintText.textContent = "";
        hintsUsed = 0;

        // Check if game is over
        if (currentIndex >= gameData.items.length) {
            gameOver();
            return;
        }

        // Load current silhouette
        currentSilhouette = gameData.items[currentIndex];
        silhouetteImage.src = currentSilhouette.image;

        // Focus on input
        guessInput.focus();
    }

    function checkAnswer() {
        const guess = guessInput.value.trim().toLowerCase();

        if (guess === "") {
            feedback.textContent = "Please enter a guess!";
            feedback.className = "feedback incorrect";
            return;
        }

        const correctAnswers = Array.isArray(currentSilhouette.answers)
            ? currentSilhouette.answers.map((a) => a.toLowerCase())
            : [currentSilhouette.name.toLowerCase()];

        // Check if answer is correct
        if (correctAnswers.includes(guess)) {
            // Correct answer
            handleCorrectAnswer();
        } else {
            // Incorrect answer
            handleIncorrectAnswer();
        }
    }

    function handleCorrectAnswer() {
        score++;
        scoreDisplay.textContent = score;

        feedback.textContent = `Correct! That's ${currentSilhouette.name}.`;
        feedback.className = "feedback correct";
        silhouetteContainer.classList.add("reveal");
        silhouetteContainer.classList.add("correct-answer");

        // Wait a moment before moving to next
        setTimeout(() => {
            silhouetteContainer.classList.remove("correct-answer");
            currentIndex++;
            loadSilhouette();
        }, 1500);
    }

    function handleIncorrectAnswer() {
        feedback.textContent = `Sorry, that's not correct. Try again!`;
        feedback.className = "feedback incorrect";

        // Shake input
        guessInput.classList.add("shake");
        setTimeout(() => {
            guessInput.classList.remove("shake");
        }, 500);
    }

    function showHint() {
        if (hintsUsed >= currentSilhouette.hints.length) {
            hintText.textContent = "No more hints available!";
            return;
        }

        hintText.textContent = currentSilhouette.hints[hintsUsed];
        hintsUsed++;

        // Disable hint button if no more hints
        if (hintsUsed >= currentSilhouette.hints.length) {
            hintBtn.disabled = true;
            hintBtn.style.opacity = 0.5;
        }
    }

    function skipSilhouette() {
        silhouetteContainer.classList.add("reveal");
        feedback.textContent = `This was ${currentSilhouette.name}.`;
        feedback.className = "feedback incorrect";

        // Wait a moment before moving to next
        setTimeout(() => {
            currentIndex++;
            loadSilhouette();

            // Re-enable hint button
            hintBtn.disabled = false;
            hintBtn.style.opacity = 1;
        }, 1500);
    }

    function gameOver() {
        const percentage = Math.round((score / gameData.items.length) * 100);

        if (percentage >= 100) {
            completeChallenge();
            showModal(
                "You got them all!",
                `You scored ${score} out of ${gameData.items.length} (${percentage}%)!`,
                "Complete",
                () => {
                    currentIndex = 0;
                    score = 0;
                    scoreDisplay.textContent = score;
                    gameData.items = shuffleArray([...gameData.items]);
                    loadSilhouette();
                    closeModal();
                    location.href = "#";
                },
            );
        } else {
            showModal(
                "Game Complete!",
                `You scored ${score} out of ${gameData.items.length} (${percentage}%)!`,
                "Play Again",
                () => {
                    currentIndex = 0;
                    score = 0;
                    scoreDisplay.textContent = score;
                    gameData.items = shuffleArray([...gameData.items]);
                    loadSilhouette();
                    closeModal();
                },
            );
        }
    }

    function showModal(title, text, buttonText, buttonAction) {
        modalTitle.textContent = title;
        modalText.textContent = text;
        modalPrimaryBtn.textContent = buttonText;

        // Set button action
        modalPrimaryBtn.onclick = () => {
            if (typeof buttonAction === "function") {
                buttonAction();
            }
        };

        // Show modal
        modal.style.display = "block";
    }

    function closeModal() {
        modal.style.display = "none";
    }

    function completeChallenge() {
        // Generate UUID for challenge completion
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

    // Utility function to shuffle array
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
});
