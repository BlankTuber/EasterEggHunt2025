import GameModal from "./modal.js";

class UI {
    // Create a standardized button
    static createButton(text, onClick, className = "") {
        const button = document.createElement("button");
        button.className = `fantasy-button ${className}`;
        button.textContent = text;

        if (typeof onClick === "function") {
            button.addEventListener("click", onClick);
        }

        return button;
    }

    // Create a standardized input
    static createInput(placeholder, onChange, className = "") {
        const input = document.createElement("input");
        input.className = `fantasy-input ${className}`;
        input.placeholder = placeholder;

        if (typeof onChange === "function") {
            input.addEventListener("input", onChange);
        }

        return input;
    }

    // Create a standardized card container
    static createCard(content, className = "") {
        const card = document.createElement("div");
        card.className = `fantasy-card ${className}`;

        if (typeof content === "string") {
            card.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            card.appendChild(content);
        }

        return card;
    }

    // Create a standardized progress bar
    static createProgressBar(value, max, className = "") {
        const container = document.createElement("div");
        container.className = `progress-container ${className}`;

        const bar = document.createElement("div");
        bar.className = "progress-bar";
        bar.style.width = `${(value / max) * 100}%`;

        container.appendChild(bar);

        // Update method
        container.update = (newValue) => {
            bar.style.width = `${(newValue / max) * 100}%`;
        };

        return container;
    }

    // Create a standardized "How to Play" button
    static createHowToPlayButton(pages) {
        const button = UI.createButton(
            "?",
            () => {
                const modal = new GameModal();
                modal.createHowToPlayModal(pages);
                modal.show();
            },
            "help-button",
        );

        return button;
    }

    // Create a standardized game header
    static createGameHeader(title, subtitle = "") {
        const header = document.createElement("div");
        header.className = "fantasy-header";

        const titleElement = document.createElement("h1");
        titleElement.textContent = title;
        header.appendChild(titleElement);

        if (subtitle) {
            const subtitleElement = document.createElement("p");
            subtitleElement.textContent = subtitle;
            subtitleElement.className = "subtitle";
            header.appendChild(subtitleElement);
        }

        return header;
    }

    // Create standard game controls for touch/mobile
    static createTouchControls(buttons) {
        const controlsContainer = document.createElement("div");
        controlsContainer.className = "control-buttons";

        buttons.forEach((buttonConfig) => {
            const btn = document.createElement("div");
            btn.className = `control-btn ${buttonConfig.className || ""}`;

            if (buttonConfig.icon) {
                btn.innerHTML = buttonConfig.icon;
            } else {
                btn.textContent = buttonConfig.text || "";
            }

            if (typeof buttonConfig.action === "function") {
                // For touch events
                btn.addEventListener("touchstart", buttonConfig.action);
                // For mouse events (testing on desktop)
                btn.addEventListener("mousedown", buttonConfig.action);
            }

            controlsContainer.appendChild(btn);
        });

        return controlsContainer;
    }

    // Create a feedback message element
    static createFeedback(type = "info", message = "") {
        const feedback = document.createElement("div");
        feedback.className = `feedback ${type}`;
        feedback.textContent = message;

        return feedback;
    }
}

export default UI;
