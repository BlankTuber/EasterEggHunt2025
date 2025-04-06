import UI from "../util/ui.js";
import GameComponents from "../util/components.js";
import GameModal from "../util/modal.js";

class ColorMixerGame {
    constructor(options = {}) {
        this.options = {
            containerId: "game-container",
            title: "Color Mixer Challenge",
            description:
                "Mix the colors to match the target colors and complete your journey.",
            leeway: 10, // RGB value leeway (±10)
            ...options,
        };

        this.container = document.getElementById(this.options.containerId);
        if (!this.container) {
            console.error("Color mixer game container not found");
            return;
        }

        // Game state
        this.currentLevel = 0;
        this.maxLevels = 5;
        this.gameActive = false;
        this.attempts = 0;
        this.maxAttempts = 3; // Per level

        // Color levels (target colors to match)
        this.levels = [
            {
                name: "Royal Purple",
                rgb: { r: 102, g: 51, b: 153 },
                hint: "A deep purple with more blue than red",
            },
            {
                name: "Emerald Green",
                rgb: { r: 46, g: 204, b: 113 },
                hint: "A vibrant green with a touch of blue",
            },
            {
                name: "Sunset Orange",
                rgb: { r: 243, g: 156, b: 18 },
                hint: "A warm orange with high red, medium green, and low blue",
            },
            {
                name: "Ocean Blue",
                rgb: { r: 52, g: 152, b: 219 },
                hint: "A deep blue with a hint of green",
            },
            {
                name: "Ruby Red",
                rgb: { r: 192, g: 57, b: 43 },
                hint: "A rich red with low green and blue values",
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
                    "Use the RGB sliders to mix a color that matches the target color shown.",
                image: "images/tutorial/colormixer-1.jpg",
            },
            {
                title: "Matching Colors",
                description:
                    "Adjust the Red, Green, and Blue values until your color matches the target. You'll have some leeway for each value.",
                image: "images/tutorial/colormixer-2.jpg",
            },
            {
                title: "Completing Levels",
                description:
                    "Match all target colors to complete the challenge. You have 3 attempts per level.",
                image: "images/tutorial/colormixer-3.jpg",
            },
        ];

        GameComponents.addHowToPlay(layout.container, howToPlayPages);

        // Create progress tracker
        this.progressTracker = GameComponents.createProgressTracker(
            1,
            this.maxLevels,
        );
        this.gameContent.appendChild(this.progressTracker);

        // Create color mixer area
        this.createColorMixerArea();

        // Create attempt counter
        this.createAttemptCounter();
    }

    createColorMixerArea() {
        // Create color mixer container
        const colorMixerContainer = document.createElement("div");
        colorMixerContainer.className = "color-mixer-container";

        // Create target color section
        const targetSection = document.createElement("div");
        targetSection.className = "target-section";

        const targetLabel = document.createElement("h3");
        targetLabel.className = "section-label";
        targetLabel.textContent = "Target Color";
        targetSection.appendChild(targetLabel);

        // Target color display
        this.targetColorName = document.createElement("div");
        this.targetColorName.className = "color-name";
        targetSection.appendChild(this.targetColorName);

        this.targetColorDisplay = document.createElement("div");
        this.targetColorDisplay.className = "color-display target-color";
        targetSection.appendChild(this.targetColorDisplay);

        // Target color hint
        this.targetColorHint = document.createElement("div");
        this.targetColorHint.className = "color-hint";
        targetSection.appendChild(this.targetColorHint);

        // Create mixed color section
        const mixedSection = document.createElement("div");
        mixedSection.className = "mixed-section";

        const mixedLabel = document.createElement("h3");
        mixedLabel.className = "section-label";
        mixedLabel.textContent = "Your Mix";
        mixedSection.appendChild(mixedLabel);

        // Mixed color display
        this.mixedColorDisplay = document.createElement("div");
        this.mixedColorDisplay.className = "color-display mixed-color";
        mixedSection.appendChild(this.mixedColorDisplay);

        // RGB values display
        this.rgbValuesDisplay = document.createElement("div");
        this.rgbValuesDisplay.className = "rgb-values";
        this.rgbValuesDisplay.textContent = "RGB: 0, 0, 0";
        mixedSection.appendChild(this.rgbValuesDisplay);

        // Create color mixer controls
        const controlsSection = document.createElement("div");
        controlsSection.className = "controls-section";

        // Create RGB sliders
        this.createColorSliders(controlsSection);

        // Create check button
        this.checkButton = UI.createButton("Check Color", () =>
            this.checkColor(),
        );
        controlsSection.appendChild(this.checkButton);

        // Add sections to container
        colorMixerContainer.appendChild(targetSection);
        colorMixerContainer.appendChild(mixedSection);
        colorMixerContainer.appendChild(controlsSection);

        // Create feedback area
        this.feedbackArea = document.createElement("div");
        this.feedbackArea.className = "feedback hidden";
        colorMixerContainer.appendChild(this.feedbackArea);

        this.gameContent.appendChild(colorMixerContainer);
    }

