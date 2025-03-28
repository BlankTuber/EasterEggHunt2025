<?php
/**
 * Dashboard page for Kingdom Hunt
 */

// Require authentication
requireAuth();

// Get current challenge
$currentChallenge = getCurrentChallenge();

// Get user's unlocked stories
$unlockedStories = $userData['unlocked_stories'] ?? [];

// Get user's completed challenges
$completedChallenges = $userData['completed_challenges'] ?? [];
?>

<div class="dashboard-container">
    <div class="row mb-4">
        <div class="col-md-8">
            <h1>Welcome, <?php echo htmlspecialchars($userData['name'] ?? $userData['user_id']); ?></h1>
            <p class="lead">
                Current Path: <span class="badge bg-info"><?php echo ucfirst($userData['current_path'] ?? 'Intro'); ?></span>
            </p>
        </div>
        <div class="col-md-4 text-md-end">
            <div class="d-inline-block text-start">
                <div class="text-muted mb-1">Progress</div>
                <div class="progress">
                    <?php
                    // Calculate progress percentage based on completed challenges
                    $totalChallenges = 10; // This should be fetched from a real count
                    $completedCount = count($completedChallenges);
                    $progressPercent = round(($completedCount / $totalChallenges) * 100);
                    ?>
                    <div class="progress-bar bg-success" role="progressbar" style="width: <?php echo $progressPercent; ?>%"
                         aria-valuenow="<?php echo $progressPercent; ?>" aria-valuemin="0" aria-valuemax="100">
                        <?php echo $progressPercent; ?>%
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="row mb-4">
        <div class="col-12">
            <div class="card">
                <div class="card-header bg-primary text-white">
                    <h2 class="h5 card-title mb-0">Current Challenge</h2>
                </div>
                <div class="card-body">
                    <?php if ($currentChallenge): ?>
                        <h3 class="h5"><?php echo htmlspecialchars($currentChallenge['title']); ?></h3>
                        <p><?php echo htmlspecialchars($currentChallenge['description']); ?></p>
                        
                        <?php if (isset($currentChallenge['is_available']) && !$currentChallenge['is_available']): ?>
                            <div class="alert alert-warning">
                                This challenge is not yet available. It requires coordination with other players.
                            </div>
                        <?php endif; ?>
                        
                        <a href="/?page=challenge&id=<?php echo $currentChallenge['id']; ?>" class="btn btn-primary">
                            Go to Challenge
                        </a>
                    <?php else: ?>
                        <p>No active challenge found. Please contact your game master.</p>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>
    
    <div class="row mb-4">
        <div class="col-12">
            <h2 class="h4 mb-3">Your Story Segments</h2>
            
            <?php if (empty($unlockedStories)): ?>
                <div class="alert alert-info">
                    You haven't unlocked any story segments yet. Complete challenges to reveal the story!
                </div>
            <?php else: ?>
                <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                    <?php foreach ($unlockedStories as $story): ?>
                        <?php include FRONTEND_PATH . '/components/story-card.php'; ?>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </div>
    </div>
    
    <div class="row">
        <div class="col-12">
            <h2 class="h4 mb-3">Completed Challenges</h2>
            
            <?php if (empty($completedChallenges)): ?>
                <div class="alert alert-info">
                    You haven't completed any challenges yet. Begin your journey by completing your current challenge!
                </div>
            <?php else: ?>
                <div class="list-group">
                    <?php foreach ($completedChallenges as $challenge): ?>
                        <div class="list-group-item list-group-item-action">
                            <div class="d-flex w-100 justify-content-between">
                                <h5 class="mb-1">
                                    <?php echo htmlspecialchars($challenge['challenge_code']); ?>
                                </h5>
                                <small>
                                    Completed: <?php echo date('M j, Y', strtotime($challenge['completed_at'])); ?>
                                </small>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </div>
    </div>
</div>