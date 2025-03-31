import UI from "../ui.js";
import GameComponents from "../components.js";
import GameModal from "../modal.js";

class TimelineGame {
    constructor(options = {}) {
        this.options = {
            containerId: "game-container",
            dataSource: null,
            theme: "fantasy",
            ...options,
        };

        this.gameData = null;
        this.draggedItem = null;
        this.container = document.getElementById(this.options.containerId);

        if (!this.container) {
            console.error("Timeline game container not found");
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
            console.error("Error initializing timeline game:", error);
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
            this.gameData.title || "Timeline Challenge",
            this.gameData.description ||
                "Arrange the items in chronological order from earliest to latest.",
        );

        this.container.appendChild(layout.container);
        this.gameContent = layout.content;

        // Create how to play button
        const howToPlayPages = [
            {
                title: "How to Play",
                description:
                    "Drag and drop the items from the bottom area to arrange them in chronological order from earliest to latest.",
                image: "images/tutorial/timeline-1.jpg",
            },
            {
                title: "Checking Your Answer",
                description:
                    "Once you've placed all items in the timeline, click the \"Check Order\" button to see if you're correct.",
                image: "images/tutorial/timeline-2.jpg",
            },
            {
                title: "Tips",
                description:
                    "Look for clues in the item images and names to help determine their chronological order. You can also rearrange items after placing them.",
                image: "images/tutorial/timeline-3.jpg",
            },
        ];

        GameComponents.addHowToPlay(layout.container, howToPlayPages);

        // Create timeline area
        this.createTimelineArea();

        // Create items container
        this.createItemsContainer();

        // Create controls
        this.createControls();
    }

    createTimelineArea() {
        // Create timeline container
        const timelineSection = document.createElement("div");
        timelineSection.className = "timeline-section";

        // Create timeline track
        const timelineTrack = document.createElement("div");
        timelineTrack.className = "timeline-track";
        timelineSection.appendChild(timelineTrack);

        // Create drop zone
        this.dropZone = document.createElement("div");
        this.dropZone.className = "timeline-drop-zone";
        this.dropZone.id = "drop-zone";
        timelineSection.appendChild(this.dropZone);

        this.gameContent.appendChild(timelineSection);

        // Create drop slots
        this.createDropSlots();
    }

    createDropSlots() {
        // Clear drop zone
        this.dropZone.innerHTML = "";

        // Create a slot for each item
        for (let i = 0; i < this.gameData.items.length; i++) {
            const slot = document.createElement("div");
            slot.className = "drop-slot";
            slot.dataset.position = i;
            this.dropZone.appendChild(slot);

            // Set up drag and drop events
            slot.addEventListener("dragover", (e) => {
                e.preventDefault();
                slot.classList.add("highlight");
            });

            slot.addEventListener("dragleave", () => {
                slot.classList.remove("highlight");
            });

            slot.addEventListener("drop", (e) => {
                e.preventDefault();
                slot.classList.remove("highlight");

                if (this.draggedItem) {
                    // Get source container
                    const sourceContainer = this.draggedItem.parentNode;

                    // If slot already has an item, handle it
                    if (slot.hasChildNodes()) {
                        const existingItem = slot.firstChild;

                        if (sourceContainer.classList.contains("drop-slot")) {
                            // Swap items
                            sourceContainer.appendChild(existingItem);
                        } else {
                            // Move existing item to items container
                            this.itemsContainer.appendChild(existingItem);
                        }
                    }

                    // Move dragged item to slot
                    slot.appendChild(this.draggedItem);
                    this.checkAllPlaced();
                }
            });
        }
    }

    createItemsContainer() {
        // Create items container
        this.itemsContainer = document.createElement("div");
        this.itemsContainer.className = "items-container";
        this.itemsContainer.id = "items-container";
        this.gameContent.appendChild(this.itemsContainer);

        // Allow items to be dragged back to container
        this.itemsContainer.addEventListener("dragover", (e) => {
            e.preventDefault();
        });

        this.itemsContainer.addEventListener("drop", (e) => {
            e.preventDefault();
            if (this.draggedItem) {
                this.itemsContainer.appendChild(this.draggedItem);
                this.checkAllPlaced();
            }
        });

        // Create and shuffle items
        this.createItems();
    }

