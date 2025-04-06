import UI from "../util/ui.js";
import GameComponents from "../util/components.js";
import GameModal from "../util/modal.js";

class WhackAMoleGame {
    constructor(options = {}) {
        this.options = {
            containerId: "game-container",
            title: "Arcane Creatures Challenge",
            description:
                "Test your reflexes by quickly tapping the magical creatures as they appear!",
            gridSize: { rows: 3, cols: 3 },
            targetScore: 50,
            gameDuration: 45, // seconds
            difficulty: "normal", // easy, normal, hard
            ...options,
        };

        this.container = document.getElementById(this.options.containerId);
        if (!this.container) {
            console.error("Game container not found");
            return;
        }

        // Game state
        this.score = 0;
        this.gameActive = false;
        this.timeLeft = this.options.gameDuration;
        this.creatures = [];
        this.activeCreatures = [];
        this.activeTimeouts = [];
        this.combo = 0;
        this.maxCombo = 0;
        this.streakTimeoutId = null;
        this.powerUpActive = false;
        this.magicEffects = [];

        // Creature types
        this.creatureTypes = [
            {
                type: "goblin",
                name: "Goblin",
                points: 1,
                speed: 1.0,
                frequency: 0.5,
                stayTime: [800, 1200], // Time on screen in ms [min, max]
                cssClass: "creature-goblin",
                speedMultiplier: 1.0,
            },
            {
                type: "imp",
                name: "Imp",
                points: 2,
                speed: 1.3,
                frequency: 0.3,
                stayTime: [600, 1000],
                cssClass: "creature-imp",
                speedMultiplier: 1.3,
            },
            {
                type: "fairy",
                name: "Fairy",
                points: 3,
                speed: 1.6,
                frequency: 0.15,
                stayTime: [500, 800],
                cssClass: "creature-fairy",
                speedMultiplier: 1.6,
            },
            {
                type: "dragon",
                name: "Dragon",
                points: 5,
                speed: 2.0,
                frequency: 0.05,
                stayTime: [400, 700],
                cssClass: "creature-dragon",
                speedMultiplier: 2.0,
            },
            {
                type: "wizard",
                name: "Wizard",
                points: -3,
                speed: 0.8,
                frequency: 0.1,
                stayTime: [1000, 1500],
                cssClass: "creature-wizard",
                isNegative: true,
                speedMultiplier: 0.8,
            },
            {
                type: "powerup",
                name: "Power Crystal",
                points: 0,
                speed: 0.7,
                frequency: 0.03,
                stayTime: [1200, 1800],
                cssClass: "creature-powerup",
                isPowerUp: true,
                speedMultiplier: 0.7,
            },
        ];

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

        // Create game layout
        const layout = GameComponents.createGameLayout(
            this.options.title,
            this.options.description,
        );

        this.container.appendChild(layout.container);
        this.gameContent = layout.content;

        // Create how to play button
        const howToPlayPages = [
            {
                title: "How to Play",
                description:
                    "Magical creatures will appear from the portals. Tap or click on them as quickly as possible to score points!",
                image: "images/tutorial/whack-1.jpg",
            },
            {
                title: "Creature Types",
                description:
                    "Different creatures yield different points. Be quick, as faster creatures are worth more! But beware of hitting wizards - they'll cost you points!",
                image: "images/tutorial/whack-2.jpg",
            },
            {
                title: "Special Features",
                description:
                    "Build combos by hitting creatures quickly in succession. Look for power crystals that temporarily enhance your magic powers!",
                image: "images/tutorial/whack-3.jpg",
            },
        ];

        GameComponents.addHowToPlay(layout.container, howToPlayPages);

        // Create score display
        this.createScoreDisplay();

        // Create timer
        this.createTimer();

        // Create game grid
        this.createGameGrid();

        // Create combo display
        this.createComboDisplay();

        // Create effects container
        this.createEffectsContainer();
    }

    createScoreDisplay() {
        // Create score container
        const scoreContainer = document.createElement("div");
        scoreContainer.className = "score-display";

        // Create score label
        const scoreLabel = document.createElement("div");
        scoreLabel.className = "score-label";
        scoreLabel.textContent = "Score:";
        scoreContainer.appendChild(scoreLabel);

        // Create score value
        this.scoreValue = document.createElement("div");
        this.scoreValue.className = "score-value";
        this.scoreValue.textContent = "0";
        scoreContainer.appendChild(this.scoreValue);

        // Create target score display
        const targetDisplay = document.createElement("div");
        targetDisplay.className = "target-display";
        targetDisplay.textContent = `Target: ${this.options.targetScore}`;
        scoreContainer.appendChild(targetDisplay);

        this.gameContent.appendChild(scoreContainer);
    }