    createColorSliders(container) {
        // Create sliders container
        const slidersContainer = document.createElement("div");
        slidersContainer.className = "sliders-container";

        // Create RGB sliders
        this.createSlider(slidersContainer, "red", "Red", 0, 255, 0);
        this.createSlider(slidersContainer, "green", "Green", 0, 255, 0);
        this.createSlider(slidersContainer, "blue", "Blue", 0, 255, 0);

        container.appendChild(slidersContainer);
    }

    createSlider(container, id, label, min, max, value) {
        const sliderContainer = document.createElement("div");
        sliderContainer.className = `slider-container ${id}-slider-container`;

        // Create label
        const sliderLabel = document.createElement("label");
        sliderLabel.htmlFor = `${id}-slider`;
        sliderLabel.textContent = label;
        sliderLabel.className = "slider-label";
        sliderContainer.appendChild(sliderLabel);

        // Create slider wrapper
        const sliderWrapper = document.createElement("div");
        sliderWrapper.className = "slider-wrapper";

        // Create slider
        const slider = document.createElement("input");
        slider.type = "range";
        slider.id = `${id}-slider`;
        slider.className = "color-slider";
        slider.min = min;
        slider.max = max;
        slider.value = value;
        slider.addEventListener("input", () => this.updateMixedColor());
        sliderWrapper.appendChild(slider);

        // Create value display
        const valueDisplay = document.createElement("span");
        valueDisplay.className = "slider-value";
        valueDisplay.textContent = value;
        valueDisplay.id = `${id}-value`;
        sliderWrapper.appendChild(valueDisplay);

        sliderContainer.appendChild(sliderWrapper);
        container.appendChild(sliderContainer);

        return slider;
    }

    createAttemptCounter() {
        // Create attempt counter container
        const attemptsContainer = document.createElement("div");
        attemptsContainer.className = "attempts-container";

        // Create label
        const attemptsLabel = document.createElement("span");
        attemptsLabel.textContent = "Attempts remaining: ";
        attemptsContainer.appendChild(attemptsLabel);

        // Create counter
        this.attemptsCounter = document.createElement("span");
        this.attemptsCounter.className = "attempts-counter";
        this.attemptsCounter.textContent = this.maxAttempts;
        attemptsContainer.appendChild(this.attemptsCounter);

        this.gameContent.appendChild(attemptsContainer);
    }

    loadLevel(level) {
        // Reset attempts
        this.attempts = 0;
        this.updateAttemptsCounter();

        // Update progress tracker
        this.progressTracker.update(level + 1);

        // Get level data
        const levelData = this.levels[level];
        this.currentLevel = level;

        // Update target color
        this.targetColorName.textContent = levelData.name;
        this.targetColorDisplay.style.backgroundColor = this.rgbToHex(
            levelData.rgb,
        );
        this.targetColorHint.textContent = levelData.hint;

        // Reset sliders
        document.getElementById("red-slider").value = 128;
        document.getElementById("green-slider").value = 128;
        document.getElementById("blue-slider").value = 128;

        // Update mixed color
        this.updateMixedColor();

        // Reset feedback
        this.hideFeedback();
    }

    updateMixedColor() {
        // Get current slider values
        const r = parseInt(document.getElementById("red-slider").value);
        const g = parseInt(document.getElementById("green-slider").value);
        const b = parseInt(document.getElementById("blue-slider").value);

        // Update slider value displays
        document.getElementById("red-value").textContent = r;
        document.getElementById("green-value").textContent = g;
        document.getElementById("blue-value").textContent = b;

        // Update mixed color display
        const hexColor = this.rgbToHex({ r, g, b });
        this.mixedColorDisplay.style.backgroundColor = hexColor;

        // Update RGB values display
        this.rgbValuesDisplay.textContent = `RGB: ${r}, ${g}, ${b}`;
    }

    checkColor() {
        // Get current mixed color
        const mixedR = parseInt(document.getElementById("red-slider").value);
        const mixedG = parseInt(document.getElementById("green-slider").value);
        const mixedB = parseInt(document.getElementById("blue-slider").value);

        // Get target color
        const targetColor = this.levels[this.currentLevel].rgb;

        // Check if colors match within leeway
        const matchesR =
            Math.abs(mixedR - targetColor.r) <= this.options.leeway;
        const matchesG =
            Math.abs(mixedG - targetColor.g) <= this.options.leeway;
        const matchesB =
            Math.abs(mixedB - targetColor.b) <= this.options.leeway;

        if (matchesR && matchesG && matchesB) {
            // Success - color matches
            this.handleCorrectMatch();
        } else {
            // Failure - colors don't match
            this.handleIncorrectMatch(targetColor, {
                r: mixedR,
                g: mixedG,
                b: mixedB,
            });
        }
    }

