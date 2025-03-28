// website/challenges/util/modal.js
class GameModal {
    constructor() {
        // Create modal elements
        this.modalOverlay = document.createElement("div");
        this.modalOverlay.className = "modal-overlay";

        this.modalContainer = document.createElement("div");
        this.modalContainer.className = "modal-container";

        this.modalContent = document.createElement("div");
        this.modalContent.className = "modal-content";

        this.closeButton = document.createElement("button");
        this.closeButton.className = "modal-close";
        this.closeButton.textContent = "×";
        this.closeButton.addEventListener("click", () => this.hide());

        // Build modal structure
        this.modalContainer.appendChild(this.closeButton);
        this.modalContainer.appendChild(this.modalContent);
        this.modalOverlay.appendChild(this.modalContainer);

        // Add to document
        document.body.appendChild(this.modalOverlay);

        // Add default styles
        this.addStyles();

        // Initially hidden
        this.hide();
    }

    addStyles() {
        // Add styles dynamically if not already present
        if (!document.getElementById("modal-styles")) {
            const styleSheet = document.createElement("style");
            styleSheet.id = "modal-styles";
            styleSheet.textContent = `
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .modal-container {
          background: #f9f2e5;
          border: 4px solid #a67c52;
          border-radius: 12px;
          padding: 20px;
          width: 90%;
          max-width: 500px;
          position: relative;
          box-shadow: 0 0 20px rgba(139, 69, 19, 0.6);
          background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" opacity="0.1"><path d="M0 0L100 100M100 0L0 100" stroke="brown" stroke-width="1"/></svg>');
        }
        
        .modal-content {
          font-family: 'Palatino Linotype', 'Book Antiqua', Palatino, serif;
          color: #4b2809;
        }
        
        .modal-close {
          position: absolute;
          top: 10px;
          right: 10px;
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #6b4226;
          width: 30px;
          height: 30px;
          border-radius: 50%;
        }
        
        .modal-close:hover {
          background: rgba(139, 69, 19, 0.2);
        }
        
        .fantasy-button {
          background: linear-gradient(to bottom, #e8d4a9, #c9a86b);
          border: 2px solid #8b5e34;
          border-radius: 6px;
          color: #4b2809;
          padding: 10px 20px;
          font-family: 'Palatino Linotype', 'Book Antiqua', Palatino, serif;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 3px 5px rgba(0, 0, 0, 0.2);
          margin: 10px 0;
        }
        
        .fantasy-button:hover {
          background: linear-gradient(to bottom, #f4e3c0, #d4b67e);
        }
      `;
            document.head.appendChild(styleSheet);
        }
    }

    setContent(htmlContent) {
        this.modalContent.innerHTML = htmlContent;
    }

    show() {
        this.modalOverlay.style.display = "flex";
    }

    hide() {
        this.modalOverlay.style.display = "none";
    }

    addButton(text, callback) {
        const button = document.createElement("button");
        button.className = "fantasy-button";
        button.textContent = text;
        button.addEventListener("click", callback);
        this.modalContent.appendChild(button);
        return button;
    }
}

// Export the modal class
export default GameModal;
