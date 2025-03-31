import UI from "./ui.js";
import GameModal from "./modal.js";

class GameComponents {
    // Create a standard game layout
    static createGameLayout(title, description = "") {
        const container = document.createElement("div");
        container.className = "game-container fantasy-container";

        // Add header
        const header = UI.createGameHeader(title, description);
        container.appendChild(header);

        // Add content area
        const content = document.createElement("div");
        content.className = "game-content";
        container.appendChild(content);

        return {
            container,
            header,
            content,
        };
    }

    // Create a "How to Play" button with modal
    static addHowToPlay(container, pages) {
        const helpButton = UI.createButton(
            "?",
            () => {
                const modal = new GameModal();
                modal.createHowToPlayModal(pages);
                modal.show();
            },
            "help-button",
        );

        container.appendChild(helpButton);
        return helpButton;
    }

    // Create a progress tracker
    static createProgressTracker(current, total) {
        const container = document.createElement("div");
        container.className = "progress-tracker";

        const label = document.createElement("div");
        label.className = "progress-label";
        label.innerHTML = `Progress: <span class="current-progress">${current}</span>/<span class="total-progress">${total}</span>`;

        const progressBar = UI.createProgressBar(current, total);

        container.appendChild(label);
        container.appendChild(progressBar);

        // Update method
        container.update = (newValue) => {
            const currentElement = container.querySelector(".current-progress");
            currentElement.textContent = newValue;
            progressBar.update(newValue);
        };

        return container;
    }

    // Create standard game completion handler
    static handleGameCompletion(successCallback = null) {
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
                if (typeof successCallback === "function") {
                    successCallback(response);
                }
            })
            .catch((error) => {
                console.error("Error completing challenge:", error);
            });
    }

    // Create a timer component
    static createTimer(duration, onTimeUp, options = {}) {
        const container = document.createElement("div");
        container.className = "game-timer";

        const timerDisplay = document.createElement("div");
        timerDisplay.className = "timer-display";

        container.appendChild(timerDisplay);

        let timeLeft = duration;
        let timerId = null;

        // Format time (mm:ss)
        const formatTime = (seconds) => {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins.toString().padStart(2, "0")}:${secs
                .toString()
                .padStart(2, "0")}`;
        };

        // Update timer display
        const updateDisplay = () => {
            timerDisplay.textContent = formatTime(timeLeft);

            // Add warning class when time is running low
            if (
                timeLeft <= 10 &&
                !timerDisplay.classList.contains("timer-warning")
            ) {
                timerDisplay.classList.add("timer-warning");
            }
        };

        // Start timer
        const start = () => {
            updateDisplay();

            timerId = setInterval(() => {
                timeLeft--;
                updateDisplay();

                if (timeLeft <= 0) {
                    clearInterval(timerId);
                    container.classList.add("timer-ended");

                    if (typeof onTimeUp === "function") {
                        onTimeUp();
                    }
                }
            }, 1000);
        };

        // Stop timer
        const stop = () => {
            if (timerId) {
                clearInterval(timerId);
            }
        };

        // Reset timer
        const reset = () => {
            stop();
            timeLeft = duration;
            timerDisplay.classList.remove("timer-warning");
            container.classList.remove("timer-ended");
            updateDisplay();
        };

        // Add methods to the container
        container.start = start;
        container.stop = stop;
        container.reset = reset;
        container.getTimeLeft = () => timeLeft;

        // Initial display
        updateDisplay();

        return container;
    }

    // Create a score tracker component
    static createScoreTracker(options = {}) {
        const container = document.createElement("div");
        container.className = "score-tracker";

        const scoreDisplay = document.createElement("div");
        scoreDisplay.className = "score-display";
        scoreDisplay.innerHTML = `${
            options.label || "Score"
        }: <span class="score-value">0</span>`;

        container.appendChild(scoreDisplay);

        let currentScore = 0;

        // Update score
        const updateScore = (newScore) => {
            currentScore = newScore;
            const scoreEl = scoreDisplay.querySelector(".score-value");

            // Animate score change if it's an increase
            if (newScore > parseInt(scoreEl.textContent)) {
                scoreEl.classList.add("score-increase");
                setTimeout(() => {
                    scoreEl.classList.remove("score-increase");
                }, 500);
            }

            scoreEl.textContent = newScore;

            // Execute callback if provided
            if (typeof options.onScoreChange === "function") {
                options.onScoreChange(newScore);
            }
        };

        // Add methods to the container
        container.getScore = () => currentScore;
        container.updateScore = updateScore;
        container.addPoints = (points) => updateScore(currentScore + points);

        return container;
    }

    // Create a drag and drop container
    static createDragDropZone(options = {}) {
        const container = document.createElement("div");
        container.className = `drag-drop-zone ${options.className || ""}`;

        // Track currently dragged item
        let draggedItem = null;

        // Setup drag and drop logic
        const setupDragDrop = () => {
            // Make container a valid drop target
            container.addEventListener("dragover", (e) => {
                e.preventDefault();
                container.classList.add("drag-over");
            });

            container.addEventListener("dragleave", () => {
                container.classList.remove("drag-over");
            });

            container.addEventListener("drop", (e) => {
                e.preventDefault();
                container.classList.remove("drag-over");

                if (draggedItem && typeof options.onDrop === "function") {
                    options.onDrop(draggedItem, container);
                }
            });
        };

        // Create draggable items
        const createDraggableItem = (itemData) => {
            const item = document.createElement("div");
            item.className = "draggable-item";
            item.draggable = true;
            item.dataset.id = itemData.id || "";

            // Add content to the item
            if (itemData.image) {
                const img = document.createElement("img");
                img.src = itemData.image;
                img.alt = itemData.name || "";
                item.appendChild(img);
            }

            if (itemData.name) {
                const name = document.createElement("div");
                name.className = "item-name";
                name.textContent = itemData.name;
                item.appendChild(name);
            }

            // Add custom properties to dataset
            if (itemData.properties) {
                for (const [key, value] of Object.entries(
                    itemData.properties,
                )) {
                    item.dataset[key] = value;
                }
            }

            // Setup drag events
            item.addEventListener("dragstart", () => {
                draggedItem = item;
                setTimeout(() => {
                    item.classList.add("dragging");
                }, 0);
            });

            item.addEventListener("dragend", () => {
                item.classList.remove("dragging");
                draggedItem = null;
            });

            return item;
        };

        // Initialize drag and drop
        setupDragDrop();

        // Add methods to the container
        container.createDraggableItem = createDraggableItem;
        container.getCurrentDraggedItem = () => draggedItem;

        return container;
    }
}

export default GameComponents;
