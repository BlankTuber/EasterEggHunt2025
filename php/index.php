<?php
/**
 * Main entry point for Kingdom Hunt
 * 
 * This file handles initial routing and will eventually
 * include the frontend interface.
 */

// Load configuration and required files
require_once 'includes/init.php';

// Get requested page
$page = $_GET['page'] ?? 'home';

// Check for introduction link
if ($page === 'intro') {
    $user_id = $_GET['who'] ?? null;
    
    if (empty($user_id)) {
        // Redirect to home if no user ID provided
        header('Location: /');
        exit;
    }
    
    // Currently just serving a placeholder response
    // This will be replaced with your actual frontend
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'ok',
        'message' => 'Introduction page for user: ' . $user_id,
        'note' => 'This is a placeholder. The actual frontend will be implemented separately.'
    ]);
    exit;
}

// For now, just display a simple message
// This will be replaced with your actual frontend
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kingdom Hunt</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background-color: #f0f0f0;
            text-align: center;
        }
        .container {
            max-width: 800px;
            padding: 2rem;
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        h1 {
            color: #2c3e50;
        }
        p {
            color: #34495e;
            line-height: 1.6;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Kingdom Hunt</h1>
        <p>The backend API is ready. This page will be replaced with the game's frontend interface.</p>
        <p>To access the admin panel, go to <a href="/admin/">Admin Panel</a>.</p>
        <p>For initial setup, visit <a href="/setup.php">Setup Script</a>.</p>
    </div>
</body>
</html>