    createItems() {
        // Clear items container
        this.itemsContainer.innerHTML = "";

        // Create a copy of items and shuffle
        const shuffledItems = [...this.gameData.items].sort(
            () => Math.random() - 0.5,
        );

        // Create item elements
        shuffledItems.forEach((item) => {
            const itemEl = document.createElement("div");
            itemEl.className = "timeline-item";
            itemEl.draggable = true;
            itemEl.dataset.id = item.id;

            // Add image if available
            if (item.image) {
                const img = document.createElement("img");
                img.src = item.image;
                img.alt = item.name;
                itemEl.appendChild(img);
            }

            // Add name
            const nameEl = document.createElement("div");
            nameEl.className = "item-name";
            nameEl.textContent = item.name;
            itemEl.appendChild(nameEl);

            // Add year (hidden initially)
            const yearEl = document.createElement("div");
            yearEl.className = "item-year";
            yearEl.textContent = item.year;
            itemEl.appendChild(yearEl);

            this.itemsContainer.appendChild(itemEl);

            // Setup drag events
            itemEl.addEventListener("dragstart", () => {
                this.draggedItem = itemEl;
                setTimeout(() => {
                    itemEl.style.opacity = "0.5";
                }, 0);
            });

            itemEl.addEventListener("dragend", () => {
                this.draggedItem = null;
                itemEl.style.opacity = "1";

                // Clear highlights
                document
                    .querySelectorAll(".drop-slot.highlight")
                    .forEach((slot) => {
                        slot.classList.remove("highlight");
                    });
            });
        });
    }

    createControls() {
        // Create controls container
        const controls = document.createElement("div");
        controls.className = "game-controls";

        // Create check button
        this.checkButton = UI.createButton(
            "Check Order",
            () => this.checkOrder(),
            "check-btn",
        );
        this.checkButton.disabled = true;
        this.checkButton.style.opacity = "0.5";
        controls.appendChild(this.checkButton);

        // Create reset button
        const resetButton = UI.createButton(
            "Reset",
            () => this.resetGame(),
            "reset-btn",
        );
        controls.appendChild(resetButton);

        this.gameContent.appendChild(controls);
    }

    checkAllPlaced() {
        // Enable check button only when all items are placed
        const allPlaced = this.itemsContainer.children.length === 0;
        this.checkButton.disabled = !allPlaced;
        this.checkButton.style.opacity = allPlaced ? "1" : "0.5";
    }

    checkOrder() {
        let allCorrect = true;

        // Sort items by year for comparison
        const sortedItems = [...this.gameData.items].sort(
            (a, b) => a.year - b.year,
        );

        // Check each slot
        const slots = document.querySelectorAll(".drop-slot");
        slots.forEach((slot, index) => {
            const item = slot.firstChild;
            if (!item) return;

            const itemId = item.dataset.id;
            const correctId = sortedItems[index].id;

            if (itemId === correctId) {
                slot.classList.add("correct");
            } else {
                slot.classList.add("incorrect");
                allCorrect = false;
            }
        });

        // Handle result
        if (allCorrect) {
            this.handleCorrectOrder();
        } else {
            this.handleIncorrectOrder();
        }
    }

    handleCorrectOrder() {
        // Show success modal
        const modal = new GameModal();
        modal.setContent(`
            <h2 style="text-align: center; margin-bottom: 20px; color: var(--color-success);">Correct!</h2>
            <p style="margin-bottom: 20px; text-align: center;">
                You've arranged the items in the correct chronological order!
            </p>
        `);

        modal.addButton("Show Years", () => {
            document.body.classList.add("show-years");
            modal.hide();

            // Complete challenge
            GameComponents.handleGameCompletion();
        });

        modal.show();
    }

    handleIncorrectOrder() {
        // Show feedback animation
        const slots = document.querySelectorAll(".drop-slot");

        setTimeout(() => {
            // Remove visual feedback after delay
            slots.forEach((slot) => {
                slot.classList.remove("correct", "incorrect");
            });
        }, 1500);

        // Show error modal
        const modal = new GameModal();
        modal.setContent(`
            <h2 style="text-align: center; margin-bottom: 20px; color: var(--color-error);">Incorrect</h2>
            <p style="margin-bottom: 20px; text-align: center;">
                The order is not correct. Try again!
            </p>
        `);

        modal.addButton("Try Again", () => modal.hide());
        modal.show();
    }

    resetGame() {
        // Move all items back to items container
        document
            .querySelectorAll(".drop-slot .timeline-item")
            .forEach((item) => {
                this.itemsContainer.appendChild(item);
            });

        // Update check button state
        this.checkAllPlaced();
    }

    showIntroModal() {
        const modal = new GameModal();
        modal.setContent(`
            <h2 style="text-align: center; margin-bottom: 20px;">${
                this.gameData.title || "Timeline Challenge"
            }</h2>
            <p style="margin-bottom: 20px; text-align: center;">
                ${
                    this.gameData.description ||
                    "Arrange the items in chronological order from earliest to latest."
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

export default TimelineGame;
