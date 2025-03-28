<?php
/**
 * Frontend initialization file for Kingdom Hunt
 */

// Define constants
define('FRONTEND_PATH', __DIR__);

// Initialize authentication
$userData = null;
$authToken = null;

// Check for token in session or query parameter
if (isset($_SESSION['auth_token'])) {
    $authToken = $_SESSION['auth_token'];
} elseif (isset($_GET['token'])) {
    $authToken = $_GET['token'];
    $_SESSION['auth_token'] = $authToken;
}

// Validate token and get user data if authenticated
if ($authToken) {
    try {
        // Call the Auth class to validate the session
        $userId = Auth::validateSession($authToken);
        
        if ($userId) {
            // Get user details
            $userData = Auth::getUserDetails($userId);
            
            // Store token in session
            $_SESSION['auth_token'] = $authToken;
        } else {
            // Invalid token, clear session
            unset($_SESSION['auth_token']);
            $authToken = null;
        }
    } catch (Exception $e) {
        // Error validating token
        error_log('Authentication error: ' . $e->getMessage());
        unset($_SESSION['auth_token']);
        $authToken = null;
    }
}

// Handle logout action
if (isset($_GET['action']) && $_GET['action'] === 'logout') {
    // Clear session
    unset($_SESSION['auth_token']);
    
    // Redirect to home
    header('Location: /');
    exit;
}

/**
 * Render a page using the main layout
 * 
 * @param string $page Page to render
 * @param array $data Data to pass to the page
 */
function renderPage($page, $data = []) {
    global $userData, $authToken;
    
    // Add user data to the template vars
    $data['userData'] = $userData;
    $data['authToken'] = $authToken;
    
    // Set the page content
    $pageContent = FRONTEND_PATH . '/pages/' . $page . '.php';
    
    // Check if the page file exists
    if (!file_exists($pageContent)) {
        // Page not found, render 404
        $pageContent = FRONTEND_PATH . '/pages/404.php';
        http_response_code(404);
    }
    
    // Set page content variable for the layout
    $data['pageContent'] = $pageContent;
    
    // Extract variables from the data array
    extract($data);
    
    // Include the layout
    include_once FRONTEND_PATH . '/layouts/main.php';
    exit;
}

/**
 * Check if user is authenticated
 * Redirect to login if not
 */
function requireAuth() {
    global $userData;
    
    if (!$userData) {
        // Redirect to intro page
        header('Location: /?page=intro');
        exit;
    }
}

/**
 * Get current challenge for the user
 */
function getCurrentChallenge() {
    global $userData;
    
    if (!$userData) {
        return null;
    }
    
    // Use the Game class to get current challenge
    return Game::getCurrentChallenge($userData['user_id']);
}