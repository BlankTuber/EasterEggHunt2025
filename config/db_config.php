<?php
// Database Configuration

// Replace with your database server hostname (usually 'localhost' for XAMPP)
define('DB_HOST', 'localhost');

// Replace with the name of the database you want to use (e.g., 'easter_egg_hunt')
define('DB_NAME', 'easter_egg_hunt');

// Replace with your XAMPP MySQL username (usually 'root')
define('DB_USER', 'root');

// Replace with your XAMPP MySQL password (often empty by default, but set one!)
define('DB_PASS', '');

// Admin Configuration
define('ADMIN_USERNAME', 'admin');
// IMPORTANT: Replace 'password' with a strong password and generate a hash.
// Use password_hash('YourStrongPassword', PASSWORD_DEFAULT) to generate the hash.
// Example hash for 'password': '$2y$10$ExampleHashGeneratedByPHP...'
define('ADMIN_PASSWORD_HASH', password_hash('password', PASSWORD_DEFAULT)); // Replace this hash!

?> 