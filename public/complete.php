<?php
require_once __DIR__ . '/../includes/init.php'; // Use init now

// 1. Require Login
require_login();

$role = get_user_role();
$current_step_id = get_current_step_id($role);
$completed_step_id = null;

// 2. Identify completed step (Challenge via POST or Story via GET)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['challenge_id'])) {
    // Challenge Completion
    $completed_step_id = trim($_POST['challenge_id']);
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['story_id'])) {
    // Story Completion (User clicked "Continue")
    $completed_step_id = trim($_GET['story_id']);
} else {
    // Invalid request type or missing identifier
    redirect_to_current_step();
    exit;
}

// 3. Verify completed step matches current step in DB
if ($current_step_id !== $completed_step_id) {
    // State mismatch
    error_log("User '{$role}' attempted to complete '{$completed_step_id}' but current step is '{$current_step_id}'");
    redirect_to_current_step();
    exit;
}

// 4. Look up the next step
$current_step_details = get_step_details($role, $current_step_id);

if (!$current_step_details || !isset($current_step_details['next_step'])) {
    // Error: Progression map issue
    error_log("Error: Could not find next step details for role '{$role}' from step '{$current_step_id}'");
    logout();
    header("Location: /index.php?error=step_logic_error");
    exit;
}

$next_step_id = $current_step_details['next_step'];

// 5. Update user's step in the database
if (!update_user_step($role, $next_step_id)) {
    // Error: Failed to update database
    error_log("CRITICAL: Failed to update step for role '{$role}' from '{$current_step_id}' to '{$next_step_id}'");
    die("An error occurred while saving your progress. Please contact the administrator.");
}

// 6. Redirect to the new current step
redirect_to_current_step();
exit;

?> 