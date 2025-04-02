import UI from "../util/ui.js";
import GameComponents from "../util/components.js";
import GameModal from "../util/modal.js";

class MusicCloudGame {
    constructor(options = {}) {
        this.options = {
            containerId: "game-container",
            gameData: null,
            matchDistance: 100,
            ...options,
        };

        this.container = document.getElementById(this.options.containerId);

        if (!this.container) {
            console.error("Music cloud game container not found");
            return;
        }

        this.pairs = this.options.gameData.pairs;
        this.totalPairs = this.pairs.length;
        this.matchedPairs = 0;
        this.currentlyDragging = null;
        this.dragTarget = null;
        this.cloudItems = [];
        this.currentAudio = null;
        this.potentialMatch = null;

        this.init();
    }

    init() {
        this.createGameLayout();
        this.initializeCloudItems();
        this.showIntroModal();
    }

    createGameLayout() {
        this.container.innerHTML = "";

        const layout = GameComponents.createGameLayout(
            this.options.gameData.title || "8-bit Music Identification",
            this.options.gameData.description ||
                "Match these classic 8-bit tunes to their video games of origin.",
        );

        this.container.appendChild(layout.container);
        this.gameContent = layout.content;

        const howToPlayPages = [
            {
                title: "How to Play",
                description:
                    "Listen to the 8-bit music tracks and drag them to their matching games to make pairs.",
                image: "images/tutorial/music-1.jpg",
            },
            {
                title: "Making Matches",
                description:
                    "Click the play button on a music card to hear the tune. Then drag the music card to the game you think it's from.",
                image: "images/tutorial/music-2.jpg",
            },
            {
                title: "Completing the Challenge",
                description:
                    "When you make a correct match, both cards will disappear. Match all music tracks to their games to complete the challenge.",
                image: "images/tutorial/music-3.jpg",
            },
        ];

        GameComponents.addHowToPlay(layout.container, howToPlayPages);

        this.cloudContainer = document.createElement("div");
        this.cloudContainer.className = "cloud-container";
        this.gameContent.appendChild(this.cloudContainer);

        this.addStarryBackground();
        this.createProgressDisplay();
    }

    addStarryBackground() {
        const starCount = 75;
        for (let i = 0; i < starCount; i++) {
            const star = document.createElement("div");
            star.className = "star";
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            star.style.width = `${Math.random() * 2 + 1}px`;
            star.style.height = star.style.width;
            star.style.animationDelay = `${Math.random() * 4}s`;
            this.cloudContainer.appendChild(star);
        }
    }

    createProgressDisplay() {
        const progressContainer = document.createElement("div");
        progressContainer.className = "progress-container";
        this.gameContent.appendChild(progressContainer);

        const progressLabel = document.createElement("div");
        progressLabel.className = "progress-label";
        progressLabel.textContent = "Progress:";
        progressContainer.appendChild(progressLabel);

        const progressBarContainer = document.createElement("div");
        progressBarContainer.className = "progress-bar-container";

        this.progressBar = document.createElement("div");
        this.progressBar.className = "progress-bar";
        this.progressBar.style.width = "0%";

        progressBarContainer.appendChild(this.progressBar);
        progressContainer.appendChild(progressBarContainer);

        this.matchCounter = document.createElement("div");
        this.matchCounter.className = "match-counter";
        this.matchCounter.textContent = `0/${this.totalPairs}`;
        progressContainer.appendChild(this.matchCounter);
    }

    initializeCloudItems() {
        this.pairs.forEach((pair) => {
            const gameItem = this.createGameItem(pair);
            this.cloudContainer.appendChild(gameItem);
            this.cloudItems.push({
                element: gameItem,
                type: "game",
                id: pair.id,
                matched: false,
                x: 0,
                y: 0,
                vx: Math.random() * 0.2 - 0.1,
                vy: Math.random() * 0.2 - 0.1,
            });

            const musicItem = this.createMusicItem(pair);
            this.cloudContainer.appendChild(musicItem);
            this.cloudItems.push({
                element: musicItem,
                type: "music",
                id: pair.id,
                matched: false,
                x: 0,
                y: 0,
                vx: Math.random() * 0.2 - 0.1,
                vy: Math.random() * 0.2 - 0.1,
            });
        });

        this.positionCloudItems();
        this.animateCloudItems();
    }

