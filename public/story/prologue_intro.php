<?php
require_once __DIR__ . '/../../includes/init.php';

$step_id = 'prologue_intro'; // Define the step ID for this page
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
    <title>Prologue: The Call to Adventure</title>
    <link rel="stylesheet" href="/assets/style.css">
</head>
<body>
    <div class="container">
        <h1>Prologue: The Call to Adventure</h1>

        <p>The ancient kingdom of Neerbye had long been at peace, its five provinces prospering under the watchful eyes of their guardians: <strong>Navigator</strong>, <strong>Sage</strong>, <strong>Chronicler</strong>, <strong>Craftsman</strong>, and <strong>Apprentice</strong>. But as the vernal equinox approached, strange energies began to stir. The ancient Egg of Creation, said to contain the power to renew or destroy the realm, had fractured into five pieces, each scattering to a different province.</p>

        <p>The Council of Elders gathered in the Grand Hall of Harmony, their faces grave beneath the flickering torchlight. "We must summon the five champions," declared the First Elder, her voice echoing against the stone walls. "Only you <?php echo htmlspecialchars($role); ?>, along with your fellow champions, possess the unique talents to recover the fragments before the equinox sun reaches its zenith."</p>

        <p>As you and the other champions assemble in the hall, five crystalline platforms appear before you, each with a glowing controller. Above them, a magical projection shows five distinct pieces that need to be moved across a labyrinth without colliding.</p>

        <p>"Your first challenge requires perfect coordination," explains the First Elder. "Each of you controls one piece of the puzzle. You must guide your pieces to their designated sanctuaries without collision. Only by working together, moving in sequence and yielding to one another, can you succeed."</p>

        <p>"Begin the sequence," commands the First Elder. "Show us that five can truly act as one."</p>

        <!-- Link to "complete" this story step and move to the next challenge -->
        <a href="/complete.php?story_id=<?php echo urlencode($step_id); ?>" class="continue-button">Proceed to First Challenge</a>

    </div>
</body>
</html> 