<?php
require_once __DIR__ . '/../../includes/init.php';

$step_id = 'navigator_story_1'; // Define the step ID for this page
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
    <title>Navigator's Path: First Journey Begins</title>
    <link rel="stylesheet" href="/assets/style.css">
</head>
<body>
    <div class="container">
        <h1>The Navigator's Path: First Journey</h1>

        <p>With the sequence puzzle complete, the paths to the five provinces revealed themselves. You find yourself standing at the edge of a vast geometric forest, where trees grow in perfect mathematical patterns and stars align in navigational constellations. Your scroll has transformed into a glowing compass that hovers before you.</p>

        <p>"Greetings, Navigator," comes a voice from the compass. "Your analytical mind and love for exploration make you the ideal champion to recover the fragment hidden in Metrica."</p>

        <p>The forest canopy parts to reveal an ancient arcade game shimmering in the air, a glowing orb bouncing across a magical field, requiring precise timing and reflexes to control.</p>

        <p>"Master this ancient game of Pong," the voice instructs.</p>

        <!-- Link to "complete" this story step and move to the next -->
        <a href="/complete.php?story_id=<?php echo urlencode($step_id); ?>" class="continue-button">Proceed to Pong Challenge</a>

    </div>
</body>
</html> 