    createGameItem(game) {
        const gameItem = document.createElement("div");
        gameItem.className = "cloud-item game-item";
        gameItem.dataset.id = game.id;
        gameItem.dataset.type = "game";

        const gameImage = document.createElement("img");
        gameImage.className = "item-image";
        gameImage.src = game.image;
        gameImage.alt = game.name;
        gameItem.appendChild(gameImage);

        const gameName = document.createElement("div");
        gameName.className = "item-name";
        gameName.textContent = game.name;
        gameItem.appendChild(gameName);

        this.setupDragEvents(gameItem);

        return gameItem;
    }

    createMusicItem(music) {
        const musicItem = document.createElement("div");
        musicItem.className = "cloud-item music-item";
        musicItem.dataset.id = music.id;
        musicItem.dataset.type = "music";

        const musicImage = document.createElement("img");
        musicImage.className = "item-image";
        musicImage.src = music.image;
        musicImage.alt = music.tune;
        musicItem.appendChild(musicImage);

        const musicName = document.createElement("div");
        musicName.className = "item-name";
        musicName.textContent = music.tune;
        musicItem.appendChild(musicName);

        const musicControls = document.createElement("div");
        musicControls.className = "music-controls";

        const playButton = UI.createButton(
            "▶",
            (e) => {
                e.stopPropagation();
                this.playMusic(music);
            },
            "music-btn play-btn",
        );

        const stopButton = UI.createButton(
            "⏹",
            (e) => {
                e.stopPropagation();
                this.stopMusic();
            },
            "music-btn stop-btn",
        );

        musicControls.appendChild(playButton);
        musicControls.appendChild(stopButton);

        musicItem.appendChild(musicControls);

        this.setupDragEvents(musicItem);

        return musicItem;
    }

    setupDragEvents(element) {
        let startX, startY;
        let offsetX, offsetY;

        element.addEventListener("mousedown", (e) => {
            e.preventDefault();

            const itemId = element.dataset.id;
            const itemType = element.dataset.type;
            if (this.isItemMatched(itemId, itemType)) return;

            startX = e.clientX;
            startY = e.clientY;

            const rect = element.getBoundingClientRect();
            offsetX = startX - rect.left;
            offsetY = startY - rect.top;

            this.startDragging(
                element,
                e.clientX - offsetX,
                e.clientY - offsetY,
            );

            const mouseMoveHandler = (e) => {
                e.preventDefault();
                if (this.currentlyDragging) {
                    const x = e.clientX - offsetX;
                    const y = e.clientY - offsetY;
                    this.dragTo(x, y);
                }
            };

            const mouseUpHandler = () => {
                document.removeEventListener("mousemove", mouseMoveHandler);
                document.removeEventListener("mouseup", mouseUpHandler);
                this.stopDragging();
            };

            document.addEventListener("mousemove", mouseMoveHandler);
            document.addEventListener("mouseup", mouseUpHandler);
        });

        element.addEventListener("touchstart", (e) => {
            const itemId = element.dataset.id;
            const itemType = element.dataset.type;
            if (this.isItemMatched(itemId, itemType)) return;

            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;

            const rect = element.getBoundingClientRect();
            offsetX = startX - rect.left;
            offsetY = startY - rect.top;

            this.startDragging(
                element,
                touch.clientX - offsetX,
                touch.clientY - offsetY,
            );

            const touchMoveHandler = (e) => {
                if (this.currentlyDragging) {
                    const touch = e.touches[0];
                    const x = touch.clientX - offsetX;
                    const y = touch.clientY - offsetY;
                    this.dragTo(x, y);
                }
            };

            const touchEndHandler = () => {
                document.removeEventListener("touchmove", touchMoveHandler);
                document.removeEventListener("touchend", touchEndHandler);
                this.stopDragging();
            };

            document.addEventListener("touchmove", touchMoveHandler);
            document.addEventListener("touchend", touchEndHandler);
        });
    }

