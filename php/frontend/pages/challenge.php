<?php
/**
 * Challenge page for Kingdom Hunt
 */

// Require authentication
requireAuth();

// Get challenge ID from query parameter
$challengeId = $_GET['id'] ?? null;

// If no challenge ID provided, use current challenge
if (!$challengeId) {
    $currentChallenge = getCurrentChallenge();
    if ($currentChallenge) {
        $challengeId = $currentChallenge['id'];
    }
}

// Get challenge details
$challenge = null;
if ($challengeId) {
    // Check if we already have current challenge with this ID
    if (isset($currentChallenge) && $currentChallenge['id'] == $challengeId) {
        $challenge = $currentChallenge;
    } else {
        // Fetch challenge details from API
        try {
            $response = file_get_contents(
                'http://' . $_SERVER['HTTP_HOST'] . '/api/challenge/current?id=' . $challengeId,
                false,
                stream_context_create([
                    'http' => [
                        'method' => 'GET',
                        'header' => "Authorization: " . $_SESSION['auth_token']
                    ]
                ])
            );
            
            $result = json_decode($response, true);
            
            if ($result && isset($result['challenge'])) {
                $challenge = $result['challenge'];
            }
        } catch (Exception $e) {
            // Set error message
            $alertMessage = 'An error occurred: ' . $e->getMessage();
            $alertType = 'danger';
        }
    }
}

// Set flag to include Socket.io
$useSocketIO = true;

// Get challenge type and code
$challengeType = $challenge['type'] ?? '';
$challengeCode = $challenge['challenge_code'] ?? '';

// Convert type to a normalized code for Socket.io
$socketChallengeCode = '';
if (!empty($challengeCode)) {
    $socketChallengeCode = $challengeCode;
} else {
    switch ($challengeType) {
        case 'convergence_minor':
        case 'convergence_major':
            if (strpos($challenge['convergence_group'], 'navigator_craftsman') !== false) {
                $socketChallengeCode = 'geocaching';
            } elseif (strpos($challenge['convergence_group'], 'craftsman_apprentice') !== false) {
                $socketChallengeCode = 'cross_device_puzzle';
            } elseif (strpos($challenge['convergence_group'], 'sage_chronicler_apprentice') !== false) {
                $socketChallengeCode = 'trivia_group_a';
            } else {
                $socketChallengeCode = 'sequence_puzzle';
            }
            break;
        default:
            $socketChallengeCode = 'intro_challenge';
    }
}

// Set extra scripts based on challenge type
$extraScripts = [];

// Add challenge-specific script if needed
if (!empty($socketChallengeCode)) {
    $extraScripts[] = "/frontend/assets/js/challenges/{$socketChallengeCode}.js";
}

// Set page title
$pageTitle = $challenge ? $challenge['title'] . ' - Kingdom Hunt' : 'Challenge - Kingdom Hunt';
?>

<div id="challenge-container" 
     data-challenge-id="<?php echo $challengeId; ?>" 
     data-challenge-code="<?php echo htmlspecialchars($socketChallengeCode); ?>">
    
    <?php if (!$challenge): ?>
        <div class="alert alert-danger">
            Challenge not found or you don't have access to it.
        </div>
        <a href="/?page=dashboard" class="btn btn-primary">Return to Dashboard</a>
    <?php else: ?>
        <h1><?php echo htmlspecialchars($challenge['title']); ?></h1>
        
        <div class="card mb-4">
            <div class="card-body">
                <p class="lead"><?php echo htmlspecialchars($challenge['description']); ?></p>
                
                <?php if ($challengeType === 'convergence_minor' || $challengeType === 'convergence_major'): ?>
                    <div class="alert alert-info">
                        <strong>Convergence Challenge:</strong> This challenge requires coordination with other players.
                    </div>
                    
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5 class="card-title mb-0">Players Status</h5>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <strong>Group:</strong> <?php echo htmlspecialchars($challenge['convergence_group']); ?>
                            </div>
                            
                            <div class="mb-3">
                                <strong>Status:</strong> <span id="challenge-state"><?php echo $challenge['is_available'] ? 'Ready' : 'Waiting'; ?></span>
                            </div>
                            
                            <div id="room-users" class="convergence-status">
                                <!-- Player status will be loaded via Socket.io -->
                                <div class="alert alert-info">
                                    Connecting to server...
                                </div>
                            </div>
                            
                            <?php if (!$challenge['is_available']): ?>
                                <button id="convergence-ready" class="btn btn-primary" data-convergence-id="<?php echo $challengeId; ?>">
                                    I'm Ready
                                </button>
                            <?php endif; ?>
                        </div>
                    </div>
                    
                    <?php if ($challenge['is_available']): ?>
                        <div class="challenge-interface">
                            <h3>Challenge Interface</h3>
                            <div id="convergence-challenge">
                                <!-- Challenge interface will be loaded here -->
                                <p>Loading challenge interface...</p>
                            </div>
                            
                            <div class="mt-4">
                                <button id="complete-challenge" class="btn btn-success" data-challenge-id="<?php echo $challengeId; ?>">
                                    Complete Challenge
                                </button>
                            </div>
                        </div>
                    <?php endif; ?>
                <?php else: ?>
                    <!-- Individual challenge -->
                    <div class="challenge-interface">
                        <h3>Challenge Interface</h3>
                        <div id="individual-challenge">
                            <!-- Challenge interface will be loaded here -->
                            <p>This is a placeholder for the challenge interface. In a real implementation, this would contain interactive elements specific to the challenge type.</p>
                            
                            <div class="alert alert-warning">
                                <strong>Note:</strong> This is a simplified interface for demonstration purposes.
                            </div>
                        </div>
                        
                        <div class="mt-4">
                            <button id="complete-challenge" class="btn btn-success" data-challenge-id="<?php echo $challengeId; ?>">
                                Complete Challenge
                            </button>
                        </div>
                    </div>
                <?php endif; ?>
            </div>
        </div>
        
        <div class="text-end">
            <a href="/?page=dashboard" class="btn btn-outline-secondary">Return to Dashboard</a>
        </div>
    <?php endif; ?>
</div>