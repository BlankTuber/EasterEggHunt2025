<?php
// Story Segments section
$db = Database::getInstance();

// Get all story segments
$segments = $db->query("SELECT * FROM story_segments ORDER BY path, sequence_order")->resultSet();
?>

<div class="card mb-4">
    <div class="card-header d-flex justify-content-between align-items-center">
        <h3 class="card-title">Story Segments</h3>
        <a href="?section=story&action=add" class="btn btn-success">Add New Segment</a>
    </div>
    <div class="card-body">
        <?php if ($action === 'add' || $action === 'edit'): ?>
            <!-- Add/Edit Story Segment Form -->
            <form method="post" action="?section=story">
                <input type="hidden" name="id" value="<?php echo $edit_data['id'] ?? ''; ?>">
                
                <div class="mb-3">
                    <label for="segment_code" class="form-label">Segment Code</label>
                    <input type="text" class="form-control" id="segment_code" name="segment_code" value="<?php echo $edit_data['segment_code'] ?? ''; ?>" required>
                    <div class="form-text">Unique code for identifying this segment (e.g., navigator_intro)</div>
                </div>
                
                <div class="mb-3">
                    <label for="title" class="form-label">Title</label>
                    <input type="text" class="form-control" id="title" name="title" value="<?php echo $edit_data['title'] ?? ''; ?>" required>
                </div>
                
                <div class="mb-3">
                    <label for="content" class="form-label">Content</label>
                    <textarea class="form-control" id="content" name="content" rows="10"><?php echo $edit_data['content'] ?? ''; ?></textarea>
                    <div class="form-text">Markdown format supported</div>
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
                    <label for="unlock_condition" class="form-label">Unlock Condition</label>
                    <textarea class="form-control" id="unlock_condition" name="unlock_condition" rows="3"><?php echo $edit_data['unlock_condition'] ?? ''; ?></textarea>
                    <div class="form-text">JSON encoded condition (e.g., {"requires_challenge":"navigator_pong"})</div>
                </div>
                
                <button type="submit" name="save_story" class="btn btn-primary">Save Segment</button>
                <a href="?section=story" class="btn btn-secondary">Cancel</a>
            </form>
        <?php else: ?>
            <!-- Story Segment List -->
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Code</th>
                        <th>Title</th>
                        <th>Path</th>
                        <th>Order</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($segments as $segment): ?>
                    <tr>
                        <td><?php echo $segment['id']; ?></td>
                        <td><?php echo $segment['segment_code']; ?></td>
                        <td><?php echo $segment['title']; ?></td>
                        <td><?php echo $segment['path']; ?></td>
                        <td><?php echo $segment['sequence_order']; ?></td>
                        <td>
                            <a href="?section=story&action=edit&id=<?php echo $segment['id']; ?>" class="btn btn-sm btn-primary">Edit</a>
                            <a href="?section=story&action=delete&id=<?php echo $segment['id']; ?>" class="btn btn-sm btn-danger" onclick="return confirm('Are you sure you want to delete this story segment?')">Delete</a>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>
</div>