    startDragging(element, x, y) {
        this.currentlyDragging = element;
        this.currentlyDragging.classList.add("dragging");

        this.dragTo(x, y);

        const cloudItem = this.findCloudItemByElement(element);
        if (cloudItem) {
            cloudItem.dragging = true;
        }
    }

    dragTo(x, y) {
        if (!this.currentlyDragging) return;

        const rect = this.cloudContainer.getBoundingClientRect();
        const containerLeft = rect.left;
        const containerTop = rect.top;
        const containerRight = rect.right;
        const containerBottom = rect.bottom;

        const elementRect = this.currentlyDragging.getBoundingClientRect();
        const elementWidth = elementRect.width;
        const elementHeight = elementRect.height;

        const boundedX = Math.max(
            containerLeft,
            Math.min(x, containerRight - elementWidth),
        );
        const boundedY = Math.max(
            containerTop,
            Math.min(y, containerBottom - elementHeight),
        );

        this.currentlyDragging.style.left = `${boundedX - containerLeft}px`;
        this.currentlyDragging.style.top = `${boundedY - containerTop}px`;

        this.checkForPotentialMatch();
    }

    stopDragging() {
        if (!this.currentlyDragging) return;

        this.currentlyDragging.classList.remove("dragging");

        if (this.potentialMatch) {
            this.checkMatch(this.currentlyDragging, this.potentialMatch);
        }

        const cloudItem = this.findCloudItemByElement(this.currentlyDragging);
        if (cloudItem) {
            cloudItem.dragging = false;

            const rect = this.currentlyDragging.getBoundingClientRect();
            const containerRect = this.cloudContainer.getBoundingClientRect();
            cloudItem.x = rect.left - containerRect.left + rect.width / 2;
            cloudItem.y = rect.top - containerRect.top + rect.height / 2;
        }

        this.currentlyDragging = null;
        this.potentialMatch = null;

        document
            .querySelectorAll(".cloud-item.being-matched")
            .forEach((item) => {
                item.classList.remove("being-matched");
            });
    }

    checkForPotentialMatch() {
        if (!this.currentlyDragging) return;

        if (this.potentialMatch) {
            this.potentialMatch.classList.remove("being-matched");
            this.potentialMatch = null;
        }

        const draggingId = this.currentlyDragging.dataset.id;
        const draggingType = this.currentlyDragging.dataset.type;

        const potentialMatches = Array.from(
            document.querySelectorAll(`.cloud-item:not(.dragging)`),
        ).filter(
            (item) =>
                item.dataset.id === draggingId &&
                item.dataset.type !== draggingType &&
                !this.isItemMatched(item.dataset.id, item.dataset.type),
        );

        if (potentialMatches.length === 0) return;

        const draggingRect = this.currentlyDragging.getBoundingClientRect();
        const draggingCenter = {
            x: draggingRect.left + draggingRect.width / 2,
            y: draggingRect.top + draggingRect.height / 2,
        };

        let closestMatch = null;
        let closestDistance = Infinity;

        potentialMatches.forEach((match) => {
            const matchRect = match.getBoundingClientRect();
            const matchCenter = {
                x: matchRect.left + matchRect.width / 2,
                y: matchRect.top + matchRect.height / 2,
            };

            const distance = Math.sqrt(
                Math.pow(draggingCenter.x - matchCenter.x, 2) +
                    Math.pow(draggingCenter.y - matchCenter.y, 2),
            );

            if (distance < closestDistance) {
                closestDistance = distance;
                closestMatch = match;
            }
        });

        if (closestMatch && closestDistance < this.options.matchDistance) {
            this.potentialMatch = closestMatch;
            this.potentialMatch.classList.add("being-matched");
        }
    }

    checkMatch(item1, item2) {
        const id1 = item1.dataset.id;
        const id2 = item2.dataset.id;
        const type1 = item1.dataset.type;
        const type2 = item2.dataset.type;

        if (type1 === type2) return;

        if (id1 === id2) {
            this.handleCorrectMatch(item1, item2);
        } else {
            this.handleIncorrectMatch(item1, item2);
        }
    }

