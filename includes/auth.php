<?php
require_once __DIR__ . '/db.php';

// Start or resume the session
if (session_status() === PHP_SESSION_NONE) {
    // Set session cookie parameters for better security (optional but recommended)
    // session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'domain' => $_SERVER['HTTP_HOST'], 'secure' => true, 'httponly' => true, 'samesite' => 'Lax']);
    session_start();
}

/**
 * Verifies a magic token and logs the user in if valid.
 *
 * @param string $token The magic token from the URL.
 * @return bool True if login successful, false otherwise.
 */
function login_with_token(string $token): bool {
    $pdo = get_db_connection();
    if (!$pdo || empty($token)) {
        return false;
    }

    try {
        $stmt = $pdo->prepare("SELECT role FROM users WHERE magic_token = :token");
        $stmt->execute(['token' => $token]);
        $user = $stmt->fetch();

        if ($user) {
            // Regenerate session ID to prevent fixation
            session_regenerate_id(true);
            // Store user role in session
            $_SESSION['user_role'] = $user['role'];
            $_SESSION['logged_in'] = true;
            // Update last access time (optional)
            $updateStmt = $pdo->prepare("UPDATE users SET last_access = CURRENT_TIMESTAMP WHERE role = :role");
            $updateStmt->execute(['role' => $user['role']]);
            return true;
        } else {
            // Invalid token
            logout(); // Ensure no stale session data
            return false;
        }
    } catch (PDOException $e) {
        error_log('Token Login Error: ' . $e->getMessage());
        return false;
    }
}

/**
 * Checks if a user is currently logged in.
 *
 * @return bool True if logged in, false otherwise.
 */
function is_logged_in(): bool {
    return isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true && isset($_SESSION['user_role']);
}

/**
 * Gets the role of the currently logged-in user.
 *
 * @return string|null The user role or null if not logged in.
 */
function get_user_role(): ?string {
    return $_SESSION['user_role'] ?? null;
}

/**
 * Logs the current user out by destroying the session.
 */
function logout(): void {
    // Unset all session variables
    $_SESSION = [];

    // If session cookies are used, delete the cookie
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }

    // Destroy the session
    session_destroy();
}

/**
 * Redirects to the login page if the user is not logged in.
 * Call this at the top of pages that require authentication.
 */
function require_login(): void {
    if (!is_logged_in()) {
        // Redirect to the main page (which handles login)
        // Assumes web root is 'public', so /index.php is the entry
        header("Location: /index.php?error=not_logged_in");
        exit;
    }
}

/**
 * Logs in an admin user.
 *
 * @param string $username
 * @param string $password
 * @return bool True on success, false otherwise.
 */
function login_admin(string $username, string $password): bool {
    require_once __DIR__ . '/../config/db_config.php'; // Ensure config is loaded

    if ($username === ADMIN_USERNAME && password_verify($password, ADMIN_PASSWORD_HASH)) {
        // Regenerate session ID
        session_regenerate_id(true);
        $_SESSION['admin_logged_in'] = true;
        return true;
    }
    return false;
}

/**
 * Checks if an admin is logged in.
 *
 * @return bool
 */
function is_admin_logged_in(): bool {
    return isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;
}

/**
 * Logs out the admin user.
 * (Could potentially share logout logic with regular user logout if needed)
 */
function logout_admin(): void {
    if (isset($_SESSION['admin_logged_in'])) {
        unset($_SESSION['admin_logged_in']);
        // Consider session regeneration or full logout if admin/user sessions should be separate
        // For simplicity, just unsetting the flag here.
    }
     // Maybe call full logout() if admin logout should end user session too?
     // logout();
}

/**
 * Requires admin login to access a page.
 */
function require_admin_login(): void {
    if (!is_admin_logged_in()) {
        // Redirect to the admin login page
        header("Location: /admin/login.php?error=not_logged_in");
        exit;
    }
}

?> 