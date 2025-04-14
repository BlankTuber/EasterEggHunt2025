let gameConfig;
let currentTrackIndex = 0;
let score = 0;
let tracks = [];
let usedTracks = new Set();
let audioPlayer;

function init() {
    // Load game config from page
    gameConfig = JSON.parse(
        document.getElementById("gameConfigData").textContent,
    );
    tracks = gameConfig.tracks || [];
    audioPlayer = document.getElementById("musicPlayer");

    // Set up play button
    document
        .getElementById("playButton")
        .addEventListener("click", playCurrentTrack);

    // Display first track if available
    if (tracks.length > 0) {
        displayTrack(getNextTrack());
    }
}

// Auto-start the game immediately
document.addEventListener("DOMContentLoaded", function () {
    // Show game area immediately
    document.querySelector(".game-area").style.display = "block";
    // Hide player entry form if present
    const playerForm = document.querySelector(".player-form");
    if (playerForm) playerForm.style.display = "none";
    // Initialize the game
    init();
});

function getGameIdFromUrl() {
    const pathParts = window.location.pathname.split("/");
    return pathParts[pathParts.length - 1];
}

function getNextTrack() {
    // If all tracks have been used, reset
    if (usedTracks.size >= tracks.length) {
        usedTracks.clear();
    }

    // Find an unused track
    let availableTracks = tracks.filter((track) => !usedTracks.has(track.id));

    // If no unused tracks, get a random one
    if (availableTracks.length === 0) {
        return tracks[Math.floor(Math.random() * tracks.length)];
    }

    // Get random available track
    const track =
        availableTracks[Math.floor(Math.random() * availableTracks.length)];
    usedTracks.add(track.id);

    return track;
}

function displayTrack(track) {
    if (!track) return;

    // Set up audio player
    audioPlayer.src = track.audioUrl;
    audioPlayer.load();

    // Enable play button
    document.getElementById("playButton").disabled = false;

    // Store current track for guessing
    currentTrackIndex = tracks.findIndex((t) => t.id === track.id);

    // Display options
    displayOptions(track.options || generateOptions(track));

    // Remove any feedback
    hideFeedback();
}

function generateOptions(track) {
    // This should ideally be handled server-side, but we create a simple implementation here
    const options = [track.answer]; // First option is the correct answer

    // Add some randomly generated options (this is a simplified demo)
    const dummyOptions = [
        "Super Mario Bros.",
        "The Legend of Zelda",
        "Final Fantasy",
        "Pokémon",
        "Sonic the Hedgehog",
        "Tetris",
        "Mega Man",
        "Metal Gear Solid",
        "Pac-Man",
        "Street Fighter",
    ];

    // Remove the correct answer from dummyOptions if it exists there
    const filteredOptions = dummyOptions.filter(
        (option) => option !== track.answer,
    );

    // Select 3 random elements from filteredOptions
    for (let i = 0; i < 3 && i < filteredOptions.length; i++) {
        const randomIndex = Math.floor(Math.random() * filteredOptions.length);
        const option = filteredOptions.splice(randomIndex, 1)[0];
        options.push(option);
    }

    // Shuffle options
    return shuffleArray(options);
}

function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function displayOptions(options) {
    const optionsContainer = document.getElementById("musicOptions");
    optionsContainer.innerHTML = "";

    options.forEach((option) => {
        const optionElement = document.createElement("div");
        optionElement.className = "music-option";
        optionElement.textContent = option;

        optionElement.addEventListener("click", () => {
            selectOption(option);
        });

        optionsContainer.appendChild(optionElement);
    });
}

function selectOption(option) {
    // Mark selected option
    document.querySelectorAll(".music-option").forEach((el) => {
        el.classList.remove("selected");
        if (el.textContent === option) {
            el.classList.add("selected");
        }
    });

    const currentTrack = tracks[currentTrackIndex];

    // Check if guess is correct
    if (option === currentTrack.answer) {
        // Update score
        score++;
        document.getElementById("score").textContent = score;

        // Show success message
        showFeedback("Riktig! Godt jobbet!", "success");

        // Check win condition
        if (score >= gameConfig.requiredPoints) {
            // Send completion data to server
            const xhr = new XMLHttpRequest();
            xhr.open("POST", "/complete-game");
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.onload = function () {
                if (xhr.status === 200) {
                    showWinMessage(
                        gameConfig.winMessage ||
                            "Gratulerer! Du identifiserte all musikken!",
                    );
                }
            };
            xhr.send(
                JSON.stringify({
                    gameId: getGameIdFromUrl(),
                    gameType: "music",
                    score: score,
                }),
            );
        } else {
            // After 2 seconds, show new track
            setTimeout(() => {
                displayTrack(getNextTrack());
            }, 2000);
        }
    } else {
        // Show error message
        showFeedback("Feil gjetning. Prøv igjen!", "error");
    }
}

function playCurrentTrack() {
    if (!audioPlayer.src) return;

    if (audioPlayer.paused) {
        audioPlayer.play();
        document.querySelector("#playButton span").textContent = "❚❚ Pause";
    } else {
        audioPlayer.pause();
        document.querySelector("#playButton span").textContent =
            "▶ Spill musikk";
    }
}

function showFeedback(message, type) {
    const feedbackElement = document.getElementById("feedbackMessage");
    feedbackElement.textContent = message;
    feedbackElement.className = `message ${type}`;
    feedbackElement.style.display = "block";
}

function hideFeedback() {
    document.getElementById("feedbackMessage").style.display = "none";
}

// Listen for when the track is finished and reset button
document.addEventListener("DOMContentLoaded", function () {
    const audioPlayer = document.getElementById("musicPlayer");
    audioPlayer.addEventListener("ended", function () {
        document.querySelector("#playButton span").textContent =
            "▶ Spill igjen";
    });
});
