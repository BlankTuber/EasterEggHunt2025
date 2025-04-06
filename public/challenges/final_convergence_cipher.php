<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Final Convergence: Chronarium Core</title>
    <link rel="stylesheet" href="/style/challenge_style.css">
    <style>
        /* Specific styles for the final cipher challenge */
        body {
            display: flex;
            flex-direction: column;
            align-items: center;
            min-height: 100vh;
            padding-top: 20px;
        }
        .challenge-container {
            text-align: center;
            max-width: 800px; /* Wider container */
        }
        #statusIndicator {
            margin-top: 15px;
            font-weight: bold;
        }
        #playerListContainer {
            margin-top: 20px;
            padding: 15px;
            background-color: #f0f0f0;
            border-radius: 8px;
            min-width: 250px;
            max-width: 400px;
            box-shadow: inset 0 0 5px rgba(0,0,0,0.1);
            margin-left: auto;
            margin-right: auto;
        }
        #playerList p {
            margin: 5px 0;
            font-size: 0.9em;
        }

        /* Code Phrase Display */
        #codePhraseContainer {
            margin: 20px auto;
            padding: 15px;
            background-color: #e9ecef;
            border-left: 5px solid #6f42c1; /* Changed color */
            max-width: 600px;
            font-style: italic;
            color: #333;
        }
        #codePhraseContainer strong {
             color: #6f42c1;
        }

        /* Chronarium Core Visuals */
        #chronariumCore {
            margin: 30px auto;
            width: 350px; /* Slightly larger */
            height: 350px;
            border: 8px solid #343a40;
            border-radius: 50%;
            position: relative;
            display: flex;
            justify-content: center;
            align-items: center;
            background: radial-gradient(circle, #555, #222);
            box-shadow: 0 0 25px rgba(0,0,0,0.5), inset 0 0 15px rgba(0,0,0,0.4);
            overflow: hidden; /* Hide parts of rotating rings etc */
        }
        #coreCenter {
            width: 120px;
            height: 120px;
            background-color: #0d6efd; /* Core Glow */
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 1.2em; 
            color: white;
            border: 5px solid #0a58ca;
            box-shadow: 0 0 20px #0d6efd, inset 0 0 10px rgba(255, 255, 255, 0.3);
            z-index: 5;
            transition: background-color 0.5s ease, box-shadow 0.5s ease;
        }
        #coreCenter.aligned {
             background-color: #198754; /* Green when aligned */
             border-color: #146c43;
             box-shadow: 0 0 30px #20c997, inset 0 0 10px rgba(255, 255, 255, 0.5);
        }

        /* Component Visual Styles */
        .core-component {
            position: absolute;
            border-radius: 5px; /* Common style */
            transition: all 0.5s ease-in-out;
        }

        /* Navigator: Rotating Ring */
        #navigator-ring {
            width: 90%; height: 90%;
            border: 5px dashed #adb5bd;
            border-radius: 50%;
            top: 5%; left: 5%;
            transform: rotate(0deg); /* Default rotation */
            z-index: 1;
        }
        /* Specific rotations set via JS */

        /* Sage: Lenses/Prisms (example: corner indicators) */
        #sage-lens {
            width: 40px; height: 40px;
            top: 15px; right: 15px;
            background-color: #6c757d; /* Default grey */
            border: 2px solid #495057;
            border-radius: 50%;
            box-shadow: inset 0 0 5px rgba(0,0,0,0.4);
            z-index: 3;
        }
        /* Colors set via JS */
        .lens-Crimson { background-color: #dc3545; border-color: #b02a37; }
        .lens-Emerald { background-color: #198754; border-color: #146c43; }
        .lens-Azure { background-color: #0d6efd; border-color: #0a58ca; }
        .lens-Golden { background-color: #ffc107; border-color: #cc9a06; }

        /* Chronicler: Temporal Gauge (example: bar) */
        #chronicler-gauge {
            width: 10px; height: 40%;
            bottom: 10%; left: 15px;
            background: linear-gradient(to top, #6c757d, #adb5bd); /* Default grey gradient */
            border: 1px solid #495057;
            z-index: 3;
        }
        /* Height/Color set via JS based on level */

        /* Craftsman: Braces (example: thicker lines) */
        #craftsman-brace {
            width: 60%; height: 8px;
            top: calc(50% - 4px); left: 20%;
            background-color: #6c757d; /* Default grey */
            border: 1px solid #495057;
            z-index: 2;
            opacity: 0.5; /* Default: not engaged */
        }
        /* Style changes for engaged braces via JS */
        .brace-Auxiliary { background-color: #adb5bd; opacity: 0.8; }
        .brace-Keystone { background-color: #ffc107; opacity: 1; height: 12px; top: calc(50% - 6px); }
        .brace-Resonance { background-color: #6f42c1; opacity: 0.8; }

        /* Apprentice: Energy Flow (example: central core pulse/color or indicator) */
        #apprentice-energy {
             /* Style the coreCenter based on energy level */
             /* Handled directly in JS by modifying #coreCenter maybe? */
             /* Or add a separate indicator */
            width: 20px; height: 20px;
            bottom: 15px; right: 15px;
            background-color: #6c757d;
            border-radius: 50%;
            border: 2px solid #495057;
            z-index: 4;
        }
        /* Colors set via JS */
        .energy-Low { background-color: #4fc3f7; }
        .energy-Medium { background-color: #ffeb3b; }
        .energy-High { background-color: #ff7043; }


        /* Role-Specific Controls Area */
        #roleControlsContainer {
            margin-top: 30px;
            padding: 20px;
            border: 1px solid #ccc;
            background-color: #f8f9fa;
            border-radius: 8px;
            min-height: 100px;
        }
        #roleControlsContainer h3 {
            margin-top: 0;
            color: #495057;
        }
        .control-group button {
             margin: 5px;
             padding: 8px 15px;
             font-size: 0.9em;
             cursor: pointer;
             border: 1px solid #adb5bd;
             background-color: #e9ecef;
             border-radius: 4px;
             transition: background-color 0.2s ease, border-color 0.2s ease;
        }
        .control-group button:hover {
             border-color: #6c757d;
             background-color: #dee2e6;
        }
        .control-group button.selected {
             background-color: #0d6efd;
             color: white;
             border-color: #0a58ca;
        }
        .control-group button:disabled {
            background-color: #e9ecef;
            color: #adb5bd;
            cursor: not-allowed;
            border-color: #ced4da;
        }


        /* Feedback Area */
        #feedbackArea {
            margin-top: 20px;
            min-height: 2em;
            font-weight: bold;
            color: #dc3545; /* Default to error color */
        }
        #feedbackArea.success {
            color: #198754;
        }

    </style>
</head>
<body>

    <div class="challenge-container">
        <h1>Final Convergence: Chronarium Core Alignment</h1>
        <p class="narrative">
            The Chronarium Core pulses with latent temporal energy. Each Champion holds a key phrase, revealing how to configure their aspect of the device for full alignment.
        </p>
        <p class="instructions">
            Consult your Code Phrase. It is the only clue to the correct setting for your role's controls, displayed below the Core.
            All five components must be configured correctly simultaneously to stabilize the Core and achieve Convergence.
        </p>

        <div id="statusIndicator">Connecting to server...</div>

        <div id="playerListContainer" style="display: none;">
            <h3>Champions Present:</h3>
            <div id="playerList"></div>
        </div>

        <!-- Code Phrase Display -->
        <div id="codePhraseContainer" style="display: none;">
            <strong>Your Code Phrase:</strong>
            <p id="playerCodePhrase">Loading...</p>
        </div>

        <!-- Chronarium Core Visual -->
        <div id="chronariumCore">
             <div id="coreCenter">WAIT</div> <!-- Core Center shows status/alignment -->
             <!-- Visual Components for each role -->
             <div class="core-component" id="navigator-ring"></div>
             <div class="core-component" id="sage-lens"></div>
             <div class="core-component" id="chronicler-gauge"></div>
             <div class="core-component" id="craftsman-brace"></div>
             <div class="core-component" id="apprentice-energy"></div>
        </div>

        <!-- Role-Specific Controls -->
        <div id="roleControlsContainer" style="display: none;">
            <h3 id="roleControlTitle">Your Controls:</h3>
            <div id="roleControls"></div>
        </div>

        <div id="feedbackArea"></div>

    </div>

    <script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
    <script>
        const SERVER_URL = 'http://localhost:3000';
        const statusIndicator = document.getElementById('statusIndicator');
        const playerListContainer = document.getElementById('playerListContainer');
        const playerListDiv = document.getElementById('playerList');
        const feedbackArea = document.getElementById('feedbackArea');
        const codePhraseContainer = document.getElementById('codePhraseContainer');
        const playerCodePhrase = document.getElementById('playerCodePhrase');

        // --- NEW: Elements for Chronarium Core ---
        const chronariumCore = document.getElementById('chronariumCore');
        const coreCenter = document.getElementById('coreCenter');
        const roleControlsContainer = document.getElementById('roleControlsContainer');
        const roleControlTitle = document.getElementById('roleControlTitle');
        const roleControlsDiv = document.getElementById('roleControls');

        const coreVisualComponents = {
            'Navigator': document.getElementById('navigator-ring'),
            'Sage': document.getElementById('sage-lens'),
            'Chronicler': document.getElementById('chronicler-gauge'),
            'Craftsman': document.getElementById('craftsman-brace'),
            'Apprentice': document.getElementById('apprentice-energy')
        };

        let socket = null;
        let myRole = null; // Store the role assigned by the server
        let currentGameState = 'waiting';
        let myConfigOptions = [];
        let currentCoreState = {};
        let lastSubmittedSetting = null; // Track last submitted value for button styling

        function connectToServer() {
            const urlParams = new URLSearchParams(window.location.search);
            const role = urlParams.get('role');
            const stepId = urlParams.get('step') || 'final_convergence_cipher';

            if (!role) {
                statusIndicator.textContent = "Error: Role parameter is missing in URL.";
                statusIndicator.style.color = 'red';
                return;
            }
            myRole = role;

            if (socket && socket.connected) socket.disconnect();

            statusIndicator.textContent = `Connecting as ${role}...`;
            statusIndicator.style.color = 'orange';

            socket = io(SERVER_URL, {
                query: { role: role, step: stepId },
                reconnectionAttempts: 3
            });
            setupSocketListeners();
        }

        function setupSocketListeners() {
            socket.on('connect', () => {
                statusIndicator.textContent = 'Connected. Awaiting Core Activation...';
                statusIndicator.style.color = 'green';
                console.log('Socket connected:', socket.id);
            });

            socket.on('disconnect', (reason) => {
                statusIndicator.textContent = `Disconnected: ${reason}.`;
                statusIndicator.style.color = 'red';
                playerListContainer.style.display = 'none';
                codePhraseContainer.style.display = 'none';
                roleControlsContainer.style.display = 'none';
                resetCoreVisuals();
                feedbackArea.textContent = '';
                console.log('Socket disconnected:', reason);
            });

            socket.on('connect_error', (err) => {
                statusIndicator.textContent = `Connection Error: ${err.message}`;
                statusIndicator.style.color = 'red';
                console.error('Connection error:', err);
            });

             socket.on('error_message', (data) => {
                statusIndicator.textContent = `Server Error: ${data.message}`;
                statusIndicator.style.color = 'red';
                feedbackArea.textContent = `Error: ${data.message}`; feedbackArea.className = 'error';
             });

            socket.on('game_state', (data) => {
                console.log('Received game_state:', data);
                const oldGameState = currentGameState;
                currentGameState = data.state;
                myConfigOptions = data.yourConfigOptions || [];
                currentCoreState = data.finalCipherComponentStates || {};

                // Update player list
                if (data.players && data.players.length > 0) {
                    playerListDiv.innerHTML = data.players.map(p => `<p>${p.role} ${p.role === data.yourRole ? '(You)' : ''}</p>`).join('');
                    playerListContainer.style.display = 'block';
                } else { playerListContainer.style.display = 'none'; }

                // Store/confirm our role & display code phrase
                myRole = data.yourRole;
                if (data.yourCodePhrase) {
                     playerCodePhrase.textContent = data.yourCodePhrase;
                     codePhraseContainer.style.display = 'block';
                } else { codePhraseContainer.style.display = 'none'; }

                // --- Handle Final Cipher State ---
                if (data.type === 'final_cipher') {
                    updateCoreVisuals(currentCoreState);
                    handleConfigResult(data.lastConfigResult); // Optional feedback
                    updateRoleControls(data.state);
                }

                updateStatusMessage(data.state, data.requiredPlayers, data.players?.length || 0);
            });

             socket.on('game_reset', (data) => {
                 console.log('Game reset:', data.reason);
                 feedbackArea.textContent = `Game Reset: ${data.reason || 'State changed.'}. Waiting...`;
                 feedbackArea.className = '';
                 currentGameState = 'waiting';
                 lastSubmittedSetting = null;
                 resetCoreVisuals();
            });

            socket.on('challenge_complete', (data) => {
                 console.log('Challenge complete:', data.message);
                 statusIndicator.textContent = "Challenge Completed!"; statusIndicator.style.color = 'purple';
                 feedbackArea.textContent = data.message || "Success!"; feedbackArea.className = 'success';
                 coreCenter.textContent = 'ALIGNED';
                 coreCenter.classList.add('aligned');
                 disableAllInputs();
                 currentGameState = 'finished';
                 // Optional: Redirect
            });
        }

        function updateStatusMessage(state, requiredPlayers, currentPlayerCount) {
            switch (state) {
                case 'waiting': statusIndicator.textContent = `Awaiting Configuration Sequence (${currentPlayerCount}/${requiredPlayers})...`; statusIndicator.style.color = 'orange'; break;
                case 'playing': statusIndicator.textContent = 'Chronarium Core active! Configure your component.'; statusIndicator.style.color = 'blue'; break;
                case 'finished': if (statusIndicator.textContent !== "Challenge Completed!") { statusIndicator.textContent = 'Core Alignment Sequence Finished.'; statusIndicator.style.color = 'gray'; } break;
                default: statusIndicator.textContent = `Unknown state: ${state}`; statusIndicator.style.color = 'black';
            }
        }

        // --- Chronarium Core Specific Functions ---

        function updateCoreVisuals(componentStates) {
            coreCenter.classList.remove('aligned'); // Reset alignment style
            coreCenter.textContent = 'ACTIVE'; // Default text when playing

            // Update each component based on its state
            Object.entries(componentStates).forEach(([role, setting]) => {
                const element = coreVisualComponents[role];
                if (!element) return;

                // Reset styles first
                element.className = 'core-component'; // Base class + ID
                element.removeAttribute('style'); // Clear inline styles
                element.id = `${role.toLowerCase()}-${element.id.split('-')[1]}`; // Maintain original ID part

                if (setting !== null) {
                    switch (role) {
                        case 'Navigator':
                            element.style.transform = `rotate(${(setting - 1) * 90}deg)`; // 0, 90, 180, 270 deg
                            break;
                        case 'Sage':
                            element.classList.add(`lens-${setting}`);
                            break;
                        case 'Chronicler':
                             // Example: Adjust height of a bar (max 5 levels)
                             const percentage = (setting / 5) * 100;
                             element.style.height = `${percentage}%`;
                             // Optional: Change color based on level too
                             element.style.background = `linear-gradient(to top, hsl(${120 + setting * 20}, 70%, 50%), hsl(${120 + setting * 20}, 70%, 70%))`;
                            break;
                        case 'Craftsman':
                            element.classList.add(`brace-${setting}`);
                            break;
                        case 'Apprentice':
                            element.classList.add(`energy-${setting}`);
                             // Maybe also make coreCenter pulse or change slightly?
                             // Example: coreCenter.style.animation = `pulse-${setting} 1s infinite`;
                            break;
                    }
                } else {
                     // Style for unset state (mostly handled by default CSS)
                     if (role === 'Navigator') element.style.transform = 'rotate(0deg)';
                     if (role === 'Chronicler') element.style.height = '0%';
                }
            });
             if (currentGameState === 'waiting') coreCenter.textContent = 'WAIT';
             if (currentGameState === 'finished') coreCenter.textContent = 'ALIGNED'; // Keep ALIGNED text after win
        }

        function handleConfigResult(result) {
            // Optional: Display subtle feedback based on lastConfigResult
            if (!result || !result.message) {
                // feedbackArea.textContent = ''; // Clear if no message
                 return;
             }
            feedbackArea.textContent = result.message; // Display server message if any
            feedbackArea.className = result.success === false ? 'error' : ''; // Add error class if explicitly failed
            setTimeout(() => { feedbackArea.textContent = ''; feedbackArea.className = ''; }, 3000);
        }

        function resetCoreVisuals() {
             updateCoreVisuals({}); // Update with empty state
             coreCenter.textContent = 'OFFLINE';
             coreCenter.classList.remove('aligned');
        }

        function updateRoleControls(gameState) {
            roleControlsDiv.innerHTML = ''; // Clear previous controls
            if (gameState === 'playing' && myRole && myConfigOptions.length > 0) {
                roleControlsContainer.style.display = 'block';
                roleControlTitle.textContent = `Your Controls (${myRole}):`;

                const controlGroup = document.createElement('div');
                controlGroup.className = 'control-group';

                myConfigOptions.forEach(option => {
                    const button = document.createElement('button');
                    button.textContent = option;
                    button.dataset.setting = option;

                    // Highlight the button corresponding to the last submitted setting
                    if (currentCoreState[myRole] === option) {
                        button.classList.add('selected');
                    }

                    button.addEventListener('click', () => {
                        if (button.disabled) return;
                        const settingValue = option; // Use the option itself
                        lastSubmittedSetting = settingValue; // Track for styling

                        // Visually mark selection immediately
                        controlGroup.querySelectorAll('button').forEach(btn => btn.classList.remove('selected'));
                        button.classList.add('selected');

                        // Disable buttons temporarily after click
                        controlGroup.querySelectorAll('button').forEach(btn => btn.disabled = true);
                        setTimeout(() => {
                             if (currentGameState === 'playing') { // Re-enable only if still playing
                                controlGroup.querySelectorAll('button').forEach(btn => btn.disabled = false);
                             }
                        }, 750); // Delay to prevent spamming

                        // Send to server
                        if (socket && socket.connected) {
                            console.log(`Submitting configuration: ${myRole} -> ${settingValue}`);
                            socket.emit('submit_configuration', { setting: settingValue });
                        } else {
                             feedbackArea.textContent = "Error: Not connected to server."; feedbackArea.className = 'error';
                        }
                    });
                    controlGroup.appendChild(button);
                });
                roleControlsDiv.appendChild(controlGroup);
            } else {
                roleControlsContainer.style.display = 'none';
            }
        }

        function disableAllInputs() {
             roleControlsDiv.querySelectorAll('button').forEach(btn => btn.disabled = true);
        }

        window.onload = connectToServer;

    </script>
</body>
</html> 