<?php
require_once __DIR__ . '/../includes/init.php';

$step_id = 'completed'; // Define the step ID for this page
$role = get_user_role();

// Security Check: Ensure the user is logged in and this is their current step
require_login();
if (!can_access_step($role, $step_id)) {
    // Although users should only land here via correct progression,
    // redirect just in case they bookmark or access directly later.
    redirect_to_current_step();
    exit;
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Journey Complete!</title>
    <link rel="stylesheet" href="/assets/style.css">
</head>
<body>
    <div class="container">
        <h1>Congratulations, <?php echo htmlspecialchars($role); ?>!</h1>

        <h2>The Final Convergence is Achieved!</h2>

        <p>You and your fellow champions have successfully navigated the trials, combined the codes, and restored the Egg of Creation... at least, in this realm.</p>

        <p>As the First Elder revealed, the true reward awaits you in the physical world. The final riddle, guiding you to the hidden prize, should now be apparent based on your combined journey and the clues revealed in the epilogue.</p>

        <p><strong>Your digital journey is complete. Good luck with the final hunt!</strong></p>

        <hr>
        <p><small>You can close this window now.</small></p>

        <!-- Optional: Add a logout link -->
        <!-- <p><a href="/logout.php">Log Out</a></p> -->

    </div>
</body>
</html> 