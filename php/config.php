<?php
// Database configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root'); // default XAMPP user
define('DB_PASS', ''); // default XAMPP has no password
define('DB_NAME', 'neerbye_kingdom_hunt');

// Application settings
define('APP_URL', 'http://localhost');
define('SOCKETIO_URL', 'http://localhost:3000');
define('SESSION_LIFETIME', 86400); // 24 hours in seconds
define('SECURE_COOKIE', true); // Set to true for HTTPS
define('DEBUG_MODE', false);

// Security settings
define('TOKEN_SECRET', 'your_secret_key_for_jwt_tokens'); // Change this to a secure random string

// Error reporting settings
if (DEBUG_MODE) {
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
} else {
    error_reporting(0);
}

// Time zone
date_default_timezone_set('UTC');