import UI from "../util/ui.js";
import GameComponents from "../util/components.js";
import GameModal from "../util/modal.js";

class MorseCodeGame {
    constructor(options = {}) {
        this.options = {
            containerId: "game-container",
            message: "THE SECRET LIES BENEATH THE ANCIENT OAK",
            speed: 300, // Base unit for timing in ms
            title: "Morse Code Challenge",
            description:
                "Decode the blinking message to continue your journey.",
            ...options,
        };

        this.container = document.getElementById(this.options.containerId);

        if (!this.container) {
            console.error("Morse code game container not found");
            return;
        }

        // Morse code mapping
        this.morseMap = {
            A: ".-",
            B: "-...",
            C: "-.-.",
            D: "-..",
            E: ".",
            F: "..-.",
            G: "--.",
            H: "....",
            I: "..",
            J: ".---",
            K: "-.-",
            L: ".-..",
            M: "--",
            N: "-.",
            O: "---",
            P: ".--.",
            Q: "--.-",
            R: ".-.",
            S: "...",
            T: "-",
            U: "..-",
            V: "...-",
            W: ".--",
            X: "-..-",
            Y: "-.--",
            Z: "--..",
            0: "-----",
            1: ".----",
            2: "..---",
            3: "...--",
            4: "....-",
            5: ".....",
            6: "-....",
            7: "--...",
            8: "---..",
            9: "----.",
            ".": ".-.-.-",
            ",": "--..--",
            "?": "..--..",
            "'": ".----.",
            "!": "-.-.--",
            "/": "-..-.",
            "(": "-.--.",
            ")": "-.--.-",
            "&": ".-...",
            ":": "---...",
            ";": "-.-.-.",
            "=": "-...-",
            "+": ".-.-.",
            "-": "-....-",
            _: "..--.-",
            '"': ".-..-.",
            $: "...-..-",
            "@": ".--.-.",
        };

        // Game state
        this.isPlaying = false;
        this.timeoutId = null;
        this.currentIndex = 0;
        this.morseSequence = [];

        // Convert message to morse sequence
        this.convertToMorse();

        // Initialize the game
        this.init();
    }

    init() {
        // Create game layout
        this.createGameLayout();

        // Show introduction modal
        this.showIntroModal();
    }

