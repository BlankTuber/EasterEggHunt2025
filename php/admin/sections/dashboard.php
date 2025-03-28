<?php
// Dashboard section
$db = Database::getInstance();

// Get counts
$user_count = $db->query("SELECT COUNT(*) as count FROM users")->single()['count'];
$challenge_count = $db->query("SELECT COUNT(*) as count FROM challenges")->single()['count'];
$story_count = $db->query("SELECT COUNT(*) as count FROM story_segments")->single()['count'];
$completed_challenges = $db->query("SELECT COUNT(*) as count FROM challenge_completions")->single()['count'];

// Get recent activity
$recent_users = $db->query("SELECT * FROM users ORDER BY last_active DESC LIMIT 5")->resultSet();
$recent_completions = $db->query("
    SELECT cc.*, u.user_id, c.title as challenge_title 
    FROM challenge_completions cc
    JOIN users u ON cc.user_id = u.user_id
    JOIN challenges c ON cc.challenge_id = c.id
    ORDER BY cc.completed_at DESC 
    LIMIT 10
")->resultSet();
?>

<div class="card mb-4">
    <div class="card-header">
        <h3 class="card-title">Dashboard</h3>
    </div>
    <div class="card-body">
        <div class="row">
            <div class="col-md-3 mb-4">
                <div class="card bg-primary text-white">
                    <div class="card-body">
                        <h5 class="card-title">Users</h5>
                        <p class="card-text display-4"><?php echo $user_count; ?></p>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-4">
                <div class="card bg-success text-white">
                    <div class="card-body">
                        <h5 class="card-title">Challenges</h5>
                        <p class="card-text display-4"><?php echo $challenge_count; ?></p>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-4">
                <div class="card bg-info text-white">
                    <div class="card-body">
                        <h5 class="card-title">Story Segments</h5>
                        <p class="card-text display-4"><?php echo $story_count; ?></p>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-4">
                <div class="card bg-warning text-dark">
                    <div class="card-body">
                        <h5 class="card-title">Completed Challenges</h5>
                        <p class="card-text display-4"><?php echo $completed_challenges; ?></p>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row">
            <div class="col-md-6">
                <h4>Recent Active Users</h4>
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>User ID</th>
                            <th>Name</th>
                            <th>Current Path</th>
                            <th>Last Active</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($recent_users as $user): ?>
                        <tr>
                            <td><?php echo $user['user_id']; ?></td>
                            <td><?php echo $user['name'] ?? 'Unnamed'; ?></td>
                            <td><?php echo $user['current_path']; ?></td>
                            <td><?php echo $user['last_active']; ?></td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
            
            <div class="col-md-6">
                <h4>Recent Challenge Completions</h4>
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>User ID</th>
                            <th>Challenge</th>
                            <th>Completed At</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($recent_completions as $completion): ?>
                        <tr>
                            <td><?php echo $completion['user_id']; ?></td>
                            <td><?php echo $completion['challenge_title']; ?></td>
                            <td><?php echo $completion['completed_at']; ?></td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>