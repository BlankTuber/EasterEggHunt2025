<?php
require_once __DIR__ . '/../../includes/init.php';

// Require admin login for this page
require_admin_login();

// Get all steps for dropdown
$all_steps = [];
$progression_map = get_progression_map();
foreach ($progression_map as $role_steps) {
    foreach ($role_steps as $step_id => $details) {
        $all_steps[$step_id] = $step_id . " (" . $details['type'] . ")";
    }
}
// Add the final completed step if not already caught
if (!isset($all_steps['completed'])) {
    $all_steps['completed'] = 'completed (end)';
}
ksort($all_steps);

// Handle progress update
$update_message = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'update_progress') {
    $role_to_update = $_POST['role'] ?? null;
    $new_step = $_POST['new_step'] ?? null;

    // Basic validation
    if ($role_to_update && $new_step && isset($progression_map[$role_to_update])) {
        // Check if the step exists for the role (or is 'completed')
        if (isset($progression_map[$role_to_update][$new_step]) || $new_step === 'completed') {
            if (update_user_step($role_to_update, $new_step)) {
                $update_message = "Successfully updated {$role_to_update} to step {$new_step}.";
            } else {
                $update_message = "Error updating {$role_to_update}. Database error.";
            }
        } else {
             $update_message = "Error: Step '{$new_step}' is not valid for role '{$role_to_update}'.";
        }
    } else {
        $update_message = "Error: Invalid role or step provided.";
    }
}

// Fetch current user progress
$pdo = get_db_connection();
$users = [];
if ($pdo) {
    try {
        $stmt = $pdo->query("SELECT role, magic_token, current_step, last_access FROM users ORDER BY role");
        $users = $stmt->fetchAll();
    } catch (PDOException $e) {
        die("Error fetching user data: " . $e->getMessage());
    }
} else {
    die("Database connection failed.");
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard</title>
    <link rel="stylesheet" href="/assets/style.css">
    <style>
        table { width: 100%; border-collapse: collapse; margin-top: 1em; }
        th, td { border: 1px solid #ccc; padding: 0.8em; text-align: left; }
        th { background-color: #e9ecef; }
        .update-form { margin-top: 2em; padding-top: 1em; border-top: 1px solid #ccc; }
        .message { padding: 1em; margin-bottom: 1em; border-radius: 4px; }
        .success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .error { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Admin Dashboard</h1>
        <p><a href="/admin/logout.php">Logout</a></p>

        <?php if ($update_message): ?>
            <div class="message <?php echo (strpos($update_message, 'Error') === false) ? 'success' : 'error'; ?>">
                <?php echo htmlspecialchars($update_message); ?>
            </div>
        <?php endif; ?>

        <h2>User Progress</h2>
        <table>
            <thead>
                <tr>
                    <th>Role</th>
                    <th>Magic Link Token</th>
                    <th>Current Step ID</th>
                    <th>Last Access</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($users)): ?>
                    <tr><td colspan="4">No users found in the database.</td></tr>
                <?php else: ?>
                    <?php foreach ($users as $user): ?>
                        <tr>
                            <td><?php echo htmlspecialchars($user['role']); ?></td>
                            <td><?php echo htmlspecialchars($user['magic_token']); ?></td>
                            <td><?php echo htmlspecialchars($user['current_step']); ?></td>
                            <td><?php echo htmlspecialchars($user['last_access']); ?></td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>

        <div class="update-form">
            <h2>Manually Update User Progress</h2>
            <form method="POST">
                <input type="hidden" name="action" value="update_progress">
                <div>
                    <label for="role">Select Role:</label>
                    <select id="role" name="role" required>
                        <option value="">-- Select Role --</option>
                        <?php foreach ($users as $user): ?>
                            <option value="<?php echo htmlspecialchars($user['role']); ?>">
                                <?php echo htmlspecialchars($user['role']); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div>
                    <label for="new_step">Set Current Step To:</label>
                    <select id="new_step" name="new_step" required>
                        <option value="">-- Select Step --</option>
                        <?php foreach ($all_steps as $step_id => $step_label): ?>
                             <option value="<?php echo htmlspecialchars($step_id); ?>">
                                <?php echo htmlspecialchars($step_label); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <button type="submit">Update Progress</button>
            </form>
        </div>

    </div>
</body>
</html> 