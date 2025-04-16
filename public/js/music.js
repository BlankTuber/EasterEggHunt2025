let gameConfig;
let currentTrackIndex = 0;
let score = 0;
let tracks = [];
let usedTracks = new Set();
let audioPlayer;
let playerName = "";
let isLoading = false;

function init() {
    gameConfig = JSON.parse(
        document.getElementById("gameConfigData").textContent,
    );
    tracks = gameConfig.tracks || [];
    audioPlayer = document.getElementById("musicPlayer");
    const playerNameInput = document.getElementById("playerName");
    if (playerNameInput) {
        playerName = playerNameInput.value.trim();
    }
    document
        .getElementById("playButton")
        .addEventListener("click", playCurrentTrack);
    if (tracks.length > 0) {
        displayTrack(getNextTrack());
    }
}

document.addEventListener("DOMContentLoaded", function () {
    document.querySelector(".game-area").style.display = "block";
    const playerForm = document.querySelector(".player-form");
    if (playerForm) playerForm.style.display = "none";
    init();
});

function getGameIdFromUrl() {
    const pathParts = window.location.pathname.split("/");
    return pathParts[pathParts.length - 1];
}

function getConfigTypeFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("config") || "unknown";
}

function getNextTrack() {
    if (usedTracks.size >= tracks.length) {
        usedTracks.clear();
    }
    let availableTracks = tracks.filter((track) => !usedTracks.has(track.id));
    if (availableTracks.length === 0) {
        return tracks[Math.floor(Math.random() * tracks.length)];
    }
    const track =
        availableTracks[Math.floor(Math.random() * availableTracks.length)];
    usedTracks.add(track.id);
    return track;
}

function displayTrack(track) {
    if (!track) return;
    audioPlayer.src = track.audioUrl;
    audioPlayer.load();
    document.getElementById("playButton").disabled = false;
    playAudio();
    currentTrackIndex = tracks.findIndex((t) => t.id === track.id);
    displayOptions(shuffleArray(track.options || generateOptions(track)));
    hideFeedback();
    isLoading = false;
}

function generateOptions(track) {
    const options = [track.answer];
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
    const filteredOptions = dummyOptions.filter(
        (option) => option !== track.answer,
    );
    for (let i = 0; i < 3 && i < filteredOptions.length; i++) {
        const randomIndex = Math.floor(Math.random() * filteredOptions.length);
        const option = filteredOptions.splice(randomIndex, 1)[0];
        options.push(option);
    }
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
    if (isLoading) return;

    isLoading = true;

    document.querySelectorAll(".music-option").forEach((el) => {
        el.classList.remove("selected");
        if (el.textContent === option) {
            el.classList.add("selected");
        }
    });
    const currentTrack = tracks[currentTrackIndex];
    if (option === currentTrack.answer) {
        score++;
        document.getElementById("score").textContent = score;
        showFeedback("Riktig! Godt jobbet!", "success");
        if (score >= gameConfig.requiredPoints) {
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
                isLoading = false;
            };
            xhr.onerror = function () {
                isLoading = false;
            };
            xhr.send(
                JSON.stringify({
                    gameId: getGameIdFromUrl(),
                    gameType: "music",
                    score: score,
                    configType: gameConfig.configType || getConfigTypeFromUrl(),
                    playerName: playerName,
                }),
            );
        } else {
            setTimeout(() => {
                displayTrack(getNextTrack());
            }, 2000);
        }
    } else {
        showFeedback(
            "Feil gjetning! Spillet blir nullstilt. Start på nytt!",
            "error",
        );
        score = 0;
        document.getElementById("score").textContent = score;
        usedTracks.clear();
        setTimeout(() => {
            displayTrack(getNextTrack());
        }, 2000);
    }
}

function playCurrentTrack() {
    if (!audioPlayer.src) return;
    if (audioPlayer.paused) {
        playAudio();
    } else {
        audioPlayer.pause();
        document.querySelector("#playButton span").textContent =
            "▶ Spill musikk";
    }
}

function playAudio() {
    const playPromise = audioPlayer.play();
    if (playPromise !== undefined) {
        playPromise
            .then(() => {
                document.querySelector("#playButton span").textContent =
                    "❚❚ Pause";
            })
            .catch((error) => {
                console.log("Autoplay prevented:", error);
                document.querySelector("#playButton span").textContent =
                    "▶ Spill musikk";
            });
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

document.addEventListener("DOMContentLoaded", function () {
    const audioPlayer = document.getElementById("musicPlayer");
    audioPlayer.addEventListener("ended", function () {
        document.querySelector("#playButton span").textContent =
            "▶ Spill igjen";
    });
});
