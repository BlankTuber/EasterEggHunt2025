<?php
// Main API entry point
require_once '../includes/init.php';

// Parse the requested endpoint
$request_uri = $_SERVER['REQUEST_URI'];
$base_path = '/api';
$endpoint = str_replace($base_path, '', parse_url($request_uri, PHP_URL_PATH));

// Remove trailing slashes
$endpoint = rtrim($endpoint, '/');

// Get request method
$method = $_SERVER['REQUEST_METHOD'];

// Parse JSON body for POST, PUT, PATCH requests
$body = [];
if (in_array($method, ['POST', 'PUT', 'PATCH'])) {
    $input = file_get_contents('php://input');
    if (!empty($input)) {
        $body = json_decode($input, true) ?? [];
    }
}

// Handle preflight CORS requests
if ($method === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    exit;
}

// Set CORS headers for all responses
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

// Define API routes
$routes = [
    // Public routes (no authentication required)
    'GET /ping' => function() {
        Utils::sendJsonResponse(['status' => 'ok', 'message' => 'API is running']);
    },
    'GET /intro' => 'handleIntro',
    'POST /intro/complete' => 'handleIntroComplete',
    
    // Protected routes (authentication required)
    'GET /user' => 'handleGetUser',
    'GET /challenge/current' => 'handleGetCurrentChallenge',
    'POST /challenge/complete' => 'handleCompleteChallenge',
    'GET /story' => 'handleGetStory',
    'POST /convergence/ready' => 'handleConvergenceReady',
    'GET /convergence/status' => 'handleConvergenceStatus',
    'POST /logout' => 'handleLogout'
];

// Match and execute the appropriate route handler
$route_key = "$method $endpoint";
$route_handler = $routes[$route_key] ?? null;

if ($route_handler) {
    if (is_callable($route_handler)) {
        // Execute function directly
        $route_handler();
    } else {
        // Call function by name
        $function_name = $route_handler;
        if (function_exists($function_name)) {
            $function_name();
        } else {
            Utils::sendErrorResponse('Route handler not implemented', 501);
        }
    }
} else {
    Utils::sendErrorResponse('Endpoint not found', 404);
}

// API route handler functions

// Handle intro page (when a user clicks the initial link)
function handleIntro() {
    // Get user_id from query parameter
    $user_id = $_GET['who'] ?? null;
    
    if (!$user_id) {
        Utils::sendErrorResponse('User ID is required', 400);
        return;
    }
    
    // Check if user exists, if not create them
    if (!Auth::userExists($user_id)) {
        Auth::createUser($user_id);
    }
    
    // Create a session for the user
    $session = Auth::createSession($user_id);
    
    // Return session token and basic user info
    Utils::sendJsonResponse([
        'token' => $session['token'],
        'expires' => $session['expires'],
        'user_id' => $user_id
    ]);
}

// Handle intro completion
function handleIntroComplete() {
    global $body;
    
    // Get token from authorization header
    $token = getAuthToken();
    
    if (!$token) {
        Utils::sendErrorResponse('Authentication required', 401);
        return;
    }
    
    // Validate token
    $user_id = Auth::validateSession($token);
    
    if (!$user_id) {
        Utils::sendErrorResponse('Invalid or expired token', 401);
        return;
    }
    
    // Update user progress
    Auth::updateUserProgress($user_id, 'path1');
    
    // Get the first challenge
    $challenge = Game::getCurrentChallenge($user_id);
    
    // Get unlock message
    $message = Game::getUnlockMessage('intro_completed');
    
    // Notify socketio server
    Utils::notifySocketServer('intro_completed', [
        'user_id' => $user_id
    ]);
    
    // Return success response with first challenge details
    Utils::sendJsonResponse([
        'success' => true,
        'message' => $message,
        'next_challenge' => [
            'id' => $challenge['id'],
            'title' => $challenge['title'],
            'description' => $challenge['description'],
            'type' => $challenge['challenge_type']
        ]
    ]);
}

