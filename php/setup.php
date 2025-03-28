<?php
/**
 * Database Setup Script for Kingdom Hunt
 * 
 * This script creates the database tables and adds initial data.
 * It should be run once during initial setup, then removed or protected.
 */

// Load configuration
require_once 'config.php';

// Check if this is a POST request
$setup_complete = false;
$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Connect to database
        $conn = new PDO("mysql:host=" . DB_HOST, DB_USER, DB_PASS);
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // Create database if it doesn't exist
        $conn->exec("CREATE DATABASE IF NOT EXISTS " . DB_NAME . " CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        $conn->exec("USE " . DB_NAME);
        
        // Create users table
        $conn->exec("CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id VARCHAR(255) UNIQUE NOT NULL,
            name VARCHAR(255) NULL,
            current_path VARCHAR(50) NOT NULL DEFAULT 'intro',
            current_challenge INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            role VARCHAR(50) NULL
        )");
        
        // Create challenges table
        $conn->exec("CREATE TABLE IF NOT EXISTS challenges (
            id INT AUTO_INCREMENT PRIMARY KEY,
            challenge_code VARCHAR(100) NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            path VARCHAR(50) NOT NULL,
            sequence_order INT NOT NULL,
            challenge_type ENUM('individual', 'convergence_minor', 'convergence_major') NOT NULL,
            convergence_group VARCHAR(255) NULL,
            unlock_condition TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )");
        
        // Create story segments table
        $conn->exec("CREATE TABLE IF NOT EXISTS story_segments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            segment_code VARCHAR(100) NOT NULL,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            path VARCHAR(50) NOT NULL,
            sequence_order INT NOT NULL,
            unlock_condition TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )");
        
        // Create challenge completions table
        $conn->exec("CREATE TABLE IF NOT EXISTS challenge_completions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL,
            challenge_id INT NOT NULL,
            completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
            FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE
        )");
        
        // Create story unlocks table
        $conn->exec("CREATE TABLE IF NOT EXISTS story_unlocks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL,
            segment_id INT NOT NULL,
            unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
            FOREIGN KEY (segment_id) REFERENCES story_segments(id) ON DELETE CASCADE
        )");
        
        // Create unlock messages table
        $conn->exec("CREATE TABLE IF NOT EXISTS unlock_messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            message_code VARCHAR(100) NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )");
        
        // Create sessions table
        $conn->exec("CREATE TABLE IF NOT EXISTS sessions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL,
            session_token VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
        )");
        
        // Create convergence readiness table
        $conn->exec("CREATE TABLE IF NOT EXISTS convergence_readiness (
            id INT AUTO_INCREMENT PRIMARY KEY,
            convergence_id INT NOT NULL,
            user_id VARCHAR(255) NOT NULL,
            ready BOOLEAN DEFAULT FALSE,
            ready_at TIMESTAMP NULL,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
            FOREIGN KEY (convergence_id) REFERENCES challenges(id) ON DELETE CASCADE
        )");
        
        // Create activity logs table
        $conn->exec("CREATE TABLE IF NOT EXISTS activity_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL,
            activity VARCHAR(255) NOT NULL,
            details TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
        )");
        
        // Insert default unlock messages
        $messages = [
            ['intro_completed', 'Welcome to the Kingdom of Neerbye!', 'You have completed the introduction. Your journey now begins!'],
            ['challenge_completed', 'Challenge Completed!', 'You have successfully completed the challenge. The next part of your journey awaits.'],
            ['path_completed', 'Path Completed!', 'You have reached the end of this path. Wait for your fellow champions to join you for the convergence.'],
            ['convergence_ready', 'Convergence Ready!', 'All champions are now ready for the convergence. Work together to overcome this challenge!'],
            ['game_completed', 'The Kingdom is Saved!', 'Congratulations! You and your fellow champions have successfully completed your quest and saved the Kingdom of Neerbye!']
        ];
        
        $stmt = $conn->prepare("INSERT INTO unlock_messages (message_code, title, message) VALUES (?, ?, ?)");
        
        foreach ($messages as $message) {
            $stmt->execute($message);
        }
        
        // Insert some sample challenges for testing
        $challenges = [
            ['intro_challenge', 'Introduction', 'Welcome to the Kingdom of Neerbye. Your first task is to familiarize yourself with the realm.', 'intro', 1, 'individual', NULL, NULL],
            ['navigator_pong', 'The Ancient Game of Pong', 'Master this ancient game of Pong.', 'path1', 1, 'individual', NULL, NULL],
            ['navigator_math', 'Mathematical Sequences', 'Find the pattern, complete the sequence.', 'path1', 2, 'individual', NULL, NULL],
            ['craftsman_football', 'Team Emblems', 'Identify each team from their emblematic outline.', 'path1', 1, 'individual', NULL, NULL],
            ['nav_craft_geocache', 'Hidden Locations', 'Find the hidden treasure using coordinates and descriptions.', 'path1', 3, 'convergence_minor', 'navigator_craftsman', '{"requires_challenge":["navigator_math","craftsman_football"]}']
        ];
        
        $stmt = $conn->prepare("INSERT INTO challenges (challenge_code, title, description, path, sequence_order, challenge_type, convergence_group, unlock_condition) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        
        foreach ($challenges as $challenge) {
            $stmt->execute($challenge);
        }
        
        // Insert some sample story segments
        $story_segments = [
            ['intro_story', 'The Call to Adventure', 'The ancient kingdom of Neerbye had long been at peace...', 'intro', 1, NULL],
            ['navigator_intro', 'The Navigator\'s Path', 'The Navigator found himself standing at the edge of a vast geometric forest...', 'path1', 1, '{"requires_challenge":"intro_challenge"}'],
            ['craftsman_intro', 'The Craftsman\'s Path', 'The Craftsman arrived in a realm of half-built structures and raw materials...', 'path1', 2, '{"requires_challenge":"intro_challenge"}']
        ];
        
        $stmt = $conn->prepare("INSERT INTO story_segments (segment_code, title, content, path, sequence_order, unlock_condition) VALUES (?, ?, ?, ?, ?, ?)");
        
        foreach ($story_segments as $segment) {
            $stmt->execute($segment);
        }
        
        // Create logs directory if it doesn't exist
        if (!file_exists('logs')) {
            mkdir('logs', 0755, true);
        }
        
        $setup_complete = true;
    } catch (PDOException $e) {
        $error = "Database Error: " . $e->getMessage();
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kingdom Hunt Setup</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { padding-top: 40px; }
        .setup-container { max-width: 600px; margin: 0 auto; }
    </style>
</head>
<body>
    <div class="container setup-container">
        <div class="card">
            <div class="card-header bg-primary text-white">
                <h1 class="card-title">Kingdom Hunt Setup</h1>
            </div>
            <div class="card-body">
                <?php if ($setup_complete): ?>
                    <div class="alert alert-success">
                        <h4>Setup Complete!</h4>
                        <p>The database has been successfully created and populated with initial data.</p>
                    </div>
                    <div class="alert alert-warning">
                        <h4>Security Notice</h4>
                        <p>For security reasons, you should delete this setup file now that setup is complete.</p>
                    </div>
                    <a href="admin/" class="btn btn-primary">Go to Admin Panel</a>
                <?php elseif ($error): ?>
                    <div class="alert alert-danger">
                        <h4>Setup Error</h4>
                        <p><?php echo $error; ?></p>
                    </div>
                    <form method="post" class="mt-4">
                        <button type="submit" class="btn btn-primary">Try Again</button>
                    </form>
                <?php else: ?>
                    <h4>Welcome to the Kingdom Hunt Setup</h4>
                    <p>This script will create the necessary database tables and populate them with initial data for your Kingdom Hunt game.</p>
                    
                    <div class="alert alert-info">
                        <h5>Before You Begin</h5>
                        <p>Make sure you have:</p>
                        <ol>
                            <li>Created a MySQL database</li>
                            <li>Updated the config.php file with your database credentials</li>
                        </ol>
                    </div>
                    
                    <form method="post" class="mt-4">
                        <div class="d-grid">
                            <button type="submit" class="btn btn-primary btn-lg">Start Setup</button>
                        </div>
                    </form>
                <?php endif; ?>
            </div>
        </div>
    </div>
</body>
</html>