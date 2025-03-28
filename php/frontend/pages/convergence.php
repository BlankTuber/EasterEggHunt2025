<?php
/**
 * Convergence page for Kingdom Hunt
 */

// Require authentication
requireAuth();

// Get convergence ID from query parameter or current challenge
$convergenceId = $_GET['id'] ?? null;

// If no convergence ID provided, use current challenge if it's a convergence
if (!$convergenceId) {
    $currentChallenge = getCurrentChallenge();
    if ($currentChallenge && (
        $currentChallenge['type'] === 'convergence_minor' || 
        $currentChallenge['type'] === 'convergence_major'
    )) {
        $convergenceId = $currentChallenge['id'];
    }
}

// Get convergence details
$convergence = null;
$users = [];

if ($convergenceId) {
    // Fetch convergence details from API
    try {
        $response = file_get_contents(
            'http://' . $_SERVER['HTTP_HOST'] . '/api/convergence/status?id=' . $convergenceId,
            false,
            stream_context_create([
                'http' => [
                    'method' => 'GET',
                    'header' => "Authorization: " . $_SESSION['auth_token']
                ]
            ])
        );
        
        $result = json_decode($response, true);
        
        if ($result && isset($result['convergence'])) {
            $convergence = $result['convergence'];
            $users = $result['users'] ?? [];
            $allReady = $result['all_ready'] ?? false;
        }
    } catch (Exception $e) {
        // Set error message
        $alertMessage = 'An error occurred: ' . $e->getMessage();
        $alertType = 'danger';
    }
}

// Handle user marking themselves as ready
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['mark_ready']) && $convergenceId) {
    try {
        $response = file_get_contents(
            'http://' . $_SERVER['HTTP_HOST'] . '/api/convergence/ready',
            false,
            stream_context_create([
                'http' => [
                    'method' => 'POST',
                    'header' => "Content-type: application/json\r\nAuthorization: " . $_SESSION['auth_token'],
                    'content' => json_encode(['convergence_id' => $convergenceId])
                ]
            ])
        );
        
        $result = json_decode($response, true);
        
        if ($result && isset($result['success']) && $result['success']) {
            // Redirect to refresh the page
            header('Location: /?page=convergence&id=' . $convergenceId);
            exit;
        } else {
            // Set error message
            $alertMessage = $result['error'] ?? 'Failed to mark as ready';
            $alertType = 'danger';
        }
    } catch (Exception $e) {
        // Set error message
        $alertMessage = 'An error occurred: ' . $e->getMessage();
        $alertType = 'danger';
    }
}

// Set flag to include Socket.io
$useSocketIO = true;

// Set page title
$pageTitle = $convergence ? $convergence['title'] . ' - Convergence - Kingdom Hunt' : 'Convergence - Kingdom Hunt';
?>

<div class="convergence-container" id="convergence-container" data-convergence-id="<?php echo $convergenceId; ?>">
    <?php if (!$convergence): ?>
        <div class="alert alert-warning">
            <h2>No Convergence Challenge</h2>
            <p>There is no active convergence challenge at this time, or you don't have access to one.</p>
        </div>
        <a href="/?page=dashboard" class="btn btn-primary">Return to Dashboard</a>
    <?php else: ?>
        <h1><?php echo htmlspecialchars($convergence['title']); ?></h1>
        
        <div class="card mb-4">
            <div class="card-body">
                <p class="lead"><?php echo htmlspecialchars($convergence['description']); ?></p>
                
                <div class="alert alert-info">
                    <strong>Convergence Group:</strong> <?php echo htmlspecialchars($convergence['convergence_group']); ?>
                </div>
                
                <div class="card mb-4">
                    <div class="card-header">
                        <h2 class="h5 mb-0">Players Status</h2>
                    </div>
                    <div class="card-body">
                        <div class="convergence-status">
                            <?php if (empty($users)): ?>
                                <div class="alert alert-warning">No users found for this convergence.</div>
                            <?php else: ?>
                                <?php foreach ($users as $userId => $status): ?>
                                    <div class="user-status <?php echo $status['ready'] ? 'ready' : ''; ?>" data-user-id="<?php echo htmlspecialchars($userId); ?>">
                                        <div class="status-indicator <?php echo $status['ready'] ? 'ready' : ''; ?>"></div>
                                        <div>
                                            <div><?php echo htmlspecialchars($userId); ?></div>
                                            <div class="small text-muted">
                                                <?php 
                                                if ($status['ready']) {
                                                    echo 'Ready since ' . date('g:i a', strtotime($status['ready_at']));
                                                } else {
                                                    echo 'Not ready';
                                                }
                                                ?>
                                            </div>
                                        </div>
                                    </div>
                                <?php endforeach; ?>
                            <?php endif; ?>
                        </div>
                        
                        <div class="mt-4">
                            <?php if ($allReady): ?>
                                <div class="alert alert-success">
                                    <strong>All players are ready!</strong> The challenge is now available.
                                </div>
                                
                                <a href="/?page=challenge&id=<?php echo $convergenceId; ?>" class="btn btn-primary">
                                    Start Challenge
                                </a>
                            <?php else: ?>
                                <?php 
                                // Check if current user is ready
                                $currentUserReady = false;
                                if (isset($users[$userData['user_id']])) {
                                    $currentUserReady = $users[$userData['user_id']]['ready'];
                                }
                                ?>
                                
                                <?php if ($currentUserReady): ?>
                                    <div class="alert alert-info">
                                        You are ready. Waiting for other players...
                                    </div>
                                <?php else: ?>
                                    <form method="post" action="">
                                        <button type="submit" name="mark_ready" class="btn btn-primary">
                                            Mark Me as Ready
                                        </button>
                                    </form>
                                <?php endif; ?>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="text-end">
            <a href="/?page=dashboard" class="btn btn-outline-secondary">Return to Dashboard</a>
        </div>
    <?php endif; ?>
</div>