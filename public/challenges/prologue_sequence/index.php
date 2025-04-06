<?php
require_once __DIR__ . '/../../includes/init.php';

$step_id = 'prologue_challenge'; // Define the step ID for this page
$role = get_user_role();

// Security Check: Ensure the user is logged in and this is their current step
require_login();
if (!can_access_step($role, $step_id)) {
    redirect_to_current_step();
    exit;
}

// Node server URL (replace with your actual Proxmox Node server IP/hostname and port)
$node_server_url = 'http://localhost:3000'; // EXAMPLE: Use your actual server address

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Challenge: Cross Device Puzzle (Sequence)</title>
    <link rel="stylesheet" href="/assets/style.css">
    <style>
        #game-map { border: 1px solid #ccc; margin-bottom: 1em; position: relative; background-color: #f8f8f8; overflow: hidden; /* Ensure canvas fits */ }
        #game-status { margin-bottom: 1em; font-weight: bold; }
        #player-list li { margin-bottom: 0.3em; }
        #player-list .ready { color: green; font-weight: bold; }
        #player-list .waiting { color: orange; }
        #input-sequence { width: 80%; padding: 0.5em; margin-bottom: 0.5em; }
        #controls button { margin: 0.2em; }
        #simulation-result { margin-top: 1em; padding: 1em; border-radius: 5px; }
        #simulation-result.success { background-color: #d4edda; color: #155724; }
        #simulation-result.error { background-color: #f8d7da; color: #721c24; }
        /* Simple grid display */
        #grid-container { display: grid; border: 1px solid #ccc; margin-top: 1em; }
        .grid-cell { border: 1px solid #eee; text-align: center; font-size: 10px; position: relative; }
        .grid-cell.obstacle { background-color: #555; }
        .grid-cell.target::after { content: 'T'; color: blue; font-weight: bold; position: absolute; top: 0; left: 0; }
        .grid-cell.player-start::after { content: 'S'; color: green; font-weight: bold; position: absolute; top: 0; right: 0; }
        .player-marker { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 80%; height: 80%; border-radius: 50%; opacity: 0.7; font-size: 8px; display: flex; align-items: center; justify-content: center; color: white; }
        /* Assign colors based on role - simple example */
        .player-Navigator { background-color: blue; }
        .player-Sage { background-color: purple; }
        .player-Chronicler { background-color: orange; }
        .player-Craftsman { background-color: brown; }
        .player-Apprentice { background-color: cyan; color: #333 }
        .player-path { position: absolute; background-color: rgba(0, 0, 255, 0.1); pointer-events: none; border-radius: 3px; }

    </style>
</head>
<body>
    <div class="container">
        <h1>Challenge: Cross Device Puzzle (Sequence)</h1>
        <p>Coordinate with the other champions. Input a sequence of moves (Up, Down, Left, Right, Stay) to guide your piece (<strong><?php echo htmlspecialchars($role); ?></strong>) from its starting position (S) to its target (T) without colliding with walls, obstacles (grey squares), or other players.</p>
        <p>All players' moves will execute simultaneously step-by-step once everyone is ready.</p>

        <div id="game-status">Connecting to server...</div>

        <div>
            <h3>Players:</h3>
            <ul id="player-list">
                <!-- Player list updated by JS -->
            </ul>
        </div>

        <div id="game-area" style="display: none;"> <!-- Hide until connected and map loaded -->
            <h3>Map:</h3>
            <div id="grid-container"></div>
            <div id="simulation-result"></div>

            <div id="input-controls">
                <h3>Your Moves:</h3>
                <textarea id="input-sequence" rows="5" placeholder="Enter moves separated by commas or newlines (e.g., right, right, up, stay, down). Use 'up', 'down', 'left', 'right', or 'stay'."></textarea>
                <div>
                    <button id="add-up">Add Up</button>
                    <button id="add-down">Add Down</button>
                    <button id="add-left">Add Left</button>
                    <button id="add-right">Add Right</button>
                    <button id="add-stay">Add Stay</button>
                    <button id="clear-moves">Clear</button>
                </div>
                <button id="ready-button" style="margin-top: 1em;">Submit Moves & Ready Up</button>
            </div>
        </div>

        <!-- Hidden form for completion -->
        <form action="/complete.php" method="POST" id="completion-form" style="display: none;">
            <input type="hidden" name="challenge_id" value="<?php echo htmlspecialchars($step_id); ?>">
            <!-- This form will be submitted by JS on challenge_complete event -->
        </form>
    </div>

    <!-- Include Socket.IO client library -->
    <script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
    <script>
        const nodeServerUrl = '<?php echo $node_server_url; ?>';
        const userRole = '<?php echo htmlspecialchars($role); ?>';
        const challengeStepId = '<?php echo htmlspecialchars($step_id); ?>';

        const statusDiv = document.getElementById('game-status');
        const playerListUl = document.getElementById('player-list');
        const gameAreaDiv = document.getElementById('game-area');
        const gridContainer = document.getElementById('grid-container');
        const simulationResultDiv = document.getElementById('simulation-result');
        const inputSequenceTextarea = document.getElementById('input-sequence');
        const readyButton = document.getElementById('ready-button');
        const completionForm = document.getElementById('completion-form');
        const inputControlsDiv = document.getElementById('input-controls');

        let currentMap = null;
        let playerPositions = {}; // Store current positions for simulation display
        let playerPaths = {}; // Store paths from simulation result

        statusDiv.textContent = `Connecting to ${nodeServerUrl}...`;
        const socket = io(nodeServerUrl, { query: { role: userRole, step: challengeStepId } });

        socket.on('connect', () => {
            statusDiv.textContent = 'Connected. Waiting for players...';
            statusDiv.style.color = 'green';
        });

        socket.on('connect_error', (err) => {
            statusDiv.textContent = `Connection Failed: ${err.message}. Check Node server.`;
            statusDiv.style.color = 'red';
        });

        socket.on('disconnect', () => {
            statusDiv.textContent = 'Disconnected from server.';
            statusDiv.style.color = 'red';
            gameAreaDiv.style.display = 'none';
        });

        // Receive initial map data
        socket.on('initial_state', (data) => {
            console.log('Received initial state:', data);
            currentMap = data.map;
            if (currentMap) {
                gameAreaDiv.style.display = 'block';
                drawGrid();
                updatePlayerMarkers(currentMap.starts); // Show start positions
            }
        });

        // Update game state (player list, ready status)
        socket.on('game_state', (data) => {
            console.log('Received game state:', data);
            statusDiv.textContent = `Status: ${data.state}. Waiting for players...`;
            if (data.state === 'playing') {
                 statusDiv.textContent = 'Status: Simulating moves...';
                 inputControlsDiv.style.display = 'none'; // Hide input during simulation
            } else {
                 inputControlsDiv.style.display = 'block'; // Show input if waiting/finished
                 readyButton.disabled = false; // Re-enable ready button
                 readyButton.textContent = 'Submit Moves & Ready Up';
            }

            // Update player list UI
            playerListUl.innerHTML = '';
            data.players.forEach(p => {
                const li = document.createElement('li');
                li.textContent = `${p.role} (${p.ready ? 'Ready' : 'Waiting'})`;
                li.classList.add(p.ready ? 'ready' : 'waiting');
                playerListUl.appendChild(li);
            });

             // Check if current player is ready
            const currentPlayer = data.players.find(p => p.role === userRole);
            if (currentPlayer && currentPlayer.ready) {
                readyButton.disabled = true;
                readyButton.textContent = 'Waiting for others...';
            }
        });

         socket.on('game_reset', (data) => {
            console.log('Game reset:', data.reason);
            alert(`Game Reset: ${data.reason}`);
            statusDiv.textContent = 'Game Reset. Waiting for players...';
            inputSequenceTextarea.value = ''; // Clear inputs
            readyButton.disabled = false;
            readyButton.textContent = 'Submit Moves & Ready Up';
            simulationResultDiv.textContent = '';
            simulationResultDiv.className = '';
            inputControlsDiv.style.display = 'block';
             // Clear paths and reset markers to start
            playerPaths = {};
            if(currentMap) updatePlayerMarkers(currentMap.starts);
        });

        socket.on('simulation_result', (data) => {
            console.log('Simulation result:', data);
            statusDiv.textContent = `Simulation Finished: ${data.reason}`;
            simulationResultDiv.textContent = data.reason;
            simulationResultDiv.className = data.success ? 'success' : 'error';
            playerPaths = data.paths || {};
            animateSimulation(); // Visualize the paths

             if (!data.success) {
                // Re-enable input if failed
                 inputControlsDiv.style.display = 'block';
                 readyButton.disabled = false;
                 readyButton.textContent = 'Submit Moves & Ready Up';
            } else {
                 inputControlsDiv.style.display = 'none'; // Keep hidden on success
            }
        });

        // Handle challenge completion signal from server
        socket.on('challenge_complete', () => {
            console.log('Challenge complete signal received!');
            statusDiv.textContent = 'Challenge Completed Successfully! Proceeding...';
            alert('Success! All players reached their targets. Proceeding to the next step.');
            // Submit the hidden form to PHP backend
            completionForm.submit();
        });

        // --- UI Interaction --- //

        document.getElementById('add-up').addEventListener('click', () => addMove('up'));
        document.getElementById('add-down').addEventListener('click', () => addMove('down'));
        document.getElementById('add-left').addEventListener('click', () => addMove('left'));
        document.getElementById('add-right').addEventListener('click', () => addMove('right'));
        document.getElementById('add-stay').addEventListener('click', () => addMove('stay'));
        document.getElementById('clear-moves').addEventListener('click', () => { inputSequenceTextarea.value = ''; });

        function addMove(move) {
            const currentVal = inputSequenceTextarea.value.trim();
            inputSequenceTextarea.value = currentVal ? `${currentVal}, ${move}` : move;
        }

        readyButton.addEventListener('click', () => {
            const moves = inputSequenceTextarea.value
                .split(/[\n,]+/)
                .map(m => m.trim().toLowerCase())
                .filter(m => ['up', 'down', 'left', 'right', 'stay'].includes(m));

            if (moves.length === 0) {
                alert('Please enter at least one valid move (up, down, left, right, stay).');
                return;
            }

            console.log(`Sending ready signal with ${moves.length} moves:`, moves);
            socket.emit('player_ready', { inputs: moves });
            readyButton.disabled = true;
            readyButton.textContent = 'Moves Submitted. Waiting...';
        });

        // --- Drawing Logic --- //
        const CELL_SIZE = 30; // px

        function drawGrid() {
            if (!currentMap) return;
            gridContainer.innerHTML = ''; // Clear previous grid
            gridContainer.style.gridTemplateColumns = `repeat(${currentMap.width}, ${CELL_SIZE}px)`;
            gridContainer.style.gridTemplateRows = `repeat(${currentMap.height}, ${CELL_SIZE}px)`;
            gridContainer.style.width = `${currentMap.width * CELL_SIZE}px`;
            gridContainer.style.height = `${currentMap.height * CELL_SIZE}px`;

            for (let y = 0; y < currentMap.height; y++) {
                for (let x = 0; x < currentMap.width; x++) {
                    const cell = document.createElement('div');
                    cell.classList.add('grid-cell');
                    cell.id = `cell-${x}-${y}`;
                    cell.style.width = `${CELL_SIZE}px`;
                    cell.style.height = `${CELL_SIZE}px`;

                    // Mark obstacles
                    if (currentMap.obstacles.some(obs => obs.x === x && obs.y === y)) {
                        cell.classList.add('obstacle');
                    }

                    // Mark targets and starts
                    Object.entries(currentMap.targets).forEach(([role, pos]) => {
                        if (pos.x === x && pos.y === y) cell.classList.add('target');
                    });
                     Object.entries(currentMap.starts).forEach(([role, pos]) => {
                        if (pos.x === x && pos.y === y) cell.classList.add('player-start');
                    });

                    gridContainer.appendChild(cell);
                }
            }
        }

        function updatePlayerMarkers(positions) {
            // Clear existing markers
            document.querySelectorAll('.player-marker').forEach(m => m.remove());

            Object.entries(positions).forEach(([role, pos]) => {
                const cell = document.getElementById(`cell-${pos.x}-${pos.y}`);
                if (cell) {
                    const marker = document.createElement('div');
                    marker.classList.add('player-marker', `player-${role}`);
                    marker.id = `marker-${role}`;
                    marker.textContent = role.substring(0,1); // Initial
                    cell.appendChild(marker);
                }
            });
        }

        function animateSimulation() {
            if (!currentMap || Object.keys(playerPaths).length === 0) return;

            let step = 0;
            const maxSteps = Math.max(...Object.values(playerPaths).map(p => p.length));
            updatePlayerMarkers(currentMap.starts); // Reset to start

            function nextFrame() {
                if (step >= maxSteps) {
                    console.log("Animation finished");
                    return;
                }

                const currentPositions = {};
                Object.entries(playerPaths).forEach(([role, path]) => {
                    const pos = path[step] || path[path.length - 1]; // Use current step or last position
                    currentPositions[role] = pos;
                });

                updatePlayerMarkers(currentPositions);
                step++;
                setTimeout(nextFrame, 150); // Adjust speed of animation
            }

            nextFrame();
        }

    </script>
</body>
</html> 