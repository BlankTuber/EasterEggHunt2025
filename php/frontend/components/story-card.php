<?php
/**
 * Story card component for Kingdom Hunt
 * 
 * @var array $story Story segment data
 */
if (!isset($story)) {
    return;
}
?>
<div class="col">
    <div class="card h-100">
        <div class="card-header">
            <h5 class="card-title mb-0"><?php echo htmlspecialchars($story['title']); ?></h5>
        </div>
        <div class="card-body">
            <p class="card-text story-preview">
                <?php 
                // Show a preview of the content (first 150 characters)
                $preview = strip_tags($story['content']);
                echo htmlspecialchars(substr($preview, 0, 150)) . (strlen($preview) > 150 ? '...' : '');
                ?>
            </p>
        </div>
        <div class="card-footer">
            <a href="/?page=story&id=<?php echo $story['segment_id'] ?? $story['id']; ?>" class="btn btn-primary">
                Read Story
            </a>
            <div class="text-muted mt-2 small">
                Unlocked: <?php echo date('M j, Y', strtotime($story['unlocked_at'])); ?>
            </div>
        </div>
    </div>
</div>