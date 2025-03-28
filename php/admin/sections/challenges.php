<?php
// Challenges section
$db = Database::getInstance();

// Get all challenges
$challenges = $db->query("SELECT * FROM challenges ORDER BY path, sequence_order")->resultSet();
?>

<div class="card mb-4">
    <div class="card-header d-flex justify-content-between align-items-center">
        <h3 class="card-title">Challenges</h3>
        <a href="?section=challenges&action=add" class="btn btn-success">Add New Challenge</a>
    </div>
    <div class="card-body">
        <?php if ($action === 'add' || $action === 'edit'): ?>
            <!-- Add/Edit Challenge Form -->
            <form method="post" action="?section=challenges">
                <input type="hidden" name="id" value="<?php echo $edit_data['id'] ?? ''; ?>">
                
                <div class="mb-3">
                    <label for="challenge_code" class="form-label">Challenge Code</label>
                    <input type="text" class="form-control" id="challenge_code" name="challenge_code" value="<?php echo $edit_data['challenge_code'] ?? ''; ?>" required>
                    <div class="form-text">Unique code for identifying this challenge (e.g., navigator_pong)</div>
                </div>
                
                <div class="mb-3">
                    <label for="title" class="form-label">Title</label>
                    <input type="text" class="form-control" id="title" name="title" value="<?php echo $edit_data['title'] ?? ''; ?>" required>
                </div>
                
                <div class="mb-3">
                    <label for="description" class="form-label">Description</label>
                    <textarea class="form-control" id="description" name="description" rows="4"><?php echo $edit_data['description'] ?? ''; ?></textarea>
                </div>
                
                <div class="mb-3">
                    <label for="path" class="form-label">Path</label>
                    <select class="form-control" id="path" name="path" required>
                        <option value="">Select path</option>
                        <option value="intro" <?php echo (isset($edit_data['path']) && $edit_data['path'] === 'intro') ? 'selected' : ''; ?>>Intro</option>
                        <option value="path1" <?php echo (isset($edit_data['path']) && $edit_data['path'] === 'path1') ? 'selected' : ''; ?>>Path 1</option>
                        <option value="middle_convergence" <?php echo (isset($edit_data['path']) && $edit_data['path'] === 'middle_convergence') ? 'selected' : ''; ?>>Middle Convergence</option>
                        <option value="path2" <?php echo (isset($edit_data['path']) && $edit_data['path'] === 'path2') ? 'selected' : ''; ?>>Path 2</option>
                        <option value="final_convergence" <?php echo (isset($edit_data['path']) && $edit_data['path'] === 'final_convergence') ? 'selected' : ''; ?>>Final Convergence</option>
                        <option value="epilogue" <?php echo (isset($edit_data['path']) && $edit_data['path'] === 'epilogue') ? 'selected' : ''; ?>>Epilogue</option>
                    </select>
                </div>
                
                <div class="mb-3">
                    <label for="sequence_order" class="form-label">Sequence Order</label>
                    <input type="number" class="form-control" id="sequence_order" name="sequence_order" value="<?php echo $edit_data['sequence_order'] ?? '0'; ?>" required>
                    <div class="form-text">Order within the path (lower numbers come first)</div>
                </div>
                
                <div class="mb-3">
                    <label for="challenge_type" class="form-label">Challenge Type</label>
                    <select class="form-control" id="challenge_type" name="challenge_type" required>
                        <option value="">Select type</option>
                        <option value="individual" <?php echo (isset($edit_data['challenge_type']) && $edit_data['challenge_type'] === 'individual') ? 'selected' : ''; ?>>Individual</option>
                        <option value="convergence_minor" <?php echo (isset($edit_data['challenge_type']) && $edit_data['challenge_type'] === 'convergence_minor') ? 'selected' : ''; ?>>Minor Convergence</option>
                        <option value="convergence_major" <?php echo (isset($edit_data['challenge_type']) && $edit_data['challenge_type'] === 'convergence_major') ? 'selected' : ''; ?>>Major Convergence</option>
                    </select>
                </div>
                
                <div class="mb-3">
                    <label for="convergence_group" class="form-label">Convergence Group</label>
                    <input type="text" class="form-control" id="convergence_group" name="convergence_group" value="<?php echo $edit_data['convergence_group'] ?? ''; ?>">
                    <div class="form-text">For convergences, which group is involved (e.g., navigator_craftsman)</div>
                </div>
                
                <div class="mb-3">
                    <label for="unlock_condition" class="form-label">Unlock Condition</label>
                    <textarea class="form-control" id="unlock_condition" name="unlock_condition" rows="3"><?php echo $edit_data['unlock_condition'] ?? ''; ?></textarea>
                    <div class="form-text">JSON encoded condition (e.g., {"requires_challenge":["navigator_pong", "craftsman_morse"]})</div>
                </div>
                
                <button type="submit" name="save_challenge" class="btn btn-primary">Save Challenge</button>
                <a href="?section=challenges" class="btn btn-secondary">Cancel</a>
            </form>
        <?php else: ?>
            <!-- Challenge List -->
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Code</th>
                        <th>Title</th>
                        <th>Path</th>
                        <th>Order</th>
                        <th>Type</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($challenges as $challenge): ?>
                    <tr>
                        <td><?php echo $challenge['id']; ?></td>
                        <td><?php echo $challenge['challenge_code']; ?></td>
                        <td><?php echo $challenge['title']; ?></td>
                        <td><?php echo $challenge['path']; ?></td>
                        <td><?php echo $challenge['sequence_order']; ?></td>
                        <td><?php echo $challenge['challenge_type']; ?></td>
                        <td>
                            <a href="?section=challenges&action=edit&id=<?php echo $challenge['id']; ?>" class="btn btn-sm btn-primary">Edit</a>
                            <a href="?section=challenges&action=delete&id=<?php echo $challenge['id']; ?>" class="btn btn-sm btn-danger" onclick="return confirm('Are you sure you want to delete this challenge?')">Delete</a>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>
</div>