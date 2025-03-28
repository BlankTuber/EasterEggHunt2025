<?php
/**
 * Main entry point for Kingdom Hunt
 * 
 * This file handles routing and renders the appropriate frontend page.
 */

// Load backend initialization
require_once 'includes/init.php';

// Load frontend initialization
require_once 'frontend/init.php';

// Get requested page
$page = $_GET['page'] ?? 'home';

// Add current user ID to page metadata if authenticated
$metaTags = '';
if (isset($userData) && isset($userData['user_id'])) {
    $metaTags .= '<meta name="user-id" content="' . htmlspecialchars($userData['user_id']) . '">';
}

// Set extra scripts based on page
$extraScripts = [];

// Handle challenges that need specific scripts
if ($page === 'challenge') {
    $challengeId = $_GET['id'] ?? null;
    
    if ($challengeId) {
        // Get challenge details to determine the correct script
        $challenge = null;
        
        try {
            $db = Database::getInstance();
            $challenge = $db->query("SELECT * FROM challenges WHERE id = :id")
                          ->bind(':id', $challengeId)
                          ->single();
        } catch (Exception $e) {
            // Error getting challenge details
        }
        
        if ($challenge) {
            // Add challenge loader script
            $extraScripts[] = '/frontend/assets/js/challenge-loader.js';
        }
    }
}

// Handle different pages
switch ($page) {
    case 'intro':
        // Introduction page (entry point for new users)
        renderPage('intro', [
            'extraScripts' => $extraScripts,
            'metaTags' => $metaTags
        ]);
        break;
        
    case 'dashboard':
        // Main dashboard (requires authentication)
        requireAuth();
        renderPage('dashboard', [
            'extraScripts' => $extraScripts,
            'metaTags' => $metaTags
        ]);
        break;
        
    case 'challenge':
        // Challenge page (requires authentication)
        requireAuth();
        
        // Set Socket.io flag if it's a challenge page
        $useSocketIO = true;
        
        renderPage('challenge', [
            'extraScripts' => $extraScripts,
            'useSocketIO' => $useSocketIO,
            'metaTags' => $metaTags
        ]);
        break;
        
    case 'story':
        // Story page (requires authentication)
        requireAuth();
        renderPage('story', [
            'extraScripts' => $extraScripts,
            'metaTags' => $metaTags
        ]);
        break;
        
    case 'convergence':
        // Convergence page (requires authentication)
        requireAuth();
        
        // Set Socket.io flag for convergence
        $useSocketIO = true;
        
        renderPage('convergence', [
            'extraScripts' => $extraScripts,
            'useSocketIO' => $useSocketIO,
            'metaTags' => $metaTags
        ]);
        break;
        
    case 'home':
    default:
        // Home page - redirect to dashboard if logged in, otherwise show intro
        if (isset($userData)) {
            header('Location: /?page=dashboard');
            exit;
        } else {
            renderPage('intro', [
                'extraScripts' => $extraScripts,
                'metaTags' => $metaTags
            ]);
        }
        break;
}