    createTimer() {
        // Create timer container
        const timerContainer = document.createElement("div");
        timerContainer.className = "timer-container";

        // Create timer label
        const timerLabel = document.createElement("div");
        timerLabel.className = "timer-label";
        timerLabel.textContent = "Time:";
        timerContainer.appendChild(timerLabel);

        // Create timer value
        this.timerValue = document.createElement("div");
        this.timerValue.className = "timer-value";
        this.timerValue.textContent = this.formatTime(this.timeLeft);
        timerContainer.appendChild(this.timerValue);

        this.gameContent.appendChild(timerContainer);
    }

    createGameGrid() {
        // Create grid container
        const gridContainer = document.createElement("div");
        gridContainer.className = "grid-container";

        // Create grid
        const { rows, cols } = this.options.gridSize;
        for (let i = 0; i < rows * cols; i++) {
            // Create hole container
            const hole = document.createElement("div");
            hole.className = "hole";
            hole.dataset.index = i;

            // Create portal
            const portal = document.createElement("div");
            portal.className = "portal";
            hole.appendChild(portal);

            // Create creature
            const creature = document.createElement("div");
            creature.className = "creature";
            creature.dataset.index = i;
            creature.addEventListener("click", () => this.hitCreature(i));
            creature.addEventListener("touchstart", (e) => {
                e.preventDefault();
                this.hitCreature(i);
            });

            hole.appendChild(creature);
            gridContainer.appendChild(hole);
            this.creatures.push({ element: creature, index: i, active: false });
        }

        this.gameContent.appendChild(gridContainer);
    }

    createComboDisplay() {
        // Create combo container
        const comboContainer = document.createElement("div");
        comboContainer.className = "combo-container";

        // Create combo value
        this.comboValue = document.createElement("div");
        this.comboValue.className = "combo-value";
        this.comboValue.textContent = "Combo: 0x";
        comboContainer.appendChild(this.comboValue);

        // Create combo meter
        this.comboMeter = document.createElement("div");
        this.comboMeter.className = "combo-meter";

        this.comboFill = document.createElement("div");
        this.comboFill.className = "combo-fill";
        this.comboMeter.appendChild(this.comboFill);

        comboContainer.appendChild(this.comboMeter);

        this.gameContent.appendChild(comboContainer);
    }

    createEffectsContainer() {
        // Create effects container for visual effects
        this.effectsContainer = document.createElement("div");
        this.effectsContainer.className = "effects-container";
        this.gameContent.appendChild(this.effectsContainer);

        // Create power-up indicator
        this.powerUpIndicator = document.createElement("div");
        this.powerUpIndicator.className = "powerup-indicator hidden";
        this.powerUpIndicator.textContent = "MAGIC AMPLIFIED!";
        this.gameContent.appendChild(this.powerUpIndicator);
    }

    startGame() {
        // Reset game state
        this.score = 0;
        this.updateScore(0);
        this.timeLeft = this.options.gameDuration;
        this.timerValue.textContent = this.formatTime(this.timeLeft);
        this.combo = 0;
        this.maxCombo = 0;
        this.updateComboDisplay();
        this.gameActive = true;
        this.powerUpActive = false;
        this.powerUpIndicator.classList.add("hidden");

        // Start timer
        this.timerInterval = setInterval(() => this.updateTimer(), 1000);

        // Start spawning creatures
        this.spawnCreature();
    }

    stopGame() {
        // Stop timer
        clearInterval(this.timerInterval);

        // Stop all active creature timeouts
        this.activeTimeouts.forEach((timeout) => clearTimeout(timeout));
        this.activeTimeouts = [];

        // Clear active creatures
        this.creatures.forEach((creature) => {
            creature.element.className = "creature";
            creature.active = false;
        });
        this.activeCreatures = [];

        // Clear combo timeout
        if (this.streakTimeoutId) {
            clearTimeout(this.streakTimeoutId);
            this.streakTimeoutId = null;
        }

        // Stop game
        this.gameActive = false;
    }