// Get current user details
function handleGetUser() {
    // Get token from authorization header
    $token = getAuthToken();
    
    if (!$token) {
        Utils::sendErrorResponse('Authentication required', 401);
        return;
    }
    
    // Validate token
    $user_id = Auth::validateSession($token);
    
    if (!$user_id) {
        Utils::sendErrorResponse('Invalid or expired token', 401);
        return;
    }
    
    // Get user details
    $user = Auth::getUserDetails($user_id);
    
    if (!$user) {
        Utils::sendErrorResponse('User not found', 404);
        return;
    }
    
    Utils::sendJsonResponse($user);
}

// Get current challenge
function handleGetCurrentChallenge() {
    // Get token from authorization header
    $token = getAuthToken();
    
    if (!$token) {
        Utils::sendErrorResponse('Authentication required', 401);
        return;
    }
    
    // Validate token
    $user_id = Auth::validateSession($token);
    
    if (!$user_id) {
        Utils::sendErrorResponse('Invalid or expired token', 401);
        return;
    }
    
    // Get current challenge
    $challenge = Game::getCurrentChallenge($user_id);
    
    if (!$challenge) {
        Utils::sendErrorResponse('No challenge found', 404);
        return;
    }
    
    // Check if challenge is available
    $isAvailable = Game::isChallengeAvailable($user_id, $challenge['id']);
    
    Utils::sendJsonResponse([
        'challenge' => [
            'id' => $challenge['id'],
            'title' => $challenge['title'],
            'description' => $challenge['description'],
            'type' => $challenge['challenge_type'],
            'convergence_group' => $challenge['convergence_group'],
            'is_available' => $isAvailable
        ]
    ]);
}

// Complete a challenge
function handleCompleteChallenge() {
    global $body;
    
    // Get token from authorization header
    $token = getAuthToken();
    
    if (!$token) {
        Utils::sendErrorResponse('Authentication required', 401);
        return;
    }
    
    // Validate token
    $user_id = Auth::validateSession($token);
    
    if (!$user_id) {
        Utils::sendErrorResponse('Invalid or expired token', 401);
        return;
    }
    
    // Get challenge ID from request
    $challenge_id = $body['challenge_id'] ?? null;
    
    if (!$challenge_id) {
        Utils::sendErrorResponse('Challenge ID is required', 400);
        return;
    }
    
    // Complete the challenge
    $result = Game::completeChallenge($user_id, $challenge_id);
    
    if (!$result) {
        Utils::sendErrorResponse('Failed to complete challenge', 500);
        return;
    }
    
    // Notify socketio server
    Utils::notifySocketServer('challenge_completed', [
        'user_id' => $user_id,
        'challenge_id' => $challenge_id
    ]);
    
    Utils::sendJsonResponse($result);
}

// Get user's story segments
function handleGetStory() {
    // Get token from authorization header
    $token = getAuthToken();
    
    if (!$token) {
        Utils::sendErrorResponse('Authentication required', 401);
        return;
    }
    
    // Validate token
    $user_id = Auth::validateSession($token);
    
    if (!$user_id) {
        Utils::sendErrorResponse('Invalid or expired token', 401);
        return;
    }
    
    // Get user details which includes story segments
    $user = Auth::getUserDetails($user_id);
    
    if (!$user) {
        Utils::sendErrorResponse('User not found', 404);
        return;
    }
    
    Utils::sendJsonResponse([
        'stories' => $user['unlocked_stories']
    ]);
}

