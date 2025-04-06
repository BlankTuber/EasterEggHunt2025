class GameModal {
    constructor(options = {}) {
        this.options = {
            theme: "fantasy",
            closeOnOverlayClick: true,
            showCloseButton: true,
            ...options,
        };

        // Current page index if using pages
        this.currentPageIndex = 0;
        this.pages = [];

        // Create modal elements
        this.createModalElements();

        // Add event listeners
        this.addEventListeners();

        // Add styles
        this.addStyles();

        // Initially hidden
        this.hide();
    }

    createModalElements() {
        // Create overlay
        this.modalOverlay = document.createElement("div");
        this.modalOverlay.className = "modal-overlay";

        // Create container
        this.modalContainer = document.createElement("div");
        this.modalContainer.className = `modal-container ${this.options.theme}-modal`;

        // Create content area
        this.modalContent = document.createElement("div");
        this.modalContent.className = "modal-content";

        // Create close button
        if (this.options.showCloseButton) {
            this.closeButton = document.createElement("button");
            this.closeButton.className = "modal-close";
            this.closeButton.textContent = "×";
            this.modalContainer.appendChild(this.closeButton);
        }

        // Create pagination controls (initially hidden)
        this.paginationControls = document.createElement("div");
        this.paginationControls.className = "modal-pagination";
        this.paginationControls.style.display = "none";

        this.prevButton = document.createElement("button");
        this.prevButton.className = "pagination-btn prev-btn";
        this.prevButton.textContent = "←";
        this.prevButton.disabled = true;

        this.pageIndicator = document.createElement("div");
        this.pageIndicator.className = "page-indicator";

        this.nextButton = document.createElement("button");
        this.nextButton.className = "pagination-btn next-btn";
        this.nextButton.textContent = "→";

        this.paginationControls.appendChild(this.prevButton);
        this.paginationControls.appendChild(this.pageIndicator);
        this.paginationControls.appendChild(this.nextButton);

        // Assemble the modal
        this.modalContainer.appendChild(this.modalContent);
        this.modalContainer.appendChild(this.paginationControls);
        this.modalOverlay.appendChild(this.modalContainer);

        // Add to document
        document.body.appendChild(this.modalOverlay);
    }

    addEventListeners() {
        // Close button
        if (this.closeButton) {
            this.closeButton.addEventListener("click", () => this.hide());
        }

        // Overlay click to close
        if (this.options.closeOnOverlayClick) {
            this.modalOverlay.addEventListener("click", (e) => {
                if (e.target === this.modalOverlay) {
                    this.hide();
                }
            });
        }

        // Pagination controls
        this.prevButton.addEventListener("click", () =>
            this.goToPreviousPage(),
        );
        this.nextButton.addEventListener("click", () => this.goToNextPage());
    }

    setContent(htmlContent) {
        this.modalContent.innerHTML = htmlContent;
    }

    setPages(pages) {
        this.pages = pages;
        this.currentPageIndex = 0;

        if (this.pages.length > 1) {
            this.paginationControls.style.display = "flex";
            this.updatePagination();
        } else {
            this.paginationControls.style.display = "none";
        }

        this.showCurrentPage();
    }

    goToNextPage() {
        if (this.currentPageIndex < this.pages.length - 1) {
            this.currentPageIndex++;
            this.showCurrentPage();
            this.updatePagination();
        }
    }

    goToPreviousPage() {
        if (this.currentPageIndex > 0) {
            this.currentPageIndex--;
            this.showCurrentPage();
            this.updatePagination();
        }
    }

    showCurrentPage() {
        const currentPage = this.pages[this.currentPageIndex];
        this.setContent(currentPage.content);

        // Execute page callback if provided
        if (typeof currentPage.onShow === "function") {
            currentPage.onShow(this.modalContent);
        }
    }

    updatePagination() {
        this.pageIndicator.textContent = `${this.currentPageIndex + 1} / ${
            this.pages.length
        }`;

        // Update button states
        this.prevButton.disabled = this.currentPageIndex === 0;
        this.nextButton.disabled =
            this.currentPageIndex === this.pages.length - 1;
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

    createHowToPlayModal(pages) {
        const howToPlayPages = pages.map((page) => {
            return {
                content: `
                    <h2 class="modal-title">${page.title}</h2>
                    ${
                        page.image
                            ? `<div class="modal-image"><img src="${page.image}" alt="${page.title}"></div>`
                            : ""
                    }
                    <div class="modal-description">${page.description}</div>
                `,
                onShow: page.onShow,
            };
        });

        this.setPages(howToPlayPages);
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
                    background: #1a1a2e;
                    border: 4px solid #8b5e34;
                    border-radius: 12px;
                    padding: 20px;
                    width: 90%;
                    max-width: 500px;
                    position: relative;
                    box-shadow: 0 0 20px rgba(139, 69, 19, 0.6);
                    color: #e8d4a9;
                    max-height: 90vh;
                    overflow-y: auto;
                }
                
                .modal-content {
                    font-family: 'MedievalSharp', cursive;
                    margin-bottom: 15px;
                }
                
                .modal-close {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #e8d4a9;
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    z-index: 10;
                }
                
                .modal-close:hover {
                    background: rgba(232, 212, 169, 0.2);
                }
                
                .modal-title {
                    text-align: center;
                    margin-bottom: 15px;
                    color: #e8d4a9;
                }
                
                .modal-image {
                    text-align: center;
                    margin: 15px 0;
                }
                
                .modal-image img {
                    max-width: 100%;
                    border-radius: 8px;
                    border: 2px solid #8b5e34;
                }
                
                .modal-description {
                    margin-bottom: 15px;
                    line-height: 1.5;
                }
                
                .modal-pagination {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 15px;
                    border-top: 1px solid rgba(139, 94, 52, 0.5);
                    padding-top: 15px;
                }
                
                .pagination-btn {
                    background: linear-gradient(to bottom, #3b2d1f, #2a1f16);
                    border: 2px solid #8b5e34;
                    border-radius: 6px;
                    color: #e8d4a9;
                    width: 40px;
                    height: 40px;
                    font-size: 18px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .pagination-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .pagination-btn:not(:disabled):hover {
                    background: linear-gradient(to bottom, #4b3d2f, #3a2f26);
                }
                
                .page-indicator {
                    font-size: 14px;
                    color: #e8d4a9;
                }
                
                /* Responsive adjustments */
                @media (max-width: 768px) {
                    .modal-container {
                        padding: 15px;
                        width: 95%;
                    }
                }
            `;
            document.head.appendChild(styleSheet);
        }
    }
}

// Export the modal class
export default GameModal;
