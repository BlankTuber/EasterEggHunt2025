<?php
// Users section
$db = Database::getInstance();

// Get all users
$users = $db->query("SELECT * FROM users ORDER BY created_at DESC")->resultSet();

// Get all challenges for dropdown
$challenges = $db->query("SELECT id, title, challenge_code FROM challenges ORDER BY path, sequence_order")->resultSet();
?>

<div class="card mb-4">
    <div class="card-header d-flex justify-content-between align-items-center">
        <h3 class="card-title">Users</h3>
        <a href="?section=users&action=add" class="btn btn-success">Add New User</a>
    </div>
    <div class="card-body">
        <?php if ($action === 'add' || $action === 'edit'): ?>
            <!-- Add/Edit User Form -->
            <form method="post" action="?section=users">
                <input type="hidden" name="id" value="<?php echo $edit_data['id'] ?? ''; ?>">
                
                <div class="mb-3">
                    <label for="user_id" class="form-label">User ID</label>
                    <input type="text" class="form-control" id="user_id" name="user_id" value="<?php echo $edit_data['user_id'] ?? ''; ?>" required <?php echo $action === 'edit' ? 'readonly' : ''; ?>>
                    <div class="form-text">Unique identifier for this user</div>
                </div>
                
                <div class="mb-3">
                    <label for="name" class="form-label">Name</label>
                    <input type="text" class="form-control" id="name" name="name" value="<?php echo $edit_data['name'] ?? ''; ?>">
                </div>
                
                <div class="mb-3">
                    <label for="current_path" class="form-label">Current Path</label>
                    <select class="form-control" id="current_path" name="current_path" required>
                        <option value="intro" <?php echo (isset($edit_data['current_path']) && $edit_data['current_path'] === 'intro') ? 'selected' : ''; ?>>Intro</option>
                        <option value="path1" <?php echo (isset($edit_data['current_path']) && $edit_data['current_path'] === 'path1') ? 'selected' : ''; ?>>Path 1</option>
                        <option value="middle_convergence" <?php echo (isset($edit_data['current_path']) && $edit_data['current_path'] === 'middle_convergence') ? 'selected' : ''; ?>>Middle Convergence</option>
                        <option value="path2" <?php echo (isset($edit_data['current_path']) && $edit_data['current_path'] === 'path2') ? 'selected' : ''; ?>>Path 2</option>
                        <option value="final_convergence" <?php echo (isset($edit_data['current_path']) && $edit_data['current_path'] === 'final_convergence') ? 'selected' : ''; ?>>Final Convergence</option>
                        <option value="epilogue" <?php echo (isset($edit_data['current_path']) && $edit_data['current_path'] === 'epilogue') ? 'selected' : ''; ?>>Epilogue</option>
                    </select>
                </div>
                
                <div class="mb-3">
                    <label for="current_challenge" class="form-label">Current Challenge</label>
                    <select class="form-control" id="current_challenge" name="current_challenge">
                        <option value="">None</option>
                        <?php foreach ($challenges as $challenge): ?>
                        <option value="<?php echo $challenge['id']; ?>" <?php echo (isset($edit_data['current_challenge']) && $edit_data['current_challenge'] == $challenge['id']) ? 'selected' : ''; ?>>
                            <?php echo $challenge['title']; ?> (<?php echo $challenge['challenge_code']; ?>)
                        </option>
                        <?php endforeach; ?>
                    </select>
                </div>
                
                <button type="submit" name="save_user" class="btn btn-primary">Save User</button>
                <a href="?section=users" class="btn btn-secondary">Cancel</a>
            </form>
        <?php else: ?>
            <!-- User List -->
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>User ID</th>
                        <th>Name</th>
                        <th>Current Path</th>
                        <th>Current Challenge</th>
                        <th>Created</th>
                        <th>Last Active</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($users as $user): ?>
                    <tr>
                        <td><?php echo $user['id']; ?></td>
                        <td><?php echo $user['user_id']; ?></td>
                        <td><?php echo $user['name'] ?? 'Unnamed'; ?></td>
                        <td><?php echo $user['current_path']; ?></td>
                        <td>
                            <?php 
                            if ($user['current_challenge']) {
                                $challenge = $db->query("SELECT title FROM challenges WHERE id = :id")
                                               ->bind(':id', $user['current_challenge'])
                                               ->single();
                                echo $challenge ? $challenge['title'] : 'Unknown';
                            } else {
                                echo 'None';
                            }
                            ?>
                        </td>
                        <td><?php echo $user['created_at']; ?></td>
                        <td><?php echo $user['last_active']; ?></td>
                        <td>
                            <a href="?section=users&action=edit&id=<?php echo $user['id']; ?>" class="btn btn-sm btn-primary">Edit</a>
                            <a href="?section=users&action=view_progress&id=<?php echo $user['id']; ?>" class="btn btn-sm btn-info">Progress</a>
                            <a href="?section=users&action=delete&id=<?php echo $user['id']; ?>" class="btn btn-sm btn-danger" onclick="return confirm('Are you sure you want to delete this user? This will remove all their progress!')">Delete</a>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
        
        <?php if ($action === 'view_progress' && isset($_GET['id'])): ?>
            <?php
            // Get user details
            $user_details = $db->query("SELECT * FROM users WHERE id = :id")
                              ->bind(':id', $_GET['id'])
                              ->single();
            
            if ($user_details):
                // Get completed challenges
                $completed = $db->query("
                    SELECT cc.*, c.title, c.challenge_code, c.path 
                    FROM challenge_completions cc
                    JOIN challenges c ON cc.challenge_id = c.id
                    WHERE cc.user_id = :user_id
                    ORDER BY cc.completed_at
                ")
                ->bind(':user_id', $user_details['user_id'])
                ->resultSet();
                
                // Get unlocked story segments
                $stories = $db->query("
                    SELECT su.*, s.title, s.segment_code, s.path 
                    FROM story_unlocks su
                    JOIN story_segments s ON su.segment_id = s.id
                    WHERE su.user_id = :user_id
                    ORDER BY su.unlocked_at
                ")
                ->bind(':user_id', $user_details['user_id'])
                ->resultSet();
            ?>
            
            <div class="card mt-4">
                <div class="card-header">
                    <h4>Progress for User: <?php echo $user_details['user_id']; ?> <?php echo $user_details['name'] ? '(' . $user_details['name'] . ')' : ''; ?></h4>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <h5>Completed Challenges</h5>
                            <?php if (empty($completed)): ?>
                                <p>No challenges completed yet.</p>
                            <?php else: ?>
                                <table class="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>Challenge</th>
                                            <th>Path</th>
                                            <th>Completed At</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <?php foreach ($completed as $item): ?>
                                        <tr>
                                            <td><?php echo $item['title']; ?> (<?php echo $item['challenge_code']; ?>)</td>
                                            <td><?php echo $item['path']; ?></td>
                                            <td><?php echo $item['completed_at']; ?></td>
                                        </tr>
                                        <?php endforeach; ?>
                                    </tbody>
                                </table>
                            <?php endif; ?>
                        </div>
                        
                        <div class="col-md-6">
                            <h5>Unlocked Story Segments</h5>
                            <?php if (empty($stories)): ?>
                                <p>No story segments unlocked yet.</p>
                            <?php else: ?>
                                <table class="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>Segment</th>
                                            <th>Path</th>
                                            <th>Unlocked At</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <?php foreach ($stories as $item): ?>
                                        <tr>
                                            <td><?php echo $item['title']; ?> (<?php echo $item['segment_code']; ?>)</td>
                                            <td><?php echo $item['path']; ?></td>
                                            <td><?php echo $item['unlocked_at']; ?></td>
                                        </tr>
                                        <?php endforeach; ?>
                                    </tbody>
                                </table>
                            <?php endif; ?>
                        </div>
                    </div>
                    
                    <a href="?section=users" class="btn btn-secondary mt-3">Back to Users</a>
                </div>
            </div>
            <?php else: ?>
                <div class="alert alert-danger mt-4">User not found.</div>
                <a href="?section=users" class="btn btn-secondary">Back to Users</a>
            <?php endif; ?>
        <?php endif; ?>
    </div>
</div>