<?php
// init.php - Initialize common resources

// Enforce error reporting for development (remove or adjust for production)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Base directory definition for cleaner includes
define('BASE_PATH', dirname(__DIR__));

// Include core files
require_once BASE_PATH . '/includes/auth.php';
require_once BASE_PATH . '/includes/steps.php';

?> 