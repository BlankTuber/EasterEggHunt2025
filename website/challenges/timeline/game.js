// Simple timeline game functionality
document.addEventListener("DOMContentLoaded", () => {
    // Game elements
    const gameTitle = document.getElementById("game-title");
    const gameDescription = document.getElementById("game-description");
    const dropZone = document.getElementById("drop-zone");
    const itemsContainer = document.getElementById("items-container");
    const checkButton = document.getElementById("check-btn");
    const resetButton = document.getElementById("reset-btn");

    // Modal elements
    const modal = document.getElementById("modal");
    const closeBtn = document.querySelector(".close-btn");
    const modalTitle = document.getElementById("modal-title");
    const modalText = document.getElementById("modal-text");
    const modalPrimaryBtn = document.getElementById("modal-primary-btn");

    // Game state
    let gameData = null;
    let draggedItem = null;

    // Initialize game
    init();

    async function init() {
        try {
            // Load game data based on URL parameter
            const urlParams = new URLSearchParams(window.location.search);
            const theme = urlParams.get("theme") || "tech";

            const response = await fetch(`data/${theme}.json`);
            gameData = await response.json();

            // Setup game immediately without showing start modal
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
        // Set game title and description
        gameTitle.textContent = gameData.title || "Timeline Challenge";
        gameDescription.textContent =
            gameData.description || "Arrange the items in chronological order.";

        // Create drop slots
        createDropSlots();

        // Create and shuffle items
        createItems();

        // Set up button handlers
        checkButton.addEventListener("click", checkOrder);
        resetButton.addEventListener("click", resetGame);
        closeBtn.addEventListener("click", closeModal);
    }

    function createDropSlots() {
        dropZone.innerHTML = "";

        // Create drop slots for each item
        for (let i = 0; i < gameData.items.length; i++) {
            const slot = document.createElement("div");
            slot.className = "drop-slot";
            slot.dataset.position = i;
            dropZone.appendChild(slot);

            // Set up event listeners for drop targets
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

                if (draggedItem) {
                    // Get the source container (where the dragged item came from)
                    const sourceContainer = draggedItem.parentNode;

                    // If slot already has an item, swap them
                    if (slot.hasChildNodes()) {
                        const existingItem = slot.firstChild;

                        // If dragging from another slot, swap the items
                        if (sourceContainer.classList.contains("drop-slot")) {
                            // Move existing item to the source slot
                            sourceContainer.appendChild(existingItem);
                        } else {
                            // Move existing item to the items container
                            itemsContainer.appendChild(existingItem);
                        }
                    }

                    // Move dragged item to this slot
                    slot.appendChild(draggedItem);
                    checkAllPlaced();
                }
            });
        }
    }

    function createItems() {
        itemsContainer.innerHTML = "";

        // Create a copy of items and shuffle
        const shuffledItems = [...gameData.items].sort(
            () => Math.random() - 0.5,
        );

        // Create item elements
        shuffledItems.forEach((item) => {
            const itemEl = document.createElement("div");
            itemEl.className = "item";
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
            nameEl.className = "name";
            nameEl.textContent = item.name;
            itemEl.appendChild(nameEl);

            // Add year (hidden initially)
            const yearEl = document.createElement("div");
            yearEl.className = "year";
            yearEl.textContent = item.year;
            itemEl.appendChild(yearEl);

            itemsContainer.appendChild(itemEl);

            // Set up drag events
            itemEl.addEventListener("dragstart", () => {
                draggedItem = itemEl;
                setTimeout(() => {
                    itemEl.style.opacity = "0.5";
                }, 0);
            });

            itemEl.addEventListener("dragend", () => {
                draggedItem = null;
                itemEl.style.opacity = "1";

                // Clear all highlights
                document
                    .querySelectorAll(".drop-slot.highlight")
                    .forEach((slot) => {
                        slot.classList.remove("highlight");
                    });
            });

            // Allow items to be dragged from drop slots back to items container
            itemsContainer.addEventListener("dragover", (e) => {
                e.preventDefault();
            });

            itemsContainer.addEventListener("drop", (e) => {
                e.preventDefault();
                if (draggedItem) {
                    itemsContainer.appendChild(draggedItem);
                    checkAllPlaced();
                }
            });
        });
    }

    function checkAllPlaced() {
        // Enable check button only when all items are placed
        const allPlaced = itemsContainer.children.length === 0;
        checkButton.disabled = !allPlaced;
        checkButton.style.opacity = allPlaced ? "1" : "0.5";
    }

    function checkOrder() {
        let allCorrect = true;

        // Sort items by year for comparison
        const sortedItems = [...gameData.items].sort((a, b) => {
            return a.year - b.year;
        });

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

        // Show result
        if (allCorrect) {
            showModal(
                "Correct!",
                "You've arranged the items in the correct chronological order!",
                "Show Years",
                showYears,
            );
            completeChallenge();
        } else {
            setTimeout(() => {
                // Remove visual feedback after a delay
                slots.forEach((slot) => {
                    slot.classList.remove("correct", "incorrect");
                });
            }, 1500);

            showModal(
                "Incorrect",
                "The order is not correct. Try again!",
                "Try Again",
                closeModal,
            );
        }
    }

    function resetGame() {
        // Move all items back to the items container
        document.querySelectorAll(".drop-slot .item").forEach((item) => {
            itemsContainer.appendChild(item);
        });

        checkAllPlaced();
    }

    function showYears() {
        document.body.classList.add("show-years");
        closeModal();
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

    // Close modal if user clicks outside of it
    window.onclick = (event) => {
        if (event.target === modal) {
            closeModal();
        }
    };
});