    handleCorrectMatch(item1, item2) {
        const id = item1.dataset.id;
        this.markItemMatched(id, "music");
        this.markItemMatched(id, "game");

        this.playSuccessSound();

        item1.classList.add("correct-match");
        item2.classList.add("correct-match");

        setTimeout(() => {
            item1.style.display = "none";
            item2.style.display = "none";
        }, 800);

        this.matchedPairs++;
        this.updateProgress();

        if (this.matchedPairs === this.totalPairs) {
            setTimeout(() => this.showSuccessModal(), 1000);
        }
    }

    handleIncorrectMatch(item1, item2) {
        item1.classList.add("wrong-match");
        item2.classList.add("wrong-match");

        setTimeout(() => {
            item1.classList.remove("wrong-match");
            item2.classList.remove("wrong-match");
        }, 500);
    }

    markItemMatched(id, type) {
        const cloudItem = this.cloudItems.find(
            (item) => item.id === id && item.type === type,
        );

        if (cloudItem) {
            cloudItem.matched = true;
        }
    }

    isItemMatched(id, type) {
        const cloudItem = this.cloudItems.find(
            (item) => item.id === id && item.type === type,
        );

        return cloudItem && cloudItem.matched;
    }

    findCloudItemByElement(element) {
        return this.cloudItems.find((item) => item.element === element);
    }

    positionCloudItems() {
        const containerWidth = this.cloudContainer.clientWidth;
        const containerHeight = this.cloudContainer.clientHeight;

        const columns = Math.ceil(Math.sqrt(this.cloudItems.length));
        const rows = Math.ceil(this.cloudItems.length / columns);

        const cellWidth = containerWidth / columns;
        const cellHeight = containerHeight / rows;

        const shuffledItems = [...this.cloudItems].sort(
            () => Math.random() - 0.5,
        );

        shuffledItems.forEach((item, index) => {
            const row = Math.floor(index / columns);
            const col = index % columns;

            const baseX = col * cellWidth + cellWidth / 2;
            const baseY = row * cellHeight + cellHeight / 2;

            const randomX = baseX + (Math.random() * 0.8 - 0.4) * cellWidth;
            const randomY = baseY + (Math.random() * 0.8 - 0.4) * cellHeight;

            item.x = randomX;
            item.y = randomY;
            item.element.style.left = `${
                randomX - item.element.clientWidth / 2
            }px`;
            item.element.style.top = `${
                randomY - item.element.clientHeight / 2
            }px`;
        });
    }

    animateCloudItems() {
        const containerWidth = this.cloudContainer.clientWidth;
        const containerHeight = this.cloudContainer.clientHeight;

        this.cloudItems.forEach((item) => {
            if (item.matched || item.dragging) return;

            item.x += item.vx;
            item.y += item.vy;

            const itemWidth = item.element.clientWidth;
            const itemHeight = item.element.clientHeight;

            if (item.x < itemWidth / 2) {
                item.x = itemWidth / 2;
                item.vx = Math.abs(item.vx) * 0.8;
            } else if (item.x > containerWidth - itemWidth / 2) {
                item.x = containerWidth - itemWidth / 2;
                item.vx = -Math.abs(item.vx) * 0.8;
            }

            if (item.y < itemHeight / 2) {
                item.y = itemHeight / 2;
                item.vy = Math.abs(item.vy) * 0.8;
            } else if (item.y > containerHeight - itemHeight / 2) {
                item.y = containerHeight - itemHeight / 2;
                item.vy = -Math.abs(item.vy) * 0.8;
            }

            item.vx += (Math.random() * 0.1 - 0.05) * 0.1;
            item.vy += (Math.random() * 0.1 - 0.05) * 0.1;

            item.vx *= 0.99;
            item.vy *= 0.99;

            const maxSpeed = 0.5;
            const speed = Math.sqrt(item.vx * item.vx + item.vy * item.vy);
            if (speed > maxSpeed) {
                item.vx = (item.vx / speed) * maxSpeed;
                item.vy = (item.vy / speed) * maxSpeed;
            }

            item.element.style.left = `${item.x - itemWidth / 2}px`;
            item.element.style.top = `${item.y - itemHeight / 2}px`;
        });

        requestAnimationFrame(() => this.animateCloudItems());
    }