// Mark user as ready for convergence
function handleConvergenceReady() {
    global $body;
    
    // Get token from authorization header
    $token = getAuthToken();
    
    if (!$token) {
        Utils::sendErrorResponse('Authentication required', 401);
        return;
    }
    
    // Validate token
    $user_id = Auth::validateSession($token);
    
    if (!$user_id) {
        Utils::sendErrorResponse('Invalid or expired token', 401);
        return;
    }
    
    // Get convergence ID from request
    $convergence_id = $body['convergence_id'] ?? null;
    
    if (!$convergence_id) {
        Utils::sendErrorResponse('Convergence ID is required', 400);
        return;
    }
    
    // Mark as ready
    $db = Database::getInstance();
    $sql = "INSERT INTO convergence_readiness (convergence_id, user_id, ready, ready_at) 
            VALUES (:convergence_id, :user_id, TRUE, NOW())
            ON DUPLICATE KEY UPDATE ready = TRUE, ready_at = NOW()";
    
    $result = $db->query($sql)
               ->bind(':convergence_id', $convergence_id)
               ->bind(':user_id', $user_id)
               ->execute();
    
    if (!$result) {
        Utils::sendErrorResponse('Failed to mark as ready', 500);
        return;
    }
    
    // Notify socketio server
    Utils::notifySocketServer('convergence_ready', [
        'user_id' => $user_id,
        'convergence_id' => $convergence_id
    ]);
    
    // Check if all users are ready
    $isAvailable = Game::isChallengeAvailable($user_id, $convergence_id);
    
    Utils::sendJsonResponse([
        'success' => true,
        'is_ready' => true,
        'all_ready' => $isAvailable
    ]);
}

// Get convergence status
function handleConvergenceStatus() {
    // Get token from authorization header
    $token = getAuthToken();
    
    if (!$token) {
        Utils::sendErrorResponse('Authentication required', 401);
        return;
    }
    
    // Validate token
    $user_id = Auth::validateSession($token);
    
    if (!$user_id) {
        Utils::sendErrorResponse('Invalid or expired token', 401);
        return;
    }
    
    // Get convergence ID from query parameter
    $convergence_id = $_GET['id'] ?? null;
    
    if (!$convergence_id) {
        Utils::sendErrorResponse('Convergence ID is required', 400);
        return;
    }
    
    // Get convergence challenge details
    $db = Database::getInstance();
    $challenge = $db->query("SELECT * FROM challenges WHERE id = :id")
                   ->bind(':id', $convergence_id)
                   ->single();
    
    if (!$challenge) {
        Utils::sendErrorResponse('Convergence not found', 404);
        return;
    }
    
    // Get all users in this convergence
    $group = $challenge['convergence_group'];
    $users = Game::getUsersInConvergenceGroup($group);
    
    // Get readiness status for each user
    $readiness = [];
    foreach ($users as $u) {
        $ready = $db->query("SELECT ready, ready_at FROM convergence_readiness WHERE convergence_id = :id AND user_id = :user_id")
                   ->bind(':id', $convergence_id)
                   ->bind(':user_id', $u)
                   ->single();
        
        $readiness[$u] = [
            'user_id' => $u,
            'ready' => $ready ? (bool)$ready['ready'] : false,
            'ready_at' => $ready ? $ready['ready_at'] : null
        ];
    }
    
    // Check if all users are ready
    $allReady = true;
    foreach ($readiness as $status) {
        if (!$status['ready']) {
            $allReady = false;
            break;
        }
    }
    
    Utils::sendJsonResponse([
        'convergence' => [
            'id' => $challenge['id'],
            'title' => $challenge['title'],
            'description' => $challenge['description'],
            'type' => $challenge['challenge_type'],
            'convergence_group' => $group
        ],
        'users' => $readiness,
        'all_ready' => $allReady
    ]);
}

// Handle logout
function handleLogout() {
    // Get token from authorization header
    $token = getAuthToken();
    
    if (!$token) {
        Utils::sendErrorResponse('Authentication required', 401);
        return;
    }
    
    // Validate token
    $user_id = Auth::validateSession($token);
    
    if (!$user_id) {
        Utils::sendErrorResponse('Invalid or expired token', 401);
        return;
    }
    
    // Log out user
    Auth::logout($user_id);
    
    Utils::sendJsonResponse([
        'success' => true,
        'message' => 'Logged out successfully'
    ]);
}

// Helper function to get auth token from headers
function getAuthToken() {
    $headers = getallheaders();
    $auth_header = $headers['Authorization'] ?? '';
    
    if (empty($auth_header)) {
        return null;
    }
    
    // Check for "Bearer" token format
    if (strpos($auth_header, 'Bearer ') === 0) {
        return substr($auth_header, 7);
    }
    
    return $auth_header;
}