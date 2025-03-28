<?php
/**
 * Introduction page for Kingdom Hunt
 * This is the entry point for users with a link
 */

// Check if user is already logged in
if (isset($userData)) {
    // Redirect to dashboard
    header('Location: /?page=dashboard');
    exit;
}

// Get user ID from query parameter
$userId = $_GET['who'] ?? '';

// Handle form submission for intro completion
if ($_SERVER['REQUEST_METHOD'] === 'POST' && !empty($userId)) {
    try {
        // Call API to handle intro completion
        $response = file_get_contents(
            'http://' . $_SERVER['HTTP_HOST'] . '/api/intro/complete',
            false,
            stream_context_create([
                'http' => [
                    'method' => 'POST',
                    'header' => "Content-type: application/json\r\nAuthorization: " . $_SESSION['auth_token'],
                    'content' => json_encode(['user_id' => $userId])
                ]
            ])
        );
        
        $result = json_decode($response, true);
        
        if ($result && isset($result['success']) && $result['success']) {
            // Set success message
            $alertMessage = $result['message']['message'] ?? 'Introduction completed successfully!';
            $alertType = 'success';
            
            // Redirect to dashboard
            header('Location: /?page=dashboard');
            exit;
        } else {
            // Set error message
            $alertMessage = $result['error'] ?? 'Failed to complete introduction';
            $alertType = 'danger';
        }
    } catch (Exception $e) {
        // Set error message
        $alertMessage = 'An error occurred: ' . $e->getMessage();
        $alertType = 'danger';
    }
}

// If no user ID provided, show error
if (empty($userId)) {
    $alertMessage = 'No user ID provided';
    $alertType = 'danger';
}
?>

<div class="intro-container">
    <h1 class="text-center mb-4">Welcome to the Kingdom of Neerbye</h1>
    
    <?php if (!empty($userId)): ?>
        <div class="text-center mb-4">
            <img src="/frontend/assets/img/logo.png" alt="Kingdom Hunt" class="img-fluid" style="max-width: 150px;">
        </div>
        
        <div class="card mb-4">
            <div class="card-body">
                <h5 class="card-title">The Call to Adventure</h5>
                <p class="card-text">
                    The ancient kingdom of Neerbye had long been at peace, its five provinces prospering under the watchful eyes of their guardians. But as the vernal equinox approached, strange energies began to stir. The ancient Egg of Creation, said to contain the power to renew or destroy the realm, had fractured into five pieces, each scattering to a different province.
                </p>
                <p class="card-text">
                    The Council of Elders gathered in the Grand Hall of Harmony, their faces grave beneath the flickering torch light. "We must summon the five champions," declared the First Elder, her voice echoing against the stone walls. "Only they possess the unique talents to recover the fragments before the equinox sun reaches its zenith."
                </p>
            </div>
        </div>
        
        <div class="alert alert-info">
            <strong>User ID:</strong> <?php echo htmlspecialchars($userId); ?>
        </div>
        
        <form method="post" action="">
            <p class="text-center">Click the button below to begin your adventure:</p>
            <div class="d-grid">
                <button type="submit" class="btn btn-primary btn-lg">
                    Begin the Journey
                </button>
            </div>
        </form>
    <?php else: ?>
        <div class="alert alert-danger">
            <strong>Error:</strong> No user ID provided.
        </div>
        <p class="text-center">
            Please use the link provided to you to access this adventure.
        </p>
    <?php endif; ?>
</div>