<?php
/**
 * Challenge card component for Kingdom Hunt
 * 
 * @var array $challenge Challenge data
 */
if (!isset($challenge)) {
    return;
}

$isAvailable = $challenge['is_available'] ?? false;
$isConvergence = in_array($challenge['type'], ['convergence_minor', 'convergence_major']);
$cardClasses = 'card h-100 ' . ($isAvailable ? '' : 'bg-light text-muted');
$btnClasses = 'btn ' . ($isAvailable ? 'btn-primary' : 'btn-outline-secondary disabled');
?>
<div class="col">
    <div class="<?php echo $cardClasses; ?>">
        <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="card-title mb-0"><?php echo htmlspecialchars($challenge['title']); ?></h5>
            <?php if ($isConvergence): ?>
                <span class="badge bg-info">Convergence</span>
            <?php endif; ?>
        </div>
        <div class="card-body">
            <p class="card-text"><?php echo htmlspecialchars($challenge['description']); ?></p>
        </div>
        <div class="card-footer">
            <?php if (!$isAvailable): ?>
                <div class="text-center mb-2">
                    <span class="badge bg-warning text-dark">Not yet available</span>
                </div>
            <?php endif; ?>
            
            <a href="/?page=challenge&id=<?php echo $challenge['id']; ?>" class="<?php echo $btnClasses; ?>">
                <?php echo $isAvailable ? 'Start Challenge' : 'View Details'; ?>
            </a>
            
            <?php if ($isConvergence && isset($challenge['convergence_group'])): ?>
                <div class="text-muted mt-2 small">
                    Group: <?php echo htmlspecialchars($challenge['convergence_group']); ?>
                </div>
            <?php endif; ?>
        </div>
    </div>
</div>