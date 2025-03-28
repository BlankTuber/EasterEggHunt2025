<?php
// Start session
session_start();

// Load configuration
require_once __DIR__ . '/../config.php';

// Load all required files
require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/Utils.php';
require_once __DIR__ . '/Auth.php';
require_once __DIR__ . '/Game.php';

// Set timezone
date_default_timezone_set('UTC');

// Error handling
if (DEBUG_MODE) {
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
} else {
    error_reporting(0);
    
    // Set custom error handler for production
    set_error_handler(function($errno, $errstr, $errfile, $errline) {
        $message = date('Y-m-d H:i:s') . " Error [$errno]: $errstr in $errfile on line $errline";
        error_log($message, 3, __DIR__ . '/../logs/error.log');
        
        // Don't show errors to user in production
        return true;
    });
}

// Create logs directory if it doesn't exist
if (!file_exists(__DIR__ . '/../logs')) {
    mkdir(__DIR__ . '/../logs', 0755, true);
}