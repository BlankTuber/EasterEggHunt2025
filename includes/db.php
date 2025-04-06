<?php
require_once __DIR__ . '/../config/db_config.php';

/**
 * Establishes a PDO database connection.
 *
 * @return PDO|null Returns a PDO connection object on success, or null on failure.
 */
function get_db_connection(): ?PDO {
    static $pdo = null;

    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // Throw exceptions on errors
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, // Fetch associative arrays
            PDO::ATTR_EMULATE_PREPARES   => false, // Use native prepared statements
        ];

        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            // In a real application, log this error instead of echoing
            error_log('Database Connection Error: ' . $e->getMessage());
            // For the user, show a generic error message
            die('Failed to connect to the database. Please check configuration or contact the administrator.');
            // return null; // Or handle the error more gracefully
        }
    }

    return $pdo;
}

?> 