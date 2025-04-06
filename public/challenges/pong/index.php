<?php
require_once __DIR__ . '/../../includes/init.php';

$step_id = 'challenge_pong'; // Define the step ID for this page
$role = get_user_role();

// Security Check: Ensure the user is logged in, is the Navigator, and this is their current step
require_login();
if ($role !== 'Navigator' || !can_access_step($role, $step_id)) {
    redirect_to_current_step();
    exit;
}

// Flag to show completion form
$show_completion_form = false; // Initially false

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Challenge: Fantasy Pong</title>
    <!-- Adjust paths relative to the public root -->
    <link rel="stylesheet" href="/challenges/util/global.css" />
    <link rel="stylesheet" href="styles.css" /> <!-- Assuming styles.css is in the same dir -->
    <link rel="stylesheet" href="/assets/style.css"> <!-- Include global site styles -->
    <style>
        /* Add some spacing for the completion form */
        .completion-form {
            margin-top: 2em;
            padding: 1em;
            background-color: #e9ecef;
            border-radius: 5px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Challenge: Master the Pong</h1>
        <p>The compass voice instructed: "Master this ancient game of Pong."</p>
        <p>Reach a score of 5 to complete the challenge.</p>

        <div id="game-container">
            <!-- The game canvas/elements will be generated here by JS -->
        </div>

        <!-- Completion Form (initially hidden) -->
        <div id="completion-div" class="completion-form" style="display: none;">
            <p><strong>Congratulations, Navigator! You have mastered the game!</strong></p>
            <form action="/complete.php" method="POST">
                <input type="hidden" name="challenge_id" value="<?php echo htmlspecialchars($step_id); ?>">
                <button type="submit">Record Completion & Continue</button>
            </form>
        </div>

    </div>

    <!-- Adjust JS path relative to public root -->
    <script type="module">
        // Ensure this path is correct relative to the public directory
        import ArcadeGame from "/challenges/util/games/arcade.js";

        // Initialize the game
        const game = new ArcadeGame({
            containerId: "game-container",
            type: "pong",
            winCondition: { type: "score", value: 5 }, // Score 5 points to win
            difficulty: "normal",
            onWin: () => {
                console.log("Pong challenge won!");
                // Show the completion form/button
                document.getElementById('completion-div').style.display = 'block';
                // Optionally disable game input here
            }
        });

        // Optional: Add custom themes or appearance
        /*
        const gameContainer = document.getElementById('game-container');
        gameContainer.classList.add('fantasy-theme');
        */
    </script>
</body>
</html> 