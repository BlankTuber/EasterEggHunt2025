<?php
/**
 * Story page for Kingdom Hunt
 */

// Require authentication
requireAuth();

// Get story ID from query parameter
$storyId = $_GET['id'] ?? null;

// Get all unlocked stories
$unlockedStories = $userData['unlocked_stories'] ?? [];

// Selected story segment
$selectedStory = null;

if ($storyId) {
    // Find the story by ID
    foreach ($unlockedStories as $story) {
        if (($story['segment_id'] ?? $story['id']) == $storyId) {
            $selectedStory = $story;
            break;
        }
    }
} elseif (!empty($unlockedStories)) {
    // If no ID provided, use the first story
    $selectedStory = $unlockedStories[0];
}

// Set page title
$pageTitle = $selectedStory ? $selectedStory['title'] . ' - Kingdom Hunt' : 'Story - Kingdom Hunt';

// Parse Markdown content (simple implementation)
function parseMarkdown($text) {
    // Convert headers
    $text = preg_replace('/^### (.*?)$/m', '<h3>$1</h3>', $text);
    $text = preg_replace('/^## (.*?)$/m', '<h2>$1</h2>', $text);
    $text = preg_replace('/^# (.*?)$/m', '<h1>$1</h1>', $text);
    
    // Convert bold and italic
    $text = preg_replace('/\*\*(.*?)\*\*/m', '<strong>$1</strong>', $text);
    $text = preg_replace('/\*(.*?)\*/m', '<em>$1</em>', $text);
    
    // Convert paragraphs (simple)
    $paragraphs = explode("\n\n", $text);
    $result = '';
    
    foreach ($paragraphs as $paragraph) {
        if (!empty(trim($paragraph))) {
            // Check if already starts with HTML tag
            if (!preg_match('/^<[a-z]/', trim($paragraph))) {
                $result .= '<p>' . $paragraph . '</p>';
            } else {
                $result .= $paragraph;
            }
        }
    }
    
    return $result;
}
?>

<div class="story-container">
    <div class="row">
        <div class="col-md-3">
            <div class="list-group mb-4">
                <div class="list-group-item list-group-item-dark">
                    <h5 class="mb-0">Story Segments</h5>
                </div>
                
                <?php if (empty($unlockedStories)): ?>
                    <div class="list-group-item">
                        <p class="text-muted mb-0">No story segments unlocked yet.</p>
                    </div>
                <?php else: ?>
                    <?php foreach ($unlockedStories as $story): ?>
                        <?php 
                        $storyItemId = $story['segment_id'] ?? $story['id'];
                        $isActive = $selectedStory && ($selectedStory['segment_id'] ?? $selectedStory['id']) == $storyItemId;
                        ?>
                        <a href="/?page=story&id=<?php echo $storyItemId; ?>" class="list-group-item list-group-item-action <?php echo $isActive ? 'active' : ''; ?>">
                            <?php echo htmlspecialchars($story['title']); ?>
                        </a>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
            
            <a href="/?page=dashboard" class="btn btn-outline-secondary">Return to Dashboard</a>
        </div>
        
        <div class="col-md-9">
            <?php if ($selectedStory): ?>
                <div class="card">
                    <div class="card-header">
                        <h1 class="h3 mb-0"><?php echo htmlspecialchars($selectedStory['title']); ?></h1>
                    </div>
                    <div class="card-body">
                        <div class="story-content">
                            <?php echo parseMarkdown($selectedStory['content']); ?>
                        </div>
                    </div>
                    <div class="card-footer text-muted">
                        Unlocked: <?php echo date('F j, Y', strtotime($selectedStory['unlocked_at'])); ?>
                    </div>
                </div>
            <?php else: ?>
                <div class="alert alert-info">
                    <?php if (empty($unlockedStories)): ?>
                        <p>You haven't unlocked any story segments yet. Complete challenges to reveal the story!</p>
                    <?php else: ?>
                        <p>Select a story segment from the list to read it.</p>
                    <?php endif; ?>
                </div>
            <?php endif; ?>
        </div>
    </div>
</div>