    updateTimer() {
        if (!this.gameActive) return;

        this.timeLeft--;
        this.timerValue.textContent = this.formatTime(this.timeLeft);

        // Update timer color based on time left
        if (this.timeLeft <= 10) {
            this.timerValue.classList.add("time-low");
        }

        // Check if time's up
        if (this.timeLeft <= 0) {
            this.stopGame();
            this.checkGameResult();
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs
            .toString()
            .padStart(2, "0")}`;
    }

    updateScore(points) {
        this.score += points;
        this.scoreValue.textContent = this.score;

        // Animate score change
        if (points > 0) {
            this.scoreValue.classList.add("score-increase");
            setTimeout(() => {
                this.scoreValue.classList.remove("score-increase");
            }, 300);
        } else if (points < 0) {
            this.scoreValue.classList.add("score-decrease");
            setTimeout(() => {
                this.scoreValue.classList.remove("score-decrease");
            }, 300);
        }

        // Check if reached target score
        if (this.score >= this.options.targetScore && this.gameActive) {
            this.stopGame();
            this.showSuccessModal();
        }
    }

    spawnCreature() {
        if (!this.gameActive) return;

        // Get available holes (not currently active)
        const availableHoles = this.creatures.filter(
            (creature) => !creature.active,
        );

        if (availableHoles.length === 0) {
            // All holes are occupied, try again in a short delay
            setTimeout(() => this.spawnCreature(), 100);
            return;
        }

        // Select a random hole
        const randomIndex = Math.floor(Math.random() * availableHoles.length);
        const selectedCreature = availableHoles[randomIndex];

        // Determine which creature type to spawn
        const creatureType = this.selectCreatureType();

        // Activate the creature
        this.activateCreature(selectedCreature, creatureType);

        // Schedule next spawn based on difficulty
        const nextSpawnDelay = this.getNextSpawnDelay();
        setTimeout(() => this.spawnCreature(), nextSpawnDelay);
    }

    selectCreatureType() {
        // Weighted selection based on frequency
        const totalFrequency = this.creatureTypes.reduce(
            (sum, type) => sum + type.frequency,
            0,
        );
        let random = Math.random() * totalFrequency;

        for (const creatureType of this.creatureTypes) {
            random -= creatureType.frequency;
            if (random <= 0) {
                return creatureType;
            }
        }

        // Fallback to first type
        return this.creatureTypes[0];
    }

    activateCreature(creature, creatureType) {
        // Mark as active
        creature.active = true;
        creature.type = creatureType;
        this.activeCreatures.push(creature);

        // Apply CSS class
        const element = creature.element;
        element.className = `creature ${creatureType.cssClass} active`;
        element.dataset.points = creatureType.points;
        element.dataset.type = creatureType.type;

        // Apply speed modifier based on difficulty and power-up
        let speedMultiplier = creatureType.speedMultiplier;
        if (this.options.difficulty === "easy") speedMultiplier *= 0.8;
        if (this.options.difficulty === "hard") speedMultiplier *= 1.3;

        // Calculate stay time
        const [minStay, maxStay] = creatureType.stayTime;
        const stayTime =
            Math.floor(minStay + Math.random() * (maxStay - minStay)) /
            speedMultiplier;

        // Schedule hiding the creature
        const timeout = setTimeout(() => {
            this.deactivateCreature(creature);
        }, stayTime);

        this.activeTimeouts.push(timeout);
    }

    deactivateCreature(creature) {
        // Remove from active creatures
        const index = this.activeCreatures.findIndex(
            (c) => c.index === creature.index,
        );
        if (index >= 0) {
            this.activeCreatures.splice(index, 1);
        }

        // Reset state
        creature.active = false;
        creature.element.className = "creature";
        creature.element.dataset.points = "";
        creature.element.dataset.type = "";
    }

    hitCreature(index) {
        if (!this.gameActive) return;

        const creature = this.creatures.find((c) => c.index === index);
        if (!creature || !creature.active) return;

        const element = creature.element;
        const creatureType = creature.type;

        // Check what type of creature was hit
        if (creatureType.isPowerUp) {
            this.activatePowerUp();
            this.createHitEffect(element, "power");
        } else {
            // Calculate points with combo multiplier
            let points = creatureType.points;
            if (this.combo > 0 && points > 0) {
                points = Math.ceil(points * (1 + this.combo * 0.2));
            }

            // Double points during power-up
            if (this.powerUpActive && points > 0) {
                points *= 2;
            }

            // Update score
            this.updateScore(points);

            // Create appropriate hit effect
            if (creatureType.isNegative) {
                this.createHitEffect(element, "negative");
                this.resetCombo();
            } else {
                this.createHitEffect(element, "positive");
                this.incrementCombo();
            }
        }

        // Create flying score text
        this.createFlyingText(element, creatureType.points);

        // Hide the creature
        this.deactivateCreature(creature);

        // Play hit sound
        this.playHitSound(creatureType);
    }

    getNextSpawnDelay() {
        // Base spawn delay varies by difficulty
        let baseDelay;
        switch (this.options.difficulty) {
            case "easy":
                baseDelay = 1200;
                break;
            case "hard":
                baseDelay = 600;
                break;
            default:
                baseDelay = 800; // normal difficulty
        }

        // Add randomness
        const randomVariation = Math.random() * 400 - 200; // -200 to +200 ms

        // Gradually increase spawn rate as time passes
        const timeRatio = 1 - this.timeLeft / this.options.gameDuration;
        const timeBonus = 300 * timeRatio;

        return Math.max(300, baseDelay - timeBonus + randomVariation);
    }

    incrementCombo() {
        // Clear existing timeout
        if (this.streakTimeoutId) {
            clearTimeout(this.streakTimeoutId);
        }

        // Increment combo
        this.combo++;
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }

        // Update combo display
        this.updateComboDisplay();

        // Set timeout to reset combo if no hits for a while
        this.streakTimeoutId = setTimeout(() => {
            this.resetCombo();
        }, 2000);
    }

    resetCombo() {
        if (this.streakTimeoutId) {
            clearTimeout(this.streakTimeoutId);
            this.streakTimeoutId = null;
        }
        this.combo = 0;
        this.updateComboDisplay();
    }

    updateComboDisplay() {
        this.comboValue.textContent = `Combo: ${this.combo}x`;

        // Update combo meter
        const fillWidth = Math.min(100, (this.combo / 10) * 100);
        this.comboFill.style.width = `${fillWidth}%`;

        // Add visual effect for high combos
        if (this.combo >= 5) {
            this.comboValue.classList.add("combo-high");
        } else {
            this.comboValue.classList.remove("combo-high");
        }
    }

    activatePowerUp() {
        // Clear existing power-up timer
        if (this.powerUpTimeoutId) {
            clearTimeout(this.powerUpTimeoutId);
        }

        // Activate power-up
        this.powerUpActive = true;
        this.powerUpIndicator.classList.remove("hidden");

        // Add visual effect to grid
        document.querySelector(".grid-container").classList.add("power-active");

        // Set timeout to end power-up
        this.powerUpTimeoutId = setTimeout(() => {
            this.powerUpActive = false;
            this.powerUpIndicator.classList.add("hidden");
            document
                .querySelector(".grid-container")
                .classList.remove("power-active");
        }, 8000); // Power-up lasts for 8 seconds
    }

    createHitEffect(element, type) {
        const rect = element.getBoundingClientRect();
        const containerRect = this.effectsContainer.getBoundingClientRect();

        const effect = document.createElement("div");
        effect.className = `hit-effect ${type}-effect`;

        // Position the effect at the creature's location
        effect.style.left = `${
            rect.left - containerRect.left + rect.width / 2
        }px`;
        effect.style.top = `${
            rect.top - containerRect.top + rect.height / 2
        }px`;

        this.effectsContainer.appendChild(effect);

        // Remove effect after animation completes
        setTimeout(() => {
            effect.remove();
        }, 1000);
    }

    createFlyingText(element, points) {
        const rect = element.getBoundingClientRect();
        const containerRect = this.effectsContainer.getBoundingClientRect();

        const text = document.createElement("div");
        text.className = `flying-text ${points >= 0 ? "positive" : "negative"}`;

        // Set text content
        if (points > 0) {
            text.textContent = `+${points}`;
        } else if (points < 0) {
            text.textContent = points;
        } else {
            text.textContent = "POWER!";
            text.classList.add("power");
        }

        // Position the text
        text.style.left = `${
            rect.left - containerRect.left + rect.width / 2
        }px`;
        text.style.top = `${rect.top - containerRect.top}px`;

        this.effectsContainer.appendChild(text);

        // Remove text after animation completes
        setTimeout(() => {
            text.remove();
        }, 1500);
    }

    playHitSound(creatureType) {
        try {
            const context = new (window.AudioContext ||
                window.webkitAudioContext)();
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(context.destination);

            // Different sounds for different creatures
            if (creatureType.isPowerUp) {
                // Power-up sound
                oscillator.type = "sine";
                oscillator.frequency.setValueAtTime(440, context.currentTime);
                oscillator.frequency.linearRampToValueAtTime(
                    880,
                    context.currentTime + 0.2,
                );
                gainNode.gain.setValueAtTime(0.2, context.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(
                    0.01,
                    context.currentTime + 0.3,
                );
                oscillator.start(context.currentTime);
                oscillator.stop(context.currentTime + 0.3);
            } else if (creatureType.isNegative) {
                // Negative creature sound
                oscillator.type = "sawtooth";
                oscillator.frequency.setValueAtTime(200, context.currentTime);
                oscillator.frequency.linearRampToValueAtTime(
                    100,
                    context.currentTime + 0.2,
                );
                gainNode.gain.setValueAtTime(0.15, context.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(
                    0.01,
                    context.currentTime + 0.3,
                );
                oscillator.start(context.currentTime);
                oscillator.stop(context.currentTime + 0.3);
            } else {
                // Regular hit sound
                oscillator.type = "square";
                oscillator.frequency.setValueAtTime(
                    300 + creatureType.points * 100,
                    context.currentTime,
                );
                gainNode.gain.setValueAtTime(0.1, context.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(
                    0.01,
                    context.currentTime + 0.1,
                );
                oscillator.start(context.currentTime);
                oscillator.stop(context.currentTime + 0.1);
            }
        } catch (e) {
            console.log("Web Audio API not supported");
        }
    }

    checkGameResult() {
        if (this.score >= this.options.targetScore) {
            this.showSuccessModal();
        } else {
            this.showFailureModal();
        }
    }

    showSuccessModal() {
        const modal = new GameModal();
        modal.setContent(`
            <h2 style="text-align: center; margin-bottom: 20px; color: var(--color-success);">Challenge Complete!</h2>
            <p style="margin-bottom: 20px; text-align: center;">
                Your reflexes are truly remarkable! You've successfully completed the challenge.
            </p>
            <p style="margin-bottom: 20px; text-align: center;">
                Final Score: ${this.score} | Target Score: ${this.options.targetScore}
            </p>
            <p style="text-align: center;">
                Highest Combo: ${this.maxCombo}x
            </p>
        `);

        modal.addButton("Continue Journey", () => {
            modal.hide();
            GameComponents.handleGameCompletion();
        });

        modal.show();
    }

    showFailureModal() {
        const modal = new GameModal();
        modal.setContent(`
            <h2 style="text-align: center; margin-bottom: 20px; color: var(--color-error);">Time's Up!</h2>
            <p style="margin-bottom: 20px; text-align: center;">
                You scored ${this.score} points out of the ${this.options.targetScore} required.
            </p>
            <p style="text-align: center;">
                Keep practicing to improve your reflexes!
            </p>
        `);

        modal.addButton("Try Again", () => {
            modal.hide();
            this.startGame();
        });

        modal.show();
    }

    showIntroModal() {
        const modal = new GameModal();
        modal.setContent(`
            <h2 style="text-align: center; margin-bottom: 20px;">${this.options.title}</h2>
            <p style="margin-bottom: 20px; text-align: center;">
                The Apprentice must prove their reflexes by mastering this ancient game of speed and coordination.
            </p>
            <p style="margin-bottom: 20px; text-align: center;">
                Tap or click on the creatures as they emerge from magical portals. Different creatures yield different points:
            </p>
            <ul style="margin-bottom: 20px; text-align: left; list-style-type: none;">
                <li>• Goblins: 1 point (common)</li>
                <li>• Imps: 2 points (faster)</li>
                <li>• Fairies: 3 points (very fast)</li>
                <li>• Dragons: 5 points (extremely fast, rare)</li>
                <li>• Wizards: -3 points (avoid these!)</li>
                <li>• Power Crystals: Double points for 8 seconds</li>
            </ul>
            <p style="text-align: center;">
                Build combos for bonus points! Score ${this.options.targetScore} points before time runs out to complete the challenge.
            </p>
        `);

        modal.addButton("Begin Challenge", () => {
            modal.hide();
            this.startGame();
        });

        modal.show();
    }
}

export default WhackAMoleGame;