    playMusic(music) {
        this.stopMusic();

        this.currentAudio = new Audio(music.audio);

        this.currentAudio.addEventListener("ended", () => {
            this.currentAudio.currentTime = 0;
            this.currentAudio.play().catch((error) => {
                console.error("Error playing audio:", error);
            });
        });

        this.currentAudio.play().catch((error) => {
            console.error("Error playing audio:", error);

            const modal = new GameModal();
            modal.setContent(`
                <h2 style="text-align: center; margin-bottom: 20px; color: var(--color-warning);">Audio Playback Note</h2>
                <p style="margin-bottom: 20px; text-align: center;">
                    Audio files might not be available in the preview. In the actual game, 8-bit music tracks would play here.
                </p>
                <p style="text-align: center;">
                    For this challenge, please imagine the iconic tune from ${music.tune} is playing.
                </p>
            `);

            modal.addButton("OK", () => modal.hide());
            modal.show();
        });

        const musicItem = document.querySelector(
            `.music-item[data-id="${music.id}"]`,
        );
        if (musicItem) {
            musicItem.classList.add("pulsing");
        }
    }

    stopMusic() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;

            document.querySelectorAll(".music-item.pulsing").forEach((item) => {
                item.classList.remove("pulsing");
            });
        }
    }

    playSuccessSound() {
        try {
            const context = new (window.AudioContext ||
                window.webkitAudioContext)();
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(context.destination);

            oscillator.type = "sine";
            oscillator.frequency.setValueAtTime(587.33, context.currentTime);
            oscillator.frequency.setValueAtTime(
                783.99,
                context.currentTime + 0.2,
            );

            gainNode.gain.setValueAtTime(0.1, context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(
                0.001,
                context.currentTime + 0.5,
            );

            oscillator.start(context.currentTime);
            oscillator.stop(context.currentTime + 0.5);
        } catch (e) {
            console.log("Web Audio API not supported");
        }
    }

    updateProgress() {
        const remainingItems = (this.totalPairs - this.matchedPairs) * 2;

        this.matchCounter.textContent = `${this.matchedPairs}/${this.totalPairs}`;
        this.remainingCounter.textContent = `${remainingItems} items remaining`;

        const percentage = (this.matchedPairs / this.totalPairs) * 100;
        this.progressBar.style.width = `${percentage}%`;
    }

    showSuccessModal() {
        this.stopMusic();

        const modal = new GameModal();
        modal.setContent(`
            <h2 style="text-align: center; margin-bottom: 20px; color: var(--color-success);">Challenge Complete!</h2>
            <p style="margin-bottom: 20px; text-align: center;">
                Congratulations! You've successfully matched all the 8-bit music tracks to their games!
            </p>
            <p style="text-align: center;">
                You've demonstrated impressive knowledge of classic video game music.
            </p>
        `);

        modal.addButton("Continue Journey", () => {
            modal.hide();
            GameComponents.handleGameCompletion();
        });

        modal.show();
    }

    showIntroModal() {
        const modal = new GameModal();
        modal.setContent(`
            <h2 style="text-align: center; margin-bottom: 20px;">${
                this.options.gameData.title || "8-bit Music Identification"
            }</h2>
            <p style="margin-bottom: 20px; text-align: center;">
                ${
                    this.options.gameData.description ||
                    "Match these classic 8-bit tunes to their video games of origin."
                }
            </p>
            <p style="text-align: center;">
                Click the play button to listen to each music track, then drag it to its matching game. When you make a correct match, both items will disappear!
            </p>
        `);

        modal.addButton("Begin Challenge", () => modal.hide());
        modal.show();
    }

    handleResize() {
        this.positionCloudItems();
    }
}

window.addEventListener("resize", () => {
    const gameInstance = window.gameInstance;
    if (gameInstance && typeof gameInstance.handleResize === "function") {
        gameInstance.handleResize();
    }
});

export default MusicCloudGame;
