<?php
require_once __DIR__ . '/../../includes/init.php';

$step_id = 'challenge_morse'; // Define the step ID for this page
$role = get_user_role();

// Security Check: Ensure the user is logged in, is the Craftsman, and this is their current step
require_login();
if ($role !== 'Craftsman' || !can_access_step($role, $step_id)) {
    redirect_to_current_step();
    exit;
}

// Placeholder for actual Morse logic/answer checking
$is_correct = false;
$submitted_answer = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['answer'])) {
    $submitted_answer = trim($_POST['answer']);
    // *** Replace this with actual answer checking logic ***
    // Example: if (strtolower($submitted_answer) === 'expected phrase') { $is_correct = true; }
    // For now, assume any non-empty answer is correct for demo
    if (!empty($submitted_answer)) {
        $is_correct = true;
    }
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Challenge: Morse Code</title>
    <link rel="stylesheet" href="/assets/style.css">
    <!-- Add any specific morse styles here -->
    <style>
        #morseOutput { font-family: monospace; font-size: 1.5em; letter-spacing: 0.2em; margin: 1em 0; min-height: 2em; background-color: #e9ecef; padding: 0.5em; border-radius: 4px; }
        #morseKey { margin-top: 1em; font-size: 0.9em; color: #555; }
        .blinking-light { width: 30px; height: 30px; background-color: grey; border-radius: 50%; display: inline-block; margin: 0 10px; transition: background-color 0.1s; }
        .blinking-light.on { background-color: yellow; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Challenge: Decode the Morse Message</h1>
        <p>The blueprints directed: "Communication takes many forms. This Morse code contains critical instructions for your journey."</p>

        <p>Observe the blinking light and use the key below to decode the message.</p>

        <div>
            <span id="blinking-light-element" class="blinking-light"></span>
        </div>
        <div id="morseOutput">[Morse output appears here]</div>
        <button id="restartMorseBtn">Restart Signal</button>

        <div id="morseKey">
            <h4>Morse Code Key (Example)</h4>
            <pre>
    A .-      B -...    C -.-.    D -..     E .       F ..-.    G --.
    H ....    I ..      J .---    K -.-     L .-..    M --      N -.
    O ---     P .--.    Q --.-    R .-.     S ...     T -       U ..-
    V ...-    W .--     X -..-    Y -.--    Z --..
    1 .----   2 ..---   3 ...--   4 ....-   5 .....
    6 -....   7 --...   8 ---..   9 ----.   0 -----
            </pre>
        </div>

        <hr>

        <?php if ($is_correct): ?>
            <div style="color: green; background-color: #d4edda; padding: 1em; border-radius: 5px; margin-bottom: 1em;">
                <strong>Correct!</strong> You have decoded the message.
            </div>
            <!-- Show completion form only if correct -->
            <form action="/complete.php" method="POST">
                <input type="hidden" name="challenge_id" value="<?php echo htmlspecialchars($step_id); ?>">
                <button type="submit">Record Completion & Continue</button>
            </form>
        <?php else: ?>
            <!-- Show input form if not yet correct -->
            <form method="POST">
                <label for="answer">Enter the decoded message:</label>
                <input type="text" id="answer" name="answer" value="<?php echo htmlspecialchars($submitted_answer); ?>" required>
                <?php if ($_SERVER['REQUEST_METHOD'] === 'POST' && !$is_correct): ?>
                    <p style="color: red;">That doesn't seem right. Check the signal and key again.</p>
                <?php endif; ?>
                <button type="submit">Submit Answer</button>
            </form>
        <?php endif; ?>

    </div>

    <!-- Placeholder for Morse Blinking JS -->
    <script>
        // Basic placeholder for blinking simulation and restart
        const light = document.getElementById('blinking-light-element');
        const output = document.getElementById('morseOutput');
        const restartBtn = document.getElementById('restartMorseBtn');
        let morseInterval = null;
        const morseMessage = "SOS"; // Example message
        const morseCode = { 'S': '...', 'O': '---' }; // Example subset
        const dotDuration = 200; // ms
        const dashDuration = dotDuration * 3;
        const intraCharSpace = dotDuration;
        const interCharSpace = dotDuration * 3;
        const wordSpace = dotDuration * 7;

        function displayMorse(message) {
            output.textContent = ''; // Clear previous
            if (morseInterval) clearInterval(morseInterval);
            light.classList.remove('on');

            let sequence = [];
            message.toUpperCase().split('').forEach(char => {
                if (morseCode[char]) {
                    morseCode[char].split('').forEach(signal => {
                        sequence.push(signal === '.' ? dotDuration : dashDuration);
                        sequence.push(intraCharSpace); // Space after dot/dash
                    });
                    sequence.pop(); // Remove last intra-char space
                    sequence.push(interCharSpace); // Space after char
                } else if (char === ' ') {
                    sequence.pop(); // Remove last inter-char space
                    sequence.push(wordSpace); // Space for word
                }
            });
             sequence.pop(); // Remove final space

            let i = 0;
            let isLightOn = false;
            let currentTime = 0;

            output.textContent = `Transmitting: ${message}`;

            function tick() {
                if (i >= sequence.length) {
                    light.classList.remove('on');
                    output.textContent += " [Transmission Complete]";
                    clearInterval(morseInterval);
                    return;
                }

                if (isLightOn) {
                    // Turn light off
                    light.classList.remove('on');
                    isLightOn = false;
                    currentTime = sequence[i];
                    i++;
                } else {
                    // Turn light on
                    light.classList.add('on');
                    isLightOn = true;
                    currentTime = sequence[i];
                    i++;
                }
                morseInterval = setTimeout(tick, currentTime);
            }
            // Start the sequence
             morseInterval = setTimeout(tick, 500); // Initial delay
        }

        restartBtn.addEventListener('click', () => displayMorse(morseMessage));

        // Initial display
        displayMorse(morseMessage);

    </script>
</body>
</html> 