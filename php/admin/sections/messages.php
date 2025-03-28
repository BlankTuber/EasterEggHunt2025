<?php
// Unlock Messages section
$db = Database::getInstance();

// Get all unlock messages
$messages = $db->query("SELECT * FROM unlock_messages ORDER BY message_code")->resultSet();
?>

<div class="card mb-4">
    <div class="card-header d-flex justify-content-between align-items-center">
        <h3 class="card-title">Unlock Messages</h3>
        <a href="?section=messages&action=add" class="btn btn-success">Add New Message</a>
    </div>
    <div class="card-body">
        <?php if ($action === 'add' || $action === 'edit'): ?>
            <!-- Add/Edit Unlock Message Form -->
            <form method="post" action="?section=messages">
                <input type="hidden" name="id" value="<?php echo $edit_data['id'] ?? ''; ?>">
                
                <div class="mb-3">
                    <label for="message_code" class="form-label">Message Code</label>
                    <input type="text" class="form-control" id="message_code" name="message_code" value="<?php echo $edit_data['message_code'] ?? ''; ?>" required>
                    <div class="form-text">Unique code for identifying this message (e.g., intro_completed)</div>
                </div>
                
                <div class="mb-3">
                    <label for="title" class="form-label">Title</label>
                    <input type="text" class="form-control" id="title" name="title" value="<?php echo $edit_data['title'] ?? ''; ?>" required>
                </div>
                
                <div class="mb-3">
                    <label for="message" class="form-label">Message</label>
                    <textarea class="form-control" id="message" name="message" rows="5"><?php echo $edit_data['message'] ?? ''; ?></textarea>
                </div>
                
                <button type="submit" name="save_message" class="btn btn-primary">Save Message</button>
                <a href="?section=messages" class="btn btn-secondary">Cancel</a>
            </form>
        <?php else: ?>
            <!-- Unlock Message List -->
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Code</th>
                        <th>Title</th>
                        <th>Message</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($messages as $msg): ?>
                    <tr>
                        <td><?php echo $msg['id']; ?></td>
                        <td><?php echo $msg['message_code']; ?></td>
                        <td><?php echo $msg['title']; ?></td>
                        <td><?php echo strlen($msg['message']) > 50 ? substr($msg['message'], 0, 50) . '...' : $msg['message']; ?></td>
                        <td>
                            <a href="?section=messages&action=edit&id=<?php echo $msg['id']; ?>" class="btn btn-sm btn-primary">Edit</a>
                            <a href="?section=messages&action=delete&id=<?php echo $msg['id']; ?>" class="btn btn-sm btn-danger" onclick="return confirm('Are you sure you want to delete this message?')">Delete</a>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>
</div>