    handleCorrectMatch() {
        // Show success feedback
        this.showFeedback("Perfect match! Well done!", "success");

        // Disable check button
        this.checkButton.disabled = true;

        // Check if all levels completed
        if (this.currentLevel >= this.levels.length - 1) {
            // Game completed
            setTimeout(() => this.showCompletionModal(), 1000);
        } else {
            // Next level
            setTimeout(() => {
                this.loadLevel(this.currentLevel + 1);
                this.checkButton.disabled = false;
            }, 1500);
        }
    }

    handleIncorrectMatch(targetColor, mixedColor) {
        // Increment attempts
        this.attempts++;
        this.updateAttemptsCounter();

        // Calculate how far off each channel is
        const diffR = targetColor.r - mixedColor.r;
        const diffG = targetColor.g - mixedColor.g;
        const diffB = targetColor.b - mixedColor.b;

        // Create feedback message
        let feedback = "Not quite there yet. ";

        if (Math.abs(diffR) > this.options.leeway) {
            feedback += diffR > 0 ? "Add more red. " : "Reduce red. ";
        }

        if (Math.abs(diffG) > this.options.leeway) {
            feedback += diffG > 0 ? "Add more green. " : "Reduce green. ";
        }

        if (Math.abs(diffB) > this.options.leeway) {
            feedback += diffB > 0 ? "Add more blue. " : "Reduce blue. ";
        }

        // Show feedback
        this.showFeedback(feedback, "error");

        // Check if max attempts reached
        if (this.attempts >= this.maxAttempts) {
            // Show failure modal
            this.showFailureModal();
        }
    }

    updateAttemptsCounter() {
        this.attemptsCounter.textContent = this.maxAttempts - this.attempts;
    }

    showFeedback(message, type = "info") {
        this.feedbackArea.textContent = message;
        this.feedbackArea.className = `feedback ${type}`;
    }

    hideFeedback() {
        this.feedbackArea.className = "feedback hidden";
    }

    rgbToHex(rgb) {
        return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    }

    startGame() {
        this.gameActive = true;
        this.loadLevel(0);
    }

    showIntroModal() {
        const modal = new GameModal();
        modal.setContent(`
            <h2 style="text-align: center; margin-bottom: 20px;">${this.options.title}</h2>
            <p style="margin-bottom: 20px; text-align: center;">
                The Chronicler has discovered ancient color formulas that need to be recreated.
            </p>
            <p style="margin-bottom: 20px; text-align: center;">
                Use the RGB sliders to mix colors that match the target colors shown. 
                You'll need to match 5 different colors to complete the challenge.
            </p>
            <p style="text-align: center;">
                Don't worry about being perfect - there's some leeway in your matches!
            </p>
        `);

        modal.addButton("Begin Challenge", () => {
            modal.hide();
            this.startGame();
        });

        modal.show();
    }

    showCompletionModal() {
        const modal = new GameModal();
        modal.setContent(`
            <h2 style="text-align: center; margin-bottom: 20px; color: var(--color-success);">Challenge Complete!</h2>
            <p style="margin-bottom: 20px; text-align: center;">
                You've successfully matched all the ancient colors!
            </p>
            <p style="text-align: center;">
                Your mastery of color mixing has unlocked the next stage of your journey.
            </p>
        `);

        modal.addButton("Continue", () => {
            modal.hide();
            // Complete challenge
            GameComponents.handleGameCompletion();
        });

        modal.show();
    }

    showFailureModal() {
        const modal = new GameModal();
        modal.setContent(`
            <h2 style="text-align: center; margin-bottom: 20px; color: var(--color-error);">Too Many Attempts</h2>
            <p style="margin-bottom: 20px; text-align: center;">
                You've used all your attempts for this level.
            </p>
            <p style="text-align: center;">
                The target color was: ${this.levels[this.currentLevel].name}
                <div style="width: 100px; height: 30px; background-color: ${this.rgbToHex(
                    this.levels[this.currentLevel].rgb,
                )}; margin: 10px auto; border: 1px solid #333;"></div>
                RGB: ${this.levels[this.currentLevel].rgb.r}, ${
            this.levels[this.currentLevel].rgb.g
        }, ${this.levels[this.currentLevel].rgb.b}
            </p>
        `);

        modal.addButton("Try Again", () => {
            modal.hide();
            this.loadLevel(this.currentLevel);
        });

        modal.addButton("Reset Game", () => {
            modal.hide();
            this.loadLevel(0);
        });

        modal.show();
    }
}

export default ColorMixerGame;