    convertToMorse() {
        const message = this.options.message.toUpperCase();
        this.morseSequence = [];

        for (let i = 0; i < message.length; i++) {
            const char = message[i];
            if (char === " ") {
                // Word space
                this.morseSequence.push({ type: "wordSpace" });
            } else if (this.morseMap[char]) {
                const morse = this.morseMap[char];
                for (let j = 0; j < morse.length; j++) {
                    const signal = morse[j];
                    // Dot or dash
                    this.morseSequence.push({
                        type: signal === "." ? "dot" : "dash",
                    });

                    // Gap between signals in same letter
                    if (j < morse.length - 1) {
                        this.morseSequence.push({ type: "signalGap" });
                    }
                }

                // Gap between letters
                if (i < message.length - 1 && message[i + 1] !== " ") {
                    this.morseSequence.push({ type: "letterGap" });
                }
            }
        }
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
                title: "How to Decode Morse Code",
                description:
                    "Watch the light as it blinks. Dots are short blinks, dashes are longer blinks. Use the Morse code chart to translate the message.",
                image: "images/tutorial/morse-1.jpg",
            },
            {
                title: "Reading the Signals",
                description:
                    "Each letter is separated by a longer pause. Words are separated by an even longer pause. Write down the letters as you decode them.",
                image: "images/tutorial/morse-2.jpg",
            },
            {
                title: "Using the Controls",
                description:
                    "Click 'Start Transmission' to begin the message. If you need to see it again, click 'Restart' at any time. You can also adjust the speed.",
                image: "images/tutorial/morse-3.jpg",
            },
        ];

        GameComponents.addHowToPlay(layout.container, howToPlayPages);

        // Create main game display area with two columns
        const gameDisplayArea = document.createElement("div");
        gameDisplayArea.className = "morse-display-area";
        this.gameContent.appendChild(gameDisplayArea);

        // Create left column (morse signal display)
        const leftColumn = document.createElement("div");
        leftColumn.className = "morse-left-column";
        gameDisplayArea.appendChild(leftColumn);

        // Create morse signal display
        this.createMorseSignalDisplay(leftColumn);

        // Create controls
        this.createControls(leftColumn);

        // Create right column (cheat sheet)
        const rightColumn = document.createElement("div");
        rightColumn.className = "morse-right-column";
        gameDisplayArea.appendChild(rightColumn);

        // Create morse code cheat sheet
        this.createMorseCheatSheet(rightColumn);

        // Create input area
        this.createInputArea();
    }

    createMorseSignalDisplay(container) {
        // Create signal container
        const signalContainer = document.createElement("div");
        signalContainer.className = "morse-signal-container";
        container.appendChild(signalContainer);

        // Create signal light
        this.signalLight = document.createElement("div");
        this.signalLight.className = "morse-signal-light";
        this.signalLight.id = "signal-light";
        signalContainer.appendChild(this.signalLight);

        // Create signal text display
        this.signalText = document.createElement("div");
        this.signalText.className = "morse-signal-text";
        this.signalText.id = "signal-text";
        this.signalText.textContent = "Ready to transmit...";
        signalContainer.appendChild(this.signalText);
    }

    createControls(container) {
        // Create controls container
        const controlsContainer = document.createElement("div");
        controlsContainer.className = "morse-controls";
        container.appendChild(controlsContainer);

        // Create start/stop button
        this.toggleButton = UI.createButton(
            "Start Transmission",
            () => this.toggleTransmission(),
            "toggle-btn",
        );
        controlsContainer.appendChild(this.toggleButton);

        // Create restart button
        this.restartButton = UI.createButton(
            "Restart",
            () => this.restartTransmission(),
            "restart-btn",
        );
        this.restartButton.disabled = true;
        controlsContainer.appendChild(this.restartButton);

        // Create speed control
        const speedControlContainer = document.createElement("div");
        speedControlContainer.className = "speed-control-container";

        const speedLabel = document.createElement("label");
        speedLabel.textContent = "Speed: ";
        speedLabel.htmlFor = "speed-control";
        speedControlContainer.appendChild(speedLabel);

        this.speedControl = document.createElement("input");
        this.speedControl.type = "range";
        this.speedControl.id = "speed-control";
        this.speedControl.className = "speed-control";
        this.speedControl.min = "50";
        this.speedControl.max = "150";
        this.speedControl.value = "100";
        this.speedControl.addEventListener("input", () => this.updateSpeed());
        speedControlContainer.appendChild(this.speedControl);

        this.speedText = document.createElement("span");
        this.speedText.className = "speed-text";
        this.speedText.textContent = "100%";
        speedControlContainer.appendChild(this.speedText);

        controlsContainer.appendChild(speedControlContainer);
    }

    createMorseCheatSheet(container) {
        // Create cheat sheet container
        const cheatSheetContainer = document.createElement("div");
        cheatSheetContainer.className = "morse-cheat-sheet";
        container.appendChild(cheatSheetContainer);

        // Create cheat sheet title
        const cheatSheetTitle = document.createElement("h3");
        cheatSheetTitle.textContent = "Morse Code Reference";
        cheatSheetContainer.appendChild(cheatSheetTitle);

        // Create letters section
        const lettersTitle = document.createElement("h4");
        lettersTitle.textContent = "Letters";
        cheatSheetContainer.appendChild(lettersTitle);

        const lettersGrid = document.createElement("div");
        lettersGrid.className = "morse-grid";
        cheatSheetContainer.appendChild(lettersGrid);

        // Add letters to grid
        for (let i = 65; i <= 90; i++) {
            const char = String.fromCharCode(i);
            const morseChar = this.morseMap[char];
            const charContainer = document.createElement("div");
            charContainer.className = "morse-char";

            const charLetter = document.createElement("span");
            charLetter.className = "char-letter";
            charLetter.textContent = char;
            charContainer.appendChild(charLetter);

            const charMorse = document.createElement("span");
            charMorse.className = "char-morse";
            charMorse.textContent = morseChar;
            charContainer.appendChild(charMorse);

            lettersGrid.appendChild(charContainer);
        }

        // Create numbers section
        const numbersTitle = document.createElement("h4");
        numbersTitle.textContent = "Numbers";
        cheatSheetContainer.appendChild(numbersTitle);

        const numbersGrid = document.createElement("div");
        numbersGrid.className = "morse-grid";
        cheatSheetContainer.appendChild(numbersGrid);

        // Add numbers to grid
        for (let i = 0; i <= 9; i++) {
            const char = i.toString();
            const morseChar = this.morseMap[char];
            const charContainer = document.createElement("div");
            charContainer.className = "morse-char";

            const charLetter = document.createElement("span");
            charLetter.className = "char-letter";
            charLetter.textContent = char;
            charContainer.appendChild(charLetter);

            const charMorse = document.createElement("span");
            charMorse.className = "char-morse";
            charMorse.textContent = morseChar;
            charContainer.appendChild(charMorse);

            numbersGrid.appendChild(charContainer);
        }
    }

    createInputArea() {
        // Create input container
        const inputContainer = document.createElement("div");
        inputContainer.className = "morse-input-container";
        this.gameContent.appendChild(inputContainer);

        // Create input field
        this.answerInput = document.createElement("input");
        this.answerInput.type = "text";
        this.answerInput.className = "morse-answer-input";
        this.answerInput.placeholder = "Enter the decoded message...";

        // Add enter key event
        this.answerInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                this.checkAnswer();
            }
        });

        inputContainer.appendChild(this.answerInput);

        // Create submit button
        const submitBtn = UI.createButton("Submit Answer", () =>
            this.checkAnswer(),
        );
        inputContainer.appendChild(submitBtn);
    }

    toggleTransmission() {
        if (this.isPlaying) {
            this.stopTransmission();
        } else {
            this.startTransmission();
        }
    }

    startTransmission() {
        this.isPlaying = true;
        this.toggleButton.textContent = "Stop Transmission";
        this.restartButton.disabled = false;
        this.signalText.textContent = "Transmitting...";

        // Start playing the sequence
        this.playSequence();
    }

    stopTransmission() {
        this.isPlaying = false;
        this.toggleButton.textContent = "Start Transmission";
        this.signalText.textContent = "Transmission paused.";

        // Clear any pending timeouts
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }

        // Turn off the light
        this.signalLight.classList.remove("active");
    }

    restartTransmission() {
        this.stopTransmission();
        this.currentIndex = 0;
        this.startTransmission();
    }

    updateSpeed() {
        const speedValue = this.speedControl.value;
        this.speedText.textContent = `${speedValue}%`;

        // If currently playing, restart with new speed
        if (this.isPlaying) {
            this.stopTransmission();
            this.startTransmission();
        }
    }

    playSequence() {
        if (!this.isPlaying || this.currentIndex >= this.morseSequence.length) {
            // End of sequence reached
            if (this.isPlaying) {
                this.signalText.textContent =
                    "Transmission complete. Decoding now possible.";
                this.toggleButton.textContent = "Replay Transmission";
                this.isPlaying = false;
            }
            return;
        }

        const currentSignal = this.morseSequence[this.currentIndex];
        const speedFactor = this.speedControl.value / 100;
        let duration = 0;

        switch (currentSignal.type) {
            case "dot":
                // Dot - short light
                this.signalLight.classList.add("active");
                duration = this.options.speed * speedFactor;
                this.signalText.textContent = "• (dot)";
                break;
            case "dash":
                // Dash - longer light
                this.signalLight.classList.add("active");
                duration = this.options.speed * 3 * speedFactor;
                this.signalText.textContent = "− (dash)";
                break;
            case "signalGap":
                // Gap between signals in same letter - short gap
                this.signalLight.classList.remove("active");
                duration = this.options.speed * speedFactor;
                this.signalText.textContent = "Signal gap";
                break;
            case "letterGap":
                // Gap between letters - medium gap
                this.signalLight.classList.remove("active");
                duration = this.options.speed * 3 * speedFactor;
                this.signalText.textContent = "Letter gap";
                break;
            case "wordSpace":
                // Gap between words - long gap
                this.signalLight.classList.remove("active");
                duration = this.options.speed * 7 * speedFactor;
                this.signalText.textContent = "Word space";
                break;
        }

        this.currentIndex++;

        // Schedule next signal
        this.timeoutId = setTimeout(() => {
            this.playSequence();
        }, duration);
    }

    checkAnswer() {
        const userAnswer = this.answerInput.value.trim().toUpperCase();
        const correctAnswer = this.options.message.toUpperCase();

        if (userAnswer === correctAnswer) {
            this.handleSuccess();
        } else {
            this.handleFailure();
        }
    }

    handleSuccess() {
        // Visual feedback
        this.answerInput.classList.add("correct-answer");
        setTimeout(() => {
            this.answerInput.classList.remove("correct-answer");
        }, 1500);

        // Show success modal
        const modal = new GameModal();
        modal.setContent(`
            <h2 style="text-align: center; margin-bottom: 20px; color: var(--color-success);">Correct!</h2>
            <p style="margin-bottom: 20px; text-align: center;">
                You've successfully decoded the message! The ancient instructions have been revealed.
            </p>
        `);

        modal.addButton("Continue", () => {
            modal.hide();
            // Complete challenge
            GameComponents.handleGameCompletion();
        });

        modal.show();
    }

    handleFailure() {
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
                That's not the right message. Check your decoding and try again.
            </p>
        `);

        modal.addButton("Try Again", () => {
            modal.hide();
            this.answerInput.focus();
        });

        modal.show();
    }

    showIntroModal() {
        const modal = new GameModal();
        modal.setContent(`
            <h2 style="text-align: center; margin-bottom: 20px;">${this.options.title}</h2>
            <p style="margin-bottom: 20px; text-align: center;">
                ${this.options.description}
            </p>
            <p style="text-align: center;">
                Click "Start Transmission" to begin. Watch the light carefully and use the Morse code chart to decode the message.
            </p>
        `);

        modal.addButton("Begin Challenge", () => modal.hide());
        modal.show();
    }
}

export default MorseCodeGame;
