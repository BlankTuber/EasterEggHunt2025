<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/steps.php';

$login_error = null;
$token_provided = false;

// 1. Check for magic token
if (isset($_GET['token'])) {
    $token = trim($_GET['token']);
    $token_provided = true;
    if (!login_with_token($token)) {
        $login_error = "Invalid or expired magic link. Please use one of the links below.";
        // Don't redirect yet, show the login prompt with the error
    } else {
        // Login successful, redirect to current step
        redirect_to_current_step();
        exit; // Exit after redirect header
    }
}

// 2. If already logged in (e.g., session exists), redirect to current step
if (!$token_provided && is_logged_in()) {
    redirect_to_current_step();
    exit; // Exit after redirect header
}

// 3. If not logged in and no valid token provided, show login prompt
// Get available roles/tokens for the login links
$available_roles = ['Navigator', 'Sage', 'Chronicler', 'Craftsman', 'Apprentice']; // In a larger app, fetch from DB

// Display potential errors passed via query params (e.g., from require_login)
if (isset($_GET['error'])) {
    switch ($_GET['error']) {
        case 'not_logged_in':
            $login_error = "You need to log in to access that page.";
            break;
        case 'invalid_step':
            $login_error = "There was an issue finding your current step. Please try logging in again.";
            if (isset($_GET['step'])) {
                 $login_error .= " (Debug: Step ID " . htmlspecialchars($_GET['step']) . ")";
            }
            break;
        case 'cannot_get_step':
             $login_error = "Could not determine your progress. Please try logging in again.";
             break;
    }
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Easter Egg Hunt 2025 - Login</title>
    <link rel="stylesheet" href="assets/style.css"> <!-- We'll create this basic CSS later -->
    <style>
        body {
            font-family: sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background-color: #f0f0f0;
        }
        .login-container {
            background-color: #fff;
            padding: 2em;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        .login-container h1 {
            margin-bottom: 1em;
        }
        .login-container p {
            margin-bottom: 1.5em;
            color: #555;
        }
        .login-container ul {
            list-style: none;
            padding: 0;
        }
        .login-container li {
            margin-bottom: 0.8em;
        }
        .login-container a {
            display: inline-block;
            padding: 0.8em 1.5em;
            background-color: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            transition: background-color 0.3s ease;
        }
        .login-container a:hover {
            background-color: #0056b3;
        }
        .error-message {
            color: #dc3545;
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            padding: 0.75em 1.25em;
            margin-bottom: 1em;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <h1>Welcome, Champion!</h1>
        <p>Select your role to begin or continue your journey:</p>

        <?php if ($login_error): ?>
            <div class="error-message"><?php echo htmlspecialchars($login_error); ?></div>
        <?php endif; ?>

        <ul>
            <?php foreach ($available_roles as $role): ?>
                <li>
                    <a href="index.php?token=<?php echo urlencode($role); ?>">
                        Log in as <?php echo htmlspecialchars($role); ?>
                    </a>
                </li>
            <?php endforeach; ?>
        </ul>
    </div>
</body>
</html> 