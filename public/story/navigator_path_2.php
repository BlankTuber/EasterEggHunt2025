<?php
require_once __DIR__ . '/../../includes/init.php';

$step_id = 'navigator_story_2'; // Define the step ID for this page
$role = get_user_role();

// Security Check: Ensure the user is logged in and this is their current step
require_login();
if (!can_access_step($role, $step_id)) {
    redirect_to_current_step();
    exit;
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Navigator's Path: Into the Forest</title>
    <link rel="stylesheet" href="/assets/style.css">
</head>
<body>
    <div class="container">
        <h1>Navigator's Path: Into the Forest</h1>

        <p>Having mastered the game of Pong, you proceed deeper into the geometric forest. The trees part to reveal a sequence of numbers etched into stone pillars, some following clear patterns while others seem out of place.</p>

        <p>"The universal language of mathematics speaks here," the compass directs. "Find the pattern, complete the sequence, and the forest will yield its secrets."</p>

        <!-- Link to "complete" this story step and move to the next -->
        <a href="/complete.php?story_id=<?php echo urlencode($step_id); ?>" class="continue-button">Face the Math Sequence</a>

    </div>
</body>
</html> 